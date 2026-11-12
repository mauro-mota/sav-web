"use strict";

// Demonstração local. Os campos ilustram o acesso de uma equipe fictícia.
const form = document.querySelector("#access-form");
const user = form.querySelector("#user");
const password = form.querySelector("#password");
const error = form.querySelector(".access-error");

form.addEventListener("submit", (event) => {
  event.preventDefault();
  if (user.value.trim() === user.defaultValue && password.value === password.defaultValue) {
    location.assign(form.dataset.target);
    return;
  }
  error.textContent = `Para testar, use ${user.defaultValue} e a senha ${password.defaultValue}.`;
  error.hidden = false;
});

form.addEventListener("input", () => {
  error.hidden = true;
});
