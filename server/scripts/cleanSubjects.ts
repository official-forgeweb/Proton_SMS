import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Inline normalization logic matching backend utility exactly to ensure robustness
const getNormalizedKey = (name: string): string => {
  if (!name) return '';
  let clean = name.toLowerCase().trim().replace(/\s+/g, ' ');
  clean = clean.replace(/[^a-zA-Z0-9\s]/g, '');

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
    'social studies': 'sst',
    'social study': 'sst',
    'social science': 'sst',
    'sst': 'sst',
    'english': 'english',
    'eng': 'english',
    'hindi': 'hindi',
    'computer': 'computer',
    'comp': 'computer',
    'computer science': 'computer',
    'cs': 'computer'
  };

  return mappings[clean] || clean.replace(/\s+/g, '');
};

const resolveCanonicalSubject = (rawName: string): string => {
  if (!rawName) return '';
  const key = getNormalizedKey(rawName);

  const manualMappings: Record<string, string> = {
    'mathematics': 'Mathematics',
    'physics': 'Physics',
    'chemistry': 'Chemistry',
    'biology': 'Biology',
    'sst': 'SST',
    'english': 'English',
    'hindi': 'Hindi',
    'computer': 'Computer',
    'science': 'Science'
  };

  if (manualMappings[key]) {
    return manualMappings[key];
  }

  // Title Case fallback
  return rawName
    .trim()
    .split(/\s+/)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
};

async function main() {
  console.log('🚀 [Subject Normalization] Starting legacy data migration & seeding...');

  try {
    // 1. Gather all unique subject strings across all tables
    const uniqueRawSubjects = new Set<string>();

    const tablesWithSubjects = [
      { name: 'studentSubjectEnrollment', model: prisma.studentSubjectEnrollment, isRequired: true },
      { name: 'class', model: prisma.class, isRequired: false },
      { name: 'classSchedule', model: prisma.classSchedule, isRequired: false },
      { name: 'timetable', model: prisma.timetable, isRequired: true },
      { name: 'attendance', model: prisma.attendance, isRequired: false },
      { name: 'test', model: prisma.test, isRequired: false },
      { name: 'videoLecture', model: prisma.videoLecture, isRequired: true },
      { name: 'studyMaterial', model: prisma.studyMaterial, isRequired: true },
    ];

    for (const entry of tablesWithSubjects) {
      console.log(`🔍 Fetching subjects from "${entry.name}" table...`);
      // @ts-ignore
      const records = await entry.model.findMany({
        select: { subject: true }
      });
      for (const rec of records) {
        if (rec.subject) {
          uniqueRawSubjects.add(rec.subject);
        }
      }
    }

    console.log(`📋 Found ${uniqueRawSubjects.size} unique raw subject names in database:`, Array.from(uniqueRawSubjects));

    // 2. Establish basic standard canonical seeds
    const standardSeeds = [
      'Mathematics',
      'Physics',
      'Chemistry',
      'Biology',
      'Science',
      'SST',
      'English',
      'Hindi',
      'Computer'
    ];

    // Seed default standard subjects first
    for (const seed of standardSeeds) {
      const normalizedKey = getNormalizedKey(seed);
      // @ts-ignore
      const existing = await prisma.subject.findUnique({
        where: { normalized_key: normalizedKey }
      });

      if (!existing) {
        // @ts-ignore
        await prisma.subject.create({
          data: {
            canonical_name: seed,
            normalized_key: normalizedKey,
            is_active: true
          }
        });
        console.log(`✨ Seeded default master subject: "${seed}"`);
      }
    }

    // 3. Resolve all existing raw subject strings to canonical and populate tables
    const subjectMappings: Record<string, string> = {}; // rawName -> canonicalName

    for (const rawName of uniqueRawSubjects) {
      const canonical = resolveCanonicalSubject(rawName);
      const canonicalKey = getNormalizedKey(canonical);
      const rawKey = getNormalizedKey(rawName);

      // Check if canonical subject exists in Subject model
      // @ts-ignore
      let subjectRecord = await prisma.subject.findUnique({
        where: { normalized_key: canonicalKey }
      });

      if (!subjectRecord) {
        // Create canonical subject master
        // @ts-ignore
        subjectRecord = await prisma.subject.create({
          data: {
            canonical_name: canonical,
            normalized_key: canonicalKey,
            is_active: true
          }
        });
        console.log(`✨ Created new canonical subject from data: "${canonical}"`);
      }

      subjectMappings[rawName] = canonical;

      // If the raw name is different from the canonical name, create it as an alias
      if (rawName.trim().toLowerCase() !== canonical.trim().toLowerCase()) {
        // Check if alias already exists
        // @ts-ignore
        const existingAlias = await prisma.subjectAlias.findUnique({
          where: { normalized_key: rawKey }
        });

        if (!existingAlias) {
          try {
            // @ts-ignore
            await prisma.subjectAlias.create({
              data: {
                subject_id: subjectRecord.id,
                alias: rawName.trim(),
                normalized_key: rawKey
              }
            });
            console.log(`🔗 Created alias: "${rawName.trim()}" -> "${canonical}"`);
          } catch (aliasErr) {
            // Silence potential unique constraint races
          }
        }
      }
    }

    // 4. Run updateMany transactions across all tables to cascade the changes
    console.log('🔄 Remapping raw subject strings to canonical counterparts in the database...');
    
    await prisma.$transaction(async (tx) => {
      for (const [rawName, canonicalName] of Object.entries(subjectMappings)) {
        if (rawName === canonicalName) continue;

        console.log(`  ⚡ Remapping "${rawName}" ➔ "${canonicalName}"...`);
        // @ts-ignore
        await tx.studentSubjectEnrollment.updateMany({ where: { subject: rawName }, data: { subject: canonicalName } });
        // @ts-ignore
        await tx.class.updateMany({ where: { subject: rawName }, data: { subject: canonicalName } });
        // @ts-ignore
        await tx.classSchedule.updateMany({ where: { subject: rawName }, data: { subject: canonicalName } });
        // @ts-ignore
        await tx.timetable.updateMany({ where: { subject: rawName }, data: { subject: canonicalName } });
        // @ts-ignore
        await tx.attendance.updateMany({ where: { subject: rawName }, data: { subject: canonicalName } });
        // @ts-ignore
        await tx.test.updateMany({ where: { subject: rawName }, data: { subject: canonicalName } });
        // @ts-ignore
        await tx.videoLecture.updateMany({ where: { subject: rawName }, data: { subject: canonicalName } });
        // @ts-ignore
        await tx.studyMaterial.updateMany({ where: { subject: rawName }, data: { subject: canonicalName } });
      }
    });

    console.log('✅ [Subject Normalization] Legacy database migration & seed complete! All records normalized.');

  } catch (error) {
    console.error('❌ Migration failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
