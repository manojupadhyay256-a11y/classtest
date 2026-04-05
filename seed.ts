import { PrismaClient } from "@prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"
import { Pool } from "pg"
import bcrypt from "bcryptjs"
import "dotenv/config"

const connectionString = process.env.DATABASE_URL

if (!connectionString) {
  console.error("DATABASE_URL is not defined in .env")
  process.exit(1)
}

const pool = new Pool({ connectionString })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

async function main() {
  console.log("Seeding started...")
  
  // Seed Teacher
  const teacherPass = await bcrypt.hash("admin", 10)
  const teacher = await prisma.teacher.upsert({
    where: { email: "admin@school.com" },
    update: {},
    create: {
      name: "Admin Teacher",
      email: "admin@school.com",
      password: teacherPass,
    },
  })
  console.log(`Teacher seeded: ${teacher.email}`)

  // Seed Sample Student
  const studentPass = await bcrypt.hash("S12345", 10)
  const student = await prisma.student.upsert({
    where: { admno: "S12345" },
    update: {},
    create: {
      admno: "S12345",
      name: "Sample Student",
      class: "10",
      section: "A",
      password: studentPass,
    },
  })
  console.log(`Student seeded: ${student.admno}`)

  console.log("Seeding completed successfully!")
}

main()
  .catch((e) => {
    console.error("Seeding failed:")
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
    await pool.end()
  })
