/* Phase 1 explainers: JavaScript */
(function () {
  const { h, s, clear, button, row, caption, seg, range, chip, stat, stepper, canvas, tok } = window.VZ;
  const add = window.PNODE_VIZ.add;

  function codeBlock(lines) {
    const pre = h("pre", { class: "vcode" });
    const rows = lines.map((l) => { const d = h("div", null, l || " "); pre.appendChild(d); return d; });
    return { el: pre, mark(i, doneBefore) { rows.forEach((r, j) => { r.className = j === i ? "now" : doneBefore && j < i ? "done" : ""; }); } };
  }

  // ---------------------------------------------------------------- value vs reference
  add({
    id: "value-reference",
    title: "Values vs references",
    blurb: "Why changing one object can change \"another\"",
    nodes: ["js-values-types"],
    mount(root, ctx) {
      const lines = ["let a = 5;", "let b = a;", "b = 10;", "let p = { n: 1 };", "let q = p;", "q.n = 2;", "let r = { ...p };", "r.n = 99;"];
      const F = [
        { vars: [["a", 5]], heap: [], say: "Primitives (numbers, strings, booleans) sit directly inside the variable's box." },
        { vars: [["a", 5], ["b", 5]], heap: [], say: "b gets its own copy of 5. Two separate boxes." },
        { vars: [["a", 5], ["b", 10]], heap: [], say: "Changing b doesn't touch a. Copies of primitives are independent." },
        { vars: [["a", 5], ["b", 10], ["p", "#1"]], heap: [["#1", "{ n: 1 }"]], say: "Objects live in the heap. The variable p holds a reference to it, like a house address." },
        { vars: [["a", 5], ["b", 10], ["p", "#1"], ["q", "#1"]], heap: [["#1", "{ n: 1 }"]], say: "q = p copies the address, not the house. Both point at object #1." },
        { vars: [["a", 5], ["b", 10], ["p", "#1"], ["q", "#1"]], heap: [["#1", "{ n: 2 }", true]], say: "q.n = 2 changes the one shared object, so p.n is 2 too. This is the classic \"why did my state change?\" bug." },
        { vars: [["a", 5], ["b", 10], ["p", "#1"], ["q", "#1"], ["r", "#2"]], heap: [["#1", "{ n: 2 }"], ["#2", "{ n: 2 }", true]], say: "Spread builds a brand-new object #2 with copied top-level values." },
        { vars: [["a", 5], ["b", 10], ["p", "#1"], ["q", "#1"], ["r", "#2"]], heap: [["#1", "{ n: 2 }"], ["#2", "{ n: 99 }", true]], say: "r is independent now. But spread is shallow: nested objects inside would still be shared. structuredClone() copies deeply." },
      ];
      const tone = { "#1": "sky", "#2": "plum" };
      const code = codeBlock(lines);
      const stackBox = h("div", { class: "vstack" }), heapBox = h("div", { class: "vstack" });
      const cap = caption();
      const st = stepper(ctx, {
        count: F.length,
        render(i) {
          const f = F[i];
          code.mark(i, true);
          clear(stackBox); clear(heapBox);
          f.vars.forEach(([n, v]) => {
            const ref = typeof v === "string" && v[0] === "#";
            stackBox.appendChild(h("div", { class: "vitem" + (ref ? " " + tone[v] : "") , style: "display:flex;justify-content:space-between;gap:8px" }, h("b", null, n), ref ? chip("→ " + v, tone[v]) : h("span", null, String(v))));
          });
          if (!f.heap.length) heapBox.appendChild(h("div", { class: "small muted" }, "empty"));
          f.heap.forEach(([id, val, changed]) => heapBox.appendChild(h("div", { class: "vitem " + tone[id] + (changed ? " lit" : ""), style: "display:flex;justify-content:space-between;gap:8px" }, chip(id, tone[id]), h("span", null, val))));
          cap.textContent = f.say;
        },
      });
      root.append(h("div", { class: "vgrid2" }, code.el, h("div", { class: "vgrid2" }, h("div", { class: "vbox" }, h("h4", null, "Stack (variables)"), stackBox), h("div", { class: "vbox" }, h("h4", null, "Heap (objects)"), heapBox))), cap, st.el);
      st.go(0);
    },
  });

  // ---------------------------------------------------------------- closures
  add({
    id: "closure-backpack",
    title: "Closures: the function's backpack",
    blurb: "Each counter keeps its own private count, even after makeCounter returns",
    nodes: ["js-closures"],
    mount(root) {
      const code = h("pre", { class: "vcode" }, ["function makeCounter(name) {", "  let count = 0;", "  return function () {", "    count++;", "    return `${name}: ${count}`;", "  };", "}"].map((l) => h("div", null, l)));
      const made = {};
      const cards = h("div", { class: "vgrid2" });
      const log = h("div", { class: "vlog", "aria-live": "polite" }, h("div", { class: "dim" }, "Create a counter, then call it."));
      const cap = caption("makeCounter runs, creates count, and returns an inner function. Normally count would vanish when makeCounter ends. Watch what happens instead.");
      function draw(flash) {
        clear(cards);
        ["A", "B"].forEach((k) => {
          const m = made[k];
          cards.appendChild(h("div", { class: "vbox", style: m ? (flash === k ? "border-color:var(--lit);border-width:2px" : "") : "opacity:.45" },
            h("h4", null, m ? `const ${k.toLowerCase()} = makeCounter("${k}")` : `${k.toLowerCase()} not created yet`),
            m ? h("div", { class: "vitem " + (k === "A" ? "sky" : "plum") }, h("div", null, "backpack (closure scope)"), h("div", { style: "font-size:.95rem;margin-top:4px" }, `name = "${k}"`), h("div", { style: "font-size:1.1rem;font-weight:700" }, `count = ${m.count}`)) : null));
        });
      }
      function say(text, cls) { log.appendChild(h("div", { class: cls || "" }, text)); log.scrollTop = log.scrollHeight; }
      function create(k) {
        made[k] = { count: 0 };
        say(`const ${k.toLowerCase()} = makeCounter("${k}")  // returns a function`, "dim");
        cap.textContent = `makeCounter("${k}") has finished and returned. Its count variable should be gone, but the returned function still references it, so JavaScript keeps it alive in ${k.toLowerCase()}'s backpack.`;
        draw(k);
      }
      function call(k) {
        const m = made[k];
        if (!m) { say(`${k.toLowerCase()}()  →  ReferenceError: ${k.toLowerCase()} is not defined`, "bad"); cap.textContent = "Create that counter first."; return; }
        m.count++;
        say(`${k.toLowerCase()}()  →  "${k}: ${m.count}"`, "lit");
        cap.textContent = made.A && made.B
          ? `Each call to makeCounter made a separate backpack. a and b never share count. This is how private state, React hooks and event handlers remember things.`
          : `count went up to ${m.count}. Nothing outside can read or change it directly. It's private to this function.`;
        draw(k);
      }
      root.append(code, row(button('a = makeCounter("A")', () => create("A")), button('b = makeCounter("B")', () => create("B")), button("a()", () => call("A"), { lit: true }), button("b()", () => call("B"), { lit: true }), button("Reset", () => { delete made.A; delete made.B; clear(log).appendChild(h("div", { class: "dim" }, "Create a counter, then call it.")); draw(); })), cards, log, cap);
      draw();
    },
  });

  // ---------------------------------------------------------------- debounce vs throttle
  add({
    id: "debounce-throttle",
    title: "Debounce vs throttle, live",
    blurb: "Move your finger or mouse over the pad and compare the lanes",
    nodes: ["js-closures"],
    mount(root, ctx) {
      let wait = 400;
      const W = 5000;
      const ev = [], deb = [], thr = [];
      let debTimer = null, lastThr = -Infinity;
      const counts = h("div", { class: "vstats" });
      function fire() {
        const t = performance.now();
        ev.push(t);
        ctx.clear(debTimer);
        debTimer = ctx.after(() => { deb.push(performance.now()); updateCounts(); }, wait);
        if (t - lastThr >= wait) { thr.push(t); lastThr = t; }
        updateCounts();
      }
      function updateCounts() { clear(counts).append(stat("events fired", ev.length), stat("debounced calls", deb.length, "good"), stat("throttled calls", thr.length, "lit")); }
      const pad = h("div", { class: "vbox", style: "height:90px;display:grid;place-items:center;touch-action:none;cursor:crosshair;user-select:none;-webkit-user-select:none", "aria-label": "Activity pad. Move over it to fire events." }, h("span", { class: "muted small" }, "Move or drag here to fire events"));
      pad.addEventListener("pointermove", fire);
      const cv = canvas(ctx, root, 150);
      const off = ctx.loop((now) => {
        const g = cv.g, w = cv.w, H = 150;
        g.clearRect(0, 0, w, H);
        const lanes = [["events", ev, tok("--ink-3")], [`debounced (${wait}ms)`, deb, tok("--mint")], [`throttled (${wait}ms)`, thr, tok("--lit")]];
        lanes.forEach(([label, arr, col], i) => {
          const y = 34 + i * 44;
          g.strokeStyle = tok("--line"); g.lineWidth = 1; g.beginPath(); g.moveTo(0, y); g.lineTo(w, y); g.stroke();
          g.fillStyle = tok("--ink-2"); g.font = "12px " + getComputedStyle(document.body).fontFamily; g.fillText(label, 8, y - 12);
          g.fillStyle = col;
          arr.forEach((t) => { const x = w - ((now - t) / W) * w; if (x > -8) { g.beginPath(); g.arc(x, y, i ? 6 : 3.5, 0, Math.PI * 2); g.fill(); } });
        });
        g.fillStyle = tok("--ink-3"); g.fillText("now →", w - 44, H - 4);
      });
      ctx.onCleanup(off);
      root.removeChild(cv.c);
      updateCounts();
      root.append(
        range("wait", { min: 100, max: 1000, step: 50, value: wait, fmt: (x) => x + "ms" }, (x) => { wait = x; }).el,
        pad,
        row(button("Fire a burst of 12 events", () => { for (let i = 0; i < 12; i++) ctx.after(fire, i * 90); }, { lit: true }), button("Clear", () => { ev.length = deb.length = thr.length = 0; lastThr = -Infinity; updateCounts(); })),
        cv.c, counts,
        caption("Debounce waits until events stop for the wait time, then fires once (search box). Throttle fires at most once per wait window while events keep coming (scroll handler)."));
    },
  });

  // ---------------------------------------------------------------- prototype chain
  add({
    id: "prototype-chain",
    title: "Prototype chain lookup",
    blurb: "Watch JavaScript walk up the chain to find a property",
    nodes: ["js-objects-this"],
    mount(root, ctx) {
      const chain = [
        { name: "rex (the object)", props: ["name"] },
        { name: "Dog.prototype", props: ["bark()", "constructor"] },
        { name: "Animal.prototype", props: ["eat()"] },
        { name: "Object.prototype", props: ["toString()", "hasOwnProperty()"] },
        { name: "null", props: [] },
      ];
      const code = h("pre", { class: "vcode" }, ["class Animal { eat() {} }", "class Dog extends Animal { bark() {} }", 'const rex = new Dog(); rex.name = "Rex";'].map((l) => h("div", null, l)));
      const boxes = chain.map((c, i) => h("div", { class: "vitem", style: "display:flex;justify-content:space-between;gap:8px;flex-wrap:wrap;padding:8px 10px" }, h("b", null, c.name), h("span", { class: "muted" }, c.props.join(", ") || "end of the chain")));
      const col = h("div", { class: "vstack" });
      boxes.forEach((b, i) => { col.appendChild(b); if (i < boxes.length - 1) col.appendChild(h("div", { class: "small muted", style: "padding-left:14px" }, "↓ [[Prototype]]")); });
      const cap = caption("Pick a property to look up.");
      let busy = [];
      function lookup(prop) {
        busy.forEach((t) => ctx.clear(t)); busy = [];
        boxes.forEach((b) => (b.className = "vitem"));
        const key = prop.replace("()", "");
        let i = 0;
        const stepFn = () => {
          boxes.forEach((b, j) => { if (j < i) b.className = "vitem"; });
          const c = chain[i];
          if (c.name === "null") { boxes[i].className = "vitem bad"; cap.textContent = `Reached null without finding "${key}". rex.${prop} is undefined${prop.includes("(") ? ", and calling it throws TypeError: rex." + key + " is not a function" : ""}.`; return; }
          const found = c.props.some((p) => p.replace("()", "") === key);
          boxes[i].className = "vitem " + (found ? "mint" : "lit");
          if (found) { cap.textContent = i === 0 ? `"${key}" is an own property of rex. Found immediately.` : `Not on rex, so JavaScript followed the chain ${i} step${i > 1 ? "s" : ""} up and found "${key}" on ${c.name}. Every Dog shares that one method.`; return; }
          cap.textContent = `Is "${key}" on ${c.name}? No. Follow [[Prototype]] up.`;
          i++;
          busy.push(ctx.after(stepFn, 700));
        };
        stepFn();
      }
      root.append(code, row(...["name", "bark()", "eat()", "toString()", "fly()"].map((p) => button("rex." + p, () => lookup(p), { lit: p === "eat()" }))), col, cap);
    },
  });

  // ---------------------------------------------------------------- array pipeline
  add({
    id: "array-pipeline",
    title: "filter → map → reduce",
    blurb: "Follow each order through the pipeline",
    nodes: ["js-data"],
    mount(root, ctx) {
      const orders = [{ id: 1, s: "paid", amt: 450 }, { id: 2, s: "failed", amt: 300 }, { id: 3, s: "paid", amt: 120 }, { id: 4, s: "refunded", amt: 200 }, { id: 5, s: "paid", amt: 880 }];
      const code = h("pre", { class: "vcode" }, ["orders", '  .filter(o => o.status === "paid")', "  .map(o => o.amount)", "  .reduce((sum, x) => sum + x, 0);"].map((l) => h("div", null, l)));
      const F = [];
      F.push({ stage: -1, kept: [], mapped: [], acc: null, say: "Five orders go in. Each array method returns a new array; the original is never changed." });
      const kept = [];
      orders.forEach((o, i) => { const keep = o.s === "paid"; if (keep) kept.push(o); F.push({ stage: 0, cur: i, keep, kept: kept.slice(), mapped: [], acc: null, say: `filter checks order #${o.id}: status is "${o.s}". ${keep ? "Kept." : "Dropped."}` }); });
      const mapped = [];
      kept.forEach((o, i) => { mapped.push(o.amt); F.push({ stage: 1, cur: i, kept: kept.slice(), mapped: mapped.slice(), acc: null, say: `map turns order #${o.id} into just its amount: ${o.amt}. Same length in, same length out.` }); });
      let acc = 0;
      F.push({ stage: 2, cur: -1, kept: kept.slice(), mapped: mapped.slice(), acc: 0, say: "reduce starts with the initial value 0 (the second argument). Always pass it." });
      mapped.forEach((x, i) => { const prev = acc; acc += x; F.push({ stage: 2, cur: i, kept: kept.slice(), mapped: mapped.slice(), acc, say: `sum = ${prev} + ${x} = ${acc}` }); });
      F[F.length - 1].say += `. Result: ₹${acc}. Three small steps, no loop counters, no mutation.`;
      const cols = [h("div", { class: "vstack" }), h("div", { class: "vstack" }), h("div", { class: "vstack" }), h("div", { class: "vstack" })];
      const cap = caption();
      const marks = [1, 2, 3];
      const st = stepper(ctx, {
        count: F.length,
        speed: 1200,
        render(i) {
          const f = F[i];
          const lines = code.children;
          [...lines].forEach((l, j) => (l.className = f.stage >= 0 && j === marks[f.stage] ? "now" : ""));
          cols.forEach((c) => clear(c));
          orders.forEach((o, j) => cols[0].appendChild(h("div", { class: "vitem" + (f.stage === 0 && f.cur === j ? (f.keep ? " mint" : " bad") : "") }, `#${o.id} ${o.s} ₹${o.amt}`)));
          f.kept.forEach((o, j) => cols[1].appendChild(h("div", { class: "vitem" + (f.stage === 1 && f.cur === j ? " lit" : "") }, `#${o.id} ₹${o.amt}`)));
          f.mapped.forEach((x, j) => cols[2].appendChild(h("div", { class: "vitem" + (f.stage === 2 && f.cur === j ? " lit" : "") }, String(x))));
          if (f.acc != null) cols[3].appendChild(h("div", { class: "vitem lit", style: "font-size:1.2rem;font-weight:700;text-align:center" }, `sum = ${f.acc}`));
          cap.textContent = f.say;
        },
      });
      const box = (t, c) => h("div", { class: "vbox" }, h("h4", null, t), c);
      root.append(code, h("div", { style: "display:grid;gap:8px;grid-template-columns:repeat(auto-fit,minmax(130px,1fr))" }, box("orders", cols[0]), box("after filter", cols[1]), box("after map", cols[2]), box("after reduce", cols[3])), cap, st.el);
      st.go(0);
    },
  });

  // ---------------------------------------------------------------- event loop
  const PROGRAMS = {
    basic: {
      label: "Timer vs promise",
      code: ['console.log("A");', 'setTimeout(() => console.log("B"), 0);', 'Promise.resolve().then(() => console.log("C"));', 'console.log("D");'],
      frames: [
        { line: -1, stack: ["main script"], web: [], micro: [], task: [], out: [], say: "The whole script runs as one task on the call stack." },
        { line: 0, stack: ["main script", 'log("A")'], web: [], micro: [], task: [], out: ["A"], say: "Synchronous code runs immediately. A is printed." },
        { line: 1, stack: ["main script", "setTimeout(cb, 0)"], web: ["timer 0ms → cb B"], micro: [], task: [], out: ["A"], say: "setTimeout hands the callback to the browser's timer and returns right away. JavaScript doesn't wait." },
        { line: 1, stack: ["main script"], web: [], micro: [], task: ["cb B"], out: ["A"], say: "0ms is up, so the timer moves callback B into the task queue. It must wait until the stack is empty." },
        { line: 2, stack: ["main script", "Promise.then(cb)"], web: [], micro: ["cb C"], task: ["cb B"], out: ["A"], say: "The promise is already resolved, so callback C goes into the microtask queue." },
        { line: 3, stack: ["main script", 'log("D")'], web: [], micro: ["cb C"], task: ["cb B"], out: ["A", "D"], say: "Still synchronous: D is printed before any callback." },
        { line: -1, stack: [], web: [], micro: ["cb C"], task: ["cb B"], out: ["A", "D"], say: "The script is done and the stack is empty. The event loop always drains ALL microtasks before the next task." },
        { line: 2, stack: ["cb C"], web: [], micro: [], task: ["cb B"], out: ["A", "D", "C"], say: "Microtask C runs. C is printed." },
        { line: 1, stack: ["cb B"], web: [], micro: [], task: [], out: ["A", "D", "C", "B"], say: "Microtasks are empty, so the loop takes the next task: B. Final order A, D, C, B, even though the timer was 0ms." },
      ],
    },
    await: {
      label: "async / await",
      code: ["async function f() {", '  console.log("1");', "  await null;", '  console.log("2");', "}", 'setTimeout(() => console.log("3"));', "f();", 'console.log("4");'],
      frames: [
        { line: -1, stack: ["main script"], web: [], micro: [], task: [], out: [], say: "Defining f doesn't run it." },
        { line: 5, stack: ["main script"], web: [], micro: [], task: ["cb 3"], out: [], say: "The timer callback 3 lands in the task queue almost immediately." },
        { line: 6, stack: ["main script", "f()"], web: [], micro: [], task: ["cb 3"], out: [], say: "f() is called. An async function runs synchronously until its first await." },
        { line: 1, stack: ["main script", "f()"], web: [], micro: [], task: ["cb 3"], out: ["1"], say: "1 is printed synchronously, inside f." },
        { line: 2, stack: ["main script"], web: [], micro: ["rest of f()"], task: ["cb 3"], out: ["1"], say: "await pauses f. The rest of f is scheduled as a microtask and f returns a pending promise." },
        { line: 7, stack: ["main script", 'log("4")'], web: [], micro: ["rest of f()"], task: ["cb 3"], out: ["1", "4"], say: "Back in the script: 4 is printed." },
        { line: 3, stack: ["rest of f()"], web: [], micro: [], task: ["cb 3"], out: ["1", "4", "2"], say: "Stack empty, so microtasks first: f resumes after await and prints 2." },
        { line: 5, stack: ["cb 3"], web: [], micro: [], task: [], out: ["1", "4", "2", "3"], say: "Finally the task: 3. Order 1, 4, 2, 3." },
      ],
    },
    nested: {
      label: "Promise inside a timer",
      code: ["setTimeout(() => {", '  console.log("T1");', '  Promise.resolve().then(() => console.log("P1"));', "}, 0);", 'setTimeout(() => console.log("T2"), 0);'],
      frames: [
        { line: 0, stack: ["main script"], web: [], micro: [], task: ["cb T1"], out: [], say: "First timer callback queued." },
        { line: 4, stack: ["main script"], web: [], micro: [], task: ["cb T1", "cb T2"], out: [], say: "Second timer callback queued behind it." },
        { line: -1, stack: [], web: [], micro: [], task: ["cb T1", "cb T2"], out: [], say: "Script done. No microtasks, so take one task." },
        { line: 1, stack: ["cb T1"], web: [], micro: [], task: ["cb T2"], out: ["T1"], say: "T1 runs and prints." },
        { line: 2, stack: ["cb T1"], web: [], micro: ["cb P1"], task: ["cb T2"], out: ["T1"], say: "Inside T1, a promise callback is queued as a microtask." },
        { line: 2, stack: ["cb P1"], web: [], micro: [], task: ["cb T2"], out: ["T1", "P1"], say: "T1 finishes. Before taking T2, the loop drains microtasks: P1 runs." },
        { line: 4, stack: ["cb T2"], web: [], micro: [], task: [], out: ["T1", "P1", "T2"], say: "Then T2. Microtasks always run between tasks. An endless chain of microtasks can freeze the page." },
      ],
    },
  };
  add({
    id: "event-loop",
    title: "Event loop simulator",
    blurb: "Call stack, microtasks and the task queue, one step at a time",
    nodes: ["js-async"],
    mount(root, ctx) {
      let prog = PROGRAMS.basic;
      const codeHost = h("div");
      const boxes = { stack: h("div", { class: "vstack rev" }), web: h("div", { class: "vstack" }), micro: h("div", { class: "vstack" }), task: h("div", { class: "vstack" }), out: h("div", { class: "vstack" }) };
      const cap = caption();
      let code;
      function build() { code = codeBlock(prog.code); clear(codeHost).appendChild(code.el); st.go(0); }
      const st = stepper(ctx, {
        count: () => prog.frames.length,
        speed: 1700,
        render(i) {
          const f = prog.frames[i];
          code.mark(f.line);
          const fill = (k, cls) => { clear(boxes[k]); f[k].forEach((x) => boxes[k].appendChild(h("div", { class: "vitem " + cls }, x))); if (!f[k].length) boxes[k].appendChild(h("div", { class: "small muted" }, "empty")); };
          fill("stack", "lit"); fill("web", "sky"); fill("micro", "mint"); fill("task", "plum");
          clear(boxes.out).appendChild(h("div", { class: "vitem", style: "font-size:1rem;font-weight:700" }, f.out.join("  ") || " "));
          cap.textContent = f.say;
        },
      });
      const sg = seg(Object.entries(PROGRAMS).map(([v, p]) => ({ v, label: p.label })), "basic", (v) => { st.stop(); prog = PROGRAMS[v]; build(); }, "Program");
      const b = (t, k) => h("div", { class: "vbox" }, h("h4", null, t), boxes[k]);
      root.append(sg.el, codeHost,
        h("div", { style: "display:grid;gap:8px;grid-template-columns:repeat(auto-fit,minmax(140px,1fr))" }, b("Call stack", "stack"), b("Web APIs (timers, fetch)", "web"), b("Microtask queue", "micro"), b("Task queue", "task")),
        h("div", { class: "vbox" }, h("h4", null, "Console"), boxes.out), cap, st.el);
      build();
    },
  });

  // ---------------------------------------------------------------- promise combinators
  add({
    id: "promise-combinators",
    title: "all vs allSettled vs race vs any",
    blurb: "Flip each promise between success and failure, then run",
    nodes: ["js-async"],
    mount(root, ctx) {
      const P = [{ n: "A", ms: 1200, ok: true }, { n: "B", ms: 600, ok: false }, { n: "C", ms: 1800, ok: true }];
      let mode = "all", t0 = null, stopLoop = null;
      const bars = h("div", { class: "vstack" });
      const result = h("div", { class: "vitem", style: "font-weight:700;font-size:1rem" }, "Press Run.");
      const cap = caption();
      const notes = {
        all: "Promise.all: fulfils with every value, or rejects as soon as ANY promise rejects. Use when you need all results.",
        allSettled: "Promise.allSettled: always waits for every promise and reports each outcome. Use when partial failure is fine.",
        race: "Promise.race: settles the same way as whichever promise settles first, success or failure. Classic use: a timeout.",
        any: "Promise.any: fulfils with the first success. Rejects (AggregateError) only if every promise fails. Use for trying mirrors.",
      };
      function outcome(el) {
        const settled = P.map((p) => ({ ...p, done: el >= p.ms })).sort((a, b) => a.ms - b.ms);
        const doneList = settled.filter((p) => p.done);
        const allDone = doneList.length === P.length;
        if (mode === "all") {
          const rej = doneList.find((p) => !p.ok);
          if (rej) return { at: rej.ms, ok: false, text: `rejected at ${rej.ms}ms with ${rej.n}'s error` };
          if (allDone) return { at: Math.max(...P.map((p) => p.ms)), ok: true, text: `fulfilled with [${P.map((p) => p.n).join(", ")}]` };
        }
        if (mode === "allSettled" && allDone) return { at: Math.max(...P.map((p) => p.ms)), ok: true, text: "fulfilled with " + P.map((p) => `${p.n}: ${p.ok ? "fulfilled" : "rejected"}`).join(", ") };
        if (mode === "race" && doneList.length) { const f = doneList[0]; return { at: f.ms, ok: f.ok, text: `${f.ok ? "fulfilled" : "rejected"} at ${f.ms}ms, copying ${f.n}` }; }
        if (mode === "any") {
          const win = doneList.find((p) => p.ok);
          if (win) return { at: win.ms, ok: true, text: `fulfilled at ${win.ms}ms with ${win.n}` };
          if (allDone) return { at: Math.max(...P.map((p) => p.ms)), ok: false, text: "rejected with AggregateError: every promise failed" };
        }
        return null;
      }
      function draw(el) {
        clear(bars);
        P.forEach((p, i) => {
          const pct = Math.min(1, el / p.ms) * (p.ms / 2000) * 100;
          const done = el >= p.ms;
          bars.appendChild(h("div", { style: "display:grid;grid-template-columns:auto 1fr auto;gap:8px;align-items:center" },
            h("button", { type: "button", class: "vbtn", style: "min-width:64px", onclick: () => { p.ok = !p.ok; draw(t0 == null ? 0 : el); }, "aria-label": `Toggle ${p.n}` }, `${p.n} ${p.ok ? "✓" : "✗"}`),
            h("div", { style: "height:14px;background:var(--bg-raised);border:1px solid var(--line);border-radius:99px;overflow:hidden" }, h("div", { style: `height:100%;width:${pct}%;background:var(${done ? (p.ok ? "--mint" : "--danger") : "--sky"})` })),
            h("span", { class: "small muted", style: "min-width:62px;text-align:right" }, done ? (p.ok ? "fulfilled" : "rejected") : `${p.ms}ms`)));
        });
        const o = outcome(el);
        result.textContent = o ? `Promise.${mode}(…) ${o.text}` : t0 == null ? "Press Run." : `Promise.${mode}(…) is pending…`;
        result.className = "vitem " + (o ? (o.ok ? "mint" : "bad") : "");
      }
      function run() {
        if (stopLoop) stopLoop();
        t0 = performance.now();
        stopLoop = ctx.loop((now) => { const el = now - t0; draw(el); if (el > 2000) { stopLoop(); stopLoop = null; } });
      }
      const sg = seg(["all", "allSettled", "race", "any"].map((v) => ({ v, label: v })), mode, (v) => { mode = v; cap.textContent = notes[v]; draw(t0 == null ? 0 : 2001); }, "Combinator");
      root.append(sg.el, h("p", { class: "small muted", style: "margin:0" }, "Tap A, B or C to switch it between success (✓) and failure (✗)."), bars, row(button("Run", run, { lit: true })), result, cap);
      cap.textContent = notes.all;
      draw(0);
    },
  });

  // ---------------------------------------------------------------- event propagation
  add({
    id: "event-propagation",
    title: "Capture, target, bubble",
    blurb: "Click any box and watch the event travel",
    nodes: ["js-dom"],
    mount(root, ctx) {
      let capture = false, stopMid = false, timers = [];
      const mk = (id, label, inner, extra) => h("div", { "data-box": id, style: `border:2px solid var(--line-strong);border-radius:10px;padding:${extra};background:var(--bg-raised);cursor:pointer;transition:border-color .2s, background .2s` }, h("div", { class: "small", style: "font-weight:700;margin-bottom:6px" }, label), inner);
      const inner = h("button", { type: "button", "data-box": "button", class: "vbtn vbtn-lit" }, "button");
      const middle = mk("card", "div.card", inner, "12px");
      const outer = mk("list", "section.list", middle, "14px");
      const log = h("div", { class: "vlog", "aria-live": "polite" });
      const cap = caption("Click the button, the card or the list.");
      const els = { list: outer, card: middle, button: inner };
      function flash(id, color) { Object.values(els).forEach((e) => { e.style.borderColor = ""; e.style.background = ""; }); if (id) { els[id].style.borderColor = `var(${color})`; if (id !== "button") els[id].style.background = `color-mix(in srgb, var(${color}) 12%, var(--bg-raised))`; } }
      outer.addEventListener("click", (e) => {
        const target = e.target.closest("[data-box]").dataset.box;
        timers.forEach((t) => ctx.clear(t)); timers = [];
        clear(log);
        const path = ["list", "card", "button"].slice(0, ["list", "card", "button"].indexOf(target) + 1);
        const steps = [];
        path.slice(0, -1).forEach((n) => steps.push({ n, color: "--sky", text: capture && n === "list" ? `capture ↓ ${n}: capture listener runs` : `capture ↓ ${n}: no capture listener, keep going` }));
        steps.push({ n: target, color: "--lit", text: `target ● ${target}: its listener runs` });
        let stopped = false;
        path.slice(0, -1).reverse().forEach((n) => {
          if (stopped) return;
          steps.push({ n, color: "--mint", text: `bubble ↑ ${n}: its listener runs${n === "card" && stopMid ? ", then stopPropagation()" : ""}` });
          if (n === "card" && stopMid) { stopped = true; steps.push({ n: null, color: "--danger", text: "stopped. section.list never hears about it.", bad: true }); }
        });
        steps.forEach((s, i) => timers.push(ctx.after(() => { flash(s.n, s.color); log.appendChild(h("div", { class: s.bad ? "bad" : s.color === "--lit" ? "lit" : "" }, s.text)); }, i * 650)));
        timers.push(ctx.after(() => { flash(null); cap.textContent = stopMid && target !== "list" ? "stopPropagation stopped the bubble at the card." : "Because events bubble, ONE listener on section.list can handle clicks for every child. That's event delegation: use event.target.closest() to see what was clicked."; }, steps.length * 650 + 300));
      });
      const capT = h("input", { type: "checkbox", id: VZ.id("cap") }); capT.addEventListener("change", () => (capture = capT.checked));
      const stopT = h("input", { type: "checkbox", id: VZ.id("stop") }); stopT.addEventListener("change", () => (stopMid = stopT.checked));
      root.append(row(h("label", { class: "small", style: "display:flex;gap:6px;align-items:center" }, capT, "capture listener on section.list"), h("label", { class: "small", style: "display:flex;gap:6px;align-items:center" }, stopT, "stopPropagation() in div.card")), outer, log, cap);
    },
  });

  // ---------------------------------------------------------------- fetch race
  add({
    id: "fetch-race",
    title: "Search race condition",
    blurb: "Why the slowest old response can overwrite the right answer",
    nodes: ["js-fetch"],
    mount(root, ctx) {
      let mode = "naive", timers = [];
      const reqs = [{ q: "r", start: 0, ms: 500 }, { q: "re", start: 250, ms: 1500 }, { q: "rea", start: 500, ms: 600 }];
      const lanes = h("div", { class: "vstack" });
      const shown = h("div", { class: "vitem", style: "font-size:1.05rem" }, "Input is empty.");
      const input = h("div", { class: "vitem", style: "font:1.1rem var(--f-code)" }, "🔍 ");
      const cap = caption("Press Type to simulate typing \"rea\" quickly. The server is slower for \"re\".");
      const total = 2200;
      function lane(r, state) {
        const left = (r.start / total) * 100, width = (r.ms / total) * 100;
        const col = state === "aborted" ? "--ink-3" : state === "done" ? "--mint" : state === "stale" ? "--danger" : "--sky";
        return h("div", { style: "display:grid;grid-template-columns:52px 1fr;gap:8px;align-items:center" },
          h("span", { class: "mono", style: "font:0.85rem var(--f-code)" }, `"${r.q}"`),
          h("div", { style: "position:relative;height:22px;background:var(--bg-raised);border:1px solid var(--line);border-radius:6px" },
            state ? h("div", { style: `position:absolute;top:2px;bottom:2px;left:${left}%;width:${state === "aborted" ? 6 : width}%;background:var(${col});border-radius:4px;opacity:${state === "pending" ? 0.6 : 1}` }) : null,
            state ? h("span", { style: `position:absolute;left:calc(${left}% + 6px);top:2px;font-size:.72rem;color:var(--ink)` }, state) : null));
      }
      const states = {};
      function draw() { clear(lanes); reqs.forEach((r) => lanes.appendChild(lane(r, states[r.q]))); }
      function run() {
        timers.forEach((t) => ctx.clear(t)); timers = [];
        Object.keys(states).forEach((k) => delete states[k]);
        input.textContent = "🔍 "; shown.textContent = "Nothing yet."; shown.className = "vitem";
        let latest = null;
        reqs.forEach((r, i) => {
          timers.push(ctx.after(() => {
            input.textContent = "🔍 " + r.q;
            if (mode === "abort" && latest) { states[latest.q] = "aborted"; }
            latest = r;
            states[r.q] = "pending"; draw();
            cap.textContent = mode === "abort" && i > 0 ? `Typed "${r.q}". The previous request is aborted before a new one starts.` : `Typed "${r.q}". A request starts.`;
          }, r.start));
          timers.push(ctx.after(() => {
            if (states[r.q] === "aborted") return;
            const isLatest = latest === r;
            states[r.q] = isLatest ? "done" : mode === "naive" && r.q === "re" ? "stale" : "done";
            shown.textContent = `Showing results for "${r.q}"`;
            const wrong = r.q !== "rea";
            shown.className = "vitem " + (wrong && r.start + r.ms > 1100 ? "bad" : wrong ? "" : "mint");
            draw();
            if (mode === "naive" && r.q === "re") cap.textContent = `The slow "re" response arrived LAST and overwrote "rea". The user typed "rea" but sees "re" results. Classic race condition.`;
            else if (r.q === "rea") cap.textContent = mode === "abort" ? `Only "rea" finished, so the screen matches what the user typed. AbortController fixed the race.` : `"rea" arrived. Looks right… but "re" is still in flight.`;
          }, r.start + r.ms));
        });
        draw();
      }
      const sg = seg([{ v: "naive", label: "No abort" }, { v: "abort", label: "AbortController" }], mode, (v) => { mode = v; run(); }, "Strategy");
      root.append(sg.el, row(button('Type "rea"', run, { lit: true })), input, lanes, shown, cap);
      draw();
    },
  });

  // ---------------------------------------------------------------- garbage collection
  add({
    id: "gc-reachability",
    title: "Garbage collection and leaks",
    blurb: "Mark what's reachable from the roots, sweep the rest",
    nodes: ["js-memory"],
    mount(root, ctx) {
      const N = { global: [44, 60, "global"], doc: [44, 190, "document"], user: [170, 34, "user"], cart: [170, 100, "cart"], items: [300, 100, "items[]"], modal: [170, 190, "modal"], handler: [306, 190, "onClose()"] };
      const roots = ["global", "doc"];
      let edges, removed, marked, leak, timers = [];
      function reset() { edges = [["global", "user"], ["global", "cart"], ["cart", "items"], ["global", "modal"], ["modal", "handler"], ["handler", "modal"]]; removed = new Set(); marked = new Set(); leak = false; }
      reset();
      const host = h("div");
      const cap = caption("Roots (global variables, the DOM, the current stack) are always alive. Anything you can reach from a root by following references stays.");
      function draw() {
        const svg = s("svg", { class: "vsvg", viewBox: "0 0 380 230", role: "img", "aria-label": "Object reference graph", style: "max-width:560px;margin:0 auto" });
        const defs = s("defs", null, s("marker", { id: "gcArrow", viewBox: "0 0 10 10", refX: 9, refY: 5, markerWidth: 7, markerHeight: 7, orient: "auto-start-reverse" }, s("path", { d: "M0 0 L10 5 L0 10z", class: "f-sky" })));
        svg.appendChild(defs);
        const allEdges = edges.concat(leak ? [["doc", "handler"]] : []);
        allEdges.forEach(([a, b]) => {
          if (removed.has(a) || removed.has(b)) return;
          const [x1, y1] = N[a], [x2, y2] = N[b];
          const dx = x2 - x1, dy = y2 - y1, len = Math.hypot(dx, dy), ux = dx / len, uy = dy / len;
          const bend = (a === "handler" && b === "modal") ? 14 : (a === "modal" && b === "handler") ? -14 : 0;
          const mx = (x1 + x2) / 2 - uy * bend, my = (y1 + y2) / 2 + ux * bend;
          svg.appendChild(s("path", { d: `M${x1 + ux * 30} ${y1 + uy * 20} Q${mx} ${my} ${x2 - ux * 34} ${y2 - uy * 20}`, class: "f-none s-sky", "stroke-width": 2, "marker-end": "url(#gcArrow)", opacity: a === "doc" ? 1 : 0.8, "stroke-dasharray": a === "doc" ? "5 4" : null }));
        });
        Object.entries(N).forEach(([k, [x, y, label]]) => {
          if (removed.has(k)) return;
          const isRoot = roots.includes(k);
          const cls = isRoot ? "f-plum" : marked.has(k) ? "f-mint" : "f-raised s-line";
          svg.appendChild(s("rect", { x: x - 40, y: y - 16, width: 80, height: 32, rx: isRoot ? 16 : 8, class: cls, "stroke-width": 1.5 }));
          svg.appendChild(s("text", { x, y: y + 5, "text-anchor": "middle", "font-size": 13, "font-weight": 700, class: isRoot || marked.has(k) ? "t-ink-on-lit" : "" }, label));
        });
        clear(host).appendChild(svg);
      }
      function gc() {
        timers.forEach((t) => ctx.clear(t)); timers = [];
        marked = new Set();
        const allEdges = edges.concat(leak ? [["doc", "handler"]] : []);
        const order = [], seen = new Set(roots), q = [...roots];
        while (q.length) { const x = q.shift(); allEdges.filter(([a]) => a === x).forEach(([, b]) => { if (!seen.has(b) && !removed.has(b)) { seen.add(b); order.push(b); q.push(b); } }); }
        cap.textContent = "Mark phase: start at the roots and follow every reference.";
        order.forEach((k, i) => timers.push(ctx.after(() => { marked.add(k); draw(); }, 450 * (i + 1))));
        timers.push(ctx.after(() => {
          const dead = Object.keys(N).filter((k) => !roots.includes(k) && !seen.has(k) && !removed.has(k));
          dead.forEach((k) => removed.add(k));
          marked = new Set(); draw();
          cap.textContent = dead.length
            ? `Sweep phase: ${dead.join(", ")} couldn't be reached from any root, so they're freed. Note modal and onClose point at each other. Cycles are fine; reachability is all that matters.`
            : leak && !edges.some(([a, b]) => a === "global" && b === "modal")
              ? "Nothing freed. You removed global.modal, but document still holds onClose, and onClose holds modal. That forgotten event listener is a memory leak. removeEventListener (or an AbortSignal) fixes it."
              : "Nothing freed: everything is still reachable from a root.";
        }, 450 * (order.length + 1) + 300));
      }
      root.append(row(
        button("modal = null", () => { edges = edges.filter(([a, b]) => !(a === "global" && b === "modal")); marked = new Set(); draw(); cap.textContent = "The global no longer references the modal. Is it garbage now? Run the collector."; }),
        button("Toggle: listener left on document", () => { leak = !leak; draw(); cap.textContent = leak ? "document now references onClose (addEventListener without removing it). Dashed line." : "Listener removed."; }),
        button("Run garbage collector", gc, { lit: true }),
        button("Reset", () => { timers.forEach((t) => ctx.clear(t)); reset(); draw(); cap.textContent = "Back to the start."; })),
        host, h("div", { class: "vlegend" }, h("span", null, h("i", { style: "background:var(--plum)" }), "root"), h("span", null, h("i", { style: "background:var(--mint)" }), "marked reachable")), cap);
      draw();
    },
  });
})();
