const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  const result = await prisma.teacher.update({
    where: { email: "admin@admin.com" },
    data: { name: "Admin(Manoj Upadhyay)" }
  });
  console.log("Updated admin name to:", result.name);
}

main().catch(console.error).finally(() => prisma.$disconnect());
