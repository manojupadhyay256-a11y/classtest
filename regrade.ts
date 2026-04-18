import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

async function regrade() {
  const results = await prisma.result.findMany({
    include: {
      test: {
        include: {
          questions: true
        }
      }
    }
  })

  for (const result of results) {
    let score = 0
    let totalMarks = 0

    result.test.questions.forEach(q => {
      const studentAnswer = (result.answers as Record<string, string>)[q.id]?.toString().trim() || ""
      const correctAnswer = q.correctAnswer.trim()
      
      let isCorrect = false
      
      if (q.questionType === "match") {
        const studentPairs = studentAnswer.split("|")
          .map((p: string) => p.trim().toLowerCase())
          .filter(Boolean)
          .map((p: string) => p.split(":").map(part => part.trim()).join(":"))
          .sort()
          
        const correctPairs = correctAnswer.split("|")
          .map((p: string) => p.trim().toLowerCase())
          .filter(Boolean)
          .map((p: string) => p.split(":").map(part => part.trim()).join(":"))
          .sort()

        isCorrect = studentPairs.length === correctPairs.length && 
                    studentPairs.every((p: string, i: number) => p === correctPairs[i])
      } else if (q.questionType === "jumbled") {
        isCorrect = studentAnswer.toLowerCase().replace(/\s+/g, "") === correctAnswer.toLowerCase().replace(/\s+/g, "")
      } else {
        isCorrect = studentAnswer.toLowerCase() === correctAnswer.toLowerCase()
      }

      if (isCorrect) {
        score += q.marks
      }
      totalMarks += q.marks
    })

    if (score !== result.score || totalMarks !== result.totalMarks) {
      console.log(`Updating result ${result.id} for student ${result.admno}: Score ${result.score} -> ${score}`)
      await prisma.result.update({
        where: { id: result.id },
        data: { score, totalMarks }
      })
    }
  }

  console.log("Regrading complete.")
}

regrade()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
