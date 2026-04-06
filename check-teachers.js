const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function checkTeachers() {
  const teachers = await prisma.teacher.findMany()
  console.log('Teachers count:', teachers.length)
  if (teachers.length > 0) {
    console.log('Active teachers:', teachers.map(t => t.email))
  }
}

checkTeachers().finally(() => prisma.$disconnect())
