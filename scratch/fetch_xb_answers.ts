import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

async function main() {
  const testId = "cmosoacwn0002ju04b7x657jk" // Logic and Computer Class X-B test
  const section = "B"

  console.log(`Fetching answers for Test: ${testId}, Section: ${section}`)

  const test = await prisma.test.findUnique({
    where: { id: testId },
    include: { questions: { orderBy: { order: "asc" } } }
  })

  if (!test) {
    console.error("Test not found")
    return
  }

  const results = await prisma.result.findMany({
    where: {
      testId: testId,
      student: {
        section: section
      }
    },
    include: {
      student: true
    }
  })

  console.log(`Found ${results.length} students.`)

  for (const result of results) {
    console.log(`\nStudent: ${result.student.name} (AdmNo: ${result.admno})`)
    console.log(`Current Score: ${result.score} / ${result.totalMarks}`)
    
    const answers = result.answers as Record<string, string>
    
    for (const question of test.questions) {
      if (question.questionType !== 'fill' && question.questionType !== 'short') continue

      const studentAnswer = answers[question.id]?.toString().trim() || ""
      const correctAnswer = question.correctAnswer.trim()
      
      // Check if student already got it right with deterministic grading
      const validAnswers = correctAnswer.split(",").map(a => a.trim().toLowerCase())
      const alreadyCorrect = validAnswers.includes(studentAnswer.toLowerCase())

      if (!alreadyCorrect && studentAnswer) {
        console.log(`  Question ${question.order}: ${question.questionText}`)
        console.log(`  Expected: ${question.correctAnswer}`)
        console.log(`  Student : ${studentAnswer}`)
      }
    }
  }
}

main()
  .catch(e => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
