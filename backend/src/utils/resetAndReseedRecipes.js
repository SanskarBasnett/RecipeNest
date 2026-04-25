/**
 * Deletes ALL seeded recipes + their image files, then re-seeds with
 * real food photos from Unsplash (no API key — direct CDN URLs with User-Agent).
 *
 * Run: node src/utils/resetAndReseedRecipes.js
 */
const mongoose = require('mongoose');
const https    = require('https');
const http     = require('http');
const fs       = require('fs');
const path     = require('path');
require('dotenv').config();

const User   = require('../models/User.model');
const Recipe = require('../models/Recipe.model');

const UPLOADS_DIR = path.join(__dirname, '../../uploads');
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0 Safari/537.36';

// ── Real food photos (Unsplash CDN — free, no key needed with User-Agent) ──
const RECIPES_BY_CHEF_EMAIL = {
  'marco@gmail.com': [
    {
      title:        'Classic Spaghetti Carbonara',
      description:  'A rich and creamy Roman pasta dish made with eggs, Pecorino Romano, guanciale, and black pepper. No cream needed — the magic is all in the technique.',
      ingredients:  ['400g spaghetti','200g guanciale or pancetta, diced','4 large eggs','100g Pecorino Romano, finely grated','50g Parmesan, finely grated','Freshly ground black pepper','Salt for pasta water'],
      instructions: '1. Cook spaghetti in well-salted boiling water until al dente.\n2. Fry guanciale in a pan over medium heat until crispy. Remove from heat.\n3. Whisk eggs with Pecorino and Parmesan. Season generously with black pepper.\n4. Reserve 1 cup pasta water. Drain pasta and add to the pan off the heat.\n5. Pour egg mixture over pasta, tossing quickly and adding pasta water to create a creamy sauce.\n6. Serve immediately with extra cheese and pepper.',
      category: 'Dinner', difficulty: 'Medium', cookingTime: 25, prepTime: 10, cookTime: 15, servings: 4,
      tags: ['pasta','italian','quick'],
      imageFile: 'recipe-carbonara.jpg',
      imageUrl:  'https://images.unsplash.com/photo-1612874742237-6526221588e3?w=600&h=400&fit=crop',
    },
    {
      title:        'Margherita Pizza',
      description:  'The queen of pizzas — a thin, crispy Neapolitan base topped with San Marzano tomato sauce, fresh mozzarella, and fragrant basil.',
      ingredients:  ['500g 00 flour','7g instant yeast','10g salt','325ml warm water','2 tbsp olive oil','400g San Marzano tomatoes, crushed','250g fresh mozzarella, torn','Fresh basil leaves','Extra virgin olive oil to finish'],
      instructions: '1. Mix flour, yeast, and salt. Add water and olive oil, knead 10 minutes.\n2. Cover and prove 1 hour until doubled.\n3. Divide into 2 balls, stretch each into a thin round base.\n4. Spread crushed tomatoes, add torn mozzarella.\n5. Bake at 250°C for 8–10 minutes until crust is charred and cheese is bubbling.\n6. Top with fresh basil and a drizzle of olive oil.',
      category: 'Dinner', difficulty: 'Medium', cookingTime: 90, prepTime: 70, cookTime: 10, servings: 4,
      tags: ['pizza','italian','vegetarian'],
      imageFile: 'recipe-margherita.jpg',
      imageUrl:  'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=600&h=400&fit=crop',
    },
    {
      title:        'Tiramisu',
      description:  'Italy\'s most beloved dessert — layers of espresso-soaked ladyfingers and a light mascarpone cream, dusted with cocoa powder.',
      ingredients:  ['300g ladyfinger biscuits','500g mascarpone','4 eggs, separated','100g caster sugar','300ml strong espresso, cooled','3 tbsp Marsala wine or rum','Cocoa powder for dusting'],
      instructions: '1. Whisk egg yolks with sugar until pale and thick. Fold in mascarpone.\n2. Whisk egg whites to stiff peaks and fold into mascarpone mixture.\n3. Mix espresso with Marsala. Quickly dip each ladyfinger and layer in a dish.\n4. Spread half the mascarpone cream over the biscuits. Repeat layers.\n5. Dust generously with cocoa powder.\n6. Refrigerate at least 4 hours before serving.',
      category: 'Dessert', difficulty: 'Medium', cookingTime: 30, prepTime: 30, cookTime: 0, servings: 8,
      tags: ['dessert','italian','no-bake'],
      imageFile: 'recipe-tiramisu.jpg',
      imageUrl:  'https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?w=600&h=400&fit=crop',
    },
  ],

  'aisha@gmail.com': [
    {
      title:        'Butter Chicken',
      description:  'A velvety, mildly spiced tomato and butter sauce envelops tender marinated chicken. One of India\'s most iconic dishes, perfect with naan or rice.',
      ingredients:  ['800g chicken thighs, cut into chunks','200g plain yoghurt','2 tsp garam masala','1 tsp turmeric','2 tsp cumin','400g canned tomatoes','100ml double cream','50g butter','1 onion, finely chopped','4 garlic cloves, minced','1 tbsp ginger, grated','Salt to taste','Fresh coriander to serve'],
      instructions: '1. Marinate chicken in yoghurt, garam masala, turmeric, and cumin for 2 hours.\n2. Grill or pan-fry chicken until charred. Set aside.\n3. Melt butter, sauté onion until golden. Add garlic and ginger.\n4. Add tomatoes and simmer 15 minutes. Blend until smooth.\n5. Return chicken to sauce, stir in cream, simmer 10 minutes.\n6. Garnish with coriander and serve with naan.',
      category: 'Dinner', difficulty: 'Medium', cookingTime: 45, prepTime: 15, cookTime: 30, servings: 4,
      tags: ['indian','curry','chicken'],
      imageFile: 'recipe-butter-chicken.jpg',
      imageUrl:  'https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?w=600&h=400&fit=crop',
    },
    {
      title:        'Mango Lassi',
      description:  'A refreshing Indian yoghurt drink blended with ripe Alphonso mangoes, a pinch of cardamom, and a drizzle of honey. Perfect for hot days.',
      ingredients:  ['2 ripe mangoes, peeled and chopped','400ml plain yoghurt','200ml cold milk','2 tbsp honey or sugar','¼ tsp ground cardamom','Pinch of salt','Ice cubes'],
      instructions: '1. Add mango, yoghurt, milk, honey, cardamom, and salt to a blender.\n2. Blend until completely smooth.\n3. Taste and adjust sweetness.\n4. Pour over ice and serve immediately.',
      category: 'Beverage', difficulty: 'Easy', cookingTime: 5, prepTime: 5, cookTime: 0, servings: 2,
      tags: ['drink','indian','vegetarian','quick'],
      imageFile: 'recipe-mango-lassi.jpg',
      imageUrl:  'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600&h=400&fit=crop',
    },
    {
      title:        'Palak Paneer',
      description:  'Cubes of fresh paneer simmered in a vibrant, spiced spinach sauce. A classic North Indian vegetarian dish that\'s nutritious and deeply satisfying.',
      ingredients:  ['500g fresh spinach','250g paneer, cubed','1 onion, chopped','2 tomatoes, chopped','4 garlic cloves','1 tbsp ginger','1 tsp cumin seeds','1 tsp garam masala','½ tsp turmeric','2 tbsp oil','3 tbsp cream','Salt to taste'],
      instructions: '1. Blanch spinach 2 minutes, then blend to a smooth purée.\n2. Fry paneer cubes until golden, set aside.\n3. Heat oil, add cumin seeds. Sauté onion until golden, add garlic and ginger.\n4. Add tomatoes and cook until soft. Add spices.\n5. Stir in spinach purée and simmer 5 minutes.\n6. Add paneer and cream, simmer 3 more minutes. Serve with roti.',
      category: 'Dinner', difficulty: 'Easy', cookingTime: 30, prepTime: 10, cookTime: 20, servings: 4,
      tags: ['indian','vegetarian','healthy'],
      imageFile: 'recipe-palak-paneer.jpg',
      imageUrl:  'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=600&h=400&fit=crop',
    },
  ],

  'jeanluc@gmail.com': [
    {
      title:        'Classic Croissants',
      description:  'Buttery, flaky, and perfectly laminated — authentic French croissants take time but the result is incomparable. A true labour of love.',
      ingredients:  ['500g strong white flour','10g salt','80g sugar','10g instant yeast','300ml cold milk','280g cold unsalted butter (for lamination)','1 egg yolk + 1 tbsp milk (egg wash)'],
      instructions: '1. Mix flour, salt, sugar, yeast, and milk into a dough. Knead briefly, refrigerate overnight.\n2. Beat butter into a flat rectangle. Encase in dough and fold 3 times, chilling 30 min between each fold.\n3. Roll out and cut into triangles. Roll up from base to tip.\n4. Prove at room temperature 2 hours until puffy.\n5. Brush with egg wash and bake at 200°C for 18–20 minutes until deep golden.',
      category: 'Breakfast', difficulty: 'Hard', cookingTime: 480, prepTime: 460, cookTime: 20, servings: 12,
      tags: ['french','pastry','breakfast','baking'],
      imageFile: 'recipe-croissants.jpg',
      imageUrl:  'https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=600&h=400&fit=crop',
    },
    {
      title:        'Crème Brûlée',
      description:  'A silky vanilla custard beneath a perfectly caramelised sugar crust. The satisfying crack of the spoon through the toffee top is pure joy.',
      ingredients:  ['500ml double cream','1 vanilla pod, split','5 egg yolks','100g caster sugar','4 tbsp demerara sugar (for topping)'],
      instructions: '1. Heat cream with vanilla pod until just simmering. Remove pod.\n2. Whisk egg yolks with caster sugar until pale. Slowly pour in warm cream, whisking constantly.\n3. Strain into ramekins. Bake in a bain-marie at 150°C for 35–40 minutes until just set.\n4. Cool, then refrigerate at least 2 hours.\n5. Sprinkle demerara sugar on top and caramelise with a blowtorch until golden and crackly.',
      category: 'Dessert', difficulty: 'Medium', cookingTime: 60, prepTime: 15, cookTime: 40, servings: 4,
      tags: ['french','dessert','classic'],
      imageFile: 'recipe-creme-brulee.jpg',
      imageUrl:  'https://images.unsplash.com/photo-1470124182917-cc6e71b22ecc?w=600&h=400&fit=crop',
    },
    {
      title:        'French Onion Soup',
      description:  'Deeply caramelised onions in a rich beef broth, topped with a crusty crouton and melted Gruyère. The ultimate French comfort food.',
      ingredients:  ['1kg onions, thinly sliced','50g butter','2 tbsp olive oil','1 tsp sugar','200ml dry white wine','1.2L beef stock','1 tbsp plain flour','1 baguette, sliced','150g Gruyère, grated','Salt and pepper','Fresh thyme'],
      instructions: '1. Melt butter with oil. Add onions and cook on low heat 45 minutes until deeply golden.\n2. Add sugar and flour, stir 2 minutes. Pour in wine and reduce.\n3. Add stock and thyme, simmer 20 minutes. Season well.\n4. Ladle into oven-safe bowls. Top with baguette slices and Gruyère.\n5. Grill under a hot broiler until cheese is bubbling and golden.',
      category: 'Lunch', difficulty: 'Medium', cookingTime: 75, prepTime: 10, cookTime: 65, servings: 4,
      tags: ['french','soup','comfort food'],
      imageFile: 'recipe-french-onion-soup.jpg',
      imageUrl:  'https://images.unsplash.com/photo-1547592166-23ac45744acd?w=600&h=400&fit=crop',
    },
  ],

  'sofia@gmail.com': [
    {
      title:        'Chicken Tacos al Pastor',
      description:  'Juicy achiote-marinated chicken with pineapple, served in warm corn tortillas with fresh salsa, onion, and coriander. Street food at its finest.',
      ingredients:  ['600g chicken thighs','3 tbsp achiote paste','2 tbsp white vinegar','1 tsp cumin','1 tsp oregano','2 garlic cloves','200g pineapple, sliced','12 small corn tortillas','1 white onion, finely diced','Fresh coriander','Lime wedges','Salsa verde to serve'],
      instructions: '1. Blend achiote paste, vinegar, cumin, oregano, and garlic into a marinade.\n2. Coat chicken and marinate at least 2 hours.\n3. Grill chicken and pineapple over high heat until charred.\n4. Slice chicken thinly. Warm tortillas on a dry pan.\n5. Assemble tacos with chicken, pineapple, onion, and coriander.\n6. Serve with lime wedges and salsa verde.',
      category: 'Dinner', difficulty: 'Easy', cookingTime: 30, prepTime: 15, cookTime: 15, servings: 4,
      tags: ['mexican','tacos','chicken','street food'],
      imageFile: 'recipe-tacos.jpg',
      imageUrl:  'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=600&h=400&fit=crop',
    },
    {
      title:        'Guacamole',
      description:  'Fresh, chunky guacamole made the traditional way — ripe Hass avocados, lime, jalapeño, coriander, and a pinch of salt. Ready in 5 minutes.',
      ingredients:  ['3 ripe Hass avocados','1 lime, juiced','1 jalapeño, finely chopped','½ red onion, finely diced','Small bunch of coriander, chopped','1 garlic clove, minced','Salt to taste','1 tomato, deseeded and diced'],
      instructions: '1. Halve and stone avocados. Scoop flesh into a bowl.\n2. Add lime juice and mash to your preferred texture.\n3. Fold in jalapeño, onion, coriander, garlic, and tomato.\n4. Season with salt. Taste and adjust lime.\n5. Serve immediately with tortilla chips.',
      category: 'Appetizer', difficulty: 'Easy', cookingTime: 5, prepTime: 5, cookTime: 0, servings: 4,
      tags: ['mexican','dip','vegetarian','quick'],
      imageFile: 'recipe-guacamole.jpg',
      imageUrl:  'https://images.unsplash.com/photo-1600335895229-6e75511892c8?w=600&h=400&fit=crop',
    },
    {
      title:        'Churros with Chocolate Sauce',
      description:  'Crispy fried dough sticks rolled in cinnamon sugar, served with a thick, dark chocolate dipping sauce. A beloved Mexican and Spanish treat.',
      ingredients:  ['250ml water','1 tbsp sugar','½ tsp salt','1 tbsp vegetable oil','150g plain flour','Oil for frying','100g caster sugar + 1 tsp cinnamon (for coating)','200g dark chocolate','150ml double cream'],
      instructions: '1. Bring water, sugar, salt, and oil to a boil. Remove from heat and stir in flour until a dough forms.\n2. Transfer to a piping bag with a star nozzle.\n3. Heat oil to 180°C. Pipe 10cm lengths into the oil and fry 3–4 minutes until golden.\n4. Drain and roll in cinnamon sugar.\n5. Heat cream until simmering, pour over chopped chocolate, stir until smooth.\n6. Serve churros hot with chocolate sauce.',
      category: 'Dessert', difficulty: 'Medium', cookingTime: 30, prepTime: 10, cookTime: 20, servings: 6,
      tags: ['mexican','dessert','fried','sweet'],
      imageFile: 'recipe-churros.jpg',
      imageUrl:  'https://images.unsplash.com/photo-1624353365286-3f8d62daad51?w=600&h=400&fit=crop',
    },
  ],

  'kenji@gmail.com': [
    {
      title:        'Chicken Ramen',
      description:  'A deeply flavourful chicken broth with springy ramen noodles, soft-boiled soy eggs, chashu chicken, and nori. Comfort in a bowl.',
      ingredients:  ['1kg chicken bones','2L water','4 garlic cloves','5cm ginger, sliced','3 tbsp soy sauce','1 tbsp mirin','400g fresh ramen noodles','2 chicken thighs (for chashu)','4 eggs','Nori sheets','Spring onions, sliced','Sesame oil','Corn kernels'],
      instructions: '1. Simmer chicken bones with water, garlic, and ginger for 3 hours. Strain broth.\n2. Season broth with soy sauce and mirin.\n3. Marinate chicken thighs in soy and mirin, then pan-fry until cooked. Slice.\n4. Soft-boil eggs for 6.5 minutes, peel and marinate in soy sauce for 1 hour.\n5. Cook noodles per packet instructions.\n6. Assemble bowls: noodles, hot broth, chicken, halved egg, nori, spring onions, corn, and sesame oil.',
      category: 'Dinner', difficulty: 'Hard', cookingTime: 210, prepTime: 30, cookTime: 180, servings: 4,
      tags: ['japanese','ramen','noodles','soup'],
      imageFile: 'recipe-ramen.jpg',
      imageUrl:  'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=600&h=400&fit=crop',
    },
    {
      title:        'Salmon Sushi Rolls',
      description:  'Fresh salmon and creamy avocado wrapped in seasoned sushi rice and nori. A beginner-friendly maki roll that looks impressive and tastes incredible.',
      ingredients:  ['300g sushi rice','3 tbsp rice vinegar','1 tbsp sugar','1 tsp salt','200g sashimi-grade salmon, sliced','1 avocado, sliced','4 nori sheets','Soy sauce to serve','Pickled ginger to serve','Wasabi to serve'],
      instructions: '1. Cook sushi rice. Mix vinegar, sugar, and salt; fold into warm rice. Cool to room temperature.\n2. Place nori on a bamboo mat, shiny side down. Spread rice evenly, leaving 2cm at the top.\n3. Lay salmon and avocado in a line across the centre.\n4. Roll tightly using the mat, pressing firmly. Seal the edge with a little water.\n5. Slice into 6–8 pieces with a wet knife.\n6. Serve with soy sauce, pickled ginger, and wasabi.',
      category: 'Lunch', difficulty: 'Medium', cookingTime: 45, prepTime: 30, cookTime: 15, servings: 4,
      tags: ['japanese','sushi','seafood','rice'],
      imageFile: 'recipe-sushi.jpg',
      imageUrl:  'https://images.unsplash.com/photo-1617196034183-421b4040ed20?w=600&h=400&fit=crop',
    },
    {
      title:        'Matcha Pancakes',
      description:  'Fluffy Japanese-style soufflé pancakes infused with earthy matcha powder, served with whipped cream and a drizzle of honey.',
      ingredients:  ['2 eggs, separated','3 tbsp milk','½ tsp vanilla extract','4 tbsp plain flour','1 tbsp matcha powder','½ tsp baking powder','3 tbsp caster sugar','Butter for cooking','Whipped cream and honey to serve'],
      instructions: '1. Mix egg yolks, milk, and vanilla. Sift in flour, matcha, and baking powder. Stir to combine.\n2. Whisk egg whites with sugar to stiff peaks.\n3. Gently fold whites into the batter in two additions.\n4. Heat a non-stick pan on very low heat with a little butter.\n5. Spoon batter into tall mounds, cover and cook 4–5 minutes per side.\n6. Serve with whipped cream and honey.',
      category: 'Breakfast', difficulty: 'Medium', cookingTime: 25, prepTime: 10, cookTime: 15, servings: 2,
      tags: ['japanese','breakfast','matcha','sweet'],
      imageFile: 'recipe-matcha-pancakes.jpg',
      imageUrl:  'https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=600&h=400&fit=crop',
    },
  ],
};

// ── downloader with User-Agent (follows redirects, opens stream only on 200) ──
function download(url, dest, redirects = 0) {
  return new Promise((resolve) => {
    if (redirects > 10) { resolve(false); return; }

    if (fs.existsSync(dest)) {
      try { if (fs.statSync(dest).size > 500) { resolve(true); return; } } catch (_) {}
      fs.unlinkSync(dest);
    }

    const isHttps = url.startsWith('https');
    const proto   = isHttps ? https : http;
    const urlObj  = new URL(url);

    const options = {
      hostname: urlObj.hostname,
      path:     urlObj.pathname + urlObj.search,
      headers:  { 'User-Agent': UA },
    };

    const req = proto.get(options, (res) => {
      if (res.statusCode === 301 || res.statusCode === 302) {
        res.resume();
        download(res.headers.location, dest, redirects + 1).then(resolve);
        return;
      }
      if (res.statusCode !== 200) {
        res.resume();
        console.warn(`  ✗ HTTP ${res.statusCode}: ${url}`);
        resolve(false); return;
      }
      const file = fs.createWriteStream(dest);
      res.pipe(file);
      file.on('finish', () => { file.close(); resolve(true); });
      file.on('error', (e) => { fs.unlink(dest, () => {}); resolve(false); });
    });

    req.on('error', (e) => { console.warn(`  ✗ ${e.message}`); resolve(false); });
    req.setTimeout(25000, () => { req.destroy(); console.warn(`  ✗ Timeout: ${url}`); resolve(false); });
  });
}

// ── main ──────────────────────────────────────────────────────────────────
mongoose.connect(process.env.MONGO_URI).then(async () => {
  if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR, { recursive: true });

  // 1. Delete all existing seeded recipes and their image files
  console.log('\n── Clearing existing recipes ──');
  const existing = await Recipe.find({}, 'title image');
  for (const r of existing) {
    if (r.image) {
      const filePath = path.join(__dirname, '../..', r.image);
      if (fs.existsSync(filePath)) { fs.unlinkSync(filePath); }
    }
  }
  await Recipe.deleteMany({});
  console.log(`  Deleted ${existing.length} recipes and their images.`);

  // 2. Seed fresh recipes with real food photos
  console.log('\n── Seeding new recipes ──');
  for (const [email, recipes] of Object.entries(RECIPES_BY_CHEF_EMAIL)) {
    const chef = await User.findOne({ email });
    if (!chef) { console.log(`  ⚠️  Chef not found: ${email}`); continue; }

    for (const { imageFile, imageUrl, ...recipeData } of recipes) {
      const dest = path.join(UPLOADS_DIR, imageFile);
      const ok   = await download(imageUrl, dest);

      if (!ok) {
        console.log(`  ✗ Image failed for "${recipeData.title}" — seeding without image`);
      }

      await Recipe.create({
        ...recipeData,
        chef:  chef._id,
        image: ok ? `/uploads/${imageFile}` : '',
      });
      console.log(`  ✓ ${recipeData.title} (${chef.name})${ok ? '' : ' [no image]'}`);
    }
  }

  // 3. Summary
  const total = await Recipe.countDocuments();
  console.log(`\n✅ Done — ${total} recipes in database.`);
  mongoose.disconnect();
});
