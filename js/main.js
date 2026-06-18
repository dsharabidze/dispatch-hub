/* =========================================================
   main.js — entry point (<script type="module">)
   ერთადერთი ფაილი, რომელსაც HTML პირდაპირ ტვირთავს.
   body[data-page]-ის მიხედვით ვმართავთ თითოეულ გვერდს.
   ========================================================= */

import * as store from "./store.js";
import * as api from "./api.js";
import * as ui from "./ui.js";

/* ---- Closure #1: debounce ------------------------------
   timer ცვლადი "ცხოვრობს" დაბრუნებული ფუნქციის scope-ში. */
function debounce(fn, delay = 300) {
  let timer;
  return function (...args) {
    clearTimeout(timer);
    timer = setTimeout(() => fn.apply(this, args), delay);
  };
}

/* ---- Closure #2: პრივატული დამთვლელი -------------------
   count გარედან მიუწვდომელია — მხოლოდ increment() ცვლის.
   ვითვლით, რამდენი ორდერი აიღო მომხმარებელმა ამ სესიაში. */
function makeSessionCounter() {
  let count = 0;
  return {
    increment() { return ++count; },
    value() { return count; },
  };
}

/* როუტერი */
function init() {
  const page = document.body.dataset.page;
  if (page === "login") initLogin();
  if (page === "board") initBoard();
  if (page === "myorders") initMyOrders();
  if (page === "order") initOrder();
}

/* =========================================================
   LOGIN
   ========================================================= */
function initLogin() {
  if (store.getSession()) {
    window.location.href = "dashboard.html";
    return;
  }
  const form = document.getElementById("login-form");
  const errorBox = document.getElementById("login-error");

  // EVENT: submit
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    errorBox.textContent = "";
    if (!form.checkValidity()) {
      errorBox.textContent = "შეავსე ყველა ველი სწორად.";
      return;
    }
    const session = store.login(form.username.value.trim(), form.password.value);
    if (!session) {
      errorBox.textContent = "მომხმარებელი ან პაროლი არასწორია.";
      return;
    }
    window.location.href = "dashboard.html";
  });
}

/* ზედა ზოლი — ყველა შიდა გვერდზე საერთო */
function renderTopbar(session) {
  document.getElementById("user-name").textContent = session.name;
  const badge = document.getElementById("role-badge");
  badge.textContent = session.role === "admin" ? "ადმინი" : "დისპეჩერი";
  badge.classList.add(`role-badge--${session.role}`);

  const logoutBtn = document.getElementById("logout");
  if (logoutBtn) {
    // EVENT: click
    logoutBtn.addEventListener("click", () => {
      store.logout();
      window.location.href = "index.html";
    });
  }
}

/* =========================================================
   BOARD (dashboard) — ხელმისაწვდომი ორდერები
   ========================================================= */
function initBoard() {
  const session = store.requireAuth();
  if (!session) return;
  renderTopbar(session);

  const counter = makeSessionCounter();
  const listEl = document.getElementById("orders");
  const statsEl = document.getElementById("stats");
  const searchEl = document.getElementById("search");
  const filterEl = document.getElementById("status-filter");

  let query = "";
  let statusFilter = "all";

  function refresh() {
    let orders = store.getOrders();
    if (statusFilter !== "all") {
      orders = orders.filter((o) => o.status === statusFilter);
    }
    if (query) {
      const q = query.toLowerCase();
      orders = orders.filter((o) =>
        `${o.origin} ${o.destination} ${o.equipment}`.toLowerCase().includes(q)
      );
    }
    ui.renderOrders(orders, listEl, { onOpen: openOrder, emptyText: "ორდერი ვერ მოიძებნა." });
    ui.renderStats(store.getOrders(), statsEl);
  }

  function openOrder(id) {
    window.location.href = `order.html?id=${id}`;
  }

  // EVENT: input — ძიება debounce-ით
  searchEl.addEventListener("input", debounce((e) => {
    query = e.target.value.trim();
    refresh();
  }, 300));

  // EVENT: keydown — Esc ასუფთავებს ძიებას
  searchEl.addEventListener("keydown", (e) => {
    if (e.key === "Escape") { searchEl.value = ""; query = ""; refresh(); }
  });

  // EVENT: change — სტატუსის ფილტრი
  filterEl.addEventListener("change", (e) => {
    statusFilter = e.target.value;
    refresh();
  });

  setupCreateOrder(session, counter, refresh);
  refresh();
}

/* ახალი ორდერის შექმნა — მხოლოდ ადმინისთვის (role gating).
   იყენებს: ქალაქების select, NHTSA API მანქანებისთვის,
   haversine მანძილისთვის. */
function setupCreateOrder(session, counter, refresh) {
  const panel = document.getElementById("create-panel");

  // დისპეჩერი ამ პანელს ვერ ხედავს
  if (session.role !== "admin") {
    panel.remove();
    return;
  }

  const form = document.getElementById("create-form");
  const originSel = document.getElementById("o-origin");
  const destSel = document.getElementById("o-dest");
  const distanceOut = document.getElementById("o-distance");
  const makeSel = document.getElementById("o-make");
  const modelSel = document.getElementById("o-model");
  const yearInp = document.getElementById("o-year");
  const addVehBtn = document.getElementById("add-vehicle");
  const vehListEl = document.getElementById("load-list");
  const apiStatus = document.getElementById("api-status");
  const formError = document.getElementById("create-error");

  // მიმდინარე ტვირთის მანქანები (ფორმის შიდა მდგომარეობა)
  let loadVehicles = [];

  // ქალაქების select-ების შევსება
  const cities = store.getCityLabels();
  ui.fillSelect(originSel, cities, "— საიდან —");
  ui.fillSelect(destSel, cities, "— სად —");

  // მანძილის გადათვლა, როცა ორივე ქალაქი არჩეულია
  function updateDistance() {
    if (originSel.value && destSel.value) {
      const d = store.distanceBetween(originSel.value, destSel.value);
      distanceOut.textContent = d ? `≈ ${d} mi` : "—";
    } else {
      distanceOut.textContent = "—";
    }
  }
  // EVENT: change × 2
  originSel.addEventListener("change", updateDistance);
  destSel.addEventListener("change", updateDistance);

  // API #1 — მარკების ჩატვირთვა (loading + error)
  (async function loadMakes() {
    ui.showLoading(apiStatus, "მარკები იტვირთება…");
    try {
      const makes = await api.fetchCarMakes();
      ui.fillSelect(makeSel, makes, "— მარკა —");
      apiStatus.innerHTML = "";
    } catch (err) {
      ui.fillSelect(makeSel, [], "— ვერ ჩაიტვირთა —");
      ui.showError(apiStatus, "მარკების ჩატვირთვა ვერ მოხერხდა. შეამოწმე ინტერნეტი.");
    }
  })();

  // EVENT: change — მარკა → მოდელები (API #2)
  makeSel.addEventListener("change", async () => {
    ui.fillSelect(modelSel, [], "—");
    if (!makeSel.value) return;
    ui.showLoading(apiStatus, "მოდელები იტვირთება…");
    try {
      const models = await api.fetchModelsForMake(makeSel.value);
      ui.fillSelect(modelSel, models, "— მოდელი —");
      apiStatus.innerHTML = "";
    } catch (err) {
      ui.showError(apiStatus, "მოდელების ჩატვირთვა ვერ მოხერხდა.");
    }
  });

  // EVENT: click — მანქანის დამატება ტვირთში
  addVehBtn.addEventListener("click", () => {
    formError.textContent = "";
    const make = makeSel.value, model = modelSel.value, year = Number(yearInp.value);
    if (!make || !model || !year) {
      formError.textContent = "მანქანისთვის აირჩიე მარკა, მოდელი და წელი.";
      return;
    }
    loadVehicles.push({ make, model, year });
    ui.renderVehicleList(loadVehicles, vehListEl);
    modelSel.value = ""; yearInp.value = "";
  });

  // EVENT: submit — ორდერის შექმნა
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    formError.textContent = "";

    const origin = originSel.value, dest = destSel.value;
    if (!form.checkValidity() || !origin || !dest) {
      formError.textContent = "შეავსე მარშრუტი, ტექნიკა, თარიღი და ფასი.";
      return;
    }
    if (origin === dest) {
      formError.textContent = "საწყისი და დანიშნულების ქალაქი ერთი ვერ იქნება.";
      return;
    }
    if (loadVehicles.length === 0) {
      formError.textContent = "დაამატე მინიმუმ ერთი მანქანა ტვირთში.";
      return;
    }

    store.addOrder({
      origin,
      destination: dest,
      distance: store.distanceBetween(origin, dest),
      rate: Number(form.rate.value),
      equipment: form.equipment.value,
      pickupDate: form.pickup.value,
      vehicles: loadVehicles,
    });

    // reset
    loadVehicles = [];
    vehListEl.innerHTML = "";
    form.reset();
    distanceOut.textContent = "—";
    refresh();
    ui.showToast("ორდერი დაემატა.");
  });
}

/* =========================================================
   MY ORDERS — დისპეჩერის აღებული ორდერები
   ========================================================= */
function initMyOrders() {
  const session = store.requireAuth();
  if (!session) return;
  renderTopbar(session);

  const listEl = document.getElementById("orders");

  function refresh() {
    const mine = store.getMyOrders(session.name);
    ui.renderOrders(mine, listEl, {
      onOpen: (id) => (window.location.href = `order.html?id=${id}`),
      emptyText: "ჯერ არცერთი ორდერი არ აგიღია.",
    });
  }
  refresh();
}

/* =========================================================
   ORDER — დეტალის გვერდი
   ========================================================= */
function initOrder() {
  const session = store.requireAuth();
  if (!session) return;
  renderTopbar(session);

  const id = new URLSearchParams(window.location.search).get("id");
  const order = store.getOrder(id);
  const root = document.getElementById("detail");

  if (!order) {
    ui.showError(root, "ასეთი ორდერი ვერ მოიძებნა.");
    return;
  }
  renderOrderDetail(order, session);
}

function renderOrderDetail(order, session) {
  document.getElementById("detail-route").textContent =
    `${order.origin} → ${order.destination}`;
  document.getElementById("detail-rate").textContent = ui.money(order.rate);
  document.getElementById("detail-distance").textContent = `${order.distance} mi`;
  document.getElementById("detail-equipment").textContent =
    order.equipment === "Open" ? "ღია გადამზიდი" : "დახურული გადამზიდი";
  document.getElementById("detail-pickup").textContent = order.pickupDate || "—";

  const dot = document.getElementById("detail-dot");
  const statusText = document.getElementById("detail-status-text");
  const assignedText = document.getElementById("detail-assigned");

  function paint(o) {
    dot.className = `status-dot status-dot--${o.status}`;
    statusText.textContent = ui.statusLabel(o.status);
    assignedText.textContent = o.takenBy || "არავინ";
  }
  paint(order);

  // ტვირთის მანქანები
  ui.renderVehicleList(order.vehicles, document.getElementById("detail-vehicles"));

  const takeBtn = document.getElementById("take-order");
  const deliverBtn = document.getElementById("deliver-order");
  const deleteBtn = document.getElementById("delete-order");

  // ღილაკების ხილვადობა სტატუსისა და როლის მიხედვით
  function syncButtons(o) {
    takeBtn.hidden = o.status !== "available";
    deliverBtn.hidden = !(o.status === "taken" && o.takenBy === session.name);
  }
  syncButtons(order);

  // EVENT: click — აღება
  takeBtn.addEventListener("click", () => {
    const o = store.takeOrder(order.id, session.name);
    paint(o); syncButtons(o);
    ui.showToast("ორდერი აღებულია — იხილე ჩემი ორდერების გვერდი.");
  });

  // EVENT: click — ჩაბარება
  deliverBtn.addEventListener("click", () => {
    const o = store.deliverOrder(order.id);
    paint(o); syncButtons(o);
    ui.showToast("ორდერი ჩაბარდა.");
  });

  // role gating — წაშლა მხოლოდ ადმინს
  if (session.role === "admin") {
    deleteBtn.addEventListener("click", () => {
      if (confirm("წავშალო ეს ორდერი?")) {
        store.removeOrder(order.id);
        window.location.href = "dashboard.html";
      }
    });
  } else {
    deleteBtn.remove();
  }
}

init();
