import prisma from '../config/database';
import { Request } from 'express';

/**
 * Logs teacher specific activity into the teacher_activity_logs database table.
 */
export async function logTeacherActivity(
  userId: string,
  actionType: string,
  previousValue: string | null = null,
  newValue: string | null = null,
  affectedEntity: string | null = null,
  req?: Request
): Promise<void> {
  try {
    // Resolve user to teacher profile
    const teacher = await prisma.teacher.findUnique({
      where: { user_id: userId }
    });

    let teacherName = '';
    let teacherId: string | null = null;

    if (teacher) {
      teacherName = `${teacher.first_name || ''} ${teacher.last_name || ''}`.trim() || 'Unknown Teacher';
      teacherId = teacher.id;
    } else {
      // Resolve user to coordinator profile
      const coordinator = await prisma.coordinator.findUnique({
        where: { user_id: userId }
      });
      if (coordinator) {
        teacherName = `${coordinator.full_name || 'Coordinator'}`.trim();
      } else {
        // Resolve user to admin
        const user = await prisma.user.findUnique({
          where: { id: userId }
        });
        if (user && user.role === 'admin') {
          teacherName = `Admin (${user.email})`;
        } else {
          return;
        }
      }
    }

    // Retrieve IP and User-Agent/Device from express request if provided
    let ipAddress = null;
    let device = null;
    if (req) {
      const forwarded = req.headers['x-forwarded-for'];
      ipAddress = Array.isArray(forwarded) 
        ? forwarded[0] 
        : (forwarded as string) || req.socket.remoteAddress || req.ip || null;
      
      if (ipAddress && ipAddress.startsWith('::ffff:')) {
        ipAddress = ipAddress.substring(7);
      }
      
      device = req.headers['user-agent'] || null;
    }

    await prisma.teacherActivityLog.create({
      data: {
        teacher_id: teacherId,
        teacher_name: teacherName,
        action_type: actionType,
        previous_value: previousValue,
        new_value: newValue,
        affected_entity: affectedEntity,
        ip_address: ipAddress,
        device: device
      }
    });
  } catch (error) {
    console.error('[ActivityLogger] Error writing activity log:', error);
  }
}
