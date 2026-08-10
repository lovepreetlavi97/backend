import { PrismaClient, Role, MetalType } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

// Helper to copy files recursively
function copyFolderSync(from: string, to: string) {
  if (!fs.existsSync(from)) return;
  if (!fs.existsSync(to)) {
    fs.mkdirSync(to, { recursive: true });
  }
  fs.readdirSync(from).forEach((element) => {
    const stat = fs.lstatSync(path.join(from, element));
    if (stat.isFile()) {
      fs.copyFileSync(path.join(from, element), path.join(to, element));
    } else if (stat.isDirectory()) {
      copyFolderSync(path.join(from, element), path.join(to, element));
    }
  });
}

async function main() {
  console.log('🌱 Starting complete PostgreSQL database seeding and asset migration...');

  // --- 1. Migrate Static Assets ---
  const websitePublicDir = path.join(__dirname, '../../website/public');
  const backendUploadsDir = path.join(__dirname, '../public/uploads');

  console.log('📂 Migrating assets...');

  // Copy categories images
  copyFolderSync(
    path.join(websitePublicDir, 'images/categories'),
    path.join(backendUploadsDir, 'categories')
  );
  // Copy gifts images
  copyFolderSync(
    path.join(websitePublicDir, 'images/gifts'),
    path.join(backendUploadsDir, 'gifts')
  );
  // Copy banners/root images
  if (!fs.existsSync(path.join(backendUploadsDir, 'banners'))) {
    fs.mkdirSync(path.join(backendUploadsDir, 'banners'), { recursive: true });
  }
  const rootImagesToCopy = [
    'banner gold.webp',
    'silver banner.webp',
    'silver banner1.webp',
    'silverbanner5.webp',
    'silverbanner8.webp',
    'silverbanner9.webp',
    'silverbnaner3.webp',
    'diamondbanner12.jpg',
    'diamondbanner122.webp',
    'gold banner.jpg',
    'gold banner 1.webp',
    'logo.png',
  ];
  rootImagesToCopy.forEach((img) => {
    const srcPath = path.join(websitePublicDir, img);
    if (fs.existsSync(srcPath)) {
      fs.copyFileSync(srcPath, path.join(backendUploadsDir, 'banners', img));
    }
  });

  // Copy products images if they exist in images/
  copyFolderSync(
    path.join(websitePublicDir, 'images'),
    path.join(backendUploadsDir, 'products')
  );

  console.log('✅ Asset migration completed successfully.');

  // --- 2. Seed SuperAdmin and Demo Customers ---
  const hashedPassword = await bcrypt.hash('AdminPassword@2026', 10);
  const admin = await prisma.admin.upsert({
    where: { email: 'admin@gurujewellers.com' },
    update: { password: hashedPassword, role: Role.SUPERADMIN },
    create: {
      name: 'Super Admin',
      email: 'admin@gurujewellers.com',
      password: hashedPassword,
      role: Role.SUPERADMIN,
      permissions: ['ALL'],
      isActive: true,
    },
  });
  console.log('✅ SuperAdmin Account seeded:', admin.email);

  const userPassword = await bcrypt.hash('UserPassword@2026', 10);
  const user = await prisma.user.upsert({
    where: { email: 'customer@gurujewellers.com' },
    update: { password: userPassword },
    create: {
      name: 'Demo Customer',
      email: 'customer@gurujewellers.com',
      password: userPassword,
      role: Role.USER,
      phone: '+919876543210',
      isActive: true,
    },
  });
  console.log('✅ Demo Customer Account seeded:', user.email);

  // --- 3. Seed Metals ---
  const goldMetal = await prisma.metal.upsert({
    where: { slug: 'gold' },
    update: { ratePerGram: 6850.00, isActive: true },
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
    where: { slug: 'silver' },
    update: { ratePerGram: 88.50, isActive: true },
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
  console.log('✅ Metals Gold and Silver seeded.');

  // --- 4. Seed Price Rules ---
  let priceRule = await prisma.priceRule.findFirst({
    where: { name: 'Standard Jewellery Pricing Rule' },
  });
  if (!priceRule) {
    priceRule = await prisma.priceRule.create({
      data: {
        name: 'Standard Jewellery Pricing Rule',
        makingChargeGram: 450.00,
        gstPercentage: 3.00,
        discountPercent: 0.00,
      },
    });
  }
  console.log('✅ Price Rule seeded.');

  // --- 5. Seed Category & Subcategories ---
  const category = await prisma.category.upsert({
    where: { slug: 'jewelry' },
    update: {},
    create: {
      name: 'Jewelry',
      slug: 'jewelry',
      description: 'Handcrafted gold and silver fine jewelry collection',
      isFeatured: true,
      image: '/uploads/banners/logo.png',
    },
  });

  const subcategoryData = [
    { name: 'Rings', slug: 'rings', image: '/uploads/categories/rings.svg' },
    { name: 'Earrings', slug: 'earrings', image: '/uploads/categories/earrings.svg' },
    { name: 'Necklaces', slug: 'necklaces', image: '/uploads/categories/necklace.svg' },
    { name: 'Bracelets', slug: 'bracelets', image: '/uploads/categories/bracelets.svg' },
    { name: 'Pendants', slug: 'pendants', image: '/uploads/categories/pendants.svg' },
  ];

  const subcategories: Record<string, any> = {};
  for (const sub of subcategoryData) {
    let dbSub = await prisma.subCategory.findUnique({
      where: { slug: sub.slug },
    });
    if (!dbSub) {
      dbSub = await prisma.subCategory.create({
        data: {
          categoryId: category.id,
          name: sub.name,
          slug: sub.slug,
          image: sub.image,
          description: `Handcrafted premium ${sub.name.toLowerCase()}`,
        },
      });
    }
    subcategories[sub.slug] = dbSub;
  }
  console.log('✅ Category and Subcategories seeded.');

  // --- 6. Seed Products ---
  const productData = [
    {
      title: 'Royal Heritage Necklace',
      slug: 'royal-heritage-necklace',
      sku: 'GJ-GLD-NK-001',
      description: 'Exquisite 22K BIS Hallmarked gold necklace featuring traditional hand-carved heritage motifs.',
      images: ['/uploads/products/Her.png'],
      weightGrams: 25.50,
      stockQuantity: 10,
      isFeatured: true,
      metalId: goldMetal.id,
      categoryId: category.id,
      subcategoryId: subcategories['necklaces'].id,
      priceRuleId: priceRule.id,
    },
    {
      title: 'Majestic Solitaire Ring',
      slug: 'majestic-solitaire-ring',
      sku: 'GJ-GLD-RG-001',
      description: 'Timeless 22K yellow gold solitaire ring showcasing a brilliant certified diamond look cut.',
      images: ['https://images.unsplash.com/photo-1605100804763-247f67b3557e?q=80&w=600'],
      weightGrams: 4.80,
      stockQuantity: 15,
      isFeatured: true,
      metalId: goldMetal.id,
      categoryId: category.id,
      subcategoryId: subcategories['rings'].id,
      priceRuleId: priceRule.id,
    },
    {
      title: 'Artisanal Silver Bracelet',
      sku: 'GJ-SLV-BR-001',
      slug: 'artisanal-silver-bracelet',
      description: 'Handcrafted 925 sterling silver chain bracelet with intricate vintage floral engraving.',
      images: ['https://images.unsplash.com/photo-1611591437281-460bfbe1220a?q=80&w=600'],
      weightGrams: 18.20,
      stockQuantity: 25,
      isFeatured: true,
      metalId: silverMetal.id,
      categoryId: category.id,
      subcategoryId: subcategories['bracelets'].id,
      priceRuleId: priceRule.id,
    },
    {
      title: 'Ethereal Stud Earrings',
      sku: 'GJ-GLD-ER-001',
      slug: 'ethereal-stud-earrings',
      description: 'Stunning 22K yellow gold stud earrings adorned with premium diamond look cuts.',
      images: ['https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?q=80&w=600'],
      weightGrams: 6.20,
      stockQuantity: 8,
      isFeatured: true,
      metalId: goldMetal.id,
      categoryId: category.id,
      subcategoryId: subcategories['earrings'].id,
      priceRuleId: priceRule.id,
    },
    {
      title: 'Celestial Gold Pendant',
      sku: 'GJ-GLD-PD-001',
      slug: 'celestial-gold-pendant',
      description: 'A delicate 22K gold pendant inspired by celestial motifs, perfect for everyday elegance.',
      images: ['https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?q=80&w=600'],
      weightGrams: 3.50,
      stockQuantity: 20,
      isFeatured: true,
      metalId: goldMetal.id,
      categoryId: category.id,
      subcategoryId: subcategories['pendants'].id,
      priceRuleId: priceRule.id,
    },
  ];

  for (const prod of productData) {
    await prisma.product.upsert({
      where: { slug: prod.slug },
      update: {
        title: prod.title,
        sku: prod.sku,
        description: prod.description,
        images: prod.images,
        weightGrams: prod.weightGrams,
        stockQuantity: prod.stockQuantity,
        isFeatured: prod.isFeatured,
        metalId: prod.metalId,
        categoryId: prod.categoryId,
        subcategoryId: prod.subcategoryId,
        priceRuleId: prod.priceRuleId,
      },
      create: prod,
    });
  }
  console.log('✅ Products seeded successfully.');

  // --- 7. Seed Banners ---
  const bannerData = [
    {
      title: 'Elegance in Gold',
      description: 'Handcrafted Masterpieces',
      image: '/uploads/banners/banner gold.webp',
      link: '/collections/necklaces',
      position: 1,
      isActive: true,
      status: 'active',
    },
    {
      title: 'Shimmering Silver',
      description: 'Modern Minimalist Designs',
      image: '/uploads/banners/silver banner.webp',
      link: '/collections/bracelets',
      position: 2,
      isActive: true,
      status: 'active',
    },
    {
      title: 'Eternal Diamond',
      description: 'Timeless Bridal Collection',
      image: '/uploads/banners/diamondbanner12.jpg',
      link: '/collections/rings',
      position: 3,
      isActive: true,
      status: 'active',
    },
  ];

  for (const banner of bannerData) {
    const existing = await prisma.banner.findFirst({
      where: { title: banner.title },
    });
    if (!existing) {
      await prisma.banner.create({
        data: banner,
      });
    } else {
      await prisma.banner.update({
        where: { id: existing.id },
        data: banner,
      });
    }
  }
  console.log('✅ Promotional Banners seeded.');

  // --- 8. Seed Site settings ---
  const publicSettings = {
    brand: {
      name: 'Guru Jewellers',
      tagline: 'Crafting Elegance Since 1997',
      logoUrl: '/uploads/banners/logo.png',
    },
    contact: {
      email: 'support@gurujewellers.com',
      phone: '+91 98765 43210',
      whatsapp: '+91 98765 43210',
      address: 'Guru Jewellers, Luxury Street, Mumbai, India',
      googleMapUrl: 'https://maps.google.com',
      businessHours: '10:00 AM - 8:00 PM',
    },
    social: {
      instagram: 'https://instagram.com/gurujewellers',
      facebook: 'https://facebook.com/gurujewellers',
      youtube: 'https://youtube.com/gurujewellers',
      twitter: 'https://twitter.com/gurujewellers',
    },
    links: {
      instagramPageLinks: [
        { label: 'Follow Us', url: 'https://instagram.com/gurujewellers' }
      ],
      footerLinks: [
        { label: 'Privacy Policy', url: '/privacy' },
        { label: 'Terms of Service', url: '/terms' }
      ]
    },
    featureBadges: [
      '100% Certified Jewellery',
      'Free Insured Shipping',
      'Easy 15-Day Returns',
      'Lifetime Exchange Policy'
    ],
    footerAbout: 'Guru Jewellers is a premier online jewelry boutique specializing in handcrafted gold, silver, and diamond masterpieces.'
  };

  await prisma.setting.upsert({
    where: { key: 'public_settings' },
    update: { value: publicSettings },
    create: {
      key: 'public_settings',
      value: publicSettings,
    },
  });
  console.log('✅ Public Site Settings seeded.');

  // --- 9. Seed Gold Savings Kitty Plans ---
  const planData = [
    {
      name: 'Swarna Savings 11-Month Gold Plan',
      totalMonths: 11,
      monthlyAmount: 5000.00,
      bonusMonths: 1.0,
      metalType: MetalType.GOLD,
      description: 'Pay 11 monthly installments and get 100% bonus month contribution on maturity!',
      isActive: true,
    },
    {
      name: 'Rajat Savings 11-Month Silver Plan',
      totalMonths: 11,
      monthlyAmount: 2000.00,
      bonusMonths: 1.0,
      metalType: MetalType.SILVER,
      description: 'Pay 11 monthly installments and get 100% bonus month contribution on maturity!',
      isActive: true,
    },
    {
      name: 'Heera Savings 11-Month Diamond Plan',
      totalMonths: 11,
      monthlyAmount: 10000.00,
      bonusMonths: 1.0,
      metalType: MetalType.GOLD,
      description: 'Pay 11 monthly installments and get 100% bonus month contribution on maturity!',
      isActive: true,
    }
  ];

  for (const plan of planData) {
    const existing = await prisma.kittyPlan.findFirst({
      where: { name: plan.name },
    });
    if (!existing) {
      await prisma.kittyPlan.create({
        data: plan,
      });
    }
  }
  console.log('✅ Kitty Plans seeded.');

  console.log('\n🎉 Complete database seed & asset migration finished successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
