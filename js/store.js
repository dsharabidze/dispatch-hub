/* =========================================================
   store.js — მონაცემების ფენა (auto transport dispatch)
   პასუხისმგებელია: მომხმარებლები, სესია, ორდერები, ქალაქები.
   ყველაფერი localStorage-ში ინახება (backend არ გვაქვს).
   ========================================================= */

const SESSION_KEY = "dh_session";
const ORDERS_KEY = "dh_orders";

/* hardcoded მომხმარებლები — როლებით (admin / dispatcher) */
const USERS = [
  { username: "admin",  password: "admin123", role: "admin",      name: "ნინო ადმინი" },
  { username: "giorgi", password: "disp123",  role: "dispatcher", name: "გიორგი ბერიძე" },
  { username: "mariam", password: "disp123",  role: "dispatcher", name: "მარიამ კაპანაძე" },
];

/* რეალური US ქალაქები კოორდინატებით — აქედან ვითვლით მანძილს */
const CITIES = [
  { name: "Los Angeles",    state: "CA", lat: 34.05, lng: -118.24 },
  { name: "Phoenix",        state: "AZ", lat: 33.45, lng: -112.07 },
  { name: "Dallas",         state: "TX", lat: 32.78, lng: -96.80 },
  { name: "Houston",        state: "TX", lat: 29.76, lng: -95.37 },
  { name: "Atlanta",        state: "GA", lat: 33.75, lng: -84.39 },
  { name: "Chicago",        state: "IL", lat: 41.88, lng: -87.63 },
  { name: "Denver",         state: "CO", lat: 39.74, lng: -104.99 },
  { name: "Miami",          state: "FL", lat: 25.76, lng: -80.19 },
  { name: "New York",       state: "NY", lat: 40.71, lng: -74.01 },
  { name: "Seattle",        state: "WA", lat: 47.61, lng: -122.33 },
  { name: "Las Vegas",      state: "NV", lat: 36.17, lng: -115.14 },
  { name: "San Francisco",  state: "CA", lat: 37.77, lng: -122.42 },
  { name: "Boston",         state: "MA", lat: 42.36, lng: -71.06 },
  { name: "Nashville",      state: "TN", lat: 36.16, lng: -86.78 },
  { name: "Detroit",        state: "MI", lat: 42.33, lng: -83.05 },
  { name: "Charlotte",      state: "NC", lat: 35.23, lng: -80.84 },
  { name: "Portland",       state: "OR", lat: 45.52, lng: -122.68 },
  { name: "Minneapolis",    state: "MN", lat: 44.98, lng: -93.27 },
  { name: "Kansas City",    state: "MO", lat: 39.10, lng: -94.58 },
  { name: "Salt Lake City", state: "UT", lat: 40.76, lng: -111.89 },
];

const cityLabel = (c) => `${c.name}, ${c.state}`;

// ქალაქების სია წარწერებად (select-ისთვის)
export function getCityLabels() {
  return CITIES.map(cityLabel);
}

// haversine — დიდი წრის მანძილი მილებში ორ კოორდინატს შორის
function haversineMiles(a, b) {
  const R = 3959; // დედამიწის რადიუსი მილებში
  const toRad = (d) => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

// მანძილი ორ ქალაქის წარწერას შორის (გზის სიგრძის მიახლოება × 1.2)
export function distanceBetween(originLabel, destLabel) {
  const a = CITIES.find((c) => cityLabel(c) === originLabel);
  const b = CITIES.find((c) => cityLabel(c) === destLabel);
  if (!a || !b) return 0;
  return Math.round(haversineMiles(a, b) * 1.2);
}

/* საწყისი ორდერები — array of objects (აპლიკაციის მდგომარეობა).
   თითო ორდერს აქვს vehicles მასივი (ბევრმანქანიანი ტვირთი). */
function buildSeed() {
  const make = (origin, destination, rate, equipment, pickupDate, vehicles, status, takenBy) => ({
    origin, destination,
    distance: distanceBetween(origin, destination),
    rate, equipment, pickupDate, vehicles, status, takenBy,
  });
  return [
    { id: 1, ...make("Los Angeles, CA", "Phoenix, AZ", 850, "Open", "2026-06-20",
        [{ make: "Toyota", model: "Camry", year: 2021 }, { make: "Honda", model: "Civic", year: 2020 }],
        "available", "") },
    { id: 2, ...make("Dallas, TX", "Atlanta, GA", 1450, "Enclosed", "2026-06-21",
        [{ make: "BMW", model: "X5", year: 2022 }],
        "available", "") },
    { id: 3, ...make("Chicago, IL", "Denver, CO", 1650, "Open", "2026-06-22",
        [{ make: "Tesla", model: "Model 3", year: 2023 }, { make: "Nissan", model: "Altima", year: 2019 }, { make: "Kia", model: "Sportage", year: 2021 }],
        "taken", "გიორგი ბერიძე") },
    { id: 4, ...make("Miami, FL", "New York, NY", 1900, "Enclosed", "2026-06-18",
        [{ make: "Mercedes-Benz", model: "GLE", year: 2022 }],
        "delivered", "მარიამ კაპანაძე") },
  ];
}

/* ---- სესია / ავთენტიფიკაცია ---------------------------- */

export function login(username, password) {
  const user = USERS.find((u) => u.username === username && u.password === password);
  if (!user) return null;
  const session = { username: user.username, role: user.role, name: user.name };
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  return session;
}

export function getSession() {
  const raw = localStorage.getItem(SESSION_KEY);
  return raw ? JSON.parse(raw) : null;
}

export function logout() {
  localStorage.removeItem(SESSION_KEY);
}

export function requireAuth() {
  const session = getSession();
  if (!session) {
    window.location.href = "index.html";
    return null;
  }
  return session;
}

/* ---- ორდერების მდგომარეობა ----------------------------- */

export function getOrders() {
  const raw = localStorage.getItem(ORDERS_KEY);
  if (!raw) {
    const seed = buildSeed();
    saveOrders(seed);
    return seed;
  }
  return JSON.parse(raw);
}

export function saveOrders(orders) {
  localStorage.setItem(ORDERS_KEY, JSON.stringify(orders));
}

export function getOrder(id) {
  return getOrders().find((o) => o.id === Number(id)) || null;
}

export function addOrder(data) {
  const orders = getOrders();
  const nextId = orders.reduce((max, o) => Math.max(max, o.id), 0) + 1;
  const order = { id: nextId, status: "available", takenBy: "", ...data };
  orders.push(order);
  saveOrders(orders);
  return order;
}

export function updateOrder(id, patch) {
  const orders = getOrders();
  const idx = orders.findIndex((o) => o.id === Number(id));
  if (idx === -1) return null;
  orders[idx] = { ...orders[idx], ...patch };
  saveOrders(orders);
  return orders[idx];
}

export function removeOrder(id) {
  saveOrders(getOrders().filter((o) => o.id !== Number(id)));
}

// ორდერის აღება დისპეჩერის მიერ
export function takeOrder(id, dispatcherName) {
  return updateOrder(id, { status: "taken", takenBy: dispatcherName });
}

// ჩაბარება
export function deliverOrder(id) {
  return updateOrder(id, { status: "delivered" });
}

// კონკრეტული დისპეჩერის ორდერები
export function getMyOrders(dispatcherName) {
  return getOrders().filter((o) => o.takenBy === dispatcherName);
}

// ფლოტის/ორდერების განულება (ადმინი)
export function resetOrders() {
  localStorage.removeItem(ORDERS_KEY);
}
