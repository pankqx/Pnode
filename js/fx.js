/* Pnode celebrations: particle bursts when you earn XP and a full-screen moment when you level up.
   Respects prefers-reduced-motion. Exposes window.PNODE_FX = { burst(x, y, n), levelUp(name), pointer }. */
(function () {
  const reduced = () => window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const pointer = { x: window.innerWidth / 2, y: window.innerHeight * 0.4, at: 0 };
  window.addEventListener("pointerdown", (e) => { pointer.x = e.clientX; pointer.y = e.clientY; pointer.at = Date.now(); }, { passive: true, capture: true });

  let cvs, ctx, parts = [], raf = 0;
  function colors() {
    const cs = getComputedStyle(document.documentElement);
    return ["--lit", "--mint", "--sky", "--plum", "--lit"].map((v) => cs.getPropertyValue(v).trim() || "#F5B83D");
  }
  function ensure() {
    if (cvs) return;
    cvs = document.createElement("canvas");
    cvs.className = "fx-canvas";
    cvs.setAttribute("aria-hidden", "true");
    document.body.appendChild(cvs);
    ctx = cvs.getContext("2d");
    const size = () => { const d = Math.min(2, window.devicePixelRatio || 1); cvs.width = innerWidth * d; cvs.height = innerHeight * d; ctx.setTransform(d, 0, 0, d, 0, 0); };
    size();
    window.addEventListener("resize", size);
  }
  function star(x, y, r, rot) {
    ctx.beginPath();
    for (let i = 0; i < 10; i++) {
      const a = rot + (i * Math.PI) / 5, rr = i % 2 ? r * 0.45 : r;
      ctx.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr);
    }
    ctx.closePath();
    ctx.fill();
  }
  function tick() {
    ctx.clearRect(0, 0, innerWidth, innerHeight);
    parts = parts.filter((p) => p.life > 0);
    for (const p of parts) {
      p.vy += p.g; p.vx *= 0.985; p.vy *= 0.985;
      p.x += p.vx; p.y += p.vy; p.rot += p.vr; p.life -= 1;
      ctx.globalAlpha = Math.min(1, p.life / 25);
      ctx.fillStyle = p.c;
      if (p.shape === "star") star(p.x, p.y, p.r, p.rot);
      else if (p.shape === "ring") { ctx.strokeStyle = p.c; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(p.x, p.y, p.r * (1 + (60 - p.life) / 12), 0, 7); ctx.stroke(); }
      else { ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, 7); ctx.fill(); }
    }
    ctx.globalAlpha = 1;
    if (parts.length) raf = requestAnimationFrame(tick);
    else { raf = 0; ctx.clearRect(0, 0, innerWidth, innerHeight); }
  }
  function burst(x, y, n) {
    if (reduced()) return;
    ensure();
    if (x == null) { const fresh = Date.now() - pointer.at < 1500; x = fresh ? pointer.x : innerWidth / 2; y = fresh ? pointer.y : innerHeight - 90; }
    const C = colors();
    n = n || 34;
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2, s = 2 + Math.random() * 5.5;
      parts.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s - 2.5, g: 0.13, r: 2 + Math.random() * 3.5, rot: Math.random() * 6, vr: (Math.random() - 0.5) * 0.3, life: 50 + Math.random() * 35, c: C[i % C.length], shape: i % 3 === 0 ? "star" : "dot" });
    }
    parts.push({ x, y, vx: 0, vy: 0, g: 0, r: 8, rot: 0, vr: 0, life: 60, c: C[0], shape: "ring" });
    if (!raf) raf = requestAnimationFrame(tick);
  }
  function levelUp(name) {
    const el = document.createElement("div");
    el.className = "fx-level";
    el.setAttribute("role", "status");
    el.innerHTML = `<div class="fx-level-card"><div class="fx-level-kick">Level up</div><div class="fx-level-name"></div><div class="fx-level-sub">Every day you show up, the sky gets brighter.</div></div>`;
    el.querySelector(".fx-level-name").textContent = name;
    document.body.appendChild(el);
    requestAnimationFrame(() => el.classList.add("on"));
    if (!reduced()) {
      const cx = innerWidth / 2, cy = innerHeight / 2;
      burst(cx, cy, 70);
      setTimeout(() => { burst(cx - 110, cy - 60, 30); burst(cx + 110, cy - 60, 30); }, 260);
    }
    const close = () => { el.classList.remove("on"); setTimeout(() => el.remove(), 400); };
    el.addEventListener("click", close);
    setTimeout(close, 3200);
  }
  window.PNODE_FX = { burst, levelUp, pointer };
})();

/* Cursor spotlight on cards: sets --mx/--my on the card under the pointer (desktop only). */
(function () {
  if (!window.matchMedia || !matchMedia("(hover: hover)").matches) return;
  let last = null;
  document.addEventListener("pointermove", (e) => {
    const card = e.target.closest && e.target.closest(".panel, .hero, .cap, .viz, .fc");
    if (last && last !== card) { last.style.removeProperty("--mx"); last.style.removeProperty("--my"); }
    last = card;
    if (!card) return;
    const r = card.getBoundingClientRect();
    card.style.setProperty("--mx", e.clientX - r.left + "px");
    card.style.setProperty("--my", e.clientY - r.top + "px");
  }, { passive: true });
})();
