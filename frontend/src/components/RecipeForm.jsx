import React, { useState, useEffect } from 'react';
import API, { getImageUrl } from '../api/axios';
import './RecipeForm.css';

const RecipeForm = ({ recipe, onSuccess, onCancel }) => {
  const [form, setForm] = useState({
    title: '',
    description: '',
    ingredients: '',
    instructions: '',
    category: 'General',
    difficulty: 'Easy',
    cookingTime: '',
  });
  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState(null); // local preview of selected file
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Pre-fill form when editing
  useEffect(() => {
    if (recipe) {
      setForm({
        title: recipe.title || '',
        description: recipe.description || '',
        ingredients: Array.isArray(recipe.ingredients) ? recipe.ingredients.join(', ') : '',
        instructions: recipe.instructions || '',
        category: recipe.category || 'General',
        difficulty: recipe.difficulty || 'Easy',
        cookingTime: recipe.cookingTime || '',
      });
      // Show existing image as preview
      if (recipe.image) setPreview(getImageUrl(recipe.image));
    }
  }, [recipe]);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setImage(file);
    // Show local preview immediately
    setPreview(URL.createObjectURL(file));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const formData = new FormData();
      Object.entries(form).forEach(([k, v]) => formData.append(k, v));
      if (image) formData.append('image', image);

      // Let axios set Content-Type automatically (includes multipart boundary)
      if (recipe) {
        await API.put(`/recipes/${recipe._id}`, formData);
      } else {
        await API.post('/recipes', formData);
      }
      onSuccess();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save recipe');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="recipe-form card">
      <div className="recipe-form__header">
        <h2>{recipe ? '✏️ Edit Recipe' : '➕ Add New Recipe'}</h2>
        <button className="btn btn-ghost btn-sm" onClick={onCancel}>✕ Cancel</button>
      </div>
      {error && <div className="alert alert-error">{error}</div>}

      <form onSubmit={handleSubmit}>
        <div className="form-row">
          <div className="form-group">
            <label>Title *</label>
            <input
              name="title"
              value={form.title}
              onChange={handleChange}
              required
              placeholder="Spaghetti Carbonara"
            />
          </div>
          <div className="form-group">
            <label>Category</label>
            <select name="category" value={form.category} onChange={handleChange}>
              {['General', 'Italian', 'Asian', 'Mexican', 'Dessert', 'Vegan', 'Breakfast', 'Seafood'].map(
                (c) => <option key={c}>{c}</option>
              )}
            </select>
          </div>
        </div>

        <div className="form-group">
          <label>Description *</label>
          <textarea
            name="description"
            value={form.description}
            onChange={handleChange}
            required
            rows={3}
            placeholder="Brief description of the recipe..."
          />
        </div>

        <div className="form-group">
          <label>Ingredients * (comma separated)</label>
          <textarea
            name="ingredients"
            value={form.ingredients}
            onChange={handleChange}
            required
            rows={3}
            placeholder="200g pasta, 2 eggs, 100g pancetta..."
          />
        </div>

        <div className="form-group">
          <label>Instructions *</label>
          <textarea
            name="instructions"
            value={form.instructions}
            onChange={handleChange}
            required
            rows={5}
            placeholder="Step 1: Boil water..."
          />
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Difficulty</label>
            <select name="difficulty" value={form.difficulty} onChange={handleChange}>
              <option>Easy</option>
              <option>Medium</option>
              <option>Hard</option>
            </select>
          </div>
          <div className="form-group">
            <label>Cooking Time (minutes)</label>
            <input
              type="number"
              name="cookingTime"
              value={form.cookingTime}
              onChange={handleChange}
              placeholder="30"
              min="1"
            />
          </div>
        </div>

        <div className="form-group">
          <label>Recipe Image</label>
          {preview && (
            <div className="image-preview">
              <img src={preview} alt="preview" />
            </div>
          )}
          <input type="file" accept="image/*" onChange={handleImageChange} />
        </div>

        <div className="form-actions">
          <button type="button" className="btn btn-ghost" onClick={onCancel}>Cancel</button>
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? 'Saving...' : recipe ? 'Update Recipe' : 'Add Recipe'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default RecipeForm;
