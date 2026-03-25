const mongoose = require('mongoose');
const dotenv = require('dotenv');
const fs = require('fs');
const { Category } = require('./src/models');

dotenv.config();

async function checkCategories() {
  await mongoose.connect(process.env.MONGODB_URI);
  const categories = await Category.find({});
  const output = JSON.stringify(categories.map(c => ({ _id: c._id, name: c.name, slug: c.slug })), null, 2);
  fs.writeFileSync('categories_full.json', output);
  console.log('Wrote', categories.length, 'categories to categories_full.json');
  await mongoose.disconnect();
}

checkCategories();
