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

  // Carrossel de cases: rola sozinho; pausa no hover/toque/arraste, enquanto um vídeo toca com som e quando a seção está fora da tela.
  // No desktop também dá para arrastar com o mouse (no toque a rolagem já é nativa).
  const track = document.querySelector(".cases-track");
  if (track && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    let pos = track.scrollLeft, lastSet = pos, hover = false, pressing = false, focused = false, playing = false, onScreen = false, running = false, resumeAt = 0, prev = 0;
    let dragId = null, dragX = 0, dragStart = 0, dragged = false;
    const hold = (ms) => { resumeAt = Math.max(resumeAt, performance.now() + ms); };
    track.addEventListener("pointerenter", (event) => { if (event.pointerType === "mouse") hover = true; });
    track.addEventListener("pointerleave", () => { hover = false; });
    track.addEventListener("pointerdown", (event) => {
      pressing = true;
      if (event.pointerType !== "mouse" || event.button !== 0) return;
      dragId = event.pointerId; dragX = event.clientX; dragStart = track.scrollLeft; dragged = false;
    });
    track.addEventListener("pointermove", (event) => {
      if (event.pointerId !== dragId) return;
      const dx = event.clientX - dragX;
      if (!dragged && Math.abs(dx) < 4) return;
      if (!dragged) { dragged = true; track.classList.add("is-dragging"); track.setPointerCapture(dragId); }
      track.scrollLeft = dragStart - dx;
    });
    const release = (event) => {
      pressing = false; hold(4000);
      if (event.pointerId !== dragId) return;
      dragId = null; track.classList.remove("is-dragging");
      if (dragged) { pos = lastSet = track.scrollLeft; setTimeout(() => { dragged = false; }, 0); }
    };
    track.addEventListener("pointerup", release);
    track.addEventListener("pointercancel", release);
    // Depois de arrastar, o clique que fecha o gesto não chega ao player; um clique de verdade num case segura o carrossel por 2 min.
    track.addEventListener("click", (event) => {
      if (dragged) { dragged = false; event.preventDefault(); event.stopPropagation(); return; }
      if (event.target.closest(".case")) hold(120000);
    }, true);
    window.addEventListener("blur", () => { const active = document.activeElement; if (active && track.contains(active)) focused = true; });
    window.addEventListener("focus", () => { if (focused) { focused = false; hold(4000); } });
    // Vídeos embutidos (inclusive dentro de shadow DOM, como o player do VTurb): tocando com som = alguém assistindo.
    const mediaIn = (root, out) => {
      out.push(...root.querySelectorAll("video"));
      root.querySelectorAll("*").forEach((el) => { if (el.shadowRoot) mediaIn(el.shadowRoot, out); });
      return out;
    };
    const syncPlaying = () => {
      const was = playing;
      playing = mediaIn(track, []).some((v) => !v.paused && !v.ended && !v.muted);
      if (was && !playing) hold(4000);
    };
    setInterval(() => { if (onScreen) syncPlaying(); }, 500);
    const step = (now) => {
      if (!onScreen) { running = false; return; }
      const dt = Math.min(64, now - prev); prev = now;
      const max = track.scrollWidth - track.clientWidth;
      if (Math.abs(track.scrollLeft - lastSet) > 1) { pos = track.scrollLeft; hold(2500); }
      if (max > 0 && !hover && !pressing && !focused && !playing && now >= resumeAt) {
        pos += 40 * dt / 1000;
        if (pos >= max - 0.5) { pos = 0; hold(500); }
        track.scrollLeft = Math.round(pos);
      } else { pos = track.scrollLeft; }
      lastSet = track.scrollLeft;
      requestAnimationFrame(step);
    };
    const start = () => { if (running) return; running = true; prev = performance.now(); pos = lastSet = track.scrollLeft; requestAnimationFrame(step); };
    new IntersectionObserver((entries) => { onScreen = entries[0].isIntersecting; if (onScreen) start(); }, { threshold: 0 }).observe(track);
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
