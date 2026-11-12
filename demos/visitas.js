const props = {
  alameda: {
    name: "Alameda das Figueiras, 84",
    rooms: "2 dormitórios",
    area: "68 m²",
    price: 46800000,
  },
  vila: {
    name: "Rua das Mangueiras, 17",
    rooms: "1 dormitório",
    area: "45 m²",
    price: 32700000,
  },
};
const times = [
  "09:00",
  "10:00",
  "11:00",
  "13:00",
  "14:00",
  "15:00",
  "16:00",
  "17:00",
];
const visit = $("#visit"),
  form = visit.querySelector("form");
let editing = null,
  dayView = isoDay(),
  shown = "alameda";
const desk = localDesk(
  "vao",
  () => ({
    visits: [
      {
        id: "a",
        client: "Lívia Moura",
        property: "alameda",
        agent: "Inês",
        day: isoDay(),
        time: "09:00",
        stage: "visit",
      },
      {
        id: "b",
        client: "Tomás Leite",
        property: "vila",
        agent: "Pedro",
        day: isoDay(),
        time: "11:00",
        stage: "visit",
      },
      {
        id: "c",
        client: "Clara Vaz",
        property: "alameda",
        agent: "Inês",
        day: isoDay(-1),
        time: "14:00",
        stage: "follow",
      },
    ],
  }),
  render,
);
const options = Object.entries(props).map(([k, p]) => [k, p.name]);
fillSelect($("#property"), options, shown);
fillSelect(form.elements.property, options, shown);
fillSelect(
  form.elements.time,
  times.map((t) => [t, t]),
  "09:00",
);
function drawPlan() {
  const c = $("#floorplan").getContext("2d"),
    two = shown === "alameda";
  c.clearRect(0, 0, 640, 424);
  c.save();
  c.scale(2, 2);
  c.lineJoin = "miter";
  const ink = "#2a453c",
    fine = "#778c79";
  function line(x, y, a, b, width = 1, color = fine) {
    c.beginPath();
    c.moveTo(x, y);
    c.lineTo(a, b);
    c.lineWidth = width;
    c.strokeStyle = color;
    c.stroke();
  }
  function box(x, y, w, h, fill, stroke = fine) {
    c.fillStyle = fill;
    c.fillRect(x, y, w, h);
    c.strokeStyle = stroke;
    c.lineWidth = 0.8;
    c.strokeRect(x, y, w, h);
  }
  function label(t, x, y) {
    c.fillStyle = ink;
    c.font = "9px Arial";
    c.textAlign = "center";
    c.fillText(t, x, y);
  }
  function bed(x, y, w, h) {
    box(x, y, w, h, "#f5f5e9");
    for (const inset of [3, w / 2 + 1])
      box(x + inset, y + 3, w / 2 - 4, 7, "#e2e6d7");
    box(x - 9, y + 1, 7, 8, "#cbd3c3");
    line(x, y + 14, x + w, y + 14);
  }
  function door(x, y, r) {
    line(x, y, x, y + r, 0.9);
    c.beginPath();
    c.arc(x, y, r, 0, Math.PI / 2);
    c.lineWidth = 0.65;
    c.strokeStyle = fine;
    c.stroke();
  }
  function windowLine(x1, x2, y) {
    line(x1, y, x2, y, 5, "#edf1e6");
    line(x1, y - 1, x2, y - 1);
    line(x1, y + 1, x2, y + 1);
  }
  const right = two ? 288 : 249,
    middle = two ? 177 : 151;
  box(28, 27, right - 28, 154, "#e8eddf");
  box(29, 28, middle - 29, 86, "#f3f4e9");
  box(middle + 1, 28, right - middle - 2, 81, "#f0f0e3");
  // Paredes com vãos de passagem, janelas externas e mobiliário em planta.
  for (const seg of [
    [28, 27, right, 27],
    [right, 27, right, 181],
    [right, 181, 28, 181],
    [28, 181, 28, 150],
    [28, 127, 28, 27],
    [middle, 27, middle, 84],
    [middle, 104, middle, 181],
    [middle, 110, middle + 14, 110],
    [middle + 35, 110, right, 110],
    [28, 115, 68, 115],
    [89, 115, 110, 115],
    [110, 115, 110, 181],
  ])
    line(...seg, 3.8, ink);
  if (two) {
    line(110, 115, 120, 115, 3.8, ink);
    line(140, 115, middle, 115, 3.8, ink);
    door(120, 115, 19);
  }
  door(middle + 15, 110, 18);
  door(69, 115, 18);
  windowLine(54, 96, 27);
  windowLine(middle + 18, right - 19, 27);
  windowLine(130, middle - 7, 181);
  box(43, 43, 61, 19, "#c8d4bf");
  box(41, 39, 65, 6, "#e1e7d7");
  box(52, 69, 38, 12, "#e6e9db");
  line(63, 44, 63, 59);
  line(83, 44, 83, 59);
  box(40, 43, 4, 18, "#c4cfba");
  box(104, 43, 4, 18, "#c4cfba");
  box(middle - 13, 36, 7, 32, "#dce3d3");
  label("Estar", 86, 101);
  bed(middle + 14, 39, 35, 43);
  label("Quarto", middle + (right - middle) / 2, 97);
  box(32, 121, 16, 55, "#cdd8c7");
  box(48, 160, 48, 16, "#dce3d3");
  box(50, 163, 13, 9, "#f4f5eb");
  label("Cozinha", 76, 149);
  if (two) {
    bed(232, 117, 35, 42);
    label("Quarto", 239, 173);
  } else {
    box(178, 119, 47, 21, "#cbd6c8");
    label("Banho", 200, 162);
  }
  if (two) {
    box(120, 156, 34, 18, "#d5ded0");
    label("Banho", 145, 143);
  }
  line(28, 194, right, 194, 0.7);
  line(28, 190, 28, 198);
  line(right, 190, right, 198);
  label("Planta esquemática", (right + 28) / 2, 207);
  c.restore();
  const prop = props[shown];
  $("#rooms").textContent = prop.rooms;
  $("#area").textContent = prop.area;
  $("#price").textContent = brl(prop.price).replace(",00", "");
  $("#floorplan").setAttribute(
    "aria-label",
    "Planta ilustrativa de " + prop.name + ", " + prop.rooms,
  );
}
function openVisit(v) {
  editing = v?.id ?? null;
  visit.querySelector("h2").textContent = v
    ? "Editar atendimento"
    : "Agendar visita";
  visit.querySelector(".danger").hidden = !v;
  $("#visit-error").textContent = "";
  openForm(visit, {
    stage: v?.stage ?? "visit",
    client: v?.client ?? "",
    property: v?.property ?? shown,
    agent: v?.agent ?? "Inês",
    day: v?.day ?? dayView,
    time: v?.time ?? times[0],
  });
}
function showProperty(code) {
  shown = code;
  $("#property").value = code;
  drawPlan();
}
function changeStage(v, stage) {
  showProperty(v.property);
  desk.update((s) => {
    s.visits.find((item) => item.id === v.id).stage = stage;
  }, { follow: "Visita realizada. Retorno comercial aberto.", proposta: "Proposta registrada.", ganha: "Negócio fechado.", perdida: "Atendimento encerrado." }[stage]);
}
const stageNames = {
  visit: "Agendada",
  follow: "Retorno pendente",
  proposta: "Proposta enviada",
  ganha: "Negócio fechado",
  perdida: "Encerrado",
};
function render() {
  $("#day").value = dayView;
  $("#calendar-label").textContent = new Date(
    dayView + "T12:00:00",
  ).toLocaleDateString("pt-BR", {
    weekday: "long",
    day: "numeric",
    month: "short",
  });
  const visits = desk.data.visits
    .filter((v) => v.day === dayView)
    .sort((a, b) => a.time.localeCompare(b.time));
  $("#no-visits").hidden = visits.length > 0;
  $("#appointments").replaceChildren(
    ...visits.map((v) => {
      const item = node("li"),
        time = node("time", v.time),
        info = node("div"),
        actions = node("div", undefined, "visit-actions");
      info.append(
        node("b", v.client),
        press(
          props[v.property].name,
          () => showProperty(v.property),
          "property-link",
        ),
        node("small", "Corretor: " + v.agent),
      );
      actions.append(press("Editar", () => openVisit(v), "subtle"));
      if (v.stage === "visit")
        actions.append(
          press("Marcar realizada", () => changeStage(v, "follow"), "outline"),
        );
      else actions.append(node("small", stageNames[v.stage]));
      item.append(time, info, actions);
      return item;
    }),
  );
  const followups = desk.data.visits.filter((v) => v.stage !== "visit");
  $("#returns-count").textContent =
    followups.filter((v) => ["follow", "proposta"].includes(v.stage)).length +
    " em aberto";
  $("#returns").replaceChildren(
    ...followups.map((v) => {
      const row = node("li"),
        title = node("div");
      title.append(
        node("b", v.client),
        node("small", props[v.property].name + " · " + stageNames[v.stage]),
      );
      row.append(title);
      const actions = node("div", undefined, "follow-actions");
      if (v.stage === "follow")
        actions.append(
          press(
            "Registrar proposta",
            () => changeStage(v, "proposta"),
            "outline",
          ),
        );
      if (v.stage === "proposta")
        actions.append(
          press("Fechar negócio", () => changeStage(v, "ganha"), "outline"),
        );
      if (["follow", "proposta"].includes(v.stage))
        actions.append(
          press("Encerrar", () => changeStage(v, "perdida"), "subtle"),
        );
      actions.append(press("Editar", () => openVisit(v), "subtle"));
      row.append(actions);
      return row;
    }),
  );
  if (!followups.length)
    $("#returns").append(
      node(
        "li",
        "Ao marcar uma visita como realizada, o retorno aparece aqui.",
        "empty",
      ),
    );
  drawPlan();
}
function moveDay(n) {
  const d = new Date(dayView + "T12:00:00");
  d.setDate(d.getDate() + n);
  dayView = [
    d.getFullYear(),
    String(d.getMonth() + 1).padStart(2, "0"),
    String(d.getDate()).padStart(2, "0"),
  ].join("-");
  render();
}
$("#prev").onclick = () => moveDay(-1);
$("#next").onclick = () => moveDay(1);
$("#day").onchange = (e) => {
  if (e.target.value) dayView = e.target.value;
  render();
};
$("#property").onchange = (e) => showProperty(e.target.value);
$("#new-visit").onclick = () => openVisit(null);
form.onsubmit = (e) => {
  e.preventDefault();
  const data = formValues(form);
  if (!data) return;
  const clash = desk.data.visits.find(
    (v) =>
      v.id !== editing &&
      v.day === data.day &&
      v.time === data.time &&
      (v.property === data.property || v.agent === data.agent),
  );
  if (clash) {
    $("#visit-error").textContent =
      "O imóvel ou o corretor já tem visita nesse horário. Escolha outro horário.";
    return;
  }
  visit.close();
  dayView = data.day;
  showProperty(data.property);
  desk.update((s) => {
    if (editing)
      Object.assign(
        s.visits.find((v) => v.id === editing),
        data,
      );
    else s.visits.push({ ...data, id: uid() });
  }, "Visita salva.");
};
visit.querySelector(".danger").onclick = () => {
  visit.close();
  desk.update(
    (s) => {
      s.visits = s.visits.filter((v) => v.id !== editing);
    },
    "Atendimento excluído.",
    true,
  );
};
render();
