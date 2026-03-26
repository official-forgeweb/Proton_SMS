import { UserRole } from '@prisma/client';

// Express request user (set by auth middleware)
export interface AuthUser {
  id: string;
  email: string;
  role: UserRole;
}

// Generic API response shape
export interface ApiResponse<T = unknown> {
  success: boolean;
  message?: string;
  data?: T;
  pagination?: PaginationInfo;
}

export interface PaginationInfo {
  total: number;
  page: number;
  limit: number;
  pages: number;
}
