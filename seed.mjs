import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const pass = await bcrypt.hash('admin', 10);
  await prisma.teacher.upsert({
    where: { email: 'admin@school.com' },
    update: {},
    create: {
      name: 'Admin Teacher',
      email: 'admin@school.com',
      password: pass,
    },
  });
  console.log('Admin user seeded.');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
