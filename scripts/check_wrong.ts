import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  // Get all unique fill/short questions
  const questions = await prisma.question.findMany({
    where: {
      questionType: { in: ['fill', 'short'] }
    },
    select: {
      id: true,
      questionText: true,
      correctAnswer: true,
      questionType: true
    }
  })

  console.log(`Found ${questions.length} fill/short questions\n`)

  // Group by correctAnswer to see unique answers
  const seen = new Set<string>()
  for (const q of questions) {
    const key = q.correctAnswer.trim().toLowerCase()
    if (seen.has(key)) continue
    seen.add(key)
    console.log(`Answer: "${q.correctAnswer}" | Q: ${q.questionText.substring(0, 80)}`)
  }
}

main().finally(async () => { await prisma.$disconnect() })
