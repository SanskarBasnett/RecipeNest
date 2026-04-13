import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import API, { getImageUrl } from '../api/axios';
import './ChefsList.css';

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
    <div className="chefs-page page">
      <div className="container">
        <div className="chefs-page__header">
          <div>
            <p className="section-subtitle">The talent behind the food</p>
            <h1 className="section-title">Our Chefs</h1>
          </div>
          <input
            type="text"
            className="chefs-search"
            placeholder="🔍  Search by name, specialty..."
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
              <Link to={`/chefs/${chef._id}`} key={chef._id} className="chef-card card">
                <div className="chef-card__cover" />
                <div className="chef-card__body">
                  <div className="chef-card__avatar">
                    {chef.avatar
                      ? <img src={getImageUrl(chef.avatar)} alt={chef.name} />
                      : <div className="chef-card__initials">{chef.name.charAt(0)}</div>
                    }
                  </div>
                  <h3>{chef.name}</h3>
                  {chef.specialty && <span className="badge badge-accent">{chef.specialty}</span>}
                  {chef.location  && <p className="chef-card__loc">📍 {chef.location}</p>}
                  <p className="chef-card__bio">
                    {chef.bio ? chef.bio.substring(0, 90) + '...' : 'Passionate chef sharing amazing recipes.'}
                  </p>
                  <span className="btn btn-outline btn-sm chef-card__cta">View Profile →</span>
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
