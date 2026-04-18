import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const questions = await prisma.question.findMany({
    orderBy: { id: 'desc' },
    take: 5
  })

  console.log('--- LAST 5 QUESTIONS ---')
  questions.forEach(q => {
    console.log(`ID: ${q.id}`)
    console.log(`Type: ${q.questionType}`)
    console.log(`Text: ${q.questionText}`)
    console.log(`Correct Answer: "${q.correctAnswer}"`)
    console.log(`Hex: ${Buffer.from(q.correctAnswer).toString('hex')}`)
    console.log('---')
  })
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect())
