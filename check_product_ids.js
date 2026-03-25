const mongoose = require('mongoose');
const dotenv = require('dotenv');
const { Product } = require('./src/models');

dotenv.config();

async function checkProductIds() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to DB');

  const products = await Product.find({ isDeleted: false, isBlocked: false }).select('name subcategoryId categoryId');
  console.log('Products:', JSON.stringify(products.map(p => ({
    name: p.name,
    subcategoryId: p.subcategoryId,
    categoryId: p.categoryId
  })), null, 2));

  await mongoose.disconnect();
}

checkProductIds();
