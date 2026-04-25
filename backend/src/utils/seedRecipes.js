const User          = require('../models/User.model');
const Recipe        = require('../models/Recipe.model');
const downloadImage = require('./downloadImage');

const RECIPES_BY_CHEF_EMAIL = {
  'marco@gmail.com': [
    {
      title:        'Classic Spaghetti Carbonara',
      description:  'A rich and creamy Roman pasta dish made with eggs, Pecorino Romano, guanciale, and black pepper. No cream needed — the magic is all in the technique.',
      ingredients:  ['400g spaghetti', '200g guanciale or pancetta, diced', '4 large eggs', '100g Pecorino Romano, finely grated', '50g Parmesan, finely grated', 'Freshly ground black pepper', 'Salt for pasta water'],
      instructions: '1. Cook spaghetti in well-salted boiling water until al dente.\n2. Fry guanciale in a pan over medium heat until crispy. Remove from heat.\n3. Whisk eggs with Pecorino and Parmesan in a bowl. Season generously with black pepper.\n4. Reserve 1 cup pasta water. Drain pasta and add to the pan with guanciale off the heat.\n5. Pour egg mixture over pasta, tossing quickly and adding pasta water a splash at a time to create a creamy sauce.\n6. Serve immediately with extra cheese and pepper.',
      category: 'Dinner', difficulty: 'Medium', cookingTime: 25, prepTime: 10, cookTime: 15, servings: 4,
      tags: ['pasta', 'italian', 'quick'],
      imageUrl:  'https://picsum.photos/seed/carbonara/600/400',
      imageFile: 'recipe-carbonara.jpg',
    },
    {
      title:        'Margherita Pizza',
      description:  'The queen of pizzas — a thin, crispy Neapolitan base topped with San Marzano tomato sauce, fresh mozzarella, and fragrant basil.',
      ingredients:  ['500g 00 flour', '7g instant yeast', '10g salt', '325ml warm water', '2 tbsp olive oil', '400g San Marzano tomatoes, crushed', '250g fresh mozzarella, torn', 'Fresh basil leaves', 'Extra virgin olive oil to finish'],
      instructions: '1. Mix flour, yeast, and salt. Add water and olive oil, knead for 10 minutes until smooth.\n2. Cover and prove for 1 hour until doubled.\n3. Divide into 2 balls, stretch each into a thin round base.\n4. Spread crushed tomatoes, add torn mozzarella.\n5. Bake at 250°C (480°F) for 8–10 minutes until crust is charred and cheese is bubbling.\n6. Top with fresh basil and a drizzle of olive oil.',
      category: 'Dinner', difficulty: 'Medium', cookingTime: 90, prepTime: 70, cookTime: 10, servings: 4,
      tags: ['pizza', 'italian', 'vegetarian'],
      imageUrl:  'https://picsum.photos/seed/margherita/600/400',
      imageFile: 'recipe-margherita.jpg',
    },
    {
      title:        'Tiramisu',
      description:  'Italy\'s most beloved dessert — layers of espresso-soaked ladyfingers and a light mascarpone cream, dusted with cocoa powder.',
      ingredients:  ['300g ladyfinger biscuits', '500g mascarpone', '4 eggs, separated', '100g caster sugar', '300ml strong espresso, cooled', '3 tbsp Marsala wine or rum', 'Cocoa powder for dusting'],
      instructions: '1. Whisk egg yolks with sugar until pale and thick. Fold in mascarpone.\n2. Whisk egg whites to stiff peaks and gently fold into mascarpone mixture.\n3. Mix espresso with Marsala. Quickly dip each ladyfinger and layer in a dish.\n4. Spread half the mascarpone cream over the biscuits. Repeat layers.\n5. Dust generously with cocoa powder.\n6. Refrigerate for at least 4 hours or overnight before serving.',
      category: 'Dessert', difficulty: 'Medium', cookingTime: 30, prepTime: 30, cookTime: 0, servings: 8,
      tags: ['dessert', 'italian', 'no-bake'],
      imageUrl:  'https://picsum.photos/seed/tiramisu/600/400',
      imageFile: 'recipe-tiramisu.jpg',
    },
  ],

  'aisha@gmail.com': [
    {
      title:        'Chicken Biryani',
      description:  'Fragrant basmati rice layered with spiced chicken, caramelised onions, and saffron. A celebration dish that fills the kitchen with incredible aromas.',
      ingredients:  ['600g chicken thighs', '400g basmati rice', '2 onions, thinly sliced', '200g plain yoghurt', '2 tsp garam masala', '1 tsp turmeric', '1 tsp cumin', '4 garlic cloves, minced', '1 tbsp ginger, grated', 'Pinch of saffron in 3 tbsp warm milk', '50g butter', 'Fresh mint and coriander', 'Salt to taste'],
      instructions: '1. Marinate chicken in yoghurt, garam masala, turmeric, cumin, garlic, and ginger for 2 hours.\n2. Fry onions in oil until deep golden and crispy. Set aside.\n3. Par-cook rice in salted water until 70% done. Drain.\n4. Layer chicken in a heavy pot, top with rice, fried onions, saffron milk, and butter.\n5. Cover tightly and cook on low heat for 30 minutes (dum cooking).\n6. Gently mix before serving. Garnish with mint and coriander.',
      category: 'Dinner', difficulty: 'Hard', cookingTime: 90, prepTime: 30, cookTime: 60, servings: 6,
      tags: ['indian', 'rice', 'chicken'],
      imageUrl:  'https://picsum.photos/seed/biryani/600/400',
      imageFile: 'recipe-biryani.jpg',
    },
    {
      title:        'Dal Makhani',
      description:  'Slow-cooked black lentils and kidney beans in a rich, buttery tomato sauce. A North Indian classic that gets better the longer it simmers.',
      ingredients:  ['250g whole black lentils (urad dal)', '50g kidney beans', '2 onions, finely chopped', '3 tomatoes, puréed', '4 garlic cloves, minced', '1 tbsp ginger, grated', '1 tsp cumin seeds', '1 tsp garam masala', '½ tsp chilli powder', '50g butter', '100ml double cream', 'Salt to taste', 'Fresh coriander'],
      instructions: '1. Soak lentils and kidney beans overnight. Pressure cook until soft.\n2. Melt butter in a pan, add cumin seeds. Sauté onions until golden.\n3. Add garlic and ginger, cook 2 minutes. Add tomato purée and spices.\n4. Add cooked lentils and beans. Simmer on low heat for 1 hour, stirring often.\n5. Stir in cream and simmer 10 more minutes.\n6. Garnish with coriander and a swirl of cream. Serve with naan.',
      category: 'Dinner', difficulty: 'Medium', cookingTime: 90, prepTime: 20, cookTime: 70, servings: 4,
      tags: ['indian', 'vegetarian', 'lentils'],
      imageUrl:  'https://picsum.photos/seed/dalmakhani/600/400',
      imageFile: 'recipe-dal-makhani.jpg',
    },
  ],

  'jeanluc@gmail.com': [
    {
      title:        'Classic Croissants',
      description:  'Buttery, flaky, and perfectly laminated — authentic French croissants take time but the result is incomparable. A true labour of love.',
      ingredients:  ['500g strong white flour', '10g salt', '80g sugar', '10g instant yeast', '300ml cold milk', '280g cold unsalted butter (for lamination)', '1 egg yolk + 1 tbsp milk (egg wash)'],
      instructions: '1. Mix flour, salt, sugar, yeast, and milk into a dough. Knead briefly, wrap and refrigerate overnight.\n2. Beat butter into a flat rectangle. Encase in dough and fold 3 times (letter fold), chilling 30 min between each fold.\n3. Roll out and cut into triangles. Roll up from base to tip.\n4. Prove at room temperature for 2 hours until puffy.\n5. Brush with egg wash and bake at 200°C for 18–20 minutes until deep golden.',
      category: 'Breakfast', difficulty: 'Hard', cookingTime: 480, prepTime: 460, cookTime: 20, servings: 12,
      tags: ['french', 'pastry', 'breakfast', 'baking'],
      imageUrl:  'https://picsum.photos/seed/croissants/600/400',
      imageFile: 'recipe-croissants.jpg',
    },
    {
      title:        'Crème Brûlée',
      description:  'A silky vanilla custard beneath a perfectly caramelised sugar crust. The satisfying crack of the spoon through the toffee top is pure joy.',
      ingredients:  ['500ml double cream', '1 vanilla pod, split', '5 egg yolks', '100g caster sugar', '4 tbsp demerara sugar (for topping)'],
      instructions: '1. Heat cream with vanilla pod until just simmering. Remove pod.\n2. Whisk egg yolks with caster sugar until pale. Slowly pour in warm cream, whisking constantly.\n3. Strain into ramekins. Place in a bain-marie and bake at 150°C for 35–40 minutes until just set.\n4. Cool, then refrigerate for at least 2 hours.\n5. Sprinkle demerara sugar on top and caramelise with a blowtorch until golden and crackly.',
      category: 'Dessert', difficulty: 'Medium', cookingTime: 60, prepTime: 15, cookTime: 40, servings: 4,
      tags: ['french', 'dessert', 'classic'],
      imageUrl:  'https://picsum.photos/seed/cremebrulee/600/400',
      imageFile: 'recipe-creme-brulee.jpg',
    },
    {
      title:        'French Onion Soup',
      description:  'Deeply caramelised onions in a rich beef broth, topped with a crusty crouton and melted Gruyère. The ultimate French comfort food.',
      ingredients:  ['1kg onions, thinly sliced', '50g butter', '2 tbsp olive oil', '1 tsp sugar', '200ml dry white wine', '1.2L beef stock', '1 tbsp plain flour', '1 baguette, sliced', '150g Gruyère, grated', 'Salt and pepper', 'Fresh thyme'],
      instructions: '1. Melt butter with oil in a large pot. Add onions and cook on low heat for 45 minutes, stirring often, until deeply golden.\n2. Add sugar and flour, stir 2 minutes. Pour in wine and reduce.\n3. Add stock and thyme, simmer 20 minutes. Season well.\n4. Ladle into oven-safe bowls. Top with baguette slices and Gruyère.\n5. Grill under a hot broiler until cheese is bubbling and golden.',
      category: 'Lunch', difficulty: 'Medium', cookingTime: 75, prepTime: 10, cookTime: 65, servings: 4,
      tags: ['french', 'soup', 'comfort food'],
      imageUrl:  'https://picsum.photos/seed/onionsoup/600/400',
      imageFile: 'recipe-french-onion-soup.jpg',
    },
  ],

  'sofia@gmail.com': [
    {
      title:        'Chicken Tacos al Pastor',
      description:  'Juicy achiote-marinated chicken with pineapple, served in warm corn tortillas with fresh salsa, onion, and coriander. Street food at its finest.',
      ingredients:  ['600g chicken thighs', '3 tbsp achiote paste', '2 tbsp white vinegar', '1 tsp cumin', '1 tsp oregano', '2 garlic cloves', '200g pineapple, sliced', '12 small corn tortillas', '1 white onion, finely diced', 'Fresh coriander', 'Lime wedges', 'Salsa verde to serve'],
      instructions: '1. Blend achiote paste, vinegar, cumin, oregano, and garlic into a marinade.\n2. Coat chicken and marinate for at least 2 hours.\n3. Grill chicken and pineapple over high heat until charred.\n4. Slice chicken thinly. Warm tortillas on a dry pan.\n5. Assemble tacos with chicken, pineapple, onion, and coriander.\n6. Serve with lime wedges and salsa verde.',
      category: 'Dinner', difficulty: 'Easy', cookingTime: 30, prepTime: 15, cookTime: 15, servings: 4,
      tags: ['mexican', 'tacos', 'chicken', 'street food'],
      imageUrl:  'https://picsum.photos/seed/tacos/600/400',
      imageFile: 'recipe-tacos.jpg',
    },
    {
      title:        'Guacamole',
      description:  'Fresh, chunky guacamole made the traditional way — ripe Hass avocados, lime, jalapeño, coriander, and a pinch of salt. Ready in 5 minutes.',
      ingredients:  ['3 ripe Hass avocados', '1 lime, juiced', '1 jalapeño, finely chopped', '½ red onion, finely diced', 'Small bunch of coriander, chopped', '1 garlic clove, minced', 'Salt to taste', '1 tomato, deseeded and diced'],
      instructions: '1. Halve and stone avocados. Scoop flesh into a bowl.\n2. Add lime juice and mash to your preferred texture (chunky or smooth).\n3. Fold in jalapeño, onion, coriander, garlic, and tomato.\n4. Season with salt. Taste and adjust lime.\n5. Serve immediately with tortilla chips.',
      category: 'Appetizer', difficulty: 'Easy', cookingTime: 5, prepTime: 5, cookTime: 0, servings: 4,
      tags: ['mexican', 'dip', 'vegetarian', 'quick'],
      imageUrl:  'https://picsum.photos/seed/guacamole/600/400',
      imageFile: 'recipe-guacamole.jpg',
    },
    {
      title:        'Churros with Chocolate Sauce',
      description:  'Crispy fried dough sticks rolled in cinnamon sugar, served with a thick, dark chocolate dipping sauce. A beloved Mexican and Spanish treat.',
      ingredients:  ['250ml water', '1 tbsp sugar', '½ tsp salt', '1 tbsp vegetable oil', '150g plain flour', 'Oil for frying', '100g caster sugar + 1 tsp cinnamon (for coating)', '200g dark chocolate', '150ml double cream'],
      instructions: '1. Bring water, sugar, salt, and oil to a boil. Remove from heat and stir in flour until a dough forms.\n2. Transfer to a piping bag with a star nozzle.\n3. Heat oil to 180°C. Pipe 10cm lengths into the oil and fry 3–4 minutes until golden.\n4. Drain and roll in cinnamon sugar.\n5. For sauce: heat cream until simmering, pour over chopped chocolate, stir until smooth.\n6. Serve churros hot with chocolate sauce.',
      category: 'Dessert', difficulty: 'Medium', cookingTime: 30, prepTime: 10, cookTime: 20, servings: 6,
      tags: ['mexican', 'dessert', 'fried', 'sweet'],
      imageUrl:  'https://picsum.photos/seed/churros/600/400',
      imageFile: 'recipe-churros.jpg',
    },
  ],

  'kenji@gmail.com': [
    {
      title:        'Chicken Ramen',
      description:  'A deeply flavourful tonkotsu-style chicken broth with springy ramen noodles, soft-boiled soy eggs, chashu chicken, and nori. Comfort in a bowl.',
      ingredients:  ['1kg chicken bones', '2L water', '4 garlic cloves', '5cm ginger, sliced', '3 tbsp soy sauce', '1 tbsp mirin', '400g fresh ramen noodles', '2 chicken thighs (for chashu)', '4 eggs', '2 tbsp soy sauce (for eggs)', 'Nori sheets', 'Spring onions, sliced', 'Sesame oil', 'Corn kernels'],
      instructions: '1. Simmer chicken bones with water, garlic, and ginger for 3 hours. Strain broth.\n2. Season broth with soy sauce and mirin.\n3. Marinate chicken thighs in soy and mirin, then pan-fry until cooked. Slice.\n4. Soft-boil eggs for 6.5 minutes, peel and marinate in soy sauce for 1 hour.\n5. Cook noodles per packet instructions.\n6. Assemble bowls: noodles, hot broth, chicken, halved egg, nori, spring onions, corn, and a drizzle of sesame oil.',
      category: 'Dinner', difficulty: 'Hard', cookingTime: 210, prepTime: 30, cookTime: 180, servings: 4,
      tags: ['japanese', 'ramen', 'noodles', 'soup'],
      imageUrl:  'https://picsum.photos/seed/ramen/600/400',
      imageFile: 'recipe-ramen.jpg',
    },
    {
      title:        'Salmon Sushi Rolls (Maki)',
      description:  'Fresh salmon and creamy avocado wrapped in seasoned sushi rice and nori. A beginner-friendly maki roll that looks impressive and tastes incredible.',
      ingredients:  ['300g sushi rice', '3 tbsp rice vinegar', '1 tbsp sugar', '1 tsp salt', '200g sashimi-grade salmon, sliced', '1 avocado, sliced', '4 nori sheets', 'Soy sauce to serve', 'Pickled ginger to serve', 'Wasabi to serve'],
      instructions: '1. Cook sushi rice. Mix vinegar, sugar, and salt; fold into warm rice. Cool to room temperature.\n2. Place nori on a bamboo mat, shiny side down. Spread rice evenly, leaving 2cm at the top.\n3. Lay salmon and avocado in a line across the centre.\n4. Roll tightly using the mat, pressing firmly. Seal the edge with a little water.\n5. Slice into 6–8 pieces with a wet knife.\n6. Serve with soy sauce, pickled ginger, and wasabi.',
      category: 'Lunch', difficulty: 'Medium', cookingTime: 45, prepTime: 30, cookTime: 15, servings: 4,
      tags: ['japanese', 'sushi', 'seafood', 'rice'],
      imageUrl:  'https://picsum.photos/seed/sushiroll/600/400',
      imageFile: 'recipe-sushi.jpg',
    },
    {
      title:        'Matcha Pancakes',
      description:  'Fluffy Japanese-style soufflé pancakes infused with earthy matcha powder, served with whipped cream and a drizzle of honey.',
      ingredients:  ['2 eggs, separated', '3 tbsp milk', '½ tsp vanilla extract', '4 tbsp plain flour', '1 tbsp matcha powder', '½ tsp baking powder', '3 tbsp caster sugar', 'Butter for cooking', 'Whipped cream and honey to serve'],
      instructions: '1. Mix egg yolks, milk, and vanilla. Sift in flour, matcha, and baking powder. Stir to combine.\n2. Whisk egg whites with sugar to stiff peaks.\n3. Gently fold whites into the batter in two additions.\n4. Heat a non-stick pan on very low heat with a little butter.\n5. Spoon batter into tall mounds, cover and cook 4–5 minutes per side.\n6. Serve with whipped cream and honey.',
      category: 'Breakfast', difficulty: 'Medium', cookingTime: 25, prepTime: 10, cookTime: 15, servings: 2,
      tags: ['japanese', 'breakfast', 'matcha', 'sweet'],
      imageUrl:  'https://picsum.photos/seed/matchapancakes/600/400',
      imageFile: 'recipe-matcha-pancakes.jpg',
    },
  ],
};

const seedRecipes = async () => {
  try {
    for (const [email, recipes] of Object.entries(RECIPES_BY_CHEF_EMAIL)) {
      const chef = await User.findOne({ email });
      if (!chef) {
        console.warn(`⚠️  Chef not found for email ${email}, skipping recipes.`);
        continue;
      }

      for (const { imageUrl, imageFile, ...recipeData } of recipes) {
        const exists = await Recipe.findOne({ title: recipeData.title, chef: chef._id });
        if (!exists) {
          const imagePath = await downloadImage(imageUrl, imageFile);
          await Recipe.create({ ...recipeData, chef: chef._id, image: imagePath || '' });
          console.log(`✅ Recipe seeded: "${recipeData.title}"${imagePath ? ' (with image)' : ''}`);
        } else if (!exists.image) {
          // Recipe exists but has no image — download and patch
          const imagePath = await downloadImage(imageUrl, imageFile);
          if (imagePath) {
            await Recipe.updateOne({ _id: exists._id }, { image: imagePath });
            console.log(`🖼️  Image added for existing recipe: "${recipeData.title}"`);
          }
        }
      }
    }
  } catch (err) {
    console.error('❌ Recipe seed error:', err.message);
  }
};

module.exports = seedRecipes;
