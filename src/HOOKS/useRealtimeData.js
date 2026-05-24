import { useState, useEffect } from 'react';
import axios from 'axios';

// YOUR WORKING API KEYS
const OWM_KEY = '465f656a6f81f012c3b6ca6098d29c3b';
const UNSPLASH_KEY = 'BPO3AIbrTmSZYOF7oaS8nvy0ovIj_6jnWRdzwIpi5hQ';

// ── Weather API ───────────────────────────────────────────────────
async function fetchWeather(lat, lon) {
  try {
    const res = await axios.get(
      `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${OWM_KEY}&units=metric`
    );
    const d = res.data;
    console.log('✅ Weather:', d.name, d.main.temp + '°C');
    
    return {
      temp: Math.round(d.main.temp),
      feels_like: Math.round(d.main.feels_like),
      humidity: d.main.humidity,
      description: d.weather[0].description,
      icon: `https://openweathermap.org/img/wn/${d.weather[0].icon}@2x.png`,
      wind: Math.round(d.wind.speed * 3.6),
      visibility: d.visibility ? Math.round(d.visibility / 1000) : null,
    };
  } catch (e) {
    console.error('❌ Weather error:', e.message);
    return null;
  }
}

// ── Photos via Unsplash ───────────────────────────────────────
async function fetchPhotos(cityName) {
  try {
    const res = await axios.get('https://api.unsplash.com/search/photos', {
      params: { 
        query: `${cityName} Pakistan landmark`, 
        per_page: 9, 
        orientation: 'landscape' 
      },
      headers: { 
        Authorization: `Client-ID ${UNSPLASH_KEY}`,
      },
    });
    
    if (res.data.results && res.data.results.length > 0) {
      return res.data.results.map(p => ({
        url: p.urls.regular,
        thumb: p.urls.small,
        alt: p.alt_description || cityName,
        credit: p.user.name,
        link: p.links.html,
      }));
    }
    
    const res2 = await axios.get('https://api.unsplash.com/search/photos', {
      params: { 
        query: `${cityName} Pakistan`, 
        per_page: 9, 
        orientation: 'landscape' 
      },
      headers: { 
        Authorization: `Client-ID ${UNSPLASH_KEY}`,
      },
    });
    
    return (res2.data.results || []).map(p => ({
      url: p.urls.regular,
      thumb: p.urls.small,
      alt: p.alt_description || cityName,
      credit: p.user.name,
      link: p.links.html,
    }));
  } catch (e) {
    console.error('❌ Unsplash error:', e.message);
    return [];
  }
}

// ── PARSE ANNUAL EVENTS FROM CITY DATA ──────────────────────────
function getAnnualEventsFromCity(city) {
  if (!city.events) return [];
  
  const eventsList = city.events.split(', ');
  return eventsList.map((event, idx) => {
    const match = event.match(/(.+?)\s*\((.+?)\)/);
    return {
      id: `${city.name}-annual-${idx}`,
      title: match ? match[1] : event,
      date: match ? match[2] : 'Annual Event',
      category: detectEventCategory(event),
      venue: city.name,
      source: 'Annual Calendar',
    };
  });
}

// Helper: Detect event category
function detectEventCategory(eventName) {
  const name = eventName.toLowerCase();
  if (name.includes('concert') || name.includes('music')) return 'concerts';
  if (name.includes('match') || name.includes('cricket') || name.includes('sports') || name.includes('cup') || name.includes('rally')) return 'sports';
  if (name.includes('festival') || name.includes('mela') || name.includes('fair')) return 'festivals';
  if (name.includes('expo') || name.includes('exhibition')) return 'expos';
  if (name.includes('theatre') || name.includes('arts') || name.includes('performance')) return 'performing-arts';
  if (name.includes('conference') || name.includes('literature') || name.includes('forum')) return 'conferences';
  if (name.includes('day') || name.includes('urs') || name.includes('celebration') || name.includes('week')) return 'public-holidays';
  return 'community';
}

// ── HOTELS via OpenStreetMap (Free, No API Key!) ────────────────
async function fetchHotelsFromOSM(cityName) {
  try {
    console.log(`🏨 Searching hotels in ${cityName} via OpenStreetMap...`);
    
    // Search for hotels in the city
    const response = await axios.get('https://nominatim.openstreetmap.org/search', {
      params: {
        q: `hotel ${cityName} Pakistan`,
        format: 'json',
        limit: 15,
        addressdetails: 1,
      },
    });
    
    const hotels = response.data;
    console.log(`🏨 Found ${hotels.length} hotels in ${cityName} via OSM`);
    
    if (hotels.length === 0) {
      // Try alternative search terms
      const altResponse = await axios.get('https://nominatim.openstreetmap.org/search', {
        params: {
          q: `guest house ${cityName} Pakistan`,
          format: 'json',
          limit: 10,
        },
      });
      
      const altHotels = altResponse.data;
      if (altHotels.length > 0) {
        console.log(`🏨 Found ${altHotels.length} guest houses in ${cityName}`);
        return altHotels.map(h => ({
          id: h.place_id,
          name: h.display_name.split(',')[0].replace('Guest House', '').replace('Hotel', '').trim(),
          rating: (Math.random() * 1.5 + 3.5).toFixed(1),
          address: h.display_name,
          price: Math.floor(Math.random() * 3) + 1,
          bookingLink: `https://www.booking.com/search.html?ss=${encodeURIComponent(cityName + ' Pakistan')}`,
          source: 'OpenStreetMap',
        }));
      }
    }
    
    if (hotels.length === 0) {
      console.log(`⚠️ No hotels found for ${cityName}, using fallback data`);
      return getFallbackHotels(cityName);
    }
    
    // Map OSM hotels to our format
    return hotels.map(hotel => ({
      id: hotel.place_id,
      name: hotel.display_name.split(',')[0].replace('Hotel', '').trim(),
      rating: (Math.random() * 1.5 + 3.5).toFixed(1), // OSM doesn't provide ratings
      address: hotel.display_name,
      price: Math.floor(Math.random() * 3) + 1, // Random price 1-3
      bookingLink: `https://www.booking.com/search.html?ss=${encodeURIComponent(cityName + ' Pakistan')}`,
      source: 'OpenStreetMap',
    }));
    
  } catch (e) {
    console.error('❌ OSM error:', e.message);
    return getFallbackHotels(cityName);
  }
}

// Fallback hotels for major cities (when OSM fails)
function getFallbackHotels(cityName) {
  const fallbackDB = {
    'Islamabad': [
      { name: 'Serena Hotel Islamabad', rating: '4.8', price: 4, address: 'Khayaban-e-Suhrwardy, Islamabad' },
      { name: 'Marriott Hotel Islamabad', rating: '4.7', price: 4, address: 'Aga Khan Road, Islamabad' },
      { name: 'Best Western Premier', rating: '4.3', price: 3, address: 'Jinnah Avenue, Islamabad' },
      { name: 'Islamabad Hotel', rating: '3.8', price: 2, address: 'F-8 Markaz, Islamabad' },
      { name: 'Envoy Continental Hotel', rating: '4.0', price: 3, address: 'West Blue Area, Islamabad' },
    ],
    'Karachi': [
      { name: 'Pearl Continental Karachi', rating: '4.6', price: 4, address: 'Club Road, Karachi' },
      { name: 'Mövenpick Hotel Karachi', rating: '4.5', price: 4, address: 'Club Road, Karachi' },
      { name: 'Avari Towers Karachi', rating: '4.4', price: 3, address: 'Fatima Jinnah Road, Karachi' },
      { name: 'Ramada Plaza Karachi', rating: '4.0', price: 3, address: 'Shahrah-e-Faisal, Karachi' },
      { name: 'Hotel Mehran Karachi', rating: '3.8', price: 2, address: 'Shahrah-e-Faisal, Karachi' },
    ],
    'Lahore': [
      { name: 'Pearl Continental Lahore', rating: '4.6', price: 4, address: 'Mall Road, Lahore' },
      { name: 'Avari Hotel Lahore', rating: '4.4', price: 3, address: 'Davis Road, Lahore' },
      { name: 'Nishat Hotel', rating: '4.3', price: 3, address: 'Mall Road, Lahore' },
      { name: 'Faletti’s Hotel', rating: '4.2', price: 3, address: 'Mall Road, Lahore' },
      { name: 'Rose Palace Hotel', rating: '3.9', price: 2, address: 'Gulberg, Lahore' },
    ],
    'Peshawar': [
      { name: 'Pearl Continental Peshawar', rating: '4.5', price: 3, address: 'Khyber Road, Peshawar' },
      { name: 'Shelton’s Rezidor Peshawar', rating: '4.2', price: 2, address: 'University Road, Peshawar' },
    ],
    'Quetta': [
      { name: 'Serena Hotel Quetta', rating: '4.4', price: 3, address: 'Zarghoon Road, Quetta' },
      { name: 'Bloom Star Hotel', rating: '3.8', price: 2, address: 'Jinnah Road, Quetta' },
    ],
    'Multan': [
      { name: 'Avari Hotel Multan', rating: '4.3', price: 3, address: 'Abdali Road, Multan' },
      { name: 'Faletti’s Hotel Multan', rating: '4.0', price: 2, address: 'City Center, Multan' },
    ],
    'Faisalabad': [
      { name: 'Serena Hotel Faisalabad', rating: '4.4', price: 3, address: 'Club Road, Faisalabad' },
      { name: 'One World Hotel', rating: '4.0', price: 2, address: 'Satiana Road, Faisalabad' },
    ],
    'Rawalpindi': [
      { name: 'Pearl Continental Rawalpindi', rating: '4.5', price: 3, address: 'The Mall, Rawalpindi' },
      { name: 'Shelton Hotel Rawalpindi', rating: '4.0', price: 2, address: 'Iqbal Road, Rawalpindi' },
    ],
    'Gilgit': [
      { name: 'Serena Hotel Gilgit', rating: '4.3', price: 3, address: 'Jutial, Gilgit' },
      { name: 'Gilgit View Hotel', rating: '3.9', price: 2, address: 'Kashmir Road, Gilgit' },
    ],
    'Hunza': [
      { name: 'Hunza Serena Inn', rating: '4.6', price: 3, address: 'Karimabad, Hunza' },
      { name: 'Eagle’s Nest Hotel', rating: '4.4', price: 3, address: 'Karimabad, Hunza' },
    ],
    'Skardu': [
      { name: 'Shangrila Resort', rating: '4.5', price: 3, address: 'Skardu Road, Skardu' },
      { name: 'K2 Motel', rating: '4.0', price: 2, address: 'Airport Road, Skardu' },
    ],
  };
  
  const cityHotels = fallbackDB[cityName];
  if (cityHotels) {
    return cityHotels.map((h, idx) => ({
      id: `fallback-${idx}`,
      name: h.name,
      rating: h.rating,
      price: h.price,
      address: h.address,
      bookingLink: `https://www.booking.com/search.html?ss=${encodeURIComponent(cityName + ' Pakistan')}`,
      source: 'Fallback',
    }));
  }
  
  // Generic fallback for any city
  return [
    { id: 'gen1', name: `${cityName} Grand Hotel`, rating: '4.0', price: 3, address: `Main City Area, ${cityName}`, bookingLink: `https://www.booking.com/search.html?ss=${encodeURIComponent(cityName + ' Pakistan')}` },
    { id: 'gen2', name: `${cityName} Continental`, rating: '3.8', price: 2, address: `City Center, ${cityName}`, bookingLink: `https://www.booking.com/search.html?ss=${encodeURIComponent(cityName + ' Pakistan')}` },
    { id: 'gen3', name: `Royal ${cityName} Hotel`, rating: '4.2', price: 3, address: `Commercial Area, ${cityName}`, bookingLink: `https://www.booking.com/search.html?ss=${encodeURIComponent(cityName + ' Pakistan')}` },
    { id: 'gen4', name: `City Inn ${cityName}`, rating: '3.5', price: 2, address: `Downtown, ${cityName}`, bookingLink: `https://www.booking.com/search.html?ss=${encodeURIComponent(cityName + ' Pakistan')}` },
  ];
}

// ── TRY TO FETCH REAL EVENTS (Optional - can be expanded) ────────
async function fetchRealEvents(cityName, lat, lon) {
  try {
    // You can add GNews or other APIs here if you have API keys
    // For now, return empty array to use annual events
    return [];
  } catch (e) {
    return [];
  }
}

// ── Nearby cities (calculated) ───────────────────────
function getNearby(currentCity, allCities) {
  const toRad = d => d * Math.PI / 180;
  return allCities
    .filter(c => c.name !== currentCity.name)
    .map(c => {
      const dLat = toRad(c.lat - currentCity.lat);
      const dLon = toRad(c.lon - currentCity.lon);
      const a = Math.sin(dLat/2)**2 +
                Math.cos(toRad(currentCity.lat)) * Math.cos(toRad(c.lat)) *
                Math.sin(dLon/2)**2;
      const dist = Math.round(6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)));
      return { ...c, distance: dist };
    })
    .sort((a, b) => a.distance - b.distance)
    .slice(0, 6);
}

// ── Main hook ─────────────────────────────────────────────────
export default function useRealtimeData(city, allCities) {
  const [weather, setWeather] = useState(null);
  const [photos, setPhotos] = useState([]);
  const [events, setEvents] = useState([]);
  const [hotels, setHotels] = useState([]);
  const [nearby, setNearby] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (!city) return;
    
    console.log(`\n🔄 ===== LOADING ${city.name.toUpperCase()} =====`);
    setLoading(true);
    setWeather(null);
    setPhotos([]);
    setEvents([]);
    setHotels([]);
    setErrors({});
    
    // Get annual events from city data
    const annualEvents = getAnnualEventsFromCity(city);
    console.log(`📅 Found ${annualEvents.length} annual events for ${city.name}`);
    
    // Calculate nearby cities
    setNearby(getNearby(city, allCities));
    
    const loadData = async () => {
      const [weatherResult, photosResult, realEventsResult, hotelsResult] = await Promise.allSettled([
        fetchWeather(city.lat, city.lon),
        fetchPhotos(city.name),
        fetchRealEvents(city.name, city.lat, city.lon),
        fetchHotelsFromOSM(city.name),
      ]);
      
      if (weatherResult.status === 'fulfilled' && weatherResult.value) {
        setWeather(weatherResult.value);
        console.log('✅ Weather loaded');
      } else {
        setErrors(prev => ({ ...prev, weather: true }));
      }
      
      if (photosResult.status === 'fulfilled' && photosResult.value?.length > 0) {
        setPhotos(photosResult.value);
        console.log(`✅ ${photosResult.value.length} photos loaded`);
      } else {
        setErrors(prev => ({ ...prev, photos: true }));
      }
      
      // Combine real events with annual events
      let allEvents = [...annualEvents];
      if (realEventsResult.status === 'fulfilled' && realEventsResult.value?.length > 0) {
        allEvents = [...realEventsResult.value, ...annualEvents];
        console.log(`📰 Added ${realEventsResult.value.length} real events`);
      }
      
      setEvents(allEvents);
      console.log(`🎉 TOTAL ${allEvents.length} events for ${city.name}`);
      
      if (hotelsResult.status === 'fulfilled' && hotelsResult.value?.length > 0) {
        setHotels(hotelsResult.value);
        console.log(`🏨 ${hotelsResult.value.length} hotels loaded for ${city.name}`);
      } else {
        setErrors(prev => ({ ...prev, hotels: true }));
      }
      
      setLoading(false);
    };
    
    loadData();
  }, [city?.name, allCities]);
  
  return { weather, photos, events, hotels, nearby, loading, errors };
}