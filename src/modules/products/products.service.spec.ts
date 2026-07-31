import { describe, it, expect, beforeEach } from 'vitest';
import { ProductsService } from './products.service';

describe('ProductsService - Price Calculation', () => {
  let productsService: ProductsService;

  beforeEach(() => {
    productsService = new ProductsService(null as any);
  });

  it('should accurately calculate gold price with making charges, GST and discount', () => {
    const weight = 10; // 10 grams
    const ratePerGram = 6000; // 6000 per gram
    const makingCharge = 500; // 500 per gram
    const gstPercent = 3; // 3% GST
    const discountPercent = 5; // 5% discount

    const result = productsService.calculatePrice(
      weight,
      ratePerGram,
      makingCharge,
      gstPercent,
      discountPercent,
    );

    // Base metal = 10 * 6000 = 60,000
    expect(result.baseMetalPrice).toBe(60000);
    // Making charge = 10 * 500 = 5,000
    expect(result.totalMakingCharge).toBe(5000);
    // Price before tax = 65,000
    expect(result.priceBeforeTax).toBe(65000);
    // GST 3% of 65,000 = 1,950
    expect(result.gstAmount).toBe(1950);
    // Discount 5% of 65,000 = 3,250
    expect(result.discountAmount).toBe(3250);
    // Final price = 65000 + 1950 - 3250 = 63,700
    expect(result.finalPrice).toBe(63700);
  });
});
