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

// Middleware
app.use('*', logger());
app.use('*', prettyJSON());
app.use('*', cors({
  origin: ['http://localhost:5173', 'http://localhost:80', 'http://localhost'],
  credentials: true,
}));

// Authentication
const APP_PASSWORD = process.env.APP_PASSWORD || 'admin';
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// Login endpoint
app.post('/api/login', async (c) => {
  const { password } = await c.req.json<{ password: string }>();

  if (password !== APP_PASSWORD) {
    return c.json({ error: 'Invalid password' }, 401);
  }

  const token = await sign({ authenticated: true }, JWT_SECRET);
  
  c.header('Set-Cookie', `auth=${token}; HttpOnly; Path=/; SameSite=Lax`);

  return c.json({ success: true });
});

// Logout endpoint
app.post('/api/logout', (c) => {
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
  try {
    const orgs = await budgetService.getAllOrganizations();
    return c.json(orgs);
  } catch (error) {
    console.error('Error fetching organizations:', error);
    return c.json({ error: 'Failed to fetch organizations' }, 500);
  }
});

app.get('/api/organizations/:id', async (c) => {
  try {
    const id = parseInt(c.req.param('id'));
    const details = await budgetService.getOrganizationDetails(id);
    return c.json(details);
  } catch (error) {
    console.error('Error fetching organization details:', error);
    return c.json({ error: 'Failed to fetch organization details' }, 500);
  }
});

app.get('/api/organizations/:id/budget-history', async (c) => {
  try {
    const id = parseInt(c.req.param('id'));
    const org = await budgetService.getBudgetForOrganization(id);
    return c.json(org.budgetHistory || []);
  } catch (error) {
    console.error('Error fetching budget history:', error);
    return c.json({ error: 'Failed to fetch budget history' }, 500);
  }
});

app.get('/api/organizations/:id/monthly-tracking', async (c) => {
  try {
    const id = parseInt(c.req.param('id'));
    const monthlyTracking = await budgetService.getMonthlyBudgetHistory(id);
    return c.json(monthlyTracking);
  } catch (error) {
    console.error('Error fetching monthly tracking:', error);
    return c.json({ error: 'Failed to fetch monthly tracking' }, 500);
  }
});

app.post('/api/organizations/:id/budget', async (c) => {
  try {
    const id = parseInt(c.req.param('id'));
    const { minutes, description } = await c.req.json<{ minutes: number; description: string }>();

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