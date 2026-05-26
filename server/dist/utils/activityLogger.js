"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.logTeacherActivity = logTeacherActivity;
const database_1 = __importDefault(require("../config/database"));
/**
 * Logs teacher specific activity into the teacher_activity_logs database table.
 */
async function logTeacherActivity(userId, actionType, previousValue = null, newValue = null, affectedEntity = null, req) {
    try {
        // Resolve user to teacher profile
        const teacher = await database_1.default.teacher.findUnique({
            where: { user_id: userId }
        });
        if (!teacher) {
            // Action performed by non-teacher (e.g. Admin or Student)
            return;
        }
        const teacherName = `${teacher.first_name || ''} ${teacher.last_name || ''}`.trim() || 'Unknown Teacher';
        // Retrieve IP and User-Agent/Device from express request if provided
        let ipAddress = null;
        let device = null;
        if (req) {
            const forwarded = req.headers['x-forwarded-for'];
            ipAddress = Array.isArray(forwarded)
                ? forwarded[0]
                : forwarded || req.socket.remoteAddress || req.ip || null;
            if (ipAddress && ipAddress.startsWith('::ffff:')) {
                ipAddress = ipAddress.substring(7);
            }
            device = req.headers['user-agent'] || null;
        }
        await database_1.default.teacherActivityLog.create({
            data: {
                teacher_id: teacher.id,
                teacher_name: teacherName,
                action_type: actionType,
                previous_value: previousValue,
                new_value: newValue,
                affected_entity: affectedEntity,
                ip_address: ipAddress,
                device: device
            }
        });
    }
    catch (error) {
        console.error('[ActivityLogger] Error writing activity log:', error);
    }
}
//# sourceMappingURL=activityLogger.js.map