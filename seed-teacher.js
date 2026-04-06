const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')
const prisma = new PrismaClient()

async function seed() {
  const email = 'admin@admin.com' // Common admin email
  const password = await bcrypt.hash('admin123', 10)
  
  const teacher = await prisma.teacher.upsert({
    where: { email },
    update: {},
    create: {
      name: 'Admin Teacher',
      email,
      password
    }
  })
  
  console.log('Teacher seeded:', teacher.email)
}

seed().finally(() => prisma.$disconnect())
