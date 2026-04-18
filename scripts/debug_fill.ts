import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  // Find ALL results submitted in the last 2 hours
  const recentResults = await prisma.result.findMany({
    orderBy: { submittedAt: 'desc' },
    take: 10,
    include: {
      student: { select: { name: true, admno: true } },
      test: { 
        include: { questions: true }
      }
    }
  })

  console.log(`\n=== MOST RECENT ${recentResults.length} RESULTS ===\n`)

  for (const r of recentResults) {
    console.log(`Student: ${r.student.name} (${r.admno})`)
    console.log(`Test: "${r.test.title}" (${r.testId})`)
    console.log(`Score: ${r.score}/${r.totalMarks}`)
    console.log(`Submitted: ${r.submittedAt}`)
    
    const answers = r.answers as Record<string, string>
    
    // Recalculate score
    let recalcScore = 0
    for (const q of r.test.questions) {
      const studentAnswer = answers[q.id]?.toString().trim() || ""
      const correctAnswer = q.correctAnswer.trim()
      let isCorrect = false

      if (q.questionType === "match") {
        const sp = studentAnswer.split("|").map(p => p.trim().toLowerCase()).filter(Boolean)
          .map(p => p.split(":").map(part => part.trim()).join(":")).sort()
        const cp = correctAnswer.split("|").map(p => p.trim().toLowerCase()).filter(Boolean)
          .map(p => p.split(":").map(part => part.trim()).join(":")).sort()
        isCorrect = sp.length === cp.length && sp.every((p, i) => p === cp[i])
      } else if (q.questionType === "jumbled") {
        isCorrect = studentAnswer.toLowerCase().replace(/\s+/g, "") === correctAnswer.toLowerCase().replace(/\s+/g, "")
      } else if (q.questionType === "fill" || q.questionType === "short") {
        const validAnswers = correctAnswer.split(",").map(a => a.trim().toLowerCase())
        isCorrect = validAnswers.includes(studentAnswer.toLowerCase())
      } else {
        isCorrect = studentAnswer.toLowerCase() === correctAnswer.toLowerCase()
      }

      if (q.questionType === "fill") {
        console.log(`  Q${q.order} [${q.questionType}]: student="${studentAnswer}" correct="${correctAnswer}" => ${isCorrect ? '✓ CORRECT' : '✗ WRONG'}`)
      }
      if (isCorrect) recalcScore += q.marks
    }
    
    console.log(`  Stored score: ${r.score}, Recalculated: ${recalcScore}`)
    if (r.score !== recalcScore) {
      console.log(`  ⚠️  SCORE MISMATCH! Stored=${r.score} vs Recalculated=${recalcScore}`)
    }
    console.log('---')
  }
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect())
