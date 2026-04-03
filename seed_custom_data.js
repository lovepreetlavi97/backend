const mongoose = require('mongoose');
const Category = require('./src/models/category.model');
const Subcategory = require('./src/models/subCategory.model');
const Product = require('./src/models/product.model');
const Metal = require('./src/models/metal.model');
const slugify = require('slugify');

const MONGO_URI = 'mongodb+srv://guru_jewellers:WnSv3foIKcq44JPQ@gurujewellers.uqvdhl9.mongodb.net/gurujewellers?retryWrites=true&w=majority&appName=gurujewellers';
const ADMIN_ID = '694d053ebb35ad036a4c4d14';
const GOLD_ID = '69ca1a6d275d8462b8a6c184';
const SILVER_ID = '69ca1a6d275d8462b8a6c185';
const DIAMOND_ID = '69ca1a6d275d8462b8a6c186';
const METAL_IDS = [GOLD_ID, SILVER_ID, DIAMOND_ID];

const PRODUCTS_PER_SEGMENT = 100;

const IMAGE_POOLS = {
  Gold: {
    Rings: ['https://images.unsplash.com/photo-1605100804763-247f67b3557e?q=80&w=2000', 'https://images.unsplash.com/photo-1544294001-f7cd5d7fb516?q=80&w=2000'],
    Necklaces: ['https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?q=80&w=2000', 'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?q=80&w=2000'],
    Earrings: ['https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?q=80&w=2000'],
    Bracelets: ['https://images.unsplash.com/photo-1602173196412-259163e7ce9d?q=80&w=2000']
  },
  Silver: {
    Rings: ['https://images.unsplash.com/photo-1603561591411-071c4f703934?q=80&w=2000', 'https://images.unsplash.com/photo-1515233157971-ce4a6d4d12e2?q=80&w=2000'],
    Necklaces: ['https://images.unsplash.com/photo-1620656403206-8d1931671960?q=80&w=2000'],
    Earrings: ['https://images.unsplash.com/photo-1617038260897-41a1f14a8ca0?q=80&w=2000'],
    Bracelets: ['https://images.unsplash.com/photo-1611591437281-460bfbe157a8?q=80&w=2000']
  },
  Diamond: {
    Rings: ['https://images.unsplash.com/photo-1627251781190-2767072a74ba?q=80&w=2000', 'https://images.unsplash.com/photo-1598501479159-866d95966bd1?q=80&w=2000'],
    Necklaces: ['https://images.unsplash.com/photo-1601121141461-9d6647bca1ed?q=80&w=2000'],
    Earrings: ['https://images.unsplash.com/photo-1630019852942-f89202989a59?q=80&w=2000'],
    Bracelets: ['https://images.unsplash.com/photo-1573408302355-4e0b7caf358e?q=80&w=2000']
  }
};

const CATEGORY_NAMES = ['Rings', 'Necklaces', 'Earrings', 'Bracelets', 'Exclusive Collections'];
const SUB_DATA = {
  Rings: ['Engagement', 'Wedding Bands', 'Solitaires'],
  Necklaces: ['Chains', 'Pendants', 'Chokers'],
  Earrings: ['Studs', 'Hoops', 'Drops'],
  Bracelets: ['Bangles', 'Chain', 'Tennis'],
  'Exclusive Collections': ['Vintage', 'Modernist', 'Heritage']
};

async function seed() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('Connected to MongoDB');

    console.log('Resetting DB...');
    await Category.deleteMany({});
    await Subcategory.deleteMany({});
    await Product.deleteMany({});
    console.log('DB reset.');

    const metals = [
        { id: GOLD_ID, name: 'Gold' },
        { id: SILVER_ID, name: 'Silver' },
        { id: DIAMOND_ID, name: 'Diamond' }
    ];

    for (const catName of CATEGORY_NAMES) {
      console.log(`Processing Main Category: ${catName}`);
      const catSlug = slugify(catName, { lower: true, strict: true });
      const category = await Category.create({
        name: catName,
        slug: catSlug,
        metalIds: METAL_IDS,
        image: 'https://images.unsplash.com/photo-1543294001-f7cd5d7fb516?q=80&w=2000',
        description: `${catName} available in multiple luxury metals.`,
        createdBy: ADMIN_ID,
        subcategories: []
      });

      const subIds = [];

      for (const metal of metals) {
        console.log(`  Seeding ${metal.name} subcategories for ${catName}...`);
        
        const subList = SUB_DATA[catName] || ['Featured'];
        for (const subBase of subList) {
          const subName = `${metal.name} ${subBase}`;
          const subSlug = slugify(subName, { lower: true, strict: true });
          
          let poolKey = catName;
          if (!IMAGE_POOLS[metal.name][poolKey]) poolKey = 'Rings'; // fallback
          const subImg = IMAGE_POOLS[metal.name][poolKey] ? IMAGE_POOLS[metal.name][poolKey][0] : category.image;

          const subcat = await Subcategory.create({
            name: subName,
            slug: subSlug,
            categoryId: category._id,
            metalIds: [metal.id], 
            image: subImg,
            createdBy: ADMIN_ID
          });

          subIds.push(subcat._id);

          console.log(`    Seeding 100 products for ${subName}...`);
          const productBuffer = [];
          for (let i = 1; i <= PRODUCTS_PER_SEGMENT; i++) {
              const productName = `${subName} #${i}`;
              const mainImage = IMAGE_POOLS[metal.name][poolKey] ? IMAGE_POOLS[metal.name][poolKey][i % IMAGE_POOLS[metal.name][poolKey].length] : category.image;
              
              const basePrice = metal.name === 'Diamond' ? 300000 : (metal.name === 'Gold' ? 100000 : 20000);
              const actualPrice = basePrice + Math.floor(Math.random() * basePrice);
              const discountedPrice = Math.floor(actualPrice * 0.9);

              productBuffer.push({
                  name: productName,
                  slug: slugify(productName, { lower: true, strict: true }) + '-' + Math.random().toString(36).substring(2, 6),
                  description: `Luxury ${productName} crafted with excellence. High quality 4K visuals ensured.`,
                  shortDescription: `Authentic ${metal.name} ${subBase}.`,
                  actualPrice,
                  discountedPrice,
                  weight: (Math.random() * 8 + 2).toFixed(2),
                  unit: 'g',
                  stock: Math.floor(Math.random() * 50) + 10,
                  image: mainImage,
                  images: [mainImage],
                  categoryId: category._id,
                  subcategoryId: subcat._id,
                  metalIds: [metal.id], 
                  isPriceFixed: true,
                  tags: i % 10 === 0 ? 'Bestseller' : 'New',
                  attributes: {
                      gender: i % 2 === 0 ? 'Women' : 'Men',
                      material: metal.name,
                      purity: 'High Grade',
                      occasions: ['Life Event', 'Gift']
                  },
                  createdBy: ADMIN_ID
              });

              if (productBuffer.length >= 50) {
                  await Product.insertMany(productBuffer);
                  productBuffer.length = 0;
              }
          }
          if (productBuffer.length > 0) {
              await Product.insertMany(productBuffer);
          }
        }
      }
      // Update Category's subcategories array
      category.subcategories = subIds;
      await category.save();
    }

    console.log('Full metal-segregated seeding completed with correct parent-child references!');
    process.exit(0);
  } catch (err) {
    console.error('Seeding error:', err);
    process.exit(1);
  }
}

seed();
