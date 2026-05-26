declare const router: import("express-serve-static-core").Router;
export declare const sendNotification: (recipientIds: string[], senderId: string | null, type: string, title: string, message: string, referenceId?: string) => Promise<void>;
export declare const getStudentUserIdsForClass: (classId: string) => Promise<string[]>;
export declare const getTeacherUserIds: () => Promise<string[]>;
export declare const getAllStudentUserIds: () => Promise<string[]>;
export default router;
//# sourceMappingURL=notifications.d.ts.map