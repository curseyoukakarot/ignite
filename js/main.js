/* ═══════════════════════════════════════════════════════════════
   IGNITEGTM — Charged with Intent
   GSAP choreography · ember particle field · 13s hero video loop
   ═══════════════════════════════════════════════════════════════ */

gsap.registerPlugin(ScrollTrigger);

// browser scroll restoration races ScrollTrigger's pin measurements on
// reload-mid-page — take over and start clean
if ("scrollRestoration" in history) history.scrollRestoration = "manual";
if (!location.hash) window.scrollTo(0, 0); // don't stomp deep links like /#ais
window.addEventListener("load", () => {
  ScrollTrigger.refresh();
  // deep links land instantly — refresh() would otherwise cancel the
  // browser's in-flight smooth anchor scroll and strand the page at the top
  if (location.hash) {
    const target = document.querySelector(location.hash);
    if (target) {
      document.documentElement.style.scrollBehavior = "auto";
      target.scrollIntoView();
      setTimeout(() => { document.documentElement.style.scrollBehavior = ""; }, 60);
    }
  }
});

const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const isFinePointer = window.matchMedia("(pointer: fine)").matches;

/* ─────────────── hero video: hard loop at 13s ─────────────── */

const heroVideo = document.getElementById("heroVideo");
const LOOP_AT = 13; // seconds — per spec

heroVideo.addEventListener("timeupdate", () => {
  if (heroVideo.currentTime >= LOOP_AT) {
    heroVideo.currentTime = 0.03;
    heroVideo.play().catch(() => {});
  }
});
heroVideo.addEventListener("ended", () => {
  heroVideo.currentTime = 0.03;
  heroVideo.play().catch(() => {});
});
// autoplay insurance (some browsers block until interaction)
const tryPlay = () => heroVideo.play().catch(() => {});
document.addEventListener("click", tryPlay, { once: true });
document.addEventListener("touchstart", tryPlay, { once: true });

/* ─────────────── split hero headline into chars ─────────────── */

document.querySelectorAll("[data-split]").forEach((el) => {
  const text = el.textContent;
  el.textContent = "";
  el.setAttribute("aria-hidden", "true");
  [...text].forEach((ch) => {
    const span = document.createElement("span");
    span.className = "char";
    span.textContent = ch === " " ? " " : ch;
    el.appendChild(span);
  });
});

/* ─────────────── preloader → hero entrance ─────────────── */

const preloader = document.getElementById("preloader");
const counter = { v: 0 };
const introTL = gsap.timeline();

introTL
  .to("#preloaderLogo", { opacity: 1, duration: 0.5, ease: "power2.out" })
  .fromTo("#preloaderLogo", { filter: "brightness(3)" }, {
    filter: "brightness(1)", duration: 0.45,
    ease: "rough({ strength: 3, points: 24, randomize: true })",
  }, "<")
  .to(counter, {
    v: 100, duration: 1.1, ease: "power2.inOut",
    onUpdate() {
      const n = Math.round(counter.v);
      document.getElementById("preloaderCount").textContent = String(n).padStart(2, "0");
      document.getElementById("preloaderBar").style.width = n + "%";
    },
  }, "-=0.2")
  .to(preloader, {
    yPercent: -100, duration: 0.7, ease: "power4.inOut",
    onComplete: () => preloader.remove(),
  }, "+=0.1")
  // headline chars rise out of the line masks
  .from(".hero__line--1 .char", {
    yPercent: 115, duration: 0.9, stagger: 0.035, ease: "power4.out",
  }, "-=0.35")
  .from(".hero__line--2 .char", {
    yPercent: 115, duration: 0.9, stagger: 0.03, ease: "power4.out",
  }, "-=0.75")
  .from(".ht-dot", {
    scale: 0, opacity: 0, duration: 0.4, ease: "back.out(3)",
  }, "-=0.3")
  .from("[data-hero-fade]", {
    y: 28, opacity: 0, duration: 0.8, stagger: 0.09, ease: "power3.out",
  }, "-=0.5");

if (prefersReducedMotion) {
  introTL.progress(1);
}

// failsafe: background tabs throttle rAF, which can trap the page behind
// the preloader — force-complete the intro if it hasn't finished in time
setTimeout(() => {
  if (document.getElementById("preloader")) introTL.progress(1);
}, 4500);
document.addEventListener("visibilitychange", () => {
  if (!document.hidden && document.getElementById("preloader") && introTL.time() > 0.1) {
    introTL.progress(1);
  }
});

/* ─────────────── ember particle canvas (hero) ─────────────── */

(function embers() {
  if (prefersReducedMotion) return;
  const canvas = document.getElementById("emberCanvas");
  const ctx = canvas.getContext("2d");
  let w, h, parts = [];
  const COLORS = ["#ffc501", "#ff8a00", "#ff3d00", "#ffe27a"];

  function resize() {
    w = canvas.width = canvas.offsetWidth;
    h = canvas.height = canvas.offsetHeight;
  }
  resize();
  window.addEventListener("resize", resize);

  function spawn() {
    return {
      x: Math.random() * w,
      y: h + 10,
      r: Math.random() * 2.2 + 0.5,
      vx: (Math.random() - 0.5) * 0.35,
      vy: -(Math.random() * 1.1 + 0.35),
      life: 1,
      decay: Math.random() * 0.004 + 0.0018,
      c: COLORS[(Math.random() * COLORS.length) | 0],
      flicker: Math.random() * Math.PI * 2,
    };
  }
  for (let i = 0; i < 70; i++) {
    const p = spawn();
    p.y = Math.random() * h;
    p.life = Math.random();
    parts.push(p);
  }

  let visible = true;
  new IntersectionObserver(([e]) => { visible = e.isIntersecting; })
    .observe(canvas);

  (function tick(t) {
    requestAnimationFrame(tick);
    if (!visible) return;
    ctx.clearRect(0, 0, w, h);
    for (const p of parts) {
      p.x += p.vx + Math.sin(t / 900 + p.flicker) * 0.18;
      p.y += p.vy;
      p.life -= p.decay;
      if (p.life <= 0 || p.y < -12) Object.assign(p, spawn());
      const a = p.life * (0.55 + 0.45 * Math.sin(t / 120 + p.flicker));
      ctx.globalAlpha = Math.max(0, a * 0.8);
      ctx.fillStyle = p.c;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  })(0);
})();

/* ─────────────── nav state + mobile menu ─────────────── */

const nav = document.getElementById("nav");
ScrollTrigger.create({
  start: 60,
  onUpdate: (self) => nav.classList.toggle("is-scrolled", self.scroll() > 60),
  onEnter: () => nav.classList.add("is-scrolled"),
  onLeaveBack: () => nav.classList.remove("is-scrolled"),
});

const burger = document.getElementById("navBurger");
const mobileMenu = document.getElementById("mobileMenu");
function toggleMenu(force) {
  const open = force !== undefined ? force : !mobileMenu.classList.contains("is-open");
  mobileMenu.classList.toggle("is-open", open);
  burger.classList.toggle("is-open", open);
  burger.setAttribute("aria-expanded", String(open));
  mobileMenu.setAttribute("aria-hidden", String(!open));
}
burger.addEventListener("click", () => toggleMenu());
mobileMenu.querySelectorAll("a").forEach((a) =>
  a.addEventListener("click", () => toggleMenu(false))
);

/* ─────────────── scroll progress bar ─────────────── */

gsap.to("#scrollProgress", {
  scaleX: 1,
  ease: "none",
  scrollTrigger: { start: 0, end: "max", scrub: 0.3 },
});

/* ─────────────── ticker marquee (seamless) ─────────────── */

(function ticker() {
  const track = document.getElementById("tickerTrack");
  const group = track.querySelector(".ticker__group");
  // clone until we cover 2x viewport for a seamless -50% loop
  const clones = Math.max(2, Math.ceil((window.innerWidth * 2) / group.offsetWidth));
  for (let i = 0; i < clones; i++) track.appendChild(group.cloneNode(true));
  const total = group.offsetWidth * Math.ceil((clones + 1) / 2);
  gsap.to(track, {
    x: -total,
    duration: total / 60,
    ease: "none",
    repeat: -1,
    modifiers: { x: (x) => (parseFloat(x) % total) + "px" },
  });
})();

/* ─────────────── generic reveals ─────────────── */

if (!prefersReducedMotion) {
  gsap.utils.toArray("[data-reveal]").forEach((el) => {
    gsap.from(el, {
      y: 44,
      opacity: 0,
      duration: 1,
      ease: "power3.out",
      // content stays visible until the tween actually plays — if animations
      // can't run (bg tab, reduced power, deep-link landings) nothing is lost
      immediateRender: false,
      scrollTrigger: { trigger: el, start: "top 86%", once: true },
    });
  });

  /* parallax accents */
  gsap.utils.toArray("[data-parallax]").forEach((el) => {
    gsap.to(el, {
      y: parseFloat(el.dataset.parallax || 40),
      ease: "none",
      scrollTrigger: { trigger: el, start: "top bottom", end: "bottom top", scrub: 1 },
    });
  });
}

/* ─────────────── events: ledger scrollspy ───────────────
   the jump-nav doubles as a live position indicator */

document.querySelectorAll("[data-spytarget]").forEach((el) => {
  ScrollTrigger.create({
    trigger: el,
    start: "top 55%",
    end: "bottom 55%",
    onToggle(self) {
      const line = document.querySelector(`.ledger__line[data-spy="${el.dataset.spytarget}"]`);
      if (line) line.classList.toggle("is-active", self.isActive);
    },
  });
});

/* ─────────────── stat count-ups ─────────────── */

gsap.utils.toArray("[data-count]").forEach((el) => {
  const target = parseInt(el.dataset.count, 10);
  const obj = { v: 0 };
  gsap.to(obj, {
    v: target,
    duration: 1.8,
    ease: "power2.out",
    scrollTrigger: { trigger: el, start: "top 88%", once: true },
    onUpdate() {
      el.textContent = Math.round(obj.v).toLocaleString("en-US");
    },
  });
});

/* ─────────────── studio reel: play in view ─────────────── */

const studioVideo = document.getElementById("studioVideo");
new IntersectionObserver(([e]) => {
  if (e.isIntersecting) studioVideo.play().catch(() => {});
  else studioVideo.pause();
}, { threshold: 0.35 }).observe(studioVideo);

/* ─────────────── showreel lightbox ─────────────── */

const reelLightbox = document.getElementById("reelLightbox");
const reelFull = document.getElementById("reelFull");
let reelLastFocus = null;

function openReel() {
  reelLastFocus = document.activeElement;
  reelLightbox.hidden = false;
  document.body.style.overflow = "hidden";
  studioVideo.pause();
  heroVideo.pause();
  reelFull.play().catch(() => {}); // user gesture — sound allowed
  reelLightbox.querySelector(".lightbox__close").focus();
  if (!prefersReducedMotion) {
    gsap.fromTo(".lightbox__body",
      { scale: 0.94, opacity: 0 },
      { scale: 1, opacity: 1, duration: 0.35, ease: "power3.out" });
    gsap.fromTo(".lightbox__backdrop", { opacity: 0 }, { opacity: 1, duration: 0.3 });
  }
}

function closeReel() {
  reelFull.pause();
  reelLightbox.hidden = true;
  document.body.style.overflow = "";
  heroVideo.play().catch(() => {});
  studioVideo.play().catch(() => {}); // observer re-pauses it if out of view
  if (reelLastFocus) reelLastFocus.focus();
}

document.getElementById("reelOpen").addEventListener("click", openReel);
reelLightbox.querySelectorAll("[data-lightbox-close]").forEach((el) =>
  el.addEventListener("click", closeReel)
);
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && !reelLightbox.hidden) closeReel();
});

/* ─────────────── magnetic buttons ─────────────── */

if (isFinePointer && !prefersReducedMotion) {
  document.querySelectorAll("[data-magnetic]").forEach((el) => {
    const strength = 18;
    el.addEventListener("mousemove", (e) => {
      const r = el.getBoundingClientRect();
      const x = ((e.clientX - r.left) / r.width - 0.5) * strength;
      const y = ((e.clientY - r.top) / r.height - 0.5) * strength;
      gsap.to(el, { x, y, duration: 0.4, ease: "power2.out" });
    });
    el.addEventListener("mouseleave", () =>
      gsap.to(el, { x: 0, y: 0, duration: 0.5, ease: "elastic.out(1, 0.4)" })
    );
  });
}

/* ─────────────── custom cursor ─────────────── */

if (isFinePointer && !prefersReducedMotion) {
  const dot = document.getElementById("cursor");
  const ring = document.getElementById("cursorRing");
  const setDotX = gsap.quickSetter(dot, "x", "px");
  const setDotY = gsap.quickSetter(dot, "y", "px");
  const ringX = gsap.quickTo(ring, "x", { duration: 0.35, ease: "power3" });
  const ringY = gsap.quickTo(ring, "y", { duration: 0.35, ease: "power3" });

  window.addEventListener("mousemove", (e) => {
    document.body.classList.add("has-mouse");
    setDotX(e.clientX); setDotY(e.clientY);
    ringX(e.clientX); ringY(e.clientY);
  });
  document.querySelectorAll("a, button, .pillar, .icard, .badge").forEach((el) => {
    el.addEventListener("mouseenter", () => ring.classList.add("is-hover"));
    el.addEventListener("mouseleave", () => ring.classList.remove("is-hover"));
  });
}

/* ─────────────── contact ───────────────
   The intake forms live at contact.ignitegtm.com (general / events /
   studio / advisory) — the homepage just links out to them. */

/* ─────────────── smooth anchor offset for fixed nav ─────────────── */

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
