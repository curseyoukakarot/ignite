/* ═══════════════════════════════════════════════════════════════
   IGNITEGTM - shared sub-page behaviors (events/studio/advisory/team)
   Everything is null-safe: pages opt in by including the markup.
   ═══════════════════════════════════════════════════════════════ */

gsap.registerPlugin(ScrollTrigger);

const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const isFinePointer = window.matchMedia("(pointer: fine)").matches;

if ("scrollRestoration" in history) history.scrollRestoration = "manual";
if (!location.hash) window.scrollTo(0, 0);
window.addEventListener("load", () => {
  ScrollTrigger.refresh();
  if (location.hash) {
    const target = document.querySelector(location.hash);
    if (target) {
      document.documentElement.style.scrollBehavior = "auto";
      target.scrollIntoView();
      setTimeout(() => { document.documentElement.style.scrollBehavior = ""; }, 60);
    }
  }
});

/* page entrance is pure CSS (pages.css .page-hero animation) - compositor
   animations survive throttled rAF; a GSAP entrance here strands the hero
   at opacity 0 in background tabs */

/* ─────────────── nav state + mobile menu ─────────────── */

const nav = document.getElementById("nav");
if (nav) {
  ScrollTrigger.create({
    start: 60,
    onUpdate: (self) => nav.classList.toggle("is-scrolled", self.scroll() > 60),
    onEnter: () => nav.classList.add("is-scrolled"),
    onLeaveBack: () => nav.classList.remove("is-scrolled"),
  });
}

const burger = document.getElementById("navBurger");
const mobileMenu = document.getElementById("mobileMenu");
if (burger && mobileMenu) {
  const toggleMenu = (force) => {
    const open = force !== undefined ? force : !mobileMenu.classList.contains("is-open");
    mobileMenu.classList.toggle("is-open", open);
    burger.classList.toggle("is-open", open);
    burger.setAttribute("aria-expanded", String(open));
    mobileMenu.setAttribute("aria-hidden", String(!open));
  };
  burger.addEventListener("click", () => toggleMenu());
  mobileMenu.querySelectorAll("a").forEach((a) => a.addEventListener("click", () => toggleMenu(false)));
}

/* ─────────────── scroll progress ─────────────── */

if (document.getElementById("scrollProgress")) {
  gsap.to("#scrollProgress", {
    scaleX: 1, ease: "none",
    scrollTrigger: { start: 0, end: "max", scrub: 0.3 },
  });
}

/* ─────────────── reveals / parallax / counts ─────────────── */

if (!prefersReducedMotion) {
  /* editorial spread images wipe in from their bleed edge */
  gsap.utils.toArray("[data-reveal-media]").forEach((el) => {
    const from = el.dataset.revealMedia === "left" ? "inset(0 100% 0 0)" : "inset(0 0 0 100%)";
    gsap.from(el, {
      clipPath: from, duration: 1.1, ease: "power4.out",
      immediateRender: false,
      scrollTrigger: { trigger: el, start: "top 75%", once: true },
    });
  });

  gsap.utils.toArray("[data-reveal]").forEach((el) => {
    gsap.from(el, {
      y: 44, opacity: 0, duration: 1, ease: "power3.out",
      immediateRender: false,
      scrollTrigger: { trigger: el, start: "top 86%", once: true },
    });
  });

  gsap.utils.toArray("[data-parallax]").forEach((el) => {
    gsap.to(el, {
      y: parseFloat(el.dataset.parallax || 40), ease: "none",
      scrollTrigger: { trigger: el, start: "top bottom", end: "bottom top", scrub: 1 },
    });
  });
}

gsap.utils.toArray("[data-count]").forEach((el) => {
  const target = parseInt(el.dataset.count, 10);
  if (prefersReducedMotion) {
    el.textContent = target.toLocaleString("en-US");
    return;
  }
  const obj = { v: 0 };
  gsap.to(obj, {
    v: target, duration: 1.8, ease: "power2.out",
    scrollTrigger: { trigger: el, start: "top 88%", once: true },
    onUpdate() { el.textContent = Math.round(obj.v).toLocaleString("en-US"); },
  });
});

/* ─────────────── in-view autoplay for muted videos ─────────────── */

document.querySelectorAll("video[data-inview-play]").forEach((v) => {
  new IntersectionObserver(([e]) => {
    if (e.isIntersecting) v.play().catch(() => {});
    else v.pause();
  }, { threshold: 0.3 }).observe(v);
});

/* ─────────────── lightbox (any page with #reelLightbox) ─────────────── */

const reelLightbox = document.getElementById("reelLightbox");
if (reelLightbox) {
  const reelFull = document.getElementById("reelFull");
  const openBtns = document.querySelectorAll("[data-lightbox-open]");
  const defaultSrc = reelFull.getAttribute("src");
  const defaultPoster = reelFull.getAttribute("poster") || "";
  let lastFocus = null;

  const openReel = (src, poster) => {
    // portfolio tiles carry data-video/data-poster; default is the showreel
    const want = src || defaultSrc;
    if (reelFull.getAttribute("src") !== want) {
      reelFull.poster = poster || defaultPoster;
      reelFull.src = want;
      reelFull.load();
    }
    lastFocus = document.activeElement;
    reelLightbox.hidden = false;
    document.body.style.overflow = "hidden";
    document.querySelectorAll("video[data-inview-play]").forEach((v) => v.pause());
    reelFull.play().catch(() => {});
    reelLightbox.querySelector(".lightbox__close").focus();
    if (!prefersReducedMotion) {
      gsap.fromTo(".lightbox__body", { scale: 0.94, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.35, ease: "power3.out" });
      gsap.fromTo(".lightbox__backdrop", { opacity: 0 }, { opacity: 1, duration: 0.3 });
    }
  };
  const closeReel = () => {
    reelFull.pause();
    reelLightbox.hidden = true;
    document.body.style.overflow = "";
    document.querySelectorAll("video[data-inview-play]").forEach((v) => v.play().catch(() => {}));
    if (lastFocus) lastFocus.focus();
  };

  openBtns.forEach((b) => b.addEventListener("click", () => openReel(b.dataset.video, b.dataset.poster)));
  reelLightbox.querySelectorAll("[data-lightbox-close]").forEach((el) => el.addEventListener("click", closeReel));
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !reelLightbox.hidden) closeReel();
  });
}

/* ─────────────── stackmap (advisory): interactive stack topology ─────────────── */

const stackmap = document.getElementById("stackmap");
if (stackmap) {
  stackmap.classList.add("js-on");
  const pills = [...stackmap.querySelectorAll(".stackmap__pill")];
  const plates = [...stackmap.querySelectorAll(".plate")];
  const panels = [...stackmap.querySelectorAll(".stackmap__panel")];
  const order = pills.map((p) => p.dataset.layer);
  let userTookOver = false;
  let current = "software";

  const select = (layer) => {
    current = layer;
    pills.forEach((p) => {
      const on = p.dataset.layer === layer;
      p.classList.toggle("is-active", on);
      p.setAttribute("aria-selected", String(on));
    });
    plates.forEach((pl) => pl.classList.toggle("is-active", pl.dataset.layer === layer));
    panels.forEach((pn) => pn.classList.toggle("is-active", pn.id === "panel-" + layer));
    const active = stackmap.querySelector(".stackmap__panel.is-active");
    if (active && !prefersReducedMotion) {
      gsap.fromTo(active, { y: 10, opacity: 0 }, { y: 0, opacity: 1, duration: 0.4, ease: "power2.out" });
    }
  };
  select(current);

  const takeOver = (layer) => { userTookOver = true; select(layer); };
  pills.forEach((p) => p.addEventListener("click", () => takeOver(p.dataset.layer)));
  plates.forEach((pl) => pl.addEventListener("click", () => takeOver(pl.dataset.layer)));

  // arrow-key support on the tablist
  stackmap.querySelector(".stackmap__pills").addEventListener("keydown", (e) => {
    if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
    e.preventDefault();
    const i = order.indexOf(current);
    const next = order[(i + (e.key === "ArrowRight" ? 1 : order.length - 1)) % order.length];
    takeOver(next);
    pills.find((p) => p.dataset.layer === next).focus();
  });

  // auto-cycle until the visitor takes over - only while in view
  if (!prefersReducedMotion) {
    let inView = false;
    new IntersectionObserver(([e]) => { inView = e.isIntersecting; }, { threshold: 0.3 }).observe(stackmap);
    setInterval(() => {
      if (userTookOver || !inView || document.hidden) return;
      select(order[(order.indexOf(current) + 1) % order.length]);
    }, 4000);
  }
}

/* ─────────────── magnetic buttons + cursor ─────────────── */

if (isFinePointer && !prefersReducedMotion) {
  document.querySelectorAll("[data-magnetic]").forEach((el) => {
    const strength = 18;
    el.addEventListener("mousemove", (e) => {
      const r = el.getBoundingClientRect();
      gsap.to(el, {
        x: ((e.clientX - r.left) / r.width - 0.5) * strength,
        y: ((e.clientY - r.top) / r.height - 0.5) * strength,
        duration: 0.4, ease: "power2.out",
      });
    });
    el.addEventListener("mouseleave", () => gsap.to(el, { x: 0, y: 0, duration: 0.5, ease: "elastic.out(1, 0.4)" }));
  });

  const dot = document.getElementById("cursor");
  const ring = document.getElementById("cursorRing");
  if (dot && ring) {
    const setDotX = gsap.quickSetter(dot, "x", "px");
    const setDotY = gsap.quickSetter(dot, "y", "px");
    const ringX = gsap.quickTo(ring, "x", { duration: 0.35, ease: "power3" });
    const ringY = gsap.quickTo(ring, "y", { duration: 0.35, ease: "power3" });
    window.addEventListener("mousemove", (e) => {
      document.body.classList.add("has-mouse");
      setDotX(e.clientX); setDotY(e.clientY);
      ringX(e.clientX); ringY(e.clientY);
    });
    document.querySelectorAll("a, button, .poster, .member, .icard").forEach((el) => {
      el.addEventListener("mouseenter", () => ring.classList.add("is-hover"));
      el.addEventListener("mouseleave", () => ring.classList.remove("is-hover"));
    });
  }
}

/* ─────────────── smooth same-page anchors ─────────────── */

document.querySelectorAll('a[href^="#"]').forEach((a) => {
  a.addEventListener("click", (e) => {
    const id = a.getAttribute("href");
    if (id.length < 2) return;
    const target = document.querySelector(id);
    if (!target) return;
    e.preventDefault();
    const y = target.getBoundingClientRect().top + window.scrollY - 70;
    window.scrollTo({ top: y, behavior: prefersReducedMotion ? "auto" : "smooth" });
  });
});
