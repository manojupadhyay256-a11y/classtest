const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function testCreate() {
  const teacher = await prisma.teacher.findFirst()
  if (!teacher) {
    console.log("No teacher found, creating one...")
    // This might fail if schema has other requirements, but let's assume one exists or we can find it
    return
  }

  try {
    const test = await prisma.test.create({
      data: {
        title: "Test Test",
        subject: "Math",
        class: "6",
        sections: ["A"],
        duration: 40,
        startTime: new Date(),
        endTime: new Date(),
        createdBy: teacher.id
      }
    })
    console.log("Test creation success!", test.id)
  } catch (error) {
    console.error("Test creation FAILED:", error.message)
    if (error.code === 'P2002') console.log("Unique constraint violation")
  }
}

testCreate().finally(() => prisma.$disconnect())
