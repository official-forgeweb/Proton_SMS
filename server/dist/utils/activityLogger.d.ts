import { Request } from 'express';
/**
 * Logs teacher specific activity into the teacher_activity_logs database table.
 */
export declare function logTeacherActivity(userId: string, actionType: string, previousValue?: string | null, newValue?: string | null, affectedEntity?: string | null, req?: Request): Promise<void>;
//# sourceMappingURL=activityLogger.d.ts.map