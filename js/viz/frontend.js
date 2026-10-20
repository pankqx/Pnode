/* Phases 2, 3, 6 explainers: TypeScript, React, Next.js */
(function () {
  const { h, s, clear, button, row, caption, seg, range, chip, stat, stepper } = window.VZ;
  const add = window.PNODE_VIZ.add;
  function codeBlock(lines) {
    const pre = h("pre", { class: "vcode" });
    const rows = lines.map((l) => { const d = h("div", null, l || " "); pre.appendChild(d); return d; });
    return { el: pre, rows, mark(i) { rows.forEach((r, j) => (r.className = j === i ? "now" : "")); } };
  }

  // ---------------------------------------------------------------- TS narrowing
  add({
    id: "ts-narrowing",
    title: "Narrowing: what TypeScript knows on each line",
    blurb: "Step through and watch the type of value shrink",
    nodes: ["ts-basics"],
    mount(root, ctx) {
      const code = codeBlock([
        "function format(value: string | number | null) {",
        "  if (value === null) {",
        '    return "—";',
        "  }",
        '  if (typeof value === "string") {',
        "    return value.trim();",
        "  }",
        "  return value.toFixed(2);",
        "}",
      ]);
      const F = [
        { line: 0, t: "string | number | null", say: "At the top, value could be any of three types. Calling value.trim() here would be a compile error, because numbers and null don't have trim." },
        { line: 1, t: "string | number | null", say: "An equality check against null is a type guard. TypeScript splits the world into two branches." },
        { line: 2, t: "null", say: "Inside the if, value can only be null." },
        { line: 4, t: "string | number", say: "Because the null branch returned, TypeScript removes null from everything after it. No ! needed." },
        { line: 5, t: "string", say: "typeof narrowed it to string. value.trim() is now allowed and autocompletes." },
        { line: 7, t: "number", say: "Only number is left. toFixed is safe. This is called control-flow analysis." },
        { line: 0, t: "string | number | null", bad: true, say: "Try value.toFixed(2) on line 1 and you'd get: Property 'toFixed' does not exist on type 'string'. TypeScript caught a crash before you ran anything." },
      ];
      const badge = h("div", { class: "vitem lit", style: "font:1rem var(--f-code);font-weight:700" });
      const cap = caption();
      const st = stepper(ctx, { count: F.length, speed: 2000, render(i) { const f = F[i]; code.mark(f.line); badge.textContent = "value: " + f.t; badge.className = "vitem " + (f.bad ? "bad" : "lit"); cap.textContent = f.say; } });
      root.append(code.el, h("div", { class: "small muted" }, "TypeScript's view right now"), badge, cap, st.el);
      st.go(0);
    },
  });

  // ---------------------------------------------------------------- generics
  add({
    id: "ts-generics",
    title: "Generics keep the type flowing",
    blurb: "Pick the input and see what TypeScript infers",
    nodes: ["ts-generics"],
    mount(root) {
      const inputs = {
        users: { arr: "User[]", T: "User", keys: ["id", "name", "email", "createdAt"], sample: "[{ id: \"u1\", name: \"Riya\", … }]" },
        orders: { arr: "Order[]", T: "Order", keys: ["id", "total", "status"], sample: "[{ id: \"o9\", total: 45000, … }]" },
        numbers: { arr: "number[]", T: "number", keys: [], sample: "[3, 1, 4]" },
      };
      let cur = "users";
      const code = h("pre", { class: "vcode" });
      const out = h("div", { class: "vgrid2" });
      const keyRow = h("div", { class: "vrow" });
      const cap = caption();
      function render(key) {
        const x = inputs[cur];
        clear(code).append(
          h("div", null, "function first<T>(items: T[]): T | undefined"),
          h("div", null, "function sortBy<T, K extends keyof T>(items: T[], key: K): T[]"),
          h("div", null, " "),
          h("div", { class: "now" }, `const list = ${x.sample};  // ${x.arr}`),
          h("div", { class: "now" }, `const a = first(list);       // ${x.T} | undefined`),
          key ? h("div", { class: x.keys.includes(key) ? "now" : "now" }, `sortBy(list, "${key}");`) : null);
        clear(out).append(
          h("div", { class: "vbox" }, h("h4", null, "T is inferred as"), h("div", { class: "vitem lit", style: "font:1rem var(--f-code);font-weight:700" }, x.T)),
          h("div", { class: "vbox" }, h("h4", null, "first(list) returns"), h("div", { class: "vitem sky", style: "font:1rem var(--f-code)" }, `${x.T} | undefined`)));
        clear(keyRow);
        const tryKeys = [...x.keys.slice(0, 3), "password"];
        if (!x.keys.length) keyRow.appendChild(h("span", { class: "small muted" }, "number has no fields to sort by, so keyof number only allows number methods."));
        else tryKeys.forEach((k) => keyRow.appendChild(button(`sortBy(list, "${k}")`, () => render(k), { lit: false })));
        if (!key) cap.textContent = `You never wrote ${x.T} anywhere. TypeScript read it from the argument and carried it through to the return type. With any, all of this would be lost.`;
        else if (x.keys.includes(key)) cap.textContent = `"${key}" is in keyof ${x.T}, so it compiles. Your editor even autocompletes the valid keys.`;
        else cap.textContent = `Compile error: Argument of type '"${key}"' is not assignable to parameter of type ${x.keys.map((k) => `"${k}"`).join(" | ")}. Typos never reach production.`;
      }
      const sg = seg([{ v: "users", label: "User[]" }, { v: "orders", label: "Order[]" }, { v: "numbers", label: "number[]" }], cur, (v) => { cur = v; render(); }, "Input array");
      root.append(sg.el, code, out, keyRow, cap);
      render();
    },
  });

  // ---------------------------------------------------------------- order state machine
  add({
    id: "order-state-machine",
    title: "Make illegal states impossible",
    blurb: "Send events to an order. Only legal moves are allowed.",
    nodes: ["ts-modeling"],
    mount(root) {
      const shapes = {
        draft: ['{ status: "draft";', "  items: Item[] }"],
        placed: ['{ status: "placed";', "  items: Item[];", "  placedAt: Date }"],
        paid: ['{ status: "paid";', "  items: Item[];", "  paymentId: string }"],
        shipped: ['{ status: "shipped";', "  items: Item[];", "  paymentId: string;", "  trackingId: string }"],
        delivered: ['{ status: "delivered";', "  items: Item[];", "  deliveredAt: Date }"],
        cancelled: ['{ status: "cancelled";', "  reason: string }"],
        refunded: ['{ status: "refunded";', "  refundId: string }"],
      };
      const T = {
        place: { draft: "placed" }, pay: { placed: "paid" }, ship: { paid: "shipped" }, deliver: { shipped: "delivered" },
        cancel: { draft: "cancelled", placed: "cancelled" }, refund: { paid: "refunded", delivered: "refunded" },
      };
      let state = "draft";
      const flow = h("div", { class: "vrow" });
      const code = h("pre", { class: "vcode" });
      const cap = caption("A new order starts as a draft. Try events in any order.");
      function draw(flash) {
        clear(flow);
        Object.keys(shapes).forEach((k) => flow.appendChild(chip(k, k === state ? (flash === "bad" ? "bad" : "lit") : "")));
        clear(code); code.appendChild(h("div", { class: "done" }, `// type Order = Draft | Placed | Paid | … (current: ${state})`)); shapes[state].forEach((l) => code.appendChild(h("div", { class: "now" }, l)));
      }
      function send(ev) {
        const next = T[ev][state];
        if (!next) {
          draw("bad");
          cap.textContent = `transition(order, "${ev}") on a ${state} order returns { ok: false, error: "Can't ${ev} a ${state} order" }. Legal from ${state}: ${Object.keys(T).filter((e) => T[e][state]).join(", ") || "nothing, it's final"}.`;
          return;
        }
        const prev = state; state = next; draw();
        cap.textContent = `${prev} → ${next}. ` + ({ shipped: "Shipped requires trackingId, so you literally can't build a shipped order without one.", cancelled: "Cancelled has a reason and no items. Old fields are gone, not left as stale nulls.", refunded: "Final state. Every switch over status must handle it, or the never check fails to compile.", paid: "paymentId now exists on the type. Before this state, it can't be read by mistake." }[next] || "The type changed shape to match the state.");
      }
      root.append(flow, row(...Object.keys(T).map((ev) => button(ev, () => send(ev), { lit: ev === "place" || ev === "pay" })), button("Reset", () => { state = "draft"; draw(); cap.textContent = "Back to draft."; })), code, cap);
      draw();
    },
  });

  // ---------------------------------------------------------------- zod live validator
  add({
    id: "zod-live",
    title: "Parse, don't trust",
    blurb: "Edit the JSON and watch the schema accept or reject it",
    nodes: ["ts-zod"],
    mount(root) {
      const schema = ["const User = z.object({", "  name: z.string().min(2),", "  email: z.string().email(),", "  age: z.number().int().min(13),", '  role: z.enum(["user", "admin"]).default("user"),', "}).strict();"];
      const presets = {
        good: '{\n  "name": "Riya",\n  "email": "riya@example.com",\n  "age": 21\n}',
        bad: '{\n  "name": "R",\n  "email": "riya-at-example",\n  "age": "21"\n}',
        sneaky: '{\n  "name": "Mallory",\n  "email": "m@evil.dev",\n  "age": 30,\n  "isAdmin": true\n}',
      };
      const ta = h("textarea", { class: "vinput", style: "min-height:130px;width:100%;font-size:.85rem", "aria-label": "JSON input", spellcheck: "false" });
      const out = h("div", { class: "vlog", "aria-live": "polite" });
      const cap = caption();
      function validate() {
        clear(out);
        let data;
        try { data = JSON.parse(ta.value); } catch (e) { out.appendChild(h("div", { class: "bad" }, "Not valid JSON: " + e.message)); cap.textContent = "Before any schema runs, the text must be valid JSON."; return; }
        const errs = [];
        if (typeof data !== "object" || !data || Array.isArray(data)) errs.push(["(root)", "Expected object"]);
        else {
          if (typeof data.name !== "string") errs.push(["name", "Expected string, received " + typeof data.name]);
          else if (data.name.length < 2) errs.push(["name", "String must contain at least 2 character(s)"]);
          if (typeof data.email !== "string") errs.push(["email", "Expected string, received " + typeof data.email]);
          else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) errs.push(["email", "Invalid email"]);
          if (typeof data.age !== "number") errs.push(["age", "Expected number, received " + typeof data.age]);
          else if (!Number.isInteger(data.age)) errs.push(["age", "Expected integer, received float"]);
          else if (data.age < 13) errs.push(["age", "Number must be greater than or equal to 13"]);
          if (data.role !== undefined && !["user", "admin"].includes(data.role)) errs.push(["role", `Invalid enum value. Expected 'user' | 'admin', received '${data.role}'`]);
          const extra = Object.keys(data).filter((k) => !["name", "email", "age", "role"].includes(k));
          if (extra.length) errs.push(["(root)", `Unrecognized key(s) in object: ${extra.map((k) => `'${k}'`).join(", ")}`]);
        }
        if (errs.length) {
          out.appendChild(h("div", { class: "bad" }, "safeParse → { success: false }"));
          errs.forEach(([p, m]) => out.appendChild(h("div", { class: "bad" }, `  ${p}: ${m}`)));
          cap.textContent = "Each error names the exact field, ready to show next to the form input. Nothing invalid gets past this line into your app.";
        } else {
          const parsed = Object.assign({}, data); if (parsed.role === undefined) parsed.role = "user";
          out.appendChild(h("div", { class: "good" }, "safeParse → { success: true, data: User }"));
          out.appendChild(h("div", null, JSON.stringify(parsed)));
          cap.textContent = "Valid. The default filled in role, and from here on TypeScript knows data is a User. One schema gives you both the check and the type (z.infer).";
        }
      }
      ta.addEventListener("input", validate);
      const load = (k) => { ta.value = presets[k]; validate(); };
      root.append(h("pre", { class: "vcode" }, schema.map((l) => h("div", null, l))), row(button("Valid user", () => load("good")), button("Bad input", () => load("bad"), { lit: true }), button("Sneaky extra field", () => load("sneaky"))), ta, out, cap);
      load("good");
    },
  });

  // ---------------------------------------------------------------- derived state
  add({
    id: "derived-state",
    title: "Store less state, derive the rest",
    blurb: "Why duplicated state drifts out of sync",
    nodes: ["react-state"],
    mount(root) {
      let mode = "dup";
      let items = [{ n: "Brownie", p: 90 }, { n: "Cold coffee", p: 120 }];
      let storedTotal = 210;
      const list = h("div", { class: "vstack" });
      const totals = h("div", { class: "vstats" });
      const code = h("pre", { class: "vcode" });
      const cap = caption();
      const menu = [{ n: "Walnut fudge", p: 150 }, { n: "Cookie", p: 40 }, { n: "Lemonade", p: 60 }];
      function draw(msg) {
        clear(list); items.forEach((it, i) => list.appendChild(h("div", { class: "vitem", style: "display:flex;justify-content:space-between;gap:8px;align-items:center" }, h("span", null, `${it.n} · ₹${it.p}`), button("Remove", () => remove(i)))));
        const real = items.reduce((a, b) => a + b.p, 0);
        const shown = mode === "dup" ? storedTotal : real;
        clear(totals).append(stat("total shown", "₹" + shown, shown === real ? "good" : "bad"), stat("actual total", "₹" + real));
        clear(code);
        (mode === "dup"
          ? ["const [items, setItems] = useState(start);", "const [total, setTotal] = useState(210); // duplicated!", "function add(it) {", "  setItems([...items, it]);", "  setTotal(total + it.price);  // remember to sync…", "}", "function remove(i) {", "  setItems(items.filter((_, j) => j !== i));", "  // …forgot to update total here", "}"]
          : ["const [items, setItems] = useState(start);", "const total = items.reduce((s, i) => s + i.price, 0); // derived", "function add(it) { setItems([...items, it]); }", "function remove(i) { setItems(items.filter((_, j) => j !== i)); }"])
          .forEach((l) => code.appendChild(h("div", { class: l.includes("forgot") || l.includes("duplicated") ? "now" : "" }, l)));
        cap.textContent = msg || (mode === "dup" ? "Total is stored separately. Every function that changes items must also remember to update total." : "Total is calculated from items on every render. There's nothing to keep in sync, so it can never be wrong.");
      }
      function addItem() { const it = menu[items.length % menu.length]; items = [...items, it]; storedTotal += it.p; draw(); }
      function remove(i) { items = items.filter((_, j) => j !== i); draw(mode === "dup" ? "Removed an item, but remove() forgot to update total. The screen now shows the wrong amount. This exact bug ships to production all the time." : "Removed. Total updated by itself."); }
      const sg = seg([{ v: "dup", label: "Duplicated state" }, { v: "derived", label: "Derived value" }], mode, (v) => { mode = v; items = [{ n: "Brownie", p: 90 }, { n: "Cold coffee", p: 120 }]; storedTotal = 210; draw(); }, "Approach");
      root.append(sg.el, row(button("Add item", addItem, { lit: true })), list, totals, code, cap);
      draw();
    },
  });

  // ---------------------------------------------------------------- re-render tree
  add({
    id: "react-rerender",
    title: "Who re-renders when the cart changes?",
    blurb: "Compare state placement, memo, useCallback and a store",
    nodes: ["react-performance", "react-hooks-context"],
    mount(root, ctx) {
      const tree = [
        { id: "App", d: 0 }, { id: "Header", d: 1 }, { id: "CartBadge", d: 2 }, { id: "ProductList", d: 1 },
        { id: "ProductCard 1", d: 2 }, { id: "ProductCard 2", d: 2 }, { id: "ProductCard 3", d: 2 }, { id: "Footer", d: 1 },
      ];
      const modes = {
        app: { label: "State in App", renders: ["App", "Header", "CartBadge", "ProductList", "ProductCard 1", "ProductCard 2", "ProductCard 3", "Footer"], say: "cart lives in App's useState. When it changes, App re-renders and so does every child below it, even Footer, which doesn't use the cart at all." },
        memo: { label: "+ React.memo", renders: ["App", "Header", "CartBadge", "ProductList", "ProductCard 1", "ProductCard 2", "ProductCard 3"], say: "Footer is memoised with unchanged props, so it's skipped. But ProductList still re-renders: App passes onAdd={() => …}, a brand-new function every render, so memo sees a changed prop." },
        cb: { label: "+ useCallback", renders: ["App", "Header", "CartBadge"], say: "Wrapping onAdd in useCallback keeps the same function reference. Now memo works: only App, Header and CartBadge re-render. (The React Compiler can add this memoisation for you.)" },
        store: { label: "Store + selector", renders: ["CartBadge"], say: "The cart lives in a Zustand store. Only CartBadge subscribes to the count with a selector, so it's the only component that re-renders. App never re-renders at all." },
      };
      let mode = "app";
      const counts = Object.fromEntries(tree.map((n) => [n.id, 0]));
      const rowsEl = h("div", { class: "vstack" });
      const totals = h("div", { class: "vstats" });
      const cap = caption();
      let flashT = null;
      function draw(flash) {
        clear(rowsEl);
        tree.forEach((n) => {
          const hit = flash && modes[mode].renders.includes(n.id);
          rowsEl.appendChild(h("div", { class: "vitem" + (hit ? " lit" : ""), style: `margin-left:${n.d * 22}px;display:flex;justify-content:space-between;gap:8px;transition:background .2s` }, h("span", null, "<" + n.id.replace(" ", "") + ">"), h("span", { class: "muted" }, `rendered ${counts[n.id]}×`)));
        });
        const total = Object.values(counts).reduce((a, b) => a + b, 0);
        clear(totals).append(stat("renders this click", flash ? modes[mode].renders.length : 0, "lit"), stat("total renders", total));
      }
      function click() {
        modes[mode].renders.forEach((id) => counts[id]++);
        draw(true);
        cap.textContent = modes[mode].say;
        ctx.clear(flashT); flashT = ctx.after(() => draw(false), 900);
      }
      const sg = seg(Object.entries(modes).map(([v, m]) => ({ v, label: m.label })), mode, (v) => { mode = v; Object.keys(counts).forEach((k) => (counts[k] = 0)); draw(false); cap.textContent = "Press Add to cart."; }, "Approach");
      root.append(sg.el, row(button("Add to cart", click, { lit: true })), rowsEl, totals, cap);
      cap.textContent = "Press Add to cart and watch which components light up.";
      draw(false);
    },
  });

  // ---------------------------------------------------------------- keys
  add({
    id: "react-keys",
    title: "Why index keys break state",
    blurb: "Same list, same action, two kinds of key",
    nodes: ["react-internals", "react-thinking"],
    mount(root) {
      const start = [{ id: "a1", name: "Apple" }, { id: "b2", name: "Banana" }, { id: "c3", name: "Cherry" }];
      const notes0 = { a1: "buy 2", b2: "ripe only", c3: "for the cake" };
      let items, idxState, idState, n;
      function reset() { items = start.slice(); idxState = start.map((it) => notes0[it.id]); idState = Object.assign({}, notes0); n = 0; }
      reset();
      const left = h("div", { class: "vstack" }), right = h("div", { class: "vstack" });
      const cap = caption("Each row is a component with its own state (the note you typed into it).");
      function rowEl(name, note, ok) { return h("div", { class: "vitem" + (ok === false ? " bad" : ok ? " mint" : ""), style: "display:grid;grid-template-columns:1fr 1fr;gap:8px" }, h("b", null, name), h("span", null, note ? `"${note}"` : "(empty)")); }
      function draw() {
        clear(left); clear(right);
        items.forEach((it, i) => {
          const expected = notes0[it.id] || "";
          const idxNote = idxState[i] || "";
          left.appendChild(rowEl(it.name, idxNote, idxNote === expected));
          right.appendChild(rowEl(it.name, idState[it.id] || "", true));
        });
      }
      const fruits = ["Mango", "Guava", "Papaya", "Jackfruit"];
      root.append(
        row(button("Add at top", () => { const name = fruits[n++ % fruits.length]; items = [{ id: "n" + n, name }, ...items]; draw(); cap.textContent = `With key={index}, React sees "position 0 still exists" and reuses that component, so ${items[1].name}'s note now sits on ${name}. Every note slid to the wrong fruit. With key={item.id}, React knows ${name} is new and moves the others intact.`; }, { lit: true }),
          button("Reverse", () => { items = items.slice().reverse(); draw(); cap.textContent = "Reordering is just as bad with index keys. State stays with the position, not the item."; }),
          button("Reset", () => { reset(); draw(); cap.textContent = "Back to the start."; })),
        h("div", { class: "vgrid2" }, h("div", { class: "vbox" }, h("h4", null, "key={index}"), left), h("div", { class: "vbox" }, h("h4", null, "key={item.id}"), right)), cap);
      draw();
    },
  });

  // ---------------------------------------------------------------- effect lifecycle
  add({
    id: "effect-lifecycle",
    title: "useEffect and cleanup",
    blurb: "Mount, change props, unmount, and count open connections",
    nodes: ["react-effects-data"],
    mount(root) {
      let mounted = false, room = "general", cleanup = true, open = [];
      const code = h("pre", { class: "vcode" });
      const log = h("div", { class: "vlog", "aria-live": "polite" });
      const conns = h("div", { class: "vstats" });
      const cap = caption("Press Mount to put <ChatRoom roomId=\"general\" /> on screen.");
      function drawCode() {
        clear(code);
        ["useEffect(() => {", "  const conn = connect(roomId);", "  conn.open();", cleanup ? "  return () => conn.close();  // cleanup" : "  // no cleanup returned!", "}, [roomId]);"].forEach((l) => code.appendChild(h("div", { class: l.includes("cleanup") || l.includes("no cleanup") ? "now" : "" }, l)));
      }
      function say(t, cls) { log.appendChild(h("div", { class: cls || "" }, t)); log.scrollTop = log.scrollHeight; }
      function drawConns() { clear(conns).append(stat("open connections", open.length, open.length > 1 ? "bad" : "good"), h("div", { class: "vrow" }, open.map((r) => chip(r, "sky")))); }
      function runEffect() { open.push(room); say(`effect: connect("${room}")`, "lit"); }
      function runCleanup(r) { if (cleanup) { open.splice(open.indexOf(r), 1); say(`cleanup: close("${r}")`, "good"); } }
      root.append(code, row(
        button("Mount", () => { if (mounted) return; mounted = true; say("render <ChatRoom roomId=\"" + room + "\">", "dim"); runEffect(); drawConns(); cap.textContent = "React renders first, paints, then runs the effect."; }, { lit: true }),
        button("Change room", () => {
          if (!mounted) { cap.textContent = "Mount it first."; return; }
          const prev = room; room = room === "general" ? "random" : "general";
          say(`render <ChatRoom roomId="${room}">`, "dim"); runCleanup(prev); runEffect(); drawConns();
          cap.textContent = cleanup ? "roomId changed, so React runs the old effect's cleanup first, then the new effect. Still one connection." : "No cleanup, so the old connection stays open. Change rooms a few times and watch them pile up. That's a leak.";
        }),
        button("Unmount", () => { if (!mounted) return; mounted = false; say("unmount", "dim"); runCleanup(room); drawConns(); cap.textContent = cleanup ? "Unmount runs the cleanup one last time. Zero connections left." : "The component is gone, but its connection is still open and still receiving messages."; }),
        button("Reset", () => { mounted = false; room = "general"; open = []; clear(log); drawConns(); cap.textContent = "Reset."; })),
        h("label", { class: "small", style: "display:flex;gap:6px;align-items:center" }, (() => { const c = h("input", { type: "checkbox", checked: true }); c.addEventListener("change", () => { cleanup = c.checked; drawCode(); }); return c; })(), "Return a cleanup function"),
        conns, log, cap);
      drawCode(); drawConns();
    },
  });

  // ---------------------------------------------------------------- query cache
  add({
    id: "query-cache",
    title: "Server state cache: fresh, stale, refetch",
    blurb: "How TanStack Query decides when to hit the network",
    nodes: ["react-effects-data"],
    mount(root, ctx) {
      let staleMs = 5000, data = null, updatedAt = 0, fetching = false, mounted = false, fetches = 0, version = 1;
      const card = h("div", { class: "vbox" });
      const ui = h("div", { class: "vitem", style: "min-height:44px;font-size:.95rem" });
      const log = h("div", { class: "vlog", "aria-live": "polite" });
      const cap = caption("Query key ['book', 42]. Mount a component that uses it.");
      function say(t, c) { log.appendChild(h("div", { class: c || "" }, t)); log.scrollTop = log.scrollHeight; }
      function isStale() { return !data || performance.now() - updatedAt > staleMs; }
      function fetchNow(why) {
        if (fetching) return;
        fetching = true; fetches++;
        say(`network: GET /books/42 (${why})`, "lit");
        ctx.after(() => { fetching = false; data = `"The Brownie Handbook" (v${version})`; updatedAt = performance.now(); say("network: 200 OK, cache updated", "good"); }, 900);
      }
      const stopLoop = ctx.loop(() => {
        const age = data ? (performance.now() - updatedAt) / 1000 : 0;
        const status = fetching ? (data ? "stale, refetching in background" : "loading") : !data ? "empty" : isStale() ? "stale" : "fresh";
        clear(card).append(h("h4", null, "cache['book', 42]"),
          h("div", { class: "vrow" }, chip(status, status.startsWith("fresh") ? "mint" : status.startsWith("stale") ? "lit" : status === "loading" ? "sky" : ""), h("span", { class: "small muted" }, data ? `age ${age.toFixed(1)}s · network requests ${fetches}` : `network requests ${fetches}`)),
          h("div", { class: "meter", style: "margin:8px 0 0" }, h("i", { style: `width:${data ? Math.min(100, (age * 1000 / staleMs) * 100) : 0}%;background:var(${isStale() ? "--lit" : "--mint"})` })));
        ui.textContent = !mounted ? "Component not mounted" : data ? `Shows ${data}${fetching ? " (updating…)" : ""}` : "Loading skeleton…";
      });
      ctx.onCleanup(stopLoop);
      root.append(range("staleTime", { min: 0, max: 10000, step: 500, value: staleMs, fmt: (x) => x / 1000 + "s" }, (x) => (staleMs = x)).el,
        row(
          button("Mount component", () => {
            mounted = true;
            if (!data) { cap.textContent = "Nothing cached, so it shows a loading state and fetches."; fetchNow("first mount"); }
            else if (isStale()) { cap.textContent = "Cached data shows instantly, and because it's stale a background refetch starts. No spinner."; fetchNow("stale on mount"); }
            else { cap.textContent = "Data is fresh, so it renders from cache instantly with zero network requests."; say("cache hit, no request", "dim"); }
          }, { lit: true }),
          button("Window refocus", () => { if (!mounted) { cap.textContent = "Mount first."; return; } if (isStale()) { fetchNow("refetchOnWindowFocus"); cap.textContent = "You came back to the tab and the data was stale, so it quietly refreshes."; } else { say("focus: still fresh, no request", "dim"); cap.textContent = "Still fresh, so no request."; } }),
          button("Save edit + invalidate", () => { version++; updatedAt = -Infinity; say("mutation succeeded → invalidateQueries(['book', 42])", "lit"); cap.textContent = "After a mutation, invalidating marks the data stale and refetches it so every screen shows the new version."; if (mounted) fetchNow("invalidated"); }),
          button("Unmount", () => { mounted = false; cap.textContent = "The data stays in the cache for gcTime (5 min by default) in case you come back."; })),
        card, ui, log, cap);
    },
  });

  // ---------------------------------------------------------------- server/client boundary
  add({
    id: "server-client-boundary",
    title: "Where \"use client\" goes",
    blurb: "Tap components to make them client components and watch the JS bundle",
    nodes: ["next-app-router"],
    mount(root) {
      const T = [
        { id: "RootLayout", d: 0, kb: 1, parent: null }, { id: "Header", d: 1, kb: 1, parent: "RootLayout" }, { id: "Nav", d: 2, kb: 3, parent: "Header" }, { id: "ThemeToggle", d: 2, kb: 2, parent: "Header" },
        { id: "PostPage", d: 1, kb: 1, parent: "RootLayout" }, { id: "PostBody (markdown)", d: 2, kb: 48, parent: "PostPage" }, { id: "LikeButton", d: 2, kb: 2, parent: "PostPage" },
        { id: "Comments", d: 2, kb: 6, parent: "PostPage" }, { id: "CommentForm", d: 3, kb: 9, parent: "Comments" },
      ];
      const marked = new Set(["ThemeToggle", "LikeButton", "CommentForm"]);
      const host = h("div", { class: "vstack" });
      const totals = h("div", { class: "vstats" });
      const cap = caption("Server components send HTML, not JavaScript. Tap a component to add or remove \"use client\".");
      function isClient(id) { let n = T.find((x) => x.id === id); while (n) { if (marked.has(n.id)) return marked.has(id) ? "own" : "inherited"; n = T.find((x) => x.id === n.parent); } return null; }
      function draw() {
        clear(host);
        let kb = 0;
        T.forEach((n) => {
          const c = isClient(n.id);
          if (c) kb += n.kb;
          const b = h("button", { type: "button", class: "vitem" + (c === "own" ? " lit" : c === "inherited" ? " plum" : ""), style: `margin-left:${n.d * 20}px;display:flex;justify-content:space-between;gap:8px;cursor:pointer;text-align:left;color:var(--ink);font:inherit;font-size:.82rem`, "aria-pressed": String(marked.has(n.id)) },
            h("span", null, (marked.has(n.id) ? '"use client" ' : "") + n.id), h("span", { class: "muted" }, c ? `client · ${n.kb}KB` : "server · 0KB"));
          b.addEventListener("click", () => { if (marked.has(n.id)) marked.delete(n.id); else marked.add(n.id); draw(); cap.textContent = marked.has(n.id) ? `${n.id} and everything it imports is now client code${n.id === "PostPage" || n.id === "RootLayout" ? ", including the 48KB markdown parser. Push \"use client\" down to the small interactive leaves instead." : "."}` : `${n.id} is a server component again.`; });
          host.appendChild(b);
        });
        const runtime = marked.size ? 45 : 0;
        clear(totals).append(stat("your component JS", kb + "KB", kb > 30 ? "bad" : "good"), stat("+ React runtime", runtime + "KB"), stat("total sent to the browser", kb + runtime + "KB", kb + runtime > 90 ? "bad" : "lit"));
      }
      root.append(h("div", { class: "vlegend" }, h("span", null, h("i", { style: "background:var(--lit)" }), '"use client" here'), h("span", null, h("i", { style: "background:var(--plum)" }), "client because a parent is")), host, totals, cap);
      draw();
    },
  });

  // ---------------------------------------------------------------- rendering modes
  add({
    id: "rendering-modes",
    title: "CSR vs SSR vs SSG vs ISR",
    blurb: "When does the user first see content, and how fresh is it?",
    nodes: ["next-data-cache"],
    mount(root, ctx) {
      const M = {
        CSR: { segs: [[0, 150, "--ink-3", "empty HTML"], [150, 900, "--sky", "download JS"], [900, 1100, "--plum", "run JS"], [1100, 1700, "--sky", "fetch data"]], first: 1700, tti: 1700, fresh: "Always fresh", say: "Client-side rendering: the server sends an empty shell. Users stare at a blank page or spinner until JS downloads, runs and fetches data. Weak for SEO." },
        SSR: { segs: [[0, 600, "--plum", "server fetches + renders"], [600, 750, "--ink-3", "HTML"], [750, 1400, "--sky", "JS + hydrate"]], first: 750, tti: 1400, fresh: "Fresh every request", say: "Server-side rendering on each request: content appears as soon as the HTML arrives, but the server does work every time, and a slow database means a slow page." },
        SSG: { segs: [[0, 120, "--ink-3", "HTML from CDN"], [120, 700, "--sky", "JS + hydrate"]], first: 120, tti: 700, fresh: "As old as the last build", say: "Static generation at build time: the HTML is already made and served from a CDN near the user. Fastest possible, but the data is frozen until you rebuild." },
        ISR: { segs: [[0, 120, "--ink-3", "HTML from CDN"], [120, 700, "--sky", "JS + hydrate"]], first: 120, tti: 700, fresh: "At most 60s old", say: "Incremental static regeneration: static speed, and after the revalidate window the next visit triggers a background rebuild. The best of both for blogs, product pages and docs." },
      };
      let mode = "CSR";
      const max = 1800;
      const lanes = h("div", { class: "vstack" });
      const cursor = h("div", { style: "position:absolute;top:0;bottom:0;width:2px;background:var(--lit);left:0;display:none" });
      const wrap = h("div", { style: "position:relative" }, lanes, cursor);
      const facts = h("div", { class: "vstats" });
      const cap = caption();
      function draw() {
        clear(lanes);
        Object.entries(M).forEach(([k, m]) => {
          const on = k === mode;
          lanes.appendChild(h("div", { style: `display:grid;grid-template-columns:44px 1fr;gap:8px;align-items:center;opacity:${on ? 1 : 0.4}` },
            h("b", { style: "font-size:.85rem" }, k),
            h("div", { style: "position:relative;height:26px;background:var(--bg-raised);border:1px solid var(--line);border-radius:6px" },
              ...m.segs.map(([a, b, c, label]) => h("div", { title: label, style: `position:absolute;top:3px;bottom:3px;left:${(a / max) * 100}%;width:${((b - a) / max) * 100}%;background:var(${c});border-radius:3px;opacity:.85` })),
              h("div", { title: "first content", style: `position:absolute;top:-3px;bottom:-3px;left:${(m.first / max) * 100}%;width:3px;background:var(--mint)` }))));
        });
        const m = M[mode];
        clear(facts).append(stat("first content", m.first + "ms", m.first < 500 ? "good" : "bad"), stat("interactive", m.tti + "ms"), stat("data freshness", m.fresh));
        cap.textContent = m.say;
      }
      let stop = null;
      function play() {
        if (stop) stop();
        const t0 = performance.now(); cursor.style.display = "block";
        stop = ctx.loop((now) => { const t = (now - t0) * 0.6; cursor.style.left = `calc(52px + (100% - 52px) * ${Math.min(1, t / max)})`; if (t > max) { stop(); stop = null; } });
      }
      const sg = seg(Object.keys(M).map((v) => ({ v, label: v })), mode, (v) => { mode = v; draw(); }, "Rendering mode");
      root.append(sg.el, wrap, h("div", { class: "vlegend" }, h("span", null, h("i", { style: "background:var(--plum)" }), "server/JS work"), h("span", null, h("i", { style: "background:var(--sky)" }), "download / fetch"), h("span", null, h("i", { style: "background:var(--mint)" }), "user sees content")), row(button("Play timeline", play, { lit: true })), facts, cap);
      draw();
    },
  });

  // ---------------------------------------------------------------- waterfall vs streaming
  add({
    id: "streaming-waterfall",
    title: "Waterfall vs parallel vs streaming",
    blurb: "Three data requests, three ways to wait for them",
    nodes: ["next-streaming-api", "next-data-cache"],
    mount(root, ctx) {
      const R = [{ k: "post", ms: 400 }, { k: "author", ms: 300 }, { k: "comments", ms: 900 }];
      const M = {
        waterfall: { label: "await one by one", spans: [[0, 400], [400, 700], [700, 1600]], show: { post: 1600, author: 1600, comments: 1600 }, say: "Each await waits for the previous request even though none depend on each other. 1.6s of blank page." },
        parallel: { label: "Promise.all", spans: [[0, 400], [0, 300], [0, 900]], show: { post: 900, author: 900, comments: 900 }, say: "All three start together. The page waits only for the slowest (900ms). Same code, 44% faster." },
        stream: { label: "Suspense streaming", spans: [[0, 400], [0, 300], [0, 900]], show: { post: 400, author: 300, comments: 900 }, say: "Each section has its own Suspense boundary. The shell arrives instantly and each part streams in as soon as its data is ready." },
      };
      let mode = "waterfall", stop = null;
      const lanes = h("div", { class: "vstack" });
      const page = h("div", { class: "vbox", style: "display:grid;gap:6px" });
      const clock = h("b", null, "0ms");
      const cap = caption();
      function drawLanes() {
        clear(lanes);
        R.forEach((r, i) => { const [a, b] = M[mode].spans[i]; lanes.appendChild(h("div", { style: "display:grid;grid-template-columns:76px 1fr;gap:8px;align-items:center" }, h("span", { class: "small" }, r.k), h("div", { style: "position:relative;height:18px;background:var(--bg-raised);border:1px solid var(--line);border-radius:5px" }, h("div", { style: `position:absolute;top:2px;bottom:2px;left:${(a / 1700) * 100}%;width:${((b - a) / 1700) * 100}%;background:var(--sky);border-radius:3px` })))); });
      }
      function drawPage(t) {
        clear(page);
        const sh = M[mode].show;
        const block = (k, label, hgt) => t >= sh[k] ? h("div", { class: "vitem mint", style: `min-height:${hgt}px` }, label) : h("div", { class: "vitem", style: `min-height:${hgt}px;color:var(--ink-3)` }, mode === "stream" && t > 30 ? "skeleton…" : "");
        const shell = mode === "stream" ? t > 30 : t >= sh.post;
        page.append(h("div", { class: "small muted" }, shell ? "page shell (header, layout)" : "blank page"), block("post", "Post: How I cut p95 latency by 80%", 34), block("author", "By Pank · MCA, Mangaluru", 22), block("comments", "12 comments", 40));
        clock.textContent = Math.round(t) + "ms";
      }
      function play() { if (stop) stop(); const t0 = performance.now(); stop = ctx.loop((now) => { const t = (now - t0) * 0.7; drawPage(Math.min(t, 1700)); if (t > 1700) { stop(); stop = null; } }); }
      const sg = seg(Object.entries(M).map(([v, m]) => ({ v, label: m.label })), mode, (v) => { mode = v; drawLanes(); drawPage(0); cap.textContent = M[v].say; }, "Strategy");
      root.append(sg.el, lanes, row(button("Load page", play, { lit: true }), h("span", { class: "small muted" }, "time: ", clock)), page, cap);
      drawLanes(); drawPage(0); cap.textContent = M[mode].say;
    },
  });

  // ---------------------------------------------------------------- layout shift
  add({
    id: "layout-shift",
    title: "Layout shift (CLS)",
    blurb: "Why images need dimensions",
    nodes: ["next-seo-perf"],
    mount(root, ctx) {
      let mode = "bad", timers = [];
      const page = h("div", { class: "vbox", style: "display:grid;gap:8px;overflow:hidden" });
      const score = h("div", { class: "vstats" });
      const cap = caption();
      function load() {
        timers.forEach((t) => ctx.clear(t)); timers = [];
        clear(page);
        const img = h("div", { style: `background:var(--sky);border-radius:8px;opacity:.85;height:${mode === "good" ? 120 : 0}px;transition:height .25s;display:grid;place-items:center;color:var(--lit-ink);font-weight:700` }, "");
        if (mode === "good") { img.style.background = "var(--bg-sunk)"; img.style.border = "1px dashed var(--line-strong)"; img.textContent = ""; }
        const btn = h("span", { class: "vchip lit", style: "justify-self:start" }, "Buy now");
        page.append(h("b", null, "Walnut fudge brownie box"), img, h("p", { style: "margin:0;font-size:.9rem" }, "Six slow-baked brownies with Kerala walnuts."), btn);
        clear(score).append(stat("CLS", "…"));
        cap.textContent = mode === "bad" ? "The text renders first. You go to tap Buy now…" : "The image slot is already reserved by width and height (or aspect-ratio).";
        timers.push(ctx.after(() => {
          img.style.height = "120px"; img.style.background = "var(--sky)"; img.style.border = "0"; img.textContent = "photo";
          clear(score).append(stat("CLS", mode === "bad" ? "0.28" : "0.00", mode === "bad" ? "bad" : "good"), stat("target", "< 0.1"));
          cap.textContent = mode === "bad" ? "The image loads with no reserved space and shoves everything down 120px. The Buy now button jumped right as you tapped. Google counts this as poor CLS." : "The image fills its reserved box. Nothing moves. CLS 0. next/image enforces this by requiring width and height.";
        }, 1100));
      }
      const sg = seg([{ v: "bad", label: "No dimensions" }, { v: "good", label: "width + height set" }], mode, (v) => { mode = v; load(); }, "Image markup");
      root.append(sg.el, row(button("Reload page", load, { lit: true })), page, score, cap);
      load();
    },
  });
})();
