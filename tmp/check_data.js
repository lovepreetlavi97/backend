const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });

const { Gift, Product } = require('../src/models');

async function checkData() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    const gifts = await Gift.find({ isDeleted: false });
    console.log('--- GIFTS ---');
    console.log(JSON.stringify(gifts, null, 2));

    const products = await Product.find({ 'attributes.giftIds': { $exists: true, $not: { $size: 0 } } }).limit(5);
    console.log('--- PRODUCTS WITH GIFTS ---');
    console.log(JSON.stringify(products.map(p => ({ name: p.name, giftIds: p.attributes.giftIds })), null, 2));

    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

checkData();
