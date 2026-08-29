import React from 'react';
import { CalendarCheck, Clock, Sun, CheckCircle2, AlertTriangle, XCircle, Sparkles, ArrowRight, CalendarPlus } from 'lucide-react';
import { WeatherIcon } from '../utils/weatherIcons';
import AddToCalendarButton from './AddToCalendarButton';

export default function ScheduleSummary({ plan, tempUnit, onSelectDay }) {
  if (!plan || !plan.summary) return null;

  const { summary, calendar } = plan;
  const scheduledDays = calendar.filter(d => d.is_scheduled_mow);
  const nextMowDay = scheduledDays[0];

  // Prepare events for calendar export
  const allEvents = scheduledDays.map((day, idx) => {
    const feelsHigh = tempUnit === 'C' ? day.feels_like_high_c : day.feels_like_high_f;
    return {
      title: `🌿 Lawn Mowing #${day.schedule_order || idx + 1} - YardWork`,
      dateStr: day.date,
      startTime: day.peak_window?.start_time || "09:00",
      endTime: day.peak_window?.end_time || "11:00",
      description: `YardWork Scheduled Mowing #${day.schedule_order || idx + 1}:\n• Time: ${day.peak_window?.start_time || '09:00'} - ${day.peak_window?.end_time || '11:00'}\n• Weather: ${day.dominant_weather_description}\n• Feels Like: ${Math.round(feelsHigh)}°${tempUnit}\n• Rain Chance: ${day.max_rain_prob}%\n\nOptimized by YardWork: https://mseezzy.github.io/yardwork/`,
      location: "Home Lawn"
    };
  });

  return (
    <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-emerald-950/40 border border-emerald-500/30 rounded-2xl p-4 sm:p-6 shadow-2xl relative overflow-hidden">
      
      {/* Background ambient glow */}
      <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header & Outlook */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              <Sparkles className="w-4 h-4" />
            </span>
            <h2 className="text-lg font-bold text-white tracking-tight">
              Recommended Mowing Plan
            </h2>
          </div>
          <p className="text-xs text-slate-300 mt-1 font-medium">
            {summary.overall_outlook}
          </p>
        </div>

        {/* Action Controls & Condition Counts */}
        <div className="flex items-center gap-2 flex-wrap">
          {allEvents.length > 0 && (
            <AddToCalendarButton
              events={allEvents}
              buttonLabel="Add All to Calendar"
              size="normal"
            />
          )}

          <span className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-full text-xs font-semibold bg-emerald-950/90 text-emerald-300 border border-emerald-700/60 shadow-sm">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            {summary.good_days_count} Good
          </span>
          <span className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-full text-xs font-semibold bg-amber-950/90 text-amber-300 border border-amber-700/60 shadow-sm">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
            {summary.fair_days_count} Fair
          </span>
          <span className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-full text-xs font-semibold bg-rose-950/90 text-rose-300 border border-rose-700/60 shadow-sm">
            <XCircle className="w-3.5 h-3.5 text-rose-400" />
            {summary.bad_days_count} Bad
          </span>
        </div>
      </div>

      {/* Scheduled Mows Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {scheduledDays.map((day, idx) => {
          const feelsHigh = tempUnit === 'C' ? day.feels_like_high_c : day.feels_like_high_f;
          const feelsLow = tempUnit === 'C' ? day.feels_like_low_c : day.feels_like_low_f;

          return (
            <div
              key={day.date}
              onClick={() => onSelectDay(day)}
              className="group cursor-pointer bg-slate-900/90 hover:bg-slate-850 border border-emerald-500/40 hover:border-emerald-400 rounded-xl p-3.5 transition duration-200 shadow-lg hover:shadow-emerald-950/40 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="px-2 py-0.5 rounded-md text-[11px] font-extrabold bg-emerald-600 text-white shadow-sm">
                    Mow #{day.schedule_order || idx + 1}
                  </span>
                  <div className="flex items-center gap-1 text-xs text-slate-300">
                    <WeatherIcon icon={day.dominant_weather_icon} className="w-4 h-4" />
                    <span>{Math.round(feelsHigh)}°{tempUnit}</span>
                  </div>
                </div>

                <div className="text-sm font-bold text-white group-hover:text-emerald-300 transition">
                  {day.day_of_week}, {day.formatted_date}
                </div>

                {day.peak_window ? (
                  <div className="mt-1.5 flex items-center gap-1.5 text-xs text-emerald-400 font-semibold bg-emerald-950/70 border border-emerald-800/40 px-2 py-1 rounded-lg">
                    <Clock className="w-3.5 h-3.5 shrink-0" />
                    <span>{day.peak_window.start_time} - {day.peak_window.end_time} ({day.peak_window.time_label})</span>
                  </div>
                ) : (
                  <div className="mt-1.5 text-xs text-slate-400">
                    {day.status_message}
                  </div>
                )}
              </div>

              <div className="mt-3 pt-2.5 border-t border-slate-800/70 flex items-center justify-between text-xs text-slate-400">
                <span className="text-[11px]">Rain: <strong className="text-slate-200">{day.max_rain_prob}%</strong></span>
                
                <div className="flex items-center gap-2">
                  <AddToCalendarButton
                    size="small"
                    buttonLabel="Cal"
                    event={{
                      title: `🌿 Lawn Mowing #${day.schedule_order || idx + 1} - YardWork`,
                      dateStr: day.date,
                      startTime: day.peak_window?.start_time || "09:00",
                      endTime: day.peak_window?.end_time || "11:00",
                      description: `YardWork Scheduled Mowing #${day.schedule_order || idx + 1}:\n• Time: ${day.peak_window?.start_time || '09:00'} - ${day.peak_window?.end_time || '11:00'}\n• Weather: ${day.dominant_weather_description}\n• Feels Like: ${Math.round(feelsHigh)}°${tempUnit}\n• Rain Chance: ${day.max_rain_prob}%\n\nOptimized by YardWork: https://mseezzy.github.io/yardwork/`,
                      location: "Home Lawn"
                    }}
                  />
                  <span className="text-emerald-400 flex items-center gap-0.5 font-semibold text-[11px] hover:underline">
                    Drill Down <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition" />
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

    </div>
  );
}
