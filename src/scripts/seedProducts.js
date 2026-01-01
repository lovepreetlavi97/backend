/**
 * Run with:
 * node scripts/seedProducts.js
 */

const path = require("path");
require("dotenv").config({
  path: path.resolve(__dirname, "../../.env"),
});

const mongoose = require("mongoose");

// ====== MODELS ======
const { Product ,Category,SubCategory,Relation} = require("../models/index");


// ====== CONFIG ======
const PRODUCTS_PER_SUBCATEGORY = 1000; // ⚠️ start with 100 first if needed
const BATCH_SIZE = 100;

// Existing admin ID (change if needed)
const CREATED_BY_ADMIN_ID = "694d053ebb35ad036a4c4d14";

// ====== IMAGE POOL (YOUR REAL IMAGES) ======
const IMAGE_POOL = [
  "https://gurujewellers.s3.eu-north-1.amazonaws.com/products/edb0dcaf-0477-4d05-aea9-8186bfc3b25b_WhatsApp Image 2025-12-29 at 9.36.58 PM.jpeg",
  "https://gurujewellers.s3.eu-north-1.amazonaws.com/products/4a122bf0-5df1-4c7a-90f6-78d696e0a607_WhatsApp Image 2025-12-29 at 9.36.58 PM (1).jpeg",
  "https://gurujewellers.s3.eu-north-1.amazonaws.com/products/37d544b6-3f34-4b02-bc75-d91cbb24c3f7_WhatsApp Image 2025-12-29 at 9.36.57 PM (2).jpeg",
  "https://gurujewellers.s3.eu-north-1.amazonaws.com/products/ce75e163-23ab-4cae-9d7e-be9f67973422_WhatsApp Image 2025-12-29 at 9.36.57 PM (1).jpeg",
];

// ====== PRODUCT FACTORY ======
function generateProduct({
  index,
  categoryId,
  subcategoryId,
  relationIds,
}) {
  const actualPrice = Math.floor(Math.random() * 50000) + 2000;
  const discountedPrice = actualPrice - Math.floor(actualPrice * 0.1);

  return {
    name: `Auto Product ${index}`,
    description: "Auto generated product for catalog stress testing",
    shortDescription: "Seeded product",
    actualPrice,
    discountedPrice,
    weight: +(Math.random() * 100).toFixed(2),
    unit: "kg",
    stock: Math.floor(Math.random() * 1000),
    image: IMAGE_POOL[index % IMAGE_POOL.length],
    images: IMAGE_POOL,
    categoryId,
    subcategoryId,
    relationIds,
    tags: ["New", "Sale", "Bestseller"][index % 3],
    isPriceFixed: false,
    isBlocked: false,
    isInStock: true,
    isFeatured: index % 15 === 0,
    shippingInfo: {
      isFreeShipping: index % 2 === 0,
      shippingFee: 50,
      estimatedDeliveryDays: 3,
    },
    warranty: index % 3 === 0 ? "lifetime guarantee" : "",
    createdBy: CREATED_BY_ADMIN_ID,
  };
}

// ====== MAIN SEED FUNCTION ======
(async function seedProducts() {
  try {
    console.log("⏳ Connecting to MongoDB...");
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("✅ MongoDB connected");

    const categories = await Category.find({ isDeleted: false });
    const subcategories = await Subcategory.find({ isDeleted: false });
    const relations = await Relation.find({ isDeleted: false });

    if (!categories.length || !subcategories.length) {
      throw new Error("Categories or Subcategories missing");
    }

    const relationIds = relations.map(r => r._id);

    let batch = [];
    let productCounter = 1;

    for (const category of categories) {
      const relatedSubcategories = subcategories.filter(
        sub => sub.category?.toString() === category._id.toString()
      );

      for (const subcategory of relatedSubcategories) {
        console.log(
          `📦 Seeding ${PRODUCTS_PER_SUBCATEGORY} products for → ${category.name} / ${subcategory.name}`
        );

        for (let i = 0; i < PRODUCTS_PER_SUBCATEGORY; i++) {
          batch.push(
            generateProduct({
              index: productCounter++,
              categoryId: category._id,
              subcategoryId: subcategory._id,
              relationIds,
            })
          );

          if (batch.length === BATCH_SIZE) {
            await Product.insertMany(batch);
            console.log(`🔥 Inserted ${batch.length} products`);
            batch = [];
          }
        }
      }
    }

    if (batch.length > 0) {
      await Product.insertMany(batch);
      console.log(`🔥 Inserted final ${batch.length} products`);
    }

    console.log("🎉 PRODUCT SEEDING COMPLETED SUCCESSFULLY");
    process.exit(0);
  } catch (error) {
    console.error("❌ SEEDING FAILED:", error);
    process.exit(1);
  }
})();
