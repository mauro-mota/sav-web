const products = {
  cartaz: { name: "Cartaz A3", size: "297 × 420 mm", unit: 200 },
  flyer: { name: "Panfleto A5", size: "148 × 210 mm", unit: 58 },
  postal: { name: "Postal A6", size: "105 × 148 mm", unit: 47 },
};
const papers = { fosco: 1, offset: 0.83, cartao: 1.35 };
const steps = ["Na fila", "Em impressão", "Pronto para retirada", "Entregue"];
const quote = $("#quote"),
  orders = $("#orders");
let editing = null;
function price(job) {
  const unit = Math.round(products[job.product].unit * papers[job.paper]);
  return { unit, print: unit * job.qty, total: 3500 + unit * job.qty };
}
const desk = localDesk(
  "dobra",
  () => ({
    next: 405,
    jobs: [
      {
        id: 404,
        client: "Livraria Banca",
        product: "postal",
        qty: 80,
        paper: "cartao",
        stage: 1,
      },
    ],
  }),
  render,
);
function currentQuote() {
  return Object.fromEntries(new FormData(quote));
}
function updatePrice() {
  const q = currentQuote(),
    valid = quote.elements.qty.validity.valid;
  const cost = price(q);
  $("#dimensions").textContent = products[q.product].size;
  $(".proof").dataset.product = q.product;
  $("#setup").textContent = brl(3500);
  $("#variable").textContent = valid ? brl(cost.print) : "—";
  $("#total").textContent = valid ? brl(cost.total) : "—";
  $("#convert").textContent =
    editing === null ? "Aprovar e gerar pedido" : "Salvar alterações";
}
function render() {
  $("#count").textContent = desk.data.jobs.length;
  const rows = desk.data.jobs.map((job) => {
    const li = node("li"),
      summary = node("div", undefined, "between"),
      actions = node("div", undefined, "job-actions");
    summary.append(
      node("b", "#" + job.id + " · " + job.client),
      node("b", brl(price(job).total)),
    );
    li.append(
      summary,
      node(
        "p",
        job.qty + " × " + products[job.product].name + " · " + steps[job.stage],
      ),
    );
    if (job.stage === 0)
      actions.append(
        press(
          "Editar pedido",
          () => {
            editing = job.id;
            for (const k of ["client", "paper", "product", "qty"])
              quote.elements[k].value = job[k];
            orders.close();
            updatePrice();
            quote.elements.client.focus();
          },
          "subtle",
        ),
      );
    if (job.stage < 3)
      actions.append(
        press(
          ["Iniciar impressão", "Marcar como pronto", "Registrar retirada"][
            job.stage
          ],
          () => {
            desk.update((s) => {
              s.jobs.find((j) => j.id === job.id).stage++;
            }, "Pedido atualizado.");
          },
          "outline",
        ),
      );
    actions.append(
      press(
        "Excluir",
        () => {
          if (editing === job.id) editing = null;
          desk.update(
            (s) => {
              s.jobs = s.jobs.filter((j) => j.id !== job.id);
            },
            "Pedido excluído.",
            true,
          );
          orders.close();
        },
        "subtle",
      ),
    );
    li.append(actions);
    return li;
  });
  $("#jobs").replaceChildren(...rows);
  if (!rows.length)
    $("#jobs").append(node("li", "Nenhum pedido na fila.", "empty"));
  if (
    editing !== null &&
    !desk.data.jobs.some((j) => j.id === editing && j.stage === 0)
  )
    editing = null;
  updatePrice();
}
quote.addEventListener("input", updatePrice);
quote.onsubmit = (e) => {
  e.preventDefault();
  const q = formValues(quote);
  if (!q) return;
  q.qty = Number(q.qty);
  const id = editing;
  editing = null;
  desk.update(
    (s) => {
      if (id === null) s.jobs.unshift({ ...q, id: s.next++, stage: 0 });
      else
        Object.assign(
          s.jobs.find((j) => j.id === id),
          q,
        );
    },
    id === null ? "Pedido enviado à fila da gráfica." : "Pedido atualizado.",
  );
  quote.reset();
  updatePrice();
  orders.showModal();
  orders.querySelector("h2").focus();
};
$("#open-orders").onclick = () => {
  orders.showModal();
  orders.querySelector("h2").focus();
};
render();
