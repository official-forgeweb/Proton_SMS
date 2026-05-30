"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const database_1 = __importDefault(require("../config/database"));
const auth_1 = require("../middleware/auth");
const normalization_1 = require("../utils/normalization");
const router = (0, express_1.Router)();
const paramId = (req) => String(req.params.id);
// GET /api/subjects
router.get('/', auth_1.authenticateToken, async (req, res) => {
    try {
        const subjects = await database_1.default.subject.findMany({
            orderBy: { canonical_name: 'asc' },
            include: { aliases: true }
        });
        // Compute dynamic module usages in parallel for clean dashboards
        const enriched = await Promise.all(subjects.map(async (subj) => {
            const [timetableCount, testCount, materialCount, homeworkCount] = await Promise.all([
                database_1.default.timetable.count({ where: { subject: subj.canonical_name } }),
                database_1.default.test.count({ where: { subject: subj.canonical_name } }),
                database_1.default.studyMaterial.count({ where: { subject: subj.canonical_name } }),
                database_1.default.homework.count({ where: { class: { subject: subj.canonical_name } } }) // fallback class level
            ]);
            return {
                ...subj,
                timetable_usage: timetableCount,
                test_usage: testCount,
                material_usage: materialCount,
                homework_usage: homeworkCount,
                total_usage: timetableCount + testCount + materialCount + homeworkCount
            };
        }));
        res.json({ success: true, data: enriched });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});
// GET /api/subjects/search
router.get('/search', auth_1.authenticateToken, async (req, res) => {
    try {
        const q = typeof req.query.q === 'string' ? req.query.q.trim() : '';
        if (!q) {
            res.json({ success: true, data: [] });
            return;
        }
        const key = (0, normalization_1.getNormalizedKey)(q);
        // Fuzzy search canonical names and aliases
        const matchedSubjects = await database_1.default.subject.findMany({
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
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});
// POST /api/subjects
router.post('/', auth_1.authenticateToken, (0, auth_1.authorize)('admin', 'coordinator'), async (req, res) => {
    try {
        const { name, short_name, code, description, aliases } = req.body;
        if (!name || name.trim() === '') {
            res.status(400).json({ success: false, message: 'Subject name is required' });
            return;
        }
        const canonical = await (0, normalization_1.resolveCanonicalSubject)(name);
        const key = (0, normalization_1.getNormalizedKey)(canonical);
        // Verify duplication
        const existing = await database_1.default.subject.findUnique({
            where: { normalized_key: key }
        });
        if (existing) {
            res.status(400).json({ success: false, message: `Subject "${canonical}" already exists.` });
            return;
        }
        const result = await database_1.default.$transaction(async (tx) => {
            const subject = await tx.subject.create({
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
                        const aliasKey = (0, normalization_1.getNormalizedKey)(aliasTrim);
                        await tx.subjectAlias.create({
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
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: error.message || 'Server error' });
    }
});
// PUT /api/subjects/:id
router.put('/:id', auth_1.authenticateToken, (0, auth_1.authorize)('admin', 'coordinator'), async (req, res) => {
    try {
        const id = paramId(req);
        const { canonical_name, short_name, code, description, is_active, aliases } = req.body;
        const existing = await database_1.default.subject.findUnique({
            where: { id }
        });
        if (!existing) {
            res.status(404).json({ success: false, message: 'Subject not found' });
            return;
        }
        const oldName = existing.canonical_name;
        const result = await database_1.default.$transaction(async (tx) => {
            let dataToUpdate = {
                short_name: short_name !== undefined ? short_name : existing.short_name,
                code: code !== undefined ? code : existing.code,
                description: description !== undefined ? description : existing.description,
                is_active: is_active !== undefined ? is_active : existing.is_active
            };
            if (canonical_name && canonical_name.trim() !== oldName) {
                const canonical = await (0, normalization_1.resolveCanonicalSubject)(canonical_name);
                const key = (0, normalization_1.getNormalizedKey)(canonical);
                // check duplicate
                const duplicate = await tx.subject.findFirst({
                    where: { normalized_key: key, id: { not: id } }
                });
                if (duplicate) {
                    throw new Error(`Another subject named "${canonical}" already exists.`);
                }
                dataToUpdate.canonical_name = canonical;
                dataToUpdate.normalized_key = key;
                // Cascade rename strings across other operational database tables
                await tx.studentSubjectEnrollment.updateMany({ where: { subject: oldName }, data: { subject: canonical } });
                await tx.class.updateMany({ where: { subject: oldName }, data: { subject: canonical } });
                await tx.classSchedule.updateMany({ where: { subject: oldName }, data: { subject: canonical } });
                await tx.timetable.updateMany({ where: { subject: oldName }, data: { subject: canonical } });
                await tx.attendance.updateMany({ where: { subject: oldName }, data: { subject: canonical } });
                await tx.test.updateMany({ where: { subject: oldName }, data: { subject: canonical } });
                await tx.videoLecture.updateMany({ where: { subject: oldName }, data: { subject: canonical } });
                await tx.studyMaterial.updateMany({ where: { subject: oldName }, data: { subject: canonical } });
            }
            const subject = await tx.subject.update({
                where: { id },
                data: dataToUpdate
            });
            // Sync Aliases if provided
            if (aliases && Array.isArray(aliases)) {
                await tx.subjectAlias.deleteMany({ where: { subject_id: id } });
                for (const alias of aliases) {
                    const aliasTrim = String(alias).trim();
                    if (aliasTrim) {
                        const aliasKey = (0, normalization_1.getNormalizedKey)(aliasTrim);
                        await tx.subjectAlias.create({
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
    }
    catch (error) {
        console.error(error);
        res.status(400).json({ success: false, message: error.message || 'Server error' });
    }
});
// POST /api/subjects/merge
router.post('/merge', auth_1.authenticateToken, (0, auth_1.authorize)('admin', 'coordinator'), async (req, res) => {
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
            database_1.default.subject.findUnique({ where: { id: sourceSubjectId } }),
            database_1.default.subject.findUnique({ where: { id: targetSubjectId } })
        ]);
        if (!source || !target) {
            res.status(404).json({ success: false, message: 'Source or Target subject not found in database' });
            return;
        }
        const sourceName = source.canonical_name;
        const targetName = target.canonical_name;
        await database_1.default.$transaction(async (tx) => {
            // 1. Remap all legacy/fragmented raw string references in all tables
            await tx.studentSubjectEnrollment.updateMany({ where: { subject: sourceName }, data: { subject: targetName } });
            await tx.class.updateMany({ where: { subject: sourceName }, data: { subject: targetName } });
            await tx.classSchedule.updateMany({ where: { subject: sourceName }, data: { subject: targetName } });
            await tx.timetable.updateMany({ where: { subject: sourceName }, data: { subject: targetName } });
            await tx.attendance.updateMany({ where: { subject: sourceName }, data: { subject: targetName } });
            await tx.test.updateMany({ where: { subject: sourceName }, data: { subject: targetName } });
            await tx.videoLecture.updateMany({ where: { subject: sourceName }, data: { subject: targetName } });
            await tx.studyMaterial.updateMany({ where: { subject: sourceName }, data: { subject: targetName } });
            // 2. Add source's canonical name as an alias of the target subject so that future mappings auto-resolve to the target
            await tx.subjectAlias.create({
                data: {
                    subject_id: target.id,
                    alias: source.canonical_name,
                    normalized_key: source.normalized_key
                }
            }).catch(() => console.log(`Merge alias already mapped. Skipping alias insertion.`));
            // 3. Move existing aliases from source to target
            await tx.subjectAlias.updateMany({
                where: { subject_id: source.id },
                data: { subject_id: target.id }
            });
            // 4. Safely delete the source subject model
            await tx.subject.delete({ where: { id: source.id } });
        });
        console.log(`🧹 [Subject Normalization] Merged duplicate "${sourceName}" into canonical "${targetName}" safely.`);
        res.json({ success: true, message: `Successfully merged "${sourceName}" into "${targetName}". All references updated.` });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: error.message || 'Server error merging subjects' });
    }
});
// DELETE /api/subjects/:id
router.delete('/:id', auth_1.authenticateToken, (0, auth_1.authorize)('admin', 'coordinator'), async (req, res) => {
    try {
        const id = paramId(req);
        const subject = await database_1.default.subject.findUnique({ where: { id } });
        if (!subject) {
            res.status(404).json({ success: false, message: 'Subject not found' });
            return;
        }
        // Safety checks: Make sure it is not in use before deleting
        const timetableCount = await database_1.default.timetable.count({ where: { subject: subject.canonical_name } });
        if (timetableCount > 0) {
            res.status(400).json({
                success: false,
                message: `Subject is in use by ${timetableCount} timetable schedules. Use merge to clean up instead.`
            });
            return;
        }
        await database_1.default.subject.delete({ where: { id } });
        res.json({ success: true, message: 'Subject deleted successfully' });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});
exports.default = router;
//# sourceMappingURL=subjects.js.map