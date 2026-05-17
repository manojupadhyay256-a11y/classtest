const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();

async function main() {
  // Find the RDBMS test
  const tests = await p.test.findMany({
    where: { title: { contains: 'RDBMS' } },
    include: { questions: { orderBy: { order: 'asc' } } }
  });

  for (const test of tests) {
    console.log('\n=== Test:', test.title, '| ID:', test.id, '===');
    console.log('Questions:', test.questions.length);
    
    test.questions.forEach(q => {
      console.log(`  Q${q.order}: [${q.questionType}] "${q.questionText.substring(0, 60)}" | CorrectAns: "${q.correctAnswer.substring(0, 40)}"`);
    });

    // Find results for this test
    const results = await p.result.findMany({
      where: { testId: test.id },
      include: { student: { select: { name: true, admno: true } } }
    });

    for (const res of results) {
      console.log(`\n  Student: ${res.student.name} (${res.admno}) | Score: ${res.score}/${res.totalMarks}`);
      const answers = res.answers;
      console.log('  Answers:', JSON.stringify(answers, null, 2));
      
      // Check which question IDs match
      const fillShort = test.questions.filter(q => q.questionType === 'fill' || q.questionType === 'short');
      console.log(`  Fill/Short questions: ${fillShort.length}`);
      
      for (const q of fillShort) {
        const studentAns = answers[q.id]?.toString().trim() || '';
        console.log(`    Q${q.order} [${q.questionType}] "${q.questionText.substring(0, 40)}" -> Student: "${studentAns}" | Empty: ${!studentAns}`);
      }
    }
  }

  await p.$disconnect();
}

main().catch(console.error);
