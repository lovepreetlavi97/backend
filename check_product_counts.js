const mongoose = require('mongoose');
const dotenv = require('dotenv');
const { Product, SubCategory } = require('./src/models');

dotenv.config();

async function checkProductCounts() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to DB');

  const productsCount = await Product.countDocuments({ isDeleted: false, isBlocked: false });
  console.log('Total Active Products:', productsCount);

  const subcats = await SubCategory.find({});
  for (const s of subcats) {
    const count = await Product.countDocuments({ subcategoryId: s._id, isDeleted: false, isBlocked: false });
    if (count > 0) {
      console.log(`SubCategory: ${s.name} (${s.slug}) - Count: ${count}`);
    }
  }

  // Also check products without subcategory
  const noSubcount = await Product.countDocuments({ subcategoryId: null, isDeleted: false, isBlocked: false });
  console.log('Products with NO subcategory:', noSubcount);

  await mongoose.disconnect();
}

checkProductCounts();
