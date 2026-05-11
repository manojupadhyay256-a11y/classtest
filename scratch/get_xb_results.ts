import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

async function main() {
  const results = await prisma.result.findMany({
    where: {
      student: {
        class: "X",
        section: "B"
      }
    },
    select: {
      id: true,
      testId: true,
      student: {
        select: {
          name: true,
          admno: true
        }
      }
    }
  })

  console.log(JSON.stringify(results, null, 2))
}

main()
  .catch(e => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
