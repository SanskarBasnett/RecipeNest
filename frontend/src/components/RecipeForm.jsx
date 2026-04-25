import React, { useState, useEffect, useRef } from 'react';
import API, { getImageUrl } from '../api/axios';
import './RecipeForm.css';

/* ── Category combobox: type to filter, pick or create ── */
const CategoryCombobox = ({ value, onChange, categories }) => {
  const [open, setOpen]     = useState(false);
  const [query, setQuery]   = useState(value || '');
  const wrapRef             = useRef(null);

  // Keep query in sync when parent sets value (e.g. edit mode)
  useEffect(() => { setQuery(value || ''); }, [value]);

  // Close on outside click
  useEffect(() => {
    const handler = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const filtered = categories.filter(c =>
    c.toLowerCase().includes(query.toLowerCase())
  );

  const select = (cat) => {
    setQuery(cat);
    onChange(cat);
    setOpen(false);
  };

  const handleInput = (e) => {
    setQuery(e.target.value);
    onChange(e.target.value);
    setOpen(true);
  };

  return (
    <div className="rf-combo" ref={wrapRef}>
      <div className="rf-combo__input-wrap">
        <input
          type="text"
          value={query}
          onChange={handleInput}
          onFocus={() => setOpen(true)}
          placeholder="Add category..."
          autoComplete="off"
          className="rf-combo__input"
        />
        <button
          type="button"
          className="rf-combo__arrow"
          tabIndex={-1}
          onClick={() => setOpen(o => !o)}
          aria-label="Toggle category list"
        >▾</button>
      </div>
      {open && (
        <ul className="rf-combo__list">
          {filtered.length > 0
            ? filtered.map(c => (
                <li
                  key={c}
                  className={`rf-combo__item${c === value ? ' rf-combo__item--active' : ''}`}
                  onMouseDown={() => select(c)}
                >
                  {c}
                </li>
              ))
            : query.trim()
              ? <li className="rf-combo__item rf-combo__item--new" onMouseDown={() => select(query.trim())}>
                  + Create "{query.trim()}"
                </li>
              : <li className="rf-combo__item rf-combo__item--empty">No categories yet</li>
          }
        </ul>
      )}
    </div>
  );
};

const RecipeForm = ({ recipe, onSuccess, onCancel, hideCancel = false }) => {
  const [categories, setCategories] = useState([]);

  const [form, setForm] = useState({
    title:       '',
    description: '',
    category:    '',
    difficulty:  'Easy',
    prepTime:    '',
    cookTime:    '',
    servings:    4,
  });
  const [ingredients,  setIngredients]  = useState(['']);
  const [instructions, setInstructions] = useState(['']);
  const [imageFile,    setImageFile]    = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');

  // Load categories from backend
  const fetchCategories = () => {
    API.get('/categories').then(({ data }) => {
      setCategories(data);
    }).catch(() => {});
  };

  useEffect(() => { fetchCategories(); }, []);

  // Pre-fill when editing
  useEffect(() => {
    if (recipe) {
      setForm({
        title:       recipe.title       || '',
        description: recipe.description || '',
        category:    recipe.category    || '',
        difficulty:  recipe.difficulty  || 'Easy',
        prepTime:    recipe.prepTime    || '',
        cookTime:    recipe.cookTime    || '',
        servings:    recipe.servings    || 4,
      });
      setIngredients(
        Array.isArray(recipe.ingredients) && recipe.ingredients.length
          ? recipe.ingredients : ['']
      );
      if (recipe.instructions) {
        const steps = recipe.instructions.split('\n').filter(Boolean);
        setInstructions(steps.length ? steps : ['']);
      }
      if (recipe.image) setImagePreview(getImageUrl(recipe.image));
    }
  }, [recipe]);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  // Ingredients
  const updateIngredient = (i, val) => {
    const u = [...ingredients]; u[i] = val; setIngredients(u);
  };
  const addIngredient    = () => setIngredients([...ingredients, '']);
  const removeIngredient = (i) => setIngredients(ingredients.filter((_, idx) => idx !== i));

  // Instructions
  const updateInstruction = (i, val) => {
    const u = [...instructions]; u[i] = val; setInstructions(u);
  };
  const addInstruction    = () => setInstructions([...instructions, '']);
  const removeInstruction = (i) => setInstructions(instructions.filter((_, idx) => idx !== i));

  // Image
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const cleanIngredients  = ingredients.filter(i => i.trim());
    const cleanInstructions = instructions.filter(s => s.trim());

    if (!cleanIngredients.length)  { setError('Add at least one ingredient.'); return; }
    if (!cleanInstructions.length) { setError('Add at least one instruction step.'); return; }

    setLoading(true);
    try {
      // If the typed category isn't in the list, save it first
      const cat = form.category.trim();
      if (cat && !categories.includes(cat)) {
        try {
          await API.post('/categories', { name: cat });
          setCategories(prev => [...prev, cat].sort());
        } catch (_) {
          // Ignore duplicate errors — category may already exist
        }
      }

      const fd = new FormData();
      fd.append('title',        form.title);
      fd.append('description',  form.description);
      fd.append('category',     form.category);
      fd.append('difficulty',   form.difficulty);
      fd.append('prepTime',     form.prepTime  || 0);
      fd.append('cookTime',     form.cookTime  || 0);
      fd.append('servings',     form.servings);
      fd.append('ingredients',  JSON.stringify(cleanIngredients));
      fd.append('instructions', JSON.stringify(cleanInstructions));
      if (imageFile) fd.append('image', imageFile);

      if (recipe) {
        await API.put(`/recipes/${recipe._id}`, fd);
      } else {
        await API.post('/recipes', fd);
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
        <h2>{recipe ? 'Edit Recipe' : 'Add New Recipe'}</h2>
        {!hideCancel && (
          <button type="button" className="btn btn-ghost btn-sm" onClick={onCancel}>✕ Cancel</button>
        )}
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      <form onSubmit={handleSubmit}>

        {/* Image — at the top */}
        <div className="form-group">
          <label>Recipe Image</label>
          {imagePreview ? (
            <div className="image-preview">
              <img src={imagePreview} alt="preview" />
              <button
                type="button"
                className="image-preview__remove"
                onClick={() => { setImageFile(null); setImagePreview(null); }}
              >✕ Remove</button>
            </div>
          ) : (
            <label className="image-upload-box" htmlFor="rf-image">
              <span>📷</span>
              <span>Click to upload a photo</span>
              <small>JPG, PNG or WebP</small>
            </label>
          )}
          <input id="rf-image" type="file" accept="image/*"
            onChange={handleImageChange} style={{ display: 'none' }} />
        </div>

        {/* Title + Category */}
        <div className="form-row">
          <div className="form-group">
            <label>Title *</label>
            <input name="title" value={form.title} onChange={handleChange}
              required placeholder="e.g. Spaghetti Carbonara" />
          </div>
          <div className="form-group">
            <label>Category</label>
            <CategoryCombobox
              value={form.category}
              onChange={val => setForm(f => ({ ...f, category: val }))}
              categories={categories}
            />
          </div>
        </div>

        {/* Description */}
        <div className="form-group">
          <label>Description *</label>
          <textarea name="description" value={form.description} onChange={handleChange}
            required rows={3} placeholder="Brief description of the recipe..." />
        </div>

        {/* Difficulty + Servings + Times */}
        <div className="form-row form-row--4">
          <div className="form-group">
            <label>Difficulty</label>
            <select name="difficulty" value={form.difficulty} onChange={handleChange}>
              <option>Easy</option>
              <option>Medium</option>
              <option>Hard</option>
            </select>
          </div>
          <div className="form-group">
            <label>Servings</label>
            <input type="number" name="servings" value={form.servings}
              onChange={handleChange} min="1" placeholder="4" />
          </div>
          <div className="form-group">
            <label>Prep Time (min)</label>
            <input type="number" name="prepTime" value={form.prepTime}
              onChange={handleChange} min="0" placeholder="15" />
          </div>
          <div className="form-group">
            <label>Cook Time (min)</label>
            <input type="number" name="cookTime" value={form.cookTime}
              onChange={handleChange} min="0" placeholder="30" />
          </div>
        </div>

        {/* Ingredients */}
        <div className="form-group">
          <label>Ingredients *</label>
          <div className="rf-list">
            {ingredients.map((ing, i) => (
              <div key={i} className="rf-list__row">
                <input value={ing} onChange={e => updateIngredient(i, e.target.value)}
                  placeholder="e.g. 200g pasta" />
                {ingredients.length > 1 && (
                  <button type="button" className="rf-list__remove"
                    onClick={() => removeIngredient(i)} aria-label="Remove">✕</button>
                )}
              </div>
            ))}
            <button type="button" className="rf-list__add" onClick={addIngredient}>
              + Add Ingredient
            </button>
          </div>
        </div>

        {/* Instructions */}
        <div className="form-group">
          <label>Instructions *</label>
          <div className="rf-list">
            {instructions.map((step, i) => (
              <div key={i} className="rf-list__row rf-list__row--step">
                <span className="rf-list__step-num">{i + 1}</span>
                <textarea value={step} onChange={e => updateInstruction(i, e.target.value)}
                  rows={2} placeholder={`Step ${i + 1}...`} />
                {instructions.length > 1 && (
                  <button type="button" className="rf-list__remove"
                    onClick={() => removeInstruction(i)} aria-label="Remove">✕</button>
                )}
              </div>
            ))}
            <button type="button" className="rf-list__add" onClick={addInstruction}>
              + Add Step
            </button>
          </div>
        </div>

        <div className="form-actions">
          {!hideCancel && (
            <button type="button" className="btn btn-ghost" onClick={onCancel}>Cancel</button>
          )}
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? 'Saving...' : recipe ? 'Update Recipe' : 'Add Recipe'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default RecipeForm;
