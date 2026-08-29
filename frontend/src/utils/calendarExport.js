/**
 * Calendar Export Utilities for Google Calendar, Apple Calendar (iCal), Outlook, Yahoo, and universal .ICS
 */

/**
 * Format a Date object or ISO string to UTC iCal format: YYYYMMDDTHHmmssZ
 */
export function formatToIcsDate(dateStr, timeStr) {
  // dateStr is "YYYY-MM-DD", timeStr is "HH:00"
  const [year, month, day] = dateStr.split('-').map(Number);
  const [hours, minutes] = (timeStr || "09:00").split(':').map(Number);
  
  const d = new Date(year, month - 1, day, hours, minutes, 0);
  
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}T${pad(d.getHours())}${pad(d.getMinutes())}00`;
}

/**
 * Build Google Calendar URL
 */
export function getGoogleCalendarUrl({ title, dateStr, startTime, endTime, description, location }) {
  const start = formatToIcsDate(dateStr, startTime);
  const end = formatToIcsDate(dateStr, endTime || addHoursToTime(startTime, 2));

  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: title,
    dates: `${start}/${end}`,
    details: description,
    location: location || ''
  });

  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

/**
 * Build Outlook Web Calendar URL
 */
export function getOutlookWebUrl({ title, dateStr, startTime, endTime, description, location }) {
  const start = formatToIsoWithTime(dateStr, startTime);
  const end = formatToIsoWithTime(dateStr, endTime || addHoursToTime(startTime, 2));

  const params = new URLSearchParams({
    path: '/calendar/action/compose',
    rru: 'addevent',
    subject: title,
    startdt: start,
    enddt: end,
    body: description,
    location: location || ''
  });

  return `https://outlook.live.com/calendar/0/deeplink/compose?${params.toString()}`;
}

/**
 * Build Yahoo Calendar URL
 */
export function getYahooCalendarUrl({ title, dateStr, startTime, endTime, description, location }) {
  const start = formatToIcsDate(dateStr, startTime);
  const end = formatToIcsDate(dateStr, endTime || addHoursToTime(startTime, 2));

  const params = new URLSearchParams({
    v: '60',
    title: title,
    st: start,
    et: end,
    desc: description,
    in_loc: location || ''
  });

  return `https://calendar.yahoo.com/?${params.toString()}`;
}

/**
 * Generate .ICS file content for one or multiple events (compatible with iCal, Apple Calendar, Outlook, Thunderbird)
 */
export function generateIcsContent(events) {
  const eventList = Array.isArray(events) ? events : [events];
  
  const icsLines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//YardWork//Smart Lawn Mowing Planner//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH'
  ];

  const nowIcs = formatToIcsDate(new Date().toISOString().split('T')[0], '00:00');

  eventList.forEach((ev, idx) => {
    const start = formatToIcsDate(ev.dateStr, ev.startTime);
    const end = formatToIcsDate(ev.dateStr, ev.endTime || addHoursToTime(ev.startTime, 2));
    const uid = `yardwork-${ev.dateStr}-${idx}-${Date.now()}@yardwork.app`;

    icsLines.push('BEGIN:VEVENT');
    icsLines.push(`UID:${uid}`);
    icsLines.push(`DTSTAMP:${nowIcs}Z`);
    icsLines.push(`DTSTART:${start}`);
    icsLines.push(`DTEND:${end}`);
    icsLines.push(`SUMMARY:${escapeIcsText(ev.title)}`);
    icsLines.push(`DESCRIPTION:${escapeIcsText(ev.description)}`);
    if (ev.location) {
      icsLines.push(`LOCATION:${escapeIcsText(ev.location)}`);
    }
    icsLines.push('STATUS:CONFIRMED');
    icsLines.push('TRANSP:OPAQUE');
    icsLines.push('BEGIN:VALARM');
    icsLines.push('TRIGGER:-PT1H');
    icsLines.push('ACTION:DISPLAY');
    icsLines.push('DESCRIPTION:Reminder: Optimal lawn mowing window starts in 1 hour');
    icsLines.push('END:VALARM');
    icsLines.push('END:VEVENT');
  });

  icsLines.push('END:VCALENDAR');
  return icsLines.join('\r\n');
}

/**
 * Trigger download of .ICS file
 */
export function downloadIcsFile(events, filename = 'yardwork-mowing-schedule.ics') {
  const content = generateIcsContent(events);
  const blob = new Blob([content], { type: 'text/calendar;charset=utf-8' });
  const url = window.URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
}

function addHoursToTime(timeStr, hoursToAdd = 2) {
  const [h, m] = (timeStr || "09:00").split(':').map(Number);
  const newH = Math.min(23, h + hoursToAdd);
  return `${String(newH).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

function formatToIsoWithTime(dateStr, timeStr) {
  return `${dateStr}T${timeStr || '09:00'}:00`;
}

function escapeIcsText(text) {
  if (!text) return '';
  return text
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\n/g, '\\n');
}
