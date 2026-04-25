const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema(
  {
    user:   { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    name:   { type: String, required: true },
    avatar: { type: String, default: '' },
    text:   { type: String, required: true, trim: true, maxlength: 1000 },
  },
  { timestamps: true }
);

const recipeSchema = new mongoose.Schema(
  {
    title:        { type: String, required: true, trim: true },
    description:  { type: String, required: true },
    ingredients:  [{ type: String, required: true }],
    instructions: { type: String, required: true },
    category:     { type: String, default: 'General' },
    difficulty: {
      type: String,
      enum: ['Easy', 'Medium', 'Hard'],
      default: 'Easy',
    },
    cookingTime: { type: Number, default: 0 },
    prepTime:    { type: Number, default: 0 },
    cookTime:    { type: Number, default: 0 },
    servings:    { type: Number, default: 4 },
    tags:        [{ type: String }],
    image:       { type: String, default: '' },
    chef:        { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    // Likes — array of user IDs who liked this recipe
    likes:       [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    // Comments
    comments:    [commentSchema],
  },
  { timestamps: true }
);

module.exports = mongoose.model('Recipe', recipeSchema);
