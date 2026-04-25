const mongoose = require('mongoose');
require('dotenv').config();
require('../models/User.model');
const Recipe = require('../models/Recipe.model');

mongoose.connect(process.env.MONGO_URI).then(async () => {
  // Delete all recipes with no image or with old titles
  const stale = ['Butter Chicken (Murgh Makhani)', 'Salmon Sushi Rolls (Maki)', 'Mango Lassi', 'Palak Paneer'];
  const del = await Recipe.deleteMany({ title: { $in: stale } });
  console.log('Deleted stale recipes:', del.deletedCount);

  const recipes = await Recipe.find({}, 'title image').populate('chef', 'name');
  recipes.forEach(r => console.log(' ', r.title, '|', r.chef?.name, '|', r.image || 'NO IMAGE'));
  console.log('Total:', recipes.length);
  mongoose.disconnect();
});
