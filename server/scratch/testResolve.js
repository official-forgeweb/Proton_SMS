const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Copy of resolving functions from googleSheetSyncJob.ts
function resolveClass(rawClass, allClasses) {
  const clean = rawClass.trim().toLowerCase();
  if (!clean) return null;

  // 1. Direct match on name, code, or grade level
  let cls = allClasses.find(
    c =>
      c.class_name?.toLowerCase() === clean ||
      c.class_code?.toLowerCase() === clean ||
      c.grade_level?.toLowerCase() === clean
  );
  if (cls) return cls;

  // 2. Secondary matching: strip non-numeric
  const numbersOnly = clean.replace(/[^0-9]/g, '');
  if (numbersOnly) {
    cls = allClasses.find(
      c =>
        c.class_name?.includes(numbersOnly) ||
        c.class_code?.includes(numbersOnly) ||
        c.grade_level?.includes(numbersOnly)
    );
    if (cls) return cls;
  }
  return null;
}

const { getNormalizedKey } = require('../dist/utils/normalization');

function resolveSubject(rawSubject, allSubjects, allAliases) {
  const clean = rawSubject.trim().toLowerCase();
  if (!clean) return null;

  const key = getNormalizedKey(clean);

  // 1. Match canonical subjects by key or name
  let subj = allSubjects.find(s => s.normalized_key === key || s.canonical_name.toLowerCase() === clean);
  if (subj) return subj;

  // 2. Match aliases
  const alias = allAliases.find(a => a.normalized_key === key || a.alias.toLowerCase() === clean);
  if (alias) {
    const parentSubj = allSubjects.find(s => s.id === alias.subject_id);
    if (parentSubj) return parentSubj;
  }

  return null;
}

async function main() {
  const allClasses = await prisma.class.findMany();
  const allSubjects = await prisma.subject.findMany();
  const allAliases = await prisma.subjectAlias.findMany();
  const allClassSubjects = await prisma.classSubject.findMany();

  const classSubjectSet = new Set();
  allClassSubjects.forEach(cs => {
    classSubjectSet.add(`${cs.class_id}_${cs.subject_id}`);
  });

  const testCases = [
    { class: '9', subject: 'Science' },
    { class: '9th', subject: 'Science' },
    { class: '8th', subject: 'Science' },
    { class: '10', subject: 'Maths' },
    { class: '11', subject: 'Physics' },
    { class: '12', subject: 'Chemistry' },
    { class: '12th', subject: 'Eco' },
    { class: '12th', subject: 'Economics' }
  ];

  console.log('--- RESOLUTION TEST RESULTS ---');
  for (const tc of testCases) {
    const cls = resolveClass(tc.class, allClasses);
    const subj = resolveSubject(tc.subject, allSubjects, allAliases);
    
    if (!cls) {
      console.log(`❌ Class NOT resolved for input: "${tc.class}"`);
      continue;
    }
    if (!subj) {
      console.log(`❌ Subject NOT resolved for input: "${tc.subject}"`);
      continue;
    }
    
    const mapped = classSubjectSet.has(`${cls.id}_${subj.id}`);
    console.log(`Input: class="${tc.class}" subject="${tc.subject}"`);
    console.log(`  -> Resolved Class: "${cls.class_name}" (ID: ${cls.id})`);
    console.log(`  -> Resolved Subject: "${subj.canonical_name}" (ID: ${subj.id})`);
    console.log(`  -> Class-Subject Linked in DB: ${mapped ? '✅ YES' : '❌ NO'}`);
  }
}

main()
  .catch(e => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
  });
