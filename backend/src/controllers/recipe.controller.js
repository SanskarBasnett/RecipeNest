/**
 * @file recipe.controller.js
 * @description Controller for recipe CRUD, likes, and comments.
 *
 * Public endpoints allow anyone to browse recipes.
 * Protected endpoints require a valid JWT; some are further restricted to
 * specific roles (chef, admin) via the `authorize` middleware in the router.
 *
 * Notification documents are created here whenever a user likes or comments
 * on a chef's recipe so the chef is alerted in their dashboard.
 */

const Recipe       = require('../models/Recipe.model');
const Notification = require('../models/Notification.model');

// ---------------------------------------------------------------------------
// Read — Public
// ---------------------------------------------------------------------------

/**
 * @route   GET /api/recipes
 * @desc    Retrieve all recipes with optional filtering and sorting.
 * @access  Public
 *
 * Supported query parameters:
 *  - `sort`       — 'newest' (default) | 'oldest' | 'title' | 'difficulty'
 *  - `category`   — filter by category name
 *  - `difficulty` — filter by difficulty level ('Easy' | 'Medium' | 'Hard')
 *  - `chef`       — filter by chef ObjectId
 *
 * @param {import('express').Request}  req
 * @param {import('express').Response} res
 */
const getAllRecipes = async (req, res) => {
  try {
    const { sort, category, difficulty, chef } = req.query;

    // Build the filter object dynamically — only add a field if the query
    // param was actually provided so we don't accidentally filter on undefined
    const filter = {};
    if (category)   filter.category   = category;
    if (difficulty) filter.difficulty = difficulty;
    if (chef)       filter.chef       = chef;

    // Map the `sort` query param to a Mongoose sort descriptor
    let sortOption = { createdAt: -1 }; // default: newest first
    if (sort === 'oldest')     sortOption = { createdAt: 1 };
    if (sort === 'title')      sortOption = { title: 1 };
    if (sort === 'difficulty') sortOption = { difficulty: 1 };

    const recipes = await Recipe.find(filter)
      .sort(sortOption)
      // Populate only the fields the recipe card UI needs to avoid over-fetching
      .populate('chef', 'name avatar specialty');

    res.json(recipes);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/**
 * @route   GET /api/recipes/liked
 * @desc    Retrieve all recipes that the authenticated user has liked.
 * @access  Private (any logged-in user)
 *
 * Queries recipes where the user's ID appears in the `likes` array.
 * Used to populate the "Favourites" section of the user dashboard.
 *
 * @param {import('express').Request}  req - `req.user` populated by `protect`.
 * @param {import('express').Response} res
 */
const getLikedRecipes = async (req, res) => {
  try {
    const recipes = await Recipe.find({ likes: req.user._id })
      .sort({ createdAt: -1 })
      .populate('chef', 'name avatar specialty');
    res.json(recipes);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/**
 * @route   GET /api/recipes/:id
 * @desc    Retrieve a single recipe by its MongoDB ObjectId.
 * @access  Public
 *
 * Validates the ID format before querying to return a clean 400 instead of
 * a Mongoose CastError. Populates additional chef fields for the detail page.
 *
 * @param {import('express').Request}  req - Params: { id }
 * @param {import('express').Response} res
 */
const getRecipeById = async (req, res) => {
  try {
    // Reject obviously invalid IDs before hitting the database
    if (!req.params.id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ message: 'Invalid recipe ID' });
    }

    const recipe = await Recipe.findById(req.params.id).populate(
      'chef',
      'name avatar specialty location' // extra fields needed on the detail page
    );
    if (!recipe) return res.status(404).json({ message: 'Recipe not found' });
    res.json(recipe);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ---------------------------------------------------------------------------
// Create — Chef only
// ---------------------------------------------------------------------------

/**
 * @route   POST /api/recipes
 * @desc    Create a new recipe.
 * @access  Private — chef only
 *
 * Handles flexible input formats for `ingredients`, `instructions`, and `tags`
 * because the frontend sends them as JSON strings via multipart form data.
 *
 * @param {import('express').Request}  req - Body fields + optional `req.file` from multer.
 * @param {import('express').Response} res
 */
const createRecipe = async (req, res) => {
  try {
    const {
      title, description, ingredients, instructions,
      category, difficulty, cookingTime, prepTime, cookTime, servings, tags,
    } = req.body;

    // If a file was uploaded, build the public URL path; otherwise use empty string
    const image = req.file ? `/uploads/${req.file.filename}` : '';

    // ---------------------------------------------------------------------------
    // Normalise `ingredients`
    // The form sends a JSON-encoded array string. We always want to store an array.
    // ---------------------------------------------------------------------------
    let parsedIngredients = ingredients;
    if (typeof ingredients === 'string') {
      try {
        parsedIngredients = JSON.parse(ingredients);
      } catch {
        // Fall back to splitting on commas if JSON parsing fails
        parsedIngredients = ingredients.split(',').map(i => i.trim()).filter(Boolean);
      }
    }

    // ---------------------------------------------------------------------------
    // Normalise `instructions`
    // The form sends an array of step strings. We store them as a single
    // newline-separated string for simplicity.
    // ---------------------------------------------------------------------------
    let parsedInstructions = instructions;
    if (Array.isArray(instructions)) {
      parsedInstructions = instructions.filter(Boolean).join('\n');
    } else if (typeof instructions === 'string') {
      try {
        const arr = JSON.parse(instructions);
        if (Array.isArray(arr)) parsedInstructions = arr.filter(Boolean).join('\n');
      } catch { /* keep as-is if it's already a plain string */ }
    }

    // Normalise `tags` — same flexible parsing as ingredients
    let parsedTags = tags || [];
    if (typeof tags === 'string') {
      try {
        parsedTags = JSON.parse(tags);
      } catch {
        parsedTags = tags.split(',').map(t => t.trim()).filter(Boolean);
      }
    }

    // Derive total cooking time from prepTime + cookTime when provided,
    // falling back to the legacy `cookingTime` field if neither is given
    const totalTime = Number(prepTime || 0) + Number(cookTime || 0) || Number(cookingTime || 0);

    const recipe = await Recipe.create({
      title,
      description,
      ingredients:  parsedIngredients,
      instructions: parsedInstructions,
      category,
      difficulty,
      cookingTime:  totalTime,
      prepTime:     Number(prepTime || 0),
      cookTime:     Number(cookTime || 0),
      servings:     Number(servings || 4),
      tags:         parsedTags,
      image,
      chef:         req.user._id,
    });

    res.status(201).json(recipe);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ---------------------------------------------------------------------------
// Update — Owner chef or admin
// ---------------------------------------------------------------------------

/**
 * @route   PUT /api/recipes/:id
 * @desc    Update an existing recipe.
 * @access  Private — owner chef or admin
 *
 * Only the recipe's author or an admin may edit it. Fields are updated
 * selectively — only fields present in the request body are changed.
 *
 * @param {import('express').Request}  req - Params: { id }; Body: partial recipe fields.
 * @param {import('express').Response} res
 */
const updateRecipe = async (req, res) => {
  try {
    const recipe = await Recipe.findById(req.params.id);
    if (!recipe) return res.status(404).json({ message: 'Recipe not found' });

    // Authorisation check: only the owning chef or an admin can edit
    if (recipe.chef.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to edit this recipe' });
    }

    const {
      title, description, ingredients, instructions,
      category, difficulty, cookingTime, prepTime, cookTime, servings, tags,
    } = req.body;

    // Apply simple scalar field updates only when the value was provided
    if (title)       recipe.title       = title;
    if (description) recipe.description = description;
    if (category)    recipe.category    = category;
    if (difficulty)  recipe.difficulty  = difficulty;
    if (servings)    recipe.servings    = Number(servings);

    // Normalise and update ingredients if provided
    if (ingredients) {
      let parsed = ingredients;
      if (typeof ingredients === 'string') {
        try { parsed = JSON.parse(ingredients); }
        catch { parsed = ingredients.split(',').map(i => i.trim()).filter(Boolean); }
      }
      recipe.ingredients = parsed;
    }

    // Normalise and update instructions if provided
    if (instructions) {
      let parsed = instructions;
      if (Array.isArray(instructions)) {
        parsed = instructions.filter(Boolean).join('\n');
      } else if (typeof instructions === 'string') {
        try {
          const arr = JSON.parse(instructions);
          if (Array.isArray(arr)) parsed = arr.filter(Boolean).join('\n');
        } catch { /* keep as string */ }
      }
      recipe.instructions = parsed;
    }

    // Normalise and update tags if provided (check for undefined explicitly
    // so that an empty array can still clear the tags)
    if (tags !== undefined) {
      let parsed = tags;
      if (typeof tags === 'string') {
        try { parsed = JSON.parse(tags); }
        catch { parsed = tags.split(',').map(t => t.trim()).filter(Boolean); }
      }
      recipe.tags = parsed;
    }

    // Update timing fields and recalculate the total cooking time
    if (prepTime !== undefined) recipe.prepTime = Number(prepTime);
    if (cookTime !== undefined) recipe.cookTime  = Number(cookTime);
    const total = Number(prepTime || recipe.prepTime || 0) + Number(cookTime || recipe.cookTime || 0);
    recipe.cookingTime = total || Number(cookingTime || recipe.cookingTime || 0);

    // Replace the image if a new file was uploaded
    if (req.file) recipe.image = `/uploads/${req.file.filename}`;

    const updated = await recipe.save();
    res.json(updated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ---------------------------------------------------------------------------
// Delete — Owner chef or admin
// ---------------------------------------------------------------------------

/**
 * @route   DELETE /api/recipes/:id
 * @desc    Delete a recipe.
 * @access  Private — owner chef or admin
 *
 * @param {import('express').Request}  req - Params: { id }
 * @param {import('express').Response} res
 */
const deleteRecipe = async (req, res) => {
  try {
    const recipe = await Recipe.findById(req.params.id);
    if (!recipe) return res.status(404).json({ message: 'Recipe not found' });

    // Only the owning chef or an admin may delete the recipe
    if (recipe.chef.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to delete this recipe' });
    }

    await recipe.deleteOne();
    res.json({ message: 'Recipe deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ---------------------------------------------------------------------------
// Chef's own recipes
// ---------------------------------------------------------------------------

/**
 * @route   GET /api/recipes/chef/my
 * @desc    Retrieve all recipes created by the authenticated chef.
 * @access  Private — chef only
 *
 * Used to populate the chef's personal recipe management dashboard.
 *
 * @param {import('express').Request}  req - `req.user` populated by `protect`.
 * @param {import('express').Response} res
 */
const getMyRecipes = async (req, res) => {
  try {
    // Filter by the logged-in chef's ID and sort newest-first
    const recipes = await Recipe.find({ chef: req.user._id }).sort({ createdAt: -1 });
    res.json(recipes);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ---------------------------------------------------------------------------
// Likes
// ---------------------------------------------------------------------------

/**
 * @route   POST /api/recipes/:id/like
 * @desc    Toggle a like on a recipe for the authenticated user.
 * @access  Private (any logged-in user)
 *
 * If the user has not yet liked the recipe, their ID is added to the `likes`
 * array. If they have already liked it, their ID is removed (unlike).
 *
 * A notification is sent to the recipe's chef when a like is added, but not
 * when it is removed. Duplicate like notifications are prevented by deleting
 * any existing like notification for the same user+recipe pair before creating
 * a new one.
 *
 * @param {import('express').Request}  req - Params: { id }
 * @param {import('express').Response} res
 */
const toggleLike = async (req, res) => {
  try {
    const recipe = await Recipe.findById(req.params.id);
    if (!recipe) return res.status(404).json({ message: 'Recipe not found' });

    const uid = req.user._id.toString();

    // Check whether the user has already liked this recipe
    const idx      = recipe.likes.findIndex(id => id.toString() === uid);
    const isLiking = idx === -1; // true = adding a like, false = removing it

    if (isLiking) {
      recipe.likes.push(req.user._id);
    } else {
      recipe.likes.splice(idx, 1);
    }

    await recipe.save();

    // Send a notification to the chef only when a like is being added and
    // the liker is not the chef themselves
    if (isLiking && recipe.chef.toString() !== uid) {
      // Remove any previous like notification from this user for this recipe
      // to avoid stacking duplicates if the user likes, unlikes, then likes again
      await Notification.findOneAndDelete({
        recipient: recipe.chef,
        sender: { $elemMatch: { id: req.user._id } },
        type: 'like',
        recipe: recipe._id,
      });

      // Create a fresh like notification
      await Notification.create({
        recipient:   recipe.chef,
        sender:      { id: req.user._id, name: req.user.name, avatar: req.user.avatar || '' },
        type:        'like',
        recipe:      recipe._id,
        recipeTitle: recipe.title,
      });
    }

    // Return the updated like count and the new liked state for the UI
    res.json({ likes: recipe.likes.length, liked: isLiking });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ---------------------------------------------------------------------------
// Comments
// ---------------------------------------------------------------------------

/**
 * @route   POST /api/recipes/:id/comments
 * @desc    Add a comment to a recipe.
 * @access  Private (any logged-in user)
 *
 * Validates that the comment text is non-empty, pushes a new comment
 * sub-document onto the recipe, and notifies the chef (unless the commenter
 * is the chef themselves).
 *
 * @param {import('express').Request}  req - Params: { id }; Body: { text }
 * @param {import('express').Response} res
 */
const addComment = async (req, res) => {
  try {
    const { text } = req.body;

    // Reject empty or whitespace-only comments
    if (!text || !text.trim())
      return res.status(400).json({ message: 'Comment text is required.' });

    const recipe = await Recipe.findById(req.params.id);
    if (!recipe) return res.status(404).json({ message: 'Recipe not found' });

    // Build the comment sub-document with a snapshot of the user's current
    // name and avatar so the comment display remains accurate even if the
    // user later changes their profile
    const comment = {
      user:   req.user._id,
      name:   req.user.name,
      avatar: req.user.avatar || '',
      text:   text.trim(),
    };

    recipe.comments.push(comment);
    await recipe.save();

    // Notify the chef when someone other than themselves comments on their recipe
    if (recipe.chef.toString() !== req.user._id.toString()) {
      await Notification.create({
        recipient:   recipe.chef,
        sender:      { id: req.user._id, name: req.user.name, avatar: req.user.avatar || '' },
        type:        'comment',
        recipe:      recipe._id,
        recipeTitle: recipe.title,
        // Truncate the comment preview to 120 characters for the notification feed
        commentText: text.trim().substring(0, 120),
      });
    }

    // Return the newly created comment sub-document
    const saved = recipe.comments[recipe.comments.length - 1];
    res.status(201).json(saved);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/**
 * @route   DELETE /api/recipes/:id/comments/:commentId
 * @desc    Delete a comment from a recipe.
 * @access  Private — comment owner or admin
 *
 * Uses Mongoose's subdocument `.id()` helper to locate the comment by its
 * embedded `_id`, then calls `.deleteOne()` on the sub-document to remove it
 * from the array before saving the parent recipe document.
 *
 * @param {import('express').Request}  req - Params: { id, commentId }
 * @param {import('express').Response} res
 */
const deleteComment = async (req, res) => {
  try {
    const recipe = await Recipe.findById(req.params.id);
    if (!recipe) return res.status(404).json({ message: 'Recipe not found' });

    // Locate the comment sub-document within the recipe's comments array
    const comment = recipe.comments.id(req.params.commentId);
    if (!comment) return res.status(404).json({ message: 'Comment not found' });

    // Only the comment's author or an admin may delete it
    if (comment.user.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to delete this comment' });
    }

    // Remove the sub-document from the embedded array
    comment.deleteOne();
    await recipe.save();

    res.json({ message: 'Comment deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = {
  getAllRecipes,
  getRecipeById,
  createRecipe,
  updateRecipe,
  deleteRecipe,
  getMyRecipes,
  getLikedRecipes,
  toggleLike,
  addComment,
  deleteComment,
};
