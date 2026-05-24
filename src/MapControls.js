import React, { useState, useRef, useEffect } from 'react';
import { CITIES } from './App';

export default function MapControls({ onFlyTo, onReset, onLayerChange }) {
  const [query,    setQuery]    = useState('');
  const [results,  setResults]  = useState([]);
  const [open,     setOpen]     = useState(false);
  const [layer,    setLayer]    = useState('satellite');
  const inputRef = useRef(null);

  // Live search filter
  useEffect(() => {
    if (query.trim().length < 1) { setResults([]); setOpen(false); return; }
    const q = query.toLowerCase();
    const matches = CITIES.filter(c =>
      c.name.toLowerCase().includes(q) ||
      c.province.toLowerCase().includes(q)
    ).slice(0, 6);
    setResults(matches);
    setOpen(matches.length > 0);
  }, [query]);

  const pick = (city) => {
    setQuery(city.name);
    setOpen(false);
    onFlyTo(city);
  };

  const switchLayer = (l) => {
    setLayer(l);
    onLayerChange(l);
  };

  const TIER_COLOR = { capital: '#f59e0b', major: '#38bdf8', minor: '#86efac' };

  return (
    <div className="mc-wrapper">

      {/* Search bar */}
      <div className="mc-search-wrap">
        <div className="mc-search-box">
          <span className="mc-search-icon">🔍</span>
          <input
            ref={inputRef}
            className="mc-input"
            placeholder="Search any city in Pakistan..."
            value={query}
            onChange={e => setQuery(e.target.value)}
            onFocus={() => results.length > 0 && setOpen(true)}
          />
          {query && (
            <button className="mc-clear" onClick={() => { setQuery(''); setOpen(false); }}>✕</button>
          )}
        </div>

        {/* Dropdown results */}
        {open && (
          <div className="mc-dropdown">
            {results.map(city => (
              <button key={city.name} className="mc-result" onClick={() => pick(city)}>
                <span className="mc-result-dot" style={{ background: TIER_COLOR[city.tier] }} />
                <div>
                  <strong>{city.name}</strong>
                  <small>{city.province} · Pop. {city.pop}</small>
                </div>
                <span className="mc-result-tier">{city.tier}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Right controls */}
      <div className="mc-controls">

        {/* Layer switcher */}
        <div className="mc-layer-group">
          {[
            { key: 'satellite', label: '🛰 Satellite' },
            { key: 'street',    label: '🗺 Street'    },
            { key: 'terrain',   label: '🏔 Terrain'   },
          ].map(l => (
            <button
              key={l.key}
              className={`mc-layer-btn ${layer === l.key ? 'active' : ''}`}
              onClick={() => switchLayer(l.key)}
            >
              {l.label}
            </button>
          ))}
        </div>

        {/* Reset button */}
        <button className="mc-reset" onClick={onReset} title="Reset to full Pakistan view">
          🏠 Reset View
        </button>

      </div>
    </div>
  );
}