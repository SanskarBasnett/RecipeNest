const Recipe = require('../models/Recipe.model');

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
    const { title, description, ingredients, instructions, category, difficulty, cookingTime } =
      req.body;

    const image = req.file ? `/uploads/${req.file.filename}` : '';

    const recipe = await Recipe.create({
      title,
      description,
      ingredients: Array.isArray(ingredients) ? ingredients : ingredients.split(',').map((i) => i.trim()),
      instructions,
      category,
      difficulty,
      cookingTime,
      image,
      chef: req.user._id,
    });

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

    // Only the chef who created it or an admin can edit
    if (recipe.chef.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to edit this recipe' });
    }

    const { title, description, ingredients, instructions, category, difficulty, cookingTime } =
      req.body;

    if (title) recipe.title = title;
    if (description) recipe.description = description;
    if (ingredients)
      recipe.ingredients = Array.isArray(ingredients)
        ? ingredients
        : ingredients.split(',').map((i) => i.trim());
    if (instructions) recipe.instructions = instructions;
    if (category) recipe.category = category;
    if (difficulty) recipe.difficulty = difficulty;
    if (cookingTime) recipe.cookingTime = cookingTime;
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

module.exports = { getAllRecipes, getRecipeById, createRecipe, updateRecipe, deleteRecipe, getMyRecipes };
