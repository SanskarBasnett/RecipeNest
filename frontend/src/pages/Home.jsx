import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import API, { getImageUrl } from '../api/axios';

const diffBadge = (d) => ({
  Easy:   'bg-green-100 text-green-700',
  Medium: 'bg-yellow-100 text-yellow-700',
  Hard:   'bg-red-100 text-red-600',
}[d] || 'bg-gray-100 text-gray-600');

const Home = () => {
  const [featured, setFeatured] = useState([]);
  const [chefs, setChefs] = useState([]);

  useEffect(() => {
    API.get('/recipes?sort=newest').then(({ data }) => setFeatured(data.slice(0, 3))).catch(() => {});
    API.get('/chefs').then(({ data }) => setChefs(data.slice(0, 4))).catch(() => {});
  }, []);

  return (
    <div>

      {/* Hero */}
      <section
        className="flex justify-center px-16 py-24 text-center"
        style={{ background: 'linear-gradient(135deg, #fff8f3 0%, var(--bg) 100%)' }}
      >
        <div className="max-w-[720px] w-full">
          <span
            className="inline-block px-4 py-1 rounded-full text-sm font-semibold mb-5"
            style={{ background: 'rgba(244,162,97,0.15)', color: 'var(--primary)' }}
          >
            Welcome to RecipeNest
          </span>
          <h1 className="font-display mb-5" style={{ fontSize: 'clamp(2.4rem, 5vw, 3.8rem)', lineHeight: 1.15 }}>
            Where Chefs Share<br />
            Their <span style={{ color: 'var(--primary)' }}>Passion</span>
          </h1>
          <p className="text-lg leading-[1.7] max-w-[560px] mx-auto mb-10" style={{ color: 'var(--text-muted)' }}>
            Discover thousands of recipes from talented chefs around the world.
            Cook, share, and connect with a community of food lovers.
          </p>
          <div className="flex gap-4 flex-wrap justify-center">
            <Link to="/recipes"  className="btn btn-primary btn-lg">Explore Recipes</Link>
            <Link to="/register" className="btn btn-outline btn-lg">Become a Chef</Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section
        className="py-16 border-t border-b"
        style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}
      >
        <div className="container">
          <div className="grid-4">
            {[
              { title: 'Expert Chefs',    desc: 'Browse profiles of professional chefs and discover their specialties.' },
              { title: 'Rich Recipes',     desc: 'Step-by-step instructions with ingredients, tips, and cooking times.' },
              { title: 'Smart Search',     desc: 'Filter by difficulty, category, or chef to find exactly what you want.' },
              { title: 'Secure Dashboard', desc: 'Chefs manage their portfolio through a secure, role-based dashboard.' },
            ].map((f) => (
              <div key={f.title} className="card p-7 text-center">
                <div
                  className="inline-block text-xs font-bold uppercase tracking-wider px-3 py-1 rounded mb-4"
                  style={{ color: 'var(--primary)', background: 'rgba(242,140,0,0.1)' }}
                >
                  {f.title}
                </div>
                <p className="text-sm leading-relaxed" style={{ color: 'var(--text-muted)' }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Recipes */}
      {featured.length > 0 && (
        <section className="py-16">
          <div className="container">
            <p className="section-subtitle">Fresh from our chefs</p>
            <div className="flex items-center justify-between mb-8">
              <h2 className="section-title">Featured Recipes</h2>
              <Link to="/recipes" className="btn btn-ghost btn-sm">View All →</Link>
            </div>
            <div className="grid-3">
              {featured.map((r) => (
                <Link
                  to={`/recipes/${r._id}`}
                  key={r._id}
                  className="group overflow-hidden flex flex-col rounded-2xl transition-all duration-300 hover:-translate-y-1"
                  style={{
                    background: 'var(--bg-card)',
                    border: '1px solid var(--border)',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                  }}
                  onMouseEnter={e => (e.currentTarget.style.boxShadow = '0 12px 40px rgba(242,140,0,0.15)')}
                  onMouseLeave={e => (e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.06)')}
                >
                  {/* Image */}
                  <div className="relative h-[220px] overflow-hidden flex-shrink-0">
                    {r.image
                      ? <img src={getImageUrl(r.image)} alt={r.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.07]" />
                      : <div className="w-full h-full" style={{ background: 'linear-gradient(135deg, #fdebd0, #f8d7b0)' }} />
                    }
                    <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.55) 0%, transparent 55%)' }} />
                    <span className={`badge ${diffBadge(r.difficulty)} absolute top-3 left-3 shadow-sm`}>{r.difficulty}</span>
                    <span
                      className="absolute top-3 right-3 text-xs font-semibold px-2.5 py-1 rounded-full"
                      style={{ background: 'rgba(0,0,0,0.45)', color: '#fff', backdropFilter: 'blur(4px)' }}
                    >
                      ⏱ {r.cookingTime} min
                    </span>
                    <div className="absolute bottom-0 left-0 right-0 px-4 pb-3">
                      <h3 className="text-white font-semibold text-base leading-snug drop-shadow">{r.title}</h3>
                    </div>
                  </div>
                  {/* Body */}
                  <div className="p-4 flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="badge badge-accent">{r.category}</span>
                      {r.likes?.length > 0 && (
                        <span className="text-xs ml-auto flex items-center gap-1" style={{ color: 'var(--text-muted)' }}>
                          <span style={{ color: '#e53935' }}>❤</span> {r.likes.length}
                        </span>
                      )}
                    </div>
                    <p className="text-sm leading-relaxed" style={{ color: 'var(--text-muted)' }}>
                      {r.description.substring(0, 80)}...
                    </p>
                    {r.chef && (
                      <div className="flex items-center gap-2 mt-3 text-xs" style={{ color: 'var(--text-light)' }}>
                        <div
                          className="w-5 h-5 rounded-full overflow-hidden flex items-center justify-center text-white text-[0.6rem] font-bold flex-shrink-0"
                          style={{ background: 'var(--primary)' }}
                        >
                          {r.chef.avatar
                            ? <img src={getImageUrl(r.chef.avatar)} alt={r.chef.name} className="w-full h-full object-cover" />
                            : r.chef.name.charAt(0)
                          }
                        </div>
                        {r.chef.name}
                      </div>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Meet Chefs */}
      {chefs.length > 0 && (
        <section
          className="py-16 border-t border-b"
          style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}
        >
          <div className="container">
            <p className="section-subtitle">The talent behind the food</p>
            <div className="flex items-center justify-between mb-8">
              <h2 className="section-title">Meet Our Chefs</h2>
              <Link to="/chefs" className="btn btn-ghost btn-sm">View All →</Link>
            </div>
            <div className="grid-4">
              {chefs.map((c) => (
                <Link
                  to={`/chefs/${c._id}`}
                  key={c._id}
                  className="card p-6 text-center flex flex-col items-center gap-2 transition-transform duration-200 hover:-translate-y-1"
                >
                  <div
                    className="w-[72px] h-[72px] rounded-full overflow-hidden mb-1 flex-shrink-0"
                    style={{ border: '3px solid var(--primary)' }}
                  >
                    {c.avatar
                      ? <img src={getImageUrl(c.avatar)} alt={c.name} className="w-full h-full object-cover" />
                      : (
                        <div
                          className="w-full h-full flex items-center justify-center text-3xl font-bold text-white"
                          style={{ background: 'linear-gradient(135deg, var(--primary), var(--accent))' }}
                        >
                          {c.name.charAt(0)}
                        </div>
                      )
                    }
                  </div>
                  <h4 className="text-[0.95rem]">{c.name}</h4>
                  {c.specialty && <span className="badge badge-accent">{c.specialty}</span>}
                  {c.location  && <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{c.location}</p>}
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* CTA */}
      <section className="py-16">
        <div className="container">
          <div
            className="rounded-2xl p-14 text-center text-white"
            style={{ background: 'linear-gradient(135deg, var(--accent), var(--primary))' }}
          >
            <h2 className="text-[2rem] text-white mb-3">Ready to share your recipes?</h2>
            <p className="text-base opacity-90 mb-8">Join RecipeNest as a chef and build your recipe portfolio today.</p>
            <Link
              to="/register"
              className="btn btn-lg"
              style={{ background: '#fff', color: 'var(--primary)' }}
            >
              Get Started Free
            </Link>
          </div>
        </div>
      </section>

    </div>
  );
};

export default Home;
