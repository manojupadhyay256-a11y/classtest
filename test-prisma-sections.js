const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
  const test = await prisma.test.findFirst({
    where: {
      sections: { has: 'A' }
    }
  })
  console.log('Query success! Sections field is accessible.')
}

main()
  .catch(e => {
    console.error('Query failed! Sections field is NOT accessible:', e.message)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
