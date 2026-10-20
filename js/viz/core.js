/* Pnode visual engine: registry, DOM/SVG helpers, controls, stepper and sequence diagrams.
   Each explainer registers with PNODE_VIZ.add({ id, title, nodes, mount(root, ctx) }).
   mount() builds into root and uses ctx for timers so everything is cleaned up on navigation. */
(function () {
  const R = { list: [], byId: {}, byNode: {} };
  function add(def) {
    R.list.push(def);
    R.byId[def.id] = def;
    (def.nodes || []).forEach((n) => (R.byNode[n] = R.byNode[n] || []).push(def));
  }

  const NS = "http://www.w3.org/2000/svg";
  function setAttrs(el, a) {
    if (!a) return;
    for (const k in a) {
      const v = a[k];
      if (v == null || v === false) continue;
      if (k === "text") el.textContent = v;
      else if (k === "html") el.innerHTML = v;
      else if (k.startsWith("on") && typeof v === "function") el.addEventListener(k.slice(2), v);
      else if (k === "style" && typeof v === "object") Object.assign(el.style, v);
      else el.setAttribute(k, v === true ? "" : v);
    }
  }
  function append(el, kids) {
    for (const k of kids.flat(Infinity)) {
      if (k == null || k === false) continue;
      el.appendChild(typeof k === "object" ? k : document.createTextNode(String(k)));
    }
  }
  function h(tag, attrs, ...kids) { const el = document.createElement(tag); setAttrs(el, attrs); append(el, kids); return el; }
  function s(tag, attrs, ...kids) { const el = document.createElementNS(NS, tag); setAttrs(el, attrs); append(el, kids); return el; }
  function clear(el) { while (el.firstChild) el.removeChild(el.firstChild); return el; }
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  let uid = 0;
  const id = (p) => `${p || "v"}-${++uid}`;

  // ---------- lifecycle context ----------
  function makeCtx() {
    const timers = new Set(), rafs = new Set(), cleanups = [];
    const reduced = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    return {
      reduced,
      every(fn, ms) { const t = setInterval(fn, ms); timers.add(t); return t; },
      after(fn, ms) { const t = setTimeout(() => { timers.delete(t); fn(); }, ms); timers.add(t); return t; },
      clear(t) { if (t == null) return; clearInterval(t); clearTimeout(t); timers.delete(t); },
      loop(fn) {
        let last = performance.now(), on = true, handle;
        const tick = (now) => { if (!on) return; fn(now, now - last); last = now; handle = requestAnimationFrame(tick); rafs.add(handle); };
        handle = requestAnimationFrame(tick); rafs.add(handle);
        return () => { on = false; cancelAnimationFrame(handle); };
      },
      onCleanup(fn) { cleanups.push(fn); },
      destroy() {
        timers.forEach((t) => { clearInterval(t); clearTimeout(t); });
        rafs.forEach((r) => cancelAnimationFrame(r));
        timers.clear(); rafs.clear();
        cleanups.splice(0).forEach((f) => { try { f(); } catch (e) { /* ignore */ } });
      },
    };
  }

  // ---------- controls ----------
  function button(label, onClick, opts) {
    opts = opts || {};
    return h("button", { type: "button", class: "vbtn" + (opts.lit ? " vbtn-lit" : "") + (opts.cls ? " " + opts.cls : ""), onclick: onClick, "aria-label": opts.aria }, label);
  }
  function row(...kids) { return h("div", { class: "vrow" }, ...kids); }
  function caption(text) { return h("p", { class: "vcap", "aria-live": "polite" }, text || ""); }
  function seg(options, value, onChange, label) {
    const wrap = h("div", { class: "vseg", role: "group", "aria-label": label || "Mode" });
    const btns = options.map((o) => {
      const b = h("button", { type: "button", "aria-pressed": String(o.v === value) }, o.label);
      b.addEventListener("click", () => { api.set(o.v); onChange(o.v); });
      wrap.appendChild(b);
      return b;
    });
    const api = {
      el: wrap,
      value,
      set(v) { api.value = v; btns.forEach((b, i) => b.setAttribute("aria-pressed", String(options[i].v === v))); },
    };
    return api;
  }
  function range(label, o, onInput) {
    const rid = id("r");
    const out = h("output", { for: rid }, o.fmt ? o.fmt(o.value) : o.value);
    const input = h("input", { type: "range", id: rid, min: o.min, max: o.max, step: o.step || 1, value: o.value });
    input.addEventListener("input", () => { const v = Number(input.value); out.textContent = o.fmt ? o.fmt(v) : v; onInput(v); });
    const el = h("label", { class: "vrange", for: rid }, h("span", null, label, " ", out), input);
    return { el, input, get value() { return Number(input.value); }, set(v) { input.value = v; out.textContent = o.fmt ? o.fmt(v) : v; } };
  }
  function select(label, options, value, onChange) {
    const sid = id("s");
    const sel = h("select", { id: sid }, options.map((o) => h("option", { value: o, selected: o === value ? true : null }, o)));
    sel.addEventListener("change", () => onChange(sel.value));
    return h("label", { class: "vselect", for: sid }, h("span", null, label), sel);
  }
  function chip(text, cls) { return h("span", { class: "vchip" + (cls ? " " + cls : "") }, text); }
  function stat(label, value, cls) { return h("div", { class: "vstat" + (cls ? " " + cls : "") }, h("b", null, value), h("span", null, label)); }

  // ---------- stepper ----------
  // Renders Back / Play / Next / Restart controls for a frame-based explainer.
  function stepper(ctx, opts) {
    let i = 0, timer = null;
    const total = () => (typeof opts.count === "function" ? opts.count() : opts.count);
    const back = button("Back", () => { stop(); go(i - 1); }, { aria: "Previous step" });
    const play = button("Play", () => (timer ? stop() : start()), { lit: true });
    const next = button("Next", () => { stop(); go(i + 1); }, { aria: "Next step" });
    const restart = button("Restart", () => { stop(); go(0); });
    const counter = h("span", { class: "vcount" });
    const el = h("div", { class: "vrow vstepper" }, back, play, next, restart, counter);
    function go(n) {
      const N = total();
      i = clamp(n, 0, Math.max(0, N - 1));
      opts.render(i);
      counter.textContent = `Step ${i + 1} of ${N}`;
      back.disabled = i === 0;
      next.disabled = i >= N - 1;
      if (i >= N - 1 && timer) stop();
    }
    function start() {
      if (i >= total() - 1) go(0);
      play.textContent = "Pause";
      timer = ctx.every(() => { if (i >= total() - 1) { stop(); return; } go(i + 1); }, opts.speed || 1500);
    }
    function stop() { ctx.clear(timer); timer = null; play.textContent = "Play"; }
    return { el, go, stop, start, get index() { return i; } };
  }

  // ---------- sequence diagram ----------
  // actors: ["Browser", "Server"], steps: [{ from, to, label, say, tone }]
  function sequence(ctx, host, cfg) {
    if (host._seq) host._seq.stop();
    clear(host);
    const n = cfg.actors.length;
    const grid = h("div", { class: "vseq", style: `--n:${n}` });
    cfg.actors.forEach((a, i) => grid.appendChild(h("div", { class: "vseq-actor", style: `grid-column:${i + 1}` }, a)));
    for (let i = 0; i < n; i++) grid.appendChild(h("div", { class: "vseq-life", style: `left:calc(${((i + 0.5) / n) * 100}%)` }));
    const rows = cfg.steps.map((st) => {
      const a = Math.min(st.from, st.to), b = Math.max(st.from, st.to), k = b - a + 1;
      if (st.from === st.to) {
        return h("div", { class: "vseq-step vseq-self" + (st.tone ? " t-" + st.tone : ""), style: `grid-column:${a + 1} / ${a + 2}` }, h("span", null, st.label));
      }
      return h("div", { class: "vseq-step" + (st.to < st.from ? " rev" : "") + (st.tone ? " t-" + st.tone : ""), style: `grid-column:${a + 1} / ${b + 2}; --k:${k}` },
        h("span", { class: "vseq-label" }, st.label), h("i", { class: "vseq-line" }));
    });
    rows.forEach((r) => grid.appendChild(r));
    const cap = caption();
    const st = stepper(ctx, {
      count: cfg.steps.length,
      speed: cfg.speed || 1700,
      render(i) {
        rows.forEach((r, j) => { r.classList.toggle("on", j <= i); r.classList.toggle("now", j === i); });
        cap.textContent = cfg.steps[i].say || "";
      },
    });
    host.appendChild(h("div", { class: "vscroll" }, grid));
    host.appendChild(cap);
    host.appendChild(st.el);
    st.go(0);
    host._seq = st;
    return st;
  }

  // ---------- canvas helper ----------
  function canvas(ctx, host, heightPx, draw) {
    const c = h("canvas", { class: "vcanvas", style: `height:${heightPx}px` });
    host.appendChild(c);
    const g = c.getContext("2d");
    function fit() {
      const dpr = window.devicePixelRatio || 1;
      const w = c.clientWidth || 300;
      c.width = Math.round(w * dpr); c.height = Math.round(heightPx * dpr);
      g.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    fit();
    const ro = window.ResizeObserver ? new ResizeObserver(() => { fit(); draw && draw(g, c.clientWidth, heightPx); }) : null;
    if (ro) { ro.observe(c); ctx.onCleanup(() => ro.disconnect()); }
    return { c, g, fit, get w() { return c.clientWidth; }, hgt: heightPx };
  }
  // Read a theme token (e.g. "--lit") for canvas drawing.
  function tok(name) { return getComputedStyle(document.documentElement).getPropertyValue(name).trim() || "#888"; }

  // ---------- mount ----------
  function mount(figure, def) {
    const ctx = makeCtx();
    const body = figure.querySelector(".viz-body");
    clear(body);
    try { def.mount(body, ctx); }
    catch (e) { body.appendChild(h("p", { class: "vcap" }, "This explainer couldn't load. Reload the page to try again.")); console.error(e); }
    return ctx;
  }

  window.PNODE_VIZ = R;
  R.add = add;
  R.mount = mount;
  window.VZ = { h, s, clear, clamp, id, button, row, caption, seg, range, select, chip, stat, stepper, sequence, canvas, tok };
})();
