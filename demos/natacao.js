const channelNames = { busca: "Busca paga", social: "Redes sociais" };
const statusNames = {
  agendada: "Agendada",
  presente: "Compareceu",
  matricula: "Matriculado",
  faltou: "Faltou",
};
const monthFmt = new Intl.DateTimeFormat("pt-BR", {
  month: "long",
  year: "numeric",
});
const trial = $("#trial"),
  form = trial.querySelector("form"),
  budget = $("#budget"),
  budgetForm = budget.querySelector("form");
let period = isoDay().slice(0, 7),
  editing = null,
  closedOpen = false;
function initial() {
  const previous = new Date(isoDay() + "T12:00:00");
  previous.setDate(0);
  const prev =
    previous.getFullYear() +
    "-" +
    String(previous.getMonth() + 1).padStart(2, "0");
  const sample = (m, day, id, name, channel, status) => ({
    id,
    name,
    channel,
    status,
    date: m + "-" + String(day).padStart(2, "0"),
  });
  const today = Number(isoDay().slice(-2)),
    before = Math.max(1, today - 2);
  return {
    budgets: {
      [period]: { busca: 16800, social: 9200 },
      [prev]: { busca: 19500, social: 11000 },
    },
    trials: [
      sample(period, today, "at1", "Renata Lima", "busca", "presente"),
      sample(period, today, "at2", "Davi Melo", "social", "agendada"),
      sample(period, before, "at3", "Nina Reis", "busca", "matricula"),
      sample(period, before, "at4", "Caio Farias", "busca", "matricula"),
      sample(period, before, "at5", "Marta Leal", "social", "matricula"),
      sample(period, before, "at6", "Rita Prado", "social", "presente"),
      sample(prev, 5, "p1", "Sofia Freire", "busca", "matricula"),
      sample(prev, 8, "p2", "Bruno Lopes", "social", "matricula"),
      sample(prev, 9, "p3", "Inês Rocha", "busca", "presente"),
      sample(prev, 14, "p4", "Ana Viana", "social", "faltou"),
    ],
  };
}
const desk = localDesk("raia", initial, render);
function stats(rows) {
  const attended = rows.filter((t) =>
      ["presente", "matricula"].includes(t.status),
    ).length,
    paid = rows.filter((t) => t.status === "matricula").length;
  return {
    attended,
    paid,
    rate: attended ? Math.round((paid * 100) / attended) : null,
  };
}
function quick(t, next) {
  desk.update(
    (s) => {
      s.trials.find((i) => i.id === t.id).status = next;
    },
    next === "presente"
      ? "Presença registrada."
      : "Matrícula registrada. Conversão atualizada.",
  );
}
function row(t) {
  const li = node("li"),
    name = node("div"),
    actions = node("div", undefined, "trial-actions");
  name.append(
    node("b", t.name),
    node("small", niceDay(t.date) + " · " + channelNames[t.channel]),
  );
  const target = { agendada: "presente", presente: "matricula" }[t.status];
  if (target)
    actions.append(
      press(
        target === "presente" ? "Registrar presença" : "Matricular",
        () => quick(t, target),
        "outline",
      ),
    );
  else actions.append(node("small", statusNames[t.status]));
  actions.append(press("Editar", () => openTrial(t), "subtle"));
  li.append(name, actions);
  return li;
}
function render() {
  const months = [
    ...new Set([
      period,
      isoDay().slice(0, 7),
      ...Object.keys(desk.data.budgets),
      ...desk.data.trials.map((t) => t.date.slice(0, 7)),
    ]),
  ]
    .sort()
    .reverse();
  const monthLabel = (m) => monthFmt.format(new Date(m + "-01T12:00:00"));
  fillSelect(
    $("#period"),
    months.map((m) => [m, monthLabel(m)]),
    period,
  );
  const rows = desk.data.trials.filter((t) => t.date.startsWith(period)),
    spend = desk.data.budgets[period] ?? { busca: 0, social: 0 };
  $("#lanes").replaceChildren(
    ...Object.entries(channelNames).map(([key, label]) => {
      const { rate, attended, paid } = stats(
        rows.filter((r) => r.channel === key),
      );
      const lane = node("div", undefined, "lane"),
        top = node("div", undefined, "between");
      top.append(
        node("b", label),
        node("strong", rate === null ? "—" : rate + "%"),
      );
      const track = node("div", undefined, "water"),
        length = node("i");
      length.style.width = (rate ?? 0) + "%";
      track.append(length);
      lane.append(
        top,
        track,
        node(
          "small",
          paid +
            (paid === 1 ? " matrícula" : " matrículas") +
            " / " +
            attended +
            (attended === 1 ? " presente" : " presentes") +
            (paid ? " · " + brl(spend[key] / paid) + " por matrícula" : ""),
        ),
      );
      return lane;
    }),
  );
  const { paid } = stats(rows),
    total = spend.busca + spend.social;
  $("#cpa").textContent = paid ? brl(total / paid) : "—";
  $("#spend-note").textContent =
    brl(total) +
    " em mídia · " +
    paid +
    (paid === 1 ? " matrícula" : " matrículas");
  const pending = rows
    .filter((t) => ["agendada", "presente"].includes(t.status))
    .sort((a, b) => a.date.localeCompare(b.date));
  const ended = rows
    .filter((t) => ["faltou", "matricula"].includes(t.status))
    .sort((a, b) => b.date.localeCompare(a.date));
  $("#trial-list").replaceChildren(...pending.map(row));
  if (!pending.length)
    $("#trial-list").append(
      node("li", "Nenhuma aula pendente neste mês.", "empty"),
    );
  $("#closed").hidden = !ended.length;
  $("#closed").open = closedOpen;
  $("#closed-label").textContent = "Concluídas (" + ended.length + ")";
  $("#finished").replaceChildren(...ended.map(row));
}
function openTrial(t) {
  editing = t?.id ?? null;
  trial.querySelector("h2").textContent = t ? "Editar aula" : "Agendar aula";
  trial.querySelector(".danger").hidden = !t;
  openForm(trial, {
    name: t?.name ?? "",
    date: t?.date ?? (isoDay().startsWith(period) ? isoDay() : period + "-01"),
    channel: t?.channel ?? "busca",
    status: t?.status ?? "agendada",
  });
}
$("#closed").ontoggle = (e) => {
  closedOpen = e.target.open;
};
$("#period").onchange = (e) => {
  period = e.target.value;
  closedOpen = false;
  render();
};
$("#new-trial").onclick = () => openTrial(null);
form.onsubmit = (e) => {
  e.preventDefault();
  const f = formValues(form);
  if (!f) return;
  trial.close();
  period = f.date.slice(0, 7);
  closedOpen = ["faltou", "matricula"].includes(f.status);
  desk.update((s) => {
    if (editing)
      Object.assign(
        s.trials.find((t) => t.id === editing),
        f,
      );
    else s.trials.push({ ...f, id: uid() });
  }, "Aula salva.");
};
trial.querySelector(".danger").onclick = () => {
  trial.close();
  desk.update(
    (s) => {
      s.trials = s.trials.filter((t) => t.id !== editing);
    },
    "Aula excluída.",
    true,
  );
};
$("#edit-budget").onclick = () => {
  const current = desk.data.budgets[period] ?? { busca: 0, social: 0 };
  $("#budget-period").textContent = $("#period").selectedOptions[0].textContent;
  openForm(budget, {
    busca: current.busca / 100,
    social: current.social / 100,
  });
};
budgetForm.onsubmit = (e) => {
  e.preventDefault();
  const f = formValues(budgetForm);
  if (!f) return;
  budget.close();
  desk.update((s) => {
    s.budgets[period] = {
      busca: Math.round(f.busca * 100),
      social: Math.round(f.social * 100),
    };
  }, "Verba salva. Custo por matrícula recalculado.");
};
render();
