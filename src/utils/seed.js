// Usage:
//   npm run seed            -> creates admin (if missing) + catalogue (only if products collection is empty)
//   npm run seed -- --reset -> wipes products AND orders, then re-inserts the catalogue
require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');
const Product = require('../models/Product');
const Order = require('../models/Order');
const catalog = require('./catalog.json');

// Catalogue images that live in the website's /public folder need the website's address
const SITE_URL = (process.env.SITE_URL || 'https://shop-co-e-commerce-website-rose.vercel.app').replace(/\/$/, '');
const abs = (src) => (src && src.startsWith('/') ? SITE_URL + encodeURI(src) : src);

(async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    const reset = process.argv.includes('--reset');

    const email = (process.env.ADMIN_EMAIL || 'admin@shop.co').toLowerCase();
    if (!(await User.findOne({ email }))) {
      await User.create({
        name: process.env.ADMIN_NAME || 'Admin',
        email,
        password: process.env.ADMIN_PASSWORD || 'Admin@12345',
        role: 'admin',
      });
      console.log(`Admin created: ${email}`);
    } else {
      console.log('Admin already exists');
    }

    if (reset) {
      await Promise.all([Product.deleteMany({}), Order.deleteMany({})]);
      console.log('Old products and orders removed');
    }

    if ((await Product.countDocuments()) === 0) {
      await Product.insertMany(
        catalog.map((p) => ({ ...p, image: abs(p.image), images: [abs(p.image)] }))
      );
      console.log(`${catalog.length} products inserted`);
    } else {
      console.log('Products already exist (use --reset to replace them)');
    }
  } catch (e) {
    console.error(e);
  } finally {
    await mongoose.disconnect();
  }
})();
