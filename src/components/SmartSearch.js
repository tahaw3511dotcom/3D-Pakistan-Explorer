import React, { useState, useMemo, useRef, useEffect } from 'react';

const SmartSearch = ({ cities, onSelect, onCategoryFilter }) => {
  const [query, setQuery] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [activeCategory, setActiveCategory] = useState(null);
  const wrapperRef = useRef(null);

  const categories = useMemo(() => {
    const cats = new Set();
    cities.forEach(city => {
      if (city.tier === 'capital') cats.add('🏛️ Capital');
      else if (city.tier === 'major') cats.add('⭐ Major');
      else cats.add('📍 Minor');
    });
    return Array.from(cats);
  }, [cities]);

  const filteredResults = useMemo(() => {
    if (!query.trim()) return [];
    const q = query.toLowerCase();
    return cities
      .filter(city => 
        city.name.toLowerCase().includes(q) ||
        city.province.toLowerCase().includes(q) ||
        (city.landmark && city.landmark.toLowerCase().includes(q))
      )
      .slice(0, 8);
  }, [query, cities]);

  const handleCategoryClick = (cat) => {
    const newCat = activeCategory === cat ? null : cat;
    setActiveCategory(newCat);
    let tierFilter = null;
    if (newCat === '🏛️ Capital') tierFilter = 'capital';
    else if (newCat === '⭐ Major') tierFilter = 'major';
    else if (newCat === '📍 Minor') tierFilter = 'minor';
    onCategoryFilter?.(tierFilter ? cities.filter(c => c.tier === tierFilter).map(c => c.name) : null);
  };

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getTierIcon = (tier) => {
    if (tier === 'capital') return '🏛️';
    if (tier === 'major') return '⭐';
    return '📍';
  };

  return (
    <div className="ss-wrapper" ref={wrapperRef}>
      <div className="ss-box">
        <span className="ss-icon">🔍</span>
        <input
          type="text"
          className="ss-input"
          placeholder="Search cities, landmarks..."
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setShowDropdown(true);
          }}
          onFocus={() => setShowDropdown(true)}
        />
        {query && (
          <button className="ss-clear" onClick={() => { setQuery(''); setShowDropdown(false); }}>
            ✕
          </button>
        )}
      </div>

      <div className="ss-cats">
        {categories.map(cat => (
          <button
            key={cat}
            className={`ss-cat ${activeCategory === cat ? 'active' : ''}`}
            onClick={() => handleCategoryClick(cat)}
          >
            {cat}
          </button>
        ))}
      </div>

      {showDropdown && query && filteredResults.length > 0 && (
        <div className="ss-dropdown">
          {filteredResults.map(city => (
            <button
              key={city.name}
              className="ss-result"
              onClick={() => {
                onSelect(city);
                setQuery('');
                setShowDropdown(false);
              }}
            >
              <span className="ss-dot" style={{ background: 
                city.tier === 'capital' ? '#f59e0b' : city.tier === 'major' ? '#38bdf8' : '#86efac' 
              }} />
              <div style={{ flex: 1, textAlign: 'left' }}>
                <strong>{city.name}</strong>
                <small> · {city.province}</small>
              </div>
              <span className="ss-tier">{getTierIcon(city.tier)}</span>
            </button>
          ))}
        </div>
      )}

      {showDropdown && query && filteredResults.length === 0 && (
        <div className="ss-dropdown">
          <div className="ss-empty">No cities found matching "{query}"</div>
        </div>
      )}
    </div>
  );
};

export default SmartSearch;