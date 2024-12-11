import { PrismaClient } from '@prisma/client';
import { ZammadService } from './zammad.js';

interface ZammadOrgInfo {
  id: number;
  name: string;
  trackedMinutes: number;
}

interface MonthlyBudget {
  month: string;
  minutes: number;
}

interface BudgetHistory {
  id: number;
  organizationId: number;
  minutes: number;
  description: string | null;
  createdAt: Date;
}

interface Organization {
  id: number;
  name: string;
  totalBudget: number;
  createdAt: Date;
  updatedAt: Date;
}

interface OrganizationWithBudget extends Organization {
  budgetHistory: BudgetHistory[];
}

// Singleton pattern for PrismaClient
class PrismaClientSingleton {
  private static instance: PrismaClient | undefined;

  public static getInstance(): PrismaClient {
    if (!PrismaClientSingleton.instance) {
      PrismaClientSingleton.instance = new PrismaClient({
        log: ['error'],
        errorFormat: 'pretty'
      });
    }
    return PrismaClientSingleton.instance;
  }

  public static async disconnect(): Promise<void> {
    if (PrismaClientSingleton.instance) {
      await PrismaClientSingleton.instance.$disconnect();
      delete PrismaClientSingleton.instance;
    }
  }
}

// Handle cleanup on process termination
process.on('beforeExit', async () => {
  await PrismaClientSingleton.disconnect();
});

process.on('SIGINT', async () => {
  await PrismaClientSingleton.disconnect();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  await PrismaClientSingleton.disconnect();
  process.exit(0);
});

const zammadService = new ZammadService();

export class BudgetService {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = PrismaClientSingleton.getInstance();
  }

  async cleanup(): Promise<void> {
    await PrismaClientSingleton.disconnect();
  }

  async getAllOrganizations() {
    try {
      const zammadOrgs = await zammadService.getOrganizationBudgetInfo();
      
      const orgs = await Promise.all(
        zammadOrgs.map(async (org: ZammadOrgInfo) => {
          const localOrg = await this.getBudgetForOrganization(org.id);
          return {
            ...localOrg,
            name: org.name,
            trackedMinutes: org.trackedMinutes
          };
        })
      );

      return orgs;
    } catch (error) {
      console.error('Error getting all organizations:', error);
      throw error;
    }
  }

  async getBudgetForOrganization(organizationId: number): Promise<OrganizationWithBudget> {
    try {
      const budget = await this.prisma.$queryRaw<(OrganizationWithBudget & { budgetHistory: string })[]>`
        SELECT o.*, 
               (SELECT json_group_array(
                 json_object(
                   'id', bh.id,
                   'organizationId', bh.organizationId,
                   'minutes', bh.minutes,
                   'description', bh.description,
                   'createdAt', bh.createdAt
                 )
               )
               FROM budget_history bh
               WHERE bh.organizationId = o.id) as budgetHistory
        FROM organizations o
        WHERE o.id = ${organizationId}
      `;

      let org = budget[0];
      
      if (!org) {
        await this.prisma.$executeRaw`
          INSERT INTO organizations (id, name, totalBudget, createdAt, updatedAt)
          VALUES (${organizationId}, '', 0, datetime('now'), datetime('now'))
        `;
        
        return {
          id: organizationId,
          name: '',
          totalBudget: 0,
          createdAt: new Date(),
          updatedAt: new Date(),
          budgetHistory: []
        };
      }

      const parsedHistory = JSON.parse(org.budgetHistory || '[]') as BudgetHistory[];
      return {
        ...org,
        budgetHistory: parsedHistory.map(entry => ({
          ...entry,
          createdAt: new Date(entry.createdAt)
        }))
      };
    } catch (error) {
      console.error('Error in getBudgetForOrganization:', error);
      throw error;
    }
  }

  async addBudgetHistory(organizationId: number, minutes: number, description: string): Promise<BudgetHistory> {
    try {
      await this.getBudgetForOrganization(organizationId);

      const result = await this.prisma.$queryRaw<BudgetHistory[]>`
        INSERT INTO budget_history (organizationId, minutes, description, createdAt)
        VALUES (${organizationId}, ${minutes}, ${description}, datetime('now'))
        RETURNING *
      `;

      return {
        ...result[0],
        createdAt: new Date(result[0].createdAt)
      };
    } catch (error) {
      console.error('Error in addBudgetHistory:', error);
      throw error;
    }
  }

  async updateOrganizationBudget(organizationId: number, totalBudget: number): Promise<Organization> {
    try {
      await this.getBudgetForOrganization(organizationId);

      const result = await this.prisma.$queryRaw<Organization[]>`
        UPDATE organizations
        SET totalBudget = ${totalBudget},
            updatedAt = datetime('now')
        WHERE id = ${organizationId}
        RETURNING *
      `;

      return {
        ...result[0],
        createdAt: new Date(result[0].createdAt),
        updatedAt: new Date(result[0].updatedAt)
      };
    } catch (error) {
      console.error('Error in updateOrganizationBudget:', error);
      throw error;
    }
  }

  async getMonthlyBudgetHistory(organizationId: number): Promise<MonthlyBudget[]> {
    try {
      const zammadTracking = await zammadService.getMonthlyTracking(organizationId);

      const monthlyHistory = new Map<string, number>();
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
        monthlyHistory.set(key, 0);
      }

      zammadTracking.forEach((entry: MonthlyBudget) => {
        if (monthlyHistory.has(entry.month)) {
          monthlyHistory.set(entry.month, entry.minutes);
        }
      });

      return Array.from(monthlyHistory.entries())
        .map(([month, minutes]) => ({ month, minutes }))
        .sort((a, b) => b.month.localeCompare(a.month));
    } catch (error) {
      console.error('Error in getMonthlyBudgetHistory:', error);
      throw error;
    }
  }

  async getOrganizationDetails(organizationId: number) {
    try {
      const [localData, zammadData] = await Promise.all([
        this.getBudgetForOrganization(organizationId),
        zammadService.getOrganizationBudgetInfo()
      ]);

      const zammadOrg = zammadData.find((org: ZammadOrgInfo) => org.id === organizationId);
      if (!zammadOrg) {
        throw new Error('Organization not found in Zammad');
      }

      return {
        ...localData,
        name: zammadOrg.name,
        trackedMinutes: zammadOrg.trackedMinutes
      };
    } catch (error) {
      console.error('Error in getOrganizationDetails:', error);
      throw error;
    }
  }
}