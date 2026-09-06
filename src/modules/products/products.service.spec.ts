import { describe, it, expect, beforeEach } from 'vitest';
import { ProductsService } from './products.service';

describe('ProductsService - Price Calculation', () => {
  let productsService: ProductsService;

  beforeEach(() => {
    productsService = new ProductsService(null as any, null as any);
  });

  it('should accurately calculate gold price with dynamic rate, hallmarking and GST', () => {
    const weight = 10; // 10 grams
    const ratePerGram = 6000; // 6000 per gram

    const result = productsService.calculatePrice(
      weight,
      ratePerGram,
      false,
    );

    // Base metal = 10 * 6000 = 60,000
    expect(result.baseMetalPrice).toBe(60000);
    expect(result.hallmarkingFee).toBe(0);
    // Subtotal before tax = 60000
    expect(result.priceBeforeTax).toBe(60000);
    // GST 3% of 60000 = 1800
    expect(result.gstAmount).toBe(1800);
    // Final price = 60000 + 1800 = 61800
    expect(result.finalPrice).toBe(61800);
  });

  it('should calculate fixed price correctly', () => {
    const result = productsService.calculatePrice(
      10,
      6000,
      true,
      50000,
      45000,
    );

    expect(result.baseMetalPrice).toBe(50000);
    expect(result.finalPrice).toBe(45000);
    expect(result.discountAmount).toBe(5000);
  });
});
