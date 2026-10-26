// "Databaza" e vogël mbi localStorage
const store = {
  get(key, fallback) {
    try {
      const value = localStorage.getItem("kosova:" + key);
      return value ? JSON.parse(value) : fallback;
    } catch {
      return fallback;
    }
  },
  set(key, value) {
    try {
      localStorage.setItem("kosova:" + key, JSON.stringify(value));
    } catch {
      /* localStorage mund të jetë i bllokuar – aplikacioni vazhdon të punojë */
    }
  },
};

const state = {
  query: "",
  category: "all",
  favorites: store.get("favorites", []),
  trip: store.get("trip", []),
  ratings: store.get("ratings", {}),
  theme: store.get("theme", "light"),
};

const $ = (sel) => document.querySelector(sel);
const byId = (id) => DESTINATIONS.find((d) => d.id === id);

function save() {
  store.set("favorites", state.favorites);
  store.set("trip", state.trip);
  store.set("ratings", state.ratings);
  store.set("theme", state.theme);
}

function toggle(list, id) {
  const i = list.indexOf(id);
  i === -1 ? list.push(id) : list.splice(i, 1);
}

const stars = (n) => "★".repeat(n) + "☆".repeat(5 - n);

// ---------- Render ----------
function renderFilters() {
  $("#filters").innerHTML = Object.entries(CATEGORIES)
    .map(
      ([key, label]) =>
        `<button class="chip ${state.category === key ? "active" : ""}" data-cat="${key}">${label}</button>`
    )
    .join("") +
    `<button class="chip ${state.category === "fav" ? "active" : ""}" data-cat="fav">❤️ Të preferuarat</button>`;
}

function visibleDestinations() {
  const q = state.query.toLowerCase();
  return DESTINATIONS.filter((d) => {
    if (state.category === "fav" && !state.favorites.includes(d.id)) return false;
    if (!["all", "fav"].includes(state.category) && d.category !== state.category) return false;
    return !q || (d.name + " " + d.region + " " + d.description).toLowerCase().includes(q);
  });
}

function renderGrid() {
  const list = visibleDestinations();
  $("#count").textContent = `(${list.length})`;

  if (!list.length) {
    $("#grid").innerHTML = `<div class="empty">Asnjë destinacion nuk u gjet 🤷</div>`;
    return;
  }

  $("#grid").innerHTML = list
    .map((d) => {
      const fav = state.favorites.includes(d.id);
      const inTrip = state.trip.includes(d.id);
      const rating = state.ratings[d.id] || 0;
      return `
      <article class="card">
        <div class="card-img" data-open="${d.id}"
             style="background:linear-gradient(135deg, ${d.colors[0]}, ${d.colors[1]})">
          ${d.emoji}
          <button class="fav" data-fav="${d.id}" title="Të preferuarat">${fav ? "❤️" : "🤍"}</button>
        </div>
        <div class="card-body">
          <h3>${d.name}</h3>
          <span class="tag">${CATEGORIES[d.category]} · ${d.region}</span>
          <p>${d.description}</p>
          <div class="card-foot">
            <span class="stars" title="Vlerësimi yt">${rating ? stars(rating) : '<span class="muted small">Pa vlerësim</span>'}</span>
            <button class="btn ${inTrip ? "added" : ""}" data-trip="${d.id}">
              ${inTrip ? "✓ Në plan" : "+ Plan"}
            </button>
          </div>
        </div>
      </article>`;
    })
    .join("");
}

function renderTrip() {
  $("#tripEmpty").hidden = state.trip.length > 0;
  $("#tripList").innerHTML = state.trip
    .map((id) => {
      const d = byId(id);
      return `<li><div class="trip-row"><span>${d.emoji} ${d.name}</span>
        <button data-remove="${id}" title="Hiq">✕</button></div></li>`;
    })
    .join("");
}

function renderTheme() {
  document.documentElement.dataset.theme = state.theme;
  $("#themeToggle").textContent = state.theme === "dark" ? "☀️" : "🌙";
}

function render() {
  renderFilters();
  renderGrid();
  renderTrip();
  renderTheme();
}

function openModal(id) {
  const d = byId(id);
  const rating = state.ratings[id] || 0;
  $("#modalBody").innerHTML = `
    <div class="modal-head" style="background:linear-gradient(135deg, ${d.colors[0]}, ${d.colors[1]})">
      ${d.emoji}<h2>${d.name}</h2>
    </div>
    <div class="modal-content">
      <span class="tag">${CATEGORIES[d.category]} · ${d.region}</span>
      <p>${d.description}</p>
      <strong>Këshilla:</strong>
      <ul>${d.tips.map((t) => `<li>${t}</li>`).join("")}</ul>
      <strong>Vlerësimi yt:</strong>
      <div class="rate">
        ${[1, 2, 3, 4, 5]
          .map((n) => `<button class="${n <= rating ? "on" : ""}" data-rate="${n}" data-id="${id}">★</button>`)
          .join("")}
      </div>
      <button class="btn" data-close>Mbyll</button>
    </div>`;
  $("#modal").showModal();
}

// ---------- Events ----------
$("#search").addEventListener("input", (e) => {
  state.query = e.target.value.trim();
  renderGrid();
});

$("#filters").addEventListener("click", (e) => {
  const cat = e.target.dataset.cat;
  if (!cat) return;
  state.category = cat;
  render();
});

$("#grid").addEventListener("click", (e) => {
  const { fav, trip, open } = e.target.dataset;
  if (fav) toggle(state.favorites, fav);
  else if (trip) toggle(state.trip, trip);
  else if (open) return openModal(open);
  else return;
  save();
  render();
});

$("#tripList").addEventListener("click", (e) => {
  const id = e.target.dataset.remove;
  if (!id) return;
  toggle(state.trip, id);
  save();
  render();
});

$("#clearTrip").addEventListener("click", () => {
  if (state.trip.length && confirm("Ta fshij gjithë planin?")) {
    state.trip = [];
    save();
    render();
  }
});

$("#modal").addEventListener("click", (e) => {
  const { rate, id } = e.target.dataset;
  if (rate) {
    state.ratings[id] = Number(rate);
    save();
    renderGrid();
    openModal(id);
  } else if ("close" in e.target.dataset || e.target === $("#modal")) {
    $("#modal").close();
  }
});

$("#themeToggle").addEventListener("click", () => {
  state.theme = state.theme === "dark" ? "light" : "dark";
  save();
  renderTheme();
});

const notes = $("#notes");
notes.value = store.get("notes", "");
notes.addEventListener("input", () => store.set("notes", notes.value));

render();
