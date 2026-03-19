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

async function seed() {
  try {
    console.log("⏳ Connecting to MongoDB...");
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("✅ MongoDB connected");

    console.log("🧹 Clearing old catalog data...");
    await Product.deleteMany({ createdBy: ADMIN_ID });
    await SubCategory.deleteMany({});
    await Category.deleteMany({});

    console.log("🌱 Seeding 100 Categories and 100 Subcategories...");
    
    let categories = [];
    let subcategories = [];
    let products = [];

    for (let i = 1; i <= 100; i++) {
        const catName = `Category ${i}`;
        const category = {
            name: catName,
            slug: slugify(catName, { lower: true, strict: true }),
            image: IMAGE_POOL[i % IMAGE_POOL.length],
            createdBy: ADMIN_ID,
            status: "active",
            isDeleted: false,
            isBlocked: false
        };
        categories.push(category);
    }

    const createdCategories = await Category.insertMany(categories);
    console.log(`✅ Inserted ${createdCategories.length} categories.`);

    for (let i = 0; i < createdCategories.length; i++) {
        const cat = createdCategories[i];
        const subName = `Subcategory ${i+1}`;
        const sub = {
            name: subName,
            slug: slugify(subName, { lower: true, strict: true }),
            categoryId: cat._id,
            category: cat._id,
            parentId: null,
            image: IMAGE_POOL[(i + 1) % IMAGE_POOL.length]
        };
        subcategories.push(sub);
    }

    const createdSubcategories = await SubCategory.insertMany(subcategories);
    console.log(`✅ Inserted ${createdSubcategories.length} subcategories.`);

    for (let i = 0; i < createdSubcategories.length; i++) {
        const sub = createdSubcategories[i];
        const prodName = `Product ${i+1}`;
        const product = {
            name: prodName,
            slug: slugify(prodName, { lower: true, strict: true }) + "-" + (i+1),
            description: `Auto-generated premium product ${i+1} for testing.`,
            shortDescription: `Style ${i+1}`,
            actualPrice: 1000 + (i * 200),
            discountedPrice: 900 + (i * 180),
            weight: 5 + (i % 20),
            unit: "g",
            stock: 100,
            image: IMAGE_POOL[(i + 2) % IMAGE_POOL.length],
            images: IMAGE_POOL,
            categoryId: sub.categoryId,
            subcategoryId: sub._id,
            isPriceFixed: false,
            priceRuleId: PRICE_RULE_ID,
            createdBy: ADMIN_ID,
            isInStock: true,
            isDeleted: false,
            isBlocked: false
        };
        products.push(product);

        if (products.length >= 100) {
            await Product.insertMany(products);
            console.log(`🔥 Inserted ${i+1} products total...`);
            products = [];
        }
    }

    if (products.length > 0) {
        await Product.insertMany(products);
    }

    console.log("🎉 Mass seeding complete!");
    process.exit(0);
  } catch (error) {
    console.error("❌ Seeding failed:", error);
    process.exit(1);
  }
}

seed();
