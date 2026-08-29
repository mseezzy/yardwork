import React, { useState } from 'react';
import { Calendar, Filter, Sparkles } from 'lucide-react';
import DayCard from './DayCard';

export default function CalendarView({ days, tempUnit, onSelectDay, selectedDay }) {
  const [filterMode, setFilterMode] = useState('all'); // 'all' | 'scheduled' | 'good_only'

  const filteredDays = days.filter(d => {
    if (filterMode === 'scheduled') return d.is_scheduled_mow;
    if (filterMode === 'good_only') return d.status === 'OPTIMAL' || d.status === 'MARGINAL';
    return true;
  });

  return (
    <div className="space-y-4">
      
      {/* Calendar Bar & Legend */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-lg">
        
        {/* Title & Legend */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-emerald-400" />
            <h3 className="text-base font-bold text-white tracking-tight">
              Mowing Forecast Calendar
            </h3>
          </div>

          <div className="h-4 w-px bg-slate-800 hidden sm:block" />

          {/* Color Legend */}
          <div className="flex items-center gap-3 text-xs text-slate-300 font-medium">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-sm shadow-emerald-500/50" />
              <span>Good Day</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500 shadow-sm shadow-amber-500/50" />
              <span>Fair Day</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500 shadow-sm shadow-rose-500/50" />
              <span>Do Not Mow</span>
            </span>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 self-start sm:self-auto text-xs font-semibold">
          <button
            type="button"
            onClick={() => setFilterMode('all')}
            className={`px-3 py-1.5 rounded-lg transition ${
              filterMode === 'all'
                ? 'bg-slate-800 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            All Days ({days.length})
          </button>
          <button
            type="button"
            onClick={() => setFilterMode('scheduled')}
            className={`px-3 py-1.5 rounded-lg transition flex items-center gap-1 ${
              filterMode === 'scheduled'
                ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-900/40'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Sparkles className="w-3 h-3 text-emerald-300" />
            <span>Scheduled Only</span>
          </button>
          <button
            type="button"
            onClick={() => setFilterMode('good_only')}
            className={`px-3 py-1.5 rounded-lg transition ${
              filterMode === 'good_only'
                ? 'bg-slate-800 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Favorable Only
          </button>
        </div>

      </div>

      {/* Calendar Grid: Responsive from 1 to 7 columns */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-3.5">
        {filteredDays.map((day) => (
          <DayCard
            key={day.date}
            day={day}
            tempUnit={tempUnit}
            onSelect={onSelectDay}
            isSelected={selectedDay?.date === day.date}
          />
        ))}
      </div>

    </div>
  );
}
