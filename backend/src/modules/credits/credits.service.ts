import { prisma } from '../../lib/prisma.js';
import { CreditTransactionType } from '@prisma/client';

interface DeductCreditsParams {
  userId: string;
  amount: number;
  type: CreditTransactionType;
  description?: string;
  reference?: string;
}

interface AddCreditsParams {
  userId: string;
  amount: number;
  type: CreditTransactionType;
  description?: string;
  reference?: string;
}

interface TransactionHistoryParams {
  userId: string;
  limit?: number;
  offset?: number;
  type?: CreditTransactionType;
}

export const creditsService = {
  /**
   * Get the current credit balance for a user
   */
  async getBalance(userId: string): Promise<number> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { creditBalance: true },
    });

    if (!user) {
      throw new Error('User not found');
    }

    return user.creditBalance;
  },

  /**
   * Deduct credits from a user's balance
   * Returns the new balance, or throws if insufficient credits
   */
  async deductCredits(params: DeductCreditsParams): Promise<number> {
    const { userId, amount, type, description, reference } = params;

    if (amount <= 0) {
      throw new Error('Deduction amount must be positive');
    }

    // Use a transaction to ensure atomicity
    const result = await prisma.$transaction(async (tx) => {
      const user = await tx.user.findUnique({
        where: { id: userId },
        select: { creditBalance: true },
      });

      if (!user) {
        throw new Error('User not found');
      }

      if (user.creditBalance < amount) {
        throw new Error('Insufficient credits');
      }

      // Update user balance
      const updatedUser = await tx.user.update({
        where: { id: userId },
        data: {
          creditBalance: {
            decrement: amount,
          },
        },
        select: { creditBalance: true },
      });

      // Create transaction record (negative amount for deductions)
      await tx.creditTransaction.create({
        data: {
          userId,
          amount: -amount,
          type,
          description,
          reference,
        },
      });

      return updatedUser.creditBalance;
    });

    return result;
  },

  /**
   * Add credits to a user's balance
   * Returns the new balance
   */
  async addCredits(params: AddCreditsParams): Promise<number> {
    const { userId, amount, type, description, reference } = params;

    if (amount <= 0) {
      throw new Error('Credit amount must be positive');
    }

    // Use a transaction to ensure atomicity
    const result = await prisma.$transaction(async (tx) => {
      // Check user exists
      const user = await tx.user.findUnique({
        where: { id: userId },
        select: { id: true },
      });

      if (!user) {
        throw new Error('User not found');
      }

      // Update user balance
      const updatedUser = await tx.user.update({
        where: { id: userId },
        data: {
          creditBalance: {
            increment: amount,
          },
        },
        select: { creditBalance: true },
      });

      // Create transaction record (positive amount for additions)
      await tx.creditTransaction.create({
        data: {
          userId,
          amount,
          type,
          description,
          reference,
        },
      });

      return updatedUser.creditBalance;
    });

    return result;
  },

  /**
   * Get transaction history for a user
   */
  async getTransactionHistory(params: TransactionHistoryParams) {
    const { userId, limit = 50, offset = 0, type } = params;

    const where = {
      userId,
      ...(type ? { type } : {}),
    };

    const [transactions, total] = await Promise.all([
      prisma.creditTransaction.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      prisma.creditTransaction.count({ where }),
    ]);

    return {
      transactions,
      total,
      limit,
      offset,
    };
  },

  /**
   * Check if user has sufficient credits
   */
  async hasSufficientCredits(userId: string, requiredAmount: number): Promise<boolean> {
    const balance = await this.getBalance(userId);
    return balance >= requiredAmount;
  },

  /**
   * Get monthly credit usage stats for a user
   */
  async getMonthlyStats(userId: string) {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    // Get all deduction transactions this month
    const transactions = await prisma.creditTransaction.findMany({
      where: {
        userId,
        createdAt: { gte: startOfMonth },
        amount: { lt: 0 }, // Only negative amounts (deductions)
      },
    });

    // Calculate total credits used (absolute value of negative amounts)
    const creditsUsed = transactions.reduce((sum, t) => sum + Math.abs(t.amount), 0);

    // Count scrape-related transactions as leads scraped
    const leadsScraped = transactions.filter(
      t => t.type === CreditTransactionType.LEAD_CHARGE || t.description?.toLowerCase().includes('scrape')
    ).reduce((sum, t) => sum + Math.abs(t.amount), 0);

    return {
      creditsUsed,
      leadsScraped,
      transactionCount: transactions.length,
    };
  },
};
