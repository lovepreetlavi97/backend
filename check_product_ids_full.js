const mongoose = require('mongoose');
const dotenv = require('dotenv');
const fs = require('fs');
const { Product } = require('./src/models');

dotenv.config();

async function checkProductIds() {
  await mongoose.connect(process.env.MONGODB_URI);
  const products = await Product.find({ isDeleted: false, isBlocked: false }).select('name subcategoryId categoryId');
  fs.writeFileSync('products_ids_full.json', JSON.stringify(products, null, 2));
  console.log('Wrote', products.length, 'products to products_ids_full.json');
  await mongoose.disconnect();
}

checkProductIds();
