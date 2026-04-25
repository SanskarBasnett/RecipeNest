/**
 * One-time script: patches missing image paths in the DB
 * using the files already present in /uploads.
 * Run with: node src/utils/fixImagePaths.js
 */
const mongoose = require('mongoose');
const path     = require('path');
const fs       = require('fs');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

const User   = require('../models/User.model');
const Recipe = require('../models/Recipe.model');

// Map of known email → avatar filename
const CHEF_AVATARS = {
  'marco@gmail.com':  'chef-marco.jpg',
  'aisha@gmail.com':  'chef-aisha.jpg',
  'jeanluc@gmail.com':'chef-jeanluc.jpg',
  'sofia@gmail.com':  'chef-sofia.jpg',
  'kenji@gmail.com':  'chef-kenji.jpg',
};

// Map of recipe title → image filename
const RECIPE_IMAGES = {
  'Classic Spaghetti Carbonara':    'recipe-carbonara.jpg',
  'Margherita Pizza':               'recipe-margherita.jpg',
  'Tiramisu':                       'recipe-tiramisu.jpg',
  'Butter Chicken (Murgh Makhani)': 'recipe-butter-chicken.jpg',
  'Mango Lassi':                    'recipe-mango-lassi.jpg',
  'Palak Paneer':                   'recipe-palak-paneer.jpg',
  'Classic Croissants':             'recipe-croissants.jpg',
  'Crème Brûlée':                   'recipe-creme-brulee.jpg',
  'French Onion Soup':              'recipe-french-onion-soup.jpg',
  'Chicken Tacos al Pastor':        'recipe-tacos.jpg',
  'Guacamole':                      'recipe-guacamole.jpg',
  'Churros with Chocolate Sauce':   'recipe-churros.jpg',
  'Chicken Ramen':                  'recipe-ramen.jpg',
  'Salmon Sushi Rolls (Maki)':      'recipe-sushi.jpg',
  'Matcha Pancakes':                'recipe-matcha-pancakes.jpg',
  // Indian recipes
  'Biryani':                        'recipe-biryani.jpg',
  'Dal Makhani':                    'recipe-dal-makhani.jpg',
};

const UPLOADS_DIR = path.join(__dirname, '../../uploads');

const fileExists = (filename) => {
  const full = path.join(UPLOADS_DIR, filename);
  try { return fs.existsSync(full) && fs.statSync(full).size > 500; }
  catch { return false; }
};

const run = async () => {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected to MongoDB\n');

  let fixed = 0;

  // Fix chef avatars
  for (const [email, filename] of Object.entries(CHEF_AVATARS)) {
    if (!fileExists(filename)) { console.warn(`⚠️  File missing: ${filename}`); continue; }
    const result = await User.updateOne(
      { email, $or: [{ avatar: '' }, { avatar: null }, { avatar: { $exists: false } }] },
      { avatar: `/uploads/${filename}` }
    );
    if (result.modifiedCount > 0) {
      console.log(`✅ Fixed avatar for ${email}`);
      fixed++;
    } else {
      console.log(`— Avatar already set for ${email}`);
    }
  }

  // Fix recipe images
  for (const [title, filename] of Object.entries(RECIPE_IMAGES)) {
    if (!fileExists(filename)) { console.warn(`⚠️  File missing: ${filename}`); continue; }
    const result = await Recipe.updateOne(
      { title, $or: [{ image: '' }, { image: null }, { image: { $exists: false } }] },
      { image: `/uploads/${filename}` }
    );
    if (result.modifiedCount > 0) {
      console.log(`✅ Fixed image for "${title}"`);
      fixed++;
    } else {
      console.log(`— Image already set for "${title}"`);
    }
  }

  console.log(`\nDone. ${fixed} record(s) updated.`);
  await mongoose.disconnect();
};

run().catch((err) => { console.error(err); process.exit(1); });
