export declare class PaginationQueryDto {
    page?: number;
    limit?: number;
    search?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
    get skip(): number;
    get take(): number;
}
