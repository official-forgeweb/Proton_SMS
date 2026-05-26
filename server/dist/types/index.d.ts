import { UserRole } from '@prisma/client';
export interface AuthUser {
    id: string;
    email: string;
    role: UserRole;
}
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
//# sourceMappingURL=index.d.ts.map