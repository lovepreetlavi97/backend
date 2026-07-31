import { describe, it, expect, beforeEach } from 'vitest';
import { KittyService } from './kitty.service';

describe('KittyService - Maturity Calculation', () => {
  let kittyService: KittyService;

  beforeEach(() => {
    kittyService = new KittyService(null as any);
  });

  it('should accurately calculate maturity value for 11 months scheme with 1 month bonus', () => {
    const monthlyAmount = 5000;
    const paidMonths = 11;
    const bonusMonths = 1.0;

    const result = kittyService.calculateMaturity(monthlyAmount, paidMonths, bonusMonths);

    // Customer contribution = 11 * 5000 = 55,000
    expect(result.totalCustomerContribution).toBe(55000);
    // Bonus = 1 * 5000 = 5,000
    expect(result.bonusAmountAdded).toBe(5000);
    // Final maturity = 60,000
    expect(result.finalMaturityValue).toBe(60000);
    expect(result.status).toBe('MATURED');
  });
});
