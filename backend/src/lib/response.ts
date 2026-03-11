export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasMore: boolean;
}

export interface SuccessResponse<T> {
  data: T;
  meta?: Record<string, unknown>;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: PaginationMeta;
}

export interface ErrorResponse {
  error: {
    code: string;
    message: string;
    details?: Record<string, string>;
  };
}

export function success<T>(data: T, meta?: Record<string, unknown>): SuccessResponse<T> {
  return { data, ...(meta ? { meta } : {}) };
}

export function paginated<T>(data: T[], pagination: { page: number; limit: number; total: number }): PaginatedResponse<T> {
  const { page, limit, total } = pagination;
  const totalPages = Math.ceil(total / limit);
  return {
    data,
    meta: {
      page,
      limit,
      total,
      totalPages,
      hasMore: page < totalPages,
    },
  };
}

export function error(code: string, message: string, details?: Record<string, string>): ErrorResponse {
  return {
    error: {
      code,
      message,
      ...(details ? { details } : {}),
    },
  };
}

export const ErrorCodes = {
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  NOT_FOUND: 'NOT_FOUND',
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  RATE_LIMITED: 'RATE_LIMITED',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  CONFLICT: 'CONFLICT',
} as const;
