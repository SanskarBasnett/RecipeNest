import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import API, { getImageUrl } from '../api/axios';
import './Home.css';

const Home = () => {
  const [featured, setFeatured] = useState([]);
  const [chefs, setChefs] = useState([]);

  useEffect(() => {
    API.get('/recipes?sort=newest').then(({ data }) => setFeatured(data.slice(0, 3))).catch(() => {});
    API.get('/chefs').then(({ data }) => setChefs(data.slice(0, 4))).catch(() => {});
  }, []);

  return (
    <div className="home">

      {/* Hero */}
      <section className="hero">
        <div className="hero__content">
          <span className="hero__tag">🍽️ Welcome to RecipeNest</span>
          <h1 className="hero__title">
            Where Chefs Share<br />
            Their <span>Passion</span>
          </h1>
          <p className="hero__desc">
            Discover thousands of recipes from talented chefs around the world.
            Cook, share, and connect with a community of food lovers.
          </p>
          <div className="hero__btns">
            <Link to="/recipes"  className="btn btn-primary btn-lg">Explore Recipes</Link>
            <Link to="/register" className="btn btn-outline btn-lg">Become a Chef</Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="home-features">
        <div className="container">
          <div className="grid-4">
            {[
              { icon: '👨‍🍳', title: 'Expert Chefs',    desc: 'Browse profiles of professional chefs and discover their specialties.' },
              { icon: '📖', title: 'Rich Recipes',     desc: 'Step-by-step instructions with ingredients, tips, and cooking times.' },
              { icon: '🔍', title: 'Smart Search',     desc: 'Filter by difficulty, category, or chef to find exactly what you want.' },
              { icon: '🔐', title: 'Secure Dashboard', desc: 'Chefs manage their portfolio through a secure, role-based dashboard.' },
            ].map((f) => (
              <div key={f.title} className="feat-card card">
                <div className="feat-card__icon">{f.icon}</div>
                <h3>{f.title}</h3>
                <p>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Recipes */}
      {featured.length > 0 && (
        <section className="home-section">
          <div className="container">
            <p className="section-subtitle">Fresh from our chefs</p>
            <div className="home-section__head">
              <h2 className="section-title">Featured Recipes</h2>
              <Link to="/recipes" className="btn btn-ghost btn-sm">View All →</Link>
            </div>
            <div className="grid-3">
              {featured.map((r) => (
                <Link to={`/recipes/${r._id}`} key={r._id} className="recipe-card card">
                  <div className="recipe-card__img">
                    {r.image
                      ? <img src={getImageUrl(r.image)} alt={r.title} />
                      : <div className="recipe-card__placeholder">🍽️</div>
                    }
                    <span className={`badge badge-${r.difficulty.toLowerCase()} recipe-card__badge`}>{r.difficulty}</span>
                  </div>
                  <div className="recipe-card__body">
                    <h3>{r.title}</h3>
                    <p>{r.description.substring(0, 80)}...</p>
                    <div className="recipe-card__meta">
                      <span>⏱ {r.cookingTime} min</span>
                      {r.chef && <span>👨‍🍳 {r.chef.name}</span>}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Meet Chefs */}
      {chefs.length > 0 && (
        <section className="home-section home-section--alt">
          <div className="container">
            <p className="section-subtitle">The talent behind the food</p>
            <div className="home-section__head">
              <h2 className="section-title">Meet Our Chefs</h2>
              <Link to="/chefs" className="btn btn-ghost btn-sm">View All →</Link>
            </div>
            <div className="grid-4">
              {chefs.map((c) => (
                <Link to={`/chefs/${c._id}`} key={c._id} className="chef-mini card">
                  <div className="chef-mini__avatar">
                    {c.avatar
                      ? <img src={getImageUrl(c.avatar)} alt={c.name} />
                      : <div className="chef-mini__placeholder">{c.name.charAt(0)}</div>
                    }
                  </div>
                  <h4>{c.name}</h4>
                  {c.specialty && <span className="badge badge-accent">{c.specialty}</span>}
                  {c.location  && <p className="chef-mini__loc">📍 {c.location}</p>}
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* CTA */}
      <section className="home-cta">
        <div className="container">
          <div className="cta-box">
            <h2>Ready to share your recipes?</h2>
            <p>Join RecipeNest as a chef and build your recipe portfolio today.</p>
            <Link to="/register" className="btn btn-primary btn-lg">Get Started Free</Link>
          </div>
        </div>
      </section>

    </div>
  );
};

export default Home;
