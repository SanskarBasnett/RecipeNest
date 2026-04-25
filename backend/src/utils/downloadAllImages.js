/**
 * One-off script: downloads all missing seed images to the uploads folder
 * and patches the DB records.
 * Run with: node src/utils/downloadAllImages.js
 */
const mongoose      = require('mongoose');
const https         = require('https');
const http          = require('http');
const fs            = require('fs');
const path          = require('path');
require('dotenv').config();

const User   = require('../models/User.model');
const Recipe = require('../models/Recipe.model');

const UPLOADS_DIR = path.join(__dirname, '../../uploads');

// ── image map ──────────────────────────────────────────────────────────────
const CHEF_IMAGES = {
  'marco@gmail.com':   { file: 'chef-marco.jpg',   url: 'https://picsum.photos/seed/chef-marco/200/200' },
  'aisha@gmail.com':   { file: 'chef-aisha.jpg',   url: 'https://picsum.photos/seed/chef-aisha/200/200' },
  'jeanluc@gmail.com': { file: 'chef-jeanluc.jpg', url: 'https://picsum.photos/seed/chef-jeanluc/200/200' },
  'sofia@gmail.com':   { file: 'chef-sofia.jpg',   url: 'https://picsum.photos/seed/chef-sofia/200/200' },
  'kenji@gmail.com':   { file: 'chef-kenji.jpg',   url: 'https://picsum.photos/seed/chef-kenji/200/200' },
};

// ── image map ──────────────────────────────────────────────────────────────
// foodish-api categories: burger, butter-chicken, dessert, dosa, idly,
// pasta, pizza, rice, samosa, soup, sushi, biryani, ramen, taco, sandwich
const RECIPE_IMAGES = {
  'Classic Spaghetti Carbonara':   { file: 'recipe-carbonara.jpg',        foodish: 'pasta' },
  'Margherita Pizza':              { file: 'recipe-margherita.jpg',       foodish: 'pizza' },
  'Tiramisu':                      { file: 'recipe-tiramisu.jpg',         foodish: 'dessert' },
  'Butter Chicken (Murgh Makhani)':{ file: 'recipe-butter-chicken.jpg',   foodish: 'butter-chicken' },
  'Mango Lassi':                   { file: 'recipe-mango-lassi.jpg',      foodish: 'dosa' },
  'Palak Paneer':                  { file: 'recipe-palak-paneer.jpg',     foodish: 'rice' },
  'Classic Croissants':            { file: 'recipe-croissants.jpg',       foodish: 'dessert' },
  'Crème Brûlée':                  { file: 'recipe-creme-brulee.jpg',     foodish: 'dessert' },
  'French Onion Soup':             { file: 'recipe-french-onion-soup.jpg',foodish: 'biryani' },
  'Chicken Tacos al Pastor':       { file: 'recipe-tacos.jpg',            foodish: 'burger' },
  'Guacamole':                     { file: 'recipe-guacamole.jpg',        foodish: 'samosa' },
  'Churros with Chocolate Sauce':  { file: 'recipe-churros.jpg',          foodish: 'dessert' },
  'Chicken Ramen':                 { file: 'recipe-ramen.jpg',            foodish: 'idly' },
  'Salmon Sushi Rolls (Maki)':     { file: 'recipe-sushi.jpg',            foodish: 'rice' },
  'Matcha Pancakes':               { file: 'recipe-matcha-pancakes.jpg',  foodish: 'dessert' },
};

// ── downloader (follows redirects) ────────────────────────────────────────
function download(url, dest, redirects = 0) {
  return new Promise((resolve) => {
    if (redirects > 10) { resolve(false); return; }

    // Skip if file already exists with content
    if (fs.existsSync(dest)) {
      try {
        if (fs.statSync(dest).size > 500) { resolve(true); return; }
      } catch (_) {}
      fs.unlinkSync(dest);
    }

    const proto = url.startsWith('https') ? https : http;

    const req = proto.get(url, (res) => {
      // Follow redirects WITHOUT opening a file stream yet
      if (res.statusCode === 301 || res.statusCode === 302) {
        res.resume(); // drain the response
        download(res.headers.location, dest, redirects + 1).then(resolve);
        return;
      }

      if (res.statusCode !== 200) {
        res.resume();
        console.warn(`  ✗ HTTP ${res.statusCode} for ${url}`);
        resolve(false);
        return;
      }

      // Only open the write stream once we know it's a 200
      const file = fs.createWriteStream(dest);
      res.pipe(file);
      file.on('finish', () => { file.close(); resolve(true); });
      file.on('error', (e) => {
        fs.unlink(dest, () => {});
        console.warn(`  ✗ Write error: ${e.message}`);
        resolve(false);
      });
    });

    req.on('error', (e) => {
      console.warn(`  ✗ Request error: ${e.message}`);
      resolve(false);
    });

    req.setTimeout(20000, () => {
      req.destroy();
      console.warn(`  ✗ Timeout: ${url}`);
      resolve(false);
    });
  });
}

// ── main ──────────────────────────────────────────────────────────────────
mongoose.connect(process.env.MONGO_URI).then(async () => {
  if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR, { recursive: true });

  console.log('\n── Chef avatars ──');
  for (const [email, { file, url }] of Object.entries(CHEF_IMAGES)) {
    const chef = await User.findOne({ email });
    if (!chef) { console.log(`  skip (not found): ${email}`); continue; }

    const dest = path.join(UPLOADS_DIR, file);
    const ok   = await download(url, dest);
    if (ok) {
      await User.updateOne({ _id: chef._id }, { avatar: `/uploads/${file}` });
      console.log(`  ✓ ${chef.name}`);
    } else {
      console.log(`  ✗ failed: ${chef.name}`);
    }
  }

  console.log('\n── Recipe images ──');
  for (const [title, { file, foodish }] of Object.entries(RECIPE_IMAGES)) {
    const recipe = await Recipe.findOne({ title });
    if (!recipe) { console.log(`  skip (not found): ${title}`); continue; }

    const dest = path.join(UPLOADS_DIR, file);

    // Fetch a real food image URL from foodish-api
    let imageUrl;
    try {
      const apiRes = await new Promise((resolve, reject) => {
        https.get(`https://foodish-api.com/api/images/${foodish}`, (res) => {
          let d = '';
          res.on('data', c => d += c);
          res.on('end', () => resolve(JSON.parse(d)));
        }).on('error', reject);
      });
      imageUrl = apiRes.image;
    } catch (e) {
      console.log(`  ✗ API error for ${title}: ${e.message}`);
      continue;
    }

    const ok = await download(imageUrl, dest);
    if (ok) {
      await Recipe.updateOne({ _id: recipe._id }, { image: `/uploads/${file}` });
      console.log(`  ✓ ${title}`);
    } else {
      console.log(`  ✗ failed: ${title}`);
    }
  }

  mongoose.disconnect();
  console.log('\nDone.');
});
