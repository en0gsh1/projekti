import { DESTINATIONS, CATEGORY_KEYS, PRISHTINA } from "../data.js";
import { state } from "../store.js";
import { t, tl, fmtDate } from "../i18n.js";
import { $, esc, distanceKm, fmtKm, avgRating, starsHtml, debounce, toast } from "../utils.js";
import { isFav, isVisited, isInPlan, toggleFav, togglePlan, toggleVisited } from "../actions.js";

// Gjendja e filtrave mbetet kur kalon nga një faqe në tjetrën
const ui = { query: "", category: "all", sort: "default", origin: null };
let root;

function origin() {
  return ui.origin || PRISHTINA;
}

function visible() {
  const q = ui.query.toLowerCase();
  const month = new Date().getMonth() + 1;
  const list = DESTINATIONS.filter((d) => {
    if (ui.category === "fav" && !isFav(d.id)) return false;
    if (ui.category === "season" && !d.season.includes(month)) return false;
    if (CATEGORY_KEYS.includes(ui.category) && ui.category !== "all" && d.category !== ui.category) return false;
    return !q || [d.name, d.region, tl(d.desc)].join(" ").toLowerCase().includes(q);
  });

  const sorters = {
    name: (a, b) => a.name.localeCompare(b.name, "sq"),
    rating: (a, b) => avgRating(state.reviews[b.id]) - avgRating(state.reviews[a.id]),
    near: (a, b) => distanceKm(origin(), a) - distanceKm(origin(), b),
  };
  return sorters[ui.sort] ? [...list].sort(sorters[ui.sort]) : list;
}

function renderPassport() {
  const done = state.visited.length;
  const total = DESTINATIONS.length;
  const pct = Math.round((done / total) * 100);
  $("#passport", root).innerHTML = `
    <div class="passport-top">
      <span>🛂 ${t("passport.title")}</span>
      <strong>${done}/${total}</strong>
    </div>
    <div class="progress"><span style="width:${pct}%"></span></div>
    <small>${done === total ? t("passport.done") : done ? t("passport.progress", { pct }) : t("passport.start")}</small>`;
}

function renderFilters() {
  const keys = [...CATEGORY_KEYS, "season", "fav"];
  $("#filters", root).innerHTML = keys
    .map(
      (key) =>
        `<button class="chip ${ui.category === key ? "active" : ""}" data-cat="${key}" aria-pressed="${
          ui.category === key
        }">${t("cat." + key)}</button>`
    )
    .join("");
}

function card(d) {
  const reviews = state.reviews[d.id] || [];
  const avg = avgRating(reviews);
  const fav = isFav(d.id);
  const inPlan = isInPlan(d.id);
  const visited = isVisited(d.id);
  const km = distanceKm(origin(), d);
  return `
    <article class="card">
      <a class="card-img" href="#/d/${d.id}" style="--c1:${d.colors[0]};--c2:${d.colors[1]}" aria-label="${esc(d.name)}">
        <span class="card-emoji">${d.emoji}</span>
        ${visited ? `<span class="badge-visited">✓ ${t("card.visited")}</span>` : ""}
      </a>
      <button class="fav" data-fav="${d.id}" aria-pressed="${fav}" title="${t("card.fav")}">${fav ? "❤️" : "🤍"}</button>
      <div class="card-body">
        <h3><a href="#/d/${d.id}">${esc(d.name)}</a></h3>
        <span class="tag">${t("cat." + d.category)} · ${esc(d.region)}</span>
        <p>${esc(tl(d.desc))}</p>
        <div class="meta">
          <span>📍 ${fmtKm(km)} ${ui.origin ? t("card.fromYou") : t("card.fromPristina")}</span>
          <span>⏱ ${d.visitHours}h</span>
        </div>
        <div class="card-foot">
          <span>${avg ? `${starsHtml(avg)} <small class="muted">(${reviews.length})</small>` : `<small class="muted">${t("card.noReviews")}</small>`}</span>
          <span class="card-btns">
            <button class="btn-icon ${visited ? "on" : ""}" data-visit="${d.id}" title="${t("card.markVisited")}">🛂</button>
            <button class="btn ${inPlan ? "added" : ""}" data-plan="${d.id}">${inPlan ? "✓ " + t("card.inPlan") : "+ " + t("card.addPlan")}</button>
          </span>
        </div>
      </div>
    </article>`;
}

function renderGrid() {
  const list = visible();
  $("#count", root).textContent = `(${list.length})`;
  $("#grid", root).innerHTML = list.length
    ? list.map(card).join("")
    : `<div class="empty">${t("explore.empty")} 🤷</div>`;
}

function useLocation() {
  if (!navigator.geolocation) return toast(t("toast.noGeo"));
  navigator.geolocation.getCurrentPosition(
    (pos) => {
      ui.origin = { lat: pos.coords.latitude, lng: pos.coords.longitude };
      if (root?.isConnected) renderGrid();
    },
    () => toast(t("toast.noGeo")),
    { timeout: 8000 }
  );
}

export default {
  render(el) {
    root = el;
    const month = fmtDate(new Date(), "monthLong");
    el.innerHTML = `
      <section class="hero">
        <div class="hero-inner">
          <div>
            <h1>${t("hero.title")}</h1>
            <p>${t("hero.sub")}</p>
            <div class="hero-cta">
              <a class="btn btn-gold" href="#/map">🗺️ ${t("hero.map")}</a>
              <a class="btn btn-glass" href="#/plan">🧳 ${t("hero.plan")}</a>
            </div>
          </div>
          <div id="passport" class="passport"></div>
        </div>
      </section>
      <div class="container">
        <section class="toolbar surface">
          <div class="search-wrap">
            <input id="search" type="search" placeholder="${t("explore.search")}" value="${esc(ui.query)}" aria-label="${t("explore.search")}" />
            <kbd>/</kbd>
          </div>
          <select id="sort" aria-label="${t("sort.label")}">
            ${["default", "name", "rating", "near"]
              .map((k) => `<option value="${k}" ${ui.sort === k ? "selected" : ""}>${t("sort." + k)}</option>`)
              .join("")}
          </select>
          <div id="filters" class="filters"></div>
        </section>
        <p class="season-hint muted small">${t("explore.seasonHint", { month })}</p>
        <h2 class="section-title">${t("explore.title")} <span id="count" class="muted"></span></h2>
        <div id="grid" class="grid"></div>
      </div>`;

    $("#search", el).addEventListener(
      "input",
      debounce((e) => {
        ui.query = e.target.value.trim();
        renderGrid();
      }, 120)
    );

    $("#sort", el).addEventListener("change", (e) => {
      ui.sort = e.target.value;
      if (ui.sort === "near" && !ui.origin) useLocation();
      renderGrid();
    });

    el.addEventListener("click", (e) => {
      const btn = e.target.closest("button");
      if (!btn) return;
      const { cat, fav, plan, visit } = btn.dataset;
      if (cat) {
        ui.category = cat;
        renderFilters();
        renderGrid();
      } else if (fav) toggleFav(fav);
      else if (plan) togglePlan(plan);
      else if (visit) toggleVisited(visit);
    });

    this.update();
  },

  update() {
    renderPassport();
    renderFilters();
    renderGrid();
  },

  // Shkurtore "/" për kërkim
  onKey(e) {
    if (e.key === "/" && document.activeElement?.tagName !== "INPUT" && document.activeElement?.tagName !== "TEXTAREA") {
      e.preventDefault();
      $("#search", root)?.focus();
    }
  },
};
