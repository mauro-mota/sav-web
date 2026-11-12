// Utilitários das demonstrações estáticas. Cada marca possui seu próprio armazenamento.
const $ = (selector) => document.querySelector(selector);
const money = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});
const brl = (cents) => money.format(cents / 100);
const uid = () =>
  globalThis.crypto?.randomUUID?.() ??
  String(Date.now()) + Math.random().toString(36).slice(2);
function isoDay(offset = 0) {
  const now = new Date();
  now.setDate(now.getDate() + offset);
  return [
    now.getFullYear(),
    String(now.getMonth() + 1).padStart(2, "0"),
    String(now.getDate()).padStart(2, "0"),
  ].join("-");
}
const niceDay = (iso) =>
  new Date(iso + "T12:00:00")
    .toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })
    .replace(" de ", " ");
function node(tag, text, className) {
  const el = document.createElement(tag);
  if (text !== undefined) el.textContent = text;
  if (className) el.className = className;
  return el;
}
function press(label, action, className) {
  const b = node("button", label, className);
  b.type = "button";
  b.addEventListener("click", action);
  return b;
}
function fillSelect(select, items, selected) {
  select.replaceChildren(...items.map(([id, name]) => new Option(name, id)));
  select.value = selected;
}
function openForm(dialog, values) {
  const form = dialog.querySelector("form");
  form.reset();
  for (const [key, value] of Object.entries(values))
    form.elements.namedItem(key).value = value;
  dialog.showModal();
  dialog.querySelector("h2").focus();
}
function formValues(form) {
  const result = Object.fromEntries(new FormData(form));
  for (const el of form.querySelectorAll("input[type=text], textarea")) {
    el.value = el.value.trim();
    if (!el.reportValidity()) return null;
    result[el.name] = el.value;
  }
  return result;
}
for (const dialog of document.querySelectorAll("dialog")) {
  dialog
    .querySelector("[data-close]")
    .addEventListener("click", () => dialog.close());
}
function localDesk(key, initial, render) {
  const storeKey = "portfolio-demo-" + key + "-1";
  function read() {
    try {
      const raw = localStorage.getItem(storeKey);
      if (raw) return JSON.parse(raw);
    } catch {
      /* A página também funciona com o armazenamento bloqueado. */
    }
    return { data: initial(), undo: null };
  }
  let saved = read();
  const notice = $("#notice"),
    status = notice.querySelector("span"),
    undo = notice.querySelector("button");
  function message(text) {
    status.textContent = text;
    undo.hidden = !saved.undo;
    notice.hidden = !text;
  }
  function commit(data, snapshot, text) {
    saved = { data, undo: snapshot };
    try {
      localStorage.setItem(storeKey, JSON.stringify(saved));
    } catch {
      text += " As alterações valem nesta aba.";
    }
    render();
    message(text);
  }
  undo.onclick = () => {
    if (saved.undo) commit(saved.undo, null, "Exclusão desfeita.");
  };
  window.addEventListener("storage", (e) => {
    if (e.key !== storeKey) return;
    document.querySelector("dialog[open]")?.close();
    saved = read();
    render();
    message("Dados atualizados em outra aba.");
  });
  if (saved.undo) message("Última exclusão disponível para desfazer.");
  return {
    get data() {
      return saved.data;
    },
    update(change, text, canUndo = false) {
      const next = structuredClone(saved.data);
      change(next);
      commit(next, canUndo ? saved.data : null, text);
    },
  };
}
