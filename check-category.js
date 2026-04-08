const mongoose = require('mongoose');
const { Category } = require('./src/models/index');
require('dotenv').config();

async function checkCategory() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('MongoDB connected');
  
  const categoryId = '69ccad6d0408069c99782f32';
  const category = await Category.findById(categoryId);
  
  if (category) {
    console.log('Category Found:', category.name);
    console.log('MetalIds:', category.metalIds);
  } else {
    console.log('Category NOT FOUND');
  }
  
  mongoose.disconnect();
}

checkCategory();
