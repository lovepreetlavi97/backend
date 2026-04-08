const mongoose = require('mongoose');
const { Category } = require('./src/models/index');
require('dotenv').config();

async function checkData() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('MongoDB connected');
  
  const metalId = '69d0c5907c4a3958b236527a';
  const categories = await Category.find({
    metalIds: { $in: [new mongoose.Types.ObjectId(metalId)] }
  });
  
  console.log('Categories matching metalId:', categories.length);
  categories.forEach(c => console.log(`- ${c.name} (${c._id})`));
  
  mongoose.disconnect();
}

checkData();
