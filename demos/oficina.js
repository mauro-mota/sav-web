const BAY_COUNT = 6;
const mechanics = ["Iara", "Rafael", "Luana", "Davi"];
const labels = {
  active: "Em serviço",
  waiting: "A iniciar",
  parts: "Aguarda peça",
  free: "Livre",
  ready: "Para retirada",
  delivered: "Entregue",
};
const bayNumber = (index) => String(index + 1).padStart(2, "0");
const fullName = (job) => [job.make, job.model].filter(Boolean).join(" ");
const orderForm = $("#order-form"),
  dialog = $("#order-dialog"),
  action = $("#job-action");
const field = (name) => orderForm.elements.namedItem(name);
let selected = 1,
  filter = "queue",
  editing = null;
const timeLabel = (due) =>
  (due.slice(0, 10) === isoDay() ? "" : niceDay(due.slice(0, 10)) + " · ") +
  due.slice(11, 16);
function seedOrders() {
  function order(
    job,
    bay,
    customer,
    make,
    model,
    body,
    service,
    tech,
    time,
    status,
    parts,
    labor,
  ) {
    return {
      job,
      bay,
      customer,
      make,
      model,
      body,
      service,
      tech,
      due: isoDay() + "T" + time,
      status,
      plate: "",
      parts,
      labor,
      completed: ["ready", "delivered"].includes(status) ? isoDay() : "",
    };
  }
  return {
    next: 2153,
    orders: [
      order(
        2147,
        0,
        "Nara Alves",
        "Volkswagen",
        "Polo",
        "hatch",
        "Troca de óleo e filtro",
        "Iara",
        "11:30",
        "active",
        18800,
        9000,
      ),
      order(
        2148,
        1,
        "Marina Lopes",
        "Chevrolet",
        "Onix",
        "hatch",
        "Revisão de 40.000 km",
        "Rafael",
        "12:00",
        "active",
        32000,
        18000,
      ),
      order(
        2150,
        3,
        "Caio Gomes",
        "Toyota",
        "Corolla",
        "sedan",
        "Alinhamento e balanceamento",
        "Iara",
        "13:15",
        "waiting",
        0,
        16000,
      ),
      order(
        2149,
        4,
        "Breno Luz",
        "Renault",
        "Duster",
        "suv",
        "Troca de amortecedores",
        "Luana",
        "14:00",
        "active",
        89000,
        26000,
      ),
      order(
        2152,
        null,
        "Lúcia Sá",
        "Honda",
        "Fit",
        "hatch",
        "Avaliação de ruído na suspensão",
        "Davi",
        "16:30",
        "waiting",
        null,
        null,
      ),
      order(
        2146,
        null,
        "Tânia Melo",
        "Fiat",
        "Argo",
        "hatch",
        "Revisão dos freios",
        "Davi",
        "10:30",
        "ready",
        24000,
        12500,
      ),
      order(
        2145,
        null,
        "José Vidal",
        "Nissan",
        "Versa",
        "sedan",
        "Troca de bateria",
        "Rafael",
        "09:15",
        "delivered",
        46500,
        4000,
      ),
    ],
  };
}
const desk = localDesk("eixo", seedOrders, render);
const inBay = (index) => desk.data.orders.find((o) => o.bay === index);
const isWorking = (job) => ["active", "parts"].includes(job?.status);
function otherActive(tech, id) {
  return desk.data.orders.find(
    (o) => o.job !== id && o.tech === tech && o.status === "active",
  );
}
function jobTotal(job) {
  return job.parts === null && job.labor === null
    ? "A orçar"
    : brl((job.parts ?? 0) + (job.labor ?? 0));
}
// Desenhos de perfil na mesma escala para os três tipos de carroceria.
const profiles = {
  hatch: {
    wheels: [24, 73],
    frame:
      "M7 30 Q7 23 12 15 L18 8 Q23 6 42 7 Q53 8 66 19 L83 22 Q88 23 89 28 L89 32 L83 33 Q81 23 73 23 Q65 23 63 33 L34 33 Q32 23 24 23 Q16 23 14 33 L8 32 Z",
    glass: "M16 18 L20 10 L31 10 L31 18 Z M35 10 L42 10 Q51 11 60 18 L35 18 Z",
  },
  sedan: {
    wheels: [23, 74],
    frame:
      "M4 29 L6 22 L18 20 Q28 8 38 7 L52 7 Q59 8 70 19 L85 22 Q90 23 92 28 L91 32 L84 33 Q82 23 74 23 Q66 23 64 33 L33 33 Q31 23 23 23 Q15 23 13 33 L5 32 Z",
    glass:
      "M23 19 Q30 11 39 10 L42 10 L42 18 Z M46 10 L51 10 Q58 11 64 18 L46 18 Z",
  },
  suv: {
    wheels: [23, 72],
    frame:
      "M5 30 L6 17 L10 7 Q11 5 17 5 L45 5 Q53 6 66 17 L82 20 Q89 21 90 28 L90 32 L82 33 Q80 22 72 22 Q64 22 62 33 L34 33 Q31 22 23 22 Q15 22 13 33 L5 32 Z",
    glass:
      "M11 16 L13 8 L24 8 L24 16 Z M28 8 L38 8 L38 16 L28 16 Z M42 8 L46 8 Q54 10 60 17 L42 16 Z",
  },
};
function drawCar(canvas, type) {
  const ctx = canvas.getContext("2d");
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  const { frame, glass, wheels } = profiles[type];
  ctx.save();
  ctx.scale(3, 3);
  ctx.strokeStyle = "#203224";
  ctx.lineWidth = 1.6;
  ctx.lineJoin = "round";
  ctx.fillStyle = "#d6e1c7";
  ctx.fill(new Path2D(frame));
  ctx.stroke(new Path2D(frame));
  ctx.fillStyle = "#415641";
  ctx.fill(new Path2D(glass));
  for (const x of wheels) {
    ctx.beginPath();
    ctx.arc(x, 31, 6, 0, 2 * Math.PI);
    ctx.fillStyle = "#26382a";
    ctx.fill();
    ctx.beginPath();
    ctx.arc(x, 31, 2.4, 0, 2 * Math.PI);
    ctx.fillStyle = "#d6e1c7";
    ctx.fill();
  }
  ctx.restore();
}
const tiles = Array.from({ length: BAY_COUNT }, (_, index) => {
  const button = press(
    "",
    () => {
      selected = index;
      $("#job-feedback").textContent = "";
      render();
    },
    "bay",
  );
  const location = node("span", "BOX " + bayNumber(index), "bay-number"),
    canvas = node("canvas"),
    model = node("b");
  canvas.width = 288;
  canvas.height = 120;
  canvas.setAttribute("aria-hidden", "true");
  button.append(location, canvas, model);
  $("#bays").append(button);
  return { button, canvas, model };
});
function renderDesk() {
  const orders = desk.data.orders;
  const queue = orders.filter((o) => o.status === "waiting" && o.bay === null);
  const ready = orders
    .filter((o) => o.status === "ready")
    .sort((a, b) => (b.readyAt ?? 0) - (a.readyAt ?? 0));
  const delivered = orders
    .filter((o) => o.status === "delivered")
    .sort((a, b) => (b.deliveredAt ?? 0) - (a.deliveredAt ?? 0));
  const groups = { queue, ready, delivered };
  $("#desk-summary").textContent =
    queue.length + " na fila · " + ready.length + " para retirada";
  for (const btn of document.querySelectorAll("[data-filter]"))
    btn.setAttribute("aria-pressed", String(btn.dataset.filter === filter));
  const list = $("#desk-list");
  list.replaceChildren();
  for (const job of groups[filter]) {
    const row = node("li"),
      summary = node("div"),
      controls = node("div", undefined, "row-actions");
    summary.append(
      node("strong", fullName(job)),
      node("small", "OS " + job.job + " · " + job.customer),
      node(
        "span",
        job.service + (filter === "queue" ? "" : " · " + jobTotal(job)),
      ),
    );
    if (filter === "queue") {
      const free = !inBay(selected)
        ? selected
        : tiles.findIndex((_, i) => !inBay(i));
      if (free >= 0)
        controls.append(
          press("Alocar box", () => openOrder(job, free), "shop-secondary"),
        );
      else controls.append(node("small", "Todos os boxes ocupados"));
    }
    if (filter === "ready")
      controls.append(
        press("Registrar retirada", () => deliver(job), "shop-secondary"),
      );
    controls.append(press("Editar OS", () => openOrder(job), "text-action"));
    row.append(summary, controls);
    list.append(row);
  }
  if (!groups[filter].length)
    list.append(
      node(
        "li",
        {
          queue: "Nenhum veículo na fila.",
          ready: "Nenhum veículo aguardando retirada.",
          delivered: "Nenhuma retirada registrada.",
        }[filter],
        "desk-empty",
      ),
    );
}
function render() {
  const orders = desk.data.orders;
  tiles.forEach(({ button, canvas, model }, i) => {
    const job = inBay(i),
      state = job?.status ?? "free";
    button.dataset.state = state;
    button.setAttribute("aria-pressed", String(i === selected));
    button.setAttribute(
      "aria-label",
      ["Box " + bayNumber(i), job?.model, labels[state]]
        .filter(Boolean)
        .join(", "),
    );
    model.textContent = job?.model ?? "Livre";
    canvas.hidden = !job;
    if (job) drawCar(canvas, job.body);
  });
  const job = inBay(selected);
  $("#job-id").textContent =
    "Box " + bayNumber(selected) + (job ? " / OS " + job.job : "");
  $("#vehicle").textContent = job ? fullName(job) : "Box livre";
  $("#service-name").textContent =
    job?.service ?? "Disponível para o próximo veículo.";
  $("#job-details").hidden = $("#edit-job").hidden = !job;
  $("#customer").textContent = job?.customer ?? "";
  $("#job-total").textContent = job ? jobTotal(job) : "";
  $("#job-state").textContent = labels[job?.status ?? "free"];
  $("#plate").parentElement.hidden = !job?.plate;
  $("#plate").textContent = job?.plate ?? "";
  $("#from-queue").hidden =
    !!job || !orders.some((o) => o.bay === null && o.status === "waiting");
  $("#technician").textContent = job?.tech ?? "";
  $("#due").textContent = job ? timeLabel(job.due) : "";
  $("#pause-job").hidden = job?.status !== "active";
  action.textContent = job
    ? {
        active: "Concluir serviço",
        parts: "Retomar serviço",
        waiting: "Iniciar serviço",
      }[job.status]
    : "Abrir OS neste box";
  $("#occupied-count").textContent =
    orders.filter((o) => o.bay !== null).length + " / " + BAY_COUNT;
  $("#waiting-count").textContent = orders.filter(
    (o) => o.status === "waiting",
  ).length;
  $("#active-count").textContent = orders.filter(
    (o) => o.status === "active",
  ).length;
  $("#done-count").textContent = orders.filter(
    (o) => o.completed === isoDay(),
  ).length;
  renderDesk();
}
function changeStatus(job, status, text) {
  $("#job-feedback").textContent = "";
  desk.update((data) => {
    const order = data.orders.find((o) => o.job === job.job);
    order.status = status;
    if (status === "ready") {
      order.bay = null;
      order.completed = isoDay();
      order.readyAt = Date.now();
    }
    if (status === "delivered") order.deliveredAt = Date.now();
  }, text);
}
function deliver(job) {
  filter = "delivered";
  changeStatus(
    job,
    "delivered",
    "Retirada de " + fullName(job) + " registrada.",
  );
  document
    .querySelector('[data-filter="delivered"]')
    .focus({ preventScroll: true });
}
action.onclick = () => {
  const job = inBay(selected);
  if (!job) {
    openOrder(null, selected);
    return;
  }
  if (job.status === "active") {
    filter = "ready";
    changeStatus(
      job,
      "ready",
      "OS " +
        job.job +
        " concluída. Box liberado; veículo aguardando retirada.",
    );
    $("#desk").open = true;
    return;
  }
  const conflict = otherActive(job.tech, job.job);
  if (conflict) {
    $("#job-feedback").textContent =
      job.tech +
      " está no box " +
      bayNumber(conflict.bay) +
      ". Edite a OS para trocar o responsável ou conclua o serviço em andamento.";
    return;
  }
  changeStatus(
    job,
    "active",
    "Serviço " + (job.status === "parts" ? "retomado." : "iniciado."),
  );
};
$("#pause-job").onclick = () => {
  const job = inBay(selected);
  if (job?.status === "active")
    changeStatus(
      job,
      "parts",
      "Aguardando peça. O veículo permanece no box e o responsável pode iniciar outro serviço.",
    );
};
for (const button of document.querySelectorAll("[data-filter]"))
  button.onclick = () => {
    filter = button.dataset.filter;
    renderDesk();
  };
function moneyInput(name) {
  const value = field(name).value;
  return value === "" ? null : Math.round(Number(value) * 100);
}
function updateEstimate() {
  $("#estimate").textContent = jobTotal({
    parts: moneyInput("parts"),
    labor: moneyInput("labor"),
  });
}
function openOrder(job, target = job?.bay ?? null) {
  editing = job?.job ?? null;
  const movable = !job || job.status === "waiting" || isWorking(job);
  const choices = isWorking(job) ? [] : [["queue", "Fila de espera"]];
  for (let i = 0; i < BAY_COUNT; i++) {
    const occupied = inBay(i);
    if (!occupied || occupied.job === editing)
      choices.push([String(i), "Box " + bayNumber(i)]);
  }
  const bay = target === null ? "queue" : String(target);
  fillSelect(field("bay"), choices, bay);
  $("#bay-field").hidden = !movable;
  field("bay").disabled = !movable;
  const technician =
    job?.tech ?? mechanics.find((t) => !otherActive(t, null)) ?? mechanics[0];
  fillSelect(
    field("tech"),
    mechanics.map((t) => [t, t]),
    technician,
  );
  const allocating = !!job && job.bay === null && movable && target !== null;
  $("#order-heading").textContent = allocating
    ? "Alocar veículo em um box"
    : job
      ? "Ordem de serviço " + job.job
      : "Abrir ordem de serviço";
  $("#delete-job").hidden = !job;
  $("#save-job").textContent = allocating
    ? "Confirmar alocação"
    : job
      ? "Salvar OS"
      : "Abrir OS";
  dialog.querySelector(".order-extra").open = false;
  $("#form-error").textContent = "";
  openForm(dialog, {
    customer: job?.customer ?? "",
    model: job?.model ?? "",
    service: job?.service ?? "",
    tech: technician,
    bay,
    due: job?.due ?? isoDay() + "T17:00",
    make: job?.make ?? "",
    body: job?.body ?? "hatch",
    plate: job?.plate ?? "",
    parts: job?.parts != null ? job.parts / 100 : "",
    labor: job?.labor != null ? job.labor / 100 : "",
  });
  updateEstimate();
}
$("#new-job").onclick = () => {
  const free = tiles.findIndex((_, i) => !inBay(i));
  openOrder(null, free < 0 ? null : free);
};
$("#edit-job").onclick = () => openOrder(inBay(selected));
$("#from-queue").onclick = () => {
  const queue = desk.data.orders.filter(
    (o) => o.bay === null && o.status === "waiting",
  );
  if (queue.length === 1) {
    openOrder(queue[0], selected);
    return;
  }
  filter = "queue";
  $("#desk").open = true;
  renderDesk();
  document.querySelector('[data-filter="queue"]').focus();
};
orderForm.addEventListener(
  "invalid",
  (e) => {
    if (e.target.closest(".order-extra"))
      dialog.querySelector(".order-extra").open = true;
  },
  true,
);
field("parts").oninput = field("labor").oninput = updateEstimate;
orderForm.onsubmit = (e) => {
  e.preventDefault();
  const f = formValues(orderForm);
  if (!f) return;
  const prior = desk.data.orders.find((o) => o.job === editing);
  const bay = field("bay").disabled || f.bay === "queue" ? null : Number(f.bay);
  const plate = f.plate.replace(/[-\s]/g, "").toUpperCase();
  const issue = $("#form-error");
  if (plate && !/^[A-Z]{3}\d[A-Z0-9]\d{2}$/.test(plate)) {
    dialog.querySelector(".order-extra").open = true;
    issue.textContent = "Confira a placa. Use o formato ABC1234 ou ABC1D23.";
    field("plate").focus();
    return;
  }
  if (
    plate &&
    prior?.status !== "delivered" &&
    desk.data.orders.some(
      (o) => o.job !== editing && o.status !== "delivered" && o.plate === plate,
    )
  ) {
    dialog.querySelector(".order-extra").open = true;
    issue.textContent = "Já existe uma OS aberta para esta placa.";
    field("plate").focus();
    return;
  }
  if (bay !== null && inBay(bay) && inBay(bay).job !== editing) {
    issue.textContent = "O box está ocupado. Selecione outro local.";
    return;
  }
  if (prior?.status === "active" && otherActive(f.tech, editing)) {
    issue.textContent =
      f.tech + " já está em outro serviço. Selecione outro responsável.";
    return;
  }
  const details = {
    ...f,
    bay,
    plate,
    parts: moneyInput("parts"),
    labor: moneyInput("labor"),
  };
  const jobId = editing ?? desk.data.next;
  if (bay !== null) selected = bay;
  else {
    filter =
      prior?.status === "delivered"
        ? "delivered"
        : prior?.status === "ready"
          ? "ready"
          : "queue";
    $("#desk").open = true;
  }
  dialog.close();
  $("#job-feedback").textContent = "";
  desk.update(
    (data) => {
      if (prior)
        Object.assign(
          data.orders.find((o) => o.job === editing),
          details,
        );
      else
        data.orders.push({
          ...details,
          job: data.next++,
          status: "waiting",
          completed: "",
        });
    },
    "OS " + jobId + (prior ? " atualizada." : " aberta."),
  );
};
$("#delete-job").onclick = () => {
  const id = editing;
  dialog.close();
  $("#job-feedback").textContent = "";
  desk.update(
    (data) => {
      data.orders = data.orders.filter((o) => o.job !== id);
    },
    "OS " + id + " excluída.",
    true,
  );
};
render();
