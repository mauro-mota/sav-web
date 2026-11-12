"use strict";

let profileId = null;
let entryKind = "";
let entryId = null;
const meetingLabels = {
  scheduled: "Agendada",
  done: "Realizada",
  canceled: "Cancelada",
};
const entryLabels = {
  history: ["Registrar conversa", "Editar conversa", "Conversa registrada."],
  interviews: ["Agendar entrevista", "Editar entrevista", "Entrevista salva."],
  clips: ["Registrar matéria", "Editar matéria", "Matéria salva no clipping."],
};

function element(tag, text, className) {
  const item = document.createElement(tag);
  if (text) item.textContent = text;
  if (className) item.className = className;
  return item;
}

// As matérias da primeira versão ficavam diretamente na ficha do jornalista.
function prepareContact(contact) {
  contact.history ??= [];
  contact.interviews ??= [];
  if (!Array.isArray(contact.clips)) {
    contact.clips = [];
    if (contact.published || contact.stage === "publicada" || contact.url) {
      contact.clips.push({
        id: "clip-" + contact.id,
        title: "Matéria em " + contact.outlet,
        date: contact.published || "",
        url: contact.url || "",
        format: contact.url ? "Online" : "",
      });
    }
  }
  delete contact.published;
  delete contact.url;
}

function clearValidity(form) {
  for (const control of form.elements) control.setCustomValidity?.("");
}
function dateLabel(value) {
  return value ? displayDate(value.slice(0, 10)) : "Data não informada";
}
function entryDate(kind, record) {
  return kind === "interviews" ? record.start : record.date;
}
function entryDescription(kind, record) {
  if (kind === "history") return record.summary;
  if (kind === "clips") return record.title;
  return "Entrevista com " + record.source;
}
function entryMeta(kind, record) {
  if (kind === "history") return [record.channel, dateLabel(record.date)];
  if (kind === "clips")
    return [record.format, dateLabel(record.date)].filter(Boolean);
  return [
    dateLabel(record.start) + " às " + record.start.slice(11, 16),
    record.minutes + " min",
    record.medium,
    meetingLabels[record.status],
  ];
}
function deskRow(contact, kind, record) {
  const row = element("li", "", "record-row");
  const copy = element("div", "", "record-copy");
  const eyebrow =
    kind === "interviews"
      ? dateLabel(record.start) + " · " + record.start.slice(11, 16)
      : [dateLabel(record.date), record.format].filter(Boolean).join(" · ");
  copy.append(
    element("small", eyebrow, "kicker"),
    element("strong", entryDescription(kind, record)),
    element("span", contact.name + " · " + contact.outlet),
  );
  if (kind === "interviews")
    copy.append(
      element("small", record.medium + " · " + record.minutes + " min"),
    );
  const actions = element("div", "", "record-actions");
  if (kind === "clips" && isWebUrl(record.url)) {
    const link = element("a", "Ler matéria");
    link.href = record.url;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    actions.append(link);
  }
  const edit = element("button", "Editar", "text-button");
  edit.type = "button";
  edit.setAttribute("aria-label", "Editar " + entryDescription(kind, record));
  Object.assign(edit.dataset, { id: contact.id, kind, record: record.id });
  actions.append(edit);
  row.append(copy, actions);
  return row;
}

function openProfile(contact) {
  profileId = contact.id;
  renderProfile();
  $("#profile-dialog").showModal();
  $("#profile-name").focus();
}
function renderProfile() {
  const contact = current().contacts.find((c) => c.id === profileId);
  $("#profile-name").textContent = contact.name;
  $("#profile-outlet").textContent = contact.outlet;
  $("#profile-stage").textContent = stages[contact.stage];
  $("#profile-stage").dataset.stage = contact.stage;
  $("#profile-notes").textContent = contact.notes;
  $("#profile-notes").hidden = !contact.notes;
  const facts = $("#profile-facts");
  facts.replaceChildren();
  const fields = [
    [
      "Próximo retorno",
      active(contact.stage) && contact.follow && dateLabel(contact.follow),
    ],
    [
      "Exclusiva até",
      active(contact.stage) &&
        contact.exclusive >= day() &&
        dateLabel(contact.exclusive),
    ],
    ["E-mail", contact.email],
  ];
  for (const [label, value] of fields)
    if (value) facts.append(element("dt", label), element("dd", value));
  facts.hidden = !facts.children.length;
  const log = $("#profile-log");
  log.replaceChildren();
  const entries = ["history", "interviews", "clips"].flatMap((kind) =>
    contact[kind].map((record) => ({ kind, record })),
  );
  entries
    .reverse()
    .sort((a, b) =>
      entryDate(b.kind, b.record).localeCompare(entryDate(a.kind, a.record)),
    );
  for (const { kind, record } of entries) {
    const item = element("li");
    const button = element("button", "", "log-row");
    button.type = "button";
    button.dataset.kind = kind;
    button.dataset.record = record.id;
    button.append(
      element("small", entryMeta(kind, record).join(" · ")),
      element("span", entryDescription(kind, record)),
    );
    item.append(button);
    log.append(item);
  }
  if (!entries.length)
    log.append(
      element(
        "li",
        "Nenhuma conversa, entrevista ou matéria registrada.",
        "context",
      ),
    );
}

function openEntry(kind, contact = null, id = null) {
  const form = $("#entry-form");
  entryKind = kind;
  entryId = id;
  form.reset();
  clearValidity(form);
  $("#entry-error").hidden = true;
  const who = field(form, "who");
  who.replaceChildren(
    new Option("Selecionar jornalista", ""),
    ...current().contacts.map(
      (c) => new Option(c.name + " · " + c.outlet, c.id),
    ),
  );
  who.value = contact?.id ?? "";
  $("#entry-person").hidden = who.disabled = Boolean(contact);
  $("#entry-byline").textContent = contact
    ? contact.name + " · " + contact.outlet
    : "";
  $("#entry-byline").hidden = !contact;
  for (const group of form.querySelectorAll("[data-fields]"))
    group.hidden = group.disabled = group.dataset.fields !== kind;
  const group = form.querySelector('[data-fields="' + kind + '"]');
  const record = contact?.[kind].find((r) => r.id === id);
  const defaults = {
    history: { date: day(), channel: "E-mail" },
    interviews: { minutes: "30", medium: "Telefone", status: "scheduled" },
    clips: { date: day(), format: "Online" },
  };
  for (const [key, value] of Object.entries(record ?? defaults[kind])) {
    const control = group.elements.namedItem(key);
    if (control) control.value = value;
  }
  updateClipLink();
  // Só uma nova conversa altera o lembrete atual do contato.
  $("#next-follow").hidden = Boolean(id || !contact || !active(contact.stage));
  field(form, "next").disabled = $("#next-follow").hidden;
  $("#meeting-state").hidden = !id;
  $("#entry-heading").textContent = entryLabels[kind][id ? 1 : 0];
  $("#remove-entry").hidden = !id;
  $("#remove-entry").textContent = {
    history: "Excluir conversa",
    interviews: "Excluir entrevista",
    clips: "Excluir matéria",
  }[kind];
  $("#save-entry").textContent = id
    ? "Salvar alterações"
    : {
        history: "Registrar conversa",
        interviews: "Agendar entrevista",
        clips: "Registrar matéria",
      }[kind];
  if (!contact && who.options.length === 2) who.selectedIndex = 1;
  $("#entry-dialog").showModal();
  $("#entry-heading").focus();
}

function interviewConflict(candidate, contact) {
  if (candidate.status !== "scheduled") return null;
  const start = new Date(candidate.start).getTime();
  const end = start + Number(candidate.minutes) * 60000;
  for (const campaign of state.campaigns) {
    for (const other of campaign.contacts) {
      const sameJournalist =
        (normalize(other.name) === normalize(contact.name) &&
          normalize(other.outlet) === normalize(contact.outlet)) ||
        (contact.email &&
          other.email &&
          normalize(contact.email) === normalize(other.email));
      for (const interview of other.interviews ?? []) {
        if (interview.id === entryId || interview.status !== "scheduled")
          continue;
        const sameSource =
          normalize(interview.source) === normalize(candidate.source);
        if (!sameJournalist && !sameSource) continue;
        const otherStart = new Date(interview.start).getTime();
        if (
          start < otherStart + Number(interview.minutes) * 60000 &&
          end > otherStart
        )
          return (
            (sameSource ? candidate.source : contact.name) +
            " já tem entrevista nesse horário para “" +
            campaign.headline +
            "”."
          );
      }
    }
  }
  return null;
}

function submitEntry(event) {
  event.preventDefault();
  const form = event.currentTarget,
    data = readForm(form);
  if (!data) return;
  const who = field(form, "who").value;
  const contact = current().contacts.find((c) => c.id === who);
  if (!contact) return;
  delete data.who;
  const message =
    entryKind === "interviews" ? interviewConflict(data, contact) : "";
  if (message) {
    const error = $("#entry-error");
    error.textContent = message;
    error.hidden = false;
    field(form, "start").focus();
    return;
  }
  if (entryKind === "clips" && data.url && !isWebUrl(data.url)) {
    const url = form.querySelector('[name="url"]');
    url.setCustomValidity("Use um endereço iniciado por https:// ou http://.");
    url.reportValidity();
    return;
  }
  if (entryKind === "history" && !entryId && active(contact.stage)) {
    contact.follow = data.next ?? "";
    contact.stage = "conversa";
  }
  delete data.next;
  if (entryKind === "clips" && !entryId) {
    contact.stage = "publicada";
    contact.follow = "";
    contact.exclusive = "";
  }
  if (
    entryKind === "interviews" &&
    !entryId &&
    ["planejar", "enviada"].includes(contact.stage)
  )
    contact.stage = "conversa";
  const list = contact[entryKind];
  if (entryId)
    Object.assign(
      list.find((r) => r.id === entryId),
      data,
    );
  else list.push({ id: newId(), ...data });
  lastDelete = null;
  finishEntry(entryLabels[entryKind][2], contact);
}

function finishEntry(message, contact) {
  $("#entry-dialog").close();
  save(message);
  if ($("#profile-dialog").open) {
    renderProfile();
    $("#profile-dialog")
      .querySelector('[data-new="' + entryKind + '"]')
      .focus({ preventScroll: true });
  } else {
    const row = [
      ...$("#contacts").querySelectorAll("button[data-record]"),
    ].find(
      (b) => b.dataset.record === (entryId ?? contact[entryKind].at(-1)?.id),
    );
    (row ?? $("#new-contact")).focus({ preventScroll: true });
  }
}

function removeEntry() {
  const contact = current().contacts.find(
    (c) => c.id === field($("#entry-form"), "who").value,
  );
  lastDelete = {
    kind: entryKind,
    campaign: state.selected,
    record: structuredClone(contact),
  };
  contact[entryKind] = contact[entryKind].filter((r) => r.id !== entryId);
  if (
    entryKind === "clips" &&
    !contact.clips.length &&
    contact.stage === "publicada"
  )
    contact.stage = "conversa";
  $("#entry-dialog").close();
  if ($("#profile-dialog").open) $("#profile-dialog").close();
  save(deletionNotice());
  $("#undo").focus();
}
function updateClipLink() {
  const link = $("#entry-read-clip");
  const url = field($("#entry-form"), "url").value.trim();
  link.hidden = entryKind !== "clips" || !isWebUrl(url);
  if (link.hidden) link.removeAttribute("href");
  else link.href = url;
}
function setupRecords() {
  const profile = $("#profile-dialog");
  $("#edit-profile").onclick = () =>
    openContact(current().contacts.find((c) => c.id === profileId));
  profile.addEventListener("click", (event) => {
    const button = event.target.closest("[data-new], [data-record]");
    if (!button) return;
    openEntry(
      button.dataset.new ?? button.dataset.kind,
      current().contacts.find((c) => c.id === profileId),
      button.dataset.record ?? null,
    );
  });
  profile.addEventListener("close", () => {
    if (document.activeElement === document.body)
      contactButton(profileId)?.focus({ preventScroll: true });
  });
  field($("#entry-form"), "url").addEventListener("input", updateClipLink);
  $("#entry-form").onsubmit = submitEntry;
  $("#remove-entry").onclick = removeEntry;
  $("#entry-form").addEventListener("input", () => {
    $("#entry-error").hidden = true;
  });
}
