import React from 'react';
import { Clock, Droplets, Wind, Sparkles, CheckCircle2, AlertTriangle, XCircle } from 'lucide-react';
import { WeatherIcon } from '../utils/weatherIcons';

export default function DayCard({ day, tempUnit, onSelect, isSelected }) {
  const feelsHigh = tempUnit === 'C' ? day.feels_like_high_c : day.feels_like_high_f;
  const feelsLow = tempUnit === 'C' ? day.feels_like_low_c : day.feels_like_low_f;

  // Status-specific themes
  const theme = {
    OPTIMAL: {
      border: "border-emerald-500/50 hover:border-emerald-400",
      bg: "bg-slate-900/90 hover:bg-slate-850",
      glow: "hover:shadow-emerald-950/40",
      badgeBg: "bg-emerald-950/90 text-emerald-300 border-emerald-700/60",
      badgeIcon: CheckCircle2,
      badgeText: "Good Day",
      dot: "bg-emerald-500",
      accentText: "text-emerald-400"
    },
    MARGINAL: {
      border: "border-amber-500/50 hover:border-amber-400",
      bg: "bg-slate-900/90 hover:bg-slate-850",
      glow: "hover:shadow-amber-950/40",
      badgeBg: "bg-amber-950/90 text-amber-300 border-amber-700/60",
      badgeIcon: AlertTriangle,
      badgeText: "Fair Day",
      dot: "bg-amber-500",
      accentText: "text-amber-400"
    },
    UNFAVORABLE: {
      border: "border-rose-500/40 hover:border-rose-400/70",
      bg: "bg-slate-900/75 hover:bg-slate-850/80 opacity-90",
      glow: "hover:shadow-rose-950/30",
      badgeBg: "bg-rose-950/90 text-rose-300 border-rose-800/60",
      badgeIcon: XCircle,
      badgeText: "Do Not Mow",
      dot: "bg-rose-500",
      accentText: "text-rose-400"
    }
  }[day.status] || {
    border: "border-slate-800",
    bg: "bg-slate-900",
    glow: "",
    badgeBg: "bg-slate-800 text-slate-300 border-slate-700",
    badgeIcon: AlertTriangle,
    badgeText: "Neutral",
    dot: "bg-slate-500",
    accentText: "text-slate-400"
  };

  const BadgeIcon = theme.badgeIcon;

  return (
    <div
      onClick={() => onSelect(day)}
      className={`relative cursor-pointer rounded-2xl p-4 border transition-all duration-200 shadow-md hover:shadow-xl flex flex-col justify-between group ${theme.border} ${theme.bg} ${theme.glow} ${
        isSelected ? 'ring-2 ring-emerald-400 scale-[1.02]' : ''
      }`}
    >
      {/* Top Banner: Scheduled Mow Pill & Status Pill */}
      <div>
        <div className="flex items-center justify-between gap-1.5 mb-2.5">
          {day.is_scheduled_mow ? (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-extrabold bg-gradient-to-r from-emerald-600 to-green-500 text-white shadow-sm ring-1 ring-white/20">
              <Sparkles className="w-3 h-3" />
              <span>Mow #{day.schedule_order}</span>
            </span>
          ) : (
            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${theme.badgeBg}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${theme.dot}`} />
              <span>{theme.badgeText}</span>
            </span>
          )}

          {/* Rain chance pill */}
          <span className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full ${
            day.max_rain_prob > 30 ? 'bg-rose-950/80 text-rose-300 border border-rose-800/50' : 'bg-slate-800/80 text-slate-300 border border-slate-700/50'
          }`}>
            <Droplets className="w-3 h-3 text-sky-400" />
            <span>{day.max_rain_prob}%</span>
          </span>
        </div>

        {/* Date & Day Name */}
        <div className="mb-2">
          <div className="text-sm font-bold text-white group-hover:text-emerald-300 transition flex items-center justify-between">
            <span>{day.day_of_week}</span>
            <span className="text-xs font-semibold text-slate-400">{day.formatted_date}</span>
          </div>
        </div>

        {/* Weather Icon & Condition */}
        <div className="flex items-center gap-3 my-3 p-2 rounded-xl bg-slate-950/60 border border-slate-800/60">
          <div className="p-1.5 bg-slate-900 rounded-lg shadow-inner">
            <WeatherIcon icon={day.dominant_weather_icon} className="w-7 h-7" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-xs font-semibold text-slate-200 truncate">
              {day.dominant_weather_description}
            </div>
            <div className="text-xs text-slate-400 mt-0.5 flex items-center gap-2">
              <span>Feels <strong className="text-slate-100 font-bold">{Math.round(feelsHigh)}°{tempUnit}</strong></span>
              <span className="text-slate-500">/</span>
              <span>{Math.round(feelsLow)}°{tempUnit}</span>
            </div>
          </div>
        </div>

        {/* Recommended Time Window Badge */}
        {day.peak_window ? (
          <div className={`text-xs font-semibold px-2.5 py-1.5 rounded-xl border flex items-center gap-1.5 ${
            day.status === 'OPTIMAL'
              ? 'bg-emerald-950/80 border-emerald-800/60 text-emerald-300'
              : 'bg-amber-950/80 border-amber-800/60 text-amber-300'
          }`}>
            <Clock className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">{day.peak_window.start_time} - {day.peak_window.end_time}</span>
          </div>
        ) : (
          <div className="text-xs text-rose-300 bg-rose-950/70 border border-rose-900/60 px-2.5 py-1.5 rounded-xl flex items-center gap-1.5">
            <XCircle className="w-3.5 h-3.5 shrink-0 text-rose-400" />
            <span className="truncate">{day.status_message}</span>
          </div>
        )}
      </div>

      {/* Footer / Drill Down prompt */}
      <div className="mt-3 pt-2.5 border-t border-slate-800/70 flex items-center justify-between text-[11px] text-slate-400 group-hover:text-slate-300">
        <span className="flex items-center gap-1">
          <Wind className="w-3 h-3 text-slate-400" /> {Math.round(day.max_wind_mph)} mph
        </span>
        <span className="font-semibold text-emerald-400 group-hover:underline">
          View Hourly →
        </span>
      </div>
    </div>
  );
}
