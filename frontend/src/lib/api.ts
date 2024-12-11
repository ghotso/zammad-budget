export interface Organization {
  id: number;
  name: string;
  totalBudget: number;
  trackedMinutes: number;
  createdAt: string;
  updatedAt: string;
  budgetHistory: BudgetHistoryEntry[];
}

export interface BudgetHistoryEntry {
  id: number;
  organizationId: number;
  minutes: number;
  description: string | null;
  createdAt: string;
}

export interface MonthlyTracking {
  month: string;
  minutes: number;
}

// Use environment variable for API URL with fallback
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

// CSRF token storage
let csrfToken: string | null = null;

// Set CSRF token
export const setCSRFToken = (token: string) => {
  csrfToken = token;
  console.log('CSRF token set');
};

// Clear CSRF token
export const clearCSRFToken = () => {
  csrfToken = null;
  console.log('CSRF token cleared');
};

// Get stored CSRF token
export const getCSRFToken = () => csrfToken;

// Base fetch with CSRF handling
const fetchWithCSRF = async (url: string, options: RequestInit = {}) => {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {}),
  };

  // Add CSRF token for non-GET requests
  if (options.method && options.method !== 'GET' && csrfToken) {
    headers['X-CSRF-Token'] = csrfToken;
  }

  const response = await fetch(url, {
    ...options,
    headers,
    credentials: 'include',
  });

  if (response.status === 401) {
    clearCSRFToken();
    throw new Error('Unauthorized');
  }

  if (response.status === 403) {
    throw new Error('Invalid CSRF token');
  }

  return response;
};

export async function login(password: string): Promise<void> {
  const response = await fetchWithCSRF(`${API_URL}/api/login`, {
    method: 'POST',
    body: JSON.stringify({ password }),
  });

  if (!response.ok) {
    throw new Error('Invalid password');
  }

  const data = await response.json();
  if (!data.success) {
    throw new Error('Login failed');
  }

  // Store CSRF token from successful login
  if (data.csrfToken) {
    setCSRFToken(data.csrfToken);
  }
}

export async function logout(): Promise<void> {
  try {
    const response = await fetchWithCSRF(`${API_URL}/api/logout`, {
      method: 'POST',
    });

    if (!response.ok) {
      throw new Error('Logout failed');
    }
  } finally {
    clearCSRFToken();
  }
}

export async function checkAuth(): Promise<boolean> {
  try {
    const response = await fetchWithCSRF(`${API_URL}/api/organizations`);
    return response.ok;
  } catch {
    clearCSRFToken();
    return false;
  }
}

export async function getOrganizations(): Promise<Organization[]> {
  const response = await fetchWithCSRF(`${API_URL}/api/organizations`);

  if (!response.ok) {
    throw new Error('Failed to fetch organizations');
  }

  return response.json();
}

export async function getOrganization(id: string): Promise<Organization> {
  const response = await fetchWithCSRF(`${API_URL}/api/organizations/${id}`);

  if (!response.ok) {
    throw new Error('Failed to fetch organization');
  }

  return response.json();
}

export async function getBudgetHistory(organizationId: string): Promise<BudgetHistoryEntry[]> {
  const response = await fetchWithCSRF(`${API_URL}/api/organizations/${organizationId}/budget-history`);

  if (!response.ok) {
    throw new Error('Failed to fetch budget history');
  }

  return response.json();
}

export async function getMonthlyTracking(organizationId: string): Promise<MonthlyTracking[]> {
  const response = await fetchWithCSRF(`${API_URL}/api/organizations/${organizationId}/monthly-tracking`);

  if (!response.ok) {
    throw new Error('Failed to fetch monthly tracking');
  }

  return response.json();
}

export async function addBudget(organizationId: string, minutes: number, description: string): Promise<Organization> {
  const response = await fetchWithCSRF(`${API_URL}/api/organizations/${organizationId}/budget`, {
    method: 'POST',
    body: JSON.stringify({ minutes, description }),
  });

  if (!response.ok) {
    throw new Error('Failed to add budget');
  }

  return response.json();
}

// Alias for addBudget to maintain compatibility
export const updateOrganizationBudget = addBudget;