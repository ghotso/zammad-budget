const API_URL = '/api';

export async function login(password: string): Promise<void> {
  const response = await fetch(`${API_URL}/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ password }),
    credentials: 'include',
  });

  if (!response.ok) {
    throw new Error('Invalid password');
  }

  const data = await response.json();
  if (!data.success) {
    throw new Error('Login failed');
  }
}

export async function logout(): Promise<void> {
  const response = await fetch(`${API_URL}/logout`, {
    method: 'POST',
    credentials: 'include',
  });

  if (!response.ok) {
    throw new Error('Logout failed');
  }
}

export async function checkAuth(): Promise<boolean> {
  try {
    const response = await fetch(`${API_URL}/organizations`, {
      credentials: 'include',
    });
    return response.ok;
  } catch {
    return false;
  }
}

export async function getOrganizations() {
  const response = await fetch(`${API_URL}/organizations`, {
    credentials: 'include',
  });

  if (!response.ok) {
    throw new Error('Failed to fetch organizations');
  }

  return response.json();
}

export async function getOrganization(id: string) {
  const response = await fetch(`${API_URL}/organizations/${id}`, {
    credentials: 'include',
  });

  if (!response.ok) {
    throw new Error('Failed to fetch organization');
  }

  return response.json();
}

export async function getBudgetHistory(organizationId: string) {
  const response = await fetch(`${API_URL}/organizations/${organizationId}/budget-history`, {
    credentials: 'include',
  });

  if (!response.ok) {
    throw new Error('Failed to fetch budget history');
  }

  return response.json();
}

export async function getMonthlyTracking(organizationId: string) {
  const response = await fetch(`${API_URL}/organizations/${organizationId}/monthly-tracking`, {
    credentials: 'include',
  });

  if (!response.ok) {
    throw new Error('Failed to fetch monthly tracking');
  }

  return response.json();
}

export async function addBudget(organizationId: string, minutes: number, description: string) {
  const response = await fetch(`${API_URL}/organizations/${organizationId}/budget`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ minutes, description }),
    credentials: 'include',
  });

  if (!response.ok) {
    throw new Error('Failed to add budget');
  }

  return response.json();
}