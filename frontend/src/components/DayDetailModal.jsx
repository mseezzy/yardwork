import React, { useState } from 'react';
import { X, Clock, Droplets, Wind, Sun, AlertTriangle, CheckCircle2, XCircle, Sparkles, ShieldAlert } from 'lucide-react';
import { WeatherIcon } from '../utils/weatherIcons';

export default function DayDetailModal({ day, tempUnit, onClose }) {
  if (!day) return null;

  const [activeFilter, setActiveFilter] = useState('daylight'); // 'daylight' | 'all'

  const feelsHigh = tempUnit === 'C' ? day.feels_like_high_c : day.feels_like_high_f;
  const feelsLow = tempUnit === 'C' ? day.feels_like_low_c : day.feels_like_low_f;

  const displayedSlots = day.hourly_slots.filter(s => {
    if (activeFilter === 'daylight') return s.hour >= 7 && s.hour <= 20;
    return true;
  });

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 animate-fade-in">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-4xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Modal Header */}
        <div className="p-4 sm:p-6 border-b border-slate-800 flex items-start justify-between bg-slate-950/70">
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h2 className="text-xl sm:text-2xl font-extrabold text-white">
                {day.day_of_week}, {day.formatted_date}
              </h2>
              {day.is_scheduled_mow && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-extrabold bg-emerald-600 text-white shadow-sm ring-1 ring-white/20">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Scheduled Mow #{day.schedule_order}</span>
                </span>
              )}
              <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold border ${
                day.status === 'OPTIMAL'
                  ? 'bg-emerald-950/90 text-emerald-300 border-emerald-700'
                  : day.status === 'MARGINAL'
                  ? 'bg-amber-950/90 text-amber-300 border-amber-700'
                  : 'bg-rose-950/90 text-rose-300 border-rose-800'
              }`}>
                {day.status === 'OPTIMAL' && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />}
                {day.status === 'MARGINAL' && <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />}
                {day.status === 'UNFAVORABLE' && <XCircle className="w-3.5 h-3.5 text-rose-400" />}
                <span>{day.status_label}</span>
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-300 mt-1.5">
              {day.status_message}
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body / Scrollable Content */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-6 flex-1">
          
          {/* Key Weather Metrics Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-3">
              <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1 mb-1">
                <Sun className="w-3.5 h-3.5 text-amber-400" /> Feels Like High
              </div>
              <div className="text-xl font-bold text-white">
                {Math.round(feelsHigh)}°{tempUnit}
              </div>
              <div className="text-[11px] text-slate-400">Low: {Math.round(feelsLow)}°{tempUnit}</div>
            </div>

            <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-3">
              <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1 mb-1">
                <Droplets className="w-3.5 h-3.5 text-sky-400" /> Rain Chance
              </div>
              <div className="text-xl font-bold text-sky-400">
                {day.max_rain_prob}%
              </div>
              <div className="text-[11px] text-slate-400">Total: {day.total_rain_inches} in</div>
            </div>

            <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-3">
              <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1 mb-1">
                <Wind className="w-3.5 h-3.5 text-teal-400" /> Max Wind
              </div>
              <div className="text-xl font-bold text-white">
                {Math.round(day.max_wind_mph)} <span className="text-xs font-normal text-slate-400">mph</span>
              </div>
              <div className="text-[11px] text-slate-400">Safe for cutting</div>
            </div>

            <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-3">
              <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1 mb-1">
                <WeatherIcon icon={day.dominant_weather_icon} className="w-3.5 h-3.5" /> Condition
              </div>
              <div className="text-sm font-bold text-slate-100 truncate">
                {day.dominant_weather_description}
              </div>
              <div className="text-[11px] text-emerald-400">Overall Score: {day.overall_day_score}/100</div>
            </div>
          </div>

          {/* Prime Window Recommendation Spotlight Card */}
          {day.peak_window && (
            <div className="bg-gradient-to-r from-emerald-950/80 via-slate-900 to-slate-900 border border-emerald-500/40 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-lg">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-600/30 border border-emerald-500/50 flex items-center justify-center text-emerald-400 shrink-0">
                  <Clock className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs font-extrabold text-emerald-400 uppercase tracking-wider">
                    Recommended Best Time Window
                  </div>
                  <div className="text-base font-bold text-white">
                    {day.peak_window.start_time} – {day.peak_window.end_time} ({day.peak_window.time_label})
                  </div>
                  <div className="text-xs text-slate-300 mt-0.5">
                    {day.peak_window.reason}
                  </div>
                </div>
              </div>

              <div className="text-right sm:border-l sm:border-slate-800 sm:pl-4">
                <div className="text-xs text-slate-400">Comfort Score</div>
                <div className="text-xl font-black text-emerald-400">
                  {day.peak_window.avg_score}<span className="text-xs text-slate-400 font-normal">/100</span>
                </div>
              </div>
            </div>
          )}

          {/* Inclement weather alert warning */}
          {day.status === 'UNFAVORABLE' && (
            <div className="bg-rose-950/60 border border-rose-800/80 rounded-xl p-4 flex items-start gap-3 text-rose-200">
              <ShieldAlert className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-sm font-bold text-white">Mowing Not Recommended On This Day</h4>
                <p className="text-xs text-rose-300 mt-1">
                  Cutting grass during rain, wet turf, or extreme heat causes lawn tearing, clumping, engine stress, and uneven ruts. Wait for dry conditions.
                </p>
              </div>
            </div>
          )}

          {/* Hourly Timeline Breakdown */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Clock className="w-4 h-4 text-emerald-400" />
                <span>Hourly Suitability Breakdown</span>
              </h3>

              {/* Toggle daylight vs 24h */}
              <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800 text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => setActiveFilter('daylight')}
                  className={`px-2.5 py-1 rounded-md transition ${
                    activeFilter === 'daylight' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Daylight (7 AM - 8 PM)
                </button>
                <button
                  type="button"
                  onClick={() => setActiveFilter('all')}
                  className={`px-2.5 py-1 rounded-md transition ${
                    activeFilter === 'all' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  24 Hours
                </button>
              </div>
            </div>

            {/* Hourly Slot Rows */}
            <div className="space-y-2">
              {displayedSlots.map((slot) => {
                const hourFeels = tempUnit === 'C' ? slot.apparent_temperature_c : slot.apparent_temperature_f;
                const hour12 = slot.hour % 12 === 0 ? 12 : slot.hour % 12;
                const ampm = slot.hour >= 12 ? 'PM' : 'AM';
                const timeFormatted = `${hour12}:00 ${ampm}`;

                return (
                  <div
                    key={slot.time}
                    className={`rounded-xl p-3 border transition flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 ${
                      slot.is_recommended
                        ? 'bg-slate-950/80 border-emerald-500/30 hover:border-emerald-500/60'
                        : slot.mowing_score > 30
                        ? 'bg-slate-950/50 border-amber-500/30'
                        : 'bg-slate-950/30 border-slate-800/80 opacity-75'
                    }`}
                  >
                    {/* Time & Weather */}
                    <div className="flex items-center gap-3 min-w-[170px]">
                      <div className="p-1.5 bg-slate-900 rounded-lg">
                        <WeatherIcon icon={slot.weather_icon} className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="text-sm font-bold text-white">{timeFormatted}</div>
                        <div className="text-xs text-slate-400">{slot.weather_description}</div>
                      </div>
                    </div>

                    {/* Hourly Metrics */}
                    <div className="grid grid-cols-3 sm:flex sm:items-center gap-3 sm:gap-6 text-xs">
                      <div>
                        <span className="text-slate-400 block text-[10px] uppercase">Feels Like</span>
                        <span className="font-bold text-slate-200">{Math.round(hourFeels)}°{tempUnit}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px] uppercase">Rain %</span>
                        <span className={`font-bold ${slot.precipitation_probability > 25 ? 'text-rose-400' : 'text-slate-200'}`}>
                          {slot.precipitation_probability}%
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px] uppercase">Wind</span>
                        <span className="font-bold text-slate-200">{Math.round(slot.wind_speed_mph)} mph</span>
                      </div>
                    </div>

                    {/* Suitability Score Bar & Status */}
                    <div className="flex items-center gap-3 min-w-[200px] justify-between sm:justify-end">
                      {slot.disqualification_reason ? (
                        <span className="text-[11px] font-semibold text-rose-400 bg-rose-950/60 border border-rose-900/50 px-2 py-0.5 rounded-lg truncate max-w-[210px]" title={slot.disqualification_reason}>
                          {slot.disqualification_reason}
                        </span>
                      ) : (
                        <div className="flex items-center gap-2">
                          <div className="w-20 bg-slate-800 rounded-full h-2 overflow-hidden">
                            <div
                              className={`h-full rounded-full ${
                                slot.mowing_score >= 75 ? 'bg-emerald-500' : slot.mowing_score >= 50 ? 'bg-amber-500' : 'bg-slate-600'
                              }`}
                              style={{ width: `${slot.mowing_score}%` }}
                            />
                          </div>
                          <span className={`text-xs font-bold ${
                            slot.mowing_score >= 75 ? 'text-emerald-400' : slot.mowing_score >= 50 ? 'text-amber-400' : 'text-slate-400'
                          }`}>
                            {slot.mowing_score}/100
                          </span>
                        </div>
                      )}
                    </div>

                  </div>
                );
              })}
            </div>
          </div>

        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/80 flex items-center justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-sm font-semibold transition"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
}
