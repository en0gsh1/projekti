export const $ = (sel, root = document) => root.querySelector(sel);
export const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

const ESC = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };
export const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ESC[c]);

// Distanca në vijë ajrore (Haversine), në km
export function distanceKm(a, b) {
  const R = 6371;
  const rad = (x) => (x * Math.PI) / 180;
  const dLat = rad(b.lat - a.lat);
  const dLng = rad(b.lng - a.lng);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

// Vlerësim i rrugës me makinë: rrugët janë ~35% më të gjata se vija ajrore, ~55 km/h mesatarisht
export const roadKm = (a, b) => distanceKm(a, b) * 1.35;
export const driveMinutes = (km) => (km / 55) * 60;

export function fmtDuration(minutes) {
  const m = Math.round(minutes);
  const h = Math.floor(m / 60);
  return h ? `${h}h ${String(m % 60).padStart(2, "0")}m` : `${m}m`;
}

export const fmtKm = (km) => (km < 10 ? km.toFixed(1) : Math.round(km)) + " km";

export function avgRating(list = []) {
  if (!list.length) return 0;
  return list.reduce((sum, r) => sum + r.rating, 0) / list.length;
}

export function starsHtml(value) {
  const full = Math.round(value);
  return `<span class="stars" aria-label="${value.toFixed(1)} / 5">${"★".repeat(full)}<span class="stars-off">${"★".repeat(5 - full)}</span></span>`;
}

export function debounce(fn, ms = 200) {
  let t;
  return (...args) => {
    clearTimeout(t);
    t = setTimeout(() => fn(...args), ms);
  };
}

export function toast(message) {
  let box = $("#toasts");
  if (!box) {
    box = document.createElement("div");
    box.id = "toasts";
    box.setAttribute("role", "status");
    document.body.append(box);
  }
  const el = document.createElement("div");
  el.className = "toast";
  el.textContent = message;
  box.append(el);
  setTimeout(() => el.classList.add("out"), 2400);
  setTimeout(() => el.remove(), 2800);
}

// base64 i sigurt për URL dhe për tekst me shkronja shqipe
export function encodeShare(obj) {
  const bytes = new TextEncoder().encode(JSON.stringify(obj));
  let bin = "";
  bytes.forEach((b) => (bin += String.fromCharCode(b)));
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

export function decodeShare(code) {
  try {
    const bin = atob(code.replace(/-/g, "+").replace(/_/g, "/"));
    const bytes = Uint8Array.from(bin, (c) => c.charCodeAt(0));
    return JSON.parse(new TextDecoder().decode(bytes));
  } catch {
    return null;
  }
}

export function download(filename, text) {
  const url = URL.createObjectURL(new Blob([text], { type: "application/json" }));
  const a = Object.assign(document.createElement("a"), { href: url, download: filename });
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
