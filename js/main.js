import { state, update, subscribe } from "./store.js";
import { t } from "./i18n.js";
import { $, $$, toast } from "./utils.js";
import { planCount } from "./actions.js";
import explore from "./views/explore.js";
import detail from "./views/detail.js";
import mapView from "./views/map.js";
import plan from "./views/plan.js";

// Router i thjeshtë me hash: #/  #/map  #/plan  #/d/:id
const routes = [
  [/^#\/?$/, explore, "explore"],
  [/^#\/map$/, mapView, "map"],
  [/^#\/plan(?:\?(.*))?$/, plan, "plan"],
  [/^#\/d\/([\w-]+)$/, detail, "explore"],
];

let current = null;
let params = [];

function renderShell() {
  document.documentElement.lang = state.lang;
  document.documentElement.dataset.theme = state.theme;
  $("#navLinks").innerHTML = [
    ["#/", "🧭", t("nav.explore"), "explore"],
    ["#/map", "🗺️", t("nav.map"), "map"],
    ["#/plan", "🧳", t("nav.plan"), "plan"],
  ]
    .map(
      ([href, icon, label, key]) =>
        `<a href="${href}" data-nav="${key}"><span aria-hidden="true">${icon}</span> ${label}${
          key === "plan" && planCount() ? ` <span class="badge">${planCount()}</span>` : ""
        }</a>`
    )
    .join("");
  $("#langToggle").textContent = state.lang === "sq" ? "EN" : "SQ";
  $("#langToggle").title = t("nav.lang");
  $("#themeToggle").textContent = state.theme === "dark" ? "☀️" : "🌙";
  $("#themeToggle").title = t("nav.theme");
  $("#footer").textContent = t("footer.text");
  $(".logo-text").textContent = t("app.name");
}

function highlightNav(key) {
  $$("#navLinks a").forEach((a) => a.classList.toggle("active", a.dataset.nav === key));
}

// Çdo pamje merr një element të ri, kështu event listener-at e vjetër zhduken bashkë me të
function mount(view) {
  current?.destroy?.();
  current = view;
  const root = document.createElement("div");
  root.className = "view";
  $("#app").replaceChildren(root);
  document.title = t("app.name");
  view.render(root, params);
}

function route() {
  const hash = location.hash || "#/";
  for (const [re, view, nav] of routes) {
    const match = hash.match(re);
    if (match) {
      params = match.slice(1);
      mount(view);
      highlightNav(nav);
      window.scrollTo(0, 0);
      return;
    }
  }
  location.replace("#/");
}

subscribe(({ langChanged }) => {
  renderShell();
  highlightNav(routes.find(([, v]) => v === current)?.[2]);
  if (langChanged || !current.update) mount(current);
  else current.update();
});

$("#themeToggle").addEventListener("click", () => update((s) => (s.theme = s.theme === "dark" ? "light" : "dark")));
$("#langToggle").addEventListener("click", () => update((s) => (s.lang = s.lang === "sq" ? "en" : "sq")));
document.addEventListener("keydown", (e) => current?.onKey?.(e));
window.addEventListener("hashchange", route);
window.addEventListener("offline", () => toast(t("toast.offline")));

// Sinkronizo kur ndryshohet localStorage në një tab tjetër
window.addEventListener("storage", (e) => {
  if (e.key?.startsWith("kosova:") && !e.key.startsWith("kosova:weather")) location.reload();
});

renderShell();
route();

// PWA: punon edhe offline
if ("serviceWorker" in navigator && location.protocol.startsWith("http")) {
  navigator.serviceWorker.register("./sw.js").catch(() => {});
}
