import { serve } from '@hono/node-server';
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { prettyJSON } from 'hono/pretty-json';
import { sign, verify } from 'hono/jwt';
import { getCookie, setCookie, deleteCookie } from 'hono/cookie';
import { ZammadService } from './services/zammad.js';
import { BudgetService } from './services/budget.js';
import 'dotenv/config';
import { createHash, randomBytes } from 'crypto';

// Define environment type
type Env = {
  JWT_SECRET: string;
};

// Define cookie options type
interface CookieSettings {
  httpOnly?: boolean;
  secure?: boolean;
  sameSite?: 'Lax' | 'Strict' | 'None';
  path?: string;
  maxAge?: number;
  domain?: string;
}

const app = new Hono<{ Bindings: Env }>();
const zammadService = new ZammadService();
const budgetService = new BudgetService();

// Environment configuration
const isDev = process.env.NODE_ENV !== 'production';
const APP_PASSWORD = process.env.APP_PASSWORD || 'admin';
const JWT_SECRET = process.env.JWT_SECRET || (isDev ? 'development-secret' : '');
const CORS_ALLOWED_ORIGINS = process.env.CORS_ALLOWED_ORIGINS?.split(',') || [
  'http://localhost:5173',    // Vite dev server
  'http://localhost:8071',    // Production port
  'http://localhost:3071',    // Development API port
  'http://127.0.0.1:5173',
  'http://127.0.0.1:8071',
  'http://127.0.0.1:3071'
];

if (!JWT_SECRET) {
  console.error('JWT_SECRET is required in production');
  process.exit(1);
}

// Enhanced logging middleware
app.use('*', async (c, next) => {
  const requestId = randomBytes(4).toString('hex');
  console.log(`[${requestId}] [${new Date().toISOString()}] ${c.req.method} ${c.req.url}`);
  console.log(`[${requestId}] Headers:`, Object.fromEntries(c.req.raw.headers.entries()));
  console.log(`[${requestId}] Origin:`, c.req.header('origin'));
  
  try {
    if (c.req.method === 'POST') {
      const clonedReq = c.req.raw.clone();
      const body = await clonedReq.json();
      console.log(`[${requestId}] Request body:`, body);
    }
  } catch (e) {
    console.log(`[${requestId}] Could not parse request body`);
  }

  await next();
  console.log(`[${requestId}] Response status: ${c.res.status}`);
});

// Middleware
app.use('*', logger());
app.use('*', prettyJSON());

// CORS configuration
app.use('*', cors({
  origin: (origin) => {
    console.log('Request origin:', origin);
    if (!origin) {
      console.log('No origin header present');
      return CORS_ALLOWED_ORIGINS[0];
    }

    if (isDev) {
      console.log('Development mode: allowing origin', origin);
      return origin;
    }

    // In production, check against configured allowed origins
    const isAllowed = CORS_ALLOWED_ORIGINS.some(allowed => {
      // Allow exact matches and subdomain matches
      return origin === allowed || origin.endsWith('.' + allowed.replace(/^https?:\/\//, ''));
    });

    console.log(`Origin ${origin} ${isAllowed ? 'is' : 'is not'} allowed`);
    return isAllowed ? origin : CORS_ALLOWED_ORIGINS[0];
  },
  credentials: true,
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization', 'Accept', 'Cookie', 'X-CSRF-Token'],
  exposeHeaders: ['Set-Cookie', 'X-CSRF-Token'],
  maxAge: 86400,
}));

// Generate CSRF token
const generateCSRFToken = () => {
  return randomBytes(32).toString('hex');
};

// Verify CSRF token
const verifyCSRFToken = (requestToken: string | null, sessionToken: string | null) => {
  return requestToken && sessionToken && requestToken === sessionToken;
};

// Get cookie domain
const getCookieDomain = (c: any): string | undefined => {
  const host = c.req.header('host');
  if (!host) return undefined;

  // For localhost or development
  if (isDev || host.includes('localhost') || host.includes('127.0.0.1')) {
    return undefined;
  }

  // For production, use the host without port
  const domain = host.split(':')[0];
  
  // If it's an IP address, don't set domain
  if (/^(?:[0-9]{1,3}\.){3}[0-9]{1,3}$/.test(domain)) {
    return undefined;
  }

  return domain;
};

// Health check endpoint (unprotected)
app.get('/health', (c) => {
  return c.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    version: process.env.npm_package_version || '1.0.0'
  });
});

// Auth middleware
async function authMiddleware(c: any, next: any) {
  console.log('Checking authentication');
  const authCookie = getCookie(c, 'auth') || null;
  const csrfCookie = getCookie(c, 'csrf') || null;
  const csrfHeader = c.req.header('X-CSRF-Token') || null;

  if (!authCookie) {
    console.log('No auth cookie found');
    return c.json({ error: 'Unauthorized' }, 401);
  }

  try {
    const payload = await verify(authCookie, JWT_SECRET);
    
    // For non-GET requests, verify CSRF token
    if (c.req.method !== 'GET') {
      if (!verifyCSRFToken(csrfHeader, csrfCookie)) {
        console.log('CSRF token verification failed');
        console.log('Header token:', csrfHeader);
        console.log('Cookie token:', csrfCookie);
        return c.json({ error: 'Invalid CSRF token' }, 403);
      }
    }

    c.set('user', payload);
    await next();
  } catch (error) {
    console.error('Token verification failed:', error);
    return c.json({ error: 'Invalid token' }, 401);
  }
}

// Create API router
const api = new Hono();

// Login endpoint (unprotected)
api.post('/login', async (c) => {
  console.log('Login attempt received');
  try {
    const { password } = await c.req.json<{ password: string }>();
    console.log('Received password attempt');

    if (password !== APP_PASSWORD) {
      console.log('Invalid password attempt');
      return c.json({ error: 'Invalid password' }, 401);
    }

    console.log('Password validated, generating tokens');
    
    // Generate tokens
    const csrfToken = generateCSRFToken();
    const jwtToken = await sign({ 
      authenticated: true,
      csrf: csrfToken,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + (60 * 60 * 24) // 24 hours
    }, JWT_SECRET);

    const domain = getCookieDomain(c);
    console.log('Setting cookies for domain:', domain);

    // Set cookie options
    const cookieOptions: CookieSettings = {
      httpOnly: true,
      secure: !isDev,
      sameSite: isDev ? 'Lax' : 'Strict',
      path: '/',
      maxAge: 60 * 60 * 24, // 24 hours
      domain
    };

    // Set cookies
    setCookie(c, 'auth', jwtToken, cookieOptions);
    setCookie(c, 'csrf', csrfToken, { ...cookieOptions, httpOnly: false });

    console.log('Login successful, tokens set');
    return c.json({ 
      success: true,
      csrfToken 
    });
  } catch (error) {
    console.error('Login error:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// Logout endpoint (unprotected)
api.post('/logout', (c) => {
  console.log('Logout request received');
  const domain = getCookieDomain(c);
  const cookieOptions: CookieSettings = {
    path: '/',
    domain,
    secure: !isDev,
    sameSite: isDev ? 'Lax' : 'Strict'
  };
  
  deleteCookie(c, 'auth', cookieOptions);
  deleteCookie(c, 'csrf', cookieOptions);
  return c.json({ success: true });
});

// Organizations routes
const orgsRouter = new Hono();

orgsRouter.get('/', async (c) => {
  console.log('Fetching organizations');
  try {
    const orgs = await budgetService.getAllOrganizations();
    console.log('Organizations fetched:', orgs.length);
    return c.json(orgs);
  } catch (error) {
    console.error('Error fetching organizations:', error);
    return c.json({ error: 'Failed to fetch organizations' }, 500);
  }
});

orgsRouter.get('/:id', async (c) => {
  const id = parseInt(c.req.param('id'));
  console.log(`Fetching organization details for ID: ${id}`);
  try {
    const details = await budgetService.getOrganizationDetails(id);
    return c.json(details);
  } catch (error) {
    console.error('Error fetching organization details:', error);
    return c.json({ error: 'Failed to fetch organization details' }, 500);
  }
});

orgsRouter.get('/:id/budget-history', async (c) => {
  const id = parseInt(c.req.param('id'));
  console.log(`Fetching budget history for organization ID: ${id}`);
  try {
    const org = await budgetService.getBudgetForOrganization(id);
    return c.json(org.budgetHistory || []);
  } catch (error) {
    console.error('Error fetching budget history:', error);
    return c.json({ error: 'Failed to fetch budget history' }, 500);
  }
});

orgsRouter.get('/:id/monthly-tracking', async (c) => {
  const id = parseInt(c.req.param('id'));
  console.log(`Fetching monthly tracking for organization ID: ${id}`);
  try {
    const monthlyTracking = await budgetService.getMonthlyBudgetHistory(id);
    return c.json(monthlyTracking);
  } catch (error) {
    console.error('Error fetching monthly tracking:', error);
    return c.json({ error: 'Failed to fetch monthly tracking' }, 500);
  }
});

orgsRouter.post('/:id/budget', async (c) => {
  const id = parseInt(c.req.param('id'));
  console.log(`Updating budget for organization ID: ${id}`);
  try {
    const { minutes, description } = await c.req.json<{ minutes: number; description: string }>();
    console.log('Budget update details:', { minutes, description });

    // Add budget history entry
    await budgetService.addBudgetHistory(id, minutes, description);

    // Get current budget and update total
    const org = await budgetService.getBudgetForOrganization(id);
    const newTotal = org.totalBudget + minutes;
    
    // Update total budget
    await budgetService.updateOrganizationBudget(id, newTotal);

    // Return updated organization details
    const updatedOrg = await budgetService.getOrganizationDetails(id);
    console.log('Budget updated successfully');
    return c.json(updatedOrg);
  } catch (error) {
    console.error('Error updating budget:', error);
    return c.json({ error: 'Failed to update budget' }, 500);
  }
});

// Apply auth middleware to protected routes
api.use('/organizations/*', authMiddleware);
api.route('/organizations', orgsRouter);

// Mount the API routes under /api
app.route('/api', api);

const port = parseInt(process.env.PORT || '3000', 10);

console.log(`Server is starting on port ${port}...`);
console.log('Environment:', process.env.NODE_ENV);
console.log('Allowed origins:', CORS_ALLOWED_ORIGINS);
console.log('JWT Secret length:', JWT_SECRET.length);
console.log('Database URL:', process.env.DATABASE_URL);

serve({
  fetch: app.fetch,
  port
});