import React, { useState, useRef, useEffect } from 'react';
import { CalendarPlus, Download, ExternalLink, Check, ChevronDown } from 'lucide-react';
import {
  getGoogleCalendarUrl,
  getOutlookWebUrl,
  getYahooCalendarUrl,
  downloadIcsFile
} from '../utils/calendarExport';

export default function AddToCalendarButton({
  event,
  events,
  buttonLabel = "Add to Calendar",
  className = "",
  size = "normal" // "small" | "normal"
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const dropdownRef = useRef(null);

  // Close when clicking outside
  useEffect(() => {
    function handleClickOutside(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const singleEvent = event || (events && events[0]);
  const isMultiple = Boolean(events && events.length > 1);

  const handleGoogle = (e) => {
    e.stopPropagation();
    if (!singleEvent) return;
    window.open(getGoogleCalendarUrl(singleEvent), '_blank', 'noopener,noreferrer');
    setIsOpen(false);
  };

  const handleOutlook = (e) => {
    e.stopPropagation();
    if (!singleEvent) return;
    window.open(getOutlookWebUrl(singleEvent), '_blank', 'noopener,noreferrer');
    setIsOpen(false);
  };

  const handleYahoo = (e) => {
    e.stopPropagation();
    if (!singleEvent) return;
    window.open(getYahooCalendarUrl(singleEvent), '_blank', 'noopener,noreferrer');
    setIsOpen(false);
  };

  const handleIcs = (e) => {
    e.stopPropagation();
    const eventList = events || (event ? [event] : []);
    if (eventList.length === 0) return;
    const filename = isMultiple ? 'yardwork-schedule.ics' : `yardwork-mow-${singleEvent.dateStr}.ics`;
    downloadIcsFile(eventList, filename);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    setIsOpen(false);
  };

  const isSmall = size === "small";

  return (
    <div className={`relative inline-block text-left ${className}`} ref={dropdownRef}>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen(!isOpen);
        }}
        className={`inline-flex items-center gap-1.5 font-bold rounded-xl transition shadow-sm active:scale-95 ${
          isSmall
            ? 'px-2.5 py-1 text-xs bg-emerald-600 hover:bg-emerald-500 text-white'
            : 'px-3.5 py-2 text-xs sm:text-sm bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-900/30'
        }`}
      >
        <CalendarPlus className={isSmall ? "w-3.5 h-3.5" : "w-4 h-4"} />
        <span>{buttonLabel}</span>
        <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-56 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl z-50 overflow-hidden py-1.5 animate-fade-in text-xs">
          
          {/* Header */}
          <div className="px-3 py-1.5 text-[11px] font-semibold text-slate-400 border-b border-slate-800">
            {isMultiple ? `Export ${events.length} Scheduled Cuts` : 'Choose Calendar'}
          </div>

          {/* Google Calendar */}
          {!isMultiple && (
            <button
              type="button"
              onClick={handleGoogle}
              className="w-full text-left px-3.5 py-2 hover:bg-slate-800 text-slate-200 flex items-center justify-between transition"
            >
              <span className="flex items-center gap-2 font-medium">
                <span className="w-2 h-2 rounded-full bg-blue-500" />
                Google Calendar (Gmail)
              </span>
              <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
            </button>
          )}

          {/* Apple Calendar / iCal / Universal .ICS */}
          <button
            type="button"
            onClick={handleIcs}
            className="w-full text-left px-3.5 py-2 hover:bg-slate-800 text-slate-200 flex items-center justify-between transition"
          >
            <span className="flex items-center gap-2 font-medium">
              <span className="w-2 h-2 rounded-full bg-slate-300" />
              Apple Calendar / iCal
            </span>
            <Download className="w-3.5 h-3.5 text-slate-400" />
          </button>

          {/* Outlook Web */}
          {!isMultiple && (
            <button
              type="button"
              onClick={handleOutlook}
              className="w-full text-left px-3.5 py-2 hover:bg-slate-800 text-slate-200 flex items-center justify-between transition"
            >
              <span className="flex items-center gap-2 font-medium">
                <span className="w-2 h-2 rounded-full bg-sky-500" />
                Outlook Web / Office 365
              </span>
              <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
            </button>
          )}

          {/* Yahoo Calendar */}
          {!isMultiple && (
            <button
              type="button"
              onClick={handleYahoo}
              className="w-full text-left px-3.5 py-2 hover:bg-slate-800 text-slate-200 flex items-center justify-between transition"
            >
              <span className="flex items-center gap-2 font-medium">
                <span className="w-2 h-2 rounded-full bg-purple-500" />
                Yahoo Calendar
              </span>
              <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
            </button>
          )}

          {/* Universal .ICS file download */}
          <div className="border-t border-slate-800 mt-1 pt-1">
            <button
              type="button"
              onClick={handleIcs}
              className="w-full text-left px-3.5 py-2 hover:bg-slate-800 text-emerald-400 flex items-center justify-between transition font-semibold"
            >
              <span className="flex items-center gap-2">
                <Download className="w-3.5 h-3.5" />
                Download .ICS File
              </span>
              {copied && <Check className="w-3.5 h-3.5 text-emerald-400" />}
            </button>
          </div>

        </div>
      )}
    </div>
  );
}
