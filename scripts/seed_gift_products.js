const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

// Load env
dotenv.config({ path: path.join(__dirname, '../.env') });

const Product = require('../src/models/product.model');
const { Category, SubCategory } = require('../src/models/index');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/guru_jewellers';

const seedGiftProducts = async () => {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    // Get a category and subcategory to use as defaults
    const category = await Category.findOne({ isDeleted: false });
    const subcategory = await SubCategory.findOne({ isDeleted: false });

    if (!category) {
      console.error('No category found. Please seed categories first.');
      process.exit(1);
    }

    const occasions = ["Birthday", "Anniversary", "Wedding", "Valentine"];
    const styles = ["Minimal Style", "Bold Style", "Romantic Style", "Bridal Style"];
    const genders = ["Men", "Women", "Unisex"];

    const products = [];

    // Create 40 products to test infinite scroll (4 pages of 12)
    for (let i = 1; i <= 40; i++) {
      const occasion = occasions[i % occasions.length];
      const style = styles[i % styles.length];
      const gender = genders[i % genders.length];
      const price = 500 + (i * 200); // Varied prices

      products.push({
        name: `${occasion} Special ${style} ${i}`,
        description: `Elegant ${style} jewelry perfect for your ${occasion}. Handcrafted with precision and love.`,
        shortDescription: `Beautiful ${style} piece for ${occasion}.`,
        actualPrice: price,
        discountedPrice: Math.round(price * 0.9),
        weight: 10 + (i % 5),
        unit: 'g',
        stock: 50,
        categoryId: category._id,
        subcategoryId: subcategory ? subcategory._id : undefined,
        attributes: {
          occasion: occasion, // for old queries
          occasions: [occasion], // new multi-select field
          style: style,
          gender: gender,
          material: "Gold",
          color: i % 2 === 0 ? "Yellow" : "Rose"
        },
        tags: i % 5 === 0 ? "Bestseller" : "New",
        isFeatured: i % 10 === 0,
        image: "https://plus.unsplash.com/premium_photo-1664124381855-3131b9a386d8?q=80&w=1974&auto=format&fit=crop",
        images: ["https://plus.unsplash.com/premium_photo-1664124381855-3131b9a386d8?q=80&w=1974&auto=format&fit=crop"],
        isPriceFixed: true
      });
    }

    await Product.create(products);
    console.log('Successfully seeded 40 gift products');

    process.exit(0);
  } catch (error) {
    console.error('Error seeding products:', error);
    process.exit(1);
  }
};

seedGiftProducts();
