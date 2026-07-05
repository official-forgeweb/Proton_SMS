import prisma from '../src/config/database';
import { generateTimetable } from '../src/services/schedulingEngine';

async function main() {
  console.log("=== Debugging Timetable Generator ===");
  const configs = await prisma.timetableConfig.findMany({
    include: { breaks: true }
  });
  console.log(`Found ${configs.length} class configurations in database.`);

  const classes = await prisma.class.findMany({
    select: { id: true, class_name: true }
  });
  const classMap = new Map(classes.map(c => [c.id, c.class_name]));

  const subjects = await prisma.subject.findMany({ select: { id: true, canonical_name: true } });
  const teachers = await prisma.teacher.findMany({ select: { id: true, first_name: true, last_name: true } });
  const subjectMap = new Map(subjects.map(s => [s.id, s.canonical_name]));
  const teacherMap = new Map(teachers.map(t => [t.id, `${t.first_name || ''} ${t.last_name || ''}`.trim()]));

  const classConfigs = configs.map(tc => {
    const freqs = JSON.parse(tc.subject_frequencies || '[]');
    return {
      class_id: tc.class_id,
      class_name: classMap.get(tc.class_id) || undefined,
      institute_start: tc.institute_start,
      institute_end: tc.institute_end,
      lecture_duration: tc.lecture_duration,
      working_days: tc.working_days,
      breaks: tc.breaks.map(b => ({
        break_name: b.break_name,
        after_period: b.after_period,
        duration_minutes: b.duration_minutes
      })),
      subjects: freqs.map((f: any) => ({
        subject_id: f.subject_id,
        subject_name: subjectMap.get(f.subject_id) || f.subject_id,
        teacher_id: f.teacher_id,
        teacher_name: f.teacher_id ? teacherMap.get(f.teacher_id) : 'Unassigned',
        weekly_count: Number(f.weekly_count) || 0
      }))
    };
  });

  console.log("Class configurations for engine:");
  console.log(JSON.stringify(classConfigs, null, 2));

  const result = generateTimetable(classConfigs, []);
  console.log("\n=== Generation Results ===");
  console.log(`Scheduled slots count: ${result.slots.length}`);
  console.log(`Conflicts count: ${result.conflicts.length}`);
  if (result.conflicts.length > 0) {
    console.log("Conflicts:", JSON.stringify(result.conflicts, null, 2));
  }
}

main()
  .catch(err => console.error(err))
  .finally(() => prisma.$disconnect());
