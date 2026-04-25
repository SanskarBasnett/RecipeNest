const mongoose = require('mongoose');
require('dotenv').config();

const User   = require('../models/User.model');
const Recipe = require('../models/Recipe.model');

mongoose.connect(process.env.MONGO_URI).then(async () => {
  const oldEmails = [
    'marco@recipenest.com',
    'aisha@recipenest.com',
    'jeanluc@recipenest.com',
    'sofia@recipenest.com',
    'kenji@recipenest.com',
  ];

  const oldChefs = await User.find({ email: { $in: oldEmails } }, '_id email');
  const oldIds   = oldChefs.map(c => c._id);

  const delR = await Recipe.deleteMany({ chef: { $in: oldIds } });
  const delU = await User.deleteMany({ _id: { $in: oldIds } });

  console.log('Deleted old chef accounts:', delU.deletedCount);
  console.log('Deleted their recipes:', delR.deletedCount);

  mongoose.disconnect();
  console.log('Done.');
});
