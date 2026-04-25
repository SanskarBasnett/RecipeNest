const mongoose = require('mongoose');
require('dotenv').config();
const User   = require('../models/User.model');
const Recipe = require('../models/Recipe.model');

mongoose.connect(process.env.MONGO_URI).then(async () => {
  const aisha = await User.findOne({ email: 'aisha@gmail.com' });
  if (!aisha) { console.log('Chef not found'); mongoose.disconnect(); return; }

  // Remove old recipes
  await Recipe.deleteMany({ title: { $in: ['Palak Paneer', 'Mango Lassi'] }, chef: aisha._id });
  console.log('Removed old recipes.');

  // Add Chicken Biryani
  await Recipe.create({
    title:        'Chicken Biryani',
    description:  'Fragrant basmati rice layered with spiced chicken, caramelised onions, saffron, and fresh herbs. A royal dish that fills the kitchen with an irresistible aroma.',
    ingredients:  [
      '600g chicken thighs, bone-in',
      '400g basmati rice, soaked 30 min',
      '2 large onions, thinly sliced',
      '200g plain yoghurt',
      '2 tsp biryani masala',
      '1 tsp turmeric',
      '1 tsp red chilli powder',
      '4 garlic cloves, minced',
      '1 tbsp ginger, grated',
      'Pinch of saffron in 3 tbsp warm milk',
      '4 tbsp ghee',
      'Fresh mint and coriander',
      'Salt to taste',
    ],
    instructions: '1. Marinate chicken in yoghurt, biryani masala, turmeric, chilli, garlic, and ginger for 2 hours.\n2. Fry onions in ghee until deep golden and crispy. Set half aside for garnish.\n3. Cook marinated chicken with remaining onions until 80% done.\n4. Par-boil rice until 70% cooked. Drain.\n5. Layer rice over chicken in a heavy pot. Drizzle saffron milk and ghee. Top with mint, coriander, and crispy onions.\n6. Seal with foil and lid. Cook on very low heat (dum) for 25 minutes.\n7. Gently mix and serve with raita.',
    category:   'Dinner',
    difficulty: 'Hard',
    cookingTime: 90,
    prepTime:    30,
    cookTime:    60,
    servings:    4,
    tags:        ['indian', 'rice', 'chicken', 'biryani'],
    image:       '/uploads/recipe-biryani.jpg',
    chef:        aisha._id,
  });
  console.log('Added: Chicken Biryani');

  // Add Dal Makhani
  await Recipe.create({
    title:        'Dal Makhani',
    description:  'Slow-cooked black lentils and kidney beans in a rich, buttery tomato sauce. A North Indian classic that gets better the longer it simmers.',
    ingredients:  [
      '250g whole black lentils (urad dal), soaked overnight',
      '50g kidney beans, soaked overnight',
      '2 tbsp butter',
      '1 tbsp oil',
      '1 onion, finely chopped',
      '3 garlic cloves, minced',
      '1 tsp ginger, grated',
      '400g canned tomatoes, blended',
      '1 tsp cumin seeds',
      '1 tsp garam masala',
      '½ tsp red chilli powder',
      '100ml double cream',
      'Salt to taste',
      'Fresh coriander to serve',
    ],
    instructions: '1. Pressure cook lentils and kidney beans with salt and water for 20 minutes until soft.\n2. Heat butter and oil. Add cumin seeds, then onion — cook until golden.\n3. Add garlic and ginger, cook 2 minutes. Add blended tomatoes and spices.\n4. Simmer tomato mixture 10 minutes until oil separates.\n5. Add cooked lentils and beans. Simmer on low heat for 30–45 minutes, stirring often.\n6. Stir in cream and simmer 5 more minutes.\n7. Garnish with coriander and a swirl of cream. Serve with naan or rice.',
    category:   'Dinner',
    difficulty: 'Medium',
    cookingTime: 75,
    prepTime:    15,
    cookTime:    60,
    servings:    4,
    tags:        ['indian', 'vegetarian', 'lentils', 'comfort food'],
    image:       '/uploads/recipe-dal-makhani.jpg',
    chef:        aisha._id,
  });
  console.log('Added: Dal Makhani');

  const total = await Recipe.countDocuments();
  console.log(`Total recipes: ${total}`);
  mongoose.disconnect();
});
