import { Router, Request, Response } from 'express';
import prisma from '../../config/database';
import { authenticateToken, authorize } from '../../middleware/auth';
import { sendTemplateMessage, sendTextMessage, sendMediaMessage } from '../../services/whatsapp/whatsapp.service';

const router = Router();

// Require auth and admin/coordinator roles
router.use(authenticateToken, authorize('admin', 'coordinator'));

// GET /api/whatsapp/logs -> List all logs (paginated, filterable)
router.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      page = '1',
      limit = '50',
      status,
      recipient_type,
      automation_type,
      direction,
      phone,
      start_date,
      end_date,
    } = req.query as Record<string, string>;

    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const skip = (pageNum - 1) * limitNum;

    let where: any = {};

    if (status) where.status = status;
    if (recipient_type) where.recipient_type = recipient_type;
    if (automation_type) where.automation_type = automation_type;
    if (direction) where.direction = direction;
    if (phone) {
      where.phone = { contains: phone };
    }

    if (start_date && end_date) {
      where.created_at = {
        gte: new Date(start_date),
        lte: new Date(end_date),
      };
    } else if (start_date) {
      where.created_at = { gte: new Date(start_date) };
    } else if (end_date) {
      where.created_at = { lte: new Date(end_date) };
    }

    const [total, logs] = await Promise.all([
      prisma.whatsAppLog.count({ where }),
      prisma.whatsAppLog.findMany({
        where,
        skip,
        take: limitNum,
        orderBy: { created_at: 'desc' },
        include: {
          template: { select: { name: true, category: true } },
        },
      }),
    ]);

    res.json({
      success: true,
      data: logs,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        pages: Math.ceil(total / limitNum),
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Server error' });
  }
});

// GET /api/whatsapp/logs/stats -> Stats dashboard data
router.get('/stats', async (req: Request, res: Response): Promise<void> => {
  try {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    // 1. Fetch total counts group by status
    const statusCounts = await prisma.whatsAppLog.groupBy({
      by: ['status'],
      _count: true,
    });

    // 2. Fetch today's counts group by status
    const todayStatusCounts = await prisma.whatsAppLog.groupBy({
      by: ['status'],
      where: {
        created_at: { gte: todayStart },
      },
      _count: true,
    });

    // 3. Fetch template counts
    const approvedTemplatesCount = await prisma.whatsAppTemplate.count({
      where: { status: 'APPROVED' },
    });

    // 4. Fetch active rules count
    const activeRulesCount = await prisma.whatsAppAutomationRule.count({
      where: { is_active: true },
    });

    // Map counts
    let totalSent = 0;
    let totalDelivered = 0;
    let totalRead = 0;
    let totalFailed = 0;
    let totalMock = 0;

    statusCounts.forEach((sc) => {
      const count = sc._count;
      if (sc.status === 'SENT') totalSent += count;
      if (sc.status === 'DELIVERED') totalDelivered += count;
      if (sc.status === 'READ') totalRead += count;
      if (sc.status === 'FAILED') totalFailed += count;
      if (sc.status === 'MOCK') totalMock += count;
    });

    let todaySent = 0;
    let todayDelivered = 0;
    let todayRead = 0;
    let todayFailed = 0;
    let todayMock = 0;

    todayStatusCounts.forEach((sc) => {
      const count = sc._count;
      if (sc.status === 'SENT') todaySent += count;
      if (sc.status === 'DELIVERED') todayDelivered += count;
      if (sc.status === 'READ') todayRead += count;
      if (sc.status === 'FAILED') todayFailed += count;
      if (sc.status === 'MOCK') todayMock += count;
    });

    const todayTotal = todaySent + todayDelivered + todayRead + todayFailed + todayMock;
    const todayDeliveredRate = todayTotal > 0 ? ((todayDelivered + todayRead) / todayTotal) * 100 : 0;
    const todayFailedRate = todayTotal > 0 ? (todayFailed / todayTotal) * 100 : 0;

    const allTotalOut = totalSent + totalDelivered + totalRead + totalFailed;
    const readRate = allTotalOut > 0 ? (totalRead / allTotalOut) * 100 : 0;

    res.json({
      success: true,
      data: {
        total: {
          sent: totalSent,
          delivered: totalDelivered,
          read: totalRead,
          failed: totalFailed,
          mock: totalMock,
          allOut: allTotalOut,
          readRate: parseFloat(readRate.toFixed(1)),
        },
        today: {
          total: todayTotal,
          sent: todaySent,
          delivered: todayDelivered,
          read: todayRead,
          failed: todayFailed,
          mock: todayMock,
          deliveredPercent: parseFloat(todayDeliveredRate.toFixed(1)),
          failedPercent: parseFloat(todayFailedRate.toFixed(1)),
        },
        templatesApproved: approvedTemplatesCount,
        activeAutomations: activeRulesCount,
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Server error' });
  }
});

// GET /api/whatsapp/logs/export -> Export logs as CSV string
router.get('/export', async (req: Request, res: Response): Promise<void> => {
  try {
    const logs = await prisma.whatsAppLog.findMany({
      orderBy: { created_at: 'desc' },
      include: {
        template: { select: { name: true } },
      },
    });

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="proton_whatsapp_logs.csv"');

    let csvContent = 'ID,Phone,Recipient Name,Recipient Type,Template,Status,Direction,Error Code,Error Message,Triggered By,Automation,Cost,Created At\n';

    logs.forEach((log) => {
      const templateName = log.template?.name || 'N/A';
      const safeErr = (log.error_message || '').replace(/"/g, '""');
      const safeName = (log.recipient_name || '').replace(/"/g, '""');
      
      csvContent += `"${log.id}","${log.phone}","${safeName}","${log.recipient_type}","${templateName}","${log.status}","${log.direction}","${log.error_code || ''}","${safeErr}","${log.triggered_by}","${log.automation_type || 'N/A'}",${log.cost_estimation},"${log.created_at.toISOString()}"\n`;
    });

    res.status(200).send(csvContent);
  } catch (error: any) {
    console.error('CSV log export failed:', error);
    res.status(500).json({ success: false, message: 'Log export failed' });
  }
});

// GET /api/whatsapp/logs/:id -> Get single log detail
router.get('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const log = await prisma.whatsAppLog.findUnique({
      where: { id },
      include: {
        template: true,
      },
    });

    if (!log) {
      res.status(404).json({ success: false, message: 'Log record not found' });
      return;
    }

    res.json({ success: true, data: log });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Server error' });
  }
});

// POST /api/whatsapp/logs/:id/resend -> Resend a failed message
router.post('/:id/resend', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const log = await prisma.whatsAppLog.findUnique({
      where: { id },
      include: { template: true },
    });

    if (!log) {
      res.status(404).json({ success: false, message: 'Log record not found' });
      return;
    }

    let result;
    const metaObj = {
      recipientName: log.recipient_name || undefined,
      recipientType: log.recipient_type as any,
      recipientUserId: log.recipient_user_id || undefined,
      triggeredBy: 'MANUAL' as const,
      automationType: log.automation_type || undefined,
    };

    // Parse variables or text
    const vars = log.variables ? (log.variables as any) : {};

    if (log.template) {
      // Re-send template message
      const variablesArray = Array.isArray(vars) ? vars : [];
      result = await sendTemplateMessage(log.phone, log.template.name, variablesArray, metaObj);
    } else if (vars.text) {
      // Re-send free text message
      result = await sendTextMessage(log.phone, vars.text, metaObj);
    } else if (vars.url && vars.type) {
      // Re-send media message
      result = await sendMediaMessage(log.phone, vars.type, vars.url, vars.caption, vars.filename, metaObj);
    } else {
      res.status(400).json({ success: false, message: 'Incomplete log structure. Cannot determine message type to resend.' });
      return;
    }

    if (result.success) {
      res.json({ success: true, message: 'Message resent successfully', data: result });
    } else {
      res.status(400).json({ success: false, message: result.error || 'Resend failed', data: result });
    }
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Server error during resend' });
  }
});

// DELETE /api/whatsapp/logs/clear -> Clear logs older than 30 days
router.delete('/clear', async (req: Request, res: Response): Promise<void> => {
  try {
    const { olderThanDays = '30' } = req.query;
    const days = parseInt(olderThanDays as string, 10);
    
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    const deleted = await prisma.whatsAppLog.deleteMany({
      where: {
        created_at: { lt: cutoffDate },
      },
    });

    res.json({
      success: true,
      message: `Cleared ${deleted.count} log entries older than ${days} days.`,
      data: deleted,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Server error clearing logs' });
  }
});

export default router;
