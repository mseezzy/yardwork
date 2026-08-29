import React from 'react';
import {
  Sun,
  CloudSun,
  Cloud,
  CloudRain,
  CloudDrizzle,
  CloudLightning,
  CloudSnow,
  CloudFog,
  Wind,
  Droplets
} from 'lucide-react';

export function WeatherIcon({ icon, className = "w-6 h-6", color }) {
  const props = { className, color };

  switch (icon) {
    case 'sunny':
      return <Sun {...props} className={`${className} text-amber-400`} />;
    case 'mostly-sunny':
    case 'partly-cloudy':
      return <CloudSun {...props} className={`${className} text-amber-300`} />;
    case 'cloudy':
      return <Cloud {...props} className={`${className} text-slate-400`} />;
    case 'fog':
      return <CloudFog {...props} className={`${className} text-slate-400`} />;
    case 'drizzle':
      return <CloudDrizzle {...props} className={`${className} text-sky-400`} />;
    case 'rain':
    case 'showers':
      return <CloudRain {...props} className={`${className} text-blue-400`} />;
    case 'heavy-rain':
      return <CloudRain {...props} className={`${className} text-blue-500`} />;
    case 'thunderstorm':
      return <CloudLightning {...props} className={`${className} text-purple-400`} />;
    case 'snow':
      return <CloudSnow {...props} className={`${className} text-indigo-200`} />;
    default:
      return <CloudSun {...props} className={`${className} text-amber-300`} />;
  }
}
