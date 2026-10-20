/* Phase 7 and 8 explainers: senior engineering and system design */
(function () {
  const { h, s, clear, button, row, caption, seg, range, chip, stat, stepper, canvas, tok } = window.VZ;
  const add = window.PNODE_VIZ.add;
  const font = () => getComputedStyle(document.body).fontFamily;

  // ---------------------------------------------------------------- realtime
  add({
    id: "realtime-compare",
    title: "Polling vs long polling vs WebSockets vs SSE",
    blurb: "Messages arrive at random. Count wasted requests and delay.",
    nodes: ["realtime"],
    mount(root, ctx) {
      let mode = "poll", t0 = performance.now(), msgs = [], reqs = [], delivered = [], waste = 0, lastPoll = 0, stopL = null;
      const M = {
        poll: { label: "Polling (every 2s)", say: "The client asks \"anything new?\" every 2 seconds. Most answers are empty (wasted), and a message can wait up to 2s." },
        long: { label: "Long polling", say: "The client asks and the server holds the request open until something happens, then the client immediately asks again. Fewer wasted requests, still one HTTP request per message." },
        ws: { label: "WebSocket", say: "One persistent two-way connection. The server pushes instantly and the client can send too. Best for chat, games and collaborative editing." },
        sse: { label: "Server-Sent Events", say: "One long HTTP response that the server keeps writing events into. One-way (server to client), auto-reconnects, plain HTTP. Great for notifications and live feeds." },
      };
      const stats = h("div", { class: "vstats" });
      const cap = caption();
      const cv = canvas(ctx, root, 120);
      root.removeChild(cv.c);
      function reset() { t0 = performance.now(); msgs = []; reqs = []; delivered = []; waste = 0; lastPoll = 0; }
      function schedule() {
        let t = 600;
        for (let i = 0; i < 6; i++) { t += 700 + ((i * 1373) % 1900); msgs.push(t); }
      }
      function start() {
        reset(); schedule();
        if (stopL) stopL();
        stopL = ctx.loop((now) => {
          const el = now - t0, W = 10000, w = cv.w, g = cv.g;
          // simulate delivery
          msgs.forEach((m, i) => {
            if (el < m || delivered[i] != null) return;
            if (mode === "poll") { const next = Math.ceil(m / 2000) * 2000; if (el >= next) { delivered[i] = next; } }
            else delivered[i] = m + (mode === "long" ? 60 : 15);
          });
          if (mode === "poll") { while (lastPoll + 2000 <= el) { lastPoll += 2000; reqs.push(lastPoll); if (!msgs.some((m) => m > lastPoll - 2000 && m <= lastPoll)) waste++; } }
          if (mode === "long") { reqs = [0, ...delivered.filter((d) => d != null)]; }
          g.clearRect(0, 0, w, 120);
          const x = (t) => (t / W) * (w - 20) + 10;
          g.font = "12px " + font();
          [["server events", 30], ["client receives", 70], [mode === "ws" || mode === "sse" ? "connection" : "requests", 105]].forEach(([l, y]) => { g.fillStyle = tok("--ink-3"); g.fillText(l, 10, y - 10); g.strokeStyle = tok("--line"); g.beginPath(); g.moveTo(10, y); g.lineTo(w - 10, y); g.stroke(); });
          msgs.forEach((m, i) => { if (m > el) return; g.fillStyle = tok("--plum"); g.beginPath(); g.arc(x(m), 30, 5, 0, 7); g.fill(); if (delivered[i] != null) { g.strokeStyle = tok("--line-strong"); g.beginPath(); g.moveTo(x(m), 30); g.lineTo(x(delivered[i]), 70); g.stroke(); g.fillStyle = tok("--mint"); g.beginPath(); g.arc(x(delivered[i]), 70, 5, 0, 7); g.fill(); } });
          if (mode === "ws" || mode === "sse") { g.strokeStyle = tok("--sky"); g.lineWidth = 4; g.beginPath(); g.moveTo(x(0), 105); g.lineTo(x(Math.min(el, W)), 105); g.stroke(); g.lineWidth = 1; }
          else reqs.forEach((r) => { if (r > el) return; g.fillStyle = tok("--sky"); g.fillRect(x(r) - 2, 98, 4, 14); });
          g.strokeStyle = tok("--lit"); g.beginPath(); g.moveTo(x(Math.min(el, W)), 14); g.lineTo(x(Math.min(el, W)), 116); g.stroke();
          const d = delivered.map((v, i) => (v != null ? v - msgs[i] : null)).filter((v) => v != null);
          const avg = d.length ? Math.round(d.reduce((a, b) => a + b, 0) / d.length) : 0;
          clear(stats).append(stat("avg delay", d.length ? avg + "ms" : "–", avg > 500 ? "bad" : "good"), stat("HTTP requests", mode === "ws" || mode === "sse" ? 1 : mode === "long" ? reqs.length : reqs.length + 1), stat("empty responses", mode === "poll" ? waste : 0, mode === "poll" && waste ? "bad" : "good"));
          if (el > W) { stopL(); stopL = null; }
        });
      }
      const sg = seg(Object.entries(M).map(([v, m]) => ({ v, label: m.label })), mode, (v) => { mode = v; cap.textContent = M[v].say; start(); }, "Transport");
      root.append(sg.el, cv.c, row(button("Replay", start, { lit: true })), stats, cap);
      cap.textContent = M[mode].say;
      start();
    },
  });

  // ---------------------------------------------------------------- queue
  add({
    id: "queue-workers",
    title: "Job queue with workers and retries",
    blurb: "Add jobs, change workers and failure rate",
    nodes: ["queues", "microservices"],
    mount(root, ctx) {
      let workers = 2, failPct = 20, seq = 0;
      const jobs = [];
      const cols = { waiting: h("div", { class: "vstack" }), active: h("div", { class: "vstack" }), done: h("div", { class: "vstack" }), failed: h("div", { class: "vstack" }) };
      const stats = h("div", { class: "vstats" });
      const cap = caption("Add jobs. The API returns 202 instantly; workers process the queue in the background.");
      function draw() {
        Object.values(cols).forEach((c) => clear(c));
        const by = (st) => jobs.filter((j) => j.st === st);
        by("waiting").slice(0, 8).forEach((j) => cols.waiting.appendChild(chip(`#${j.id}${j.tries ? ` retry ${j.tries}` : ""}`, j.tries ? "lit" : "")));
        if (by("waiting").length > 8) cols.waiting.appendChild(h("span", { class: "small muted" }, `+${by("waiting").length - 8} more`));
        by("active").forEach((j) => cols.active.appendChild(chip(`#${j.id} ⏳`, "sky")));
        cols.done.appendChild(h("span", { style: "font-family:var(--f-display);font-size:1.6rem;font-weight:800;color:var(--mint)" }, String(by("done").length)));
        by("failed").forEach((j) => cols.failed.appendChild(chip(`#${j.id}`, "bad")));
        clear(stats).append(stat("waiting", by("waiting").length), stat("workers busy", `${by("active").length}/${workers}`), stat("dead-lettered", by("failed").length, by("failed").length ? "bad" : "good"));
      }
      const tick = ctx.every(() => {
        const now = performance.now();
        jobs.filter((j) => j.st === "active" && now >= j.until).forEach((j) => {
          const failed = Math.random() * 100 < failPct;
          if (!failed) j.st = "done";
          else if (j.tries < 3) { j.tries++; j.st = "waiting"; j.notBefore = now + 400 * Math.pow(2, j.tries); }
          else j.st = "failed";
        });
        let free = workers - jobs.filter((j) => j.st === "active").length;
        jobs.filter((j) => j.st === "waiting" && (!j.notBefore || now >= j.notBefore)).forEach((j) => { if (free > 0) { j.st = "active"; j.until = now + 700 + Math.random() * 500; free--; } });
        draw();
      }, 120);
      ctx.onCleanup(() => ctx.clear(tick));
      const box = (t, k) => h("div", { class: "vbox" }, h("h4", null, t), cols[k]);
      root.append(
        h("div", { class: "vgrid2" },
          range("workers", { min: 1, max: 6, value: workers }, (x) => (workers = x)).el,
          range("failure rate", { min: 0, max: 80, step: 5, value: failPct, fmt: (x) => x + "%" }, (x) => (failPct = x)).el),
        row(button("POST /exports × 10", () => { for (let i = 0; i < 10; i++) jobs.push({ id: ++seq, st: "waiting", tries: 0 }); cap.textContent = "10 jobs queued. Each request returned 202 Accepted in a few ms instead of waiting for the PDF."; }, { lit: true }), button("Clear", () => { jobs.length = 0; seq = 0; })),
        h("div", { style: "display:grid;gap:8px;grid-template-columns:repeat(auto-fit,minmax(130px,1fr))" }, box("waiting", "waiting"), box("active", "active"), box("completed", "done"), box("failed (dead letter)", "failed")),
        stats, cap,
        h("p", { class: "small muted", style: "margin:0" }, "Failed jobs retry with exponential backoff (0.8s, 1.6s, 3.2s). After 3 retries they move to the dead-letter list for a human to inspect. Handlers must be idempotent, because a retry may repeat work that half-finished."));
      draw();
    },
  });

  // ---------------------------------------------------------------- docker layers
  add({
    id: "docker-layers",
    title: "Docker layer caching",
    blurb: "Change one file. Which layers rebuild?",
    nodes: ["docker"],
    mount(root) {
      let order = "good", changed = null;
      const files = { good: [["FROM node:22-alpine", 0, "base"], ["WORKDIR /app", 0.1, "base"], ["COPY package*.json ./", 0.1, "deps"], ["RUN npm ci", 48, "deps"], ["COPY . .", 0.5, "src"], ["RUN npm run build", 22, "src"]], bad: [["FROM node:22-alpine", 0, "base"], ["WORKDIR /app", 0.1, "base"], ["COPY . .", 0.5, "src"], ["RUN npm ci", 48, "src"], ["RUN npm run build", 22, "src"]] };
      const list = h("div", { class: "vstack" });
      const stats = h("div", { class: "vstats" });
      const cap = caption("Each Dockerfile line is a cached layer. Once one layer changes, every layer after it rebuilds.");
      function draw() {
        clear(list);
        const L = files[order];
        let busted = false, secs = 0;
        L.forEach(([line, t, dep]) => {
          if (changed && !busted && (dep === changed || (changed === "deps" && dep === "deps") || (changed === "src" && line.startsWith("COPY . .")))) busted = true;
          if (changed === "deps" && line.startsWith("COPY . .") && order === "bad") busted = true;
          const rebuild = !changed || busted;
          if (rebuild) secs += t;
          list.appendChild(h("div", { class: "vitem " + (rebuild ? (changed ? "lit" : "") : "mint"), style: "display:flex;justify-content:space-between;gap:8px;font-family:var(--f-code);font-size:.8rem" }, h("span", null, line), h("span", { class: "muted" }, changed ? (rebuild ? `rebuild ${t}s` : "CACHED") : `${t}s`)));
        });
        clear(stats).append(stat("build time", secs.toFixed(1) + "s", secs > 30 ? "bad" : "good"));
      }
      const sg = seg([{ v: "good", label: "Copy package.json first" }, { v: "bad", label: "COPY . . first" }], order, (v) => { order = v; changed = null; draw(); cap.textContent = "Now change a file."; }, "Dockerfile order");
      root.append(sg.el, row(
        button("Edit src/app.ts", () => { changed = "src"; draw(); cap.textContent = order === "good" ? "Only the source changed. Dependencies were installed in an earlier layer that's still cached, so npm ci is skipped. 22 seconds instead of 70." : "COPY . . copies everything, so any code change busts that layer and every layer after it, including the slow npm ci. You reinstall all dependencies on every tiny edit."; }, { lit: true }),
        button("Add a dependency", () => { changed = "deps"; draw(); cap.textContent = "package.json changed, so npm ci must run again. That's correct and unavoidable."; }),
        button("Fresh build", () => { changed = null; draw(); cap.textContent = "First build: everything runs."; })), list, stats, cap);
      draw();
    },
  });

  // ---------------------------------------------------------------- expand-contract migration
  add({
    id: "zero-downtime-migration",
    title: "Zero-downtime schema change",
    blurb: "Rename full_name to name without breaking running servers",
    nodes: ["cicd"],
    mount(root, ctx) {
      const F = [
        { db: ["full_name"], old: "reads/writes full_name", neu: "—", ok: true, say: "Production runs v1. During a deploy, old and new versions run side by side for a while, so every step must work with both." },
        { db: ["full_name", "name (nullable)"], old: "reads/writes full_name", neu: "—", ok: true, say: "Deploy 1 (expand): add the new column. Nothing reads it yet. v1 doesn't care." },
        { db: ["full_name", "name (nullable)"], old: "reads/writes full_name", neu: "writes BOTH, reads full_name", ok: true, say: "Deploy 2: new code writes both columns but still reads the old one. v1 and v2 can run together safely." },
        { db: ["full_name", "name ✓ backfilled"], old: "—", neu: "writes BOTH, reads full_name", ok: true, say: "Backfill: a script copies full_name into name for old rows, in batches, so it doesn't lock the table." },
        { db: ["full_name", "name ✓"], old: "—", neu: "writes BOTH, reads name", ok: true, say: "Deploy 3: switch reads to the new column. Still writing both, so rolling back is safe." },
        { db: ["full_name", "name ✓"], old: "—", neu: "reads/writes name", ok: true, say: "Deploy 4: stop writing the old column." },
        { db: ["name ✓"], old: "—", neu: "reads/writes name", ok: true, say: "Deploy 5 (contract): drop full_name. Five small, reversible steps instead of one risky one." },
        { db: ["name"], old: "reads full_name ✗", neu: "reads name", ok: false, say: "The shortcut: rename in one migration. For the minutes when old servers still run, every query on full_name crashes. Users see 500 errors mid-deploy." },
      ];
      const dbEl = h("div", { class: "vrow" }), oldEl = h("div", { class: "vitem" }), newEl = h("div", { class: "vitem" });
      const cap = caption();
      const st = stepper(ctx, { count: F.length, speed: 2200, render(i) { const f = F[i]; clear(dbEl); f.db.forEach((c) => dbEl.appendChild(chip(c, c.includes("✓") ? "mint" : c.includes("nullable") ? "lit" : ""))); oldEl.textContent = "v1 servers: " + f.old; oldEl.className = "vitem " + (f.ok ? "" : "bad"); newEl.textContent = "v2 servers: " + f.neu; newEl.className = "vitem sky"; cap.textContent = f.say; } });
      root.append(h("div", { class: "vbox" }, h("h4", null, "users table columns"), dbEl), oldEl, newEl, cap, st.el);
      st.go(0);
    },
  });

  // ---------------------------------------------------------------- percentiles
  add({
    id: "latency-percentiles",
    title: "Averages hide the pain: p50, p95, p99",
    blurb: "Add a slow tail and watch which number moves",
    nodes: ["observability"],
    mount(root, ctx) {
      let tail = 2;
      const cv = canvas(ctx, root, 170, () => draw());
      root.removeChild(cv.c);
      const stats = h("div", { class: "vstats" });
      const cap = caption();
      function sample() {
        let seed = 7; const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
        const out = [];
        for (let i = 0; i < 2000; i++) {
          const slow = rnd() * 100 < tail;
          const base = 60 + -Math.log(1 - rnd()) * 40;
          out.push(slow ? 900 + rnd() * 2600 : base);
        }
        return out.sort((a, b) => a - b);
      }
      function draw() {
        const d = sample();
        const pct = (p) => d[Math.min(d.length - 1, Math.floor((p / 100) * d.length))];
        const avg = d.reduce((a, b) => a + b, 0) / d.length;
        const g = cv.g, w = cv.w, H = 170, maxMs = 3600, bins = 72;
        const counts = new Array(bins).fill(0);
        d.forEach((v) => counts[Math.min(bins - 1, Math.floor((v / maxMs) * bins))]++);
        const top = Math.max(...counts);
        g.clearRect(0, 0, w, H);
        const bw = (w - 20) / bins;
        counts.forEach((c, i) => { const bh = c ? Math.max(2, Math.sqrt(c / top) * (H - 40)) : 0; g.fillStyle = tok("--sky"); g.globalAlpha = 0.75; g.fillRect(10 + i * bw, H - 22 - bh, bw - 1, bh); });
        g.globalAlpha = 1;
        g.font = "11px " + font();
        [["avg", avg, "--ink-2"], ["p50", pct(50), "--mint"], ["p95", pct(95), "--lit"], ["p99", pct(99), "--danger"]].forEach(([l, v, c], k) => { const x = 10 + (v / maxMs) * (w - 20); g.strokeStyle = tok(c); g.lineWidth = 2; g.beginPath(); g.moveTo(x, 8); g.lineTo(x, H - 22); g.stroke(); g.fillStyle = tok(c); g.fillText(l, Math.min(w - 26, x + 3), 16 + k * 13); });
        g.fillStyle = tok("--ink-3"); g.fillText("0ms", 10, H - 6); g.fillText("3.6s", w - 34, H - 6);
        clear(stats).append(stat("average", Math.round(avg) + "ms"), stat("p50 (median)", Math.round(pct(50)) + "ms", "good"), stat("p95", Math.round(pct(95)) + "ms", "lit"), stat("p99", Math.round(pct(99)) + "ms", pct(99) > 1000 ? "bad" : "good"));
        cap.textContent = tail === 0 ? "A healthy service: most requests around 60–150ms, and p99 isn't far behind." : `With just ${tail}% slow requests the median barely moves and the average looks fine, but p99 jumps past a second. One in a hundred requests is painful, and your heaviest users make hundreds of requests a day. Alert on p95/p99, not averages.`;
      }
      root.append(range("slow requests", { min: 0, max: 10, step: 0.5, value: tail, fmt: (x) => x + "%" }, (x) => { tail = x; draw(); }).el, cv.c, stats, cap);
      draw();
    },
  });

  // ---------------------------------------------------------------- clean architecture
  add({
    id: "clean-layers",
    title: "Dependencies point inward",
    blurb: "Swap the database or the framework. What has to change?",
    nodes: ["architecture"],
    mount(root) {
      const L = [
        { k: "infra", name: "Infrastructure", files: ["PrismaNoteRepository.ts", "S3FileStore.ts", "SesEmailSender.ts"] },
        { k: "web", name: "Delivery (HTTP)", files: ["notes.routes.ts", "notes.controller.ts"] },
        { k: "app", name: "Application (use cases)", files: ["createNote.ts", "shareNotebook.ts", "ports: NoteRepository, EmailSender"] },
        { k: "domain", name: "Domain (business rules)", files: ["Note.ts", "Permissions.ts"] },
      ];
      const host = h("div", { class: "vstack" });
      const cap = caption("Outer layers depend on inner ones, never the other way. The domain imports nothing from Express, Prisma or Next.js.");
      function draw(hit) {
        clear(host);
        L.forEach((l, i) => host.appendChild(h("div", { class: "vbox", style: `margin:0 ${i * 14}px;${hit && hit.includes(l.k) ? "border-color:var(--lit);border-width:2px" : ""}` }, h("h4", null, l.name), h("div", { class: "vrow" }, l.files.map((f) => chip(f, hit && hit.includes(l.k) && (hit.includes("all") || f.match(hit.file || /^$/)) ? "lit" : ""))))));
      }
      root.append(row(
        button("Swap Postgres → MongoDB", () => { draw(Object.assign(["infra"], { file: /Prisma/ })); cap.textContent = "Write MongoNoteRepository implementing the same NoteRepository port. One file changes. Use cases, rules and routes don't know or care."; }, { lit: true }),
        button("Swap Express → Fastify", () => { draw(Object.assign(["web"], { file: /routes|controller/ })); cap.textContent = "Only the delivery layer changes. Your business logic is reusable across HTTP, a CLI or a queue worker."; }),
        button("Change a pricing rule", () => { draw(Object.assign(["domain"], { file: /Permissions|Note/ })); cap.textContent = "Business rules live in plain functions and classes with no framework imports. They're the easiest code to test: no database, no server, just inputs and outputs."; }),
        button("Without layers", () => { draw(Object.assign(["infra", "web", "app", "domain"], { file: /./ })); cap.textContent = "When route handlers call Prisma directly and mix in business rules, any change ripples everywhere. That's what \"hard to change\" code feels like."; })), host, cap);
      draw();
    },
  });

  // ---------------------------------------------------------------- load balancer
  add({
    id: "load-balancer",
    title: "Load balancing and health checks",
    blurb: "Add servers, kill one, switch the algorithm",
    nodes: ["cloud", "sd-fundamentals"],
    mount(root, ctx) {
      let algo = "rr", rr = 0, servers = [{ id: 1, up: true, load: 0, served: 0, healthy: true }, { id: 2, up: true, load: 0, served: 0, healthy: true }], next = 3, failed = 0, rps = 6;
      const host = h("div", { class: "vgrid3" });
      const stats = h("div", { class: "vstats" });
      const cap = caption("Requests flow in continuously. Watch the load spread.");
      function draw() {
        clear(host);
        servers.forEach((sv) => host.appendChild(h("div", { class: "vbox", style: sv.up ? "" : "border-color:var(--danger)" }, h("h4", null, `server ${sv.id} ${!sv.up ? "· DOWN" : !sv.healthy ? "· unhealthy" : ""}`),
          h("div", { class: "meter", style: "margin:4px 0" }, h("i", { style: `width:${Math.min(100, sv.load * 10)}%;background:var(${sv.load > 7 ? "--danger" : sv.load > 4 ? "--lit" : "--mint"})` })),
          h("div", { class: "small muted" }, `${sv.load} in flight · ${sv.served} served`),
          h("button", { type: "button", class: "vbtn", style: "margin-top:6px", onclick: () => { sv.up = !sv.up; cap.textContent = sv.up ? `Server ${sv.id} is back. After passing health checks it gets traffic again.` : `Server ${sv.id} crashed. Until the load balancer's health check notices (about 2s), requests sent to it fail.`; if (sv.up) ctx.after(() => (sv.healthy = true), 1500); else ctx.after(() => (sv.healthy = false), 2000); } }, sv.up ? "Kill" : "Restart"))));
        clear(stats).append(stat("servers", servers.filter((s) => s.up).length), stat("failed requests", failed, failed ? "bad" : "good"));
      }
      const tick = ctx.every(() => {
        for (let k = 0; k < Math.round(rps / 4); k++) {
          const pool = servers.filter((s) => s.healthy);
          if (!pool.length) { failed++; continue; }
          let target;
          if (algo === "rr") { target = pool[rr++ % pool.length]; }
          else target = pool.slice().sort((a, b) => a.load - b.load)[0];
          if (!target.up) { failed++; continue; }
          target.load++;
          const slow = target.id === 2 ? 2.5 : 1;
          ctx.after(() => { target.load = Math.max(0, target.load - 1); target.served++; }, 600 * slow + Math.random() * 300);
        }
        draw();
      }, 250);
      ctx.onCleanup(() => ctx.clear(tick));
      const sg = seg([{ v: "rr", label: "Round robin" }, { v: "lc", label: "Least connections" }], algo, (v) => { algo = v; cap.textContent = v === "rr" ? "Round robin takes turns. Server 2 is slower (older machine), so its queue builds up anyway." : "Least connections sends each request to the least busy server, so the slow server naturally gets less."; }, "Algorithm");
      root.append(sg.el, range("requests per second", { min: 2, max: 20, value: rps }, (x) => (rps = x)).el,
        row(button("Add a server", () => { servers.push({ id: next++, up: true, load: 0, served: 0, healthy: true }); cap.textContent = "Horizontal scaling: one more stateless server behind the load balancer. This only works if sessions and files live in shared stores, not on the server."; }, { lit: true }), button("Remove last", () => { if (servers.length > 1) servers.pop(); })), host, stats, cap);
      draw();
    },
  });

  // ---------------------------------------------------------------- microservices
  add({
    id: "sync-vs-async",
    title: "Sync call chain vs events",
    blurb: "The email service goes down. Does checkout still work?",
    nodes: ["microservices"],
    mount(root, ctx) {
      let mode = "sync", emailUp = true, queued = 0, timers = [];
      const svc = ["Orders", "Payments", "Inventory", "Email"];
      const host = h("div", { class: "vrow" });
      const log = h("div", { class: "vlog" });
      const cap = caption("Place an order.");
      function draw(hl) { clear(host); svc.forEach((n, i) => { host.appendChild(chip(n + (n === "Email" && !emailUp ? " ✗ down" : ""), hl && hl[n] ? hl[n] : n === "Email" && !emailUp ? "bad" : "")); if (i < svc.length - 1) host.appendChild(h("span", { class: "muted" }, mode === "sync" ? "→" : "·")); }); if (mode === "async") host.appendChild(chip(`queue: ${queued} waiting`, queued ? "lit" : "")); }
      function say(t, c) { log.appendChild(h("div", { class: c || "" }, t)); log.scrollTop = log.scrollHeight; }
      function order() {
        timers.forEach((t) => ctx.clear(t)); timers = []; clear(log);
        if (mode === "sync") {
          const steps = [["Orders", "Orders calls Payments (HTTP)…"], ["Payments", "Payments OK, calls Inventory…"], ["Inventory", "Inventory reserved, calls Email…"]];
          steps.forEach(([n, t], i) => timers.push(ctx.after(() => { say(t); draw({ [n]: "mint" }); }, i * 450)));
          timers.push(ctx.after(() => {
            if (emailUp) { say("Email sent. 200 back up the chain.", "good"); draw({ Email: "mint" }); cap.textContent = "Works, but the order request waited for four services in a row. Its latency is the sum of all of them."; }
            else { say("Email timed out after 5s → Inventory 500 → Payments 500 → Orders 500", "bad"); draw({ Email: "bad", Orders: "bad" }); cap.textContent = "A non-critical email service took down checkout. In a synchronous chain, availability multiplies: four services at 99.9% each give 99.6% overall."; }
          }, 3 * 450 + 300));
        } else {
          timers.push(ctx.after(() => { say("Orders: payment + stock in one transaction, then publish OrderPlaced", "good"); draw({ Orders: "mint" }); }, 0));
          timers.push(ctx.after(() => { say("201 Created returned to the user immediately", "good"); }, 350));
          timers.push(ctx.after(() => {
            if (emailUp) { say("Email service consumed OrderPlaced → confirmation sent", "good"); draw({ Email: "mint" }); cap.textContent = "The user got a fast response. Other services react to the event in their own time."; }
            else { queued++; say("Email service is down. The OrderPlaced event waits safely in the queue.", "lit"); draw(); cap.textContent = "Checkout still succeeded. When Email comes back, it processes the backlog. Loose coupling via events is how you keep failures contained, at the cost of eventual consistency and more moving parts."; }
          }, 900));
        }
      }
      const sg = seg([{ v: "sync", label: "Synchronous HTTP chain" }, { v: "async", label: "Events via a queue" }], mode, (v) => { mode = v; queued = 0; draw(); clear(log); cap.textContent = "Place an order."; }, "Integration style");
      root.append(sg.el, host, row(button("Place order", order, { lit: true }), button("Toggle Email service", () => { emailUp = !emailUp; if (emailUp && queued) { say(`Email back up: processed ${queued} queued event${queued > 1 ? "s" : ""}`, "good"); queued = 0; } draw(); })), log, cap);
      draw();
    },
  });

  // ---------------------------------------------------------------- kubernetes
  add({
    id: "k8s-reconcile",
    title: "Kubernetes keeps desired state",
    blurb: "Kill pods, raise traffic, and watch the controller react",
    nodes: ["kubernetes"],
    mount(root, ctx) {
      let desired = 3, pods = [], seq = 0, cpu = 40, hpa = true;
      function mk(state) { return { id: "api-" + (++seq).toString(36) + Math.random().toString(36).slice(2, 5), st: state || "starting", at: performance.now() }; }
      for (let i = 0; i < 3; i++) pods.push(Object.assign(mk(), { st: "running" }));
      const grid = h("div", { style: "display:grid;gap:6px;grid-template-columns:repeat(auto-fill,minmax(110px,1fr))" });
      const stats = h("div", { class: "vstats" });
      const cap = caption("A Deployment says \"I want 3 replicas\". The controller loops forever, comparing what is with what should be.");
      function draw() {
        clear(grid);
        pods.forEach((p) => {
          const b = h("button", { type: "button", class: "vitem " + (p.st === "running" ? "mint" : p.st === "starting" ? "lit" : "bad"), style: "cursor:pointer;color:var(--ink);font:0.75rem var(--f-code);text-align:left" }, h("div", null, p.id), h("div", { class: "muted" }, p.st));
          b.addEventListener("click", () => { if (p.st === "running") { p.st = "crashed"; cap.textContent = `${p.id} crashed. Running replicas dropped below the desired count, so the controller schedules a replacement.`; draw(); } });
          grid.appendChild(b);
        });
        clear(stats).append(stat("desired replicas", desired, "lit"), stat("running", pods.filter((p) => p.st === "running").length, "good"), stat("avg CPU", Math.round(cpu) + "%", cpu > 70 ? "bad" : "good"));
      }
      const tick = ctx.every(() => {
        const now = performance.now();
        pods = pods.filter((p) => !(p.st === "crashed" && now - p.at > 900 && (p.gone = true)));
        pods.forEach((p) => { if (p.st === "crashed" && !p.at2) { p.at2 = now; p.at = now; } if (p.st === "starting" && now - p.at > 1200) p.st = "running"; });
        const running = pods.filter((p) => p.st === "running").length || 1;
        const load = cpu * (pods.length ? 3 / running : 1);
        if (hpa) { if (load > 70 && desired < 10) desired++; else if (load < 30 && desired > 3) desired--; }
        const alive = pods.filter((p) => p.st !== "crashed");
        if (alive.length < desired) pods.push(mk());
        if (alive.length > desired) { const p = alive.find((x) => x.st === "running"); if (p) pods.splice(pods.indexOf(p), 1); }
        draw();
      }, 700);
      ctx.onCleanup(() => ctx.clear(tick));
      root.append(range("incoming traffic (CPU per pod at 3 replicas)", { min: 10, max: 200, step: 10, value: cpu, fmt: (x) => x + "%" }, (x) => { cpu = x; cap.textContent = x > 70 && hpa ? "CPU is above the 70% target, so the HorizontalPodAutoscaler raises desired replicas step by step until the load per pod drops." : "Traffic changed."; }).el,
        row(h("label", { class: "small", style: "display:flex;gap:6px;align-items:center" }, (() => { const c = h("input", { type: "checkbox", checked: true }); c.addEventListener("change", () => (hpa = c.checked)); return c; })(), "Autoscaler on"), button("Kill a random pod", () => { const r = pods.filter((p) => p.st === "running"); if (r.length) { r[Math.floor(Math.random() * r.length)].st = "crashed"; cap.textContent = "Pod killed. Watch a new one appear without anyone running a command. This is self-healing."; draw(); } }, { lit: true })),
        h("p", { class: "small muted", style: "margin:0" }, "Tap any running pod to crash it."), grid, stats, cap);
      draw();
    },
  });

  // ---------------------------------------------------------------- consistent hashing
  add({
    id: "consistent-hashing",
    title: "Consistent hashing",
    blurb: "Add a server: how many keys have to move?",
    nodes: ["sd-fundamentals"],
    mount(root) {
      const hash = (str) => { let x = 2166136261; for (const c of str) { x ^= c.charCodeAt(0); x = Math.imul(x, 16777619); } return (x >>> 0) / 4294967295; };
      const keys = Array.from({ length: 40 }, (_, i) => "user:" + (i * 37 + 11));
      let n = 4, prevN = 4, prevRing = null, prevMod = null;
      const host = h("div");
      const stats = h("div", { class: "vstats" });
      const cap = caption("Keys (dots) and servers (squares) are both hashed onto a ring. Each key belongs to the next server clockwise.");
      const colors = ["--lit", "--sky", "--mint", "--plum", "--danger", "--ink-2"];
      function owners(count) {
        const pts = [];
        for (let i = 0; i < count; i++) for (let v = 0; v < 3; v++) pts.push({ s: i, p: hash(`server-${i}#${v}`) });
        pts.sort((a, b) => a.p - b.p);
        const ring = keys.map((k) => { const p = hash(k); const o = pts.find((q) => q.p >= p) || pts[0]; return o.s; });
        const mod = keys.map((k) => Math.floor(hash(k) * 4294967295) % count);
        return { pts, ring, mod };
      }
      function draw() {
        const { pts, ring, mod } = owners(n);
        const svg = s("svg", { class: "vsvg", viewBox: "0 0 260 260", style: "max-width:320px;margin:0 auto", role: "img", "aria-label": "Hash ring" });
        svg.appendChild(s("circle", { cx: 130, cy: 130, r: 100, class: "f-none s-line", "stroke-width": 2 }));
        const xy = (p, r) => [130 + r * Math.cos(p * 2 * Math.PI - Math.PI / 2), 130 + r * Math.sin(p * 2 * Math.PI - Math.PI / 2)];
        keys.forEach((k, i) => { const [x, y] = xy(hash(k), 100); const moved = prevRing && prevRing[i] !== ring[i]; svg.appendChild(s("circle", { cx: x, cy: y, r: moved ? 5 : 3.5, style: `fill:var(${colors[ring[i] % colors.length]})`, "stroke-width": moved ? 2 : 0, class: moved ? "s-ink" : "" })); });
        pts.forEach((q) => { const [x, y] = xy(q.p, 118); svg.appendChild(s("rect", { x: x - 6, y: y - 6, width: 12, height: 12, rx: 2, style: `fill:var(${colors[q.s % colors.length]})` })); });
        clear(host).appendChild(svg);
        if (prevRing && prevN !== n) {
          const movedRing = ring.filter((o, i) => o !== prevRing[i]).length;
          const movedMod = mod.filter((o, i) => o !== prevMod[i]).length;
          clear(stats).append(stat("keys moved (consistent hashing)", `${movedRing}/40`, "good"), stat("keys moved with hash % N", `${movedMod}/40`, "bad"));
          cap.textContent = `Going from ${prevN} to ${n} servers moved only ${movedRing} keys on the ring (about 1/${Math.max(prevN, n)}). Plain hash % N would have moved ${movedMod}, so almost the whole cache would miss at once. Each server sits at 3 points (virtual nodes) to spread load evenly.`;
        } else clear(stats).append(stat("servers", n));
      }
      function setN(v) { const o = owners(n); prevRing = o.ring; prevMod = o.mod; prevN = n; n = v; draw(); }
      root.append(row(button("Add server", () => { if (n < 6) setN(n + 1); }, { lit: true }), button("Remove server", () => { if (n > 2) setN(n - 1); })), host, stats, cap);
      draw();
    },
  });

  // ---------------------------------------------------------------- CAP
  add({
    id: "cap-partition",
    title: "CAP: when the network splits",
    blurb: "Write to one replica, read from the other",
    nodes: ["sd-fundamentals"],
    mount(root) {
      let mode = "CP", split = false, a = "₹450", b = "₹450";
      const host = h("div", { style: "display:grid;grid-template-columns:1fr auto 1fr;gap:8px;align-items:center" });
      const log = h("div", { class: "vlog" });
      const cap = caption("Two replicas of the price, in Mumbai and Singapore. Cut the link between them, then write and read.");
      function draw() { clear(host).append(h("div", { class: "vbox" }, h("h4", null, "Replica A (Mumbai)"), h("div", { style: "font-size:1.3rem;font-weight:700" }, a)), h("div", { style: `font-size:1.3rem;color:var(${split ? "--danger" : "--mint"})` }, split ? "✂" : "⇄"), h("div", { class: "vbox" }, h("h4", null, "Replica B (Singapore)"), h("div", { style: "font-size:1.3rem;font-weight:700" }, b))); }
      function say(t, c) { log.appendChild(h("div", { class: c || "" }, t)); log.scrollTop = log.scrollHeight; }
      root.append(seg([{ v: "CP", label: "Choose consistency (CP)" }, { v: "AP", label: "Choose availability (AP)" }], mode, (v) => { mode = v; }, "Mode").el,
        row(button(split ? "Heal network" : "Cut the network", function () { split = !split; this.textContent = split ? "Heal network" : "Cut the network"; if (!split && b !== a) { b = a; say("Network healed: B catches up to " + a, "good"); } draw(); }, {}),
          button("Write ₹500 to A", () => {
            if (!split) { a = b = "₹500"; say("A = ₹500, replicated to B", "good"); }
            else if (mode === "CP") { say("A refuses the write: can't reach B to confirm (error 503)", "bad"); cap.textContent = "CP: rather than let the replicas disagree, the system rejects writes it can't replicate. Correct, but unavailable. Banks and stock levels usually choose this."; }
            else { a = "₹500"; say("A accepts ₹500 (B doesn't know yet)", "lit"); cap.textContent = "AP: A stays available and takes the write. B still has the old value until the network heals."; }
            draw();
          }, { lit: true }),
          button("Read from B", () => { say(`B returns ${b}${split && a !== b ? " (stale!)" : ""}`, split && a !== b ? "bad" : ""); if (split && a !== b) cap.textContent = "Stale read: B answered, but with old data. AP systems are eventually consistent. Feeds, likes and carts usually accept this."; })),
        host, log, cap, h("p", { class: "small muted", style: "margin:0" }, "Partitions will happen, so the real choice is what to give up while they last: consistency or availability."));
      draw();
    },
  });

  // ---------------------------------------------------------------- token bucket
  add({
    id: "token-bucket",
    title: "Rate limiting with a token bucket",
    blurb: "Each request spends a token. Tokens refill at a steady rate.",
    nodes: ["sd-practice", "auth"],
    mount(root, ctx) {
      let cap_ = 5, rate = 1, tokens = 5, last = performance.now(), ok = 0, no = 0;
      const bucket = h("div", { style: "display:flex;gap:6px;flex-wrap:wrap;min-height:28px" });
      const log = h("div", { class: "vlog" });
      const stats = h("div", { class: "vstats" });
      const cap = caption("Capacity = the burst you allow. Refill rate = the sustained rate.");
      function refill() { const now = performance.now(); tokens = Math.min(cap_, tokens + ((now - last) / 1000) * rate); last = now; }
      function draw() { clear(bucket); for (let i = 0; i < cap_; i++) bucket.appendChild(h("div", { style: `width:22px;height:22px;border-radius:50%;background:${i < Math.floor(tokens) ? "var(--lit)" : "var(--bg-raised)"};border:1px solid var(--line-strong)` })); clear(stats).append(stat("tokens", tokens.toFixed(1)), stat("allowed", ok, "good"), stat("429 Too Many Requests", no, no ? "bad" : "good")); }
      function hit() { refill(); if (tokens >= 1) { tokens -= 1; ok++; log.appendChild(h("div", { class: "good" }, "200 OK")); } else { no++; log.appendChild(h("div", { class: "bad" }, `429  Retry-After: ${Math.ceil((1 - tokens) / rate)}s`)); } log.scrollTop = log.scrollHeight; draw(); }
      const stop = ctx.loop(() => { refill(); draw(); });
      ctx.onCleanup(stop);
      root.append(h("div", { class: "vgrid2" }, range("capacity (burst)", { min: 1, max: 10, value: cap_ }, (x) => { cap_ = x; tokens = Math.min(tokens, x); }).el, range("refill", { min: 0.5, max: 5, step: 0.5, value: rate, fmt: (x) => x + " token/s" }, (x) => (rate = x)).el),
        bucket, row(button("Send 1 request", hit, { lit: true }), button("Burst of 10", () => { for (let i = 0; i < 10; i++) ctx.after(hit, i * 60); cap.textContent = "The first few requests spend the saved-up tokens instantly. The rest get 429 until tokens refill. Store the bucket in Redis so every API server shares the same limit."; })), stats, log, cap);
      draw();
    },
  });

  // ---------------------------------------------------------------- capacity estimator
  add({
    id: "capacity-estimator",
    title: "Back-of-the-envelope estimates",
    blurb: "Turn users into requests per second and storage per year",
    nodes: ["sd-fundamentals", "sd-practice"],
    mount(root) {
      const v = { dau: 10, reads: 20, writes: 2, size: 1, peak: 3 };
      const out = h("div", { class: "vstats" });
      const work = h("pre", { class: "vcode" });
      const cap = caption();
      const fmt = (x) => (x >= 1e9 ? (x / 1e9).toFixed(1) + "B" : x >= 1e6 ? (x / 1e6).toFixed(1) + "M" : x >= 1e3 ? (x / 1e3).toFixed(1) + "K" : x.toFixed(0));
      function calc() {
        const users = v.dau * 1e6, day = 1e5;
        const wps = (users * v.writes) / day, rps = (users * v.reads) / day;
        const storeYr = users * v.writes * 365 * v.size * 1024;
        clear(out).append(stat("reads / sec (avg)", fmt(rps)), stat("reads / sec (peak)", fmt(rps * v.peak), "lit"), stat("writes / sec", fmt(wps)), stat("new storage / year", storeYr >= 1e12 ? (storeYr / 1e12).toFixed(1) + " TB" : (storeYr / 1e9).toFixed(0) + " GB", "lit"));
        clear(work);
        [`DAU = ${v.dau}M users`, `reads/sec  = ${v.dau}M × ${v.reads} / 100,000s ≈ ${fmt(rps)}  (a day ≈ 86,400s, round to 1e5)`, `peak       = ${fmt(rps)} × ${v.peak} ≈ ${fmt(rps * v.peak)}`, `writes/sec = ${v.dau}M × ${v.writes} / 1e5 ≈ ${fmt(wps)}`, `storage    = ${v.dau}M × ${v.writes}/day × 365 × ${v.size}KB ≈ ${storeYr >= 1e12 ? (storeYr / 1e12).toFixed(1) + " TB" : (storeYr / 1e9).toFixed(0) + " GB"}/year`].forEach((l) => work.appendChild(h("div", null, l)));
        cap.textContent = (rps * v.peak > 50000 ? "Peak reads are high: plan for caching (CDN, Redis) and read replicas. " : "This fits comfortably on a few app servers and one primary database with a replica. ") + (wps > 5000 ? "Writes are heavy enough to think about sharding or a write-optimised store." : "Writes are modest; a single primary handles them.") + " Interviewers care that you show the arithmetic and let numbers drive the design.";
      }
      root.append(h("div", { class: "vgrid2" },
        range("daily active users", { min: 1, max: 500, value: v.dau, fmt: (x) => x + "M" }, (x) => { v.dau = x; calc(); }).el,
        range("reads per user per day", { min: 1, max: 200, value: v.reads }, (x) => { v.reads = x; calc(); }).el,
        range("writes per user per day", { min: 0.1, max: 50, step: 0.1, value: v.writes }, (x) => { v.writes = x; calc(); }).el,
        range("size per write", { min: 0.1, max: 500, step: 0.1, value: v.size, fmt: (x) => x + "KB" }, (x) => { v.size = x; calc(); }).el,
        range("peak multiplier", { min: 1, max: 10, value: v.peak, fmt: (x) => x + "×" }, (x) => { v.peak = x; calc(); }).el), out, work, cap);
      calc();
    },
  });

  // ---------------------------------------------------------------- virtual list
  add({
    id: "virtual-list",
    title: "Virtualised lists",
    blurb: "10,000 rows, but only a handful in the DOM",
    nodes: ["frontend-sd", "react-performance"],
    mount(root) {
      const total = 10000, rowH = 28, viewH = 196;
      let virtual = true;
      const inner = h("div", { style: `position:relative;height:${total * rowH}px` });
      const vp = h("div", { style: `height:${viewH}px;overflow:auto;border:1px solid var(--line-strong);border-radius:8px;background:var(--bg-raised)`, tabindex: "0", "aria-label": "Scrollable list of 10,000 transactions" }, inner);
      const stats = h("div", { class: "vstats" });
      const cap = caption();
      function render() {
        clear(inner);
        const top = vp.scrollTop;
        const first = virtual ? Math.max(0, Math.floor(top / rowH) - 3) : 0;
        const last = virtual ? Math.min(total, Math.ceil((top + viewH) / rowH) + 3) : Math.min(total, 400);
        for (let i = first; i < last; i++) inner.appendChild(h("div", { style: `position:absolute;left:0;right:0;top:${i * rowH}px;height:${rowH}px;padding:4px 10px;border-bottom:1px solid var(--line);font:0.8rem var(--f-code);display:flex;justify-content:space-between` }, h("span", null, `txn #${i + 1}`), h("span", { class: "muted" }, `₹${((i * 7919) % 9000) + 100}`)));
        clear(stats).append(stat("rows in the data", total.toLocaleString()), stat("rows in the DOM", (last - first).toLocaleString(), virtual ? "good" : "bad"));
        cap.textContent = virtual ? `Only rows ${first + 1}–${last} exist as DOM nodes. As you scroll, the same few elements are reused for new data. Smooth at 10,000 rows or 1,000,000.` : "Without virtualisation every row becomes a DOM node (capped at 400 here so your phone survives). At 10,000 rows the first render takes seconds and scrolling stutters.";
      }
      vp.addEventListener("scroll", () => { if (virtual) render(); });
      root.append(seg([{ v: true, label: "Virtualised" }, { v: false, label: "Render everything" }], true, (v) => { virtual = v; render(); }, "Rendering").el, vp, stats, cap);
      render();
    },
  });
})();
