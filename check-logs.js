const { PrismaClient } = require("@prisma/client")

const prisma = new PrismaClient()

async function main() {
  try {
    const list = await prisma.loginLog.findMany({
      take: 10,
      orderBy: { timestamp: "desc" }
    })
    console.log("Total logs count: ", list.length)
    console.log("Latest logs: ", JSON.stringify(list, null, 2))
  } catch (error) {
    console.error("Prisma Error: ", error)
  } finally {
    await prisma.$disconnect()
  }
}

main()
