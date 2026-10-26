import { DESTINATIONS, PRISHTINA, byId } from "../data.js";
import { state } from "../store.js";
import { t, tl, fmtDate } from "../i18n.js";
import { $, esc, distanceKm, roadKm, driveMinutes, fmtKm, fmtDuration, avgRating, starsHtml } from "../utils.js";
import { isFav, isVisited, isInPlan, toggleFav, togglePlan, toggleVisited, addReview, deleteReview } from "../actions.js";
import { getWeather, weatherIcon } from "../weather.js";
import { hasLeaflet, createMap, pinIcon, mapFallback } from "../map.js";

let root, dest, map;


function renderActions() {
  const id = dest.id;
  $("#actions", root).innerHTML = `
    <button class="btn ${isInPlan(id) ? "added" : ""}" data-act="plan">${isInPlan(id) ? "✓ " + t("card.inPlan") : "+ " + t("card.addPlan")}</button>
    <button class="btn btn-ghost" data-act="fav">${isFav(id) ? "❤️ " + t("detail.saved") : "🤍 " + t("card.fav")}</button>
    <button class="btn btn-ghost ${isVisited(id) ? "on" : ""}" data-act="visit">🛂 ${isVisited(id) ? t("card.visited") : t("card.markVisited")}</button>
    <a class="btn btn-ghost" target="_blank" rel="noopener" href="https://www.google.com/maps/dir/?api=1&destination=${dest.lat},${dest.lng}">🧭 ${t("detail.directions")}</a>`;
}

function renderReviews() {
  const list = state.reviews[dest.id] || [];
  const avg = avgRating(list);
  $("#reviewsHead", root).innerHTML = list.length
    ? `${starsHtml(avg)} <strong>${avg.toFixed(1)}</strong> <span class="muted">· ${t("detail.reviewCount", { n: list.length })}</span>`
    : `<span class="muted">${t("detail.noReviews")}</span>`;

  $("#reviews", root).innerHTML = list
    .map(
      (r) => `
      <li class="review">
        <div class="review-top">
          <strong>${esc(r.name) || t("detail.anon")}</strong>
          ${starsHtml(r.rating)}
          <small class="muted">${fmtDate(new Date(r.date))}</small>
          <button class="link-btn" data-del="${r.id}" title="${t("detail.delete")}">✕</button>
        </div>
        ${r.text ? `<p>${esc(r.text)}</p>` : ""}
      </li>`
    )
    .join("");
}

async function renderWeather() {
  const box = $("#weather", root);
  try {
    const w = await getWeather(dest);
    if (!box.isConnected) return;
    const days = w.daily.time.map((day, i) => ({
      day: fmtDate(new Date(day + "T12:00"), "weekday"),
      icon: weatherIcon(w.daily.weather_code[i]),
      max: Math.round(w.daily.temperature_2m_max[i]),
      min: Math.round(w.daily.temperature_2m_min[i]),
    }));
    box.innerHTML = `
      <div class="weather-now">
        <span class="weather-icon">${weatherIcon(w.current.weather_code)}</span>
        <div><strong>${Math.round(w.current.temperature_2m)}°C</strong>
        <small class="muted">💨 ${Math.round(w.current.wind_speed_10m)} km/h</small></div>
      </div>
      <div class="forecast">
        ${days.map((d) => `<div><small>${d.day}</small><span>${d.icon}</span><small>${d.max}° / ${d.min}°</small></div>`).join("")}
      </div>`;
  } catch {
    if (box.isConnected) box.innerHTML = `<p class="muted small">${t("detail.weatherError")}</p>`;
  }
}

function renderMap() {
  const el = $("#miniMap", root);
  if (!hasLeaflet()) return (el.innerHTML = mapFallback(t("map.unavailable")));
  map = createMap(el, { center: [dest.lat, dest.lng], zoom: 11 });
  L.marker([dest.lat, dest.lng], { icon: pinIcon(dest) }).addTo(map);
}

function nearby() {
  return DESTINATIONS.filter((d) => d.id !== dest.id)
    .map((d) => ({ d, km: roadKm(dest, d) }))
    .sort((a, b) => a.km - b.km)
    .slice(0, 3);
}

export default {
  render(el, [id]) {
    root = el;
    dest = byId(id);
    if (!dest) {
      location.hash = "#/";
      return;
    }
    const d = dest;
    const months = d.season.length === 12
      ? t("detail.allYear")
      : d.season.map((m) => fmtDate(new Date(2024, m - 1, 1), "month")).join(", ");

    el.innerHTML = `
      <section class="detail-hero" style="--c1:${d.colors[0]};--c2:${d.colors[1]}">
        <div class="container">
          <a href="#/" class="back">← ${t("detail.back")}</a>
          <div class="detail-title">
            <span class="detail-emoji">${d.emoji}</span>
            <div>
              <span class="tag tag-light">${t("cat." + d.category)} · ${esc(d.region)}</span>
              <h1>${esc(d.name)}</h1>
            </div>
          </div>
          <div id="actions" class="actions"></div>
        </div>
      </section>

      <div class="container detail-grid">
        <div class="detail-main">
          <section class="surface pad">
            <p class="lead">${esc(tl(d.desc))}</p>
            <h3>💡 ${t("detail.tips")}</h3>
            <ul class="tips">${tl(d.tips).map((tip) => `<li>${esc(tip)}</li>`).join("")}</ul>
            <div class="facts">
              <div><small class="muted">${t("detail.visitTime")}</small><strong>⏱ ${d.visitHours}h</strong></div>
              <div><small class="muted">${t("detail.bestSeason")}</small><strong>📅 ${months}</strong></div>
              <div><small class="muted">${t("detail.fromPristina")}</small><strong>🚗 ${fmtKm(roadKm(d, PRISHTINA))}</strong></div>
            </div>
          </section>

          <section class="surface pad">
            <h3>⭐ ${t("detail.reviews")}</h3>
            <div id="reviewsHead" class="reviews-head"></div>
            <form id="reviewForm" class="review-form">
              <div class="rate" role="radiogroup" aria-label="${t("detail.yourRating")}">
                ${[5, 4, 3, 2, 1]
                  .map((n) => `<input type="radio" name="rating" id="r${n}" value="${n}" ${n === 5 ? "required" : ""}><label for="r${n}" title="${n}">★</label>`)
                  .join("")}
              </div>
              <input name="name" maxlength="40" placeholder="${t("detail.namePh")}" />
              <textarea name="text" rows="3" maxlength="1000" placeholder="${t("detail.textPh")}"></textarea>
              <button class="btn" type="submit">${t("detail.submit")}</button>
            </form>
            <ul id="reviews" class="reviews"></ul>
          </section>
        </div>

        <aside class="detail-side">
          <section class="surface pad">
            <h3>🌤️ ${t("detail.weather")}</h3>
            <div id="weather"><p class="muted small">${t("detail.loading")}</p></div>
          </section>
          <section class="surface">
            <div id="miniMap" class="mini-map"></div>
          </section>
          <section class="surface pad">
            <h3>📍 ${t("detail.nearby")}</h3>
            <ul class="nearby">
              ${nearby()
                .map(({ d: n, km }) => `<li><a href="#/d/${n.id}">${n.emoji} ${esc(n.name)}</a><small class="muted">${fmtKm(km)} · ${fmtDuration(driveMinutes(km))}</small></li>`)
                .join("")}
            </ul>
          </section>
        </aside>
      </div>`;

    el.addEventListener("click", (e) => {
      const btn = e.target.closest("button");
      if (!btn) return;
      const act = btn.dataset.act;
      if (act === "plan") togglePlan(d.id);
      else if (act === "fav") toggleFav(d.id);
      else if (act === "visit") toggleVisited(d.id);
      else if (btn.dataset.del && confirm(t("detail.confirmDelete"))) deleteReview(d.id, btn.dataset.del);
    });

    $("#reviewForm", el).addEventListener("submit", (e) => {
      e.preventDefault();
      const f = new FormData(e.target);
      addReview(d.id, {
        rating: Number(f.get("rating")),
        name: String(f.get("name") || "").trim(),
        text: String(f.get("text") || "").trim(),
      });
      e.target.reset();
    });

    document.title = `${d.name} · ${t("app.name")}`;
    this.update();
    renderWeather();
    renderMap();
  },

  update() {
    renderActions();
    renderReviews();
  },

  destroy() {
    map?.remove();
    map = null;
  },
};
