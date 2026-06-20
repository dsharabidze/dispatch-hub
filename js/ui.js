/* 
   ui.js — ხედის (View) ფენა
   DOM-ის დინამიური აგება და მომხმარებლის feedback.
    */

/* სტატუსის ქართული წარწერა */

export function statusLabel(status) {
  const map = {
    available: "ხელმისაწვდომი",
    taken: "აღებული",
    delivered: "ჩაბარებული",
  };
  return map[status] || status;
}

/* helper — ელემენტს ქმნის ატრიბუტებითა და ტექსტით */

function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

/* $-ის ფორმატი */

export function money(n) {
  return "$" + Number(n).toLocaleString("en-US");
}

/* ერთი ორდერის ბარათის აგება createElement-ით */

export function createOrderCard(order, { onOpen }) {
  const card = el("article", "card");

  // სათაური: მარშრუტი + სტატუსის ფარი

  const head = el("div", "card__head");
  const dot = el("span", `status-dot status-dot--${order.status}`);
  const title = el("h3", "card__title", `${order.origin} → ${order.destination}`);
  const statusText = el("span", "status-text", statusLabel(order.status));
  head.append(dot, title, statusText);

  // ფასი (monospace, თვალში საცემი)

  const rate = el("span", "card__rate", money(order.rate));

  // მეტა-ინფო

  const meta = el("p", "card__meta",
    `${order.distance} mi · ${order.equipment === "Open" ? "ღია" : "დახურული"} · ${order.vehicles.length} მანქანა`);

  if (order.takenBy) {
    meta.textContent += ` · ${order.takenBy}`;
  }

  // ფეხი — ღილაკი


  const foot = el("div", "card__foot");
  const openBtn = el("button", "btn btn--small", "დეტალები");
  openBtn.type = "button";

  // closure: handler "ახსოვს" კონკრეტული order.id

  openBtn.addEventListener("click", () => onOpen(order.id));
  foot.append(openBtn);

  card.append(head, rate, meta, foot);
  return card;
}


/* ორდერების სიის დარენდერება */



export function renderOrders(orders, container, opts) {
  container.innerHTML = "";
  if (orders.length === 0) {
    container.appendChild(renderEmpty(opts.emptyText || "ორდერი ვერ მოიძებნა."));
    return;
  }
  orders.forEach((order) => {
    container.appendChild(createOrderCard(order, opts));
  });
}



/* ცარიელი მდგომარეობა */

export function renderEmpty(message) {
  const wrap = el("div", "empty");
  const img = document.createElement("img");
  img.src = "assets/empty.svg";
  img.alt = "ცარიელი სია";
  wrap.append(img, el("p", null, message));
  return wrap;
}




/* სტატისტიკის რიცხვების განახლება */
export function renderStats(orders, root) {
  const count = (s) => orders.filter((o) => o.status === s).length;
  root.querySelector("[data-stat='total']").textContent = orders.length;
  root.querySelector("[data-stat='available']").textContent = count("available");
  root.querySelector("[data-stat='taken']").textContent = count("taken");
  root.querySelector("[data-stat='delivered']").textContent = count("delivered");
}



/* მანქანების სიის რენდერი ორდერში (createElement) */


export function renderVehicleList(vehicles, container) {
  container.innerHTML = "";
  vehicles.forEach((v) => {
    const chip = el("li", "vehicle-chip",
      `${v.make} ${v.model} (${v.year})`);
    container.appendChild(chip);
  });
}

/* ჩატვირთვის ინდიკატორი */

export function showLoading(container, message = "იტვირთება…") {
  container.innerHTML = "";
  const wrap = el("div", "loader");
  wrap.append(el("span", "spinner"), el("span", null, message));
  container.appendChild(wrap);
}

/* შეცდომის ბანერი */
export function showError(container, message) {
  container.innerHTML = "";
  container.appendChild(el("div", "banner banner--error", message));
}

/* წამიერი toast */

export function showToast(message) {
  let toast = document.querySelector(".toast");
  if (!toast) {
    toast = el("div", "toast");
    document.body.appendChild(toast);
  }
  toast.textContent = message;
  toast.classList.add("toast--show");
  clearTimeout(toast._timer);
  toast._timer = setTimeout(() => toast.classList.remove("toast--show"), 2200);
}

/* select-ის შევსება (createElement) */

export function fillSelect(select, items, placeholder) {
  select.innerHTML = "";
  const ph = el("option", null, placeholder);
  ph.value = "";
  select.appendChild(ph);
  items.forEach((item) => {
    const opt = el("option", null, item);
    opt.value = item;
    select.appendChild(opt);
  });
}
