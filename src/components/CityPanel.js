import React, { useState } from 'react';
import useRealtimeData from '../HOOKS/useRealtimeData';


const PRICE_LABEL = { 1: '$', 2: '$$', 3: '$$$', 4: '$$$$' };
const PRICE_RANGE = { 1: '< $30/night', 2: '$30–70/night', 3: '$70–150/night', 4: '$150+/night' };

const CAT_ICON = {
  concerts: '🎵', festivals: '🎉', sports: '🏆', expos: '🏭',
  community: '🤝', 'performing-arts': '🎭', conferences: '💼',
  'public-holidays': '🎊', observances: '📅', default: '📅',
};

const TIER_COLOR = { capital: '#f59e0b', major: '#38bdf8', minor: '#86efac' };

const TOUR_LINKS = {
  Islamabad:  'https://www.google.com/maps/@33.7215,73.0433,3a,75y,90t/data=!3m1!1e1',
  Karachi:    'https://www.google.com/maps/@24.8607,67.0105,3a,75y,90t/data=!3m1!1e1',
  Lahore:     'https://www.google.com/maps/@31.5821,74.3294,3a,75y,90t/data=!3m1!1e1',
  Peshawar:   'https://www.google.com/maps/@34.0059,71.5785,3a,75y,90t/data=!3m1!1e1',
  Multan:     'https://www.google.com/maps/@30.1575,71.5249,3a,75y,90t/data=!3m1!1e1',
  Quetta:     'https://www.google.com/maps/@30.1798,66.9750,3a,75y,90t/data=!3m1!1e1',
  Lahore:     'https://www.google.com/maps/@31.5497,74.3436,3a,75y,90t/data=!3m1!1e1',
  Hunza:      'https://www.google.com/maps/@36.3167,74.6500,3a,75y,90t/data=!3m1!1e1',
  Murree:     'https://www.google.com/maps/@33.9042,73.3942,3a,75y,90t/data=!3m1!1e1',
};

export default function CityPanel({ city, allCities, onClose, onNearbyClick }) {
  const [tab,    setTab]    = useState('overview');
  const [imgIdx, setImgIdx] = useState(0);
  const { weather, photos, events, hotels, nearby, loading, errors } = useRealtimeData(city, allCities);

  if (!city) return null;
  const color = TIER_COLOR[city.tier] || '#38bdf8';
  const tour  = TOUR_LINKS[city.name] || `https://www.google.com/maps/search/${encodeURIComponent(city.name + ' Pakistan')}`;

  const TABS = [
    { key: 'overview', label: '📋 Info'   },
    { key: 'weather',  label: `🌤 Weather` },
    { key: 'photos',   label: `🖼 Photos${photos.length ? ` (${photos.length})` : ''}` },
    { key: 'events',   label: `🎯 Events${events.length ? ` (${events.length})` : ''}` },
    { key: 'hotels',   label: `🏨 Hotels${hotels.length ? ` (${hotels.length})` : ''}` },
    { key: 'nearby',   label: `📍 Nearby` },
    { key: 'tour',     label: '🌐 Tour'   },
  ];

  return (
    <div className="cp-wrapper">
      {/* Header */}
      <div className="cp-header" style={{ borderTop: `3px solid ${color}` }}>
        <div className="cp-header-left">
          <div className="cp-tier" style={{ color, borderColor: color + '55', background: color + '15' }}>
            {city.tier.toUpperCase()} · {city.province}
          </div>
          <h2 className="cp-title">{city.name}</h2>
          <div className="cp-meta">
            <span>👥 {city.pop}</span>
            <span>📍 {city.lat}°N, {city.lon}°E</span>
            {weather && !loading && (
              <span className="cp-weather-badge">
                <img src={weather.icon} alt="" width={20} height={20} style={{ verticalAlign: 'middle', marginRight: 2 }} />
                {weather.temp}°C
              </span>
            )}
          </div>
        </div>
        <button className="cp-close" onClick={onClose}>✕</button>
      </div>

      {/* Tabs */}
      <div className="cp-tabs">
        {TABS.map(t => (
          <button key={t.key} className={`cp-tab ${tab === t.key ? 'active' : ''}`} onClick={() => setTab(t.key)}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Body */}
      <div className="cp-body">

        {/* ── OVERVIEW ── */}
        {tab === 'overview' && (
          <div className="cp-section-list">
            <div className="cp-section">
              <span className="cp-section-label">🏛 Famous Landmarks</span>
              <p>{city.landmark}</p>
            </div>
            <div className="cp-section">
              <span className="cp-section-label">📜 History</span>
              <p>{city.history}</p>
            </div>
            <div className="cp-section">
              <span className="cp-section-label">🎉 Annual Events</span>
              <p>{city.events}</p>
            </div>
          </div>
        )}

        {/* ── WEATHER ── */}
        {tab === 'weather' && (
          <div>
            {loading && <div className="cp-loading">Fetching live weather...</div>}
            {errors.weather && <div className="cp-empty">⚠ Weather unavailable. Check your OpenWeatherMap API key.</div>}
            {weather && (
              <div>
                <div className="weather-main">
                  <img src={weather.icon} alt={weather.description} className="weather-icon-lg" />
                  <div>
                    <div className="weather-temp">{weather.temp}°C</div>
                    <div className="weather-desc">{weather.description}</div>
                    <div className="weather-feels">Feels like {weather.feels_like}°C</div>
                  </div>
                </div>
                <div className="weather-grid">
                  <div className="weather-stat"><span>💧 Humidity</span><strong>{weather.humidity}%</strong></div>
                  <div className="weather-stat"><span>💨 Wind</span><strong>{weather.wind} km/h</strong></div>
                  {weather.visibility && <div className="weather-stat"><span>👁 Visibility</span><strong>{weather.visibility} km</strong></div>}
                </div>
                <div className="weather-note">Live data from OpenWeatherMap · Updated now</div>
              </div>
            )}
          </div>
        )}

        {/* ── PHOTOS ── */}
        {tab === 'photos' && (
          <div>
            {loading && <div className="cp-loading">Loading photos from Unsplash...</div>}
            {errors.photos && <div className="cp-empty">⚠ Photos unavailable. Check your Unsplash API key.</div>}
            {!loading && !errors.photos && photos.length === 0 && (
              <div className="cp-empty">No photos found for {city.name}.</div>
            )}
            {photos.length > 0 && (
              <>
                <div className="photo-main">
                  <img
                    src={photos[imgIdx]?.url}
                    alt={photos[imgIdx]?.alt}
                    onError={e => e.target.style.display = 'none'}
                  />
                  <div className="photo-overlay">
                    <span className="photo-credit">📷 {photos[imgIdx]?.credit} · Unsplash</span>
                  </div>
                </div>
                <div className="photo-thumbs">
                  {photos.map((ph, i) => (
                    <img
                      key={i}
                      src={ph.thumb}
                      alt={ph.alt}
                      className={imgIdx === i ? 'active' : ''}
                      onClick={() => setImgIdx(i)}
                      onError={e => e.target.style.display = 'none'}
                    />
                  ))}
                </div>
                <a href={photos[imgIdx]?.link} target="_blank" rel="noreferrer" className="photo-view-full">
                  View on Unsplash →
                </a>
              </>
            )}
          </div>
        )}

        {/* ── EVENTS ── */}
        {tab === 'events' && (
  <div>
    {loading && <div className="cp-loading">Finding events in {city.name}...</div>}
    {errors.events && <div className="cp-empty">⚠ Unable to fetch events</div>}
    {!loading && !errors.events && events.length === 0 && (
      <div className="cp-empty">
        🎭 No upcoming events found in {city.name}<br/>
        <small>Check back later for concerts, sports, and festivals!</small>
      </div>
    )}
    {events.map(ev => (
      <div key={ev.id} className="event-card">
        <div className="event-icon">
          {ev.category === 'concerts' && '🎵'}
          {ev.category === 'sports' && '🏆'}
          {ev.category === 'festivals' && '🎉'}
          {ev.category === 'performing-arts' && '🎭'}
          {!ev.category && '📅'}
        </div>
        <div className="event-info">
          <strong>{ev.title}</strong>
          <span>📅 {ev.date}</span>
          {ev.venue && <span>📍 {ev.venue}</span>}
          <div className="event-tags">
            <span className="event-cat">{ev.category || 'Event'}</span>
          </div>
        </div>
      </div>
    ))}
  </div>
)}

        {/* ── HOTELS ── */}
        {tab === 'hotels' && (
          <div>
            {loading && <div className="cp-loading">Finding hotels via Foursquare...</div>}
            {errors.hotels && <div className="cp-empty">⚠ Hotels unavailable. Check your Foursquare API key.</div>}
            {!loading && !errors.hotels && hotels.length === 0 && (
              <div className="cp-empty">No hotels found near {city.name}.</div>
            )}
            {hotels.map(h => (
              <div key={h.id} className="hotel-card">
                {h.photo && (
                  <div className="hotel-photo">
                    <img src={h.photo} alt={h.name} onError={e => e.target.parentElement.style.display='none'} />
                  </div>
                )}
                <div className="hotel-info">
                  <strong>{h.name}</strong>
                  {h.address && <span className="hotel-addr">📍 {h.address}</span>}
                  <div className="hotel-meta">
                    {h.rating && <span className="hotel-rating">⭐ {h.rating}/5</span>}
                    {h.price && (
                      <span className="hotel-price" title={PRICE_RANGE[h.price]}>
                        {PRICE_LABEL[h.price]} · {PRICE_RANGE[h.price]}
                      </span>
                    )}
                  </div>
                  <div className="hotel-actions">
                    <a href={h.bookingLink} target="_blank" rel="noreferrer" className="hotel-book-btn">
                      Check Prices →
                    </a>
                    {h.website && (
                      <a href={h.website} target="_blank" rel="noreferrer" className="hotel-web-btn">
                        Website
                      </a>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── NEARBY ── */}
        {tab === 'nearby' && (
          <div>
            <p className="nearby-intro">Cities within reach of {city.name}</p>
            {nearby.map(c => (
              <button key={c.name} className="nearby-card" onClick={() => onNearbyClick(c)}>
                <span className="nearby-dot" style={{ background: TIER_COLOR[c.tier] }} />
                <div className="nearby-info">
                  <strong>{c.name}</strong>
                  <small>{c.province} · {c.tier}</small>
                </div>
                <span className="nearby-dist">{c.distance} km</span>
              </button>
            ))}
          </div>
        )}

        {/* ── TOUR ── */}
        {tab === 'tour' && (
          <div className="tour-wrap">
            <div className="tour-icon">🌐</div>
            <h3>360° Virtual Tour</h3>
            <p>Explore {city.name} through Google Maps Street View panoramas.</p>
            <a href={tour} target="_blank" rel="noreferrer" className="tour-btn">
              Open Street View →
            </a>
            <div className="tour-tips">
              <p>💡 Inside Street View:</p>
              <ul>
                <li>Click &amp; drag to look in 360°</li>
                <li>Scroll to zoom in/out</li>
                <li>Click ground arrows to walk</li>
                <li>Click 🗺 for map view</li>
              </ul>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}