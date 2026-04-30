/**
 * @file Category.model.js
 * @description Mongoose model for recipe categories.
 *
 * Categories are simple named labels (e.g. "Italian", "Desserts") that chefs
 * assign to their recipes. They are stored as documents so that admins and
 * chefs can manage the list dynamically through the API rather than relying
 * on a hard-coded enum.
 */

const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema(
  {
    /**
     * The display name of the category.
     * Must be unique (case-sensitive at the DB level; the controller performs
     * a case-insensitive duplicate check before inserting).
     * Whitespace is trimmed to prevent near-duplicate entries.
     */
    name: { type: String, required: true, unique: true, trim: true },

    /**
     * Reference to the User (chef or admin) who created this category.
     * Optional — seed-created categories may not have a creator.
     */
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  {
    // Automatically adds `createdAt` and `updatedAt` timestamp fields
    timestamps: true,
  }
);

module.exports = mongoose.model('Category', categorySchema);
