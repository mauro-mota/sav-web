(() => {
  "use strict";

  const config = window.SAVANNAH_CONFIG;
  document.querySelectorAll("[data-whatsapp]").forEach((link) => {
    if (config && /^\d{10,15}$/.test(config.whatsapp)) {
      const message = config.services?.[link.dataset.service] || config.message || "Olá! Quero conversar sobre um projeto.";
      link.href = `https://wa.me/${config.whatsapp}?text=${encodeURIComponent(message)}`;
    }
    if (!link.hasAttribute("aria-label")) {
      link.setAttribute("aria-label", `${link.textContent.trim()} pelo WhatsApp (abre em nova aba)`);
    }
  });

  const year = document.getElementById("year");
  if (year) year.textContent = new Date().getFullYear();

  // Menu hambúrguer (todas as telas): abre/fecha, fecha ao navegar, no Esc e ao clicar fora.
  const header = document.querySelector(".header");
  const toggle = document.querySelector(".menu-toggle");
  if (header && toggle) {
    const setOpen = (open) => {
      header.classList.toggle("is-open", open);
      toggle.setAttribute("aria-expanded", String(open));
      toggle.setAttribute("aria-label", open ? "Fechar menu" : "Abrir menu");
    };
    toggle.addEventListener("click", () => setOpen(!header.classList.contains("is-open")));
    header.querySelectorAll(".menu a").forEach((link) => link.addEventListener("click", () => setOpen(false)));
    document.addEventListener("keydown", (event) => { if (event.key === "Escape") setOpen(false); });
    document.addEventListener("click", (event) => {
      if (header.classList.contains("is-open") && !header.contains(event.target)) setOpen(false);
    });
  }

  // Vídeo do Zé no hero: troca 1:1 / 16:9 conforme a tela, só toca quando visível, respeita reduzir movimento / economia de dados.
  const loft = document.querySelector(".ze-tech");
  const loftVideo = loft && loft.querySelector("video");
  if (loft && loftVideo) {
    const base = loft.dataset.assets, mobile = matchMedia("(max-width:767px)"), reduced = matchMedia("(prefers-reduced-motion: reduce)");
    const conn = navigator.connection; let loaded = "", visible = false;
    const update = () => {
      const size = mobile.matches ? "mobile" : "desktop";
      loftVideo.poster = base + "poster-" + size + ".jpg";
      if (reduced.matches || (conn && conn.saveData) || !visible || document.hidden) { loftVideo.pause(); return; }
      if (size !== loaded) {
        loftVideo.pause(); loftVideo.querySelectorAll("source").forEach((s) => s.remove());
        [["webm", "video/webm"], ["mp4", "video/mp4"]].forEach(([ext, type]) => { const s = document.createElement("source"); s.src = base + "ze-tech-" + size + "." + ext; s.type = type; loftVideo.append(s); });
        loaded = size; loftVideo.load();
      }
      loftVideo.muted = true; loftVideo.play().catch(() => {});
    };
    new IntersectionObserver((entries) => { visible = entries[0].isIntersecting; update(); }, { threshold: 0.05 }).observe(loft);
    mobile.addEventListener("change", update); reduced.addEventListener("change", update);
    document.addEventListener("visibilitychange", update);
    update();
  }

  // Zé no balcão: AVIF animado (cerca de metade do peso) onde é confiável. Safari e iOS seguem no WebP até o WebKit corrigir o AVIF animado (bug 322274).
  // Os caminhos vêm do próprio <picture> (troca .webp por .avif); a imagem é lazy, então a escolha acontece antes de qualquer download.
  const mascotPicture = document.querySelector(".contact-mascot picture");
  const ua = navigator.userAgent;
  const webkitOnly = /iPhone|iPad|iPod/.test(ua) || (/Safari\//.test(ua) && !/Chrome\/|Chromium\/|Edg\/|OPR\/|Firefox\//.test(ua));
  if (mascotPicture && !webkitOnly) {
    const animated = [...mascotPicture.querySelectorAll("source, img")].filter((el) => !(el.getAttribute("media") || "").includes("reduced-motion"));
    animated.forEach((el) => {
      const source = document.createElement("source");
      const media = el.getAttribute("media");
      if (media) source.media = media;
      source.type = "image/avif";
      source.srcset = (el.getAttribute("srcset") || el.getAttribute("src")).replace(/\.webp$/, ".avif");
      source.setAttribute("width", el.getAttribute("width")); source.setAttribute("height", el.getAttribute("height"));
      mascotPicture.insertBefore(source, animated[0]);
    });
  }

  const steps = document.querySelector(".process-list");
  if (steps && "IntersectionObserver" in window) {
    const trail = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return;
      steps.classList.add("has-entered");
      trail.disconnect();
    }, { threshold: 0.15 });
    trail.observe(steps);
  }

  // O contato específico do sistema tem prioridade quando o card está na tela.
  const mobileContact = document.querySelector(".mobile-contact");
  if (!mobileContact || !("IntersectionObserver" in window)) return;

  const mobile = window.matchMedia("(max-width: 599px)");
  const alternatives = document.querySelectorAll("main [data-whatsapp], .contact-mascot, .footer");
  const visible = new Set();
  const sync = () => {
    const show = mobile.matches && visible.size === 0;
    mobileContact.classList.toggle("is-visible", show);
    mobileContact.setAttribute("aria-hidden", String(!show));
    mobileContact.querySelector("a").tabIndex = show ? 0 : -1;
  };
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) visible.add(entry.target);
      else visible.delete(entry.target);
    });
    sync();
  }, { threshold: 0 });
  alternatives.forEach((element) => observer.observe(element));
  if (mobile.addEventListener) mobile.addEventListener("change", sync);
  else mobile.addListener(sync);
})();

// Fichas de sistemas. O trilho também permite rolagem por toque e trackpad sem JavaScript.
(() => {
  const track = document.getElementById("solutions-track");
  if (!track) return;
  const section = track.closest("section");
  const cards = [...track.querySelectorAll(".solution-card")];
  const arrows = section.querySelector(".solutions-arrows");
  const pages = section.querySelector(".solutions-pages");
  const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)");
  let requestedIndex = null;
  let drag = null;

  function nearestIndex() {
    const left = track.scrollLeft;
    return cards.reduce((best, card, index) =>
      Math.abs(card.offsetLeft - left) < Math.abs(cards[best].offsetLeft - left) ? index : best, 0);
  }

  function goTo(index) {
    requestedIndex = (index + cards.length) % cards.length;
    track.scrollTo({ left: cards[requestedIndex].offsetLeft,
      behavior: reducedMotion.matches ? "instant" : "smooth" });
  }

  const dots = cards.map((card, index) => {
    const dot = document.createElement("button");
    dot.type = "button";
    dot.setAttribute("aria-label", card.querySelector("h3").firstChild.textContent);
    dot.setAttribute("aria-controls", track.id);
    dot.addEventListener("click", () => goTo(index));
    pages.append(dot);
    return dot;
  });

  function sync() {
    const current = nearestIndex();
    dots.forEach((dot, index) => dot.setAttribute("aria-current", String(index === current)));
  }
  arrows.querySelectorAll("button").forEach(button => {
    button.addEventListener("click", () => goTo((requestedIndex ?? nearestIndex()) + Number(button.dataset.step)));
  });
  track.addEventListener("keydown", event => {
    if (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return;
    const index = requestedIndex ?? nearestIndex();
    const destination = { ArrowLeft: index - 1, ArrowRight: index + 1, Home: 0, End: cards.length - 1 };
    if (!(event.key in destination)) return;
    event.preventDefault();
    track.focus({ preventScroll: true });
    goTo(destination[event.key]);
  });
  track.addEventListener("scroll", sync, { passive: true });
  track.addEventListener("scrollend", () => { requestedIndex = null; });
  track.addEventListener("wheel", () => { requestedIndex = null; }, { passive: true });
  track.addEventListener("focusin", event => {
    if (event.target.closest(".solution-card")) requestedIndex = null;
  });

  // Nas extremidades, um novo deslize horizontal continua a partir da outra ponta.
  let touchEdge = null;
  track.addEventListener("touchstart", event => {
    touchEdge = null;
    if (event.touches.length !== 1) return;
    const index = nearestIndex();
    if ((index === 0 || index === cards.length - 1) && Math.abs(cards[index].offsetLeft - track.scrollLeft) < 2) {
      const touch = event.touches[0];
      touchEdge = { x: touch.clientX, y: touch.clientY, index };
    }
  }, { passive: true });
  track.addEventListener("touchcancel", () => { touchEdge = null; });
  track.addEventListener("touchend", event => {
    if (!touchEdge) return;
    const touch = event.changedTouches[0];
    const dx = touch.clientX - touchEdge.x;
    if (Math.abs(dx) > 55 && Math.abs(dx) > Math.abs(touch.clientY - touchEdge.y) * 1.5) {
      if (touchEdge.index === 0 && dx > 0) goTo(-1);
      if (touchEdge.index === cards.length - 1 && dx < 0) goTo(0);
    }
    touchEdge = null;
  }, { passive: true });

  // O navegador já cuida do gesto no celular. Com mouse, distinguir arraste de clique nos links.
  track.addEventListener("dragstart", event => event.preventDefault());
  track.addEventListener("pointerdown", event => {
    requestedIndex = null;
    if (event.pointerType !== "mouse" || event.button !== 0) return;
    drag = { x: event.clientX, left: track.scrollLeft, index: nearestIndex(), active: false };
  });
  track.addEventListener("pointermove", event => {
    if (!drag || event.pointerType !== "mouse") return;
    if (!event.buttons) { drag = null; return; }
    const dx = event.clientX - drag.x;
    if (!drag.active && Math.abs(dx) < 7) return;
    if (!drag.active) {
      track.setPointerCapture(event.pointerId);
      track.classList.add("is-dragging");
      drag.active = true;
    }
    track.scrollLeft = drag.left - dx;
  });
  function finishDrag(event) {
    if (!drag) return;
    if (drag.active) {
      const dx = event.clientX - drag.x;
      let target = nearestIndex();
      if (event.type === "pointerup" && target === drag.index && Math.abs(dx) > 45) {
        target -= Math.sign(dx);
      }
      track.classList.remove("is-dragging");
      goTo(target);
    }
    drag = null;
  }
  track.addEventListener("pointerup", finishDrag);
  track.addEventListener("pointercancel", finishDrag);
  track.addEventListener("pointerleave", () => { if (!drag?.active) drag = null; });
  if ("ResizeObserver" in window) new ResizeObserver(sync).observe(track);
  sync();
  arrows.hidden = pages.hidden = false;
})();
