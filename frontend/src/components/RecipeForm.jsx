import React, { useState, useEffect, useRef } from 'react';
import API, { getImageUrl } from '../api/axios';

/* ── Category combobox ── */
const CategoryCombobox = ({ value, onChange, categories }) => {
  const [open, setOpen]   = useState(false);
  const [query, setQuery] = useState(value || '');
  const wrapRef           = useRef(null);

  useEffect(() => { setQuery(value || ''); }, [value]);
  useEffect(() => {
    const h = (e) => { if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  const filtered    = categories.filter(c => c.toLowerCase().includes(query.toLowerCase()));
  const select      = (cat) => { setQuery(cat); onChange(cat); setOpen(false); };
  const handleInput = (e)   => { setQuery(e.target.value); onChange(e.target.value); setOpen(true); };

  return (
    <div className="relative w-full" ref={wrapRef}>
      <div className="flex items-center overflow-hidden rounded-lg" style={{ border: '1.5px solid var(--border)', background: 'var(--bg-input)' }}>
        <input
          type="text" value={query} onChange={handleInput} onFocus={() => setOpen(true)}
          placeholder="Select..." autoComplete="off"
          className="flex-1 border-0 bg-transparent px-3 py-2.5 text-sm font-[inherit] focus:outline-none"
          style={{ color: 'var(--text)' }}
        />
        <button type="button" tabIndex={-1} onClick={() => setOpen(o => !o)}
          className="bg-transparent border-0 border-l px-3 self-stretch flex items-center text-sm cursor-pointer"
          style={{ borderColor: 'var(--border)', color: 'var(--text-muted)' }}>▾</button>
      </div>
      {open && (
        <ul className="absolute top-[calc(100%+4px)] left-0 right-0 rounded-lg overflow-y-auto z-[100] py-1 m-0 list-none"
          style={{ background: 'var(--bg-card)', border: '1.5px solid var(--border)', boxShadow: 'var(--shadow-md)', maxHeight: '200px' }}>
          {filtered.length > 0
            ? filtered.map(c => (
                <li key={c} onMouseDown={() => select(c)}
                  className={`px-3 py-2 text-sm cursor-pointer hover:bg-[rgba(242,140,0,0.08)] ${c === value ? 'font-semibold' : ''}`}
                  style={{ color: c === value ? 'var(--primary)' : 'var(--text)' }}>{c}</li>
              ))
            : query.trim()
              ? <li onMouseDown={() => select(query.trim())} className="px-3 py-2 text-sm cursor-pointer font-semibold" style={{ color: 'var(--primary)' }}>+ Create "{query.trim()}"</li>
              : <li className="px-3 py-2 text-sm" style={{ color: 'var(--text-muted)' }}>No categories yet</li>
          }
        </ul>
      )}
    </div>
  );
};

/* ── Divider ── */
const Divider = ({ label }) => (
  <div className="flex items-center gap-3 my-6">
    <div className="flex-1 h-px" style={{ background: 'var(--border)' }} />
    <span className="text-[0.65rem] font-bold uppercase tracking-widest flex-shrink-0" style={{ color: 'var(--text-muted)' }}>{label}</span>
    <div className="flex-1 h-px" style={{ background: 'var(--border)' }} />
  </div>
);

/* ── Main form ── */
const RecipeForm = ({ recipe, onSuccess, onCancel, hideCancel = false }) => {
  const [categories, setCategories] = useState([]);
  const [form, setForm] = useState({
    title: '', description: '', category: '',
    difficulty: 'Easy', prepTime: '', cookTime: '', servings: 4,
  });
  const [ingredients,  setIngredients]  = useState(['']);
  const [instructions, setInstructions] = useState(['']);
  const [imageFile,    setImageFile]    = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');

  useEffect(() => { API.get('/categories').then(({ data }) => setCategories(data)).catch(() => {}); }, []);

  useEffect(() => {
    if (!recipe) return;
    setForm({
      title: recipe.title || '', description: recipe.description || '',
      category: recipe.category || '', difficulty: recipe.difficulty || 'Easy',
      prepTime: recipe.prepTime || '', cookTime: recipe.cookTime || '', servings: recipe.servings || 4,
    });
    setIngredients(Array.isArray(recipe.ingredients) && recipe.ingredients.length ? recipe.ingredients : ['']);
    if (recipe.instructions) {
      const steps = recipe.instructions.split('\n').filter(Boolean);
      setInstructions(steps.length ? steps : ['']);
    }
    if (recipe.image) setImagePreview(getImageUrl(recipe.image));
  }, [recipe]);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const updateIngredient  = (i, v) => { const u = [...ingredients]; u[i] = v; setIngredients(u); };
  const addIngredient     = () => setIngredients([...ingredients, '']);
  const removeIngredient  = (i) => setIngredients(ingredients.filter((_, x) => x !== i));
  const updateInstruction = (i, v) => { const u = [...instructions]; u[i] = v; setInstructions(u); };
  const addInstruction    = () => setInstructions([...instructions, '']);
  const removeInstruction = (i) => setInstructions(instructions.filter((_, x) => x !== i));

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    const cleanIng  = ingredients.filter(i => i.trim());
    const cleanInst = instructions.filter(s => s.trim());
    if (!cleanIng.length)  { setError('Add at least one ingredient.'); return; }
    if (!cleanInst.length) { setError('Add at least one instruction step.'); return; }
    setLoading(true);
    try {
      const cat = form.category.trim();
      if (cat && !categories.includes(cat)) {
        try { await API.post('/categories', { name: cat }); setCategories(p => [...p, cat].sort()); } catch (_) {}
      }
      const fd = new FormData();
      fd.append('title', form.title); fd.append('description', form.description);
      fd.append('category', form.category); fd.append('difficulty', form.difficulty);
      fd.append('prepTime', form.prepTime || 0); fd.append('cookTime', form.cookTime || 0);
      fd.append('servings', form.servings);
      fd.append('ingredients', JSON.stringify(cleanIng));
      fd.append('instructions', JSON.stringify(cleanInst));
      if (imageFile) fd.append('image', imageFile);
      if (recipe) await API.put(`/recipes/${recipe._id}`, fd);
      else        await API.post('/recipes', fd);
      onSuccess();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save recipe');
    } finally {
      setLoading(false);
    }
  };

  const fld    = "w-full px-3 py-2.5 rounded-lg text-sm font-[inherit] transition-all duration-200 focus:outline-none";
  const fldSt  = { border: '1.5px solid var(--border)', background: 'var(--bg-input)', color: 'var(--text)' };
  const fFocus = (e) => { e.target.style.borderColor = 'var(--primary)'; e.target.style.boxShadow = '0 0 0 3px rgba(242,140,0,0.1)'; };
  const fBlur  = (e) => { e.target.style.borderColor = 'var(--border)'; e.target.style.boxShadow = 'none'; };

  const lbl = (text) => (
    <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--text-muted)' }}>{text}</label>
  );

  return (
    <div className="mb-6">
      {/* Title */}
      <div className="mb-5">
        <h1 className="text-2xl font-bold" style={{ color: 'var(--text)' }}>
          {recipe ? 'Edit Recipe' : 'Add New Recipe'}
        </h1>
        <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
          Fill in the details below to publish your recipe
        </p>
      </div>

      {error && <div className="alert alert-error mb-4">{error}</div>}

      <form onSubmit={handleSubmit}>
        <div
          className="rounded-2xl p-7"
          style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}
        >

          {/* ── Cover image ── */}
          {imagePreview ? (
            <div className="relative w-full h-[200px] rounded-xl overflow-hidden mb-6" style={{ border: '1px solid var(--border)' }}>
              <img src={imagePreview} alt="preview" className="w-full h-full object-cover" />
              <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.35) 0%, transparent 50%)' }} />
              <button type="button"
                className="absolute top-3 right-3 text-white text-xs px-3 py-1.5 rounded-lg cursor-pointer border-0 font-semibold transition-all duration-150"
                style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}
                onMouseEnter={e => (e.target.style.background = 'rgba(220,38,38,0.85)')}
                onMouseLeave={e => (e.target.style.background = 'rgba(0,0,0,0.5)')}
                onClick={() => { setImageFile(null); setImagePreview(null); }}>
                Remove photo
              </button>
            </div>
          ) : (
            <label
              className="flex flex-col items-center justify-center gap-2 w-full h-[140px] rounded-xl cursor-pointer transition-all duration-200 mb-6"
              style={{ border: '2px dashed var(--border)', color: 'var(--text-muted)' }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--primary)'; e.currentTarget.style.background = 'rgba(242,140,0,0.03)'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.background = 'transparent'; }}
              htmlFor="rf-image">
              <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--border)' }}>
                <rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/>
                <polyline points="21 15 16 10 5 21"/>
              </svg>
              <span className="text-sm font-medium">Click to upload a cover photo</span>
              <span className="text-xs" style={{ color: 'var(--text-light)' }}>PNG, JPG or WebP</span>
            </label>
          )}
          <input id="rf-image" type="file" accept="image/*" onChange={handleImageChange} className="hidden" />

          {/* ── Title + Category ── */}
          <div className="grid grid-cols-2 gap-4 mb-4 max-sm:grid-cols-1">
            <div>
              {lbl('Recipe Title *')}
              <input className={fld} style={fldSt} onFocus={fFocus} onBlur={fBlur}
                name="title" value={form.title} onChange={handleChange}
                required placeholder="e.g. Spaghetti Carbonara" />
            </div>
            <div>
              {lbl('Category')}
              <CategoryCombobox value={form.category} onChange={val => setForm(f => ({ ...f, category: val }))} categories={categories} />
            </div>
          </div>

          {/* ── Description ── */}
          <div className="mb-4">
            {lbl('Description *')}
            <textarea className={`${fld} resize-y`} style={fldSt} onFocus={fFocus} onBlur={fBlur}
              name="description" value={form.description} onChange={handleChange}
              required rows={3} placeholder="A short, appetising description..." />
          </div>

          {/* ── Difficulty + Servings + Times ── */}
          <div className="grid grid-cols-4 gap-4 max-md:grid-cols-2 max-sm:grid-cols-2">
            <div>
              {lbl('Difficulty')}
              <div className="relative">
                <select className={`${fld} appearance-none pr-7`}
                  style={fldSt}
                  onFocus={fFocus} onBlur={fBlur}
                  name="difficulty" value={form.difficulty} onChange={handleChange}>
                  <option value="Easy">Easy</option>
                  <option value="Medium">Medium</option>
                  <option value="Hard">Hard</option>
                </select>
                <span className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-xs" style={{ color: 'var(--text-muted)' }}>▾</span>
              </div>
            </div>
            <div>
              {lbl('Servings')}
              <input className={fld} style={fldSt} onFocus={fFocus} onBlur={fBlur}
                type="number" name="servings" value={form.servings} onChange={handleChange} min="1" placeholder="4" />
            </div>
            <div>
              {lbl('Prep Time (min)')}
              <input className={fld} style={fldSt} onFocus={fFocus} onBlur={fBlur}
                type="number" name="prepTime" value={form.prepTime} onChange={handleChange} min="0" placeholder="15" />
            </div>
            <div>
              {lbl('Cook Time (min)')}
              <input className={fld} style={fldSt} onFocus={fFocus} onBlur={fBlur}
                type="number" name="cookTime" value={form.cookTime} onChange={handleChange} min="0" placeholder="30" />
            </div>
          </div>

          <Divider label="Ingredients" />

          {/* ── Ingredients ── */}
          <div className="flex flex-col gap-2.5">
            {ingredients.map((ing, i) => (
              <div key={i} className="flex items-center gap-2.5">
                <span
                  className="w-6 h-6 rounded-full flex items-center justify-center text-[0.65rem] font-bold text-white flex-shrink-0"
                  style={{ background: 'var(--primary)' }}>
                  {i + 1}
                </span>
                <input className={`${fld} flex-1`} style={fldSt} onFocus={fFocus} onBlur={fBlur}
                  value={ing} onChange={e => updateIngredient(i, e.target.value)}
                  placeholder="e.g. 200g pasta" />
                {ingredients.length > 1 && (
                  <button type="button"
                    className="flex items-center justify-center w-7 h-7 rounded-lg text-xs cursor-pointer transition-all duration-150 flex-shrink-0 border-0"
                    style={{ background: 'rgba(239,83,80,0.08)', color: '#ef5350' }}
                    onMouseEnter={e => (e.currentTarget.style.background = '#ffebee')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'rgba(239,83,80,0.08)')}
                    onClick={() => removeIngredient(i)} aria-label="Remove">✕</button>
                )}
              </div>
            ))}
            <button type="button" onClick={addIngredient}
              className="flex items-center gap-1.5 self-start text-xs font-semibold px-3.5 py-2 rounded-lg cursor-pointer transition-all duration-150 font-[inherit] mt-1"
              style={{ border: '1.5px dashed var(--primary)', color: 'var(--primary)', background: 'rgba(242,140,0,0.04)' }}
              onMouseEnter={e => (e.currentTarget.style.background = 'rgba(242,140,0,0.1)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'rgba(242,140,0,0.04)')}>
              + Add Ingredient
            </button>
          </div>

          <Divider label="Instructions" />

          {/* ── Instructions ── */}
          <div className="flex flex-col gap-3">
            {instructions.map((step, i) => (
              <div key={i} className="flex items-start gap-3">
                <div
                  className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0 mt-2"
                  style={{ background: 'linear-gradient(135deg, var(--accent), var(--primary))' }}>
                  {i + 1}
                </div>
                <textarea className={`${fld} flex-1 resize-y`} style={fldSt} onFocus={fFocus} onBlur={fBlur}
                  value={step} onChange={e => updateInstruction(i, e.target.value)}
                  rows={2} placeholder={`Step ${i + 1}...`} />
                {instructions.length > 1 && (
                  <button type="button"
                    className="flex items-center justify-center w-7 h-7 rounded-lg text-xs cursor-pointer transition-all duration-150 flex-shrink-0 mt-2 border-0"
                    style={{ background: 'rgba(239,83,80,0.08)', color: '#ef5350' }}
                    onMouseEnter={e => (e.currentTarget.style.background = '#ffebee')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'rgba(239,83,80,0.08)')}
                    onClick={() => removeInstruction(i)} aria-label="Remove">✕</button>
                )}
              </div>
            ))}
            <button type="button" onClick={addInstruction}
              className="flex items-center gap-1.5 self-start text-xs font-semibold px-3.5 py-2 rounded-lg cursor-pointer transition-all duration-150 font-[inherit] mt-1"
              style={{ border: '1.5px dashed var(--primary)', color: 'var(--primary)', background: 'rgba(242,140,0,0.04)' }}
              onMouseEnter={e => (e.currentTarget.style.background = 'rgba(242,140,0,0.1)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'rgba(242,140,0,0.04)')}>
              + Add Step
            </button>
          </div>

          {/* ── Actions ── */}
          <div className="flex items-center justify-end gap-3 mt-8 pt-6 border-t" style={{ borderColor: 'var(--border)' }}>
            {!hideCancel && (
              <button type="button" className="btn btn-ghost" onClick={onCancel}>Discard</button>
            )}
            <button type="submit" className="btn btn-primary px-8" disabled={loading}>
              {loading
                ? <span className="flex items-center gap-2">
                    <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Saving...
                  </span>
                : recipe ? 'Update Recipe' : 'Publish Recipe'
              }
            </button>
          </div>

        </div>
      </form>
    </div>
  );
};

export default RecipeForm;
