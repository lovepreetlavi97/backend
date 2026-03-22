const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const slugify = require('slugify');

dotenv.config({ path: path.join(__dirname, '../../.env') });

const { Gift, Product } = require('../models');

const defaultGifts = [
  {
    name: "Birthday",
    description: "Perfect birthday surprises for your loved ones.",
    image: "/images/gifts/birthday.png",
    isActive: true
  },
  {
    name: "Anniversary",
    description: "Celebrate milestones with timeless elegance.",
    image: "/images/gifts/anniversary.png",
    isActive: true
  },
  {
    name: "Valentine's Day",
    description: "Express your love with sparkling gifts.",
    image: "/images/gifts/valentine.png",
    isActive: true
  },
  {
    name: "Wedding",
    description: "Grand gifts for beautiful beginnings.",
    image: "/images/gifts/wedding.png",
    isActive: true
  }
];

async function seedGifts() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Create Gifts
    const createdGifts = [];
    for (const g of defaultGifts) {
      const slug = slugify(g.name, { lower: true, strict: true });
      let gift = await Gift.findOne({ slug });
      if (!gift) {
        gift = await Gift.create({ ...g, slug });
        console.log(`Created gift: ${g.name}`);
      } else {
        console.log(`Gift already exists: ${g.name}`);
      }
      createdGifts.push(gift);
    }

    // Associate with some products
    const products = await Product.find({}).limit(20);
    for (let i = 0; i < products.length; i++) {
      const product = products[i];
      const randomGift = createdGifts[Math.floor(Math.random() * createdGifts.length)];
      
      // Initialize attributes if missing
      if (!product.attributes) product.attributes = {};
      if (!product.attributes.giftIds) product.attributes.giftIds = [];
      
      if (!product.attributes.giftIds.includes(randomGift._id)) {
        product.attributes.giftIds.push(randomGift._id);
        await product.save();
        console.log(`Associated product ${product.name} with gift ${randomGift.name}`);
      }
    }

    console.log('Seeding completed successfully!');
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

seedGifts();
