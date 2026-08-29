import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import LocationInput from './components/LocationInput';
import PreferencesForm from './components/PreferencesForm';
import ScheduleSummary from './components/ScheduleSummary';
import CalendarView from './components/CalendarView';
import DayDetailModal from './components/DayDetailModal';
import { fetchMowingPlanApi } from './services/api';
import { Loader2, RefreshCw, AlertCircle, Compass } from 'lucide-react';

const DEFAULT_LOCATION = {
  name: "Austin, TX",
  display_name: "Austin, Texas, United States",
  latitude: 30.2672,
  longitude: -97.7431,
  timezone: "America/Chicago"
};

const DEFAULT_PREFERENCES = {
  duration_days: 7,
  mow_count: 1,
  temp_min_f: 60.0,
  temp_max_f: 82.0,
  temp_unit: 'F',
  max_wind_mph: 18.0,
  max_rain_prob: 25,
  preferred_time: 'any'
};

export default function App() {
  const [selectedLocation, setSelectedLocation] = useState(DEFAULT_LOCATION);
  const [preferences, setPreferences] = useState(DEFAULT_PREFERENCES);
  const [tempUnit, setTempUnit] = useState('F');
  const [plan, setPlan] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedDayModal, setSelectedDayModal] = useState(null);

  // Sync temp unit into preferences
  const handleTempUnitChange = (unit) => {
    setTempUnit(unit);
    setPreferences(prev => ({ ...prev, temp_unit: unit }));
  };

  // Fetch / compute mowing plan whenever location or preferences change
  const loadMowingPlan = async (loc = selectedLocation, prefs = preferences) => {
    if (!loc || !loc.latitude || !loc.longitude) return;
    
    setIsLoading(true);
    setError(null);
    try {
      const data = await fetchMowingPlanApi(loc, prefs);
      setPlan(data);
      // If a day was open in modal, refresh its data
      if (selectedDayModal) {
        const updatedDay = data.calendar.find(d => d.date === selectedDayModal.date);
        if (updatedDay) setSelectedDayModal(updatedDay);
      }
    } catch (err) {
      console.error("Failed to load mowing plan:", err);
      setError("Unable to retrieve weather forecast. Please check your connection and try again.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadMowingPlan(selectedLocation, preferences);
  }, [selectedLocation, preferences.duration_days, preferences.mow_count, preferences.temp_min_f, preferences.temp_max_f, preferences.preferred_time, preferences.max_wind_mph, preferences.max_rain_prob]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-emerald-500 selection:text-white">
      
      {/* Header */}
      <Header tempUnit={tempUnit} setTempUnit={handleTempUnitChange} />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6">
        
        {/* Top Control Panel (Location & Preferences) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
          
          {/* Left Column: Location Search & Quick Info (5 cols) */}
          <div className="lg:col-span-5 bg-slate-900/70 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xl space-y-4">
            <LocationInput
              selectedLocation={selectedLocation}
              onSelectLocation={(loc) => setSelectedLocation(loc)}
            />

            {/* Selected Location Pill */}
            {selectedLocation && (
              <div className="p-3 bg-slate-950/80 border border-slate-800 rounded-xl flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs text-slate-300">
                  <Compass className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span className="truncate">{selectedLocation.display_name}</span>
                </div>
                <button
                  type="button"
                  onClick={() => loadMowingPlan(selectedLocation, preferences)}
                  disabled={isLoading}
                  className="text-slate-400 hover:text-emerald-400 transition p-1"
                  title="Refresh Forecast"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-emerald-400' : ''}`} />
                </button>
              </div>
            )}
          </div>

          {/* Right Column: Preferences Form (7 cols) */}
          <div className="lg:col-span-7">
            <PreferencesForm
              preferences={preferences}
              onChangePreferences={(newPrefs) => setPreferences(newPrefs)}
              tempUnit={tempUnit}
            />
          </div>

        </div>

        {/* Loading Indicator */}
        {isLoading && !plan && (
          <div className="py-20 flex flex-col items-center justify-center space-y-3">
            <Loader2 className="w-10 h-10 text-emerald-400 animate-spin" />
            <p className="text-sm font-semibold text-slate-300">
              Analyzing real-time weather forecasts & calculating optimal grass cutting windows...
            </p>
          </div>
        )}

        {/* Error Alert */}
        {error && (
          <div className="p-4 bg-rose-950/80 border border-rose-800 rounded-2xl flex items-center gap-3 text-rose-200">
            <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
            <div className="text-sm">{error}</div>
          </div>
        )}

        {/* Results Area */}
        {plan && (
          <div className="space-y-6 animate-slide-up">
            
            {/* 1. Schedule Summary Card */}
            <ScheduleSummary
              plan={plan}
              tempUnit={tempUnit}
              onSelectDay={(day) => setSelectedDayModal(day)}
            />

            {/* 2. Color-Coded Interactive Calendar */}
            <CalendarView
              days={plan.calendar}
              tempUnit={tempUnit}
              selectedDay={selectedDayModal}
              onSelectDay={(day) => setSelectedDayModal(day)}
            />

          </div>
        )}

      </main>

      {/* Hourly Drill Down Modal */}
      {selectedDayModal && (
        <DayDetailModal
          day={selectedDayModal}
          tempUnit={tempUnit}
          onClose={() => setSelectedDayModal(null)}
        />
      )}

      {/* Footer */}
      <footer className="border-t border-slate-800/80 bg-slate-950 py-6 text-center text-xs text-slate-400">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p>© 2026 YardWork. Powered by Open-Meteo Free Weather API.</p>
          <p className="flex items-center gap-2">
            <span>Decoupled React & Python FastAPI Architecture</span>
          </p>
        </div>
      </footer>

    </div>
  );
}
