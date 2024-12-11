import { serve } from '@hono/node-server';
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { prettyJSON } from 'hono/pretty-json';
import { sign } from 'hono/jwt';
import { jwt } from 'hono/jwt';
import { ZammadService } from './services/zammad.js';
import { BudgetService } from './services/budget.js';
import 'dotenv/config';

// Define environment type
type Env = {
  JWT_SECRET: string;
};

const app = new Hono<{ Bindings: Env }>();
const zammadService = new ZammadService();
const budgetService = new BudgetService();

// Custom logging middleware
app.use('*', async (c, next) => {
  console.log(`[${new Date().toISOString()}] ${c.req.method} ${c.req.url}`);
  try {
    if (c.req.method === 'POST') {
      const body = await c.req.json();
      console.log('Request body:', body);
    }
  } catch (e) {
    // Ignore body parsing errors
  }
  await next();
  console.log(`[${new Date().toISOString()}] Response status: ${c.res.status}`);
});

// Middleware
app.use('*', logger());
app.use('*', prettyJSON());
app.use('*', cors({
  origin: ['*'],  // Allow all origins in development
  credentials: true,
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization', 'Accept'],
  exposeHeaders: ['Set-Cookie'],
  maxAge: 86400,
}));

// Authentication
const APP_PASSWORD = process.env.APP_PASSWORD || 'admin';
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// Login endpoint
app.post('/api/login', async (c) => {
  console.log('Login attempt received');
  try {
    const { password } = await c.req.json<{ password: string }>();
    console.log('Received password attempt');

    if (password !== APP_PASSWORD) {
      console.log('Invalid password attempt');
      return c.json({ error: 'Invalid password' }, 401);
    }

    console.log('Password validated, generating token');
    const token = await sign({ authenticated: true }, JWT_SECRET);
    
    console.log('Setting auth cookie');
    c.header('Set-Cookie', `auth=${token}; HttpOnly; Path=/; SameSite=Lax`);

    console.log('Login successful');
    return c.json({ success: true });
  } catch (error) {
    console.error('Login error:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// Logout endpoint
app.post('/api/logout', (c) => {
  console.log('Logout request received');
  c.header('Set-Cookie', 'auth=; HttpOnly; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT');
  return c.json({ success: true });
});

// Protected routes middleware
app.use('/api/*', jwt({
  secret: JWT_SECRET,
  cookie: 'auth'
}));

// Health check endpoint (unprotected)
app.get('/health', (c) => {
  return c.json({
    status: 'ok',
    timestamp: new Date().toISOString()
  });
});

// Protected routes
app.get('/api/organizations', async (c) => {
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

app.get('/api/organizations/:id', async (c) => {
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

app.get('/api/organizations/:id/budget-history', async (c) => {
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

app.get('/api/organizations/:id/monthly-tracking', async (c) => {
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

app.post('/api/organizations/:id/budget', async (c) => {
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

const port = parseInt(process.env.PORT || '3000', 10);

console.log(`Server is starting on port ${port}...`);

serve({
  fetch: app.fetch,
  port
});