import React, { useEffect, useRef, useState } from 'react';
import maplibregl from 'maplibre-gl';

const Map3D = ({ cities, onCityClick, flyTo }) => {
  const mapContainer = useRef(null);
  const map = useRef(null);
  const [mapStyle, setMapStyle] = useState(() => {
    return localStorage.getItem('mapStyle') || 'street';
  });

  const mapStyles = {
    street: {
      name: 'Street View',
      url: 'https://tiles.stadiamaps.com/styles/alidade_smooth.json',
      iconChar: '🗺️'
    },
    satellite: {
      name: 'Satellite View',
      url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
      iconChar: '🛰️'
    },
    dark: {
      name: 'Dark View',
      url: 'https://tiles.stadiamaps.com/styles/alidade_smooth_dark.json',
      iconChar: '🌙'
    },
    outdoors: {
      name: 'Outdoors View',
      url: 'https://tiles.stadiamaps.com/styles/outdoors.json',
      iconChar: '🏔️'
    },
    light: {
      name: 'Light View',
      url: 'https://tiles.stadiamaps.com/styles/osm_bright.json',
      iconChar: '☀️'
    }
  };

  const addMarkers = () => {
    if (!map.current) return;
    
    try {
      if (map.current.getLayer('cities-layer')) {
        map.current.removeLayer('cities-layer');
      }
      if (map.current.getLayer('cities-glow')) {
        map.current.removeLayer('cities-glow');
      }
      if (map.current.getSource('cities-source')) {
        map.current.removeSource('cities-source');
      }
    } catch (err) {
      console.log('Cleanup error:', err);
    }

    const geojson = {
      type: 'FeatureCollection',
      features: cities.map(city => ({
        type: 'Feature',
        geometry: {
          type: 'Point',
          coordinates: [city.lon, city.lat]
        },
        properties: {
          name: city.name,
          province: city.province,
          pop: city.pop,
          tier: city.tier,
          color: city.tier === 'capital' ? '#f59e0b' : city.tier === 'major' ? '#00d4aa' : '#4ade80'
        }
      }))
    };

    map.current.addSource('cities-source', {
      type: 'geojson',
      data: geojson
    });

    map.current.addLayer({
      id: 'cities-layer',
      type: 'circle',
      source: 'cities-source',
      paint: {
        'circle-radius': [
          'match',
          ['get', 'tier'],
          'capital', 10,
          'major', 8,
          'minor', 6,
          6
        ],
        'circle-color': ['get', 'color'],
        'circle-stroke-width': 2.5,
        'circle-stroke-color': '#ffffff',
        'circle-opacity': 0.95,
        'circle-blur': 0.08
      }
    });

    map.current.addLayer({
      id: 'cities-glow',
      type: 'circle',
      source: 'cities-source',
      paint: {
        'circle-radius': [
          'match',
          ['get', 'tier'],
          'capital', 16,
          'major', 12,
          'minor', 9,
          9
        ],
        'circle-color': ['get', 'color'],
        'circle-opacity': 0.25,
        'circle-blur': 0.5
      }
    });

    map.current.on('click', 'cities-layer', (e) => {
      const cityName = e.features[0].properties.name;
      const city = cities.find(c => c.name === cityName);
      if (city) onCityClick(city);
    });

    map.current.on('mouseenter', 'cities-layer', () => {
      map.current.getCanvas().style.cursor = 'pointer';
    });
    map.current.on('mouseleave', 'cities-layer', () => {
      map.current.getCanvas().style.cursor = '';
    });
  };

  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    const styleUrl = mapStyles[mapStyle].url;
    
    map.current = new maplibregl.Map({
      container: mapContainer.current,
      style: styleUrl,
      center: [71.5249, 30.1575],
      zoom: 5.5,
      attributionControl: false,
      trackResize: false,
      renderWorldCopies: false,
      fadeDuration: 0
    });

    map.current.addControl(new maplibregl.NavigationControl({ 
      showCompass: true,
      showZoom: true 
    }), 'top-right');

    map.current.on('load', () => {
      addMarkers();
    });

    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (!map.current) return;
    
    localStorage.setItem('mapStyle', mapStyle);
    
    const styleUrl = mapStyles[mapStyle].url;
    
    try {
      if (map.current.getLayer('cities-layer')) {
        map.current.removeLayer('cities-layer');
      }
      if (map.current.getLayer('cities-glow')) {
        map.current.removeLayer('cities-glow');
      }
      if (map.current.getSource('cities-source')) {
        map.current.removeSource('cities-source');
      }
    } catch (err) {
      console.log('Cleanup before style change:', err);
    }
    
    map.current.setStyle(styleUrl);
    map.current.once('styledata', () => {
      addMarkers();
    });
  }, [mapStyle]);

  useEffect(() => {
    if (!map.current || !flyTo) return;
    
    map.current.flyTo({
      center: [flyTo.lon, flyTo.lat],
      zoom: 11,
      duration: 1000,
      essential: true
    });
  }, [flyTo]);

  return (
    <>
      {/* Map Style Switcher - Positioned at BOTTOM LEFT (won't overlap with city panel) */}
      <div style={{
        position: 'absolute',
        bottom: '20px',
        left: '20px',
        zIndex: 10,
        display: 'flex',
        flexDirection: 'row',
        gap: '8px',
        background: 'rgba(6, 15, 30, 0.95)',
        backdropFilter: 'blur(12px)',
        padding: '8px 12px',
        borderRadius: '40px',
        border: '1px solid rgba(0, 212, 170, 0.3)',
        boxShadow: '0 4px 20px rgba(0,0,0,0.3)'
      }}>
        {Object.entries(mapStyles).map(([key, style]) => (
          <button
            key={key}
            onClick={() => setMapStyle(key)}
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              background: mapStyle === key ? 'rgba(0, 212, 170, 0.25)' : 'transparent',
              border: mapStyle === key ? '1.5px solid #00d4aa' : '1px solid rgba(0, 212, 170, 0.3)',
              color: mapStyle === key ? '#00d4aa' : '#8899aa',
              cursor: 'pointer',
              fontSize: '18px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.2s ease'
            }}
            title={style.name}
          >
            {style.iconChar}
          </button>
        ))}
      </div>

      {/* Current Style Indicator - Bottom Right */}
      <div style={{
        position: 'absolute',
        bottom: '20px',
        right: '20px',
        zIndex: 10,
        background: 'rgba(6, 15, 30, 0.85)',
        backdropFilter: 'blur(8px)',
        padding: '6px 14px',
        borderRadius: '24px',
        border: '1px solid rgba(0, 212, 170, 0.4)',
        fontSize: '11px',
        color: '#00d4aa',
        fontFamily: 'DM Mono, monospace',
        pointerEvents: 'none',
        display: 'flex',
        alignItems: 'center',
        gap: '8px'
      }}>
        <span style={{ fontSize: '14px' }}>{mapStyles[mapStyle].iconChar}</span>
        <span>{mapStyles[mapStyle].name}</span>
      </div>

      {/* Map Container */}
      <div 
        ref={mapContainer} 
        style={{ 
          width: '100%', 
          height: '100%',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0
        }} 
      />
    </>
  );
};

export default Map3D;
