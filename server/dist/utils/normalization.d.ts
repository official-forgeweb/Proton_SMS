/**
 * Standardizes a raw input subject name into a lowercased, trimmed, punctuation-free key.
 */
export declare const getNormalizedKey: (name: string) => string;
/**
 * Resolves a raw string to the canonical subject name on-the-fly.
 * 1. Checks hardcoded mappings.
 * 2. Queries database (Subject and SubjectAlias) to resolve alias associations.
 * 3. Falls back to a title-cased standard if no matches are found in database.
 */
export declare const resolveCanonicalSubject: (rawName: string) => Promise<string>;
/**
 * Validates and safely auto-creates a subject inline during operations if it is new.
 * Ensures duplicates are checked via normalization matches first.
 */
export declare const ensureSubjectExists: (name: string, createdByUserId?: string) => Promise<string>;
//# sourceMappingURL=normalization.d.ts.map