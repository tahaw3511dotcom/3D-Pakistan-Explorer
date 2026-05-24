import React, { useEffect, useRef, useState, forwardRef, useImperativeHandle } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

const makeIcon = (color, size, glow) => L.divIcon({
  className: '',
  html: `<div style="
    width:${size}px;height:${size}px;
    background:${color};
    border:2px solid rgba(255,255,255,0.8);
    border-radius:50%;
    box-shadow:0 0 0 ${glow}px ${color}44;
    cursor:pointer;
  "></div>`,
  iconSize:   [size, size],
  iconAnchor: [size / 2, size / 2],
});

const ICONS = {
  capital: makeIcon('#f59e0b', 18, 6),
  major:   makeIcon('#38bdf8', 13, 4),
  minor:   makeIcon('#86efac',  9, 3),
};

// Tile layer URLs
const TILE_LAYERS = {
  satellite: {
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    label: 'ESRI Satellite',
  },
  street: {
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    label: 'OpenStreetMap',
  },
  terrain: {
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}',
    label: 'ESRI Topo',
  },
};

const LABEL_URL = 'https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}';

const PAKISTAN_CENTER = [30.3753, 69.3451];
const PAKISTAN_ZOOM   = 5;

const PakistanMap = forwardRef(function PakistanMap({ cities, flyTo, onCityClick, activeLayer }, ref) {
  const mapRef        = useRef(null);
  const containerRef  = useRef(null);
  const baseLayerRef  = useRef(null);
  const labelLayerRef = useRef(null);
  const [coords, setCoords] = useState(null);

  // Expose methods via ref
  useImperativeHandle(ref, () => ({
    flyTo: (lat, lon, zoom = 5) => {
      mapRef.current?.flyTo([lat, lon], zoom, { duration: 1.5 });
    },
    resetView: () => {
      mapRef.current?.flyTo(PAKISTAN_CENTER, PAKISTAN_ZOOM, { duration: 1.5 });
    }
  }));

  // Init map
  useEffect(() => {
    if (mapRef.current) return;

    const map = L.map(containerRef.current, {
      center:             PAKISTAN_CENTER,
      zoom:               PAKISTAN_ZOOM,
      zoomControl:        false,
      attributionControl: false,
    });

    // Base layer
    baseLayerRef.current = L.tileLayer(TILE_LAYERS.satellite.url, { maxZoom: 17 }).addTo(map);

    // Labels overlay
    labelLayerRef.current = L.tileLayer(LABEL_URL, { maxZoom: 17, opacity: 0.85 }).addTo(map);

    // City markers
    cities.forEach(city => {
      const m = L.marker([city.lat, city.lon], { icon: ICONS[city.tier] }).addTo(map);
      m.on('click', () => onCityClick(city));
      m.bindTooltip(city.name, {
        permanent:  false,
        direction:  'top',
        offset:     [0, -8],
        className:  'city-tooltip',
      });
    });

    // Zoom control bottom-right
    L.control.zoom({ position: 'bottomright' }).addTo(map);

    // Coordinate display on mouse move
    map.on('mousemove', (e) => {
      setCoords({
        lat: e.latlng.lat.toFixed(4),
        lon: e.latlng.lng.toFixed(4),
      });
    });
    map.on('mouseout', () => setCoords(null));

    mapRef.current = map;
    return () => { map.remove(); mapRef.current = null; };
  }, [cities, onCityClick]); // Added dependencies

  // Fly to city
  useEffect(() => {
    if (flyTo && mapRef.current) {
      const zoom = flyTo.tier === 'minor' ? 10 : 9;
      mapRef.current.flyTo([flyTo.lat, flyTo.lon], zoom, { duration: 1.2 });
    }
  }, [flyTo]);

  // Switch tile layer
  useEffect(() => {
    if (!mapRef.current || !baseLayerRef.current || !activeLayer) return;
    const map = mapRef.current;
    map.removeLayer(baseLayerRef.current);
    baseLayerRef.current = L.tileLayer(
      TILE_LAYERS[activeLayer]?.url || TILE_LAYERS.satellite.url,
      { maxZoom: 17 }
    ).addTo(map);
    // Keep labels on top
    if (labelLayerRef.current && activeLayer !== 'street') {
      labelLayerRef.current.setOpacity(0.85);
    } else if (labelLayerRef.current) {
      labelLayerRef.current.setOpacity(0); // OSM already has labels
    }
  }, [activeLayer]);

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
      <div ref={containerRef} style={{ width: '100%', height: '100%' }} />
      {coords && (
        <div className="map-coords">
          📍 {coords.lat}°N   {coords.lon}°E
        </div>
      )}
    </div>
  );
});

export default PakistanMap;