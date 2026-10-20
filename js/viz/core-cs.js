/* Core CS explainers: OOP, OS, concurrency, memory, networks, DBMS, design patterns */
(function () {
  const { h, s, clear, button, row, caption, seg, range, chip, stat, stepper, sequence } = window.VZ;
  const add = window.PNODE_VIZ.add;
  const tableEl = (head, rows, cellStyle) => h("table", { style: "border-collapse:collapse;width:100%;font-size:.82rem" }, h("thead", null, h("tr", null, head.map((x) => h("th", { style: "text-align:left;padding:5px 8px;border-bottom:1px solid var(--line-strong);color:var(--ink-3)" }, x)))), h("tbody", null, rows.map((r, i) => h("tr", null, r.map((c, j) => h("td", { style: "padding:5px 8px;border-bottom:1px solid var(--line);" + (cellStyle ? cellStyle(i, j, c) : "") }, String(c)))))));

  // ---------------------------------------------------------------- CPU scheduling
  add({
    id: "cpu-scheduling",
    title: "CPU scheduling: FCFS, SJF, Round Robin",
    blurb: "Same processes, three schedulers, different waiting times",
    nodes: ["os-processes"],
    mount(root) {
      const P = [{ id: "P1", at: 0, bt: 7 }, { id: "P2", at: 1, bt: 3 }, { id: "P3", at: 2, bt: 1 }, { id: "P4", at: 3, bt: 4 }];
      const colors = { P1: "--sky", P2: "--lit", P3: "--mint", P4: "--plum" };
      let algo = "fcfs", q = 2;
      const gantt = h("div");
      const tbl = h("div", { class: "vscroll" });
      const stats = h("div", { class: "vstats" });
      const cap = caption();
      function schedule() {
        const slices = [], rem = Object.fromEntries(P.map((p) => [p.id, p.bt])), done = {};
        let t = 0;
        if (algo === "rr") {
          const queue = [], arrived = new Set();
          const admit = () => P.forEach((p) => { if (p.at <= t && !arrived.has(p.id)) { arrived.add(p.id); queue.push(p.id); } });
          admit();
          while (Object.keys(done).length < P.length) {
            if (!queue.length) { t++; admit(); continue; }
            const id = queue.shift(); const run = Math.min(q, rem[id]);
            slices.push([id, t, t + run]); t += run; rem[id] -= run; admit();
            if (rem[id] > 0) queue.push(id); else done[id] = t;
          }
        } else {
          while (Object.keys(done).length < P.length) {
            const ready = P.filter((p) => p.at <= t && !done[p.id]);
            if (!ready.length) { t++; continue; }
            const p = algo === "fcfs" ? ready.sort((a, b) => a.at - b.at)[0] : ready.sort((a, b) => a.bt - b.bt || a.at - b.at)[0];
            slices.push([p.id, t, t + p.bt]); t += p.bt; done[p.id] = t;
          }
        }
        return { slices, done };
      }
      function draw() {
        const { slices, done } = schedule();
        const end = Math.max(...slices.map((x) => x[2]));
        clear(gantt).appendChild(h("div", { style: "display:flex;height:34px;border-radius:6px;overflow:hidden;border:1px solid var(--line)" }, ...slices.map(([id, a, b]) => h("div", { title: `${id} ${a}–${b}`, style: `flex:${b - a};background:var(${colors[id]});display:grid;place-items:center;font:700 .75rem var(--f-code);color:var(--lit-ink);border-right:1px solid var(--bg-sunk)` }, id))));
        gantt.appendChild(h("div", { style: "display:flex;font:0.65rem var(--f-code);color:var(--ink-3)" }, ...slices.map(([, a, b], i) => h("div", { style: `flex:${b - a}` }, String(a))), h("div", null, String(end))));
        const rows = P.map((p) => { const tat = done[p.id] - p.at, wt = tat - p.bt; return [p.id, p.at, p.bt, done[p.id], tat, wt]; });
        clear(tbl).appendChild(tableEl(["process", "arrival", "burst", "finish", "turnaround", "waiting"], rows));
        const avgW = rows.reduce((a, r) => a + r[5], 0) / rows.length;
        clear(stats).append(stat("average waiting time", avgW.toFixed(2), avgW < 3 ? "good" : "bad"), stat("context switches", slices.length - 1));
        cap.textContent = { fcfs: "First come, first served: simple and fair in order, but a long job at the front makes everyone wait (the convoy effect).", sjf: "Shortest job first: the lowest average waiting time possible, but long jobs can starve, and the OS rarely knows burst times in advance.", rr: `Round robin with quantum ${q}: every process gets a turn, so it feels responsive. More context switches, and a quantum too small wastes time switching.` }[algo];
      }
      const qr = range("quantum (RR)", { min: 1, max: 5, value: q }, (x) => { q = x; draw(); });
      root.append(seg([{ v: "fcfs", label: "FCFS" }, { v: "sjf", label: "SJF" }, { v: "rr", label: "Round Robin" }], algo, (v) => { algo = v; draw(); }, "Scheduler").el, qr.el, gantt, tbl, stats, cap,
        h("p", { class: "small muted", style: "margin:0" }, "Turnaround = finish − arrival. Waiting = turnaround − burst. Interviewers often ask you to compute these by hand."));
      draw();
    },
  });

  // ---------------------------------------------------------------- race condition
  add({
    id: "race-mutex",
    title: "Race condition and a mutex",
    blurb: "Two threads run count++ at the same time",
    nodes: ["concurrency"],
    mount(root, ctx) {
      let locked = false;
      function gen() {
        const F = [];
        let mem = 0, a = null, b = null, holder = null;
        const say = (who, what, text) => F.push({ mem, a, b, holder, who, what, say: text });
        if (!locked) {
          say("A", "read", "count++ looks like one step but is three: read, add, write. Thread A reads count = 0 into its register.");
          a = mem; F[F.length - 1].a = a;
          say("B", "read", "Before A writes, the scheduler switches to thread B. B also reads 0."); b = mem; F[F.length - 1].b = b;
          a = a + 1; say("A", "add", "A adds 1 in its register: 1.");
          b = b + 1; say("B", "add", "B adds 1 in its register: 1.");
          mem = a; say("A", "write", "A writes 1 to count.");
          mem = b; say("B", "write", "B writes 1 to count, overwriting A's update. Two increments, but count is 1. A lost update.");
        } else {
          holder = "A"; say("A", "lock", "A calls mutex.lock() and gets it.");
          say("B", "wait", "B tries to lock and is blocked until A releases.");
          a = mem; say("A", "read", "A reads 0 safely."); a++; say("A", "add", "A adds 1.");
          mem = a; say("A", "write", "A writes 1."); holder = null; say("A", "unlock", "A unlocks.");
          holder = "B"; say("B", "lock", "Now B acquires the lock.");
          b = mem; say("B", "read", "B reads 1, the up-to-date value."); b++; say("B", "add", "B adds 1.");
          mem = b; say("B", "write", "B writes 2."); holder = null; say("B", "unlock", "Correct: count = 2. The lock made read-add-write one critical section. Cost: B had to wait.");
        }
        return F;
      }
      let F = gen();
      const host = h("div", { style: "display:grid;gap:8px;grid-template-columns:repeat(auto-fit,minmax(110px,1fr))" });
      const cap = caption();
      const st = stepper(ctx, {
        count: () => F.length, speed: 1500,
        render(i) {
          const f = F[i];
          const th = (n, reg) => h("div", { class: "vbox", style: f.who === n ? "border-color:var(--lit);border-width:2px" : "" }, h("h4", null, `thread ${n}`), h("div", { class: "vitem" + (f.who === n ? " lit" : "") }, `register: ${reg == null ? "–" : reg}`), h("div", { class: "small muted", style: "margin-top:4px" }, f.who === n ? f.what : ""));
          clear(host).append(th("A", f.a), h("div", { class: "vbox" }, h("h4", null, "shared memory"), h("div", { class: "vitem " + (i === F.length - 1 ? (f.mem === 2 ? "mint" : "bad") : ""), style: "font-size:1.1rem;font-weight:700;text-align:center" }, `count = ${f.mem}`), locked ? h("div", { class: "small", style: "margin-top:4px;text-align:center" }, f.holder ? `🔒 held by ${f.holder}` : "🔓 free") : null), th("B", f.b));
          cap.textContent = f.say;
        },
      });
      root.append(seg([{ v: false, label: "No lock" }, { v: true, label: "With a mutex" }], false, (v) => { locked = v; F = gen(); st.stop(); st.go(0); }, "Locking").el, host, cap, st.el);
      st.go(0);
    },
  });

  // ---------------------------------------------------------------- deadlock
  add({
    id: "deadlock",
    title: "Deadlock and lock ordering",
    blurb: "Two threads, two locks, wrong order",
    nodes: ["concurrency"],
    mount(root, ctx) {
      const flows = {
        bad: [
          { from: 0, to: 1, label: "lock(accountA) ✓", say: "Transfer 1 (A → B) locks account A first." },
          { from: 2, to: 1, label: "lock(accountB) ✓", say: "At the same moment, Transfer 2 (B → A) locks account B first." },
          { from: 0, to: 1, label: "lock(accountB)… waits", tone: "bad", say: "Transfer 1 now needs B, which Transfer 2 holds. It waits." },
          { from: 2, to: 1, label: "lock(accountA)… waits", tone: "bad", say: "Transfer 2 needs A, which Transfer 1 holds. It waits too." },
          { from: 1, to: 1, label: "both wait forever", tone: "bad", say: "Deadlock. All four conditions hold: mutual exclusion, hold and wait, no preemption, and a circular wait." },
        ],
        good: [
          { from: 0, to: 1, label: "lock(min(A,B)) = A ✓", say: "Fix: every thread locks accounts in the same global order, for example by id." },
          { from: 2, to: 1, label: "lock(min(A,B)) = A… waits", say: "Transfer 2 also asks for A first, so it waits before taking anything. It holds nothing." },
          { from: 0, to: 1, label: "lock(B) ✓ → transfer → unlock both", tone: "good", say: "Transfer 1 gets B, finishes, and releases both locks." },
          { from: 2, to: 1, label: "lock(A) ✓, lock(B) ✓ → transfer", tone: "good", say: "Transfer 2 proceeds. No circular wait is possible, so no deadlock. Databases also detect deadlocks and abort one transaction to break the cycle." },
        ],
      };
      const host = h("div");
      root.append(seg([{ v: "bad", label: "Different lock order" }, { v: "good", label: "Same global order" }], "bad", (v) => sequence(ctx, host, { actors: ["Transfer 1", "Lock manager", "Transfer 2"], steps: flows[v] }), "Locking strategy").el, host);
      sequence(ctx, host, { actors: ["Transfer 1", "Lock manager", "Transfer 2"], steps: flows.bad });
    },
  });

  // ---------------------------------------------------------------- page replacement
  add({
    id: "page-replacement",
    title: "Page replacement: FIFO, LRU, Optimal",
    blurb: "Count page faults for the same reference string",
    nodes: ["os-memory"],
    mount(root) {
      const ref = [7, 0, 1, 2, 0, 3, 0, 4, 2, 3, 0, 3, 2];
      let algo = "lru", frames = 3;
      const host = h("div", { class: "vscroll" });
      const stats = h("div", { class: "vstats" });
      const cap = caption();
      function simulate(alg) {
        let mem = [], faults = 0; const cols = []; const lastUse = {}; const loadedAt = {};
        ref.forEach((p, t) => {
          let fault = false, evicted = null;
          if (!mem.includes(p)) {
            fault = true; faults++;
            if (mem.length < frames) mem.push(p);
            else {
              let victim;
              if (alg === "fifo") victim = mem.slice().sort((a, b) => loadedAt[a] - loadedAt[b])[0];
              else if (alg === "lru") victim = mem.slice().sort((a, b) => lastUse[a] - lastUse[b])[0];
              else { const nextUse = (x) => { const k = ref.indexOf(x, t + 1); return k < 0 ? Infinity : k; }; victim = mem.slice().sort((a, b) => nextUse(b) - nextUse(a))[0]; }
              evicted = victim; mem[mem.indexOf(victim)] = p;
            }
            loadedAt[p] = t;
          }
          lastUse[p] = t;
          cols.push({ p, mem: mem.slice(), fault, evicted });
        });
        return { cols, faults };
      }
      function draw() {
        const { cols, faults } = simulate(algo);
        const all = { fifo: simulate("fifo").faults, lru: simulate("lru").faults, opt: simulate("opt").faults };
        const grid = h("div", { style: `display:grid;grid-template-columns:repeat(${ref.length},minmax(28px,1fr));gap:3px;min-width:${ref.length * 31}px` });
        cols.forEach((c) => grid.appendChild(h("div", { style: "text-align:center;font:700 .85rem var(--f-code);color:var(--lit)" }, String(c.p))));
        for (let r = 0; r < frames; r++) cols.forEach((c) => grid.appendChild(h("div", { class: "vitem" + (c.fault && c.mem[r] === c.p ? " lit" : ""), style: "text-align:center;padding:5px 0;font-size:.8rem" }, c.mem[r] == null ? "" : String(c.mem[r]))));
        cols.forEach((c) => grid.appendChild(h("div", { style: `text-align:center;font:700 .7rem var(--f-body);color:var(${c.fault ? "--danger" : "--mint"})` }, c.fault ? "F" : "hit")));
        clear(host).appendChild(grid);
        clear(stats).append(stat("page faults", faults, "lit"), stat("FIFO", all.fifo), stat("LRU", all.lru), stat("Optimal", all.opt, "good"));
        cap.textContent = { fifo: "FIFO evicts the page that's been in memory longest, even if you're still using it. Simple, but can perform badly (and shows Belady's anomaly: more frames can mean more faults).", lru: "LRU evicts the page unused for the longest time, betting that recent use predicts future use. This is also how most caches evict (an LRU cache is a classic interview build: hash map + doubly linked list).", opt: "Optimal evicts the page that won't be needed for the longest time. Impossible in practice (it needs the future) but it's the benchmark the others are compared against." }[algo];
      }
      root.append(seg([{ v: "fifo", label: "FIFO" }, { v: "lru", label: "LRU" }, { v: "opt", label: "Optimal" }], algo, (v) => { algo = v; draw(); }, "Algorithm").el,
        range("frames in memory", { min: 2, max: 5, value: frames }, (x) => { frames = x; draw(); }).el, h("div", { class: "small muted" }, "Reference string (top row) → frame contents → fault or hit"), host, stats, cap);
      draw();
    },
  });

  // ---------------------------------------------------------------- TCP vs UDP
  add({
    id: "tcp-udp",
    title: "TCP vs UDP when a packet is lost",
    blurb: "Reliable, ordered delivery versus fire-and-forget",
    nodes: ["networks"],
    mount(root, ctx) {
      const flows = {
        tcp: [
          { from: 0, to: 1, label: "SYN seq=100", say: "Three-way handshake: the client proposes a starting sequence number." },
          { from: 1, to: 0, label: "SYN-ACK seq=300 ack=101", say: "The server agrees and picks its own." },
          { from: 0, to: 1, label: "ACK ack=301", say: "Connection established. One round trip before any data." },
          { from: 0, to: 1, label: "data seq=101 (bytes 1–1000)", say: "Data is numbered by byte so the receiver can reorder and spot gaps." },
          { from: 0, to: 0, label: "data seq=1101 … lost ✗", tone: "bad", say: "The second segment is dropped somewhere on the network." },
          { from: 1, to: 0, label: "ACK ack=1101", say: "The receiver keeps acknowledging the last in-order byte it has. The sender notices the gap." },
          { from: 0, to: 0, label: "timeout → retransmit", say: "After a timeout (or three duplicate ACKs) TCP resends the missing segment." },
          { from: 0, to: 1, label: "data seq=1101 (again)", tone: "good", say: "Retransmitted." },
          { from: 1, to: 0, label: "ACK ack=2101", tone: "good", say: "Everything arrived, in order, exactly once. The app never saw the loss. Cost: extra latency. Used by HTTP/1.1, HTTP/2, databases, SSH." },
        ],
        udp: [
          { from: 0, to: 1, label: "datagram #1 (frame 1)", say: "No handshake. The first packet goes out immediately." },
          { from: 0, to: 0, label: "datagram #2 … lost ✗", tone: "bad", say: "One packet is lost." },
          { from: 0, to: 1, label: "datagram #3 (frame 3)", say: "UDP doesn't notice or care. No ACKs, no retransmits, no ordering." },
          { from: 1, to: 1, label: "plays frames 1 and 3", say: "For a video call or game, a late frame is useless anyway. Skipping it beats freezing to wait for it. DNS and QUIC (HTTP/3) also run over UDP, adding their own reliability where needed." },
        ],
      };
      const host = h("div");
      root.append(seg([{ v: "tcp", label: "TCP" }, { v: "udp", label: "UDP" }], "tcp", (v) => sequence(ctx, host, { actors: ["Client", "Server"], steps: flows[v] }), "Protocol").el, host);
      sequence(ctx, host, { actors: ["Client", "Server"], steps: flows.tcp });
    },
  });

  // ---------------------------------------------------------------- encapsulation
  add({
    id: "osi-encapsulation",
    title: "Layers and encapsulation",
    blurb: "Each layer wraps the data in its own header",
    nodes: ["networks"],
    mount(root, ctx) {
      const L = [
        { n: "Application (HTTP)", hdr: "GET /notes HTTP/1.1 + headers", c: "--lit", say: "Your app speaks HTTP. This is the only layer your code usually touches." },
        { n: "Transport (TCP)", hdr: "src port 51234 → dst port 443, seq, ack", c: "--sky", say: "TCP adds ports (which program) and sequence numbers (ordering and reliability). The unit is a segment." },
        { n: "Network (IP)", hdr: "src 192.168.1.20 → dst 93.184.215.14, TTL", c: "--mint", say: "IP adds addresses so routers can forward it across networks. The unit is a packet. TTL stops packets looping forever." },
        { n: "Link (Ethernet / Wi-Fi)", hdr: "src MAC → router MAC, checksum", c: "--plum", say: "The link layer gets it to the next hop on the local network. The unit is a frame. It's re-wrapped at every router." },
      ];
      const host = h("div", { style: "display:grid;gap:8px" });
      const cap = caption();
      const N = L.length * 2 + 1;
      const st = stepper(ctx, {
        count: N, speed: 1500,
        render(i) {
          clear(host);
          const sending = i <= L.length;
          const depth = sending ? i : N - 1 - i;
          let inner = h("div", { class: "vitem", style: "font-family:var(--f-code);font-size:.8rem" }, '{ "title": "Buy flour" }');
          for (let k = 0; k < depth; k++) inner = h("div", { style: `border:2px solid var(${L[k].c});border-radius:8px;padding:6px;display:grid;gap:4px` }, h("div", { style: `font:700 .72rem var(--f-code);color:var(${L[k].c})` }, L[k].hdr), inner);
          host.append(h("div", { class: "small muted" }, sending ? "Sender: wrapping on the way down" : "Receiver: unwrapping on the way up"), inner);
          cap.textContent = i === 0 ? "Start with the data your app wants to send." : i === L.length ? "Fully wrapped, it travels as bits over cable or radio. Interviewers love asking which layer something lives at: ports are transport, IPs are network, MACs are link." : sending ? L[depth - 1].say : depth === 0 ? "Fully unwrapped. The server's app receives exactly what you sent. The OSI model splits these into 7 layers; TCP/IP uses these 4." : `The receiver strips the ${L[depth].n} header and hands the rest up.`;
        },
      });
      root.append(host, cap, st.el);
      st.go(0);
    },
  });

  // ---------------------------------------------------------------- isolation levels
  add({
    id: "isolation-levels",
    title: "Transaction isolation levels",
    blurb: "Dirty reads and non-repeatable reads, side by side",
    nodes: ["dbms-theory"],
    mount(root, ctx) {
      const levels = {
        ru: { label: "Read uncommitted", rows: [["BEGIN", ""], ["", "BEGIN"], ["", "UPDATE balance = 0"], ["SELECT balance → 0", ""], ["", "ROLLBACK"], ["acts on 0 ✗", ""]], bad: [3, 5], say: "Dirty read: T1 saw T2's change before T2 committed. T2 rolled back, so T1 acted on a value that never existed." },
        rc: { label: "Read committed", rows: [["BEGIN", ""], ["SELECT balance → 500", ""], ["", "UPDATE balance = 0; COMMIT"], ["SELECT balance → 0 ✗", ""], ["COMMIT", ""]], bad: [3], say: "No dirty reads (Postgres's default), but a non-repeatable read: the same SELECT in one transaction returned 500, then 0." },
        rr: { label: "Repeatable read", rows: [["BEGIN", ""], ["SELECT balance → 500", ""], ["", "UPDATE balance = 0; COMMIT"], ["SELECT balance → 500 ✓", ""], ["COMMIT", ""]], bad: [], say: "T1 works on a consistent snapshot, so repeated reads match. Serializable goes further and makes the result equal to some one-at-a-time order, retrying transactions that conflict." },
      };
      let lv = "ru";
      const host = h("div", { class: "vscroll" });
      const cap = caption();
      function draw() {
        const L = levels[lv];
        clear(host).appendChild(tableEl(["step", "T1 (report)", "T2 (withdrawal)"], L.rows.map((r, i) => [i + 1, r[0], r[1]]), (i, j) => (L.bad.includes(i) && j === 1 ? "color:var(--danger);font-weight:700" : j ? "font-family:var(--f-code)" : "")));
        cap.textContent = L.say;
      }
      root.append(seg(Object.entries(levels).map(([v, l]) => ({ v, label: l.label })), lv, (v) => { lv = v; draw(); }, "Isolation level").el, host, cap,
        h("p", { class: "small muted", style: "margin:0" }, "Higher isolation means fewer anomalies but more locking or retries. Pick the lowest level that's still correct for each transaction."));
      draw();
    },
  });

  // ---------------------------------------------------------------- polymorphism
  add({
    id: "polymorphism",
    title: "Polymorphism vs type checks",
    blurb: "Add a new shape. How much existing code changes?",
    nodes: ["oop"],
    mount(root) {
      let mode = "if", shapes = ["Circle", "Square", "Triangle"];
      const code = h("pre", { class: "vcode" });
      const stats = h("div", { class: "vstats" });
      const cap = caption();
      function draw(added) {
        clear(code);
        let lines;
        if (mode === "if") lines = ["function area(shape) {", ...shapes.flatMap((n, i) => [`  ${i ? "} else " : ""}if (shape.type === "${n.toLowerCase()}") {`, `    return /* ${n} formula */;`]), "  }", "}", "function perimeter(shape) { /* the same if-chain again */ }", "function draw(shape)      { /* …and again */ }"];
        else lines = ["interface Shape { area(): number; perimeter(): number; }", ...shapes.map((n) => `class ${n} implements Shape { area() {…} perimeter() {…} }`), "", "const total = shapes.reduce((sum, s) => sum + s.area(), 0);"];
        lines.forEach((l) => code.appendChild(h("div", { class: added && l.includes(added) ? "now" : "" }, l)));
        if (added) clear(stats).append(stat("existing functions edited", mode === "if" ? "3" : "0", mode === "if" ? "bad" : "good"), stat("new code", mode === "if" ? "scattered" : "1 class", mode === "if" ? "bad" : "good"));
        else clear(stats);
      }
      root.append(seg([{ v: "if", label: "if / switch on type" }, { v: "poly", label: "Polymorphism" }], mode, (v) => { mode = v; shapes = ["Circle", "Square", "Triangle"]; draw(); cap.textContent = "Now add a Hexagon."; }, "Design").el,
        row(button("Add Hexagon", () => { if (!shapes.includes("Hexagon")) shapes.push("Hexagon"); draw("Hexagon"); cap.textContent = mode === "if" ? "Every function that branches on type has to be found and edited. Miss one and Hexagon silently breaks. This violates the open/closed principle." : "Add one class. The calling code doesn't change: it just calls s.area() and each object knows its own formula. Open for extension, closed for modification."; }, { lit: true })), code, stats, cap);
      draw(); cap.textContent = "Now add a Hexagon.";
    },
  });

  // ---------------------------------------------------------------- strategy
  add({
    id: "strategy-pattern",
    title: "Strategy pattern",
    blurb: "Swap the pricing rule without touching checkout",
    nodes: ["lld-patterns"],
    mount(root) {
      const cart = [["Brownie box", 450], ["Cookie tin", 300], ["Cold coffee", 120]];
      const strategies = {
        none: { label: "No offer", fn: (t) => t, code: "class NoDiscount { apply(t) { return t; } }" },
        pct: { label: "10% off", fn: (t) => Math.round(t * 0.9), code: "class PercentOff { constructor(p) {…} apply(t) { return t * (1 - p); } }" },
        flat: { label: "₹100 off above ₹500", fn: (t) => (t > 500 ? t - 100 : t), code: "class FlatOff { apply(t) { return t > 500 ? t - 100 : t; } }" },
        bogo: { label: "Cheapest item free", fn: (t) => t - Math.min(...cart.map((c) => c[1])), code: "class CheapestFree { apply(t, items) { return t - min(items); } }" },
      };
      let cur = "none";
      const out = h("div", { class: "vstats" });
      const code = h("pre", { class: "vcode" });
      const cap = caption("Checkout depends on a DiscountStrategy interface, not on any specific rule.");
      function draw() {
        const total = cart.reduce((a, c) => a + c[1], 0);
        clear(out).append(stat("subtotal", "₹" + total), stat("you pay", "₹" + strategies[cur].fn(total), "good"));
        clear(code).append(h("div", { class: "done" }, "interface DiscountStrategy { apply(total, items): number }"), h("div", { class: "now" }, strategies[cur].code), h("div", null, " "), h("div", null, "class Checkout {"), h("div", null, "  constructor(private discount: DiscountStrategy) {}"), h("div", null, "  total(items) { return this.discount.apply(sum(items), items); }"), h("div", null, "}"));
      }
      root.append(seg(Object.entries(strategies).map(([v, s]) => ({ v, label: s.label })), cur, (v) => { cur = v; draw(); cap.textContent = "Checkout didn't change at all. Only the strategy object passed in did. New offers next Diwali? Add a class, ship it, no risk to the checkout code."; }, "Offer").el,
        h("div", { class: "vrow" }, cart.map(([n, p]) => chip(`${n} ₹${p}`))), out, code, cap);
      draw();
    },
  });

  // ---------------------------------------------------------------- observer
  add({
    id: "observer-pattern",
    title: "Observer (pub/sub) pattern",
    blurb: "Subscribers react to events without the publisher knowing them",
    nodes: ["lld-patterns"],
    mount(root, ctx) {
      const subs = { Email: true, Inventory: true, Analytics: false, Loyalty: false };
      const host = h("div", { class: "vgrid2" });
      const log = h("div", { class: "vlog" });
      const cap = caption("Toggle subscribers, then publish an OrderPlaced event.");
      function draw(flash) {
        clear(host);
        Object.keys(subs).forEach((k) => {
          const b = h("button", { type: "button", class: "vitem " + (flash && subs[k] ? "mint" : subs[k] ? "sky" : ""), style: "cursor:pointer;text-align:left;color:var(--ink);font:inherit", "aria-pressed": String(subs[k]) }, h("b", null, k), h("div", { class: "small muted" }, subs[k] ? "subscribed" : "not subscribed"));
          b.addEventListener("click", () => { subs[k] = !subs[k]; draw(); cap.textContent = `${k} ${subs[k] ? "subscribed" : "unsubscribed"}. The Orders code didn't change.`; });
          host.appendChild(b);
        });
      }
      function publish() {
        clear(log); log.appendChild(h("div", { class: "lit" }, "orders.emit('OrderPlaced', { id: 981 })"));
        const active = Object.keys(subs).filter((k) => subs[k]);
        active.forEach((k, i) => ctx.after(() => log.appendChild(h("div", { class: "good" }, `  → ${k} handler ran`)), 200 * (i + 1)));
        draw(true); ctx.after(() => draw(false), 700);
        cap.textContent = `Orders only knows how to emit an event. It notified ${active.length} subscriber${active.length === 1 ? "" : "s"} without importing any of them. That's loose coupling: the same idea as DOM events, Node's EventEmitter and message queues.`;
      }
      root.append(host, row(button("Publish OrderPlaced", publish, { lit: true })), log, cap);
      draw();
    },
  });
})();
