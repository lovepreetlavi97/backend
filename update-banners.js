const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, './.env') });

const Banner = require('./src/models/banner.model');
const Metal = require('./src/models/metal.model');

const updateBanners = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    const metals = await Metal.find({ isActive: true });
    const metalIds = metals.map(m => m._id);

    if (metalIds.length === 0) {
      console.log('No active metals found. Please ensure metals exist first.');
      process.exit(1);
    }

    console.log(`Found ${metalIds.length} active metals. Assigning them to all banners...`);

    // Assign all metals to all banners
    const result = await Banner.updateMany(
      {},
      { $set: { metalIds: metalIds } }
    );

    console.log(`Updated ${result.modifiedCount} banners with all metalIds.`);
    
    process.exit(0);
  } catch (error) {
    console.error('Error updating banners:', error);
    process.exit(1);
  }
};

updateBanners();
