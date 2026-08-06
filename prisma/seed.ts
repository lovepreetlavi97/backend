import { PrismaClient, Role, MetalType } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting PostgreSQL database seed...');

  const hashedPassword = await bcrypt.hash('AdminPassword@2026', 10);

  // 1. Create SuperAdmin Account
  const admin = await prisma.admin.upsert({
    where: { email: 'admin@gurujewellers.com' },
    update: {
      password: hashedPassword,
      role: Role.SUPERADMIN,
      isActive: true,
    },
    create: {
      name: 'Super Admin',
      email: 'admin@gurujewellers.com',
      password: hashedPassword,
      role: Role.SUPERADMIN,
      permissions: ['ALL', 'MANAGE_USERS', 'MANAGE_PRODUCTS', 'MANAGE_ORDERS', 'MANAGE_KITTY'],
      isActive: true,
    },
  });

  console.log('✅ SuperAdmin Account Created:', admin.email);

  // 2. Create Demo User Account
  const userPassword = await bcrypt.hash('UserPassword@2026', 10);
  const user = await prisma.user.upsert({
    where: { email: 'customer@gurujewellers.com' },
    update: {
      password: userPassword,
      isActive: true,
    },
    create: {
      name: 'Demo Customer',
      email: 'customer@gurujewellers.com',
      password: userPassword,
      role: Role.USER,
      phone: '+919876543210',
      isActive: true,
    },
  });

  console.log('✅ Demo Customer Account Created:', user.email);

  // 3. Create Default Metal Rates
  const goldMetal = await prisma.metal.upsert({
    where: { name: '22K Gold' },
    update: { 
      ratePerGram: 6850.00,
      slug: 'gold',
      colorCode: '#c5a059',
      gradient: 'linear-gradient(to right, #c5a059, #e0c283)',
      isActive: true,
    },
    create: {
      name: '22K Gold',
      slug: 'gold',
      type: MetalType.GOLD,
      ratePerGram: 6850.00,
      purity: '916',
      colorCode: '#c5a059',
      gradient: 'linear-gradient(to right, #c5a059, #e0c283)',
      isActive: true,
    },
  });

  const silverMetal = await prisma.metal.upsert({
    where: { name: '925 Silver' },
    update: { 
      ratePerGram: 88.50,
      slug: 'silver',
      colorCode: '#a0a0a0',
      gradient: 'linear-gradient(to right, #a0a0a0, #d0d0d0)',
      isActive: true,
    },
    create: {
      name: '925 Silver',
      slug: 'silver',
      type: MetalType.SILVER,
      ratePerGram: 88.50,
      purity: '925',
      colorCode: '#a0a0a0',
      gradient: 'linear-gradient(to right, #a0a0a0, #d0d0d0)',
      isActive: true,
    },
  });

  console.log('✅ Default Metals Created (Gold & Silver)');

  // 4. Create Default Price Rule
  const priceRule = await prisma.priceRule.create({
    data: {
      name: 'Standard Jewellery Pricing Rule',
      makingChargeGram: 450.00,
      gstPercentage: 3.00,
      discountPercent: 0.00,
    },
  }).catch(() => null);

  // 5. Create Default Category
  const category = await prisma.category.upsert({
    where: { slug: 'jewelry' },
    update: {},
    create: {
      name: 'Jewelry',
      slug: 'jewelry',
      description: 'Handcrafted gold and silver fine jewelry collection',
      isFeatured: true,
    },
  });

  console.log('✅ Category Created:', category.name);

  // 6. Create Default Gold Savings Kitty Plan
  const kittyPlan = await prisma.kittyPlan.create({
    data: {
      name: 'Swarna Savings 11-Month Plan',
      totalMonths: 11,
      monthlyAmount: 5000.00,
      bonusMonths: 1.0,
      metalType: MetalType.GOLD,
      description: 'Pay 11 monthly installments and get 100% bonus month contribution on maturity!',
      isActive: true,
    },
  }).catch(() => null);

  console.log('✅ Gold Kitty Plan Created');

  console.log('\n🎉 Database Seed Completed Successfully!');
  console.log('--------------------------------------------------');
  console.log('🔑 ADMIN CREDENTIALS:');
  console.log('   Email:    admin@gurujewellers.com');
  console.log('   Password: AdminPassword@2026');
  console.log('--------------------------------------------------');
  console.log('👤 CUSTOMER CREDENTIALS:');
  console.log('   Email:    customer@gurujewellers.com');
  console.log('   Password: UserPassword@2026');
  console.log('--------------------------------------------------');
}

main()
  .catch((e) => {
    console.error('❌ Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
