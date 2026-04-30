/**
 * @file Recipe.model.js
 * @description Mongoose models for recipes and their embedded comments.
 *
 * A Recipe document contains all content authored by a chef, including
 * ingredients, instructions, timing, and media. It also embeds an array of
 * Comment sub-documents and tracks which users have liked the recipe.
 */

const mongoose = require('mongoose');

// ---------------------------------------------------------------------------
// Comment Sub-Schema
// Comments are embedded directly inside the Recipe document rather than
// stored in a separate collection. This keeps reads fast (no extra query)
// and is appropriate given the expected comment volume per recipe.
// ---------------------------------------------------------------------------
const commentSchema = new mongoose.Schema(
  {
    /** Reference to the User who posted the comment. */
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },

    /** Snapshot of the commenter's display name at the time of posting. */
    name: { type: String, required: true },

    /** Snapshot of the commenter's avatar URL at the time of posting. */
    avatar: { type: String, default: '' },

    /** The comment body. Trimmed and capped at 1 000 characters. */
    text: { type: String, required: true, trim: true, maxlength: 1000 },
  },
  {
    // Adds `createdAt` / `updatedAt` to each comment sub-document
    timestamps: true,
  }
);

// ---------------------------------------------------------------------------
// Recipe Schema
// ---------------------------------------------------------------------------
const recipeSchema = new mongoose.Schema(
  {
    /** Recipe display name. Required and whitespace-trimmed. */
    title: { type: String, required: true, trim: true },

    /** Short description or introduction shown on recipe cards and detail pages. */
    description: { type: String, required: true },

    /**
     * List of ingredients. Each element is a plain string
     * (e.g. "2 cups all-purpose flour").
     */
    ingredients: [{ type: String, required: true }],

    /**
     * Step-by-step cooking instructions stored as a single string.
     * The controller normalises array input (from the form) into a
     * newline-separated string before saving.
     */
    instructions: { type: String, required: true },

    /** Recipe category name (e.g. "Italian", "Desserts"). Defaults to "General". */
    category: { type: String, default: 'General' },

    /**
     * Difficulty level of the recipe.
     * Constrained to three values to keep filtering consistent.
     */
    difficulty: {
      type: String,
      enum: ['Easy', 'Medium', 'Hard'],
      default: 'Easy',
    },

    /** Total cooking time in minutes (prepTime + cookTime). */
    cookingTime: { type: Number, default: 0 },

    /** Preparation time in minutes (chopping, marinating, etc.). */
    prepTime: { type: Number, default: 0 },

    /** Active cooking time in minutes (on the stove / in the oven). */
    cookTime: { type: Number, default: 0 },

    /** Number of servings the recipe yields. Defaults to 4. */
    servings: { type: Number, default: 4 },

    /** Free-form tags for search and discovery (e.g. ["vegan", "quick"]). */
    tags: [{ type: String }],

    /** URL path to the recipe's hero image (e.g. "/uploads/recipe-biryani.jpg"). */
    image: { type: String, default: '' },

    /** Reference to the chef (User) who created this recipe. */
    chef: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },

    /**
     * Array of User IDs who have liked this recipe.
     * Used to toggle likes and derive the like count without a separate
     * aggregation query.
     */
    likes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],

    /** Embedded comment sub-documents. See commentSchema above. */
    comments: [commentSchema],
  },
  {
    // Automatically adds `createdAt` and `updatedAt` timestamp fields
    timestamps: true,
  }
);

module.exports = mongoose.model('Recipe', recipeSchema);
