(() => {
  "use strict";

  const config = window.SAVANNAH_CONFIG;
  document.querySelectorAll("[data-whatsapp]").forEach((link) => {
    if (config && /^\d{10,15}$/.test(config.whatsapp)) {
      const message = config.services?.[link.dataset.service] || config.message || "Olá! Quero conversar sobre um projeto.";
      link.href = `https://wa.me/${config.whatsapp}?text=${encodeURIComponent(message)}`;
    }
    link.setAttribute("aria-label", `${link.textContent.trim()} pelo WhatsApp (abre em nova aba)`);
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

  // Exibe o atalho móvel apenas quando as principais ações estão fora da tela.
  const mobileContact = document.querySelector(".mobile-contact");
  const heroAction = document.querySelector(".hero [data-whatsapp]");
  const contactAction = document.querySelector(".contact [data-whatsapp]");
  const footer = document.querySelector(".footer");
  const mascot = document.querySelector(".contact-mascot");
  if (!mobileContact || !heroAction || !contactAction || !footer || !("IntersectionObserver" in window)) return;

  const mobile = window.matchMedia("(max-width: 599px)");
  const visible = new Map([[heroAction, true], [contactAction, false], [footer, false]]);
  if (mascot) visible.set(mascot, false);
  const sync = () => {
    const show = mobile.matches && ![...visible.values()].some(Boolean);
    mobileContact.classList.toggle("is-visible", show);
    mobileContact.setAttribute("aria-hidden", String(!show));
    mobileContact.querySelector("a").tabIndex = show ? 0 : -1;
  };
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => visible.set(entry.target, entry.isIntersecting));
    sync();
  }, { threshold: 0 });
  [...visible.keys()].forEach((element) => observer.observe(element));
  if (mobile.addEventListener) mobile.addEventListener("change", sync);
  else mobile.addListener(sync);
})();
