import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';
const prisma = new PrismaClient();
async function main() {
  const admin = await prisma.user.upsert({
    where: { email: 'admin@admin.com' },
    update: {
      firstName: 'ADMIN',
      lastName: 'SISTEMA',
      password: await bcrypt.hash('senha123', 10),
      profile: 'ADMIN',
    },
    create: {
      email: 'admin@admin.com',
      firstName: 'ADMIN',
      lastName: 'SISTEMA',
      password: await bcrypt.hash('senha123', 10),
      profile: 'ADMIN',
    },
  });
  const aluno = await prisma.user.upsert({
    where: { email: 'aluno@email.com' },
    update: {
      firstName: 'ALUNO',
      lastName: 'A',
      password: await bcrypt.hash('senha123', 10),
      profile: 'ALUNO',
    },
    create: {
      email: 'aluno@email.com',
      firstName: 'ALUNO',
      lastName: 'A',
      password: await bcrypt.hash('senha123', 10),
      profile: 'ALUNO',
      createdAt: new Date(),
    },
  });
  console.log({ admin, aluno });
}
main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
