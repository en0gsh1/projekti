// Ndihmës për hartën (Leaflet nga CDN + OpenStreetMap)
export const hasLeaflet = () => typeof window.L !== "undefined";

export const DAY_COLORS = ["#244aa5", "#d0a650", "#16a34a", "#dc2626", "#7c3aed", "#0891b2", "#ea580c"];
export const dayColor = (i) => DAY_COLORS[i % DAY_COLORS.length];

export function createMap(el, { center = [42.58, 20.9], zoom = 8 } = {}) {
  const map = L.map(el, { scrollWheelZoom: true }).setView(center, zoom);
  L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 18,
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
  }).addTo(map);
  return map;
}

// Pin me emoji; label = numri i ndalesës në plan (opsional)
export function pinIcon(d, label, color) {
  return L.divIcon({
    className: "pin",
    html: `<span class="pin-body" style="--pin:${color || d.colors[0]}"><span>${d.emoji}</span></span>${
      label ? `<span class="pin-label" style="--pin:${color}">${label}</span>` : ""
    }`,
    iconSize: [38, 38],
    iconAnchor: [19, 38],
    popupAnchor: [0, -36],
  });
}

export const mapFallback = (msg) => `<div class="map-fallback">🗺️ ${msg}</div>`;
