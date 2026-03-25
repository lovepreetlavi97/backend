const mongoose = require('mongoose');
const dotenv = require('dotenv');
const fs = require('fs');
const { SubCategory } = require('./src/models');

dotenv.config();

async function checkSubCategories() {
  await mongoose.connect(process.env.MONGODB_URI);
  const subcategories = await SubCategory.find({});
  const output = JSON.stringify(subcategories.map(s => ({ _id: s._id, name: s.name, slug: s.slug, categoryId: s.categoryId })), null, 2);
  fs.writeFileSync('subcategories_full.json', output);
  console.log('Wrote', subcategories.length, 'subcategories to subcategories_full.json');
  await mongoose.disconnect();
}

checkSubCategories();
