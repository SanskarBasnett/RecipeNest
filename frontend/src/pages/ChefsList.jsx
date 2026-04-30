import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import API, { getImageUrl } from '../api/axios';

const ChefsList = () => {
  const [chefs, setChefs]     = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch]   = useState('');

  useEffect(() => {
    API.get('/chefs')
      .then(({ data }) => setChefs(data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filtered = chefs.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.specialty?.toLowerCase().includes(search.toLowerCase()) ||
    c.location?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="page">
      <div className="container">
        {/* Header */}
        <div className="flex items-end justify-between flex-wrap gap-4 mb-8">
          <div>
            <p className="section-subtitle !mb-1">The talent behind the food</p>
            <h1 className="section-title">Our Chefs</h1>
          </div>
          <input
            type="text"
            className="px-5 py-2.5 rounded-full text-sm font-[inherit] w-[280px] transition-all duration-200 focus:outline-none"
            style={{
              border: '1.5px solid var(--border)',
              background: 'var(--bg-input)',
              color: 'var(--text)',
            }}
            onFocus={e => (e.target.style.borderColor = 'var(--primary)')}
            onBlur={e => (e.target.style.borderColor = 'var(--border)')}
            placeholder="Search by name, specialty..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {loading ? (
          <div className="spinner-wrap"><div className="spinner" /></div>
        ) : filtered.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">👨‍🍳</div>
            <h3>No chefs found</h3>
            <p>Try a different search term</p>
          </div>
        ) : (
          <div className="grid-3">
            {filtered.map((chef) => (
              <Link
                to={`/chefs/${chef._id}`}
                key={chef._id}
                className="card overflow-hidden flex flex-col transition-transform duration-200 hover:-translate-y-1"
                style={{ '--tw-shadow': 'var(--shadow-lg)' }}
              >
                {/* Cover */}
                <div
                  className="h-20"
                  style={{ background: 'linear-gradient(135deg, var(--accent), var(--primary))' }}
                />
                {/* Body */}
                <div className="px-6 pb-6 flex flex-col items-center text-center gap-1.5">
                  <div
                    className="w-20 h-20 rounded-full overflow-hidden flex-shrink-0 -mt-10"
                    style={{
                      border: '4px solid var(--bg-card)',
                      boxShadow: 'var(--shadow-md)',
                    }}
                  >
                    {chef.avatar
                      ? <img src={getImageUrl(chef.avatar)} alt={chef.name} className="w-full h-full object-cover" />
                      : (
                        <div
                          className="w-full h-full flex items-center justify-center text-3xl font-bold text-white"
                          style={{ background: 'linear-gradient(135deg, var(--primary), var(--accent))' }}
                        >
                          {chef.name.charAt(0)}
                        </div>
                      )
                    }
                  </div>
                  <h3 className="text-[1.05rem] mt-1">{chef.name}</h3>
                  {chef.specialty && <span className="badge badge-accent">{chef.specialty}</span>}
                  {chef.location  && <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{chef.location}</p>}
                  <p className="text-[0.83rem] leading-relaxed my-1" style={{ color: 'var(--text-muted)' }}>
                    {chef.bio ? chef.bio.substring(0, 90) + '...' : 'Passionate chef sharing amazing recipes.'}
                  </p>
                  <span className="btn btn-outline btn-sm mt-2">View Profile →</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ChefsList;
