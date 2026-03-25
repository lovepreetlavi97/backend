const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const { Category, Festival, Relation, Gift } = require('./src/models');

dotenv.config();

async function checkSlugs() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to DB');

  const categories = await Category.find({});
  console.log('Categories:', JSON.stringify(categories.map(c => ({ name: c.name, slug: c.slug })), null, 2));

  const festivals = await Festival.find({});
  console.log('Festivals:', JSON.stringify(festivals.map(f => ({ name: f.name, slug: f.slug })), null, 2));
  
  const gifts = await Gift.find({});
  console.log('Gifts:', JSON.stringify(gifts.map(g => ({ name: g.name, slug: g.slug })), null, 2));

  const relations = await Relation.find({});
  console.log('Relations:', JSON.stringify(relations.map(r => ({ name: r.name, slug: r.slug })), null, 2));

  await mongoose.disconnect();
}

checkSlugs();
