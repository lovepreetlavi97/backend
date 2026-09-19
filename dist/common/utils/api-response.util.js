"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildPaginatedResponse = buildPaginatedResponse;
exports.successResponse = successResponse;
function buildPaginatedResponse(dataKey, items, total, page = 1, limit = 10, extraMeta) {
    const safePage = Math.max(1, Number(page) || 1);
    const safeLimit = Math.max(1, Number(limit) || 10);
    const totalPages = Math.ceil(total / safeLimit) || 1;
    return {
        [dataKey]: items,
        pagination: {
            total,
            page: safePage,
            limit: safeLimit,
            pages: totalPages,
            hasNextPage: safePage < totalPages,
            hasPrevPage: safePage > 1,
            ...extraMeta,
        },
    };
}
function successResponse(data, message) {
    return {
        status: 'success',
        statusCode: 200,
        ...(message && { message }),
        data,
        timestamp: new Date().toISOString(),
    };
}
//# sourceMappingURL=api-response.util.js.map