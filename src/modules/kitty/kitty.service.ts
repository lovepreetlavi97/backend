import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export interface KittyMaturitySummary {
  subscriptionId: string;
  totalPaidMonths: number;
  totalCustomerContribution: number;
  bonusAmountAdded: number;
  finalMaturityValue: number;
  status: string;
}

@Injectable()
export class KittyService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Calculates Kitty maturity value preserving exact 11+1 scheme arithmetic:
   * Customer pays 11 monthly installments.
   * Bonus added = bonusMonths * monthlyInstallment (e.g. 1 month bonus).
   * Total Maturity Value = (11 * monthlyAmount) + (bonusMonths * monthlyAmount).
   */
  calculateMaturity(monthlyAmount: number, paidMonths: number, bonusMonths: number = 1.0): KittyMaturitySummary {
    const totalCustomerContribution = paidMonths * monthlyAmount;
    const bonusAmountAdded = monthlyAmount * bonusMonths;
    const finalMaturityValue = totalCustomerContribution + bonusAmountAdded;

    return {
      subscriptionId: '',
      totalPaidMonths: paidMonths,
      totalCustomerContribution,
      bonusAmountAdded,
      finalMaturityValue,
      status: paidMonths >= 11 ? 'MATURED' : 'ACTIVE',
    };
  }

  async getSubscriptionDetails(userKittyId: string) {
    const userKitty = await this.prisma.userKitty.findUnique({
      where: { id: userKittyId },
      include: {
        plan: true,
        user: true,
      },
    });

    if (!userKitty) {
      throw new NotFoundException(`Kitty subscription '${userKittyId}' not found.`);
    }

    const monthlyAmount = Number(userKitty.plan.monthlyAmount);
    const bonusMonths = Number(userKitty.plan.bonusMonths);
    const maturity = this.calculateMaturity(monthlyAmount, userKitty.paidMonths, bonusMonths);

    return {
      ...userKitty,
      maturitySummary: {
        ...maturity,
        subscriptionId: userKitty.id,
      },
    };
  }
}
