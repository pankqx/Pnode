/* Pnode Mirror: a 2-minute daily check-in and a weekly review written by the local Ollama model.
   Everything stays in this browser (localStorage "pnode:mirror"). It also reads MindMirror's check-ins
   (IndexedDB "mindmirror", same origin on GitHub Pages) without ever writing to them.
   Exposes window.PnodeMirror = { mount(root, ctx), todayCard(), summary(weekStart) }. */
(function () {
  const KEY = "pnode:mirror";
  const MINDMIRROR_URL = "https://pankqx.github.io/MindMirror/";
  const esc = (s) => String(s == null ? "" : s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

  const MOVE = [["none", "None"], ["walk", "Walk"], ["gym", "Gym"], ["sport", "Sport"]];
  const SPEND_CATS = ["food", "travel", "fun", "study", "bills", "other"];
  const TRIGGERS = [["", "No trigger"], ["bored", "Bored"], ["stressed", "Stressed"], ["lonely", "Lonely"], ["tired", "Tired"], ["phone", "Late-night phone"], ["other", "Other"]];
  const PEOPLE_KIND = ["friend", "family", "colleague", "other"];

  // ---------- storage ----------
  function load() {
    try {
      const s = JSON.parse(localStorage.getItem(KEY) || "{}");
      return { days: s.days || {}, reviews: s.reviews || {}, settings: Object.assign({ includeJournal: true }, s.settings || {}) };
    } catch (e) { return { days: {}, reviews: {}, settings: { includeJournal: true } }; }
  }
  function save(s) { try { localStorage.setItem(KEY, JSON.stringify(s)); } catch (e) { /* storage unavailable */ } }
  function pnodeState() { try { return JSON.parse(localStorage.getItem("pnode:v1") || "{}"); } catch (e) { return {}; } }

  // ---------- dates ----------
  const iso = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  const parse = (s) => { const [y, m, d] = s.split("-").map(Number); return new Date(y, m - 1, d); };
  const addDays = (s, n) => { const d = parse(s); d.setDate(d.getDate() + n); return iso(d); };
  const todayIso = () => iso(new Date());
  function weekStart(s) { const d = parse(s); const wd = (d.getDay() + 6) % 7; d.setDate(d.getDate() - wd); return iso(d); } // Monday
  const weekDays = (start) => Array.from({ length: 7 }, (_, i) => addDays(start, i));
  const pretty = (s) => parse(s).toLocaleDateString(undefined, { weekday: "short", day: "numeric", month: "short" });

  function blankEntry() {
    return { sleep: null, mood: null, stress: null, energy: null, move: "", food: null, social: null, spend: [], people: [], learned: "", habit: 0, trigger: "", win: "", change: "", journal: "" };
  }
  function isFilled(e) { return !!e && (e.mood != null || e.sleep != null || e.stress != null || (e.journal || "").trim()); }

  // ---------- MindMirror (read-only) ----------
  let mmCache = null;
  async function readMindMirror() {
    if (mmCache) return mmCache;
    mmCache = [];
    try {
      if (!window.indexedDB || !indexedDB.databases) return mmCache;
      const list = await indexedDB.databases();
      if (!list.some((d) => d.name === "mindmirror")) return mmCache; // never create it
      mmCache = await new Promise((resolve) => {
        const req = indexedDB.open("mindmirror");
        req.onerror = () => resolve([]);
        req.onsuccess = () => {
          const db = req.result;
          if (!db.objectStoreNames.contains("checkins")) { db.close(); resolve([]); return; }
          const all = db.transaction("checkins", "readonly").objectStore("checkins").getAll();
          all.onsuccess = () => { db.close(); resolve(all.result || []); };
          all.onerror = () => { db.close(); resolve([]); };
        };
      });
    } catch (e) { mmCache = []; }
    return mmCache;
  }

  // ---------- weekly summary ----------
  const avg = (xs) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : null);
  const r1 = (x) => (x == null ? null : Math.round(x * 10) / 10);

  function summary(start, mm) {
    const s = load(), st = pnodeState(), days = weekDays(start);
    const mmByDate = {};
    (mm || []).forEach((c) => { if (c && c.date) mmByDate[c.date] = c; });
    const rows = days.map((d) => {
      const e = s.days[d];
      const m = mmByDate[d];
      const row = Object.assign(blankEntry(), e || {});
      row.date = d; row.fromMM = false;
      if (m) { // fill gaps from MindMirror; Pnode's own entry wins
        if (row.mood == null && m.mood != null) { row.mood = m.mood; row.fromMM = true; }
        if (row.stress == null && m.stress != null) { row.stress = m.stress; row.fromMM = true; }
        if (row.energy == null && m.energy != null) { row.energy = m.energy; row.fromMM = true; }
        if (row.sleep == null && m.sleepHours != null) { row.sleep = m.sleepHours; row.fromMM = true; }
        if (m.note) row.mmNote = m.note;
      }
      row.filled = isFilled(row);
      row.xp = (st.log && st.log[d]) || 0;
      row.lessons = Object.values(st.read || {}).filter((x) => x === d).length;
      row.nodes = Object.values(st.done || {}).filter((x) => x === d).length;
      row.problems = Object.values(st.solved || {}).filter((x) => x && x.at === d).length;
      row.pronto = (st.pronto && st.pronto[d]) || 0;
      return row;
    });
    const f = rows.filter((r) => r.filled);
    const num = (k) => f.map((r) => r[k]).filter((v) => v != null && v !== "");
    const out = {
      start, end: days[6], rows,
      checkins: f.length,
      sleep: r1(avg(num("sleep"))), mood: r1(avg(num("mood"))), stress: r1(avg(num("stress"))), energy: r1(avg(num("energy"))), food: r1(avg(num("food"))),
      social: r1(avg(num("social"))),
      gymDays: rows.filter((r) => r.move === "gym" || r.move === "sport").length,
      moveDays: rows.filter((r) => r.move && r.move !== "none").length,
      spend: 0, spendBy: {}, people: {}, learned: [], habit: 0, habitDays: 0, triggers: {},
      xp: rows.reduce((a, r) => a + r.xp, 0), lessons: rows.reduce((a, r) => a + r.lessons, 0), nodes: rows.reduce((a, r) => a + r.nodes, 0),
      problems: rows.reduce((a, r) => a + r.problems, 0), pronto: rows.reduce((a, r) => a + r.pronto, 0),
      studyDays: rows.filter((r) => r.xp > 0).length,
    };
    rows.forEach((r) => {
      (r.spend || []).forEach((x) => { const a = Number(x.amt) || 0; out.spend += a; out.spendBy[x.cat || "other"] = (out.spendBy[x.cat || "other"] || 0) + a; });
      (r.people || []).forEach((p) => {
        const k = (p.who || "").trim(); if (!k) return;
        const o = out.people[k] || (out.people[k] = { times: 0, sum: 0, kind: p.kind || "friend" });
        o.times++; o.sum += Number(p.after) || 0;
      });
      if ((r.learned || "").trim()) out.learned.push(r.learned.trim());
      const h = Number(r.habit) || 0;
      if (h > 0) { out.habit += h; out.habitDays++; if (r.trigger) out.triggers[r.trigger] = (out.triggers[r.trigger] || 0) + 1; }
    });
    out.insights = insights(out);
    return out;
  }

  function compare(rows, pick, key) {
    const a = rows.filter((r) => r.filled && pick(r)).map((r) => r[key]).filter((v) => v != null);
    const b = rows.filter((r) => r.filled && !pick(r)).map((r) => r[key]).filter((v) => v != null);
    if (a.length < 2 || b.length < 2) return null;
    return { a: r1(avg(a)), b: r1(avg(b)), na: a.length, nb: b.length };
  }

  function insights(w) {
    const out = [], R = w.rows;
    if (w.checkins < 3) out.push(`Only ${w.checkins} check-in${w.checkins === 1 ? "" : "s"} this week. Patterns need at least 4–5 days, so aim for one 2-minute check-in every night.`);
    const lowSleep = compare(R, (r) => r.sleep != null && r.sleep < 6.5, "mood");
    if (lowSleep && lowSleep.a < lowSleep.b) out.push(`On nights under 6.5 hours of sleep your mood averaged ${lowSleep.a}/5, against ${lowSleep.b}/5 after better nights.`);
    const gym = compare(R, (r) => r.move === "gym" || r.move === "sport", "mood");
    if (gym && gym.a !== gym.b) out.push(`Mood on workout days: ${gym.a}/5. On other days: ${gym.b}/5.`);
    const hs = compare(R, (r) => (Number(r.habit) || 0) > 0, "stress");
    if (hs && hs.a > hs.b) out.push(`The private habit showed up more on higher-stress days (stress ${hs.a}/5 vs ${hs.b}/5). Stress is the lever, not willpower.`);
    const top = Object.entries(w.triggers).sort((a, b) => b[1] - a[1])[0];
    if (top && top[1] >= 2) out.push(`Most common trigger for the private habit: ${(TRIGGERS.find((t) => t[0] === top[0]) || [, top[0]])[1].toLowerCase()} (${top[1]} times). Plan one thing to do instead when you notice it.`);
    const soc = compare(R, (r) => r.social != null && r.social > 60, "mood");
    if (soc && soc.a < soc.b) out.push(`On days with over an hour of social media, mood averaged ${soc.a}/5 vs ${soc.b}/5.`);
    const drained = Object.entries(w.people).filter(([, p]) => p.sum < 0).map(([k]) => k);
    const lifted = Object.entries(w.people).filter(([, p]) => p.sum > 0).map(([k]) => k);
    if (lifted.length) out.push(`You came away with more energy after time with ${lifted.slice(0, 4).join(", ")}.`);
    if (drained.length) out.push(`You felt drained after time with ${drained.slice(0, 4).join(", ")}. One week isn't a verdict; notice whether it repeats.`);
    if (w.studyDays && w.studyDays < 5) out.push(`You studied in Pnode on ${w.studyDays} of 7 days. The plan needs 6.`);
    const cat = Object.entries(w.spendBy).sort((a, b) => b[1] - a[1])[0];
    if (cat && w.spend > 0) out.push(`You spent ₹${Math.round(w.spend).toLocaleString("en-IN")} this week; the biggest share went to ${cat[0]} (₹${Math.round(cat[1]).toLocaleString("en-IN")}).`);
    return out;
  }

  // ---------- review prompt ----------
  const SYSTEM = `You are Pank's weekly review coach. Pank is an MCA student in India preparing for AI full-stack and DevOps jobs by May 2027. He works 9 am to 1 pm, studies in Pnode from 3 to 11 pm, goes to the gym and sees a therapist. He wants honest, specific feedback, like a good mentor who is on his side.
Use ONLY the data given. Never invent numbers. If data is missing, say so in one line.
Write in simple English, with these headings:
1. The week in one line
2. What went well (3 bullets, with numbers)
3. What didn't go well (2–3 bullets, honest, never shaming)
4. Patterns I notice (connect sleep, stress, food, movement, spending, people, the private habit and studying)
5. Next week: exactly 3 small, concrete actions
6. One thing to stop
Rules: treat the private habit neutrally, as data about triggers, never as a moral failure. Don't label anyone a good or bad friend; describe how Pank felt after spending time with them. Don't diagnose anything. If mood is very low or stress very high on several days, suggest he brings it up with his therapist. If anything suggests he might be in danger, tell him clearly to contact his therapist or a crisis helpline today. Keep it under 350 words.`;

  function dataText(w, includeJournal) {
    const L = [];
    L.push(`Week: ${w.start} to ${w.end}. Check-ins: ${w.checkins}/7.`);
    L.push(`Averages (1–5 scales): mood ${w.mood ?? "?"}, stress ${w.stress ?? "?"}, energy ${w.energy ?? "?"}, food quality ${w.food ?? "?"}. Sleep ${w.sleep ?? "?"} h/night. Social media ${w.social ?? "?"} min/day.`);
    L.push(`Movement: ${w.moveDays} active days, ${w.gymDays} gym/sport days.`);
    L.push(`Studying (Pnode): ${w.studyDays}/7 days, ${w.xp} XP, ${w.nodes} build nodes, ${w.lessons} lessons, ${w.problems} coding problems, ${w.pronto} ProntoPy problems.`);
    L.push(`Spending: ₹${Math.round(w.spend)} total; ${Object.entries(w.spendBy).map(([k, v]) => `${k} ₹${Math.round(v)}`).join(", ") || "none logged"}.`);
    const ppl = Object.entries(w.people).map(([k, p]) => `${k} (${p.kind}, ${p.times}×, felt ${p.sum > 0 ? "better" : p.sum < 0 ? "drained" : "neutral"} after)`);
    L.push(`People: ${ppl.join("; ") || "none logged"}.`);
    L.push(`Private habit: ${w.habit} times on ${w.habitDays} days; triggers: ${Object.entries(w.triggers).map(([k, v]) => `${k} ${v}`).join(", ") || "none logged"}.`);
    L.push(`Learned: ${w.learned.join(" | ") || "nothing logged"}.`);
    L.push("", "Day by day:");
    w.rows.forEach((r) => {
      if (!r.filled && !r.xp) { L.push(`${r.date}: no check-in.`); return; }
      const bits = [`mood ${r.mood ?? "?"}`, `stress ${r.stress ?? "?"}`, `energy ${r.energy ?? "?"}`, `sleep ${r.sleep ?? "?"}h`, `move ${r.move || "?"}`, `food ${r.food ?? "?"}`, `xp ${r.xp}`];
      if ((Number(r.habit) || 0) > 0) bits.push(`habit ${r.habit}${r.trigger ? " (" + r.trigger + ")" : ""}`);
      let line = `${r.date}: ${bits.join(", ")}.`;
      if (r.win) line += ` Win: ${r.win}.`;
      if (r.change) line += ` Would change: ${r.change}.`;
      if (includeJournal && (r.journal || "").trim()) line += ` Journal: ${r.journal.trim().slice(0, 600)}`;
      if (includeJournal && r.mmNote) line += ` MindMirror note: ${String(r.mmNote).slice(0, 300)}`;
      L.push(line);
    });
    if (w.insights.length) { L.push("", "Patterns the app already found:"); w.insights.forEach((i) => L.push("- " + i)); }
    return L.join("\n");
  }

  // ---------- Today card ----------
  function todayCard() {
    const s = load(), t = todayIso(), e = s.days[t];
    const wk = weekStart(t), sunday = new Date().getDay() === 0, hasReview = !!s.reviews[wk];
    const done = isFilled(e);
    return `<section class="panel mm-today" aria-labelledby="mm-today-title">
      <div class="phase-tag">Mirror · daily check-in</div>
      <h2 id="mm-today-title" style="margin:6px 0 6px;font-size:1.3rem">${done ? "Checked in today ✓" : "How was today?"}</h2>
      <p class="muted" style="margin:0 0 12px">${done ? `Mood ${e.mood ?? "–"}/5 · stress ${e.stress ?? "–"}/5 · sleep ${e.sleep ?? "–"} h` : "Two minutes: sleep, mood, food, people, money, what you learned."}</p>
      <div class="btn-row">
        <a class="btn ${done ? "" : "btn-lit"}" href="#/mirror">${done ? "Edit check-in" : "Check in"}</a>
        ${sunday && !hasReview ? `<a class="btn btn-lit" href="#/mirror/week">Weekly review is ready</a>` : `<a class="btn btn-quiet" href="#/mirror/week">This week</a>`}
      </div>
    </section>`;
  }

  // ---------- UI ----------
  function scale(name, val, labels) {
    return `<div class="mm-scale" role="group" aria-label="${esc(name)}">${[1, 2, 3, 4, 5].map((n) => `<button type="button" data-k="${name}" data-v="${n}" aria-pressed="${val === n}" title="${esc(labels ? labels[n - 1] : n)}">${n}</button>`).join("")}</div>`;
  }

  function mount(root, ctx) {
    const s = load();
    let tab = ctx.tab === "week" ? "week" : ctx.tab === "data" ? "data" : "day";
    let day = todayIso();
    let wk = weekStart(day);
    let controller = null;

    function entry() { return Object.assign(blankEntry(), s.days[day] || {}); }
    function put(e) { s.days[day] = e; save(s); }

    function shell(inner) {
      root.innerHTML = `
        <div class="page-head">
          <h1>Mirror</h1>
          <p>A 2-minute check-in each night and an honest weekly review written by your own Ollama model. Everything stays on this device.</p>
        </div>
        <div class="filter" role="group" aria-label="Mirror view">
          <button type="button" data-tab="day" aria-pressed="${tab === "day"}">Check-in</button>
          <button type="button" data-tab="week" aria-pressed="${tab === "week"}">Weekly review</button>
          <button type="button" data-tab="data" aria-pressed="${tab === "data"}">MindMirror &amp; data</button>
        </div>
        <div id="mm-body">${inner}</div>`;
    }

    // ----- day -----
    function viewDay() {
      const e = entry();
      const isToday = day === todayIso();
      shell(`
        <div class="mm-daynav">
          <button class="btn btn-quiet" type="button" data-act="prev" aria-label="Previous day">‹</button>
          <b>${isToday ? "Today" : esc(pretty(day))}</b>
          <button class="btn btn-quiet" type="button" data-act="next" aria-label="Next day" ${isToday ? "disabled" : ""}>›</button>
        </div>
        <div class="mm-grid">
          <section class="panel">
            <h3>Body</h3>
            <label class="mm-row"><span>Sleep (hours)</span><input type="number" inputmode="decimal" min="0" max="14" step="0.5" data-f="sleep" value="${e.sleep ?? ""}" placeholder="7"></label>
            <div class="mm-row"><span>Movement</span><div class="mm-scale" role="group" aria-label="Movement">${MOVE.map(([v, l]) => `<button type="button" data-k="move" data-v="${v}" aria-pressed="${e.move === v}">${l}</button>`).join("")}</div></div>
            <div class="mm-row"><span>Ate well <small class="muted">1 junk · 5 clean</small></span>${scale("food", e.food)}</div>
          </section>
          <section class="panel">
            <h3>Mind</h3>
            <div class="mm-row"><span>Mood <small class="muted">1 low · 5 great</small></span>${scale("mood", e.mood)}</div>
            <div class="mm-row"><span>Stress <small class="muted">1 calm · 5 maxed</small></span>${scale("stress", e.stress)}</div>
            <div class="mm-row"><span>Energy</span>${scale("energy", e.energy)}</div>
            <label class="mm-row"><span>Social media (minutes)</span><input type="number" inputmode="numeric" min="0" max="1440" step="5" data-f="social" value="${e.social ?? ""}" placeholder="15"></label>
          </section>
          <section class="panel">
            <h3>People</h3>
            <div id="mm-people">${(e.people || []).map((p, i) => `
              <div class="mm-line"><span><b>${esc(p.who)}</b> <small class="muted">${esc(p.kind)}</small></span>
                <span class="muted small">felt ${p.after > 0 ? "better" : p.after < 0 ? "drained" : "the same"} after</span>
                <button class="btn btn-quiet" type="button" data-act="del-person" data-i="${i}" aria-label="Remove">✕</button></div>`).join("") || `<p class="muted small" style="margin:0 0 8px">Nobody logged yet.</p>`}</div>
            <div class="mm-add">
              <input type="text" id="mm-who" placeholder="Who did you spend time with?" maxlength="40">
              <select id="mm-kind">${PEOPLE_KIND.map((k) => `<option>${k}</option>`).join("")}</select>
              <select id="mm-after"><option value="1">Felt better after</option><option value="0" selected>Felt the same</option><option value="-1">Felt drained after</option></select>
              <button class="btn" type="button" data-act="add-person">Add</button>
            </div>
          </section>
          <section class="panel">
            <h3>Money</h3>
            <div id="mm-spend">${(e.spend || []).map((x, i) => `
              <div class="mm-line"><span><b>₹${esc(x.amt)}</b> <small class="muted">${esc(x.cat)}</small></span><span class="muted small">${esc(x.note || "")}</span>
                <button class="btn btn-quiet" type="button" data-act="del-spend" data-i="${i}" aria-label="Remove">✕</button></div>`).join("") || `<p class="muted small" style="margin:0 0 8px">Nothing spent yet.</p>`}</div>
            <div class="mm-add">
              <input type="number" inputmode="numeric" id="mm-amt" placeholder="₹" min="0" style="max-width:90px">
              <select id="mm-cat">${SPEND_CATS.map((k) => `<option>${k}</option>`).join("")}</select>
              <input type="text" id="mm-note" placeholder="What for?" maxlength="40">
              <button class="btn" type="button" data-act="add-spend">Add</button>
            </div>
          </section>
          <section class="panel">
            <h3>Growth</h3>
            <label class="mm-row mm-col"><span>One thing I learned</span><input type="text" data-f="learned" value="${esc(e.learned)}" placeholder="e.g. how HNSW indexes work" maxlength="160"></label>
            <label class="mm-row mm-col"><span>Today's win</span><input type="text" data-f="win" value="${esc(e.win)}" placeholder="Something you're proud of, however small" maxlength="160"></label>
            <label class="mm-row mm-col"><span>I'd do differently</span><input type="text" data-f="change" value="${esc(e.change)}" placeholder="One thing, no beating yourself up" maxlength="160"></label>
          </section>
          <section class="panel">
            <h3>Private habit <small class="muted" style="font-weight:400">just data, no streaks, no judgement</small></h3>
            <div class="mm-row"><span>Times today</span><div class="mm-scale" role="group" aria-label="Times">${[0, 1, 2, 3].map((n) => `<button type="button" data-k="habit" data-v="${n}" aria-pressed="${(Number(e.habit) || 0) === n}">${n === 3 ? "3+" : n}</button>`).join("")}</div></div>
            <label class="mm-row"><span>What was going on?</span><select data-f="trigger">${TRIGGERS.map(([v, l]) => `<option value="${v}" ${e.trigger === v ? "selected" : ""}>${l}</option>`).join("")}</select></label>
            <p class="muted small" style="margin:8px 0 0">The point is to spot triggers (stress, boredom, late-night phone), not to count failures.</p>
          </section>
        </div>
        <section class="panel" style="margin-top:16px">
          <h3>Journal</h3>
          <label for="mm-journal" class="visually-hidden">Journal</label>
          <textarea id="mm-journal" data-f="journal" placeholder="Whatever's on your mind. Only you and your local model read this.">${esc(e.journal)}</textarea>
          <p class="muted small" style="margin:8px 0 0" id="mm-saved">Saves automatically.</p>
        </section>`);
    }

    // ----- week -----
    async function viewWeek() {
      shell(`<p class="muted">Loading your week…</p>`);
      const mm = await readMindMirror();
      if (tab !== "week") return;
      const w = summary(wk, mm);
      const thisWeek = wk === weekStart(todayIso());
      const rev = s.reviews[wk];
      const bars = (k, max, cls) => `<div class="mm-bars" aria-hidden="true">${w.rows.map((r) => `<i class="${cls}" style="height:${r[k] == null ? 2 : Math.max(6, (r[k] / max) * 100)}%" title="${esc(pretty(r.date))}: ${r[k] ?? "–"}"></i>`).join("")}</div>`;
      const tile = (label, val, sub, barHtml) => `<div class="mm-tile"><span class="muted small">${label}</span><b>${val ?? "–"}</b>${sub ? `<span class="muted small">${sub}</span>` : ""}${barHtml || ""}</div>`;
      shell(`
        <div class="mm-daynav">
          <button class="btn btn-quiet" type="button" data-act="wprev" aria-label="Previous week">‹</button>
          <b>${esc(pretty(w.start))} – ${esc(pretty(w.end))}</b>
          <button class="btn btn-quiet" type="button" data-act="wnext" aria-label="Next week" ${thisWeek ? "disabled" : ""}>›</button>
        </div>
        <div class="mm-tiles">
          ${tile("Check-ins", `${w.checkins}/7`, mm.length ? "includes MindMirror" : "")}
          ${tile("Mood", w.mood, "out of 5", bars("mood", 5, ""))}
          ${tile("Stress", w.stress, "out of 5", bars("stress", 5, "warm"))}
          ${tile("Sleep", w.sleep, "hours a night", bars("sleep", 10, "cool"))}
          ${tile("Workouts", w.gymDays, `${w.moveDays} active days`)}
          ${tile("Studied", `${w.studyDays}/7`, `${w.xp} XP · ${w.lessons} lessons`, bars("xp", Math.max(1, ...w.rows.map((r) => r.xp)), ""))}
          ${tile("Problems", w.problems + w.pronto, `${w.pronto} in ProntoPy`)}
          ${tile("Spent", "₹" + Math.round(w.spend).toLocaleString("en-IN"), Object.keys(w.spendBy).length ? Object.entries(w.spendBy).sort((a, b) => b[1] - a[1]).slice(0, 2).map(([k]) => k).join(", ") : "nothing logged")}
        </div>
        <section class="panel" style="margin-top:16px">
          <h3>Patterns</h3>
          ${w.insights.length ? `<ul class="mm-insights">${w.insights.map((i) => `<li>${esc(i)}</li>`).join("")}</ul>` : `<p class="muted">Check in a few more days and patterns will show up here.</p>`}
          ${Object.keys(w.people).length ? `<h4 style="margin:16px 0 8px">People this week</h4><ul class="chips">${Object.entries(w.people).map(([k, p]) => `<li>${esc(k)} · ${p.times}× · ${p.sum > 0 ? "lifted you" : p.sum < 0 ? "drained you" : "neutral"}</li>`).join("")}</ul>` : ""}
          ${w.learned.length ? `<h4 style="margin:16px 0 8px">What you learned</h4><ul>${w.learned.map((x) => `<li>${esc(x)}</li>`).join("")}</ul>` : ""}
        </section>
        <section class="panel mm-review" style="margin-top:16px">
          <div class="mm-review-head">
            <h3 style="margin:0">Weekly review by your local model</h3>
            <label class="small muted mm-toggle"><input type="checkbox" id="mm-incl" ${s.settings.includeJournal ? "checked" : ""}> Include journal text</label>
          </div>
          <div class="btn-row" style="margin:12px 0">
            <button class="btn btn-lit" type="button" data-act="review">${rev ? "Write it again" : "Write my weekly review"}</button>
            <button class="btn" type="button" data-act="copy">Copy for Claude / ChatGPT</button>
            <button class="btn btn-quiet" type="button" data-act="stop" hidden>Stop</button>
          </div>
          <p class="muted small" id="mm-status">${rev ? `Written ${esc(new Date(rev.at).toLocaleString())}${rev.model ? " by " + esc(rev.model) : ""}.` : "Runs on Ollama on this laptop, using the model you picked in Tutor. Nothing is uploaded."}</p>
          <div class="mm-review-text" id="mm-review">${rev ? md(rev.text) : ""}</div>
          <textarea id="mm-copybox" hidden readonly style="min-height:160px;font-family:var(--f-code);font-size:.8rem"></textarea>
        </section>`);
      root._week = w;
    }

    function md(t) { return window.PnodeTutor && PnodeTutor.md ? PnodeTutor.md(t) : `<p>${esc(t).replace(/\n/g, "<br>")}</p>`; }

    async function writeReview() {
      const w = root._week; if (!w || controller) return;
      const out = root.querySelector("#mm-review"), status = root.querySelector("#mm-status");
      let tutor = {};
      try { tutor = JSON.parse(localStorage.getItem("pnode:tutor") || "{}"); } catch (e) { /* ignore */ }
      const endpoint = (tutor.endpoint || "http://localhost:11434").replace(/\/$/, "");
      let model = tutor.model;
      status.textContent = "Connecting to Ollama…";
      try {
        const tags = await fetch(endpoint + "/api/tags").then((r) => r.json());
        const names = (tags.models || []).map((m) => m.name);
        if (!names.length) throw new Error("no models downloaded");
        if (!names.includes(model)) model = names.find((n) => /qwen|llama|mistral|gemma/i.test(n) && !/coder/i.test(n)) || names[0];
      } catch (e) {
        status.innerHTML = `Couldn't reach Ollama (${esc(e.message)}). Start it on your laptop and allow this site (see <a href="#/tutor">Tutor</a> for the 2-step setup), or use “Copy for Claude / ChatGPT”.`;
        return;
      }
      controller = new AbortController();
      root.querySelector('[data-act="stop"]').hidden = false;
      status.textContent = `Writing with ${model}… (a 7B model on your laptop takes a minute or two)`;
      let text = "", last = 0;
      try {
        const r = await fetch(endpoint + "/api/chat", {
          method: "POST", signal: controller.signal, headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ model, stream: true, options: { num_ctx: 8192, temperature: 0.4 }, messages: [{ role: "system", content: SYSTEM }, { role: "user", content: dataText(w, s.settings.includeJournal) }] }),
        });
        if (!r.ok || !r.body) throw new Error("Ollama returned " + r.status);
        const reader = r.body.getReader(), dec = new TextDecoder();
        let buf = "";
        for (;;) {
          const { done, value } = await reader.read();
          if (done) break;
          buf += dec.decode(value, { stream: true });
          const lines = buf.split("\n"); buf = lines.pop();
          for (const line of lines) { if (!line.trim()) continue; const j = JSON.parse(line); if (j.error) throw new Error(j.error); if (j.message && j.message.content) text += j.message.content; }
          if (Date.now() - last > 80) { out.innerHTML = md(text); last = Date.now(); }
        }
        out.innerHTML = md(text);
        s.reviews[w.start] = { at: new Date().toISOString(), text, model };
        save(s);
        status.textContent = `Written just now by ${model}. Saved on this device.`;
        if (ctx.toast) ctx.toast("Weekly review saved");
      } catch (e) {
        status.textContent = e.name === "AbortError" ? "Stopped." : `Couldn't finish: ${e.message}`;
      }
      controller = null;
      const stop = root.querySelector('[data-act="stop"]'); if (stop) stop.hidden = true;
    }

    async function copyPrompt() {
      const w = root._week; if (!w) return;
      const text = SYSTEM + "\n\n---\n\n" + dataText(w, s.settings.includeJournal);
      const box = root.querySelector("#mm-copybox");
      try { await navigator.clipboard.writeText(text); ctx.toast && ctx.toast(s.settings.includeJournal ? "Copied (includes your journal text)" : "Copied without journal text"); }
      catch (e) { box.hidden = false; box.value = text; box.focus(); box.select(); ctx.toast && ctx.toast("Select all and copy the text below"); }
    }

    // ----- data -----
    async function viewData() {
      shell(`<p class="muted">Looking for MindMirror…</p>`);
      const mm = await readMindMirror();
      if (tab !== "data") return;
      const n = Object.keys(s.days).length;
      shell(`
        <section class="panel">
          <h3>MindMirror</h3>
          <p>MindMirror stays its own app. Use it for voice check-ins, the companion and breathing. Its mood, stress, energy and sleep check-ins flow into your Pnode weekly review automatically (read-only; Pnode never changes MindMirror's data).</p>
          <p class="muted small">${mm.length ? `Found ${mm.length} MindMirror check-in${mm.length === 1 ? "" : "s"} in this browser.` : "No MindMirror check-ins found in this browser yet. They show up here once you check in on MindMirror's site in this same browser."}</p>
          <div class="btn-row"><a class="btn btn-lit" href="${MINDMIRROR_URL}" target="_blank" rel="noopener">Open MindMirror</a></div>
        </section>
        <section class="panel" style="margin-top:16px">
          <h3>Your Mirror data</h3>
          <p class="muted">${n} day${n === 1 ? "" : "s"} of check-ins and ${Object.keys(s.reviews).length} weekly review${Object.keys(s.reviews).length === 1 ? "" : "s"} on this device. It isn't included in the Pnode backup on the Me page, so back it up here.</p>
          <div class="btn-row"><button class="btn" type="button" data-act="export-mm">Copy Mirror backup</button><button class="btn" type="button" data-act="import-mm">Restore from text</button></div>
          <label for="mm-io" class="visually-hidden">Mirror backup text</label>
          <textarea id="mm-io" style="margin-top:12px;min-height:90px;font-family:var(--f-code);font-size:.8rem" placeholder="Paste a Mirror backup here, then press Restore"></textarea>
        </section>
        <section class="panel" style="margin-top:16px">
          <h3>Privacy</h3>
          <ul>
            <li>Check-ins live only in this browser's storage. Nothing is sent anywhere unless you press "Copy" and paste it yourself.</li>
            <li>The weekly review talks to Ollama on <code>localhost</code>, so it never leaves your laptop.</li>
            <li>On your phone the review can't reach your laptop's Ollama. Check in on the phone, then write the review on the laptop, or copy it to Claude.</li>
            <li>Phone and laptop keep separate data. Move it with the backup above.</li>
          </ul>
        </section>`);
    }

    function render() { if (tab === "week") viewWeek(); else if (tab === "data") viewData(); else viewDay(); }

    // ----- events -----
    function onClick(ev) {
      const b = ev.target.closest("button"); if (!b) return;
      if (b.dataset.tab) { tab = b.dataset.tab; history.replaceState(null, "", tab === "day" ? "#/mirror" : "#/mirror/" + tab); render(); return; }
      if (b.dataset.k) {
        const e = entry(), k = b.dataset.k;
        let v = b.dataset.v; if (k !== "move") v = Number(v);
        e[k] = e[k] === v && k !== "habit" ? null : v;
        put(e);
        b.parentElement.querySelectorAll("button").forEach((x) => x.setAttribute("aria-pressed", String(x === b && e[k] != null)));
        flash();
        return;
      }
      const act = b.dataset.act;
      if (act === "prev") { day = addDays(day, -1); render(); }
      else if (act === "next") { if (day < todayIso()) { day = addDays(day, 1); render(); } }
      else if (act === "wprev") { wk = addDays(wk, -7); render(); }
      else if (act === "wnext") { if (wk < weekStart(todayIso())) { wk = addDays(wk, 7); render(); } }
      else if (act === "add-person") {
        const who = root.querySelector("#mm-who").value.trim(); if (!who) return;
        const e = entry(); e.people = (e.people || []).concat([{ who, kind: root.querySelector("#mm-kind").value, after: Number(root.querySelector("#mm-after").value) }]); put(e); render();
      } else if (act === "del-person") { const e = entry(); e.people.splice(Number(b.dataset.i), 1); put(e); render(); }
      else if (act === "add-spend") {
        const amt = Number(root.querySelector("#mm-amt").value); if (!(amt > 0)) return;
        const e = entry(); e.spend = (e.spend || []).concat([{ amt, cat: root.querySelector("#mm-cat").value, note: root.querySelector("#mm-note").value.trim() }]); put(e); render();
      } else if (act === "del-spend") { const e = entry(); e.spend.splice(Number(b.dataset.i), 1); put(e); render(); }
      else if (act === "review") writeReview();
      else if (act === "stop") { if (controller) controller.abort(); }
      else if (act === "copy") copyPrompt();
      else if (act === "export-mm") {
        const box = root.querySelector("#mm-io"); box.value = JSON.stringify(load()); box.select();
        navigator.clipboard && navigator.clipboard.writeText(box.value).then(() => ctx.toast && ctx.toast("Mirror backup copied"), () => {});
      } else if (act === "import-mm") {
        try {
          const d = JSON.parse(root.querySelector("#mm-io").value);
          if (!d || typeof d.days !== "object") throw new Error("not a Mirror backup");
          s.days = Object.assign(s.days, d.days); s.reviews = Object.assign(s.reviews, d.reviews || {}); save(s);
          ctx.toast && ctx.toast("Mirror data restored"); render();
        } catch (e) { ctx.toast && ctx.toast("That doesn't look like a Mirror backup"); }
      }
    }
    let flashT = 0;
    function flash() { const el = root.querySelector("#mm-saved"); if (!el) return; el.textContent = "Saved ✓"; clearTimeout(flashT); flashT = setTimeout(() => { el.textContent = "Saves automatically."; }, 1200); }
    function onInput(ev) {
      const el = ev.target;
      if (el.id === "mm-incl") { s.settings.includeJournal = el.checked; save(s); return; }
      const f = el.dataset && el.dataset.f; if (!f) return;
      const e = entry();
      e[f] = el.type === "number" ? (el.value === "" ? null : Number(el.value)) : el.value;
      put(e); flash();
    }
    root.addEventListener("click", onClick);
    root.addEventListener("input", onInput);
    root.addEventListener("change", onInput);
    render();
    return () => { if (controller) controller.abort(); root.removeEventListener("click", onClick); root.removeEventListener("input", onInput); root.removeEventListener("change", onInput); };
  }

  window.PnodeMirror = { mount, todayCard, summary, dataText, SYSTEM };
})();
