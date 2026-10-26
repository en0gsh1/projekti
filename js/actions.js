// Veprimet e përbashkëta që përdoren nga disa pamje
import { byId } from "./data.js";
import { state, update, uid } from "./store.js";
import { t } from "./i18n.js";
import { toast } from "./utils.js";

export const isFav = (id) => state.favorites.includes(id);
export const isVisited = (id) => state.visited.includes(id);
export const isInPlan = (id) => state.trip.days.some((d) => d.stops.includes(id));
export const planCount = () => state.trip.days.reduce((n, d) => n + d.stops.length, 0);

function toggleIn(list, id) {
  const i = list.indexOf(id);
  i === -1 ? list.push(id) : list.splice(i, 1);
  return i === -1;
}

export function toggleFav(id) {
  let added;
  update((s) => (added = toggleIn(s.favorites, id)));
  toast(added ? t("toast.favAdded", { name: byId(id).name }) : t("toast.favRemoved"));
}

export function toggleVisited(id) {
  let added;
  update((s) => (added = toggleIn(s.visited, id)));
  if (added) toast(t("toast.visited", { name: byId(id).name }));
}

export function togglePlan(id) {
  const inPlan = isInPlan(id);
  update((s) => {
    if (inPlan) s.trip.days.forEach((d) => (d.stops = d.stops.filter((x) => x !== id)));
    else s.trip.days[s.trip.days.length - 1].stops.push(id);
  });
  toast(inPlan ? t("toast.planRemoved") : t("toast.planAdded", { name: byId(id).name, day: state.trip.days.length }));
}

export function addReview(id, { rating, text, name }) {
  update((s) => {
    (s.reviews[id] ||= []).unshift({ id: uid(), rating, text: text.slice(0, 1000), name: name.slice(0, 40), date: Date.now() });
  });
  toast(t("toast.reviewAdded"));
}

export function deleteReview(id, reviewId) {
  update((s) => {
    s.reviews[id] = (s.reviews[id] || []).filter((r) => r.id !== reviewId);
  });
}
