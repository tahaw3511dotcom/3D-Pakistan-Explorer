import React, { useEffect, useRef, useState } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';

const PAKISTAN_CENTER = [69.3451, 30.3753];
const PAKISTAN_ZOOM = 4.8;

// Population values for tower heights (in millions)
const POP_MAP = {
  Karachi: 16, Lahore: 13, Faisalabad: 3.6, Rawalpindi: 2.2,
  Gujranwala: 2.3, Peshawar: 2.1, Multan: 2, Hyderabad: 1.7,
  Islamabad: 1.2, Quetta: 1.1, Bahawalpur: 0.8, Sialkot: 0.9,
  Sargodha: 0.8, Abbottabad: 0.9, Sheikhupura: 0.8,
};

const TIER_COLORS = {
  capital: [245, 158, 11],
  major:   [56, 189, 248],
  minor:   [134, 239, 172],
};

export default function Map3D({ cities, onCityClick, flyTo }) {
  const containerRef = useRef(null);
  const mapRef       = useRef(null);
  const markersRef   = useRef([]);
  const [coords, setCoords] = useState(null);

  useEffect(() => {
    if (mapRef.current || !containerRef.current) return;

    const map = new maplibregl.Map({
      container: containerRef.current,
      // Free dark style from Stadia Maps (no key needed)
      style: 'https://tiles.stadiamaps.com/styles/alidade_smooth_dark.json',
      center: PAKISTAN_CENTER,
      zoom: PAKISTAN_ZOOM,
      pitch: 45,
      bearing: -10,
      antialias: true,
    });

    map.addControl(new maplibregl.NavigationControl({ visualizePitch: true }), 'bottom-right');
    map.addControl(new maplibregl.ScaleControl(), 'bottom-left');

    map.on('load', () => {
      // Add 3D terrain using free Maptiler terrain
      map.addSource('terrain', {
        type: 'raster-dem',
        url: 'https://demotiles.maplibre.org/terrain-tiles/tiles.json',
        tileSize: 256,
      });
      map.setTerrain({ source: 'terrain', exaggeration: 2.5 });

      // Sky layer for atmosphere
      map.setSky({
        'sky-color': '#0a1929',
        'sky-horizon-blend': 0.5,
        'horizon-color': '#1e3a5f',
        'horizon-fog-blend': 0.5,
        'fog-color': '#0d1b2a',
        'fog-ground-blend': 0.5,
      });

      // Add city tower layer as GeoJSON
      const geojson = {
        type: 'FeatureCollection',
        features: cities.map(city => ({
          type: 'Feature',
          geometry: { type: 'Point', coordinates: [city.lon, city.lat] },
          properties: {
            name: city.name,
            tier: city.tier,
            pop: POP_MAP[city.name] || 0.1,
            province: city.province,
            color: JSON.stringify(TIER_COLORS[city.tier] || TIER_COLORS.minor),
          },
        })),
      };

      map.addSource('cities', { type: 'geojson', data: geojson });

      // Glowing base circles
      map.addLayer({
        id: 'city-glow',
        type: 'circle',
        source: 'cities',
        paint: {
          'circle-radius': ['interpolate', ['linear'], ['zoom'],
            4, ['case', ['==', ['get', 'tier'], 'capital'], 14,
                         ['==', ['get', 'tier'], 'major'], 9, 6],
            10, ['case', ['==', ['get', 'tier'], 'capital'], 28,
                          ['==', ['get', 'tier'], 'major'], 18, 12],
          ],
          'circle-color': ['case',
            ['==', ['get', 'tier'], 'capital'], '#f59e0b',
            ['==', ['get', 'tier'], 'major'],   '#38bdf8',
            '#86efac',
          ],
          'circle-opacity': 0.25,
          'circle-blur': 1,
        },
      });

      // Solid marker dots
      map.addLayer({
        id: 'city-dots',
        type: 'circle',
        source: 'cities',
        paint: {
          'circle-radius': ['interpolate', ['linear'], ['zoom'],
            4, ['case', ['==', ['get', 'tier'], 'capital'], 7,
                         ['==', ['get', 'tier'], 'major'], 5, 3],
            10, ['case', ['==', ['get', 'tier'], 'capital'], 14,
                          ['==', ['get', 'tier'], 'major'], 10, 7],
          ],
          'circle-color': ['case',
            ['==', ['get', 'tier'], 'capital'], '#f59e0b',
            ['==', ['get', 'tier'], 'major'],   '#38bdf8',
            '#86efac',
          ],
          'circle-stroke-width': 1.5,
          'circle-stroke-color': 'rgba(255,255,255,0.7)',
        },
      });

      // City name labels
      map.addLayer({
        id: 'city-labels',
        type: 'symbol',
        source: 'cities',
        minzoom: 5,
        layout: {
          'text-field': ['get', 'name'],
          'text-font': ['Open Sans Bold'],
          'text-size': ['interpolate', ['linear'], ['zoom'],
            5, ['case', ['==', ['get', 'tier'], 'capital'], 13,
                         ['==', ['get', 'tier'], 'major'], 11, 9],
            10, 14,
          ],
          'text-offset': [0, 1.2],
          'text-anchor': 'top',
          'text-allow-overlap': false,
        },
        paint: {
          'text-color': ['case',
            ['==', ['get', 'tier'], 'capital'], '#fbbf24',
            ['==', ['get', 'tier'], 'major'],   '#7dd3fc',
            '#bbf7d0',
          ],
          'text-halo-color': 'rgba(0,0,0,0.8)',
          'text-halo-width': 1.5,
        },
      });

      // Click handler
      map.on('click', 'city-dots', (e) => {
        const props = e.features[0].properties;
        const city = cities.find(c => c.name === props.name);
        if (city) onCityClick(city);
      });

      map.on('mouseenter', 'city-dots', () => {
        map.getCanvas().style.cursor = 'pointer';
      });
      map.on('mouseleave', 'city-dots', () => {
        map.getCanvas().style.cursor = '';
      });
    });

    map.on('mousemove', (e) => {
      setCoords({ lat: e.lngLat.lat.toFixed(4), lon: e.lngLat.lng.toFixed(4) });
    });
    map.on('mouseout', () => setCoords(null));

    mapRef.current = map;
    return () => { map.remove(); mapRef.current = null; };
  }, []);

  // Fly to selected city
  useEffect(() => {
    if (!flyTo || !mapRef.current) return;
    mapRef.current.flyTo({
      center: [flyTo.lon, flyTo.lat],
      zoom: flyTo.tier === 'capital' ? 11 : flyTo.tier === 'major' ? 10 : 9,
      pitch: 55,
      bearing: Math.random() * 60 - 30,
      duration: 2000,
      essential: true,
    });
  }, [flyTo]);

  const resetView = () => {
    if (!mapRef.current) return;
    mapRef.current.flyTo({
      center: PAKISTAN_CENTER, zoom: PAKISTAN_ZOOM,
      pitch: 45, bearing: -10, duration: 1800,
    });
  };

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
      <div ref={containerRef} style={{ width: '100%', height: '100%' }} />

      {/* Reset button */}
      <button className="map-reset-btn" onClick={resetView}>🏠 Pakistan</button>

      {/* Coords */}
      {coords && (
        <div className="map-coords">
          {coords.lat}°N &nbsp; {coords.lon}°E
        </div>
      )}

      {/* Legend */}
      <div className="map-legend">
        <div className="legend-item"><span style={{ background: '#f59e0b' }} />Capital</div>
        <div className="legend-item"><span style={{ background: '#38bdf8' }} />Major City</div>
        <div className="legend-item"><span style={{ background: '#86efac' }} />Minor City</div>
      </div>
    </div>
  );
}