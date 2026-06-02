import prisma from '../config/database';

/**
 * Standardizes a raw input subject name into a lowercased, trimmed, punctuation-free key.
 */
export const getNormalizedKey = (name: string): string => {
  if (!name) return '';
  
  // Lowercase, trim, and replace all multiple whitespaces/tabs with single space
  let clean = name.toLowerCase().trim().replace(/\s+/g, ' ');
  
  // Remove special characters, symbols, and punctuation
  clean = clean.replace(/[^a-zA-Z0-9\s]/g, '');

  // Pre-defined normalization mappings for standard curriculum subjects
  const mappings: Record<string, string> = {
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
    'cs': 'computerscience'
  };

  return mappings[clean] || clean.replace(/\s+/g, '');
};

/**
 * Resolves a raw string to the canonical subject name on-the-fly.
 * 1. Checks hardcoded mappings.
 * 2. Queries database (Subject and SubjectAlias) to resolve alias associations.
 * 3. Falls back to a title-cased standard if no matches are found in database.
 */
export const resolveCanonicalSubject = async (rawName: string): Promise<string> => {
  if (!rawName) return '';
  const key = getNormalizedKey(rawName);
  
  try {
    // 1. Check if direct subject match exists in database
    const matchedSubject = await prisma.subject.findFirst({
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
    const matchedAlias = await prisma.subjectAlias.findFirst({
      where: { normalized_key: key },
      include: { subject: true }
    });

    if (matchedAlias && matchedAlias.subject) {
      return matchedAlias.subject.canonical_name;
    }
  } catch (dbErr) {
    console.error('[Normalization Engine] DB lookup failed, falling back to manual mapping:', dbErr);
  }

  // 3. Fallback manual resolution mapping
  const manualMappings: Record<string, string> = {
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

/**
 * Validates and safely auto-creates a subject inline during operations if it is new.
 * Ensures duplicates are checked via normalization matches first.
 */
export const ensureSubjectExists = async (name: string, createdByUserId?: string): Promise<string> => {
  if (!name || name.trim() === '') return '';
  const canonical = await resolveCanonicalSubject(name);
  const key = getNormalizedKey(canonical);

  try {
    const existing = await prisma.subject.findUnique({
      where: { normalized_key: key }
    });

    if (!existing) {
      // Auto-create subject master record
      await prisma.subject.create({
        data: {
          canonical_name: canonical,
          normalized_key: key,
          is_active: true
        }
      });
      console.log(`✨ [Normalization Engine] Inline auto-created new subject master: "${canonical}"`);
    }
  } catch (err: any) {
    // Graceful recovery in case of race condition database locks
    console.warn(`[Normalization Engine] Inline creation race condition: ${err.message}`);
  }

  return canonical;
};
