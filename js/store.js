// "Databaza" e vogël mbi localStorage + një state reaktiv shumë i thjeshtë
import { byId } from "./data.js";

const PREFIX = "kosova:";

export const storage = {
  get(key, fallback) {
    try {
      const value = localStorage.getItem(PREFIX + key);
      return value ? JSON.parse(value) : fallback;
    } catch {
      return fallback;
    }
  },
  set(key, value) {
    try {
      localStorage.setItem(PREFIX + key, JSON.stringify(value));
    } catch {
      /* localStorage mund të jetë i bllokuar ose plot – aplikacioni vazhdon */
    }
  },
  remove(key) {
    try {
      localStorage.removeItem(PREFIX + key);
    } catch {}
  },
};

export const uid = () => Math.random().toString(36).slice(2, 9);

export const newDay = () => ({ id: uid(), title: "", stops: [] });
export const emptyTrip = () => ({ startDate: "", notes: "", days: [newDay()] });

// Pastron një plan që vjen nga jashtë (import, link i ndarë, version i vjetër)
export function sanitizeTrip(raw) {
  if (!raw || !Array.isArray(raw.days)) return null;
  const seen = new Set();
  const days = raw.days.slice(0, 30).map((d) => ({
    id: typeof d.id === "string" ? d.id : uid(),
    title: typeof d.title === "string" ? d.title.slice(0, 60) : "",
    stops: (Array.isArray(d.stops) ? d.stops : []).filter((id) => byId(id) && !seen.has(id) && seen.add(id)),
  }));
  return {
    startDate: /^\d{4}-\d{2}-\d{2}$/.test(raw.startDate) ? raw.startDate : "",
    notes: typeof raw.notes === "string" ? raw.notes.slice(0, 5000) : "",
    days: days.length ? days : [newDay()],
  };
}

export function sanitizeReviews(raw) {
  if (!raw || typeof raw !== "object") return {};
  const out = {};
  for (const [id, list] of Object.entries(raw)) {
    if (!byId(id) || !Array.isArray(list)) continue;
    out[id] = list
      .filter((r) => r && Number(r.rating) >= 1 && Number(r.rating) <= 5)
      .slice(0, 200)
      .map((r) => ({
        id: typeof r.id === "string" ? r.id : uid(),
        rating: Math.round(Number(r.rating)),
        text: String(r.text || "").slice(0, 1000),
        name: String(r.name || "").slice(0, 40),
        date: Number(r.date) || Date.now(),
      }));
  }
  return out;
}

// Migrim nga versioni 1 (trip = [id], ratings = {id: n}, notes = "")
function loadTrip() {
  const trip = storage.get("trip", null);
  if (Array.isArray(trip)) {
    return sanitizeTrip({ days: [{ stops: trip }], notes: storage.get("notes", "") });
  }
  return sanitizeTrip(trip) || emptyTrip();
}

function loadReviews() {
  const reviews = storage.get("reviews", null);
  if (reviews) return sanitizeReviews(reviews);
  const old = storage.get("ratings", {});
  return Object.fromEntries(
    Object.entries(old).map(([id, rating]) => [id, [{ id: uid(), rating, text: "", name: "", date: Date.now() }]])
  );
}

const idList = (list) => (Array.isArray(list) ? [...new Set(list.filter(byId))] : []);

const prefersDark = typeof matchMedia === "function" && matchMedia("(prefers-color-scheme: dark)").matches;

export const state = {
  lang: storage.get("lang", "sq"),
  theme: storage.get("theme", prefersDark ? "dark" : "light"),
  favorites: idList(storage.get("favorites", [])),
  visited: idList(storage.get("visited", [])),
  reviews: loadReviews(),
  trip: loadTrip(),
};

function persist() {
  for (const key of ["lang", "theme", "favorites", "visited", "reviews", "trip"]) {
    storage.set(key, state[key]);
  }
  storage.remove("ratings");
  storage.remove("notes");
}
persist();

const listeners = new Set();
export const subscribe = (fn) => listeners.add(fn);

// Ndryshon state-in, e ruan dhe njofton pamjet. silent = ruaj pa ri-renderuar.
export function update(fn, { silent = false } = {}) {
  const prevLang = state.lang;
  fn(state);
  persist();
  if (!silent) listeners.forEach((l) => l({ langChanged: prevLang !== state.lang }));
}
