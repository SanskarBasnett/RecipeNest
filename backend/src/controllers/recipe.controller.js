const Recipe       = require('../models/Recipe.model');
const Notification = require('../models/Notification.model');
const logActivity  = require('../utils/logActivity');

// @route GET /api/recipes
// Get all recipes (public) - supports sort & filter query params
const getAllRecipes = async (req, res) => {
  try {
    const { sort, category, difficulty, chef } = req.query;

    const filter = {};
    if (category) filter.category = category;
    if (difficulty) filter.difficulty = difficulty;
    if (chef) filter.chef = chef;

    // Sort options: newest | oldest | title
    let sortOption = { createdAt: -1 }; // default: newest
    if (sort === 'oldest') sortOption = { createdAt: 1 };
    if (sort === 'title') sortOption = { title: 1 };
    if (sort === 'difficulty') sortOption = { difficulty: 1 };

    const recipes = await Recipe.find(filter)
      .sort(sortOption)
      .populate('chef', 'name avatar specialty');

    res.json(recipes);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @route GET /api/recipes/:id
// Get single recipe (public)
const getRecipeById = async (req, res) => {
  try {
    if (!req.params.id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ message: 'Invalid recipe ID' });
    }

    const recipe = await Recipe.findById(req.params.id).populate(
      'chef',
      'name avatar specialty location'
    );
    if (!recipe) return res.status(404).json({ message: 'Recipe not found' });
    res.json(recipe);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @route POST /api/recipes
// Create recipe (chef only)
const createRecipe = async (req, res) => {
  try {
    const {
      title, description, ingredients, instructions,
      category, difficulty, cookingTime, prepTime, cookTime, servings, tags,
    } = req.body;

    const image = req.file ? `/uploads/${req.file.filename}` : '';

    // ingredients can arrive as JSON array string or comma-separated
    let parsedIngredients = ingredients;
    if (typeof ingredients === 'string') {
      try { parsedIngredients = JSON.parse(ingredients); }
      catch { parsedIngredients = ingredients.split(',').map(i => i.trim()).filter(Boolean); }
    }

    // instructions can arrive as JSON array (steps) or plain string
    let parsedInstructions = instructions;
    if (Array.isArray(instructions)) {
      parsedInstructions = instructions.filter(Boolean).join('\n');
    } else if (typeof instructions === 'string') {
      try {
        const arr = JSON.parse(instructions);
        if (Array.isArray(arr)) parsedInstructions = arr.filter(Boolean).join('\n');
      } catch { /* keep as string */ }
    }

    // tags
    let parsedTags = tags || [];
    if (typeof tags === 'string') {
      try { parsedTags = JSON.parse(tags); }
      catch { parsedTags = tags.split(',').map(t => t.trim()).filter(Boolean); }
    }

    const totalTime = Number(prepTime || 0) + Number(cookTime || 0) || Number(cookingTime || 0);

    const recipe = await Recipe.create({
      title, description,
      ingredients: parsedIngredients,
      instructions: parsedInstructions,
      category, difficulty,
      cookingTime: totalTime,
      prepTime: Number(prepTime || 0),
      cookTime: Number(cookTime || 0),
      servings: Number(servings || 4),
      tags: parsedTags,
      image,
      chef: req.user._id,
    });

    await logActivity('RECIPE_CREATE',
      { id: req.user._id, name: req.user.name, role: req.user.role },
      { type: 'recipe', id: recipe._id, label: recipe.title }
    );

    res.status(201).json(recipe);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @route PUT /api/recipes/:id
// Update recipe (owner chef or admin)
const updateRecipe = async (req, res) => {
  try {
    const recipe = await Recipe.findById(req.params.id);
    if (!recipe) return res.status(404).json({ message: 'Recipe not found' });

    if (recipe.chef.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to edit this recipe' });
    }

    const {
      title, description, ingredients, instructions,
      category, difficulty, cookingTime, prepTime, cookTime, servings, tags,
    } = req.body;

    if (title)       recipe.title = title;
    if (description) recipe.description = description;
    if (category)    recipe.category = category;
    if (difficulty)  recipe.difficulty = difficulty;
    if (servings)    recipe.servings = Number(servings);

    if (ingredients) {
      let parsed = ingredients;
      if (typeof ingredients === 'string') {
        try { parsed = JSON.parse(ingredients); }
        catch { parsed = ingredients.split(',').map(i => i.trim()).filter(Boolean); }
      }
      recipe.ingredients = parsed;
    }

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

    if (tags !== undefined) {
      let parsed = tags;
      if (typeof tags === 'string') {
        try { parsed = JSON.parse(tags); }
        catch { parsed = tags.split(',').map(t => t.trim()).filter(Boolean); }
      }
      recipe.tags = parsed;
    }

    if (prepTime !== undefined) recipe.prepTime = Number(prepTime);
    if (cookTime !== undefined) recipe.cookTime  = Number(cookTime);
    const total = Number(prepTime || recipe.prepTime || 0) + Number(cookTime || recipe.cookTime || 0);
    recipe.cookingTime = total || Number(cookingTime || recipe.cookingTime || 0);

    if (req.file) recipe.image = `/uploads/${req.file.filename}`;

    const updated = await recipe.save();
    res.json(updated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @route DELETE /api/recipes/:id
// Delete recipe (owner chef or admin)
const deleteRecipe = async (req, res) => {
  try {
    const recipe = await Recipe.findById(req.params.id);
    if (!recipe) return res.status(404).json({ message: 'Recipe not found' });

    if (recipe.chef.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to delete this recipe' });
    }

    await recipe.deleteOne();
    res.json({ message: 'Recipe deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @route GET /api/recipes/my
// Get logged-in chef's own recipes
const getMyRecipes = async (req, res) => {
  try {
    const recipes = await Recipe.find({ chef: req.user._id }).sort({ createdAt: -1 });
    res.json(recipes);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @route POST /api/recipes/:id/like
// Toggle like on a recipe (any logged-in user)
const toggleLike = async (req, res) => {
  try {
    const recipe = await Recipe.findById(req.params.id);
    if (!recipe) return res.status(404).json({ message: 'Recipe not found' });

    const uid = req.user._id.toString();
    const idx = recipe.likes.findIndex(id => id.toString() === uid);
    const isLiking = idx === -1;

    if (isLiking) {
      recipe.likes.push(req.user._id);
    } else {
      recipe.likes.splice(idx, 1);
    }

    await recipe.save();

    // Notify the chef when someone (not themselves) likes their recipe
    if (isLiking && recipe.chef.toString() !== uid) {
      // Avoid duplicate like notifications — remove old one first
      await Notification.findOneAndDelete({
        recipient: recipe.chef,
        sender: { $elemMatch: { id: req.user._id } },
        type: 'like',
        recipe: recipe._id,
      });
      await Notification.create({
        recipient:   recipe.chef,
        sender:      { id: req.user._id, name: req.user.name, avatar: req.user.avatar || '' },
        type:        'like',
        recipe:      recipe._id,
        recipeTitle: recipe.title,
      });
    }

    res.json({ likes: recipe.likes.length, liked: isLiking });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @route POST /api/recipes/:id/comments
// Add a comment (any logged-in user)
const addComment = async (req, res) => {
  try {
    const { text } = req.body;
    if (!text || !text.trim())
      return res.status(400).json({ message: 'Comment text is required.' });

    const recipe = await Recipe.findById(req.params.id);
    if (!recipe) return res.status(404).json({ message: 'Recipe not found' });

    const comment = {
      user:   req.user._id,
      name:   req.user.name,
      avatar: req.user.avatar || '',
      text:   text.trim(),
    };

    recipe.comments.push(comment);
    await recipe.save();

    // Notify the chef when someone (not themselves) comments
    if (recipe.chef.toString() !== req.user._id.toString()) {
      await Notification.create({
        recipient:   recipe.chef,
        sender:      { id: req.user._id, name: req.user.name, avatar: req.user.avatar || '' },
        type:        'comment',
        recipe:      recipe._id,
        recipeTitle: recipe.title,
        commentText: text.trim().substring(0, 120),
      });
    }

    const saved = recipe.comments[recipe.comments.length - 1];
    res.status(201).json(saved);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @route DELETE /api/recipes/:id/comments/:commentId
// Delete a comment (comment owner or admin)
const deleteComment = async (req, res) => {
  try {
    const recipe = await Recipe.findById(req.params.id);
    if (!recipe) return res.status(404).json({ message: 'Recipe not found' });

    const comment = recipe.comments.id(req.params.commentId);
    if (!comment) return res.status(404).json({ message: 'Comment not found' });

    if (comment.user.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to delete this comment' });
    }

    comment.deleteOne();
    await recipe.save();
    res.json({ message: 'Comment deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = { getAllRecipes, getRecipeById, createRecipe, updateRecipe, deleteRecipe, getMyRecipes, toggleLike, addComment, deleteComment };
