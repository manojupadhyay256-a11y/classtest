import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function test() {
  const r = await prisma.result.findUnique({ where: { id: 'cmo4iq1hq0006ky04juc2g2jk' }, include: { test: { include: { questions: true } } } })
  if (!r) return;
  console.log('SCORE IN DB:', r.score)
  let calcScore = 0;
  for (const q of r.test.questions) {
      const studentAnswer = r.answers[q.id]?.toString().trim() || ""
      const correctAnswer = q.correctAnswer.trim()
      let isCorrectNew = false

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

        isCorrectNew = studentPairs.length === correctPairs.length && 
                    studentPairs.every((p: string, i: number) => p === correctPairs[i])
      } else if (q.questionType === "jumbled") {
        isCorrectNew = studentAnswer.toLowerCase().replace(/\s+/g, "") === correctAnswer.toLowerCase().replace(/\s+/g, "")
      } else if (q.questionType === "fill" || q.questionType === "short") {
        const validAnswers = correctAnswer.split(",").map((a: string) => a.trim().toLowerCase())
        isCorrectNew = validAnswers.includes(studentAnswer.toLowerCase())
      } else {
        isCorrectNew = studentAnswer.toLowerCase() === correctAnswer.toLowerCase()
      }
      if (isCorrectNew) {
        calcScore += q.marks
      }
  }
  console.log('CALC SCORE:', calcScore)
}

test().finally(() => prisma.$disconnect())
