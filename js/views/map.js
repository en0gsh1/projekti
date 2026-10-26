import { DESTINATIONS, byId } from "../data.js";
import { state } from "../store.js";
import { t, tl } from "../i18n.js";
import { $, esc } from "../utils.js";
import { isInPlan, togglePlan } from "../actions.js";
import { hasLeaflet, createMap, pinIcon, dayColor, mapFallback } from "../map.js";

let root, map, routeLayer;
const markers = new Map();

// Numri i ndalesës në plan për çdo destinacion: { id: { label, color } }
function planIndex() {
  const index = {};
  let n = 0;
  state.trip.days.forEach((day, i) => day.stops.forEach((id) => (index[id] = { label: ++n, color: dayColor(i) })));
  return index;
}

function popupHtml(d) {
  const inPlan = isInPlan(d.id);
  return `
    <div class="popup">
      <strong>${d.emoji} ${esc(d.name)}</strong>
      <small>${t("cat." + d.category)} · ${esc(d.region)}</small>
      <p>${esc(tl(d.desc))}</p>
      <div class="popup-btns">
        <a class="btn btn-ghost" href="#/d/${d.id}">${t("map.details")}</a>
        <button class="btn ${inPlan ? "added" : ""}" data-plan="${d.id}">${inPlan ? "✓ " + t("card.inPlan") : "+ " + t("card.addPlan")}</button>
      </div>
    </div>`;
}

function renderLegend() {
  const days = state.trip.days.filter((d) => d.stops.length);
  $("#legend", root).innerHTML = days.length
    ? days
        .map((day) => {
          const i = state.trip.days.indexOf(day);
          return `<li><span class="dot" style="background:${dayColor(i)}"></span>${esc(day.title) || t("plan.day", { n: i + 1 })} <small class="muted">(${day.stops.length})</small></li>`;
        })
        .join("")
    : `<li class="muted small">${t("map.noRoute")}</li>`;
}

function drawRoutes() {
  const index = planIndex();
  for (const [id, marker] of markers) {
    const p = index[id];
    marker.setIcon(pinIcon(byId(id), p?.label, p?.color));
    marker.setZIndexOffset(p ? 1000 : 0);
  }
  routeLayer.clearLayers();
  state.trip.days.forEach((day, i) => {
    if (day.stops.length < 2) return;
    L.polyline(day.stops.map((id) => [byId(id).lat, byId(id).lng]), {
      color: dayColor(i),
      weight: 4,
      opacity: 0.85,
      dashArray: "8 8",
    }).addTo(routeLayer);
  });
}

export default {
  render(el) {
    root = el;
    el.innerHTML = `
      <div class="map-page">
        <aside class="map-side surface">
          <h2>🗺️ ${t("map.title")}</h2>
          <p class="muted small">${t("map.hint")}</p>
          <h3>${t("map.routes")}</h3>
          <ul id="legend" class="legend"></ul>
          <h3>${t("map.places")}</h3>
          <ul class="place-list">
            ${DESTINATIONS.map((d) => `<li><button class="link-btn" data-fly="${d.id}">${d.emoji} ${esc(d.name)}</button></li>`).join("")}
          </ul>
        </aside>
        <div id="bigMap" class="big-map"></div>
      </div>`;

    if (!hasLeaflet()) {
      $("#bigMap", el).innerHTML = mapFallback(t("map.unavailable"));
      renderLegend();
      return;
    }

    map = createMap($("#bigMap", el));
    routeLayer = L.layerGroup().addTo(map);
    markers.clear();
    for (const d of DESTINATIONS) {
      const marker = L.marker([d.lat, d.lng], { icon: pinIcon(d), title: d.name })
        .bindPopup(() => popupHtml(d), { maxWidth: 260 })
        .addTo(map);
      markers.set(d.id, marker);
    }
    map.fitBounds(L.latLngBounds(DESTINATIONS.map((d) => [d.lat, d.lng])), { padding: [30, 30] });

    el.addEventListener("click", (e) => {
      const btn = e.target.closest("button");
      if (!btn) return;
      if (btn.dataset.plan) {
        const id = btn.dataset.plan;
        togglePlan(id);
        markers.get(id).setPopupContent(popupHtml(byId(id)));
      } else if (btn.dataset.fly) {
        const d = byId(btn.dataset.fly);
        map.flyTo([d.lat, d.lng], 12, { duration: 0.8 });
        markers.get(d.id).openPopup();
      }
    });

    this.update();
  },

  update() {
    renderLegend();
    if (map) drawRoutes();
  },

  destroy() {
    map?.remove();
    map = null;
    markers.clear();
  },
};
