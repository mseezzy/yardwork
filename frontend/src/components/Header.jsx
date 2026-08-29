import React from 'react';
import { Scissors, Sparkles, Thermometer, ShieldCheck } from 'lucide-react';

export default function Header({ tempUnit, setTempUnit }) {
  return (
    <header className="border-b border-slate-800/80 bg-slate-950/70 backdrop-blur-md sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex items-center justify-between">
        
        {/* Brand Logo & Name */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-green-400 flex items-center justify-center shadow-lg shadow-emerald-900/30 ring-1 ring-white/20">
            <Scissors className="w-5 h-5 text-white transform -rotate-45" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-1.5">
                Yard<span className="text-emerald-400">Work</span>
              </h1>
              <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-950/80 text-emerald-300 border border-emerald-700/50">
                <Sparkles className="w-3 h-3 text-emerald-400" /> Smart Mowing
              </span>
            </div>
            <p className="text-xs text-slate-400 font-medium hidden xs:block">
              Hyper-local weather & mowing schedule optimizer
            </p>
          </div>
        </div>

        {/* Right Controls: Unit Toggle & Live Free API badge */}
        <div className="flex items-center gap-3">
          <div className="hidden md:flex items-center gap-1.5 px-3 py-1 rounded-lg bg-slate-800/60 border border-slate-700/50 text-xs text-slate-300">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Free Real-Time Forecast</span>
          </div>

          {/* Temperature Unit Toggle Button */}
          <button
            onClick={() => setTempUnit(tempUnit === 'F' ? 'C' : 'F')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700/80 border border-slate-700 text-sm font-semibold text-slate-200 transition shadow-sm active:scale-95"
            title="Toggle between Fahrenheit and Celsius"
          >
            <Thermometer className="w-4 h-4 text-emerald-400" />
            <span>°{tempUnit}</span>
          </button>
        </div>

      </div>
    </header>
  );
}
