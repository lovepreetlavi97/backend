const mongoose = require('mongoose');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.join(__dirname, '.env') });

async function checkGifts() {
  try {
    if (!process.env.MONGODB_URI) {
      console.error('MONGODB_URI not found in .env');
      process.exit(1);
    }
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    const Product = require('./src/models/product.model');

    const giftProducts = await Product.countDocuments({
      $or: [
        { "attributes.giftIds.0": { $exists: true } },
        { "attributes.occasions.0": { $exists: true } },
        { "relationIds.0": { $exists: true } }
      ]
    });
    console.log('Gift Store products count:', giftProducts);

    const matchAll = await Product.findOne({
      $or: [
        { "attributes.giftIds.0": { $exists: true } },
        { "attributes.occasions.0": { $exists: true } },
        { "relationIds.0": { $exists: true } }
      ]
    }).select('name attributes relationIds');
    
    if (matchAll) {
      console.log('Sample Match:', JSON.stringify(matchAll, null, 2));
    } else {
      console.log('No matches found for the gift store query.');
    }

    process.exit(0);
  } catch (err) {
    console.error('❌ Error:', err);
    process.exit(1);
  }
}

checkGifts();
