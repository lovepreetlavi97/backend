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

/**
 * Standardizes paginated responses across all backend services
 */
export function buildPaginatedResponse<T>(
  dataKey: string,
  items: T[],
  total: number,
  page: number = 1,
  limit: number = 10,
  extraMeta?: Record<string, any>,
) {
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

/**
 * Standardizes API success payloads
 */
export function successResponse<T>(data: T, message?: string): StandardApiResponse<T> {
  return {
    status: 'success',
    statusCode: 200,
    ...(message && { message }),
    data,
    timestamp: new Date().toISOString(),
  };
}
