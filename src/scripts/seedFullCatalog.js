const mongoose = require("mongoose");
const slugify = require("slugify");
const path = require("path");
require("dotenv").config({
  path: path.resolve(__dirname, "../../.env"),
});

const { Product, Category, SubCategory, Relation, PriceRule, Admin } = require("../models/index");

const ADMIN_ID = "694d053ebb35ad036a4c4d14";
const PRICE_RULE_ID = "69b59710387fef53111ddda2";

const IMAGE_POOL = [
  "https://gurujewellers.s3.eu-north-1.amazonaws.com/products/edb0dcaf-0477-4d05-aea9-8186bfc3b25b_WhatsApp Image 2025-12-29 at 9.36.58 PM.jpeg",
  "https://gurujewellers.s3.eu-north-1.amazonaws.com/products/4a122bf0-5df1-4c7a-90f6-78d696e0a607_WhatsApp Image 2025-12-29 at 9.36.58 PM (1).jpeg",
  "https://gurujewellers.s3.eu-north-1.amazonaws.com/products/37d544b6-3f34-4b02-bc75-d91cbb24c3f7_WhatsApp Image 2025-12-29 at 9.36.57 PM (2).jpeg",
  "https://gurujewellers.s3.eu-north-1.amazonaws.com/products/ce75e163-23ab-4cae-9d7e-be9f67973422_WhatsApp Image 2025-12-29 at 9.36.57 PM (1).jpeg",
];

const catalogData = [
  {
    name: "Rings",
    subcategories: [
      { name: "Engagement Rings", subcategories: [{ name: "Diamond Engagement Rings" }, { name: "Gold Engagement Rings" }] },
      { name: "Solitaire Rings", subcategories: [] },
      { name: "Wedding Bands", subcategories: [] }
    ]
  },
  {
    name: "Necklaces",
    subcategories: [
      { name: "Pendants", subcategories: [] },
      { name: "Chokers", subcategories: [] },
      { name: "Long Necklaces", subcategories: [] }
    ]
  },
  {
    name: "Earrings",
    subcategories: [
      { name: "Studs", subcategories: [] },
      { name: "Hoops", subcategories: [] },
      { name: "Jhumkas", subcategories: [] }
    ]
  },
  {
    name: "Bracelets",
    subcategories: [
      { name: "Bangles", subcategories: [] },
      { name: "Cuffs", subcategories: [] },
      { name: "Charm Bracelets", subcategories: [] }
    ]
  },
  {
    name: "Personalised Jewellery",
    subcategories: [
      { name: "Name Necklaces", subcategories: [] },
      { name: "Initial Rings", subcategories: [] },
      { name: "Couple Bands", subcategories: [] },
      { name: "Custom Designs", subcategories: [] }
    ]
  },
  {
    name: "Gift Store",
    subcategories: [
      { name: "Birthday Gifts", subcategories: [] },
      { name: "Anniversary Gifts", subcategories: [] },
      { name: "Wedding Gifts", subcategories: [] },
      { name: "Gift Cards", subcategories: [] }
    ]
  }
];

async function seed() {
  try {
    console.log("⏳ Connecting to MongoDB...");
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("✅ MongoDB connected");

    // Clear existing catalog data safely
    console.log("🧹 Cleaning old catalog data...");
    await Product.deleteMany({ createdBy: ADMIN_ID });
    await SubCategory.deleteMany({});
    await Category.deleteMany({});

    console.log("🌱 Seeding Categories and Subcategories...");
    
    for (const catData of catalogData) {
      const category = await new Category({
        name: catData.name,
        slug: slugify(catData.name, { lower: true, strict: true }),
        image: IMAGE_POOL[0],
        createdBy: ADMIN_ID
      }).save();

      for (const sub1Data of catData.subcategories) {
        const sub1 = await new SubCategory({
          name: sub1Data.name,
          categoryId: category._id,
          category: category._id,
          parentId: null,
          image: IMAGE_POOL[1]
        }).save();

        // Level 2 Subcategories
        for (const sub2Data of sub1Data.subcategories) {
          const sub2 = await new SubCategory({
            name: sub2Data.name,
            categoryId: category._id,
            category: category._id,
            parentId: sub1._id,
            image: IMAGE_POOL[2]
          }).save();

          // Seed products for Level 2
          await seedProducts(category._id, sub2._id, sub2Data.name);
        }

        // Seed products for Level 1 if no level 2
        if (sub1Data.subcategories.length === 0) {
          await seedProducts(category._id, sub1._id, sub1Data.name);
        }
      }
    }

    console.log("🎉 Seeding complete!");
    process.exit(0);
  } catch (error) {
    console.error("❌ Seeding failed:", error);
    process.exit(1);
  }
}

async function seedProducts(catId, subId, namePrefix) {
  const products = [];
  for (let i = 1; i <= 5; i++) {
    const name = `${namePrefix} - ${i}`;
    const actualPrice = 5000 + (Math.random() * 20000);
    const discountedPrice = actualPrice * (0.7 + (Math.random() * 0.25)); // 5% to 30% discount
    products.push({
      name,
      slug: slugify(name, { lower: true, strict: true }) + "-" + Math.random().toString(36).substring(7),
      description: `Luxury ${name} from our latest collection.`,
      shortDescription: `Elegant ${namePrefix}`,
      actualPrice,
      discountedPrice,
      weight: 10 + (Math.random() * 20),
      unit: "g",
      stock: 50,
      image: IMAGE_POOL[Math.floor(Math.random() * IMAGE_POOL.length)],
      images: IMAGE_POOL,
      categoryId: catId,
      subcategoryId: subId,
      isPriceFixed: false,
      priceRuleId: PRICE_RULE_ID,
      createdBy: ADMIN_ID,
      isInStock: true,
      filters: {
        material: ["Gold", "Silver", "Platinum"][Math.floor(Math.random() * 3)],
        style: ["Modern", "Traditional", "Minimalist"][Math.floor(Math.random() * 3)]
      }
    });
  }
  await Product.insertMany(products);
  console.log(`🔥 Inserted 5 products for ${namePrefix}`);
}

seed();
