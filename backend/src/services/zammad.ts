import 'dotenv/config';

interface ZammadOrganization {
  id: number;
  name: string;
  active: boolean;
  created_at: string;
  updated_at: string;
}

interface ZammadTicket {
  id: number;
  organization_id: number;
  time_unit: string; // Contains minutes as string
  created_at: string;
}

interface ZammadTicketResponse {
  assets?: {
    Ticket?: Record<string, ZammadTicket>;
  };
  tickets?: number[];
}

export class ZammadService {
  private baseUrl: string;
  private token: string;

  constructor() {
    const zammadUrl = process.env.ZAMMAD_URL;
    const zammadToken = process.env.ZAMMAD_TOKEN;

    if (!zammadUrl || !zammadToken) {
      throw new Error('Missing Zammad configuration');
    }

    this.baseUrl = zammadUrl.replace(/\/$/, '');
    this.token = zammadToken;
  }

  private async fetch<T>(endpoint: string): Promise<T> {
    endpoint = endpoint.replace(/^\//, '');
    const apiPrefix = this.baseUrl.includes('/api/v1') ? '' : '/api/v1/';
    const url = `${this.baseUrl}${apiPrefix}${endpoint}`;

    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Token token=${this.token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Zammad API error: ${response.statusText} - ${errorText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Zammad API request failed:', error instanceof Error ? error.message : 'Unknown error');
      throw error;
    }
  }

  async getOrganizations(): Promise<ZammadOrganization[]> {
    try {
      const orgs = await this.fetch<ZammadOrganization[]>('organizations');
      return Array.isArray(orgs) ? orgs : [];
    } catch (error) {
      console.error('Error fetching organizations:', error);
      return [];
    }
  }

  async getTicketsForOrganization(organizationId: number): Promise<ZammadTicket[]> {
    try {
      const response = await this.fetch<ZammadTicketResponse>(`tickets/search?query=organization_id:${organizationId} AND time_unit:*`);
      
      if (response.assets?.Ticket) {
        return Object.values(response.assets.Ticket);
      }
      
      if (Array.isArray(response)) {
        return response;
      }

      return [];
    } catch (error) {
      console.error(`Error fetching tickets for organization ${organizationId}:`, error);
      return [];
    }
  }

  async getMonthlyTracking(organizationId: number) {
    try {
      const tickets = await this.getTicketsForOrganization(organizationId);
      const monthlyTotals = new Map<string, number>();

      const now = new Date();
      const currentYear = now.getFullYear();
      const currentMonth = now.getMonth();

      for (let i = 0; i < 12; i++) {
        let year = currentYear;
        let month = currentMonth - i;

        if (month < 0) {
          month = 12 + month;
          year = currentYear - 1;
        }

        const key = `${year}-${String(month + 1).padStart(2, '0')}`;
        monthlyTotals.set(key, 0);
      }

      tickets.forEach(ticket => {
        const minutes = parseInt(ticket.time_unit || '0', 10);
        if (!isNaN(minutes) && minutes > 0) {
          const date = new Date(ticket.created_at);
          const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
          if (monthlyTotals.has(key)) {
            const current = monthlyTotals.get(key) || 0;
            monthlyTotals.set(key, current + minutes);
          }
        }
      });

      return Array.from(monthlyTotals.entries())
        .map(([month, minutes]) => ({
          month,
          minutes
        }))
        .sort((a, b) => {
          const [yearA, monthA] = a.month.split('-').map(Number);
          const [yearB, monthB] = b.month.split('-').map(Number);
          if (yearA !== yearB) return yearB - yearA;
          return monthB - monthA;
        });
    } catch (error) {
      console.error(`Error getting monthly tracking for organization ${organizationId}:`, error);
      return [];
    }
  }

  async getOrganizationBudgetInfo() {
    try {
      const organizations = await this.getOrganizations();
      const budgetInfo = await Promise.all(
        organizations.map(async (org) => {
          const tickets = await this.getTicketsForOrganization(org.id);
          const trackedMinutes = tickets.reduce((total, ticket) => {
            const minutes = parseInt(ticket.time_unit || '0', 10);
            return total + (isNaN(minutes) ? 0 : minutes);
          }, 0);

          return {
            id: org.id,
            name: org.name,
            totalBudget: 0,
            trackedMinutes
          };
        })
      );

      return budgetInfo;
    } catch (error) {
      console.error('Error getting organization budget info:', error);
      return [];
    }
  }
}