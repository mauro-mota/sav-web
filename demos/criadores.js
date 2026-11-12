const dealDialog = $("#deal"),
  taskDialog = $("#task"),
  dealForm = dealDialog.querySelector("form"),
  taskForm = taskDialog.querySelector("form");
let dealEdit = null,
  taskEdit = null;
const initial = () => ({
  selected: "bica",
  deals: [
    {
      id: "bica",
      brand: "Café da Bica",
      title: "O café da manhã do bairro",
      fee: 320000,
      paid: 0,
      photo: true,
      tasks: [
        {
          id: "foto",
          title: "Fotos do novo cardápio",
          format: "Fotografia",
          due: isoDay(),
          status: "revisao",
          version: 2,
        },
        {
          id: "video",
          title: "Do balcão para a rua",
          format: "Reel",
          due: isoDay(2),
          status: "producao",
          version: 1,
        },
      ],
    },
    {
      id: "horta",
      brand: "Horta de Dentro",
      title: "Receitas de uma panela",
      fee: 190000,
      paid: 0,
      tasks: [
        {
          id: "receita",
          title: "Receita com legumes da estação",
          format: "Carrossel",
          due: isoDay(3),
          status: "producao",
          version: 1,
        },
      ],
    },
  ],
});
const desk = localDesk("intervalo", initial, render);
const current = () =>
  desk.data.deals.find((d) => d.id === desk.data.selected) ??
  desk.data.deals[0];
function changeDeal(change, message, undo = false) {
  const id = current().id;
  desk.update((s) => change(s.deals.find((d) => d.id === id)), message, undo);
}
const reviewDialog = $("#review"),
  reviewForm = reviewDialog.querySelector("form");
let reviewId = null,
  requestChanges = false;
function reviewTask(t, changes) {
  reviewId = t.id;
  requestChanges = changes;
  $("#review-title").textContent = changes ? "Pedir ajuste" : "Enviar versão";
  $("#review-task").textContent = t.title + " · v" + t.version;
  $("#confirm-review").textContent = changes
    ? "Solicitar ajuste"
    : "Enviar para aprovação";
  $("#revision-label").hidden = !changes;
  $("#link-label").hidden = changes;
  reviewForm.elements.note.required = changes;
  reviewForm.elements.note.disabled = !changes;
  reviewForm.elements.url.disabled = changes;
  reviewForm.elements.url.setCustomValidity("");
  openForm(reviewDialog, { note: "", url: t.url ?? "" });
}
reviewForm.elements.url.oninput = (e) => e.target.setCustomValidity("");
reviewForm.onsubmit = (e) => {
  e.preventDefault();
  const f = formValues(reviewForm);
  if (!f) return;
  const url = reviewForm.elements.url;
  if (!requestChanges && f.url && !/^https?:\/\//i.test(f.url)) {
    url.setCustomValidity("Use um link iniciado por https:// ou http://.");
    url.reportValidity();
    return;
  }
  reviewDialog.close();
  changeDeal(
    (d) => {
      const task = d.tasks.find((item) => item.id === reviewId);
      if (requestChanges) {
        task.version++;
        task.note = f.note;
        task.status = "producao";
      } else {
        task.url = f.url;
        task.note = "";
        task.status = "revisao";
      }
    },
    requestChanges
      ? "Ajuste registrado na próxima versão."
      : "Versão enviada para aprovação.",
  );
};
function approve(t) {
  changeDeal((d) => {
    d.tasks.find((item) => item.id === t.id).status = "aprovada";
  }, "Entrega aprovada.");
}
function render() {
  const d = current();
  fillSelect(
    $("#partner"),
    desk.data.deals.map((x) => [x.id, x.brand]),
    d?.id,
  );
  $("#partner").disabled = !d;
  $("#project").hidden = !d;
  $("#no-partner").hidden = !!d;
  if (!d) return;
  $("#brand").textContent = d.brand;
  $("#project-name").textContent = d.title;
  $("#fee").textContent = brl(d.fee);
  $("#photo-frame").hidden = !d.photo;
  $("#brief-front").hidden = !!d.photo;
  $("#brief-title").textContent = d.brand;
  const first = d.tasks.findIndex((t) => t.status !== "aprovada");
  $("#task-list").replaceChildren(
    ...d.tasks.map((t, i) => {
      const li = node("li"),
        heading = node("div", undefined, "between"),
        main = node("div", undefined, "task-body");
      const blocked = first !== -1 && i > first && t.status !== "aprovada";
      const status = blocked
        ? "Aguarda entrega anterior"
        : {
            aprovada: "Aprovada",
            revisao: "Em aprovação",
            producao: "Em produção",
          }[t.status];
      li.dataset.state = blocked ? "fila" : t.status;
      heading.append(
        node("small", t.format + " / " + niceDay(t.due)),
        press("Editar", () => openTask(t), "subtle"),
      );
      main.append(node("h3", t.title), node("p", status + " · v" + t.version));
      if (t.note && t.status === "producao")
        main.append(node("p", "Ajuste: " + t.note, "change-note"));
      if (t.url && t.status !== "producao") {
        const link = node("a", "Abrir versão " + t.version, "version-link");
        link.href = t.url;
        link.target = "_blank";
        link.rel = "noopener noreferrer";
        main.append(link);
      }
      li.append(heading, main);
      if (!blocked && t.status === "revisao")
        li.append(
          press("Aprovar entrega", () => approve(t), "primary"),
          press("Pedir ajuste", () => reviewTask(t, true), "subtle"),
        );
      if (!blocked && t.status === "producao")
        li.append(
          press("Enviar para aprovação", () => reviewTask(t, false), "primary"),
        );
      return li;
    }),
  );
  if (!d.tasks.length)
    $("#task-list").append(
      node("li", "Adicione a primeira entrega do contrato.", "empty"),
    );
  const eligible = d.tasks.length > 0 && first === -1;
  const balance = d.fee - d.paid;
  $("#pay-status").textContent =
    balance === 0 && d.paid > 0
      ? "Recebido"
      : !eligible
        ? "Após aprovação"
        : balance > 0
          ? "A receber"
          : "Sem cobrança";
  $("#pay").hidden = !eligible || balance <= 0;
}
function openDeal(d) {
  dealEdit = d?.id ?? null;
  dealDialog.querySelector("h2").textContent = d
    ? "Editar parceria"
    : "Nova parceria";
  dealDialog.querySelector(".danger").hidden = !d;
  openForm(dealDialog, {
    brand: d?.brand ?? "",
    title: d?.title ?? "",
    fee: (d?.fee ?? 0) / 100,
  });
  dealForm.elements.fee.min = (d?.paid ?? 0) / 100;
}
function openTask(t) {
  taskEdit = t?.id ?? null;
  taskDialog.querySelector("h2").textContent = t
    ? "Editar entrega"
    : "Nova entrega";
  taskDialog.querySelector(".danger").hidden = !t;
  openForm(taskDialog, {
    title: t?.title ?? "",
    format: t?.format ?? "Reel",
    due: t?.due ?? isoDay(1),
  });
}
$("#partner").onchange = (e) =>
  desk.update((s) => {
    s.selected = e.target.value;
  }, "Parceria selecionada.");
$("#new-partner").onclick = () => openDeal(null);
$("#edit-partner").onclick = () => openDeal(current());
$("#new-task").onclick = () => openTask(null);
$("#pay").onclick = () =>
  changeDeal((d) => {
    d.paid = d.fee;
  }, "Recebimento registrado.");
dealForm.onsubmit = (e) => {
  e.preventDefault();
  const f = formValues(dealForm);
  if (!f) return;
  f.fee = Math.round(Number(f.fee) * 100);
  dealDialog.close();
  desk.update((s) => {
    if (dealEdit)
      Object.assign(
        s.deals.find((d) => d.id === dealEdit),
        f,
      );
    else {
      const id = uid();
      s.selected = id;
      s.deals.push({ ...f, id, paid: 0, tasks: [] });
    }
  }, "Parceria salva.");
};
taskForm.onsubmit = (e) => {
  e.preventDefault();
  const f = formValues(taskForm);
  if (!f) return;
  taskDialog.close();
  changeDeal((d) => {
    if (taskEdit)
      Object.assign(
        d.tasks.find((t) => t.id === taskEdit),
        f,
      );
    else d.tasks.push({ ...f, id: uid(), version: 1, status: "producao" });
  }, "Entrega salva.");
};
dealDialog.querySelector(".danger").onclick = () => {
  dealDialog.close();
  desk.update(
    (s) => {
      s.deals = s.deals.filter((d) => d.id !== dealEdit);
      s.selected = s.deals[0]?.id ?? "";
    },
    "Parceria e entregas excluídas.",
    true,
  );
};
taskDialog.querySelector(".danger").onclick = () => {
  taskDialog.close();
  changeDeal(
    (d) => {
      d.tasks = d.tasks.filter((t) => t.id !== taskEdit);
    },
    "Entrega excluída.",
    true,
  );
};
render();
