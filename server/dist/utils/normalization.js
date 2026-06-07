"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.resolveSubjectRecord = exports.ensureSubjectExists = exports.resolveCanonicalSubject = exports.getNormalizedKey = void 0;
const database_1 = __importDefault(require("../config/database"));
/**
 * Standardizes a raw input subject name into a lowercased, trimmed, punctuation-free key.
 */
const getNormalizedKey = (name) => {
    if (!name)
        return '';
    // Lowercase, trim, and replace all multiple whitespaces/tabs with single space
    let clean = name.toLowerCase().trim().replace(/\s+/g, ' ');
    // Remove special characters, symbols, and punctuation
    clean = clean.replace(/[^a-zA-Z0-9\s]/g, '');
    // Pre-defined normalization mappings for standard curriculum subjects
    const mappings = {
        'math': 'mathematics',
        'maths': 'mathematics',
        'maths 11': 'mathematics',
        'maths 12': 'mathematics',
        'mathematics': 'mathematics',
        'physics': 'physics',
        'phy': 'physics',
        'phys': 'physics',
        'chemistry': 'chemistry',
        'chem': 'chemistry',
        'biology': 'biology',
        'bio': 'biology',
        'science': 'science',
        'social studies': 'socialscience',
        'social study': 'socialscience',
        'social science': 'socialscience',
        'sst': 'socialscience',
        'english': 'english',
        'eng': 'english',
        'hindi': 'hindi',
        'computer': 'computerscience',
        'computers': 'computerscience',
        'comp': 'computerscience',
        'computer science': 'computerscience',
        'cs': 'computerscience',
        'eco': 'economics',
        'economics': 'economics',
        'accounts': 'accounts',
        'acc': 'accounts'
    };
    return mappings[clean] || clean.replace(/\s+/g, '');
};
exports.getNormalizedKey = getNormalizedKey;
/**
 * Resolves a raw string to the canonical subject name on-the-fly.
 * 1. Checks hardcoded mappings.
 * 2. Queries database (Subject and SubjectAlias) to resolve alias associations.
 * 3. Falls back to a title-cased standard if no matches are found in database.
 */
const resolveCanonicalSubject = async (rawName) => {
    if (!rawName)
        return '';
    const key = (0, exports.getNormalizedKey)(rawName);
    try {
        // 1. Check if direct subject match exists in database
        const matchedSubject = await database_1.default.subject.findFirst({
            where: {
                OR: [
                    { normalized_key: key },
                    { canonical_name: { equals: rawName.trim(), mode: 'insensitive' } }
                ]
            }
        });
        if (matchedSubject) {
            return matchedSubject.canonical_name;
        }
        // 2. Check if a SubjectAlias matches this normalized key
        const matchedAlias = await database_1.default.subjectAlias.findFirst({
            where: { normalized_key: key },
            include: { subject: true }
        });
        if (matchedAlias && matchedAlias.subject) {
            return matchedAlias.subject.canonical_name;
        }
    }
    catch (dbErr) {
        console.error('[Normalization Engine] DB lookup failed, falling back to manual mapping:', dbErr);
    }
    // 3. Fallback manual resolution mapping
    const manualMappings = {
        'mathematics': 'Mathematics',
        'physics': 'Physics',
        'chemistry': 'Chemistry',
        'biology': 'Biology',
        'socialscience': 'Social Science',
        'english': 'English',
        'hindi': 'Hindi',
        'computerscience': 'Computer Science',
        'science': 'Science'
    };
    if (manualMappings[key]) {
        return manualMappings[key];
    }
    // 4. Default Title Case fallback: "math class" -> "Math Class"
    return rawName
        .trim()
        .split(/\s+/)
        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(' ');
};
exports.resolveCanonicalSubject = resolveCanonicalSubject;
/**
 * Validates and safely auto-creates a subject inline during operations if it is new.
 * Ensures duplicates are checked via normalization matches first.
 */
const ensureSubjectExists = async (name, createdByUserId) => {
    if (!name || name.trim() === '')
        return '';
    const canonical = await (0, exports.resolveCanonicalSubject)(name);
    const key = (0, exports.getNormalizedKey)(canonical);
    try {
        const existing = await database_1.default.subject.findUnique({
            where: { normalized_key: key }
        });
        if (!existing) {
            // Auto-create subject master record
            await database_1.default.subject.create({
                data: {
                    canonical_name: canonical,
                    normalized_key: key,
                    is_active: true
                }
            });
            console.log(`✨ [Normalization Engine] Inline auto-created new subject master: "${canonical}"`);
        }
    }
    catch (err) {
        // Graceful recovery in case of race condition database locks
        console.warn(`[Normalization Engine] Inline creation race condition: ${err.message}`);
    }
    return canonical;
};
exports.ensureSubjectExists = ensureSubjectExists;
/**
 * Resolves a raw subject identifier (which could be a UUID subject_id or a raw name string)
 * to a database Subject record, creating it if it doesn't exist.
 */
const resolveSubjectRecord = async (identifier) => {
    if (!identifier || identifier.trim() === '') {
        throw new Error('Subject identifier is required');
    }
    // 1. If it's a UUID, look it up by ID
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(identifier);
    if (isUUID) {
        const subject = await database_1.default.subject.findUnique({
            where: { id: identifier }
        });
        if (subject)
            return subject;
    }
    // 2. Otherwise normalize the string
    const canonical = await (0, exports.resolveCanonicalSubject)(identifier);
    const key = (0, exports.getNormalizedKey)(canonical);
    // Check if it exists
    let subject = await database_1.default.subject.findUnique({
        where: { normalized_key: key }
    });
    if (!subject) {
        // Auto-create subject master record
        subject = await database_1.default.subject.create({
            data: {
                canonical_name: canonical,
                normalized_key: key,
                is_active: true
            }
        });
        console.log(`✨ [Normalization Engine] Inline auto-created new subject master: "${canonical}"`);
    }
    return subject;
};
exports.resolveSubjectRecord = resolveSubjectRecord;
//# sourceMappingURL=normalization.js.map