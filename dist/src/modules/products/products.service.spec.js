"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const products_service_1 = require("./products.service");
(0, vitest_1.describe)('ProductsService - Price Calculation', () => {
    let productsService;
    (0, vitest_1.beforeEach)(() => {
        productsService = new products_service_1.ProductsService(null);
    });
    (0, vitest_1.it)('should accurately calculate gold price with making charges, GST and discount', () => {
        const weight = 10;
        const ratePerGram = 6000;
        const makingCharge = 500;
        const gstPercent = 3;
        const discountPercent = 5;
        const result = productsService.calculatePrice(weight, ratePerGram, makingCharge, gstPercent, discountPercent);
        (0, vitest_1.expect)(result.baseMetalPrice).toBe(60000);
        (0, vitest_1.expect)(result.totalMakingCharge).toBe(5000);
        (0, vitest_1.expect)(result.priceBeforeTax).toBe(65000);
        (0, vitest_1.expect)(result.gstAmount).toBe(1950);
        (0, vitest_1.expect)(result.discountAmount).toBe(3250);
        (0, vitest_1.expect)(result.finalPrice).toBe(63700);
    });
});
//# sourceMappingURL=products.service.spec.js.map