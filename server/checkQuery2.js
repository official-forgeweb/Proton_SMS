const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
    let where = {};
    const classIds = ["fb07aa01-5efe-41e9-a784-06fcef41de0c"];
    const subjectEnrolls = ["Physics "];
    const subjectsByClass = {
        "fb07aa01-5efe-41e9-a784-06fcef41de0c": ["Physics "]
    };

    const orConditions = classIds.map(cid => {
        const subjects = subjectsByClass[cid];
        if (subjects && subjects.length > 0) {
            return {
                class_id: cid,
                OR: subjects.map(s => ({
                    subject: { equals: s.trim(), mode: 'insensitive' }
                }))
            };
        }
        return { class_id: cid };
    });

    if (where.OR) {
        where.AND = [ { OR: where.OR }, { OR: orConditions } ];
        delete where.OR;
    } else {
        where.OR = orConditions;
    }
    
    console.log('Where clause:', JSON.stringify(where, null, 2));
    
    const res = await prisma.videoLecture.findMany({ where });
    console.log('Result count:', res.length);
}
main().finally(() => prisma.$disconnect());
