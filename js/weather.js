// Moti live nga Open-Meteo (falas, pa API key), me cache 30 min në localStorage
import { storage } from "./store.js";

const TTL = 30 * 60 * 1000;

export async function getWeather(d) {
  const key = "weather:" + d.id;
  const cached = storage.get(key, null);
  if (cached && Date.now() - cached.t < TTL) return cached.data;

  const url =
    "https://api.open-meteo.com/v1/forecast" +
    `?latitude=${d.lat}&longitude=${d.lng}` +
    "&current=temperature_2m,weather_code,wind_speed_10m" +
    "&daily=weather_code,temperature_2m_max,temperature_2m_min&timezone=auto&forecast_days=4";

  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(res.status);
    const data = await res.json();
    storage.set(key, { t: Date.now(), data });
    return data;
  } catch (err) {
    if (cached) return cached.data; // offline: përdor të dhënat e vjetra
    throw err;
  }
}

// Kodet WMO → ikonë
export function weatherIcon(code) {
  if (code === 0) return "☀️";
  if (code <= 2) return "🌤️";
  if (code === 3) return "☁️";
  if (code <= 48) return "🌫️";
  if (code <= 57) return "🌦️";
  if (code <= 67) return "🌧️";
  if (code <= 77) return "❄️";
  if (code <= 82) return "🌧️";
  if (code <= 86) return "🌨️";
  return "⛈️";
}
