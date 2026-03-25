const mongoose = require('mongoose');
const dotenv = require('dotenv');
const { Category } = require('./src/models');

dotenv.config();

async function checkCategories() {
  await mongoose.connect(process.env.MONGODB_URI);
  const categories = await Category.find({});
  console.log(JSON.stringify(categories.map(c => ({ name: c.name, slug: c.slug })), null, 2));
  await mongoose.disconnect();
}

checkCategories();
