"use strict";

const $ = (selector) => document.querySelector(selector);
const storageKey = "grifo-imprensa-v1";
const stages = {
  planejar: "A abordar",
  enviada: "Pauta enviada",
  conversa: "Em conversa",
  publicada: "Publicado",
  recusada: "Sem interesse",
};
const active = (stage) => !["publicada", "recusada"].includes(stage);
const day = (offset = 0) => {
  const date = new Date();
  date.setDate(date.getDate() + offset);
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
  ].join("-");
};
const shortDate = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "short",
});
const displayDate = (iso) =>
  shortDate.format(new Date(iso + "T12:00:00")).replace(" de ", " ");
const normalize = (value) =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
const due = (contact) =>
  active(contact.stage) && contact.follow && contact.follow <= day();

function sample(id, name, outlet, stage, offset, notes, exclusive = "") {
  return {
    id,
    name,
    outlet,
    exclusive,
    stage,
    notes,
    email: "",
    url: "",
    follow: active(stage) && offset !== null ? day(offset) : "",
    published: stage === "publicada" ? day(offset) : "",
  };
}
function initialState() {
  const initial = {
    selected: "livro",
    campaigns: [
      {
        id: "livro",
        client: "Feira Paralela",
        headline: "O livro fora das grandes editoras",
        launch: day(6),
        contacts: [
          sample(
            "l1",
            "Lia Avelar",
            "Caderno Aberto",
            "conversa",
            0,
            "Pediu uma entrevista com duas editoras da feira.",
            day(1),
          ),
          sample(
            "l2",
            "Miguel Salles",
            "Rádio Mirante",
            "enviada",
            -1,
            "A produção fecha a agenda do programa às 16h.",
          ),
          sample(
            "l3",
            "Elisa Prado",
            "Revista Fólio",
            "publicada",
            -2,
            "Nota publicada na edição impressa de cultura.",
          ),
          sample(
            "l4",
            "Caio Brito",
            "Jornal da Esquina",
            "planejar",
            2,
            "Oferecer o recorte sobre livrarias de bairro.",
          ),
        ],
      },
      {
        id: "som",
        client: "Estúdio Rastro",
        headline: "Um arquivo sonoro da cidade",
        launch: day(13),
        contacts: [
          sample(
            "s1",
            "Iara Reis",
            "Frequência Local",
            "conversa",
            1,
            "Solicitou um trecho do arquivo para o programa.",
          ),
          sample(
            "s2",
            "Bento Nunes",
            "Revista Intervalo",
            "enviada",
            0,
            "Retomar a conversa após o fechamento da edição.",
          ),
        ],
      },
    ],
  };
  const [lia, miguel, elisa] = initial.campaigns[0].contacts;
  lia.history = [
    {
      id: "lia-pedido",
      date: day(-1),
      channel: "E-mail",
      summary:
        "Lia pediu uma conversa com a editora Olívia Nery antes da abertura da feira.",
    },
  ];
  lia.interviews = [
    {
      id: "lia-entrevista",
      start: day(1) + "T10:30",
      minutes: "30",
      medium: "Telefone",
      source: "Olívia Nery",
      place: "A redação liga para a editora.",
      status: "scheduled",
    },
  ];
  miguel.history = [
    {
      id: "miguel-envio",
      date: day(-3),
      channel: "E-mail",
      summary:
        "Enviei o release e uma sugestão de sonora para o programa da tarde.",
    },
  ];
  elisa.clips = [
    {
      id: "folio-nota",
      date: day(-2),
      title: "Editoras independentes ocupam a Feira Paralela",
      format: "Impresso",
      url: "",
    },
  ];
  return initial;
}
function load() {
  try {
    const raw = localStorage.getItem(storageKey);
    if (raw) {
      const saved = JSON.parse(raw);
      if (
        Array.isArray(saved.campaigns) &&
        saved.campaigns.every((p) => Array.isArray(p.contacts))
      )
        return saved;
    }
  } catch {
    /* A demonstração também funciona na memória. */
  }
  return initialState();
}
let state = load();
let filter = "all";
let lastDelete = state.lastDelete ?? null;
let editing = null;
const campaignForm = $("#campaign-form");
const contactForm = $("#contact-form");
const campaignDialog = $("#campaign-dialog");
const contactDialog = $("#contact-dialog");
const field = (form, name) => form.elements.namedItem(name);
const current = () => state.campaigns.find((p) => p.id === state.selected);
const exclusiveHolder = () =>
  current().contacts.find((c) => active(c.stage) && c.exclusive >= day());
function exclusiveText(c) {
  return "Exclusiva com " + c.outlet + " até " + displayDate(c.exclusive);
}
const newId = () =>
  crypto.randomUUID?.() ??
  Date.now().toString(36) + Math.random().toString(36).slice(2);
for (const [value, label] of Object.entries(stages))
  field(contactForm, "stage").add(new Option(label, value));

function showNotice(text = "") {
  $("#message").textContent = text;
  $("#undo").hidden = !lastDelete;
  $("#notice").hidden = !text;
}
function save(text) {
  state.lastDelete = lastDelete;
  try {
    localStorage.setItem(storageKey, JSON.stringify(state));
  } catch {
    text += " As alterações valem nesta aba.";
  }
  render();
  showNotice(text);
}
function resetView() {
  filter = "all";
  $("#search").value = "";
}
function contactRow(contact) {
  const item = document.createElement("li");
  const button = document.createElement("button");
  button.type = "button";
  button.className = "contact-row";
  button.dataset.id = contact.id;
  const person = document.createElement("span");
  person.className = "person";
  const name = document.createElement("strong");
  name.textContent = contact.name;
  const outlet = document.createElement("small");
  outlet.textContent = contact.outlet;
  person.append(name, outlet);
  const stage = document.createElement("span");
  stage.className = "stage";
  stage.dataset.stage = contact.stage;
  stage.textContent = stages[contact.stage];
  const when = document.createElement("span");
  when.className = "when";
  if (active(contact.stage) && contact.follow) {
    when.textContent =
      contact.follow === day() ? "Hoje" : displayDate(contact.follow);
    if (contact.follow < day()) when.textContent += " · vencido";
    if (due(contact)) when.dataset.urgency = "due";
  } else {
    when.textContent = "—";
    when.dataset.dash = "";
  }
  const arrow = document.createElement("span");
  arrow.className = "arrow";
  arrow.textContent = filter === "due" ? "Anotar" : "Ficha";
  arrow.setAttribute("aria-hidden", "true");
  button.append(person, stage, when, arrow);
  button.title =
    (filter === "due" ? "Registrar conversa com " : "Abrir ficha de ") +
    contact.name;
  item.append(button);
  return item;
}
function renderList() {
  const list = current().contacts;
  const meetings = list
    .flatMap((contact) =>
      contact.interviews
        .filter((i) => i.status === "scheduled")
        .map((record) => ({ contact, record })),
    )
    .sort((a, b) => a.record.start.localeCompare(b.record.start));
  const next = meetings.find(
    ({ record }) => new Date(record.start) >= new Date(),
  );
  const shortcut = $("#next-interview");
  shortcut.hidden = !next || filter === "agenda";
  if (next) {
    shortcut.querySelector("strong").textContent =
      next.record.source + " · " + next.contact.outlet;
    shortcut.querySelector(".slot").textContent =
      dateLabel(next.record.start) +
      " · " +
      next.record.start.slice(11, 16) +
      " ›";
    shortcut.onclick = () =>
      openEntry("interviews", next.contact, next.record.id);
  }
  const clips = list
    .flatMap((contact) => contact.clips.map((record) => ({ contact, record })))
    .sort((a, b) => b.record.date.localeCompare(a.record.date));
  const returns = list
    .filter(due)
    .sort((a, b) => a.follow.localeCompare(b.follow));
  const counts = {
    all: list.length,
    due: returns.length,
    agenda: meetings.length,
    published: clips.length,
  };
  for (const button of $("#filters").children) {
    button.setAttribute(
      "aria-pressed",
      String(filter === button.dataset.filter),
    );
    button.querySelector("span").textContent = counts[button.dataset.filter];
  }
  const isAgenda = filter === "agenda",
    isClipping = filter === "published";
  const query = normalize($("#search").value);
  const matches = (...parts) => normalize(parts.join(" ")).includes(query);
  let rows;
  if (isAgenda || isClipping) {
    rows = (isAgenda ? meetings : clips)
      .filter(({ contact, record }) =>
        matches(contact.name, contact.outlet, record.source ?? record.title),
      )
      .map(({ contact, record }) =>
        deskRow(contact, isAgenda ? "interviews" : "clips", record),
      );
  } else {
    rows = (filter === "due" ? returns : list)
      .filter((c) => matches(c.name, c.outlet))
      .map(contactRow);
  }
  $(".columns").hidden = isAgenda || isClipping;
  $("#contacts").replaceChildren(...rows);
  $("#filter-note").hidden = filter !== "due";
  $("#filter-note").textContent =
    "Retornos de hoje e em atraso, por ordem de prazo.";
  const search = isAgenda
    ? "Buscar jornalista, veículo ou porta-voz"
    : isClipping
      ? "Buscar matéria, jornalista ou veículo"
      : "Buscar nome ou veículo";
  $("#search").placeholder = search;
  $("#search").setAttribute("aria-label", search);
  $("#new-contact").textContent = !list.length
    ? "+ Contato"
    : isAgenda
      ? "+ Entrevista"
      : isClipping
        ? "+ Matéria"
        : "+ Contato";
  $("#empty-list").hidden = rows.length > 0;
  $("#empty-list").textContent = query
    ? "Nenhum resultado para esta busca."
    : {
        all: "Adicione o primeiro contato desta pauta.",
        due: "Nenhum retorno pendente para hoje.",
        agenda: "Nenhuma entrevista agendada para esta pauta.",
        published: "Nenhuma matéria registrada nesta pauta.",
      }[filter];
}
function render() {
  if (!current()) state.selected = state.campaigns[0]?.id ?? "";
  const p = current();
  $("#campaign").replaceChildren(
    ...state.campaigns.map((c) => new Option(c.headline, c.id)),
  );
  $("#campaign").value = state.selected;
  $("#campaign").hidden = !p;
  $("#campaign-view").hidden = !p;
  $("#empty-campaigns").hidden = Boolean(p);
  if (!p) return;
  $("#client").textContent = p.client;
  $("#headline").textContent = p.headline;
  const holder = exclusiveHolder();
  $("#exclusive-summary").hidden = !holder;
  $("#exclusive-summary").textContent = holder ? exclusiveText(holder) : "";
  $("#launch").textContent = p.launch ? displayDate(p.launch) : "A definir";
  if (p.launch) $("#launch").dateTime = p.launch;
  else $("#launch").removeAttribute("datetime");
  for (const contact of p.contacts) prepareContact(contact);
  renderList();
}
function openCampaign(p) {
  editing = p?.id ?? null;
  campaignForm.reset();
  clearValidity(campaignForm);
  for (const key of ["headline", "client", "launch"])
    field(campaignForm, key).value = p?.[key] ?? "";
  $("#campaign-heading").textContent = p ? "Editar pauta" : "Nova pauta";
  $("#delete-campaign").hidden = $("#remove-hint").hidden = !p;
  campaignDialog.showModal();
  (p ? $("#campaign-heading") : field(campaignForm, "headline")).focus();
}
function updateFields() {
  const stage = field(contactForm, "stage").value;
  $("#follow-field").hidden = !active(stage);
  field(contactForm, "follow").disabled = !active(stage);
  const holder = exclusiveHolder();
  const heldByOther = holder && holder.id !== editing;
  const exclusive = field(contactForm, "exclusive");
  $("#exclusive-options").hidden = !active(stage);
  exclusive.disabled = !active(stage) || Boolean(heldByOther);
  $("#exclusive-field").hidden = Boolean(heldByOther);
  $("#exclusive-hint").textContent = heldByOther
    ? exclusiveText(holder) + "."
    : "Apenas um veículo por vez. Apague a data para liberar a exclusiva.";
  const published =
    stage === "publicada" &&
    !current().contacts.find((c) => c.id === editing)?.clips.length;
  $("#clip-fields").hidden = $("#clip-fields").disabled = !published;
  if (published && !field(contactForm, "published").value)
    field(contactForm, "published").value = day();
  field(contactForm, "published").required = published;
  field(contactForm, "url").setCustomValidity("");
  const url = field(contactForm, "url").value.trim();
  const clipping = $("#read-clip");
  clipping.hidden = !published || !isWebUrl(url);
  if (clipping.hidden) clipping.removeAttribute("href");
  else clipping.href = url;
}
function isWebUrl(value) {
  try {
    return ["https:", "http:"].includes(new URL(value).protocol);
  } catch {
    return false;
  }
}
function openContact(c) {
  editing = c?.id ?? null;
  contactForm.reset();
  clearValidity(contactForm);
  for (const key of [
    "name",
    "outlet",
    "email",
    "follow",
    "exclusive",
    "published",
    "url",
    "notes",
  ])
    field(contactForm, key).value = c?.[key] ?? "";
  const expiry = field(contactForm, "exclusive");
  expiry.min = day();
  if (expiry.value < expiry.min) expiry.value = "";
  field(contactForm, "stage").value = c?.stage ?? "planejar";
  $("#contact-heading").textContent = c
    ? "Editar contato"
    : "Adicionar contato";
  $("#delete-contact").hidden = !c;
  $("#exclusive-options").open = Boolean(c?.exclusive && c.exclusive >= day());
  updateFields();
  contactDialog.showModal();
  (c ? $("#contact-heading") : field(contactForm, "name")).focus();
}
function readForm(form) {
  const data = Object.fromEntries(new FormData(form));
  for (const key of Object.keys(data)) data[key] = data[key].trim();
  for (const input of form.querySelectorAll(
    "input[required]:enabled, textarea[required]:enabled",
  )) {
    if (!input.value.trim()) {
      input.setCustomValidity("Preencha este campo.");
      input.reportValidity();
      return null;
    }
  }
  return data;
}
for (const dialog of document.querySelectorAll("dialog")) {
  dialog
    .querySelector(".close")
    .addEventListener("click", () => dialog.close());
  dialog.addEventListener("input", (event) =>
    event.target.setCustomValidity?.(""),
  );
}
$("#campaign").addEventListener("change", (e) => {
  state.selected = e.target.value;
  resetView();
  render();
  if (!lastDelete) showNotice();
});
$("#new-campaign").onclick = () => openCampaign(null);
$("#edit-campaign").onclick = () => openCampaign(current());
$("#new-contact").onclick = () => {
  if (!current().contacts.length || !["agenda", "published"].includes(filter))
    return openContact(null);
  openEntry(filter === "agenda" ? "interviews" : "clips");
};
$("#contacts").addEventListener("click", (e) => {
  const target = e.target.closest("button[data-id]");
  if (!target) return;
  const contact = current().contacts.find((c) => c.id === target.dataset.id);
  if (target.dataset.kind)
    openEntry(target.dataset.kind, contact, target.dataset.record);
  else if (filter === "due") openEntry("history", contact);
  else openProfile(contact);
});
$("#filters").addEventListener("click", (e) => {
  const choice = e.target.closest("button[data-filter]");
  if (choice) {
    filter = choice.dataset.filter;
    $("#search").value = "";
    renderList();
  }
});
$("#search").addEventListener("input", renderList);
field(contactForm, "stage").addEventListener("change", updateFields);
field(contactForm, "url").addEventListener("input", updateFields);
campaignForm.onsubmit = (event) => {
  event.preventDefault();
  const data = readForm(campaignForm);
  if (!data) return;
  if (editing) Object.assign(current(), data);
  else {
    const campaign = { id: newId(), ...data, contacts: [] };
    state.campaigns.push(campaign);
    state.selected = campaign.id;
    resetView();
  }
  campaignDialog.close();
  lastDelete = null;
  save("Pauta salva.");
  $("#edit-campaign").focus({ preventScroll: true });
};
contactForm.onsubmit = (event) => {
  event.preventDefault();
  const data = readForm(contactForm);
  if (!data) return;
  if (data.url && !isWebUrl(data.url)) {
    field(contactForm, "url").setCustomValidity(
      "Use um endereço iniciado por https:// ou http://.",
    );
    field(contactForm, "url").reportValidity();
    return;
  }
  const contacts = current().contacts;
  const { published, url, ...values } = data;
  const record = { follow: "", exclusive: "", ...values };
  const previous = contacts.find((c) => c.id === editing);
  if (published && !previous?.clips.length)
    record.clips = [
      {
        id: newId(),
        title: "Matéria em " + values.outlet,
        format: url ? "Online" : "",
        date: published,
        url: url ?? "",
      },
    ];

  const id = editing || newId();
  if (editing)
    Object.assign(
      contacts.find((c) => c.id === id),
      record,
    );
  else contacts.push({ id, ...record });
  contactDialog.close();
  lastDelete = null;
  if (!editing) resetView();
  save("Contato salvo.");
  if ($("#profile-dialog").open) {
    renderProfile();
    $("#edit-profile").focus();
  } else
    (contactButton(id) ?? $("#new-contact")).focus({ preventScroll: true });
};
function contactButton(id) {
  return [...$("#contacts").querySelectorAll("button")].find(
    (button) => button.dataset.id === id,
  );
}
function deletionNotice() {
  if (lastDelete.kind)
    return {
      clips: "Matéria excluída.",
      interviews: "Entrevista excluída.",
      history: "Conversa excluída.",
    }[lastDelete.kind];
  return lastDelete.campaign
    ? "Contato excluído: " + lastDelete.record.name + "."
    : "Pauta excluída: " + lastDelete.record.headline + ".";
}
function removeRecord(isCampaign) {
  const records = isCampaign ? state.campaigns : current().contacts;
  const index = records.findIndex((record) => record.id === editing);
  if (index < 0) return;
  const [record] = records.splice(index, 1);
  lastDelete = { record, index, campaign: isCampaign ? null : state.selected };
  (isCampaign ? campaignDialog : contactDialog).close();
  if ($("#profile-dialog").open) $("#profile-dialog").close();
  if (isCampaign) resetView();
  save(deletionNotice());
  $("#undo").focus({ preventScroll: true });
}
$("#delete-campaign").onclick = () => removeRecord(true);
$("#delete-contact").onclick = () => removeRecord(false);
$("#undo").onclick = () => {
  if (!lastDelete) return;
  const { record, index, campaign } = lastDelete;
  if (lastDelete.kind) {
    state.selected = campaign;
    const contacts = current().contacts;
    const contactIndex = contacts.findIndex((c) => c.id === record.id);
    if (contactIndex !== -1) contacts[contactIndex] = record;
    const kind = lastDelete.kind;
    filter = { history: "all", interviews: "agenda", clips: "published" }[kind];
    $("#search").value = "";
    lastDelete = null;
    save("Registro restaurado.");
    if (
      kind === "history" ||
      (kind === "interviews" &&
        !record.interviews.some((i) => i.status === "scheduled"))
    )
      openProfile(record);
    else $("#filters").querySelector('[aria-pressed="true"]').focus();
    return;
  }
  if (campaign) {
    state.selected = campaign;
    current().contacts.splice(index, 0, record);
  } else {
    state.campaigns.splice(index, 0, record);
    state.selected = record.id;
  }
  lastDelete = null;
  resetView();
  save(campaign ? "Contato restaurado." : "Pauta e contatos restaurados.");
  (campaign ? contactButton(record.id) : $("#edit-campaign")).focus({
    preventScroll: true,
  });
};
window.addEventListener("storage", (event) => {
  if (event.key !== storageKey) return;
  for (const dialog of [...document.querySelectorAll("dialog[open]")].reverse())
    dialog.close();
  state = load();
  lastDelete = state.lastDelete ?? null;
  resetView();
  render();
  showNotice(lastDelete ? deletionNotice() : "Dados atualizados em outra aba.");
});
setupRecords();
render();
if (lastDelete) showNotice(deletionNotice());
