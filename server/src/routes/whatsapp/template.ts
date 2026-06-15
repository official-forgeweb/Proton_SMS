import { Router, Request, Response } from 'express';
import prisma from '../../config/database';
import { authenticateToken, authorize } from '../../middleware/auth';
import {
  createLocalTemplate,
  deleteTemplate,
  pushTemplateToMeta,
  syncAllFromMeta,
  syncTemplateWithMeta,
} from '../../services/whatsapp/template.service';
import { getTemplatesFromMeta } from '../../services/whatsapp/whatsapp.service';

const router = Router();

// Require auth and admin/coordinator roles
router.use(authenticateToken, authorize('admin', 'coordinator'));

// GET /api/whatsapp/templates -> List local templates (paginated, filterable)
router.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const { page = '1', limit = '10', search = '', status = '', category = '' } = req.query as Record<string, string>;
    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const skip = (pageNum - 1) * limitNum;

    let where: any = {};

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { body_text: { contains: search, mode: 'insensitive' } },
      ];
    }
    if (status) {
      where.status = status;
    }
    if (category) {
      where.category = category;
    }

    const [total, templates] = await Promise.all([
      prisma.whatsAppTemplate.count({ where }),
      prisma.whatsAppTemplate.findMany({
        where,
        skip,
        take: limitNum,
        orderBy: { created_at: 'desc' },
      }),
    ]);

    res.json({
      success: true,
      data: templates,
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

// GET /api/whatsapp/templates/meta/list -> Fetch direct from Meta API
router.get('/meta/list', async (req: Request, res: Response): Promise<void> => {
  try {
    const metaTemplates = await getTemplatesFromMeta();
    res.json({ success: true, data: metaTemplates });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Failed to fetch Meta templates' });
  }
});

// GET /api/whatsapp/templates/:id -> Get single local template
router.get('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;
    const template = await prisma.whatsAppTemplate.findUnique({
      where: { id },
    });

    if (!template) {
      res.status(404).json({ success: false, message: 'Template not found' });
      return;
    }

    res.json({ success: true, data: template });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Server error' });
  }
});

// POST /api/whatsapp/templates -> Create local template
router.post('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const templateData = {
      ...req.body,
      created_by_id: req.user!.id,
    };

    const newTemplate = await createLocalTemplate(templateData);
    res.status(201).json({
      success: true,
      message: 'Local template draft created successfully',
      data: newTemplate,
    });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message || 'Validation failed' });
  }
});

// PUT /api/whatsapp/templates/:id -> Update local template
router.put('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;
    const {
      category,
      language,
      header_type,
      header_content,
      body_text,
      footer_text,
      buttons,
      variables_description,
      sample_values,
    } = req.body;

    const existing = await prisma.whatsAppTemplate.findUnique({ where: { id } });
    if (!existing) {
      res.status(404).json({ success: false, message: 'Template not found' });
      return;
    }

    // Only allow updating if it is a local draft or out of sync (not approved yet on Meta)
    if (existing.sync_status === 'SYNCED' && existing.status === 'APPROVED') {
      res.status(400).json({
        success: false,
        message: 'Cannot update a template that is already approved on Meta. Delete and recreate it instead.',
      });
      return;
    }

    const updated = await prisma.whatsAppTemplate.update({
      where: { id },
      data: {
        category,
        language,
        header_type,
        header_content,
        body_text,
        footer_text,
        buttons,
        variables_description,
        sample_values,
        sync_status: 'LOCAL_ONLY', // Mark as out of sync so it can be pushed again
      },
    });

    res.json({ success: true, message: 'Template updated successfully', data: updated });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Server error' });
  }
});

// DELETE /api/whatsapp/templates/:id -> Delete template (local + Meta)
router.delete('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;
    const { deleteFromMeta = 'false' } = req.query;

    await deleteTemplate(id, deleteFromMeta === 'true' as any);
    res.json({ success: true, message: 'Template deleted successfully' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Server error' });
  }
});

// POST /api/whatsapp/templates/sync -> Sync ALL templates from Meta (pull)
router.post('/sync', async (req: Request, res: Response): Promise<void> => {
  try {
    const count = await syncAllFromMeta();
    res.json({ success: true, message: `Successfully synced ${count} templates from Meta.` });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Sync failed' });
  }
});

// POST /api/whatsapp/templates/:id/sync -> Sync single template status from Meta
router.post('/:id/sync', async (req: Request, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;
    const result = await syncTemplateWithMeta(id);
    res.json({
      success: true,
      message: `Template status synced. Current status: ${result.status}`,
      data: result,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Sync failed' });
  }
});

// POST /api/whatsapp/templates/:id/push -> Push local template to Meta for approval
router.post('/:id/push', async (req: Request, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;
    const result = await pushTemplateToMeta(id);
    res.json({
      success: true,
      message: 'Template successfully pushed to Meta for approval.',
      data: result.metaResponse,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Failed to push template to Meta' });
  }
});

// POST /api/whatsapp/templates/push-all -> Push all DRAFT/LOCAL_ONLY templates to Meta
router.post('/push-all', async (req: Request, res: Response): Promise<void> => {
  try {
    const drafts = await prisma.whatsAppTemplate.findMany({
      where: { sync_status: 'LOCAL_ONLY' },
    });

    let successCount = 0;
    const errors: string[] = [];

    for (const draft of drafts) {
      try {
        await pushTemplateToMeta(draft.id);
        successCount++;
      } catch (err: any) {
        errors.push(`Failed pushing ${draft.name}: ${err.message}`);
      }
    }

    res.json({
      success: true,
      message: `Pushed ${successCount} of ${drafts.length} templates.`,
      errors,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Failed pushing templates' });
  }
});

export default router;
