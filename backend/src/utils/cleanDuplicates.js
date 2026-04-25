const mongoose = require('mongoose');
require('dotenv').config();

const Recipe = require('../models/Recipe.model');
const User   = require('../models/User.model');

mongoose.connect(process.env.MONGO_URI).then(async () => {
  // 1. Delete recipes with no image
  const delRecipes = await Recipe.deleteMany({ image: '' });
  console.log('Deleted recipes with no image:', delRecipes.deletedCount);

  // 2. Remove duplicate chefs — keep the one with an avatar
  const chefs = await User.find({ role: 'chef' });
  const byEmail = {};
  for (const c of chefs) {
    if (!byEmail[c.email]) byEmail[c.email] = [];
    byEmail[c.email].push(c);
  }

  let deletedChefs = 0;
  for (const dupes of Object.values(byEmail)) {
    if (dupes.length > 1) {
      const withAvatar = dupes.find(c => c.avatar);
      const toDelete   = dupes.filter(c => !c.avatar).map(c => c._id);
      if (withAvatar && toDelete.length) {
        await User.deleteMany({ _id: { $in: toDelete } });
        deletedChefs += toDelete.length;
        console.log('Removed duplicate chef:', withAvatar.email);
      }
    }
  }
  console.log('Deleted chef duplicates:', deletedChefs);

  // 3. Remove duplicate recipes — keep the one with an image
  const recipes = await Recipe.find({});
  const byTitleChef = {};
  for (const r of recipes) {
    const key = `${r.title}__${r.chef}`;
    if (!byTitleChef[key]) byTitleChef[key] = [];
    byTitleChef[key].push(r);
  }

  let deletedRecipes2 = 0;
  for (const dupes of Object.values(byTitleChef)) {
    if (dupes.length > 1) {
      const withImage = dupes.find(r => r.image);
      const toDelete  = dupes.filter(r => !r.image).map(r => r._id);
      if (withImage && toDelete.length) {
        await Recipe.deleteMany({ _id: { $in: toDelete } });
        deletedRecipes2 += toDelete.length;
        console.log('Removed duplicate recipe:', withImage.title);
      }
    }
  }
  console.log('Deleted recipe duplicates:', deletedRecipes2);

  mongoose.disconnect();
  console.log('Done.');
});
