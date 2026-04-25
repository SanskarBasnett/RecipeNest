const mongoose = require('mongoose');
require('dotenv').config();
require('../models/User.model');
const Recipe = require('../models/Recipe.model');

mongoose.connect(process.env.MONGO_URI).then(async () => {
  const recipes = await Recipe.find({}, 'title image').populate('chef', 'name');
  recipes.forEach(r => console.log(r.title, '|', r.chef?.name || 'NO CHEF', '|', r.image || 'NO IMAGE'));
  console.log('\nTotal:', recipes.length);
  mongoose.disconnect();
});
