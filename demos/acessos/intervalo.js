"use strict";

const proof = document.querySelector("#proof-image");
const frames = document.querySelectorAll(".frames button");

for (const frame of frames) {
  frame.addEventListener("click", () => {
    for (const other of frames) {
      other.setAttribute("aria-pressed", String(frame === other));
    }
    proof.src = frame.querySelector("img").src;
    proof.alt = frame.dataset.alt;
  });
}
