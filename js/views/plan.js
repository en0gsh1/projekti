import { DESTINATIONS, byId } from "../data.js";
import { state, update, newDay, emptyTrip, sanitizeTrip, sanitizeReviews } from "../store.js";
import { t, fmtDate } from "../i18n.js";
import { $, $$, esc, roadKm, driveMinutes, fmtKm, fmtDuration, toast, encodeShare, decodeShare, download } from "../utils.js";
import { isInPlan, isVisited, isFav, planCount } from "../actions.js";
import { dayColor } from "../map.js";

const LONG_DAY_MINUTES = 10 * 60;
let root, shared = null;


function dayDate(index) {
  if (!state.trip.startDate) return "";
  const date = new Date(state.trip.startDate + "T12:00");
  date.setDate(date.getDate() + index);
  return fmtDate(date, "dayMonth");
}

function dayStats(stops) {
  let km = 0;
  for (let i = 1; i < stops.length; i++) km += roadKm(byId(stops[i - 1]), byId(stops[i]));
  const drive = driveMinutes(km);
  const visit = stops.reduce((sum, id) => sum + byId(id).visitHours * 60, 0);
  return { km, drive, visit, total: drive + visit };
}

// Rruga më e shkurtër (fqinji më i afërt), ndalesa e parë mbetet e para
function optimize(stops) {
  if (stops.length < 3) return stops;
  const rest = stops.slice(1);
  const route = [stops[0]];
  while (rest.length) {
    const last = byId(route[route.length - 1]);
    let best = 0;
    rest.forEach((id, i) => {
      if (roadKm(last, byId(id)) < roadKm(last, byId(rest[best]))) best = i;
    });
    route.push(rest.splice(best, 1)[0]);
  }
  return route;
}

function renderSummary() {
  const stats = state.trip.days.map((d) => dayStats(d.stops));
  const km = stats.reduce((s, x) => s + x.km, 0);
  const drive = stats.reduce((s, x) => s + x.drive, 0);
  const stops = planCount();
  const visited = state.trip.days.flatMap((d) => d.stops).filter(isVisited).length;
  $("#summary", root).innerHTML = [
    ["📅", state.trip.days.length, t("plan.days")],
    ["📍", stops, t("plan.stops")],
    ["🚗", fmtKm(km), t("plan.distance")],
    ["⏱", fmtDuration(drive), t("plan.driving")],
    ["🛂", `${visited}/${stops}`, t("plan.visited")],
  ]
    .map(([icon, value, label]) => `<div class="stat surface"><span>${icon}</span><strong>${value}</strong><small class="muted">${label}</small></div>`)
    .join("");
}

function stopHtml(id, dayId, index, count) {
  const d = byId(id);
  return `
    <div class="stop" draggable="true" data-id="${id}" data-day="${dayId}" data-index="${index}">
      <span class="drag" aria-hidden="true">⋮⋮</span>
      <span class="num">${index + 1}</span>
      <a href="#/d/${id}" class="stop-name">${d.emoji} ${esc(d.name)}</a>
      <small class="muted">⏱ ${d.visitHours}h</small>
      ${isVisited(id) ? `<small title="${t("card.visited")}">✅</small>` : ""}
      <span class="stop-btns">
        <button data-act="up" ${index === 0 ? "disabled" : ""} aria-label="${t("plan.up")}">↑</button>
        <button data-act="down" ${index === count - 1 ? "disabled" : ""} aria-label="${t("plan.down")}">↓</button>
        <button data-act="move" aria-label="${t("plan.nextDay")}" title="${t("plan.nextDay")}">⇥</button>
        <button data-act="remove" aria-label="${t("plan.remove")}">✕</button>
      </span>
    </div>`;
}

function dayHtml(day, i) {
  const s = dayStats(day.stops);
  const legs = day.stops.map((id, j) => {
    const leg = j > 0 ? roadKm(byId(day.stops[j - 1]), byId(id)) : 0;
    return (j > 0 ? `<div class="leg">🚗 ${fmtKm(leg)} · ${fmtDuration(driveMinutes(leg))}</div>` : "") + stopHtml(id, day.id, j, day.stops.length);
  });
  return `
    <section class="day surface" data-day="${day.id}" style="--day:${dayColor(i)}">
      <header class="day-head">
        <span class="day-dot"></span>
        <input class="day-title" data-title="${day.id}" value="${esc(day.title)}" placeholder="${t("plan.day", { n: i + 1 })}" maxlength="60" aria-label="${t("plan.dayName")}" />
        <small class="muted">${dayDate(i)}</small>
        <button class="btn-icon" data-act="optimize" title="${t("plan.optimize")}" ${day.stops.length < 3 ? "disabled" : ""}>✨</button>
        <button class="btn-icon" data-act="remove-day" title="${t("plan.removeDay")}" ${state.trip.days.length === 1 ? "disabled" : ""}>🗑</button>
      </header>
      <div class="stops" data-drop="${day.id}">
        ${legs.join("") || `<div class="drop-hint">${t("plan.dropHint")}</div>`}
      </div>
      ${
        day.stops.length
          ? `<footer class="day-foot ${s.total > LONG_DAY_MINUTES ? "warn" : ""}">
              <span>🚗 ${fmtKm(s.km)} · ${fmtDuration(s.drive)}</span>
              <span>🏛 ${fmtDuration(s.visit)}</span>
              <strong>Σ ${fmtDuration(s.total)}</strong>
              ${s.total > LONG_DAY_MINUTES ? `<span class="warn-text">⚠️ ${t("plan.longDay")}</span>` : ""}
            </footer>`
          : ""
      }
    </section>`;
}

function renderDays() {
  $("#days", root).innerHTML = state.trip.days.map(dayHtml).join("");
}

function renderSuggest() {
  const notInPlan = DESTINATIONS.filter((d) => !isInPlan(d.id));
  const favs = notInPlan.filter((d) => isFav(d.id));
  const list = favs.length ? favs : notInPlan.slice(0, 6);
  $("#suggestTitle", root).textContent = favs.length ? t("plan.fromFavs") : t("plan.ideas");
  $("#suggest", root).innerHTML = list.length
    ? list.map((d) => `<button class="chip" data-add="${d.id}">+ ${d.emoji} ${esc(d.name)}</button>`).join("")
    : `<span class="muted small">${t("plan.allAdded")}</span>`;
}

function renderShared() {
  const box = $("#shared", root);
  if (!shared) return (box.innerHTML = "");
  const n = shared.days.reduce((s, d) => s + d.stops.length, 0);
  box.innerHTML = `
    <div class="banner">
      <span>🔗 ${t("plan.sharedFound", { days: shared.days.length, n })}</span>
      <button class="btn" data-act="accept-shared">${t("plan.replaceMine")}</button>
      <button class="btn btn-ghost" data-act="dismiss-shared">${t("plan.dismiss")}</button>
    </div>`;
}

// Zhvendos një ndalesë nga një ditë/pozicion në tjetrin
function moveStop(id, toDayId, toIndex) {
  update((s) => {
    const from = s.trip.days.find((d) => d.stops.includes(id));
    const to = s.trip.days.find((d) => d.id === toDayId);
    if (!from || !to) return;
    const fromIndex = from.stops.indexOf(id);
    from.stops.splice(fromIndex, 1);
    if (from === to && fromIndex < toIndex) toIndex--;
    to.stops.splice(Math.max(0, Math.min(toIndex, to.stops.length)), 0, id);
  });
}

function shareLink() {
  const { days, startDate } = state.trip;
  const code = encodeShare({ startDate, days: days.map(({ title, stops }) => ({ title, stops })) });
  return `${location.origin}${location.pathname}#/plan?share=${code}`;
}

async function copyShare() {
  const link = shareLink();
  try {
    await navigator.clipboard.writeText(link);
    toast(t("toast.linkCopied"));
  } catch {
    prompt(t("plan.copyThis"), link);
  }
}

function exportPlan() {
  const data = {
    app: "vizito-kosoven",
    version: 2,
    exportedAt: new Date().toISOString(),
    trip: state.trip,
    favorites: state.favorites,
    visited: state.visited,
    reviews: state.reviews,
  };
  download(`plani-kosova-${new Date().toISOString().slice(0, 10)}.json`, JSON.stringify(data, null, 2));
}

async function importPlan(file) {
  try {
    const data = JSON.parse(await file.text());
    const trip = sanitizeTrip(data.trip || data);
    if (!trip) throw new Error("invalid");
    if (!confirm(t("plan.confirmImport"))) return;
    update((s) => {
      s.trip = trip;
      if (Array.isArray(data.favorites)) s.favorites = data.favorites.filter(byId);
      if (Array.isArray(data.visited)) s.visited = data.visited.filter(byId);
      if (data.reviews) s.reviews = sanitizeReviews(data.reviews);
    });
    toast(t("toast.imported"));
  } catch {
    toast(t("toast.importError"));
  }
}

function bindDragAndDrop(el) {
  let dragged = null;

  el.addEventListener("dragstart", (e) => {
    const stop = e.target.closest(".stop");
    if (!stop) return;
    dragged = stop.dataset.id;
    stop.classList.add("dragging");
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", dragged);
  });

  el.addEventListener("dragend", () => {
    dragged = null;
    $$(".dragging, .drop-target", el).forEach((n) => n.classList.remove("dragging", "drop-target"));
  });

  el.addEventListener("dragover", (e) => {
    const zone = e.target.closest(".stops");
    if (!zone || !dragged) return;
    e.preventDefault();
    $$(".drop-target", el).forEach((n) => n !== zone && n.classList.remove("drop-target"));
    zone.classList.add("drop-target");
  });

  el.addEventListener("drop", (e) => {
    const zone = e.target.closest(".stops");
    if (!zone || !dragged) return;
    e.preventDefault();
    // Gjej pozicionin sipas lartësisë së miut
    const stops = $$(".stop", zone);
    let index = stops.length;
    for (let i = 0; i < stops.length; i++) {
      const box = stops[i].getBoundingClientRect();
      if (e.clientY < box.top + box.height / 2) {
        index = i;
        break;
      }
    }
    moveStop(dragged, zone.dataset.drop, index);
  });
}

export default {
  render(el, [query]) {
    root = el;
    const code = new URLSearchParams(query || "").get("share");
    shared = code ? sanitizeTrip(decodeShare(code)) : null;
    if (code && !shared) toast(t("toast.badLink"));

    el.innerHTML = `
      <div class="container plan-page">
        <header class="plan-head">
          <div>
            <h1>🧳 ${t("plan.title")}</h1>
            <p class="muted">${t("plan.sub")}</p>
          </div>
          <div class="plan-tools">
            <label class="date-label">📅 ${t("plan.start")}
              <input type="date" id="startDate" value="${state.trip.startDate}" />
            </label>
            <button class="btn" data-act="add-day">+ ${t("plan.addDay")}</button>
            <button class="btn btn-ghost" data-act="share">🔗 ${t("plan.share")}</button>
            <button class="btn btn-ghost" data-act="export">⬇ ${t("plan.export")}</button>
            <label class="btn btn-ghost">⬆ ${t("plan.import")}<input type="file" id="importFile" accept="application/json,.json" hidden /></label>
            <button class="btn btn-ghost" data-act="print">🖨 ${t("plan.print")}</button>
            <button class="btn btn-ghost danger" data-act="clear">🗑 ${t("plan.clear")}</button>
          </div>
        </header>
        <div id="shared"></div>
        <section id="summary" class="summary"></section>
        <div id="days" class="days"></div>
        <section class="plan-bottom">
          <div class="surface pad">
            <h3 id="suggestTitle"></h3>
            <div id="suggest" class="filters"></div>
          </div>
          <div class="surface pad">
            <h3>✍️ ${t("plan.notes")}</h3>
            <textarea id="notes" rows="5" placeholder="${t("plan.notesPh")}">${esc(state.trip.notes)}</textarea>
          </div>
        </section>
      </div>`;

    $("#startDate", el).addEventListener("change", (e) => update((s) => (s.trip.startDate = e.target.value)));
    $("#notes", el).addEventListener("input", (e) => update((s) => (s.trip.notes = e.target.value), { silent: true }));
    $("#importFile", el).addEventListener("change", (e) => {
      if (e.target.files[0]) importPlan(e.target.files[0]);
      e.target.value = "";
    });

    el.addEventListener("change", (e) => {
      const dayId = e.target.dataset.title;
      if (dayId) update((s) => (s.trip.days.find((d) => d.id === dayId).title = e.target.value.trim()));
    });

    el.addEventListener("click", (e) => {
      const btn = e.target.closest("button");
      if (!btn) return;
      const { act, add } = btn.dataset;
      const stop = btn.closest(".stop");
      const dayEl = btn.closest(".day");
      const dayIndex = dayEl ? state.trip.days.findIndex((d) => d.id === dayEl.dataset.day) : -1;

      if (add) {
        update((s) => s.trip.days[s.trip.days.length - 1].stops.push(add));
      } else if (stop) {
        const id = stop.dataset.id;
        const index = Number(stop.dataset.index);
        if (act === "up") moveStop(id, stop.dataset.day, index - 1);
        if (act === "down") moveStop(id, stop.dataset.day, index + 2);
        if (act === "remove") update((s) => (s.trip.days[dayIndex].stops = s.trip.days[dayIndex].stops.filter((x) => x !== id)));
        if (act === "move") {
          if (dayIndex === state.trip.days.length - 1) update((s) => s.trip.days.push(newDay()));
          moveStop(id, state.trip.days[dayIndex + 1].id, 0);
        }
      } else if (act === "optimize") {
        update((s) => (s.trip.days[dayIndex].stops = optimize(s.trip.days[dayIndex].stops)));
        toast(t("toast.optimized"));
      } else if (act === "remove-day") {
        const day = state.trip.days[dayIndex];
        if (day.stops.length && !confirm(t("plan.confirmRemoveDay"))) return;
        update((s) => s.trip.days.splice(dayIndex, 1));
      } else if (act === "add-day") {
        update((s) => s.trip.days.push(newDay()));
      } else if (act === "share") copyShare();
      else if (act === "export") exportPlan();
      else if (act === "print") window.print();
      else if (act === "clear") {
        if (planCount() && !confirm(t("plan.confirmClear"))) return;
        update((s) => (s.trip = { ...emptyTrip(), notes: s.trip.notes }));
      } else if (act === "accept-shared") {
        const incoming = shared;
        shared = null;
        history.replaceState(null, "", "#/plan");
        update((s) => (s.trip = { ...incoming, notes: s.trip.notes }));
        toast(t("toast.imported"));
      } else if (act === "dismiss-shared") {
        shared = null;
        history.replaceState(null, "", "#/plan");
        renderShared();
      }
    });

    bindDragAndDrop(el);
    this.update();
  },

  update() {
    renderShared();
    renderSummary();
    renderDays();
    renderSuggest();
    const date = $("#startDate", root);
    if (date && date.value !== state.trip.startDate) date.value = state.trip.startDate;
  },
};
