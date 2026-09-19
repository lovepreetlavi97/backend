"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const products_service_1 = require("./products.service");
(0, vitest_1.describe)('ProductsService - Price Calculation', () => {
    let productsService;
    (0, vitest_1.beforeEach)(() => {
        productsService = new products_service_1.ProductsService(null, null);
    });
    (0, vitest_1.it)('should accurately calculate gold price with dynamic rate, hallmarking and GST', () => {
        const weight = 10;
        const ratePerGram = 6000;
        const result = productsService.calculatePrice(weight, ratePerGram, false);
        (0, vitest_1.expect)(result.baseMetalPrice).toBe(60000);
        (0, vitest_1.expect)(result.hallmarkingFee).toBe(0);
        (0, vitest_1.expect)(result.priceBeforeTax).toBe(60000);
        (0, vitest_1.expect)(result.gstAmount).toBe(1800);
        (0, vitest_1.expect)(result.finalPrice).toBe(61800);
    });
    (0, vitest_1.it)('should calculate fixed price correctly', () => {
        const result = productsService.calculatePrice(10, 6000, true, 50000, 45000);
        (0, vitest_1.expect)(result.baseMetalPrice).toBe(50000);
        (0, vitest_1.expect)(result.finalPrice).toBe(45000);
        (0, vitest_1.expect)(result.discountAmount).toBe(5000);
    });
});
//# sourceMappingURL=products.service.spec.js.map