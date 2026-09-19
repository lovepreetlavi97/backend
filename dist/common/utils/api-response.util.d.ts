export interface PaginationMeta {
    total: number;
    page: number;
    limit: number;
    pages: number;
    hasNextPage?: boolean;
    hasPrevPage?: boolean;
}
export interface PaginatedResult<T> {
    items: T[];
    pagination: PaginationMeta;
}
export interface StandardApiResponse<T = any> {
    status: 'success' | 'error';
    statusCode?: number;
    message?: string;
    data: T;
    timestamp?: string;
}
export declare function buildPaginatedResponse<T>(dataKey: string, items: T[], total: number, page?: number, limit?: number, extraMeta?: Record<string, any>): {
    [dataKey]: T[];
    pagination: {
        total: number;
        page: number;
        limit: number;
        pages: number;
        hasNextPage: boolean;
        hasPrevPage: boolean;
    };
};
export declare function successResponse<T>(data: T, message?: string): StandardApiResponse<T>;
