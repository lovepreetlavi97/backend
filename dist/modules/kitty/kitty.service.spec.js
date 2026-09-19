"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const kitty_service_1 = require("./kitty.service");
(0, vitest_1.describe)('KittyService - Maturity Calculation', () => {
    let kittyService;
    (0, vitest_1.beforeEach)(() => {
        kittyService = new kitty_service_1.KittyService(null, null);
    });
    (0, vitest_1.it)('should accurately calculate maturity value for 11 months scheme with 1 month bonus', () => {
        const monthlyAmount = 5000;
        const paidMonths = 11;
        const bonusMonths = 1.0;
        const result = kittyService.calculateMaturity(monthlyAmount, paidMonths, bonusMonths);
        (0, vitest_1.expect)(result.totalCustomerContribution).toBe(55000);
        (0, vitest_1.expect)(result.bonusAmountAdded).toBe(5000);
        (0, vitest_1.expect)(result.finalMaturityValue).toBe(60000);
        (0, vitest_1.expect)(result.status).toBe('MATURED');
    });
});
//# sourceMappingURL=kitty.service.spec.js.map