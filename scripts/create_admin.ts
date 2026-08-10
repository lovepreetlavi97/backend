import { PrismaClient, Role } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const email = 'admin@gmail.com';
  const plainPassword = '123456';
  const hashedPassword = await bcrypt.hash(plainPassword, 10);

  const admin = await prisma.admin.upsert({
    where: { email },
    update: {
      password: hashedPassword,
      role: Role.SUPERADMIN,
      isActive: true,
    },
    create: {
      name: 'Admin User',
      email,
      password: hashedPassword,
      role: Role.SUPERADMIN,
      permissions: ['ALL'],
      isActive: true,
    },
  });

  console.log('✅ Admin user successfully upserted:');
  console.log('   Email:', admin.email);
  console.log('   Role:', admin.role);
}

main()
  .catch((e) => {
    console.error('❌ Error creating admin user:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
