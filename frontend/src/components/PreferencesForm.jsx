import React, { useState } from 'react';
import { Calendar, Sliders, Sun, Clock, Wind, CloudRain, ChevronDown, ChevronUp } from 'lucide-react';
import { fToC, cToF } from '../services/mowingEngine';

export default function PreferencesForm({ preferences, onChangePreferences, tempUnit }) {
  const [showAdvanced, setShowAdvanced] = useState(false);

  const handleDurationChange = (days) => {
    // Automatically adjust default mow count to sensible ratio
    let newMowCount = preferences.mow_count;
    if (days === 7 && newMowCount > 3) newMowCount = 1;
    if (days === 14 && newMowCount > 5) newMowCount = 2;
    if (days === 30 && newMowCount < 2) newMowCount = 4;
    
    onChangePreferences({
      ...preferences,
      duration_days: days,
      mow_count: newMowCount
    });
  };

  const handleMowCountChange = (delta) => {
    const nextCount = Math.max(1, Math.min(10, preferences.mow_count + delta));
    onChangePreferences({ ...preferences, mow_count: nextCount });
  };

  // Temperature display values
  const minTempDisplay = tempUnit === 'C' ? fToC(preferences.temp_min_f) : preferences.temp_min_f;
  const maxTempDisplay = tempUnit === 'C' ? fToC(preferences.temp_max_f) : preferences.temp_max_f;

  const handleMinTempChange = (val) => {
    const num = parseFloat(val);
    const fVal = tempUnit === 'C' ? cToF(num) : num;
    if (fVal < preferences.temp_max_f - 3) {
      onChangePreferences({ ...preferences, temp_min_f: fVal });
    }
  };

  const handleMaxTempChange = (val) => {
    const num = parseFloat(val);
    const fVal = tempUnit === 'C' ? cToF(num) : num;
    if (fVal > preferences.temp_min_f + 3) {
      onChangePreferences({ ...preferences, temp_max_f: fVal });
    }
  };

  const timeOptions = [
    { id: 'any', label: 'Any Time', icon: Sun },
    { id: 'morning', label: 'Morning (8-11 AM)', icon: Clock },
    { id: 'afternoon', label: 'Afternoon (12-4 PM)', icon: Sun },
    { id: 'evening', label: 'Evening (5-8 PM)', icon: Clock },
  ];

  const avgInterval = Math.round((preferences.duration_days / preferences.mow_count) * 10) / 10;

  return (
    <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xl space-y-5">
      
      {/* Top Row: Duration & Mow Frequency */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        
        {/* 1. Duration Selector */}
        <div>
          <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-emerald-400" /> Forecast Window
          </label>
          <div className="grid grid-cols-3 gap-1.5 p-1 bg-slate-950/80 border border-slate-800 rounded-xl">
            {[
              { days: 7, label: '1 Week', sub: '7 Days' },
              { days: 14, label: '2 Weeks', sub: '14 Days' },
              { days: 30, label: '1 Month', sub: '30 Days' },
            ].map((opt) => (
              <button
                key={opt.days}
                type="button"
                onClick={() => handleDurationChange(opt.days)}
                className={`py-2 px-2 rounded-lg text-center transition ${
                  preferences.duration_days === opt.days
                    ? 'bg-emerald-600 text-white font-bold shadow-md shadow-emerald-900/50'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-850'
                }`}
              >
                <div className="text-xs font-bold">{opt.label}</div>
                <div className="text-[10px] opacity-80">{opt.sub}</div>
              </button>
            ))}
          </div>
        </div>

        {/* 2. Mow Frequency Counter */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <Sliders className="w-3.5 h-3.5 text-emerald-400" /> Target Mowing Count
            </label>
            <span className="text-[11px] font-medium text-emerald-400 bg-emerald-950/70 border border-emerald-800/40 px-2 py-0.5 rounded-full">
              ~Every {avgInterval} days
            </span>
          </div>

          <div className="flex items-center gap-3 bg-slate-950/80 border border-slate-800 rounded-xl p-1.5 justify-between">
            <button
              type="button"
              onClick={() => handleMowCountChange(-1)}
              disabled={preferences.mow_count <= 1}
              className="w-10 h-9 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-30 disabled:pointer-events-none text-white font-bold text-lg flex items-center justify-center transition active:scale-95"
            >
              -
            </button>
            
            <div className="text-center">
              <span className="text-lg font-extrabold text-white">{preferences.mow_count}</span>
              <span className="text-xs text-slate-400 font-medium ml-1.5">
                {preferences.mow_count === 1 ? 'mow' : 'mows'} total
              </span>
            </div>

            <button
              type="button"
              onClick={() => handleMowCountChange(1)}
              disabled={preferences.mow_count >= 10}
              className="w-10 h-9 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-30 disabled:pointer-events-none text-white font-bold text-lg flex items-center justify-center transition shadow-md shadow-emerald-900/30 active:scale-95"
            >
              +
            </button>
          </div>
        </div>

      </div>

      {/* Middle Row: Feels-Like Temperature Range */}
      <div className="bg-slate-950/60 border border-slate-800/70 rounded-xl p-3.5">
        <div className="flex items-center justify-between mb-2">
          <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
            <Sun className="w-3.5 h-3.5 text-amber-400" /> Ideal "Feels Like" Temperature Range
          </label>
          <div className="text-xs font-bold text-emerald-400 bg-emerald-950/90 border border-emerald-800/60 px-2.5 py-0.5 rounded-lg">
            {Math.round(minTempDisplay)}°{tempUnit} – {Math.round(maxTempDisplay)}°{tempUnit}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 mt-2">
          <div>
            <div className="flex justify-between text-[11px] text-slate-400 mb-1">
              <span>Min Comfort Temp</span>
              <span className="font-semibold text-slate-200">{Math.round(minTempDisplay)}°{tempUnit}</span>
            </div>
            <input
              type="range"
              min={tempUnit === 'C' ? 10 : 50}
              max={tempUnit === 'C' ? 24 : 75}
              step={1}
              value={minTempDisplay}
              onChange={(e) => handleMinTempChange(e.target.value)}
              className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
            />
          </div>

          <div>
            <div className="flex justify-between text-[11px] text-slate-400 mb-1">
              <span>Max Comfort Temp</span>
              <span className="font-semibold text-slate-200">{Math.round(maxTempDisplay)}°{tempUnit}</span>
            </div>
            <input
              type="range"
              min={tempUnit === 'C' ? 22 : 72}
              max={tempUnit === 'C' ? 36 : 95}
              step={1}
              value={maxTempDisplay}
              onChange={(e) => handleMaxTempChange(e.target.value)}
              className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
            />
          </div>
        </div>
      </div>

      {/* Time of Day Preference Pills */}
      <div>
        <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
          <Clock className="w-3.5 h-3.5 text-sky-400" /> Preferred Mowing Time
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {timeOptions.map((t) => {
            const Icon = t.icon;
            const isSelected = preferences.preferred_time === t.id;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => onChangePreferences({ ...preferences, preferred_time: t.id })}
                className={`py-2 px-2.5 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 transition ${
                  isSelected
                    ? 'bg-emerald-950 text-emerald-300 border-emerald-500 shadow-sm'
                    : 'bg-slate-950/60 hover:bg-slate-800 text-slate-400 border-slate-800'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{t.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Advanced Weather Thresholds Accordion */}
      <div>
        <button
          type="button"
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="text-xs text-slate-400 hover:text-slate-200 flex items-center gap-1 font-medium transition"
        >
          <span>Weather Tolerance & Thresholds</span>
          {showAdvanced ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </button>

        {showAdvanced && (
          <div className="mt-3 p-3.5 bg-slate-950/80 border border-slate-800/80 rounded-xl grid grid-cols-1 sm:grid-cols-2 gap-4 animate-fade-in">
            {/* Max Rain Probability */}
            <div>
              <div className="flex justify-between text-xs text-slate-300 mb-1">
                <span className="flex items-center gap-1"><CloudRain className="w-3 h-3 text-blue-400" /> Rain Disqualification</span>
                <span className="font-bold text-blue-400">&gt; {preferences.max_rain_prob}%</span>
              </div>
              <input
                type="range"
                min={10}
                max={50}
                step={5}
                value={preferences.max_rain_prob}
                onChange={(e) => onChangePreferences({ ...preferences, max_rain_prob: parseInt(e.target.value) })}
                className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-500"
              />
              <p className="text-[10px] text-slate-400 mt-1">Disqualify hours if rain probability exceeds threshold.</p>
            </div>

            {/* Max Wind Speed */}
            <div>
              <div className="flex justify-between text-xs text-slate-300 mb-1">
                <span className="flex items-center gap-1"><Wind className="w-3 h-3 text-sky-400" /> Max Wind Speed</span>
                <span className="font-bold text-sky-400">{preferences.max_wind_mph} mph</span>
              </div>
              <input
                type="range"
                min={10}
                max={30}
                step={2}
                value={preferences.max_wind_mph}
                onChange={(e) => onChangePreferences({ ...preferences, max_wind_mph: parseFloat(e.target.value) })}
                className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-sky-500"
              />
              <p className="text-[10px] text-slate-400 mt-1">Avoid mowing in high winds that scatter lawn debris.</p>
            </div>
          </div>
        )}
      </div>

    </div>
  );
}
