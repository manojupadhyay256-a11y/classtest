const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
  const students = await prisma.student.findMany()
  const tests = await prisma.test.findMany()
  console.log('Total Students:', students.length)
  console.log('Total Tests:', tests.length)
  if (tests.length > 0) {
    console.log('First 2 Tests:', JSON.stringify(tests.slice(0, 2), null, 2))
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
