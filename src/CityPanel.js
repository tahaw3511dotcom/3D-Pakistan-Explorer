import React, { useState } from 'react';
import useCityData from './HOOKS/useRealtimeData';

const CATEGORY_ICON = {
  concerts:         '🎵',
  festivals:        '🎉',
  sports:           '🏆',
  expos:            '🏭',
  community:        '🤝',
  'performing-arts':'🎭',
  default:          '📅',
};

const TIER_COLOR = {
  capital: '#f59e0b',
  major:   '#38bdf8',
  minor:   '#86efac',
};

export default function CityPanel({ city, onClose }) {
  const [tab, setTab]       = useState('overview');
  const [imgIdx, setImgIdx] = useState(0);
  const { photos, events, tour, loading } = useCityData(city);

  if (!city) return null;

  const color = TIER_COLOR[city.tier] || '#38bdf8';

  return (
    <div className="cp-wrapper">

      {/* Header */}
      <div className="cp-header" style={{ borderTop: `3px solid ${color}` }}>
        <div>
          <div className="cp-tier" style={{ color, borderColor: color + '44', background: color + '11' }}>
            {city.tier.toUpperCase()} · {city.province}
          </div>
          <h2 className="cp-title">{city.name}</h2>
          <p className="cp-pop">Population: <strong>{city.pop}</strong></p>
        </div>
        <button className="cp-close" onClick={onClose}>✕</button>
      </div>

      {/* Tabs */}
      <div className="cp-tabs">
        {['overview','photos','events','tour'].map(t => (
          <button
            key={t}
            className={`cp-tab ${tab === t ? 'active' : ''}`}
            onClick={() => setTab(t)}
          >
            {t === 'overview' ? '📋 Info' :
             t === 'photos'   ? `🖼 Photos${photos.length ? ` (${photos.length})` : ''}` :
             t === 'events'   ? `🎯 Events${events.length ? ` (${events.length})` : ''}` :
                                '🌐 Tour'}
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
            <div className="cp-coords">
              <span>📍 {city.lat}°N, {city.lon}°E</span>
            </div>
          </div>
        )}

        {/* ── PHOTOS ── */}
        {tab === 'photos' && (
          <div>
            {loading && <div className="cp-loading">Loading photos...</div>}
            {!loading && photos.length === 0 && (
              <div className="cp-empty">No photos found for this city.</div>
            )}
            {photos.length > 0 && (
              <div>
                <div className="cp-photo-main">
                  <img
                    src={photos[imgIdx]?.url}
                    alt={photos[imgIdx]?.title}
                    onError={e => e.target.style.display = 'none'}
                  />
                  <div className="cp-photo-caption">{photos[imgIdx]?.title}</div>
                </div>
                <div className="cp-photo-thumbs">
                  {photos.map((ph, i) => (
                    <img
                      key={i}
                      src={ph.url}
                      alt={ph.title}
                      className={imgIdx === i ? 'active' : ''}
                      onClick={() => setImgIdx(i)}
                      onError={e => e.target.style.display = 'none'}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── EVENTS ── */}
        {tab === 'events' && (
          <div>
            {loading && <div className="cp-loading">Fetching live events...</div>}
            {!loading && events.length === 0 && (
              <div className="cp-empty">
                No upcoming events found within 50km of {city.name} in the next 90 days.
              </div>
            )}
            {events.map(ev => (
              <div key={ev.id} className="cp-event">
                <div className="cp-event-icon">
                  {CATEGORY_ICON[ev.category] || CATEGORY_ICON.default}
                </div>
                <div className="cp-event-info">
                  <strong>{ev.title}</strong>
                  <span>{ev.date} · {ev.venue}</span>
                  <div className="cp-event-cat">{ev.category}</div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── VIRTUAL TOUR ── */}
        {tab === 'tour' && (
          <div className="cp-tour">
            <div className="cp-tour-icon">🌐</div>
            <h3>360° Virtual Tour</h3>
            <p>Explore {city.name} through Google Maps Street View and 360° panoramas.</p>
            <a href={tour} target="_blank" rel="noreferrer" className="cp-tour-btn">
              Open Street View of {city.name} →
            </a>
            <p className="cp-tour-note">
              Opens in a new tab. Use your mouse to look around in 360°.
            </p>
            <div className="cp-tour-tips">
              <p>💡 Tips inside Street View:</p>
              <ul>
                <li>Click & drag to look around</li>
                <li>Scroll to zoom in/out</li>
                <li>Click arrows on ground to move</li>
                <li>Click 🗺 to see map position</li>
              </ul>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}