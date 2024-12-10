import { serve } from '@hono/node-server';
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { prettyJSON } from 'hono/pretty-json';
import { sign } from 'hono/jwt';
import { jwt } from 'hono/jwt';
import { getCookie, setCookie, deleteCookie } from 'hono/cookie';
import { ZammadService } from './services/zammad.js';
import { BudgetService } from './services/budget.js';
import 'dotenv/config';

// Debug levels
type LogLevel = 'debug' | 'info' | 'warn' | 'error';
const LOG_LEVEL = (process.env.DEBUG_LVL || 'debug') as LogLevel;

const debugLog = {
  debug: (...args: any[]) => LOG_LEVEL === 'debug' && console.log('[DEBUG]', ...args),
  info: (...args: any[]) => ['debug', 'info'].includes(LOG_LEVEL) && console.log('[INFO]', ...args),
  warn: (...args: any[]) => ['debug', 'info', 'warn'].includes(LOG_LEVEL) && console.warn('[WARN]', ...args),
  error: (...args: any[]) => console.error('[ERROR]', ...args)
};

// Log environment variables
debugLog.info('Environment Variables:');
debugLog.info('NODE_ENV:', process.env.NODE_ENV);
debugLog.info('PORT:', process.env.PORT);
debugLog.info('ZAMMAD_URL:', process.env.ZAMMAD_URL);
debugLog.debug('APP_PASSWORD is set:', !!process.env.APP_PASSWORD);
debugLog.debug('JWT_SECRET is set:', !!process.env.JWT_SECRET);
debugLog.debug('DATABASE_URL:', process.env.DATABASE_URL);

const app = new Hono();
const zammadService = new ZammadService();
const budgetService = new BudgetService();

// Request logging middleware
app.use('*', async (c, next) => {
  const start = Date.now();
  debugLog.debug('Incoming request:', {
    method: c.req.method,
    path: c.req.path,
    url: c.req.url,
    headers: Object.fromEntries(c.req.headers.entries())
  });
  await next();
  const end = Date.now();
  debugLog.debug('Request completed:', {
    method: c.req.method,
    path: c.req.path,
    status: c.res.status,
    duration: `${end - start}ms`
  });
});

// Middleware
app.use('*', logger());
app.use('*', prettyJSON());
app.use('*', cors({
  origin: ['http://localhost:5173', 'http://localhost:80', 'http://localhost', 'http://localhost:8071'],
  credentials: true,
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization', 'Accept', 'Cookie', 'Cache-Control'],
  exposeHeaders: ['Set-Cookie', 'Authorization'],
  maxAge: 600
}));

// Authentication
const APP_PASSWORD = process.env.APP_PASSWORD || 'admin';
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const isProduction = process.env.NODE_ENV === 'production';

// Login endpoint
app.post('/login', async (c) => {
  try {
    debugLog.debug('Login attempt received');
    const body = await c.req.json();
    debugLog.debug('Request body:', body);
    const { password } = body;

    debugLog.debug('Comparing passwords:', {
      received: password,
      expected: APP_PASSWORD,
      matches: password === APP_PASSWORD
    });

    if (password !== APP_PASSWORD) {
      debugLog.warn('Invalid password attempt');
      return c.json({ error: 'Invalid password' }, 401);
    }

    // Create JWT token
    const token = await sign({ authenticated: true }, JWT_SECRET);
    
    // Set cookie with environment-aware settings
    setCookie(c, 'auth', token, {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? 'Strict' : 'Lax',
      path: '/',
      maxAge: 60 * 60 * 24 // 24 hours
    });

    // Set Authorization header
    c.header('Authorization', `Bearer ${token}`);

    debugLog.info('Login successful');
    return c.json({ token });
  } catch (error) {
    debugLog.error('Login error:', error);
    return c.json({ error: 'Invalid request' }, 400);
  }
});

// Logout endpoint
app.post('/logout', (c) => {
  debugLog.info('Logout request received');
  deleteCookie(c, 'auth', {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'Strict' : 'Lax',
    path: '/'
  });
  return c.json({ success: true });
});

// Protected routes middleware
const auth = jwt({
  secret: JWT_SECRET,
  cookie: 'auth'
});

// Health check endpoint (unprotected)
app.get('/health', (c) => {
  debugLog.debug('Health check requested');
  return c.json({
    status: 'ok',
    timestamp: new Date().toISOString()
  });
});

// Protected routes
app.use('/organizations/*', auth);

// Organizations endpoints
app.get('/organizations', async (c) => {
  try {
    debugLog.debug('Fetching organizations');
    const orgs = await budgetService.getAllOrganizations();
    return c.json(orgs);
  } catch (error) {
    debugLog.error('Error fetching organizations:', error);
    return c.json({ error: 'Failed to fetch organizations' }, 500);
  }
});

app.get('/organizations/:id', async (c) => {
  try {
    const id = parseInt(c.req.param('id'));
    debugLog.debug('Fetching organization details for ID:', id);
    const details = await budgetService.getOrganizationDetails(id);
    return c.json(details);
  } catch (error) {
    debugLog.error('Error fetching organization details:', error);
    return c.json({ error: 'Failed to fetch organization details' }, 500);
  }
});

app.get('/organizations/:id/budget-history', async (c) => {
  try {
    const id = parseInt(c.req.param('id'));
    debugLog.debug('Fetching budget history for organization ID:', id);
    const org = await budgetService.getBudgetForOrganization(id);
    return c.json(org.budgetHistory || []);
  } catch (error) {
    debugLog.error('Error fetching budget history:', error);
    return c.json({ error: 'Failed to fetch budget history' }, 500);
  }
});

app.get('/organizations/:id/monthly-tracking', async (c) => {
  try {
    const id = parseInt(c.req.param('id'));
    debugLog.debug('Fetching monthly tracking for organization ID:', id);
    const monthlyTracking = await budgetService.getMonthlyBudgetHistory(id);
    return c.json(monthlyTracking);
  } catch (error) {
    debugLog.error('Error fetching monthly tracking:', error);
    return c.json({ error: 'Failed to fetch monthly tracking' }, 500);
  }
});

app.post('/organizations/:id/budget', async (c) => {
  try {
    const id = parseInt(c.req.param('id'));
    const { minutes, description } = await c.req.json<{ minutes: number; description: string }>();

    debugLog.debug('Adding budget history for organization ID:', id, { minutes, description });

    // Add budget history entry
    await budgetService.addBudgetHistory(id, minutes, description);

    // Get current budget and update total
    const org = await budgetService.getBudgetForOrganization(id);
    const newTotal = org.totalBudget + minutes;
    
    // Update total budget
    await budgetService.updateOrganizationBudget(id, newTotal);

    // Return updated organization details
    const updatedOrg = await budgetService.getOrganizationDetails(id);
    return c.json(updatedOrg);
  } catch (error) {
    debugLog.error('Error updating budget:', error);
    return c.json({ error: 'Failed to update budget' }, 500);
  }
});

const port = parseInt(process.env.PORT || '3000', 10);

debugLog.info(`Server is starting on port ${port}...`);

serve({
  fetch: app.fetch,
  port
});