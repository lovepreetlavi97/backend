const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

// Load env
dotenv.config({ path: path.join(__dirname, '../../.env') });

const { CuratedCollection } = require('../models');

async function seed() {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/guru-jewellers';
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB');

    const collections = [
      { name: 'Bridal Collection', slug: 'bridal-collection', isActive: true },
      { name: 'Everyday Minimal', slug: 'everyday-minimal', isActive: true },
      { name: 'Office Wear', slug: 'office-wear', isActive: true },
      { name: 'Men’s Luxury', slug: 'mens-luxury', isActive: true },
      { name: 'Temple Jewellery', slug: 'temple-jewellery', isActive: true },
    ];

    for (const col of collections) {
      await CuratedCollection.findOneAndUpdate(
        { slug: col.slug },
        col,
        { upsate: true, new: true, upsert: true }
      );
      console.log(`Seeded/Updated: ${col.name}`);
    }

    console.log('Seed completed successfully');
    process.exit(0);
  } catch (err) {
    console.error('Seed error:', err);
    process.exit(1);
  }
}

seed();
