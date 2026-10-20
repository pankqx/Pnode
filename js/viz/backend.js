/* Phases 4 and 5 explainers: Node, APIs, auth, security, databases */
(function () {
  const { h, s, clear, button, row, caption, seg, range, chip, stat, stepper, sequence } = window.VZ;
  const add = window.PNODE_VIZ.add;

  // ---------------------------------------------------------------- middleware pipeline
  add({
    id: "middleware-pipeline",
    title: "A request through Express middleware",
    blurb: "Break something and watch where the request stops",
    nodes: ["express-middleware"],
    mount(root, ctx) {
      const stages = [
        { k: "json", label: "express.json()", ok: "parses the body" },
        { k: "reqid", label: "requestId", ok: "adds X-Request-Id: 7f3a" },
        { k: "log", label: "pino-http", ok: "logs the request" },
        { k: "auth", label: "requireAuth", ok: "finds user u_42 from the session" },
        { k: "validate", label: "validate(schema)", ok: "body matches the Zod schema" },
        { k: "handler", label: "createNote handler", ok: "saves the note" },
      ];
      const fail = { auth: false, validate: false, handler: false };
      const boxes = stages.map((st) => h("div", { class: "vitem", style: "display:flex;justify-content:space-between;gap:8px;flex-wrap:wrap" }, h("b", null, st.label), h("span", { class: "muted" }, "")));
      const errBox = h("div", { class: "vitem", style: "display:flex;justify-content:space-between;gap:8px;flex-wrap:wrap" }, h("b", null, "errorHandler(err, req, res, next)"), h("span", { class: "muted" }, ""));
      const resp = h("div", { class: "vitem", style: "font:0.9rem var(--f-code)" }, "POST /notes");
      const cap = caption("Toggle a failure, then send the request.");
      let timers = [];
      function reset() { boxes.forEach((b) => { b.className = "vitem"; b.lastChild.textContent = ""; }); errBox.className = "vitem"; errBox.lastChild.textContent = ""; }
      function send() {
        timers.forEach((t) => ctx.clear(t)); timers = []; reset(); resp.textContent = "POST /notes  →  …"; resp.className = "vitem";
        let i = 0;
        const step = () => {
          const st = stages[i], b = boxes[i];
          if (fail[st.k]) {
            b.className = "vitem bad";
            const why = { auth: "no valid session → next(new UnauthorizedError())", validate: "title missing → next(new ValidationError(details))", handler: "database timeout → throws" }[st.k];
            b.lastChild.textContent = why;
            timers.push(ctx.after(() => {
              errBox.className = "vitem lit";
              const r = { auth: ["401", '{ "error": { "code": "UNAUTHORIZED" } }'], validate: ["400", '{ "error": { "code": "VALIDATION", "details": { "title": "Required" } } }'], handler: ["500", '{ "error": { "code": "INTERNAL", "requestId": "7f3a" } }'] }[st.k];
              errBox.lastChild.textContent = "maps the error to " + r[0];
              resp.textContent = `← ${r[0]} ${r[1]}`; resp.className = "vitem bad";
              cap.textContent = st.k === "handler" ? "An unexpected error skips straight to the error handler. It logs the full stack with the request id, but the client only gets a generic message. No stack traces leak." : `The chain stops at ${st.label}. Every later middleware is skipped and the central error handler turns the error into a consistent response.`;
            }, 600));
            return;
          }
          b.className = "vitem mint"; b.lastChild.textContent = st.ok;
          i++;
          if (i < stages.length) timers.push(ctx.after(step, 500));
          else timers.push(ctx.after(() => { resp.textContent = '← 201 Created { "id": "n_981" }'; resp.className = "vitem mint"; cap.textContent = "Every middleware called next() and the handler sent 201. Order matters: auth must run before validation, and the error handler must be registered last."; }, 400));
        };
        step();
      }
      const toggles = row(...Object.keys(fail).map((k) => { const c = h("input", { type: "checkbox" }); c.addEventListener("change", () => (fail[k] = c.checked)); return h("label", { class: "small", style: "display:flex;gap:6px;align-items:center" }, c, { auth: "no session cookie", validate: "missing title", handler: "handler throws" }[k]); }));
      root.append(toggles, row(button("Send request", send, { lit: true })), h("div", { class: "vstack" }, ...boxes.flatMap((b, i) => (i ? [h("div", { class: "small muted", style: "padding-left:12px" }, "↓ next()"), b] : [b]))), h("div", { class: "small muted", style: "padding-left:12px" }, "errors jump here ↓"), errBox, resp, cap);
    },
  });

  // ---------------------------------------------------------------- pagination
  add({
    id: "pagination",
    title: "Offset vs cursor pagination",
    blurb: "A new post arrives while you scroll. Who shows a duplicate?",
    nodes: ["rest-express"],
    mount(root) {
      let mode = "offset", posts, pages, nextId, cursor;
      function reset() { nextId = 13; posts = Array.from({ length: 12 }, (_, i) => 12 - i); pages = []; cursor = null; }
      reset();
      const feed = h("div", { class: "vstack" });
      const req = h("div", { class: "vitem", style: "font:0.85rem var(--f-code)" }, "");
      const cap = caption("Newest first, 4 per page. Load page 1.");
      function draw() {
        clear(feed);
        const seen = new Set();
        pages.forEach((pg, pi) => pg.forEach((id) => { const dup = seen.has(id); seen.add(id); feed.appendChild(h("div", { class: "vitem" + (dup ? " bad" : pi === pages.length - 1 ? " lit" : ""), style: "display:flex;justify-content:space-between" }, h("span", null, `Post #${id}`), h("span", { class: "muted" }, dup ? "duplicate!" : `page ${pi + 1}`))); }));
        if (!pages.length) feed.appendChild(h("div", { class: "small muted" }, "No pages loaded."));
      }
      function load() {
        const n = pages.length;
        let page;
        if (mode === "offset") { page = posts.slice(n * 4, n * 4 + 4); req.textContent = `GET /posts?limit=4&offset=${n * 4}`; }
        else { const start = cursor == null ? 0 : posts.indexOf(cursor) + 1; page = posts.slice(start, start + 4); req.textContent = `GET /posts?limit=4${cursor ? `&after=${btoa("post:" + cursor)}` : ""}`; }
        if (!page.length) { cap.textContent = "No more posts."; return; }
        pages.push(page); cursor = page[page.length - 1];
        draw();
        const dup = pages.flat().length !== new Set(pages.flat()).size;
        cap.textContent = dup ? "OFFSET 4 now points one row earlier because a new post pushed everything down. Post repeated. With deletes, posts get skipped instead." : mode === "cursor" ? "The cursor says \"give me posts older than the last one I saw\". New posts at the top can't shift it." : "Looks fine so far…";
      }
      const sg = seg([{ v: "offset", label: "Offset" }, { v: "cursor", label: "Cursor" }], mode, (v) => { mode = v; reset(); draw(); req.textContent = ""; cap.textContent = "Load page 1, add a new post, then load page 2."; }, "Pagination type");
      root.append(sg.el, row(button("Load next page", load, { lit: true }), button("A new post is published", () => { posts.unshift(nextId++); cap.textContent = `Post #${nextId - 1} was just published at the top of the feed. Now load the next page.`; }), button("Reset", () => { reset(); draw(); req.textContent = ""; })), req, feed, cap);
      draw();
    },
  });

  // ---------------------------------------------------------------- JWT
  add({
    id: "jwt-flow",
    title: "Access tokens and refresh rotation",
    blurb: "Look inside a JWT, then follow the refresh flow",
    nodes: ["auth"],
    mount(root, ctx) {
      const host = h("div");
      const b64 = (o) => btoa(JSON.stringify(o)).replace(/=+$/, "").replace(/\+/g, "-").replace(/\//g, "_");
      const header = { alg: "HS256", typ: "JWT" };
      const payload = { sub: "u_42", role: "editor", iat: 1792400000, exp: 1792400900 };
      const sig = "q3V9xF0c_8mTzK1eR7pYwN2bLs4aJ6hDgU5oE0iC9vA";
      function anatomy() {
        clear(host);
        const parts = [[b64(header), "--plum", "header", JSON.stringify(header, null, 1)], [b64(payload), "--sky", "payload (claims)", JSON.stringify(payload, null, 1)], [sig, "--lit", "signature", "HMAC-SHA256(header + \".\" + payload, SECRET)"]];
        const tokenEl = h("div", { class: "vitem", style: "font:0.78rem/1.6 var(--f-code);overflow-wrap:anywhere" }, ...parts.flatMap(([t, c], i) => [h("span", { style: `color:var(${c});font-weight:700` }, t), i < 2 ? h("span", null, ".") : null]));
        host.append(tokenEl, h("div", { class: "vgrid3" }, ...parts.map(([, c, label, dec]) => h("div", { class: "vbox", style: `border-color:var(${c})` }, h("h4", null, label), h("pre", { style: "margin:0;font:0.75rem/1.4 var(--f-code);white-space:pre-wrap;overflow-wrap:anywhere" }, dec)))),
          caption("Header and payload are only base64url-encoded, not encrypted. Anyone can read them, so never put secrets inside. The signature proves the server issued it and nobody edited the payload: change role to \"admin\" and the signature no longer matches."));
      }
      const flows = {
        refresh: [
          { from: 0, to: 1, label: "POST /login (email, password)", say: "The user logs in once with their password." },
          { from: 1, to: 2, label: "store refresh token #1 (hashed)", say: "The server saves a hash of a long random refresh token, tied to a token family." },
          { from: 1, to: 0, label: "access JWT (15 min) + cookie: refresh #1", say: "Short-lived access token in the response; the refresh token goes in an HttpOnly, Secure, SameSite cookie JavaScript can't read." },
          { from: 0, to: 1, label: "GET /notes  Authorization: Bearer …", say: "Each API call sends the access token. The server verifies the signature without touching the database." },
          { from: 1, to: 0, label: "401 token expired", tone: "bad", say: "15 minutes later the access token expires." },
          { from: 0, to: 1, label: "POST /refresh (cookie: refresh #1)", say: "The browser silently asks for a new one, sending the refresh cookie automatically." },
          { from: 1, to: 2, label: "#1 valid → mark used, store #2", say: "Rotation: refresh token #1 is used up and replaced by #2." },
          { from: 1, to: 0, label: "new access JWT + cookie: refresh #2", tone: "good", say: "The user never noticed. Short access tokens limit damage if one leaks." },
        ],
        theft: [
          { from: 3, to: 3, label: "steals old refresh #1", tone: "bad", say: "Suppose an attacker copied refresh token #1 earlier." },
          { from: 3, to: 1, label: "POST /refresh (refresh #1)", tone: "bad", say: "They try to use it to get their own access token." },
          { from: 1, to: 2, label: "#1 was already used!", tone: "bad", say: "The server sees a refresh token that was already rotated. Only a thief would replay it." },
          { from: 1, to: 2, label: "revoke the whole family", say: "Reuse detection: every token in that family is revoked, including the real user's #2." },
          { from: 1, to: 3, label: "401", tone: "good", say: "The attacker gets nothing." },
          { from: 0, to: 1, label: "POST /refresh (refresh #2)", say: "The real user's next refresh also fails…" },
          { from: 1, to: 0, label: "401 → please log in again", say: "…so they log in again with their password. Slightly annoying, completely safe. This is why rotation plus reuse detection is the recommended pattern." },
        ],
      };
      const sg = seg([{ v: "anatomy", label: "Token anatomy" }, { v: "refresh", label: "Refresh flow" }, { v: "theft", label: "Stolen token" }], "anatomy", (v) => { if (host._seq) host._seq.stop(); if (v === "anatomy") anatomy(); else sequence(ctx, host, { actors: v === "theft" ? ["Browser", "API", "Token store", "Attacker"] : ["Browser", "API", "Token store"], steps: flows[v] }); }, "View");
      root.append(sg.el, host);
      anatomy();
    },
  });

  // ---------------------------------------------------------------- password salting
  add({
    id: "password-salt",
    title: "Hashing and salting passwords",
    blurb: "Same password, different users, different hashes",
    nodes: ["auth"],
    mount(root) {
      const pw = h("input", { class: "vinput", value: "password123", "aria-label": "Password" });
      const out = h("div", { class: "vstack" });
      const cap = caption();
      const enc = (t) => new TextEncoder().encode(t);
      async function sha(t) { if (!window.crypto || !crypto.subtle) return "(hashing needs a secure https page)"; const b = await crypto.subtle.digest("SHA-256", enc(t)); return [...new Uint8Array(b)].map((x) => x.toString(16).padStart(2, "0")).join(""); }
      const salts = { Riya: "f9c2a1", Arjun: "07be5d" };
      async function draw() {
        clear(out);
        const plain = await sha(pw.value);
        out.appendChild(h("div", { class: "vbox" }, h("h4", null, "Unsalted: sha256(password)"),
          ...Object.keys(salts).map((u) => h("div", { class: "vitem bad", style: "font:0.75rem var(--f-code);overflow-wrap:anywhere;margin-top:4px" }, `${u}: ${plain.slice(0, 32)}…`))));
        const rows = [];
        for (const u of Object.keys(salts)) { const hsh = await sha(salts[u] + pw.value); rows.push(h("div", { class: "vitem mint", style: "font:0.75rem var(--f-code);overflow-wrap:anywhere;margin-top:4px" }, `${u}: salt ${salts[u]} → ${hsh.slice(0, 32)}…`)); }
        out.appendChild(h("div", { class: "vbox" }, h("h4", null, "Salted: sha256(salt + password)"), ...rows));
        cap.textContent = "Without a salt, two users with the same password get identical hashes, and attackers can look them up in precomputed tables. A random salt per user makes every hash unique. Real systems use bcrypt or argon2, which add the salt for you and are deliberately slow: about 10 guesses per second per core instead of billions.";
      }
      pw.addEventListener("input", draw);
      root.append(h("label", { class: "vselect" }, h("span", null, "Both users choose this password"), pw), out, h("div", { class: "vstats" }, stat("SHA-256 guesses/sec (one GPU)", "~10 billion", "bad"), stat("bcrypt cost 12 guesses/sec", "~10", "good")), h("p", { class: "small muted", style: "margin:0" }, "Guess rates are rough orders of magnitude. SHA-256 is used here only to show salting; never store passwords with plain SHA-256."), cap);
      draw();
    },
  });

  // ---------------------------------------------------------------- CORS
  add({
    id: "cors-preflight",
    title: "CORS preflight",
    blurb: "What the browser asks before a cross-origin request",
    nodes: ["authz-security", "how-the-web-works"],
    mount(root, ctx) {
      const host = h("div");
      const flows = {
        allowed: [
          { from: 0, to: 1, label: "fetch('https://api.pnode.dev/notes', { method: 'PATCH' })", say: "Code on app.pnode.dev wants to call a different origin with PATCH and a JSON body." },
          { from: 1, to: 1, label: "Different origin + non-simple request", say: "The browser, not your code, decides it must ask permission first." },
          { from: 1, to: 2, label: "OPTIONS /notes  Origin: app.pnode.dev", say: "Preflight: \"Will you accept PATCH with Content-Type: application/json from this origin?\"" },
          { from: 2, to: 1, label: "204  Allow-Origin: app.pnode.dev, Allow-Methods: PATCH", tone: "good", say: "The API explicitly allows that origin and method." },
          { from: 1, to: 2, label: "PATCH /notes  (the real request)", say: "Only now does the actual request go out." },
          { from: 2, to: 1, label: "200 + Allow-Origin header", say: "The response also carries the CORS header." },
          { from: 1, to: 0, label: "response readable by your JS", tone: "good", say: "Your code receives the data." },
        ],
        blocked: [
          { from: 0, to: 1, label: "fetch('https://api.pnode.dev/notes')", say: "Code on evil.example tries to read your API using the visitor's cookies." },
          { from: 1, to: 2, label: "OPTIONS  Origin: evil.example", say: "The browser preflights again." },
          { from: 2, to: 1, label: "204, no Allow-Origin for evil.example", say: "The API's allow-list doesn't include this origin." },
          { from: 1, to: 0, label: "TypeError: blocked by CORS policy", tone: "bad", say: "The browser refuses to send the real request and the page can't read anything. CORS protects users' data from other sites. curl or Postman ignore CORS entirely; it's only a browser rule, so your server still needs auth." },
        ],
      };
      const sg = seg([{ v: "allowed", label: "Allowed origin" }, { v: "blocked", label: "Other origin" }], "allowed", (v) => sequence(ctx, host, { actors: ["Your JS", "Browser", "API"], steps: flows[v] }), "Origin");
      root.append(sg.el, host);
      sequence(ctx, host, { actors: ["Your JS", "Browser", "API"], steps: flows.allowed });
    },
  });

  // ---------------------------------------------------------------- IDOR
  add({
    id: "idor",
    title: "Broken access control (IDOR)",
    blurb: "Logged in is not the same as allowed",
    nodes: ["authz-security"],
    mount(root) {
      let scoped = false;
      const notes = [{ id: 41, owner: "riya", t: "Riya's salary negotiation notes" }, { id: 42, owner: "arjun", t: "Arjun's startup idea" }, { id: 43, owner: "riya", t: "Riya's grocery list" }];
      const code = h("pre", { class: "vcode" });
      const out = h("div", { class: "vlog" });
      const cap = caption("You're logged in as riya. Request each note by id.");
      function drawCode() { clear(code); (scoped ? ["// scoped to the logged-in user", "const note = await db.note.findFirst({", "  where: { id, ownerId: req.user.id },", "});", "if (!note) return res.status(404).end();"] : ["// only checks that someone is logged in", "const note = await db.note.findUnique({", "  where: { id },", "});"]).forEach((l) => code.appendChild(h("div", { class: l.includes("ownerId") || l.includes("where: { id }") ? "now" : "" }, l))); }
      function get(n) {
        const allowed = !scoped || n.owner === "riya";
        out.appendChild(h("div", { class: allowed ? (n.owner === "riya" ? "good" : "bad") : "good" }, `GET /notes/${n.id} → ${allowed ? `200 "${n.t}"` : "404 Not Found"}`));
        out.scrollTop = out.scrollHeight;
        cap.textContent = n.owner !== "riya" ? (allowed ? "Riya just read Arjun's private note by changing one number in the URL. This is the most common serious vulnerability on the web (OWASP #1)." : "Scoped query: the note isn't Riya's, so it's simply not found. Returning 404 instead of 403 doesn't even confirm the note exists.") : "Her own note. Fine either way.";
      }
      const sg = seg([{ v: false, label: "Unscoped query" }, { v: true, label: "Scoped by owner" }], false, (v) => { scoped = v; drawCode(); clear(out); }, "Query");
      root.append(sg.el, code, row(...notes.map((n) => button(`GET /notes/${n.id}`, () => get(n), { lit: n.id === 42 }))), out, cap);
      drawCode();
    },
  });

  // ---------------------------------------------------------------- blocking node
  add({
    id: "node-blocking",
    title: "Don't block the event loop",
    blurb: "Four requests, one thread",
    nodes: ["node-internals", "node-runtime"],
    mount(root, ctx) {
      const M = {
        async: { label: "Async I/O", say: "Each request does 40ms of JavaScript, then waits 400ms on the database. While it waits, the single thread is free to start the next request. All four finish around 600ms." },
        blocking: { label: "Sync CPU work", say: "Each request runs 400ms of synchronous CPU work (like hashing with a sync function or parsing a huge JSON). The one thread is busy, so requests queue. The last user waits 1.6s. Move heavy work to worker threads or a queue." },
      };
      let mode = "async";
      const arrive = [0, 50, 100, 150];
      function plan() {
        if (mode === "async") return arrive.map((a) => ({ a, cpu: [a, a + 40], io: [a + 40, a + 440], done: a + 460 }));
        let free = 0;
        return arrive.map((a) => { const s0 = Math.max(a, free); free = s0 + 400; return { a, wait: [a, s0], cpu: [s0, s0 + 400], done: s0 + 400 }; });
      }
      const lanes = h("div", { class: "vstack" });
      const stats = h("div", { class: "vstats" });
      const cap = caption();
      const max = 1700;
      const bar = (a, b, c) => h("div", { style: `position:absolute;top:3px;bottom:3px;left:${(a / max) * 100}%;width:${((b - a) / max) * 100}%;background:var(${c});border-radius:3px` });
      function draw() {
        clear(lanes);
        const P = plan();
        P.forEach((p, i) => lanes.appendChild(h("div", { style: "display:grid;grid-template-columns:60px 1fr;gap:8px;align-items:center" }, h("span", { class: "small" }, `user ${i + 1}`),
          h("div", { style: "position:relative;height:22px;background:var(--bg-raised);border:1px solid var(--line);border-radius:5px" }, p.wait && p.wait[1] > p.wait[0] ? bar(p.wait[0], p.wait[1], "--danger") : null, bar(p.cpu[0], p.cpu[1], "--lit"), p.io ? bar(p.io[0], p.io[1], "--sky") : null))));
        clear(stats).append(stat("slowest response", Math.max(...P.map((p) => p.done - p.a)) + "ms", mode === "async" ? "good" : "bad"), stat("all done at", Math.max(...P.map((p) => p.done)) + "ms"));
        cap.textContent = M[mode].say;
      }
      const sg = seg(Object.entries(M).map(([v, m]) => ({ v, label: m.label })), mode, (v) => { mode = v; draw(); }, "Handler type");
      root.append(sg.el, lanes, h("div", { class: "vlegend" }, h("span", null, h("i", { style: "background:var(--lit)" }), "main thread busy"), h("span", null, h("i", { style: "background:var(--sky)" }), "waiting on I/O (thread free)"), h("span", null, h("i", { style: "background:var(--danger)" }), "stuck in line")), stats, cap);
      draw();
    },
  });

  // ---------------------------------------------------------------- streams
  add({
    id: "streams-memory",
    title: "readFile vs streams",
    blurb: "Process a 2GB log on a server with 512MB of RAM",
    nodes: ["node-runtime"],
    mount(root, ctx) {
      let mode = "read", stop = null;
      const mem = h("div", { class: "meter", style: "height:18px" }, h("i", { style: "width:0%" }));
      const prog = h("div", { class: "meter", style: "height:10px" }, h("i", { style: "width:0%;background:var(--sky)" }));
      const stats = h("div", { class: "vstats" });
      const cap = caption("Press Run.");
      function run() {
        if (stop) stop();
        const t0 = performance.now();
        stop = ctx.loop((now) => {
          const t = Math.min(1, (now - t0) / 2600);
          let used, done;
          if (mode === "read") { used = Math.min(1, t * 2.2) * 2048; done = 0; }
          else { used = 40 + Math.sin(t * 40) * 6; done = t; }
          const crash = mode === "read" && used >= 512;
          mem.firstChild.style.width = Math.min(100, (used / 512) * 100) + "%";
          mem.firstChild.style.background = `var(${crash ? "--danger" : used > 300 ? "--lit" : "--mint"})`;
          prog.firstChild.style.width = done * 100 + "%";
          clear(stats).append(stat("memory used", crash ? "512MB+" : Math.round(used) + "MB", crash ? "bad" : "good"), stat("file processed", Math.round(done * 2048) + " / 2048MB"));
          if (crash) { cap.textContent = "FATAL ERROR: JavaScript heap out of memory. readFile tries to hold the entire 2GB file in RAM before you can touch a single line."; stop(); stop = null; return; }
          if (t >= 1) { cap.textContent = "Done. The stream read the file in 64KB chunks, handled each line and let it go. Memory stayed flat no matter how large the file was."; stop(); stop = null; }
          else if (mode === "stream") cap.textContent = "Reading chunk by chunk with readline. Memory stays around 40MB.";
          else cap.textContent = "Loading the whole file into memory…";
        });
      }
      const sg = seg([{ v: "read", label: "fs.readFile" }, { v: "stream", label: "createReadStream + readline" }], mode, (v) => { mode = v; run(); }, "Approach");
      root.append(sg.el, row(button("Run", run, { lit: true })), h("div", { class: "small muted" }, "Memory (limit 512MB)"), mem, h("div", { class: "small muted" }, "Progress"), prog, stats, cap);
    },
  });

  // ---------------------------------------------------------------- API styles
  add({
    id: "api-styles",
    title: "REST vs GraphQL vs tRPC",
    blurb: "One screen needs a user's name and their last three post titles",
    nodes: ["api-styles"],
    mount(root) {
      const M = {
        rest: { label: "REST", reqs: ["GET /users/42", "GET /users/42/posts?limit=3"], bytes: 3800, used: 210, code: ["const u = await fetch('/users/42').then(r => r.json());", "const p = await fetch('/users/42/posts?limit=3').then(r => r.json());", "// both responses include every field (bio, avatar, body…)"], say: "Two round trips, and each endpoint returns its full shape. Simple, cacheable by URL, easy to debug. Over-fetching is the usual cost." },
        graphql: { label: "GraphQL", reqs: ["POST /graphql { user(id: 42) { name posts(last: 3) { title } } }"], bytes: 210, used: 210, code: ["query {", "  user(id: 42) {", "    name", "    posts(last: 3) { title }", "  }", "}"], say: "One request asking for exactly the fields needed. Great for many clients with different needs. Costs: a schema to maintain, harder HTTP caching, and resolvers that can cause N+1 queries if you're careless." },
        trpc: { label: "tRPC", reqs: ["GET /trpc/user.withPosts?input={id:42}"], bytes: 900, used: 210, code: ["// server: a typed procedure", "withPosts: publicProcedure.input(z.object({ id: z.string() }))", "  .query(({ input }) => getUserWithPosts(input.id)),", "// client: fully typed, no schema files, no codegen", "const data = trpc.user.withPosts.useQuery({ id: '42' });"], say: "Procedures you call like functions, with end-to-end TypeScript types. Perfect when one team owns a TS frontend and backend in a monorepo. Not meant for public or multi-language APIs." },
      };
      let mode = "rest";
      const body = h("div", { style: "display:grid;gap:8px" });
      const cap = caption();
      function draw() {
        const m = M[mode];
        clear(body).append(
          h("pre", { class: "vcode" }, m.code.map((l) => h("div", null, l))),
          h("div", { class: "vstack" }, m.reqs.map((r) => h("div", { class: "vitem sky", style: "font:0.8rem var(--f-code);overflow-wrap:anywhere" }, r))),
          h("div", { class: "vstats" }, stat("round trips", m.reqs.length, m.reqs.length > 1 ? "lit" : "good"), stat("bytes downloaded", m.bytes.toLocaleString(), m.bytes > 1000 ? "bad" : "good"), stat("bytes actually used", m.used)));
        cap.textContent = m.say;
      }
      root.append(seg(Object.entries(M).map(([v, m]) => ({ v, label: m.label })), mode, (v) => { mode = v; draw(); }, "API style").el, body, cap);
      draw();
    },
  });

  // ---------------------------------------------------------------- uploads
  add({
    id: "upload-flow",
    title: "Uploading through your server vs presigned URL",
    blurb: "Who carries the bytes?",
    nodes: ["files-email"],
    mount(root, ctx) {
      const host = h("div");
      const flows = {
        proxy: [
          { from: 0, to: 1, label: "POST /upload  (800MB video)", say: "The browser sends the whole file to your API." },
          { from: 1, to: 1, label: "holds 800MB in memory / disk", tone: "bad", say: "Your server's bandwidth, memory and request timeout are all tied up for minutes." },
          { from: 1, to: 2, label: "PUT object (800MB again)", say: "Then it re-uploads the same bytes to storage. You pay for the traffic twice." },
          { from: 2, to: 1, label: "200", say: "Finally stored." },
          { from: 1, to: 0, label: "201 { url }", say: "Fine for small avatars. Painful for big files." },
        ],
        presigned: [
          { from: 0, to: 1, label: "POST /uploads { name, size, type }", say: "The browser only sends metadata. Your API checks auth, size limit and type." },
          { from: 1, to: 1, label: "sign a URL valid for 5 min", say: "The API creates a presigned URL that allows exactly one PUT to one key." },
          { from: 1, to: 0, label: "{ uploadUrl, key }", say: "A tiny response." },
          { from: 0, to: 2, label: "PUT uploadUrl  (800MB, direct)", tone: "good", say: "The browser uploads straight to object storage. Your servers never touch the bytes." },
          { from: 2, to: 0, label: "200", say: "Stored." },
          { from: 0, to: 1, label: "POST /uploads/:key/complete", say: "The browser confirms; the API verifies the object exists, records metadata and queues processing (thumbnails, virus scan)." },
        ],
      };
      const sg = seg([{ v: "proxy", label: "Through your API" }, { v: "presigned", label: "Presigned URL" }], "proxy", (v) => sequence(ctx, host, { actors: ["Browser", "Your API", "Object storage"], steps: flows[v] }), "Upload path");
      root.append(sg.el, host);
      sequence(ctx, host, { actors: ["Browser", "Your API", "Object storage"], steps: flows.proxy });
    },
  });

  // ---------------------------------------------------------------- normalisation
  add({
    id: "normalization",
    title: "Why normalise: the update anomaly",
    blurb: "A customer moves city. How many rows must change?",
    nodes: ["data-modeling", "dbms-theory"],
    mount(root) {
      let mode = "flat", moved = false;
      const host = h("div", { class: "vscroll" });
      const cap = caption("Riya moves from Mangaluru to Bengaluru. Press Update.");
      const orders = [["o1", "Brownie box"], ["o2", "Cold coffee"], ["o3", "Cookie tin"]];
      function table(head, rows, hl) { return h("table", { style: "border-collapse:collapse;width:100%;font-size:.82rem" }, h("thead", null, h("tr", null, head.map((x) => h("th", { style: "text-align:left;padding:5px 8px;border-bottom:1px solid var(--line-strong);color:var(--ink-3)" }, x)))), h("tbody", null, rows.map((r, i) => h("tr", null, r.map((c, j) => h("td", { style: `padding:5px 8px;border-bottom:1px solid var(--line);${hl && hl(i, j) ? "background:" + hl(i, j) : ""}` }, c)))))); }
      function draw() {
        clear(host);
        if (mode === "flat") {
          const city = (i) => (moved ? (i === 2 ? "Mangaluru" : "Bengaluru") : "Mangaluru");
          host.appendChild(table(["order", "item", "customer", "city"], orders.map(([o, it], i) => [o, it, "Riya", city(i)]), (i, j) => (j === 3 && moved ? (i === 2 ? "color-mix(in srgb, var(--danger) 25%, transparent)" : "color-mix(in srgb, var(--mint) 20%, transparent)") : null)));
        } else {
          host.append(h("div", { class: "small muted", style: "margin:4px 0" }, "customers"), table(["id", "name", "city"], [["c1", "Riya", moved ? "Bengaluru" : "Mangaluru"]], (i, j) => (j === 2 && moved ? "color-mix(in srgb, var(--mint) 20%, transparent)" : null)),
            h("div", { class: "small muted", style: "margin:10px 0 4px" }, "orders"), table(["order", "item", "customer_id"], orders.map(([o, it]) => [o, it, "c1"])));
        }
      }
      function update() {
        moved = true; draw();
        cap.textContent = mode === "flat" ? "The city is copied into every order row. The update had to touch 3 rows, and one was missed (a bug, a crash mid-update, a forgotten query). Now the database disagrees with itself: which city is right?" : "The city lives in exactly one row. One update, and every order sees it through customer_id. That's normalisation: each fact stored once.";
      }
      const sg = seg([{ v: "flat", label: "Duplicated (denormalised)" }, { v: "norm", label: "Normalised" }], mode, (v) => { mode = v; moved = false; draw(); cap.textContent = "Press Update."; }, "Schema");
      root.append(sg.el, row(button("Update Riya's city", update, { lit: true })), host, cap);
      draw();
    },
  });

  // ---------------------------------------------------------------- embed vs reference
  add({
    id: "embed-reference",
    title: "MongoDB: embed or reference?",
    blurb: "Watch a document grow as comments pile up",
    nodes: ["mongodb"],
    mount(root, ctx) {
      let mode = "embed", comments = 3, stop = null;
      const doc = h("pre", { class: "vcode" });
      const stats = h("div", { class: "vstats" });
      const meter = h("div", { class: "meter", style: "height:14px" }, h("i", { style: "width:0%" }));
      const cap = caption();
      function draw() {
        const kb = mode === "embed" ? 2 + comments * 0.6 : 2;
        clear(doc);
        const lines = mode === "embed"
          ? ["{ _id: \"p1\", title: \"Brownie launch\",", "  author: { name: \"Pank\" },   // small, read together", `  comments: [ …${comments.toLocaleString()} embedded comments… ]`, "}"]
          : ["posts:    { _id: \"p1\", title: \"Brownie launch\", commentCount: " + comments.toLocaleString() + " }", "comments: { _id, postId: \"p1\", text, createdAt }  × " + comments.toLocaleString(), "// index { postId: 1, createdAt: -1 } for paging"];
        lines.forEach((l) => doc.appendChild(h("div", null, l)));
        const pct = Math.min(100, (kb / 16384) * 100);
        meter.firstChild.style.width = pct + "%";
        meter.firstChild.style.background = `var(${pct > 90 ? "--danger" : pct > 50 ? "--lit" : "--mint"})`;
        clear(stats).append(stat("post document size", kb >= 1024 ? (kb / 1024).toFixed(1) + "MB" : kb.toFixed(0) + "KB", pct > 90 ? "bad" : "good"), stat("reads to show post + 20 comments", mode === "embed" ? "1" : "2"), stat("16MB document limit", pct.toFixed(1) + "% used"));
        cap.textContent = mode === "embed"
          ? (pct >= 100 ? "The document hit MongoDB's 16MB limit. Writes now fail, and even before that, every read dragged megabytes of comments you didn't show. Unbounded arrays must be referenced." : "Embedding is perfect for small, bounded data read with its parent (author summary, line items). But comments can grow forever.")
          : "Referenced comments live in their own collection with an index on postId. The post stays tiny and you page through comments. One extra query, no size ceiling.";
      }
      function viral() { if (stop) stop(); const t0 = performance.now(); stop = ctx.loop((now) => { comments = Math.round(3 + Math.pow((now - t0) / 2500, 3) * 30000); draw(); if (now - t0 > 2600) { stop(); stop = null; } }); }
      const sg = seg([{ v: "embed", label: "Embed comments" }, { v: "ref", label: "Reference comments" }], mode, (v) => { mode = v; comments = 3; draw(); }, "Model");
      root.append(sg.el, row(button("The post goes viral", viral, { lit: true }), button("Reset", () => { if (stop) stop(); comments = 3; draw(); })), doc, meter, stats, cap);
      draw();
    },
  });

  // ---------------------------------------------------------------- index scan
  add({
    id: "index-scan",
    title: "Collection scan vs index",
    blurb: "Find one email among many rows",
    nodes: ["indexes"],
    mount(root, ctx) {
      let n = 64, target = 45, timers = [];
      const grid = h("div", { style: "display:grid;grid-template-columns:repeat(16,1fr);gap:3px" });
      const stats = h("div", { class: "vstats" });
      const big = h("div", { class: "vstats" });
      const cap = caption("Rows are sorted by email in the index, but stored in insertion order in the table.");
      const cells = [];
      function build() { clear(grid); cells.length = 0; for (let i = 0; i < n; i++) { const c = h("div", { style: "aspect-ratio:1;border-radius:3px;background:var(--bg-raised);border:1px solid var(--line);font:0.55rem var(--f-code);display:grid;place-items:center;color:var(--ink-3)" }, String(i)); cells.push(c); grid.appendChild(c); } }
      function paint(i, col) { cells[i].style.background = `var(${col})`; cells[i].style.color = "var(--lit-ink)"; }
      function clearT() { timers.forEach((t) => ctx.clear(t)); timers = []; build(); }
      function scan() {
        clearT(); let k = 0;
        for (let i = 0; i <= target; i++) timers.push(ctx.after(() => { paint(i, i === target ? "--mint" : "--danger"); k++; clear(stats).append(stat("rows examined", k, "bad"), stat("rows returned", i === target ? 1 : 0)); }, i * 35));
        timers.push(ctx.after(() => (cap.textContent = `COLLSCAN: checked ${target + 1} rows one by one. On average that's half the table. With 10 million rows, that's 5 million reads for one user.`), (target + 1) * 35));
      }
      function index() {
        clearT(); let lo = 0, hi = n - 1, k = 0, d = 0;
        while (lo <= hi) {
          const mid = (lo + hi) >> 1; const kk = ++k;
          timers.push(ctx.after(() => { paint(mid, mid === target ? "--mint" : "--lit"); clear(stats).append(stat("index entries checked", kk, "good"), stat("rows returned", mid === target ? 1 : 0)); }, d++ * 380));
          if (mid === target) break; if (mid < target) lo = mid + 1; else hi = mid - 1;
        }
        timers.push(ctx.after(() => (cap.textContent = `IXSCAN: the sorted index lets the database halve the search each step: ${k} checks instead of ${target + 1}. A real B-tree is wider and shallower, so even 10 million rows take only 3 or 4 page reads.`), d * 380));
      }
      function drawBig(rows) { const log = Math.ceil(Math.log2(rows)); clear(big).append(stat(`scan of ${rows.toLocaleString()} rows`, `~${Math.round(rows / 2).toLocaleString()} reads`, "bad"), stat("binary search over an index", `~${log} reads`, "good")); }
      root.append(row(button("Find without index", scan), button("Find with index", index, { lit: true })), grid, stats, cap,
        range("imagine the table has", { min: 3, max: 9, value: 6, fmt: (x) => "10^" + x + " rows" }, (x) => drawBig(Math.pow(10, x))).el, big);
      build(); drawBig(1e6);
    },
  });

  // ---------------------------------------------------------------- aggregation
  add({
    id: "aggregation-pipeline",
    title: "Aggregation pipeline",
    blurb: "Revenue per city, computed inside the database",
    nodes: ["aggregation"],
    mount(root, ctx) {
      const docs = [["Mangaluru", "paid", 450], ["Udupi", "paid", 300], ["Mangaluru", "failed", 200], ["Bengaluru", "paid", 880], ["Mangaluru", "paid", 120], ["Udupi", "refunded", 150], ["Bengaluru", "paid", 640]];
      const stages = ['{ $match: { status: "paid" } }', '{ $group: { _id: "$city", revenue: { $sum: "$amount" }, orders: { $sum: 1 } } }', "{ $sort: { revenue: -1 } }"];
      const F = [];
      F.push({ st: -1, rows: docs.map((d) => `${d[0]} · ${d[1]} · ₹${d[2]}`), say: "Seven order documents enter the pipeline." });
      const paid = docs.filter((d) => d[1] === "paid");
      F.push({ st: 0, rows: paid.map((d) => `${d[0]} · paid · ₹${d[2]}`), say: "$match keeps only paid orders. Put it first so it can use an index and shrink the work for every later stage." });
      const g = {}; paid.forEach(([c, , a]) => { g[c] = g[c] || { r: 0, n: 0 }; g[c].r += a; g[c].n++; });
      const grouped = Object.entries(g).map(([c, v]) => ({ c, ...v }));
      F.push({ st: 1, rows: grouped.map((x) => `{ _id: "${x.c}", revenue: ${x.r}, orders: ${x.n} }`), say: "$group collapses the documents into one per city, summing amounts and counting orders." });
      F.push({ st: 2, rows: grouped.slice().sort((a, b) => b.r - a.r).map((x) => `{ _id: "${x.c}", revenue: ${x.r}, orders: ${x.n} }`), say: "$sort orders the result by revenue. Three small documents travel to your app instead of every order." });
      const code = h("pre", { class: "vcode" });
      const out = h("div", { class: "vstack" });
      const cap = caption();
      const st = stepper(ctx, { count: F.length, render(i) { const f = F[i]; clear(code); code.appendChild(h("div", { class: "done" }, "db.orders.aggregate([")); stages.forEach((l, j) => code.appendChild(h("div", { class: j === f.st ? "now" : j < f.st ? "done" : "" }, "  " + l + ","))); code.appendChild(h("div", { class: "done" }, "])")); clear(out); f.rows.forEach((r) => out.appendChild(h("div", { class: "vitem" + (f.st >= 1 ? " lit" : "") }, r))); cap.textContent = f.say; } });
      root.append(code, h("div", { class: "vbox" }, h("h4", null, "documents after this stage"), out), cap, st.el);
      st.go(0);
    },
  });

  // ---------------------------------------------------------------- SQL joins
  add({
    id: "sql-joins",
    title: "SQL joins",
    blurb: "Same two tables, four kinds of join",
    nodes: ["postgres-prisma", "dbms-theory"],
    mount(root) {
      const users = [[1, "Riya"], [2, "Arjun"], [3, "Meena"]];
      const orders = [[101, 1, "₹450"], [102, 1, "₹120"], [103, 2, "₹880"], [104, 9, "₹60"]];
      let type = "INNER";
      const code = h("pre", { class: "vcode" });
      const host = h("div", { class: "vscroll" });
      const cap = caption();
      const notes = {
        INNER: "Only rows that match on both sides. Meena has no orders and order 104 points to a user that doesn't exist, so both disappear.",
        LEFT: "Every user, matched orders where they exist, NULL where they don't. Use it for \"users with zero orders\": add WHERE o.id IS NULL.",
        RIGHT: "Every order, with the user if one exists. Order 104 shows NULL for the user, which tells you you're missing a foreign key constraint.",
        FULL: "Everything from both sides, with NULLs filling the gaps. Handy for reconciliation reports.",
      };
      function cell(v) { return h("td", { style: `padding:5px 8px;border-bottom:1px solid var(--line);${v === "NULL" ? "color:var(--danger);font-weight:700" : ""}` }, String(v)); }
      function draw() {
        clear(code).append(h("div", null, "SELECT u.name, o.id, o.total"), h("div", null, "FROM users u"), h("div", { class: "now" }, `${type} JOIN orders o ON o.user_id = u.id;`));
        const res = [];
        const matchedOrders = new Set();
        users.forEach(([uid, name]) => {
          const os = orders.filter((o) => o[1] === uid);
          os.forEach((o) => { matchedOrders.add(o[0]); res.push([name, o[0], o[2]]); });
          if (!os.length && (type === "LEFT" || type === "FULL")) res.push([name, "NULL", "NULL"]);
        });
        if (type === "RIGHT") { res.length = 0; orders.forEach((o) => { const u = users.find((x) => x[0] === o[1]); res.push([u ? u[1] : "NULL", o[0], o[2]]); }); }
        if (type === "FULL") orders.filter((o) => !matchedOrders.has(o[0])).forEach((o) => res.push(["NULL", o[0], o[2]]));
        const t = (head, rows) => h("table", { style: "border-collapse:collapse;font-size:.82rem;width:100%" }, h("thead", null, h("tr", null, head.map((x) => h("th", { style: "text-align:left;padding:5px 8px;border-bottom:1px solid var(--line-strong);color:var(--ink-3)" }, x)))), h("tbody", null, rows.map((r) => h("tr", null, r.map(cell)))));
        clear(host).appendChild(h("div", { style: "display:grid;gap:12px;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));min-width:300px" },
          h("div", { class: "vbox" }, h("h4", null, "users"), t(["id", "name"], users)),
          h("div", { class: "vbox" }, h("h4", null, "orders"), t(["id", "user_id", "total"], orders)),
          h("div", { class: "vbox", style: "border-color:var(--lit)" }, h("h4", null, `result: ${res.length} rows`), t(["name", "order", "total"], res))));
        cap.textContent = notes[type];
      }
      root.append(seg(["INNER", "LEFT", "RIGHT", "FULL"].map((v) => ({ v, label: v })), type, (v) => { type = v; draw(); }, "Join type").el, code, host, cap);
      draw();
    },
  });

  // ---------------------------------------------------------------- N+1
  add({
    id: "n-plus-one",
    title: "The N+1 query problem",
    blurb: "Load 10 posts with their authors",
    nodes: ["postgres-prisma", "api-styles"],
    mount(root, ctx) {
      let mode = "n1", timers = [];
      const code = h("pre", { class: "vcode" });
      const log = h("div", { class: "vlog" });
      const stats = h("div", { class: "vstats" });
      const cap = caption("Press Load.");
      function drawCode() { clear(code); (mode === "n1" ? ["const posts = await prisma.post.findMany({ take: 10 });", "for (const p of posts) {", "  p.author = await prisma.user.findUnique({", "    where: { id: p.authorId } });   // inside a loop!", "}"] : ["const posts = await prisma.post.findMany({", "  take: 10,", "  include: { author: true },   // one batched query", "});"]).forEach((l) => code.appendChild(h("div", { class: l.includes("loop") || l.includes("include") ? "now" : "" }, l))); }
      function load() {
        timers.forEach((t) => ctx.clear(t)); timers = []; clear(log);
        const qs = mode === "n1" ? ["SELECT * FROM posts LIMIT 10", ...Array.from({ length: 10 }, (_, i) => `SELECT * FROM users WHERE id = ${[3, 7, 3, 12, 7, 5, 3, 9, 12, 5][i]}`)] : ["SELECT * FROM posts LIMIT 10", "SELECT * FROM users WHERE id IN (3, 7, 12, 5, 9)"];
        qs.forEach((q, i) => timers.push(ctx.after(() => { log.appendChild(h("div", { class: i === 0 ? "" : mode === "n1" ? "bad" : "good" }, `query ${i + 1}: ${q}`)); log.scrollTop = log.scrollHeight; const ms = (i + 1) * 4; clear(stats).append(stat("queries", i + 1, mode === "n1" ? "bad" : "good"), stat("time at 4ms per round trip", ms + "ms")); }, i * 160)));
        timers.push(ctx.after(() => (cap.textContent = mode === "n1" ? "1 query for the list plus 1 per post = 11 round trips, and it grows with the page size. Users 3, 7, 12 and 5 were even fetched twice. On a real network this is the most common reason a page is slow." : "2 queries no matter how many posts: the ORM collects the author ids and fetches them in one IN query (a join also works). DataLoader does the same batching for GraphQL resolvers."), qs.length * 160));
      }
      const sg = seg([{ v: "n1", label: "Query in a loop" }, { v: "batch", label: "include / join" }], mode, (v) => { timers.forEach((t) => ctx.clear(t)); timers = []; mode = v; drawCode(); clear(log); clear(stats); cap.textContent = "Press Load."; }, "Approach");
      root.append(sg.el, code, row(button("Load posts", load, { lit: true })), log, stats, cap);
      drawCode();
    },
  });

  // ---------------------------------------------------------------- oversell
  add({
    id: "oversell-race",
    title: "100 buyers, 10 seats",
    blurb: "Check-then-write vs an atomic update",
    nodes: ["transactions-cache", "concurrency"],
    mount(root, ctx) {
      let mode = "naive", timers = [];
      const seats = h("div", { style: "display:grid;grid-template-columns:repeat(auto-fill,minmax(26px,1fr));gap:4px" });
      const code = h("pre", { class: "vcode" });
      const stats = h("div", { class: "vstats" });
      const cap = caption("Press Start the sale.");
      function drawCode() { clear(code); (mode === "naive" ? ["const ev = await db.event.findUnique({ where: { id } });", "if (ev.seatsLeft > 0) {               // read…", "  await db.event.update({ where: { id },", "    data: { seatsLeft: ev.seatsLeft - 1 } });  // …then write", "  await db.ticket.create({ … });", "}"] : ["UPDATE events SET seats_left = seats_left - 1", "WHERE id = $1 AND seats_left > 0      -- check + write in ONE statement", "RETURNING seats_left;", "-- 0 rows returned → sold out"]).forEach((l) => code.appendChild(h("div", { class: l.includes("read") || l.includes("ONE") ? "now" : "" }, l))); }
      function start() {
        timers.forEach((t) => ctx.clear(t)); timers = []; clear(seats);
        let left = 10, sold = 0;
        const batches = 12;
        for (let b = 0; b < batches; b++) {
          timers.push(ctx.after(() => {
            const concurrent = [3, 2, 4, 2, 3, 1, 2, 3, 2, 1, 2, 3][b];
            if (mode === "naive") {
              const snapshot = left;
              for (let k = 0; k < concurrent; k++) if (snapshot > 0) { sold++; seats.appendChild(h("div", { style: `aspect-ratio:1;border-radius:4px;background:var(${sold > 10 ? "--danger" : "--mint"})`, title: `ticket ${sold}` })); }
              if (snapshot > 0) left = snapshot - 1;
            } else {
              for (let k = 0; k < concurrent; k++) if (left > 0) { left--; sold++; seats.appendChild(h("div", { style: "aspect-ratio:1;border-radius:4px;background:var(--mint)", title: `ticket ${sold}` })); }
            }
            clear(stats).append(stat("tickets sold", sold, sold > 10 ? "bad" : "good"), stat("seats that exist", 10), stat("oversold", Math.max(0, sold - 10), sold > 10 ? "bad" : "good"));
          }, b * 260));
        }
        timers.push(ctx.after(() => (cap.textContent = mode === "naive" ? `Requests arriving together all READ the same seatsLeft value before any of them WROTE. Each thought a seat was free. ${sold - 10} people now hold tickets for seats that don't exist.` : "Each UPDATE checks and decrements in one atomic statement. The database serialises them on the row, so exactly 10 succeed and the rest get \"sold out\". No locks in your code, no oversell."), batches * 260));
      }
      const sg = seg([{ v: "naive", label: "Read, then write" }, { v: "atomic", label: "Atomic conditional UPDATE" }], mode, (v) => { timers.forEach((t) => ctx.clear(t)); timers = []; mode = v; drawCode(); clear(seats); clear(stats); cap.textContent = "Press Start the sale."; }, "Approach");
      root.append(sg.el, code, row(button("Start the sale", start, { lit: true })), seats, stats, cap);
      drawCode();
    },
  });

  // ---------------------------------------------------------------- cache-aside
  add({
    id: "cache-aside",
    title: "Cache-aside with Redis",
    blurb: "Hits, misses, TTL and invalidation",
    nodes: ["transactions-cache"],
    mount(root, ctx) {
      let entry = null, hits = 0, misses = 0, price = 450, ttl = 10;
      const log = h("div", { class: "vlog" });
      const stats = h("div", { class: "vstats" });
      const cacheBox = h("div", { class: "vbox" });
      const cap = caption("Request the product a few times.");
      function say(t, c) { log.appendChild(h("div", { class: c || "" }, t)); log.scrollTop = log.scrollHeight; }
      const stop = ctx.loop(() => {
        const left = entry ? Math.max(0, ttl - (performance.now() - entry.at) / 1000) : 0;
        if (entry && left <= 0) { entry = null; say("redis: key product:7 expired (TTL)", "dim"); }
        clear(cacheBox).append(h("h4", null, "redis  product:7"), entry ? h("div", { class: "vrow" }, chip(`{ price: ${entry.price} }`, "mint"), h("span", { class: "small muted" }, `expires in ${left.toFixed(1)}s`)) : h("span", { class: "small muted" }, "(empty)"));
        const total = hits + misses;
        clear(stats).append(stat("cache hits", hits, "good"), stat("misses (DB reads)", misses, "lit"), stat("hit rate", total ? Math.round((hits / total) * 100) + "%" : "–"));
      });
      ctx.onCleanup(stop);
      function request() {
        if (entry) { hits++; say(`GET /products/7 → cache HIT (2ms)  price ${entry.price}`, "good"); cap.textContent = entry.price !== price ? "A hit, but it's serving the OLD price. Someone updated the database without invalidating the cache. That's stale data." : "Served from memory in ~2ms. The database wasn't touched."; return; }
        misses++; say("GET /products/7 → cache MISS → SELECT … (45ms)", "lit");
        entry = { price, at: performance.now() }; say(`redis: SET product:7 EX ${ttl}`, "dim");
        cap.textContent = "Miss: read the database, then store the result in Redis with a TTL so the next request is fast.";
      }
      root.append(range("TTL", { min: 3, max: 30, value: ttl, fmt: (x) => x + "s" }, (x) => (ttl = x)).el,
        row(button("GET /products/7", request, { lit: true }),
          button("Admin updates price (no invalidation)", () => { price += 50; say(`DB: UPDATE price = ${price}`, "dim"); cap.textContent = "The database changed, but the cache still holds the old value until the TTL runs out."; }),
          button("Update + DEL cache key", () => { price += 50; entry = null; say(`DB: UPDATE price = ${price}; redis: DEL product:7`, "good"); cap.textContent = "Invalidate on write: the next request misses and loads the fresh price. This is the standard fix."; })),
        cacheBox, stats, log, cap);
    },
  });
})();
