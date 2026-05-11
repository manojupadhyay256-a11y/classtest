import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

async function main() {
  const updates = [
    { admno: "8747", name: "PIYUSH PATASARIYA", additional: 1 },
    { admno: "11582", name: "JANVI SINGH", additional: 1 },
    { admno: "8646", name: "KRITI GUPTA", additional: 6 },
    { admno: "11558", name: "NAVYA AGRAWAL", additional: 4 },
    { admno: "8762", name: "HARSHIT CHANDRA", additional: 3 },
    { admno: "9355", name: "NUZHAT KHAN", additional: 6 },
    { admno: "11022", name: "TEJAS PARASHAR", additional: 2 }
  ]

  const testId = "cmosoacwn0002ju04b7x657jk"

  console.log("Applying manual regrade updates for Class X-B...")

  for (const update of updates) {
    const result = await prisma.result.findFirst({
      where: {
        testId: testId,
        admno: update.admno
      }
    })

    if (result) {
      const newScore = result.score + update.additional
      await prisma.result.update({
        where: { id: result.id },
        data: { score: newScore }
      })
      console.log(`Updated ${update.name}: ${result.score} -> ${newScore}`)
    } else {
      console.error(`Result not found for ${update.name} (${update.admno})`)
    }
  }

  console.log("All updates applied successfully.")
}

main()
  .catch(e => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
