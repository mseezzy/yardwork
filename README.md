# 🌿 YardWork: Smart Lawn Mowing Weather Planner

YardWork is a responsive, modern web application that tells you the best days and times to cut your grass over a 1-week, 2-week, or 1-month period based on hyper-local weather forecasts, your target mowing frequency, and ideal "feels like" temperature preferences.

---

## ✨ Features

- **Hyper-Local Address Search**: Real-time autocomplete search for any street address, city, state, or postal code worldwide with coordinates & timezone detection.
- **Custom Timeframes**: Choose 7-Day (1 Week), 14-Day (2 Weeks), or 30-Day (1 Month) forecast horizons.
- **Target Mowing Frequency**: Specify how many times you want to mow ($N$ mows) and let the spacing engine evenly distribute cuts across the best weather days.
- **"Feels Like" Temperature Preference**: Fine-tune your ideal apparent temperature comfort range with instant °F / °C toggle.
- **Inclement Weather Protection**: Automatically disqualifies hours with rain, drizzle, thunderstorms, snow, high wind, or wet/saturated soil from recent rainfall.
- **Color-Coded Calendar**:
  - 🟢 **Good Day (Optimal)**: Ideal temperatures, dry turf, and prime daylight cutting windows.
  - 🟡 **Fair Day (Marginal)**: Acceptable with minor compromises (e.g., warmer or slight breeze).
  - 🔴 **Do Not Mow (Unfavorable)**: Precipitation, storm risks, soaked lawn, or extreme heat/cold.
  - ⭐ **Scheduled Mow Badges**: Highlights the algorithm's chosen days to achieve your desired frequency.
- **Hourly Drill-Down**: Click any day to view the full 24h timeline, 0-100 mowing suitability scores, grass dryness status, and prime 2-hour window spotlight.
- **100% Free Weather API**: Powered by Open-Meteo (No API keys or credit card required).
- **Decoupled Architecture**: High-performance Python FastAPI backend + modern responsive React (Vite + Tailwind CSS) frontend.

---

## 🏗️ Architecture

```
yardwork/
├── backend/
│   ├── app/
│   │   ├── main.py                  # FastAPI server, endpoints, CORS
│   │   ├── config.py                # App configuration
│   │   ├── models/schemas.py        # Pydantic data schemas
│   │   ├── services/
│   │   │   ├── geocoding_service.py # Open-Meteo Geocoding
│   │   │   ├── weather_service.py   # Open-Meteo Hourly Weather Fetcher
│   │   │   └── scheduler_service.py # Mowing scoring & spacing optimization
│   │   └── utils/weather_codes.py   # WMO weather code interpretation
│   ├── requirements.txt
│   ├── Dockerfile
│   └── render.yaml                  # Free cloud hosting blueprint
│
├── frontend/
│   ├── src/
│   │   ├── App.jsx                  # Main application state & UI
│   │   ├── components/              # Header, CalendarView, DayCard, Modal, Location
│   │   ├── services/                # API client with direct Open-Meteo fallback
│   │   └── index.css                # Tailwind CSS styling & animations
│   ├── package.json
│   ├── vite.config.js
│   └── vercel.json                  # Free Vercel hosting configuration
│
└── docker-compose.yml
```

---

## 🚀 Quick Start (Local Development)

### 1. Frontend (React + Vite)
```bash
cd frontend
npm install
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser.

### 2. Backend (Python FastAPI)
```bash
cd backend
python -m venv venv
# On Windows: venv\Scripts\activate
# On macOS/Linux: source venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```
API Documentation will be live at [http://localhost:8000/docs](http://localhost:8000/docs).

### 3. Docker (Optional Full-Stack)
```bash
docker-compose up --build
```

---

## ☁️ 100% Free & Secure Cloud Hosting Guide

### Backend on Render.com (100% Free Web Service with HTTPS)
1. Push your repository to GitHub.
2. Sign up at [Render.com](https://render.com) (Free tier).
3. Click **New +** $\rightarrow$ **Web Service** $\rightarrow$ Connect your GitHub repo.
4. Set:
   - **Root Directory**: `backend`
   - **Runtime**: `Python 3`
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
   - **Instance Type**: `Free`
5. Click **Create Web Service**. Render provides a free `https://your-api.onrender.com` URL with free automatic SSL/TLS encryption.

### Frontend on Vercel (100% Free Edge Static Hosting with HTTPS)
1. Sign up at [Vercel.com](https://vercel.com).
2. Click **Add New Project** $\rightarrow$ Import your GitHub repo.
3. Set:
   - **Root Directory**: `frontend`
   - **Framework Preset**: `Vite`
   - **Environment Variables**: `VITE_API_URL` = `https://your-api.onrender.com`
4. Click **Deploy**. Vercel deploys globally with edge CDN, automatic HTTPS, and instant live updates on `git push`.

---

## 🧠 Scoring & Spacing Engine

- **Inclement Exclusion**: Any hour with precipitation $> 0.01$ in, rain probability $> 25\%$, or active storm/rain WMO codes is immediately disqualified (Score 0).
- **Wet Lawn Detection**: Analyzes cumulative rainfall over the prior 4 hours; wet grass receives a severe penalty to prevent lawn tearing and clumps.
- **Feels-Like Temperature**: Evaluates comfort against user bounds; temperatures outside range reduce score linearly, while extreme heat ($> 95^\circ\text{F}$) or cold ($< 45^\circ\text{F}$) disqualifies.
- **Prime Mowing Windows**: Mid-morning (9:00 - 11:30 AM) and late afternoon (4:30 - 7:30 PM) receive bonuses for evaporated morning dew and reduced thermal grass stress.
- **Combinatorial Spacing Optimization**: For $N$ requested mows over $D$ days, maximizes overall weather score while enforcing ideal intervals $\approx D / N$ days, preventing clustered or consecutive mowing days.
