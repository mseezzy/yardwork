import React, { useState, useEffect, useRef } from 'react';
import { MapPin, Search, Navigation, Loader2, Check } from 'lucide-react';
import { searchLocationsApi } from '../services/api';

const POPULAR_LOCATIONS = [
  { name: "Austin, TX", latitude: 30.2672, longitude: -97.7431, timezone: "America/Chicago" },
  { name: "Seattle, WA", latitude: 47.6062, longitude: -122.3321, timezone: "America/Los_Angeles" },
  { name: "Chicago, IL", latitude: 41.8781, longitude: -87.6298, timezone: "America/Chicago" },
  { name: "Orlando, FL", latitude: 28.5383, longitude: -81.3792, timezone: "America/New_York" },
  { name: "Denver, CO", latitude: 39.7392, longitude: -104.9903, timezone: "America/Denver" },
];

export default function LocationInput({ selectedLocation, onSelectLocation }) {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Debounced search
  useEffect(() => {
    if (!query || query.trim().length < 2) {
      setSuggestions([]);
      return;
    }

    const timer = setTimeout(async () => {
      setIsLoading(true);
      try {
        const results = await searchLocationsApi(query);
        setSuggestions(results);
        setIsOpen(true);
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  const handleSelect = (loc) => {
    onSelectLocation(loc);
    setQuery(loc.display_name || loc.name);
    setIsOpen(false);
  };

  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser.");
      return;
    }

    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setIsLocating(false);
        const loc = {
          name: "Current Location",
          display_name: `Your Location (${pos.coords.latitude.toFixed(3)}°, ${pos.coords.longitude.toFixed(3)}°)`,
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || "auto"
        };
        onSelectLocation(loc);
        setQuery(loc.display_name);
        setIsOpen(false);
      },
      (err) => {
        setIsLocating(false);
        alert(`Location permission denied or unavailable: ${err.message}`);
      }
    );
  };

  return (
    <div className="w-full relative" ref={dropdownRef}>
      <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2 flex items-center justify-between">
        <span className="flex items-center gap-1.5">
          <MapPin className="w-3.5 h-3.5 text-emerald-400" /> Lawn Location / Address
        </span>
        <button
          type="button"
          onClick={handleUseCurrentLocation}
          disabled={isLocating}
          className="text-emerald-400 hover:text-emerald-300 font-medium text-xs flex items-center gap-1 transition"
        >
          {isLocating ? <Loader2 className="w-3 h-3 animate-spin" /> : <Navigation className="w-3 h-3" />}
          <span>Use Current Location</span>
        </button>
      </label>

      {/* Input box */}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
          <Search className="w-4 h-4" />
        </div>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => { if (suggestions.length > 0) setIsOpen(true); }}
          placeholder="Enter street address, city, state, or postal code..."
          className="w-full pl-10 pr-10 py-2.5 bg-slate-900/90 border border-slate-700/80 rounded-xl text-white placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition shadow-inner"
        />
        {isLoading && (
          <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none">
            <Loader2 className="w-4 h-4 text-emerald-400 animate-spin" />
          </div>
        )}
      </div>

      {/* Autocomplete dropdown */}
      {isOpen && suggestions.length > 0 && (
        <div className="absolute z-50 mt-1.5 w-full bg-slate-900 border border-slate-700 rounded-xl shadow-2xl overflow-hidden max-h-64 overflow-y-auto animate-fade-in">
          {suggestions.map((loc, idx) => (
            <button
              key={loc.id || idx}
              type="button"
              onClick={() => handleSelect(loc)}
              className="w-full text-left px-4 py-2.5 hover:bg-slate-800/80 transition flex items-center justify-between border-b border-slate-800/50 last:border-0"
            >
              <div className="flex items-center gap-2.5">
                <MapPin className="w-4 h-4 text-emerald-400 shrink-0" />
                <div>
                  <div className="text-sm font-semibold text-slate-100">{loc.name}</div>
                  <div className="text-xs text-slate-400">{loc.display_name}</div>
                </div>
              </div>
              {selectedLocation && selectedLocation.latitude === loc.latitude && selectedLocation.longitude === loc.longitude && (
                <Check className="w-4 h-4 text-emerald-400" />
              )}
            </button>
          ))}
        </div>
      )}

      {/* Quick suggestions pills */}
      <div className="mt-2.5 flex items-center gap-1.5 flex-wrap">
        <span className="text-xs text-slate-400 font-medium mr-1">Popular:</span>
        {POPULAR_LOCATIONS.map((city) => (
          <button
            key={city.name}
            type="button"
            onClick={() => handleSelect(city)}
            className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition ${
              selectedLocation?.name === city.name
                ? 'bg-emerald-950/80 text-emerald-300 border-emerald-600'
                : 'bg-slate-800/60 hover:bg-slate-800 text-slate-300 border-slate-700/60'
            }`}
          >
            {city.name}
          </button>
        ))}
      </div>
    </div>
  );
}
