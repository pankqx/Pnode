/* Phase 0 explainers: the web, Git, HTML, CSS, forms */
(function () {
  const { h, s, clear, button, row, caption, seg, range, select, chip, stat, sequence } = window.VZ;
  const add = window.PNODE_VIZ.add;

  // ---------------------------------------------------------------- request journey
  add({
    id: "request-journey",
    title: "From URL bar to pixels",
    blurb: "Every message your browser sends before you see a page",
    nodes: ["how-the-web-works", "networks"],
    mount(root, ctx) {
      sequence(ctx, root, {
        actors: ["Browser", "DNS resolver", "Server"],
        steps: [
          { from: 0, to: 0, label: "Check cache for the IP", say: "You press Enter. The browser first checks its own cache, then the operating system, for the site's IP address." },
          { from: 0, to: 1, label: "Where is example.com?", say: "Not cached, so it asks a DNS resolver, usually your ISP's or a public one like 1.1.1.1." },
          { from: 1, to: 1, label: "root → .com → owner", say: "The resolver walks the DNS tree: a root server points to the .com servers, which point to the domain's own name server." },
          { from: 1, to: 0, label: "93.184.215.14", say: "The resolver returns the IP address. Everyone along the way caches it for the record's TTL, so the next visit skips all of this." },
          { from: 0, to: 2, label: "TCP: SYN", say: "Now a TCP connection. Three short messages agree on starting sequence numbers so lost packets can be detected later." },
          { from: 2, to: 0, label: "SYN-ACK", say: "The server agrees. One full round trip has passed. On a slow mobile network that alone can be 100ms or more." },
          { from: 0, to: 2, label: "ACK", say: "Connection open. Next comes encryption." },
          { from: 0, to: 2, label: "TLS: hello + key share", say: "TLS 1.3 sets up encryption in one round trip. The browser proposes ciphers and sends its half of a key exchange." },
          { from: 2, to: 0, label: "Certificate + key share", say: "The server proves who it is with a certificate signed by an authority your device trusts. Both sides now share a secret key." },
          { from: 0, to: 2, label: "GET /  (encrypted)", say: "Finally, the HTTP request: method, path and headers such as cookies, Accept-Language and caching hints." },
          { from: 2, to: 2, label: "Route → query DB → build HTML", say: "The server routes the request, maybe reads a database, and builds the response. This is the part your backend code controls." },
          { from: 2, to: 0, label: "200 OK + HTML", say: "Status 200, headers like Content-Type and Cache-Control, then the HTML body, streamed in chunks." },
          { from: 0, to: 0, label: "HTML → DOM, CSS → CSSOM", say: "The browser parses HTML into the DOM and requests the CSS, JS and images it finds, often in parallel over the same connection." },
          { from: 0, to: 0, label: "Layout → Paint → Composite", say: "DOM plus CSSOM makes the render tree. The browser works out sizes and positions (layout), fills in pixels (paint), and stacks layers on the GPU (composite). You see the page." },
        ],
      });
    },
  });

  // ---------------------------------------------------------------- git graph
  add({
    id: "git-graph",
    title: "Branch, merge and rebase, visually",
    blurb: "Click the Git commands and watch the commit graph change",
    nodes: ["git-like-a-pro"],
    mount(root, ctx) {
      let st;
      function reset() {
        st = { n: 2, commits: [{ id: "C1", parents: [], lane: 0 }, { id: "C2", parents: ["C1"], lane: 0 }], main: "C2", feature: null, head: "main", gone: new Set() };
      }
      reset();
      const byId = () => Object.fromEntries(st.commits.map((c) => [c.id, c]));
      function ancestors(tip) {
        const m = byId(), out = new Set(), stack = tip ? [tip] : [];
        while (stack.length) { const x = stack.pop(); if (out.has(x)) continue; out.add(x); (m[x].parents || []).forEach((p) => stack.push(p)); }
        return out;
      }
      const cmd = h("pre", { class: "vcode" }, h("div", null, "$ git log --graph"));
      const cap = caption("A repo with two commits on main. HEAD points to main. Try making a branch.");
      const svgHost = h("div", { class: "vscroll" });
      function say(command, text) { clear(cmd).appendChild(h("div", null, "$ " + command)); cap.textContent = text; draw(); }
      function newCommit(lane, parents) { const id = "C" + (++st.n); st.commits.push({ id, parents, lane }); return id; }

      const actions = row(
        button("Commit", () => {
          if (st.commits.length > 16) { cap.textContent = "That's plenty of commits. Press Reset to start over."; return; }
          const tip = st[st.head];
          const id = newCommit(st.head === "main" ? 0 : 1, [tip]);
          st[st.head] = id;
          say(`git commit -m "work"`, `New commit ${id} on ${st.head}. Its parent is ${tip}. The branch pointer "${st.head}" moves forward to it.`);
        }, { lit: true }),
        button("New branch: feature", () => {
          if (st.feature) { say("git switch -c feature", "A branch called feature already exists. Use Switch instead."); return; }
          st.feature = st.main; st.head = "feature";
          say("git switch -c feature", `Created "feature" pointing at ${st.main}, the same commit as main. A branch is just a movable label. Nothing was copied.`);
        }),
        button("Switch branch", () => {
          if (!st.feature) { say("git switch feature", "There is no feature branch yet."); return; }
          st.head = st.head === "main" ? "feature" : "main";
          say(`git switch ${st.head}`, `HEAD now points to ${st.head}. New commits will move that branch.`);
        }),
        button("Merge feature into main", () => {
          if (!st.feature) { say("git merge feature", "Create a feature branch first."); return; }
          st.head = "main";
          const mainAnc = ancestors(st.main), featAnc = ancestors(st.feature);
          if (mainAnc.has(st.feature)) { say("git merge feature", "Already up to date: every feature commit is already in main."); return; }
          if (featAnc.has(st.main)) {
            st.main = st.feature;
            say("git merge feature", `Fast-forward. main had no new commits, so Git just slides the main label up to ${st.feature}. No merge commit needed.`);
            return;
          }
          const id = newCommit(0, [st.main, st.feature]);
          st.main = id;
          say("git merge feature", `Both branches moved on, so Git creates merge commit ${id} with two parents. History shows exactly what happened, in parallel.`);
        }),
        button("Rebase feature onto main", () => {
          if (!st.feature) { say("git rebase main", "Create a feature branch first."); return; }
          const mainAnc = ancestors(st.main);
          const only = st.commits.filter((c) => ancestors(st.feature).has(c.id) && !mainAnc.has(c.id));
          if (!only.length) { say("git rebase main", "Nothing to rebase: feature has no commits that main lacks."); return; }
          if (ancestors(st.feature).has(st.main)) { say("git rebase main", "feature already sits on top of main. Nothing to do."); return; }
          let base = st.main;
          only.forEach((c) => { st.gone.add(c.id); base = newCommit(1, [base]); });
          st.feature = base; st.head = "feature";
          say("git switch feature && git rebase main", `Git replays each feature commit on top of main as brand-new commits (new ids). The faded originals are now unreachable, but git reflog can still find them for a while. Never rebase commits teammates already pulled.`);
        }),
        button("Reset", () => { reset(); say("git log --graph", "Back to two commits on main."); }),
      );

      function draw() {
        const cs = st.commits, gap = 58, W = 50 + cs.length * gap, H = 168;
        const x = (i) => 34 + i * gap, y = (lane) => (lane === 0 ? 62 : 128);
        const pos = {};
        cs.forEach((c, i) => (pos[c.id] = { x: x(i), y: y(c.lane) }));
        const svg = s("svg", { class: "vsvg", viewBox: `0 0 ${W} ${H}`, style: `min-width:${Math.min(W, 1000)}px;max-width:${W * 1.4}px`, role: "img", "aria-label": "Commit graph" });
        svg.appendChild(s("text", { x: 4, y: 66, class: "t-dim", "font-size": 11 }, ""));
        cs.forEach((c) => c.parents.forEach((p) => {
          const a = pos[p], b = pos[c.id];
          const faded = st.gone.has(c.id);
          const d = a.y === b.y ? `M${a.x} ${a.y} L${b.x} ${b.y}` : `M${a.x} ${a.y} C${a.x + 30} ${a.y} ${b.x - 30} ${b.y} ${b.x} ${b.y}`;
          svg.appendChild(s("path", { d, class: "f-none " + (c.lane ? "s-sky" : "s-lit"), "stroke-width": 3, opacity: faded ? 0.25 : 1 }));
        }));
        cs.forEach((c) => {
          const p = pos[c.id], faded = st.gone.has(c.id);
          svg.appendChild(s("circle", { cx: p.x, cy: p.y, r: 14, class: (c.lane ? "f-sky" : "f-lit"), opacity: faded ? 0.25 : 1 }));
          svg.appendChild(s("text", { x: p.x, y: p.y + 4, "text-anchor": "middle", "font-size": 11, "font-weight": 700, class: "t-ink-on-lit mono", opacity: faded ? 0.5 : 1 }, c.id));
        });
        const tags = [["main", st.main, -1], ["feature", st.feature, 1]];
        tags.forEach(([name, tip, dir]) => {
          if (!tip) return;
          const p = pos[tip];
          const isHead = st.head === name;
          const ty = dir < 0 ? p.y - 36 : p.y + 24;
          const label = (isHead ? "HEAD → " : "") + name;
          const w = label.length * 7 + 14;
          svg.appendChild(s("rect", { x: p.x - w / 2, y: ty, width: w, height: 20, rx: 6, class: isHead ? "f-raised s-lit" : "f-raised s-line", "stroke-width": isHead ? 2 : 1 }));
          svg.appendChild(s("text", { x: p.x, y: ty + 14, "text-anchor": "middle", "font-size": 11, "font-weight": 700 }, label));
        });
        clear(svgHost).appendChild(svg);
      }
      draw();
      root.append(actions, svgHost, cmd, cap);
    },
  });

  // ---------------------------------------------------------------- screen reader
  add({
    id: "screen-reader",
    title: "What a screen reader hears",
    blurb: "Same look, very different experience for keyboard and screen reader users",
    nodes: ["semantic-html"],
    mount(root) {
      const code = {
        soup: [`<div class="nav">`, `  <div onclick="go('/')">Home</div>`, `</div>`, `<div class="btn" onclick="buy()">Buy now</div>`, `<span>Email</span> <input>`],
        semantic: [`<nav>`, `  <a href="/">Home</a>`, `</nav>`, `<button onclick="buy()">Buy now</button>`, `<label for="email">Email</label>`, `<input id="email" type="email">`],
      };
      const stops = {
        soup: ["edit text, blank"],
        semantic: ["navigation landmark. Home, link", "Buy now, button", "Email, edit text, email"],
      };
      let mode = "soup", i = -1;
      const pre = h("pre", { class: "vcode" });
      const heard = h("div", { class: "vlog", "aria-live": "polite" });
      const mock = h("div", { class: "vbox", style: "display:grid;gap:8px" },
        h("div", { style: "display:flex;gap:12px;align-items:center" }, h("b", null, "Shop"), h("span", { style: "text-decoration:underline" }, "Home")),
        h("span", { class: "vchip lit", style: "justify-self:start" }, "Buy now"),
        h("div", { style: "display:flex;gap:8px;align-items:center;font-size:.9rem" }, "Email", h("span", { class: "vitem", style: "flex:1" }, " ")));
      const cap = caption();
      function render() {
        clear(pre); code[mode].forEach((l) => pre.appendChild(h("div", null, l)));
        clear(heard);
        const list = stops[mode];
        if (i < 0) heard.appendChild(h("div", { class: "dim" }, "Press Tab to move focus, like a keyboard user would."));
        list.slice(0, i + 1).forEach((t, j) => heard.appendChild(h("div", { class: j === i ? "lit" : "" }, `Tab ${j + 1}: "${t}"`)));
        if (i >= list.length) heard.appendChild(h("div", { class: mode === "soup" ? "bad" : "good" }, mode === "soup" ? "Focus left the page. Home and Buy now were never reachable." : "Every control reached and announced with its name and role."));
        cap.textContent = mode === "soup"
          ? "Div soup looks identical, but divs aren't focusable and have no role. Keyboard users can't reach Home or Buy now, and the input has no name."
          : "Semantic HTML gives every control a role, a name and keyboard support for free. No ARIA needed.";
      }
      const sg = seg([{ v: "soup", label: "Div soup" }, { v: "semantic", label: "Semantic HTML" }], mode, (v) => { mode = v; i = -1; render(); }, "Markup style");
      root.append(row(sg.el, button("Press Tab", () => { if (i < stops[mode].length) i++; render(); }, { lit: true }), button("Start over", () => { i = -1; render(); })),
        h("div", { class: "vgrid2" }, h("div", null, h("div", { class: "small muted" }, "Looks like"), mock), h("div", null, h("div", { class: "small muted" }, "Screen reader says"), heard)),
        pre, cap);
      render();
    },
  });

  // ---------------------------------------------------------------- box model
  add({
    id: "box-model",
    title: "The box model",
    blurb: "Drag the sliders and watch the real size change",
    nodes: ["css-layout"],
    mount(root) {
      const v = { w: 160, p: 16, b: 6, m: 14, sizing: "content-box" };
      const stage = h("div", { style: "display:flex;justify-content:center;padding:6px 0;overflow:hidden" });
      const out = h("div", { class: "vstats" });
      const cap = caption();
      function render() {
        const content = v.sizing === "content-box" ? v.w : Math.max(0, v.w - 2 * v.p - 2 * v.b);
        const border = content + 2 * v.p + 2 * v.b;
        const marginBox = h("div", { style: `padding:${v.m}px;background:color-mix(in srgb, var(--plum) 18%, transparent);border:1px dashed var(--plum);border-radius:6px` },
          h("div", { style: `width:${border}px;border:${v.b}px solid var(--sky);padding:${v.p}px;background:color-mix(in srgb, var(--mint) 22%, transparent);box-sizing:border-box` },
            h("div", { style: `height:56px;background:var(--lit-soft);border:1px solid var(--lit);display:grid;place-items:center;font:700 .8rem var(--f-code)` }, `${content}px`)));
        clear(stage).appendChild(marginBox);
        clear(out).append(stat("content width", content + "px", "lit"), stat("border box (visible)", border + "px"), stat("space taken incl. margin", border + 2 * v.m + "px"));
        cap.textContent = v.sizing === "content-box"
          ? `content-box: width sets only the content (${v.w}px). Padding and border are added on top, so the box grows to ${border}px. This surprises everyone once.`
          : `border-box: width (${v.w}px) includes padding and border. The content shrinks to fit. That's why most CSS resets set box-sizing: border-box.`;
      }
      const sg = seg([{ v: "content-box", label: "content-box" }, { v: "border-box", label: "border-box" }], v.sizing, (x) => { v.sizing = x; render(); }, "box-sizing");
      root.append(sg.el,
        h("div", { class: "vgrid2" },
          range("width", { min: 80, max: 200, value: v.w, fmt: (x) => x + "px" }, (x) => { v.w = x; render(); }).el,
          range("padding", { min: 0, max: 30, value: v.p, fmt: (x) => x + "px" }, (x) => { v.p = x; render(); }).el,
          range("border", { min: 0, max: 12, value: v.b, fmt: (x) => x + "px" }, (x) => { v.b = x; render(); }).el,
          range("margin", { min: 0, max: 24, value: v.m, fmt: (x) => x + "px" }, (x) => { v.m = x; render(); }).el),
        h("div", { class: "vlegend" }, h("span", null, h("i", { style: "background:var(--lit)" }), "content"), h("span", null, h("i", { style: "background:var(--mint)" }), "padding"), h("span", null, h("i", { style: "background:var(--sky)" }), "border"), h("span", null, h("i", { style: "background:var(--plum)" }), "margin")),
        stage, out, cap);
      render();
    },
  });

  // ---------------------------------------------------------------- flexbox playground
  add({
    id: "flex-playground",
    title: "Flexbox playground",
    blurb: "Change one property at a time and see what it controls",
    nodes: ["css-layout"],
    mount(root) {
      const v = { dir: "row", justify: "flex-start", align: "stretch", wrap: "nowrap", gap: 8 };
      const box = h("div", { class: "vplay" }, ["nav", "logo", "search", "Aa", "me"].map((t) => h("div", null, t)));
      const pre = h("pre", { class: "vcode" });
      const cap = caption();
      const notes = {
        justify: "justify-content spaces items along the main axis (the direction items flow).",
        align: "align-items positions items on the cross axis (perpendicular to the flow).",
        dir: "flex-direction picks the main axis. Switch to column and justify/align swap jobs.",
        wrap: "flex-wrap lets items move onto new lines instead of shrinking.",
        gap: "gap adds space between items without margins on each one.",
      };
      function render(changed) {
        Object.assign(box.style, { display: "flex", flexDirection: v.dir, justifyContent: v.justify, alignItems: v.align, flexWrap: v.wrap, gap: v.gap + "px", minHeight: v.dir.startsWith("column") ? "300px" : "200px" });
        clear(pre);
        [".container {", "  display: flex;", `  flex-direction: ${v.dir};`, `  justify-content: ${v.justify};`, `  align-items: ${v.align};`, `  flex-wrap: ${v.wrap};`, `  gap: ${v.gap}px;`, "}"]
          .forEach((l) => pre.appendChild(h("div", { class: changed && l.includes(changedProp(changed)) ? "now" : "" }, l)));
        cap.textContent = changed ? notes[changed] : "The dashed box is the flex container. The amber boxes are flex items.";
      }
      const changedProp = (k) => ({ dir: "flex-direction", justify: "justify-content", align: "align-items", wrap: "flex-wrap", gap: "gap" }[k]);
      root.append(
        h("div", { class: "vgrid3" },
          select("flex-direction", ["row", "row-reverse", "column", "column-reverse"], v.dir, (x) => { v.dir = x; render("dir"); }),
          select("justify-content", ["flex-start", "center", "flex-end", "space-between", "space-around", "space-evenly"], v.justify, (x) => { v.justify = x; render("justify"); }),
          select("align-items", ["stretch", "flex-start", "center", "flex-end", "baseline"], v.align, (x) => { v.align = x; render("align"); }),
          select("flex-wrap", ["nowrap", "wrap"], v.wrap, (x) => { v.wrap = x; render("wrap"); })),
        range("gap", { min: 0, max: 24, value: v.gap, fmt: (x) => x + "px" }, (x) => { v.gap = x; render("gap"); }).el,
        box, pre, cap);
      render();
    },
  });

  // ---------------------------------------------------------------- grid auto-fit
  add({
    id: "grid-autofit",
    title: "Grid that reflows on its own",
    blurb: "repeat(auto-fit, minmax()) without a single media query",
    nodes: ["css-layout"],
    mount(root, ctx) {
      const v = { width: 100, min: 110, count: 6, mode: "auto-fit" };
      const grid = h("div", { class: "vplay", style: "min-height:0" });
      const outer = h("div", { style: "max-width:100%" }, grid);
      const pre = h("pre", { class: "vcode" });
      const cols = h("b", null, "");
      const cap = caption();
      function render() {
        clear(grid);
        for (let i = 0; i < v.count; i++) grid.appendChild(h("div", { style: "padding:14px 8px;text-align:center" }, "tile " + (i + 1)));
        Object.assign(grid.style, { display: "grid", gap: "8px", gridTemplateColumns: `repeat(${v.mode}, minmax(${v.min}px, 1fr))`, width: v.width + "%" });
        clear(pre).appendChild(h("div", { class: "now" }, `grid-template-columns: repeat(${v.mode}, minmax(${v.min}px, 1fr));`));
        requestAnimationFrame(() => {
          const n = getComputedStyle(grid).gridTemplateColumns.split(" ").filter(Boolean).length;
          cols.textContent = n + (n === 1 ? " column" : " columns");
          cap.textContent = v.mode === "auto-fit"
            ? `The browser fits as many ${v.min}px-or-wider columns as the width allows (${n} now), then stretches them to fill the row.`
            : `auto-fill keeps empty column tracks when there are few items, so tiles don't stretch. With enough items, it looks the same as auto-fit.`;
        });
      }
      const ro = window.ResizeObserver ? new ResizeObserver(() => render()) : null;
      if (ro) { ro.observe(outer); ctx.onCleanup(() => ro.disconnect()); }
      root.append(
        seg([{ v: "auto-fit", label: "auto-fit" }, { v: "auto-fill", label: "auto-fill" }], v.mode, (x) => { v.mode = x; render(); }, "Repeat mode").el,
        h("div", { class: "vgrid3" },
          range("container width", { min: 30, max: 100, value: v.width, fmt: (x) => x + "%" }, (x) => { v.width = x; render(); }).el,
          range("min column", { min: 70, max: 200, value: v.min, fmt: (x) => x + "px" }, (x) => { v.min = x; render(); }).el,
          range("tiles", { min: 2, max: 9, value: v.count }, (x) => { v.count = x; render(); }).el),
        h("div", { class: "small muted" }, "Right now: ", cols), outer, pre, cap);
      render();
    },
  });

  // ---------------------------------------------------------------- specificity
  function specificity(sel) {
    let x = String(sel || "").trim();
    x = x.replace(/:where\((?:[^()]|\([^()]*\))*\)/g, " ");
    x = x.replace(/:(?:not|is|has)\(((?:[^()]|\([^()]*\))*)\)/g, " $1 ");
    const ids = (x.match(/#[\w-]+/g) || []).length;
    const pe = (x.match(/::[\w-]+/g) || []).length;
    x = x.replace(/::[\w-]+/g, " ");
    const attrs = (x.match(/\[[^\]]*\]/g) || []).length;
    x = x.replace(/\[[^\]]*\]/g, " ");
    const pcs = (x.match(/:[\w-]+(\([^)]*\))?/g) || []).length;
    x = x.replace(/:[\w-]+(\([^)]*\))?/g, " ");
    const cls = (x.match(/\.[\w-]+/g) || []).length;
    x = x.replace(/[#.][\w-]+/g, " ");
    const els = (x.match(/(^|[\s>+~(,])([a-zA-Z][\w-]*)/g) || []).length + pe;
    return [ids, cls + attrs + pcs, els];
  }
  add({
    id: "specificity",
    title: "Specificity calculator",
    blurb: "Type two selectors and see which one wins",
    nodes: ["css-layout"],
    mount(root) {
      const presets = [["#nav a", ".nav .link"], ["ul li a.active", ".menu .active"], ["button:hover", ".btn"], ["article p::first-line", ".card p"], [":where(.card) p", "p"], ["a[href^='http']", "nav a"]];
      const a = h("input", { class: "vinput", value: presets[0][0], "aria-label": "Selector A" });
      const b = h("input", { class: "vinput", value: presets[0][1], "aria-label": "Selector B" });
      const out = h("div", { style: "display:grid;gap:8px;grid-template-columns:repeat(auto-fit,minmax(230px,1fr))" });
      const cap = caption();
      function card(name, sel, sp, win) {
        return h("div", { class: "vbox", style: win ? "border-color:var(--lit);border-width:2px" : "" },
          h("h4", null, name + (win ? " wins" : "")),
          h("div", { class: "mono", style: "font:0.85rem var(--f-code);margin-bottom:8px;overflow-wrap:anywhere" }, sel || "(empty)"),
          h("div", { style: "display:grid;grid-template-columns:repeat(3,1fr);gap:6px;text-align:center" },
            ["IDs", "classes", "elements"].map((l, i) => h("div", { class: "vitem" + (sp[i] ? " lit" : "") }, h("b", { style: "display:block;font-size:1.3rem;font-family:var(--f-display)" }, sp[i]), h("span", { style: "font-size:.7rem;color:var(--ink-3)" }, l)))));
      }
      function render() {
        const sa = specificity(a.value), sb = specificity(b.value);
        let cmp = 0;
        for (let i = 0; i < 3; i++) if (sa[i] !== sb[i]) { cmp = sa[i] > sb[i] ? 1 : -1; break; }
        clear(out).append(card("Selector A", a.value, sa, cmp > 0), card("Selector B", b.value, sb, cmp < 0));
        const col = cmp === 0 ? -1 : [0, 1, 2].find((i) => sa[i] !== sb[i]);
        cap.textContent = cmp === 0
          ? `Tie at (${sa.join(", ")}). When specificity ties, the rule written later in the CSS wins.`
          : `Compare left to right like a version number. They differ first in the ${["ID", "class", "element"][col]} column, so ${cmp > 0 ? "A" : "B"} wins, no matter how many items are in the columns after it. Inline styles beat both, and !important beats everything.`;
      }
      a.addEventListener("input", render); b.addEventListener("input", render);
      root.append(
        h("div", { class: "vrow" }, presets.map((p, i) => VZ.button(`Example ${i + 1}`, () => { a.value = p[0]; b.value = p[1]; render(); }))),
        h("div", { class: "vgrid2" }, h("label", { class: "vselect" }, h("span", null, "Selector A"), a), h("label", { class: "vselect" }, h("span", null, "Selector B"), b)),
        out, h("p", { class: "small muted", style: "margin:0" }, "The classes column also counts [attributes] and :pseudo-classes. Elements also counts ::pseudo-elements. :where() always counts zero."), cap);
      render();
    },
  });
  window.VZ.specificity = specificity;

  // ---------------------------------------------------------------- container query
  add({
    id: "container-query",
    title: "Container queries",
    blurb: "The card responds to its box, not the screen",
    nodes: ["modern-css"],
    mount(root, ctx) {
      const wrap = h("div", { class: "cq-wrap" },
        h("div", { class: "cq-card" }, h("div", { class: "cq-avatar", "aria-hidden": "true" }), h("div", null, h("b", null, "Riya Shetty"), h("span", null, "Frontend engineer, Mangaluru"))));
      const w = h("b", null, "");
      const cap = caption();
      const pre = h("pre", { class: "vcode" }, ...[".wrap { container-type: inline-size; }", "@container (min-width: 300px) {", "  .card { grid-template-columns: 72px 1fr; }", "}"].map((l) => h("div", null, l)));
      function update() {
        const px = Math.round(wrap.getBoundingClientRect().width);
        w.textContent = px + "px";
        cap.textContent = px >= 300 ? `Container is ${px}px, at least 300px, so the card switches to side-by-side. The screen size never mattered.` : `Container is ${px}px, under 300px, so the card stacks. Same component, any column it's dropped into.`;
      }
      const rg = range("container width", { min: 35, max: 100, value: 100, fmt: (x) => x + "%" }, (x) => { wrap.style.width = x + "%"; update(); });
      const ro = window.ResizeObserver ? new ResizeObserver(update) : null;
      if (ro) { ro.observe(wrap); ctx.onCleanup(() => ro.disconnect()); }
      root.append(rg.el, h("div", { class: "small muted" }, "Container width: ", w), wrap, pre, cap);
      update();
    },
  });

  // ---------------------------------------------------------------- validation
  add({
    id: "validation-flow",
    title: "Why the server must validate too",
    blurb: "A normal user versus someone using curl",
    nodes: ["forms-and-platform"],
    mount(root, ctx) {
      const host = h("div");
      const modes = {
        user: [
          { from: 0, to: 0, label: "Types age = -5", say: "A normal user fills the signup form and makes a mistake." },
          { from: 0, to: 1, label: "submit event", say: "The browser fires submit. Native rules (min=\"13\", required) run first." },
          { from: 1, to: 0, label: "\"Age must be 13 or more\"", tone: "bad", say: "Client-side validation blocks it instantly with a helpful message. Great user experience, zero network cost." },
          { from: 0, to: 1, label: "Fixes: age = 21", say: "The user corrects it." },
          { from: 1, to: 2, label: "POST /signup {age: 21}", say: "Now the request goes to the server." },
          { from: 2, to: 2, label: "Zod: re-check everything", say: "The server validates again, from scratch. It never assumes the browser checked." },
          { from: 2, to: 0, label: "201 Created", tone: "good", say: "Valid, saved, done." },
        ],
        attacker: [
          { from: 0, to: 0, label: "Skips the form entirely", say: "Someone opens a terminal. Your HTML and JavaScript never run." },
          { from: 0, to: 2, label: "curl POST {age: -5, role: \"admin\"}", tone: "bad", say: "They send any JSON they like, including fields your form never had." },
          { from: 2, to: 2, label: "Zod: age ≥ 13? unknown keys?", say: "Server-side validation is the only check that actually runs here. Strict schemas reject unknown keys like role." },
          { from: 2, to: 0, label: "400 Bad Request", tone: "good", say: "Rejected with field-level errors. Without this check, you'd have a negative age, or worse, a new admin." },
        ],
      };
      const sg = seg([{ v: "user", label: "Normal user" }, { v: "attacker", label: "curl / attacker" }], "user", (v) => sequence(ctx, host, { actors: ["User", "Browser JS", "Server"], steps: modes[v] }), "Who sends the request");
      root.append(sg.el, host);
      sequence(ctx, host, { actors: ["User", "Browser JS", "Server"], steps: modes.user });
    },
  });
})();
