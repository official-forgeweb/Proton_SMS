import { Router, Request, Response } from 'express';
import prisma from '../config/database';
import { authenticateToken, authorize } from '../middleware/auth';
import { getNormalizedKey, resolveCanonicalSubject } from '../utils/normalization';

const router = Router();

const paramId = (req: Request): string => String(req.params.id);

// GET /api/subjects
router.get('/', authenticateToken, async (req: Request, res: Response): Promise<void> => {
  try {
    const subjects = await (prisma as any).subject.findMany({
      orderBy: { canonical_name: 'asc' },
      include: { aliases: true }
    });

    // Bulk query usage statistics in parallel to avoid N+1 query waterfall
    const [timetableCounts, testCounts, materialCounts, homeworkCounts, legacyHomeworks] = await Promise.all([
      prisma.timetable.groupBy({
        by: ['subject_id'],
        _count: { _all: true }
      }),
      prisma.test.groupBy({
        by: ['subject_id'],
        _count: { _all: true }
      }),
      prisma.studyMaterial.groupBy({
        by: ['subject_id'],
        _count: { _all: true }
      }),
      prisma.homework.groupBy({
        by: ['subject_id'],
        _count: { _all: true }
      }),
      prisma.homework.findMany({
        where: { subject_id: null },
        select: { class: { select: { subject: true } } }
      })
    ]);

    // Build lookup maps for fast memory aggregation
    const timetableMap: Record<string, number> = {};
    timetableCounts.forEach(c => { if (c.subject_id) timetableMap[c.subject_id] = c._count._all; });

    const testMap: Record<string, number> = {};
    testCounts.forEach(c => { if (c.subject_id) testMap[c.subject_id] = c._count._all; });

    const materialMap: Record<string, number> = {};
    materialCounts.forEach(c => { if (c.subject_id) materialMap[c.subject_id] = c._count._all; });

    const homeworkMap: Record<string, number> = {};
    homeworkCounts.forEach(c => { if (c.subject_id) homeworkMap[c.subject_id] = c._count._all; });

    const legacyHomeworkCounts: Record<string, number> = {};
    legacyHomeworks.forEach(hw => {
      const subjName = hw.class?.subject;
      if (subjName) {
        legacyHomeworkCounts[subjName] = (legacyHomeworkCounts[subjName] || 0) + 1;
      }
    });

    const enriched = subjects.map((subj: any) => {
      const timetableCount = timetableMap[subj.id] || 0;
      const testCount = testMap[subj.id] || 0;
      const materialCount = materialMap[subj.id] || 0;
      
      const modernHomeworkCount = homeworkMap[subj.id] || 0;
      const legacyHwCount = legacyHomeworkCounts[subj.canonical_name] || 0;
      const homeworkCount = modernHomeworkCount + legacyHwCount;

      return {
        ...subj,
        timetable_usage: timetableCount,
        test_usage: testCount,
        material_usage: materialCount,
        homework_usage: homeworkCount,
        total_usage: timetableCount + testCount + materialCount + homeworkCount
      };
    });

    res.json({ success: true, data: enriched });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// GET /api/subjects/search
router.get('/search', authenticateToken, async (req: Request, res: Response): Promise<void> => {
  try {
    const q = typeof req.query.q === 'string' ? req.query.q.trim() : '';
    if (!q) {
      res.json({ success: true, data: [] });
      return;
    }

    const key = getNormalizedKey(q);

    // Fuzzy search canonical names and aliases
    const matchedSubjects = await (prisma as any).subject.findMany({
      where: {
        OR: [
          { canonical_name: { contains: q, mode: 'insensitive' } },
          { normalized_key: { contains: key } },
          {
            aliases: {
              some: {
                OR: [
                  { alias: { contains: q, mode: 'insensitive' } },
                  { normalized_key: { contains: key } }
                ]
              }
            }
          }
        ]
      },
      include: { aliases: true },
      take: 10
    });

    res.json({ success: true, data: matchedSubjects });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// POST /api/subjects
router.post('/', authenticateToken, authorize('admin', 'coordinator'), async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, short_name, code, description, aliases } = req.body;
    if (!name || name.trim() === '') {
      res.status(400).json({ success: false, message: 'Subject name is required' });
      return;
    }

    const canonical = await resolveCanonicalSubject(name);
    const key = getNormalizedKey(canonical);

    // Verify duplication
    const existing = await (prisma as any).subject.findUnique({
      where: { normalized_key: key }
    });

    if (existing) {
      res.status(400).json({ success: false, message: `Subject "${canonical}" already exists.` });
      return;
    }

    const result = await prisma.$transaction(async (tx) => {
      const subject = await (tx as any).subject.create({
        data: {
          canonical_name: canonical,
          normalized_key: key,
          short_name: short_name || null,
          code: code || null,
          description: description || null,
          is_active: true
        }
      });

      // Insert aliases if any provided
      if (aliases && Array.isArray(aliases)) {
        for (const alias of aliases) {
          const aliasTrim = String(alias).trim();
          if (aliasTrim) {
            const aliasKey = getNormalizedKey(aliasTrim);
            await (tx as any).subjectAlias.create({
              data: {
                subject_id: subject.id,
                alias: aliasTrim,
                normalized_key: aliasKey
              }
            }).catch(() => console.warn(`Alias "${aliasTrim}" already mapped elsewhere. Skipping.`));
          }
        }
      }

      return subject;
    });

    res.status(201).json({ success: true, data: result });
  } catch (error: any) {
    console.error(error);
    res.status(500).json({ success: false, message: error.message || 'Server error' });
  }
});

// PUT /api/subjects/:id
router.put('/:id', authenticateToken, authorize('admin', 'coordinator'), async (req: Request, res: Response): Promise<void> => {
  try {
    const id = paramId(req);
    const { canonical_name, short_name, code, description, is_active, aliases } = req.body;

    const existing = await (prisma as any).subject.findUnique({
      where: { id }
    });

    if (!existing) {
      res.status(404).json({ success: false, message: 'Subject not found' });
      return;
    }

    const oldName = existing.canonical_name;

    const result = await prisma.$transaction(async (tx) => {
      let dataToUpdate: any = {
        short_name: short_name !== undefined ? short_name : existing.short_name,
        code: code !== undefined ? code : existing.code,
        description: description !== undefined ? description : existing.description,
        is_active: is_active !== undefined ? is_active : existing.is_active
      };

      if (canonical_name && canonical_name.trim() !== oldName) {
        const canonical = await resolveCanonicalSubject(canonical_name);
        const key = getNormalizedKey(canonical);

        // check duplicate
        const duplicate = await (tx as any).subject.findFirst({
          where: { normalized_key: key, id: { not: id } }
        });
        if (duplicate) {
          throw new Error(`Another subject named "${canonical}" already exists.`);
        }

        dataToUpdate.canonical_name = canonical;
        dataToUpdate.normalized_key = key;

        // Cascade rename strings across other operational database tables
        await (tx as any).studentSubjectEnrollment.updateMany({ where: { subject: oldName }, data: { subject: canonical } });
        await (tx as any).class.updateMany({ where: { subject: oldName }, data: { subject: canonical } });
        await (tx as any).classSchedule.updateMany({ where: { subject: oldName }, data: { subject: canonical } });
        await (tx as any).timetable.updateMany({ where: { subject: oldName }, data: { subject: canonical } });
        await (tx as any).attendance.updateMany({ where: { subject: oldName }, data: { subject: canonical } });
        await (tx as any).test.updateMany({ where: { subject: oldName }, data: { subject: canonical } });
        await (tx as any).videoLecture.updateMany({ where: { subject: oldName }, data: { subject: canonical } });
        await (tx as any).studyMaterial.updateMany({ where: { subject: oldName }, data: { subject: canonical } });

      }

      const subject = await (tx as any).subject.update({
        where: { id },
        data: dataToUpdate
      });

      // Sync Aliases if provided
      if (aliases && Array.isArray(aliases)) {
        await (tx as any).subjectAlias.deleteMany({ where: { subject_id: id } });
        for (const alias of aliases) {
          const aliasTrim = String(alias).trim();
          if (aliasTrim) {
            const aliasKey = getNormalizedKey(aliasTrim);
            await (tx as any).subjectAlias.create({
              data: {
                subject_id: id,
                alias: aliasTrim,
                normalized_key: aliasKey
              }
            }).catch(() => console.warn(`Alias "${aliasTrim}" already mapped elsewhere. Skipping.`));
          }
        }
      }

      return subject;
    });

    res.json({ success: true, data: result });
  } catch (error: any) {
    console.error(error);
    res.status(400).json({ success: false, message: error.message || 'Server error' });
  }
});

// POST /api/subjects/merge
router.post('/merge', authenticateToken, authorize('admin', 'coordinator'), async (req: Request, res: Response): Promise<void> => {
  try {
    const { sourceSubjectId, targetSubjectId } = req.body;
    if (!sourceSubjectId || !targetSubjectId) {
      res.status(400).json({ success: false, message: 'Source and Target subject IDs are required' });
      return;
    }

    if (sourceSubjectId === targetSubjectId) {
      res.status(400).json({ success: false, message: 'Source and Target subject cannot be the same' });
      return;
    }

    const [source, target] = await Promise.all([
      (prisma as any).subject.findUnique({ where: { id: sourceSubjectId } }),
      (prisma as any).subject.findUnique({ where: { id: targetSubjectId } })
    ]);

    if (!source || !target) {
      res.status(404).json({ success: false, message: 'Source or Target subject not found in database' });
      return;
    }

    const sourceName = source.canonical_name;
    const targetName = target.canonical_name;

    await prisma.$transaction(async (tx) => {
      // 1. Remap all legacy/fragmented raw string references in all tables
      await (tx as any).studentSubjectEnrollment.updateMany({ where: { subject: sourceName }, data: { subject: targetName } });
      await (tx as any).class.updateMany({ where: { subject: sourceName }, data: { subject: targetName } });
      await (tx as any).classSchedule.updateMany({ where: { subject: sourceName }, data: { subject: targetName } });
      await (tx as any).timetable.updateMany({ where: { subject: sourceName }, data: { subject: targetName } });
      await (tx as any).attendance.updateMany({ where: { subject: sourceName }, data: { subject: targetName } });
      await (tx as any).test.updateMany({ where: { subject: sourceName }, data: { subject: targetName } });
      await (tx as any).videoLecture.updateMany({ where: { subject: sourceName }, data: { subject: targetName } });
      await (tx as any).studyMaterial.updateMany({ where: { subject: sourceName }, data: { subject: targetName } });

      // 2. Add source's canonical name as an alias of the target subject so that future mappings auto-resolve to the target
      await (tx as any).subjectAlias.create({
        data: {
          subject_id: target.id,
          alias: source.canonical_name,
          normalized_key: source.normalized_key
        }
      }).catch(() => console.log(`Merge alias already mapped. Skipping alias insertion.`));

      // 3. Move existing aliases from source to target
      await (tx as any).subjectAlias.updateMany({
        where: { subject_id: source.id },
        data: { subject_id: target.id }
      });

      // 4. Safely delete the source subject model
      await (tx as any).subject.delete({ where: { id: source.id } });
    });

    console.log(`🧹 [Subject Normalization] Merged duplicate "${sourceName}" into canonical "${targetName}" safely.`);

    res.json({ success: true, message: `Successfully merged "${sourceName}" into "${targetName}". All references updated.` });
  } catch (error: any) {
    console.error(error);
    res.status(500).json({ success: false, message: error.message || 'Server error merging subjects' });
  }
});

// DELETE /api/subjects/:id
router.delete('/:id', authenticateToken, authorize('admin', 'coordinator'), async (req: Request, res: Response): Promise<void> => {
  try {
    const id = paramId(req);
    const subject = await (prisma as any).subject.findUnique({ where: { id } });
    if (!subject) {
      res.status(404).json({ success: false, message: 'Subject not found' });
      return;
    }

    // Safety checks: Make sure it is not in use before deleting
    const timetableCount = await prisma.timetable.count({ where: { subject: subject.canonical_name } });
    if (timetableCount > 0) {
      res.status(400).json({
        success: false,
        message: `Subject is in use by ${timetableCount} timetable schedules. Use merge to clean up instead.`
      });
      return;
    }

    await (prisma as any).subject.delete({ where: { id } });
    res.json({ success: true, message: 'Subject deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

export default router;
