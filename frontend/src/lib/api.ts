import { z } from 'zod';

const API_URL = '/api'; // Use relative path for API requests
const API_TIMEOUT = 10000; // 10 seconds

// API Response Types
const OrganizationType = z.object({
  id: z.number(),
  name: z.string(),
  totalBudget: z.number(),
  trackedMinutes: z.number(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

const BudgetHistoryType = z.object({
  id: z.number(),
  organizationId: z.number(),
  minutes: z.number(),
  description: z.string().nullable(),
  createdAt: z.string(),
});

const MonthlyTrackingType = z.object({
  month: z.string(),
  minutes: z.number(),
});

const LoginResponseType = z.object({
  token: z.string(),
}).or(z.object({
  error: z.string()
}));

export type Organization = z.infer<typeof OrganizationType>;
export type BudgetHistory = z.infer<typeof BudgetHistoryType>;
export type MonthlyTracking = z.infer<typeof MonthlyTrackingType>;

// Helper function to handle API responses
async function handleResponse<T>(response: Response, schema: z.ZodType<T>): Promise<T> {
  if (!response.ok) {
    const errorData = await response.json().catch(() => null);
    console.error('API Error:', {
      status: response.status,
      statusText: response.statusText,
      error: errorData
    });
    throw new Error(errorData?.error || response.statusText || 'An error occurred');
  }

  const data = await response.json();
  console.log('API Response:', data);
  return schema.parse(data);
}

// Helper function to create a request with timeout
async function fetchWithTimeout(url: string, options: RequestInit = {}): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT);

  try {
    console.log('Making request to:', url, {
      method: options.method,
      headers: options.headers
    });
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    console.log('Response status:', response.status);
    return response;
  } finally {
    clearTimeout(timeoutId);
  }
}

export async function login(password: string): Promise<void> {
  try {
    console.log('Attempting login...');
    const response = await fetchWithTimeout(`${API_URL}/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Cache-Control': 'no-cache'
      },
      body: JSON.stringify({ password }),
      credentials: 'include',
    });

    console.log('Login response status:', response.status);
    const data = await handleResponse(response, LoginResponseType);
    
    if ('error' in data) {
      console.error('Login error:', data.error);
      throw new Error(data.error);
    }

    console.log('Login successful');
    // Store the token in localStorage for debugging purposes
    if (data.token && import.meta.env.DEV) {
      localStorage.setItem('debug_token', data.token);
    }
  } catch (error) {
    console.error('Login error:', error);
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error('Login request timed out');
    }
    throw error;
  }
}

export async function logout(): Promise<void> {
  try {
    await fetchWithTimeout(`${API_URL}/logout`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Cache-Control': 'no-cache'
      }
    });
    
    // Clear debug token
    localStorage.removeItem('debug_token');
  } catch (error) {
    console.error('Logout error:', error);
    // We don't throw here since we want to clear the auth state regardless
  }
}

export async function getOrganizations(): Promise<Organization[]> {
  const response = await fetchWithTimeout(`${API_URL}/organizations`, {
    credentials: 'include',
    headers: {
      'Accept': 'application/json',
      'Cache-Control': 'no-cache'
    }
  });

  return handleResponse(response, z.array(OrganizationType));
}

export async function getOrganization(id: string): Promise<Organization> {
  const response = await fetchWithTimeout(`${API_URL}/organizations/${id}`, {
    credentials: 'include',
    headers: {
      'Accept': 'application/json',
      'Cache-Control': 'no-cache'
    }
  });

  return handleResponse(response, OrganizationType);
}

export async function getBudgetHistory(organizationId: string): Promise<BudgetHistory[]> {
  const response = await fetchWithTimeout(`${API_URL}/organizations/${organizationId}/budget-history`, {
    credentials: 'include',
    headers: {
      'Accept': 'application/json',
      'Cache-Control': 'no-cache'
    }
  });

  return handleResponse(response, z.array(BudgetHistoryType));
}

export async function getMonthlyTracking(organizationId: string): Promise<MonthlyTracking[]> {
  const response = await fetchWithTimeout(`${API_URL}/organizations/${organizationId}/monthly-tracking`, {
    credentials: 'include',
    headers: {
      'Accept': 'application/json',
      'Cache-Control': 'no-cache'
    }
  });

  return handleResponse(response, z.array(MonthlyTrackingType));
}

export async function updateOrganizationBudget(
  organizationId: string | number,
  minutes: number,
  description: string
): Promise<Organization> {
  const response = await fetchWithTimeout(`${API_URL}/organizations/${organizationId}/budget`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'Cache-Control': 'no-cache'
    },
    body: JSON.stringify({ minutes, description }),
    credentials: 'include',
  });

  return handleResponse(response, OrganizationType);
}