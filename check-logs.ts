import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

async function main() {
  const count = await prisma.loginLog.count()
  console.log(`Total login logs: ${count}`)
  
  const lastLogs = await prisma.loginLog.findMany({
    take: 5,
    orderBy: { timestamp: 'desc' }
  })
  
  console.log("Last 5 logs:")
  console.dir(lastLogs, { depth: null })
}

main()
  .catch(e => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
