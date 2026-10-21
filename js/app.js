/* Pnode — app shell, router and views. Plain JS, no build step. */
(function () {
  const S = window.PnodeStore;
  const D = window.PNODE;
  const VIZ = window.PNODE_VIZ || { list: [], byId: {}, byNode: {}, mount() {} };
  const $main = document.getElementById("main");
  const $hud = document.getElementById("hud");
  const $toast = document.getElementById("toast");
  const $session = document.getElementById("session-bar");

  // ---------- path data ----------
  const TRACKS = [
    { id: "build", name: "Build path", short: "Build", note: "Your main path, in order: web basics to senior engineering. Each node ends with something you build yourself." },
    { id: "core", name: "Core CS", short: "Core CS", note: "Interview-focused computer science: OOP, OS, concurrency, memory, networks, DBMS and design patterns, each with a build. The Library goes deeper on all of these." },
  ];
  const TRACK_ORDER = { build: 0, core: 1 };
  D.phases = D.phases.filter((p) => (p.track || "build") in TRACK_ORDER);
  D.phases.forEach((p) => { p.track = p.track || "build"; p.code = p.code != null ? String(p.code) : String(p.n); });
  D.phases.sort((a, b) => TRACK_ORDER[a.track] - TRACK_ORDER[b.track] || a.n - b.n);
  const LESSONS = [];
  D.phases.forEach((p) => p.lessons.forEach((l) => { l.phase = p; LESSONS.push(l); }));
  const byId = Object.fromEntries(LESSONS.map((l) => [l.id, l]));
  const drillById = Object.fromEntries(D.mind.map((d) => [d.id, d]));
  const capById = Object.fromEntries(D.capstones.map((c) => [c.id, c]));
  const SIMPLE = D.simple || {};
  const trackLessons = (t) => LESSONS.filter((l) => l.phase.track === t);

  // ---------- library data ----------
  const GROUPS = ["Computer science", "Engineering and AI", "Life skills", "World and money"];
  const AREAS = (D.library || []).slice().sort((a, b) => GROUPS.indexOf(a.group) - GROUPS.indexOf(b.group) || (a.order || 0) - (b.order || 0));
  const LIB = [];
  AREAS.forEach((a) => a.modules.forEach((m) => m.lessons.forEach((l) => { l.area = a; l.module = m; LIB.push(l); })));
  const libById = Object.fromEntries(LIB.map((l) => [l.id, l]));
  const areaById = Object.fromEntries(AREAS.map((a) => [a.id, a]));
  const areaLessons = (a) => a.modules.flatMap((m) => m.lessons);

  const esc = (s) => String(s == null ? "" : s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const strip = (html) => String(html || "").replace(/<[^>]+>/g, "");
  const nextLesson = (track) => trackLessons(track || "build").find((l) => !S.get().done[l.id]) || null;
  const lessonXp = (l) => S.XP.lesson + l.checks.length * S.XP.check + l.iq.length * S.XP.interview;
  const ytUrl = (q) => "https://www.youtube.com/results?search_query=" + encodeURIComponent(q);
  const phaseLabel = (p) => (p.track === "build" ? `Phase ${p.n}` : "Core CS track");
  const nodeLabel = (l) => `${l.phase.code}.${l.phase.lessons.indexOf(l) + 1}`;
  const plural = (n, w) => `${n} ${w}${n === 1 ? "" : "s"}`;

  // ---------- icons ----------
  const I = {
    doc: '<svg viewBox="0 0 24 24"><path d="M6 3h8l4 4v14H6z"/><path d="M14 3v4h4M9 12h6M9 16h6"/></svg>',
    video: '<svg viewBox="0 0 24 24"><rect x="3" y="5" width="18" height="14" rx="3"/><path d="M10 9l5 3-5 3z"/></svg>',
    course: '<svg viewBox="0 0 24 24"><path d="M2 8l10-5 10 5-10 5z"/><path d="M6 10v5c3 2.5 9 2.5 12 0v-5"/></svg>',
    tool: '<svg viewBox="0 0 24 24"><path d="M14.7 6.3a4 4 0 0 0-5.4 5.4L3 18l3 3 6.3-6.3a4 4 0 0 0 5.4-5.4l-2.5 2.5-2.5-.5-.5-2.5z"/></svg>',
    flame: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2c1 4 5 5.5 5 11a5 5 0 0 1-10 0c0-2.5 1.2-4 2.5-5 .2 1.8 1 3 2.2 3.5C11 9 11.5 5 12 2z"/></svg>',
    bolt: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M13 2L4 14h7l-1 8 9-12h-7z"/></svg>',
    idea: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18h6M10 21h4M12 3a6 6 0 0 0-3.5 10.9c.6.5 1 1.2 1 2V16h5v-.1c0-.8.4-1.5 1-2A6 6 0 0 0 12 3z"/></svg>',
    eye: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/></svg>',
    hammer: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 4l6 6-3 3-6-6zM11 7L3 15l3 3 8-8"/></svg>',
    check: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 12l5 5L20 6"/></svg>',
    key: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="8" cy="15" r="4"/><path d="M11 12l9-9M17 6l3 3"/></svg>',
    book: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 4h6a2 2 0 0 1 2 2v14a2 2 0 0 0-2-2H4zM20 4h-6a2 2 0 0 0-2 2v14a2 2 0 0 1 2-2h6z"/></svg>',
    chat: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12z"/></svg>',
    pen: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 20h4L19 9l-4-4L4 16z"/></svg>',
    back: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M15 18l-6-6 6-6"/></svg>',
    target: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1.5"/></svg>',
    sprout: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 21V11M12 11c0-4 3-6 8-6 0 5-3 7-8 6zM12 13c0-3-2-5-7-5 0 4 2 6 7 5z"/></svg>',
    globe: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c3 3.5 3 14.5 0 18M12 3c-3 3.5-3 14.5 0 18"/></svg>',
    star: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1-4.4-4.3 6.1-.9z"/></svg>',
  };
  const blueprintMark = '<svg class="blueprint-mark" viewBox="0 0 200 200" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><circle cx="100" cy="100" r="80"/><circle cx="100" cy="100" r="50" stroke-dasharray="4 6"/><circle cx="100" cy="100" r="12" fill="currentColor"/><path d="M100 0v200M0 100h200"/></svg>';

  // ---------- visual explainers ----------
  let vizCtxs = [];
  function destroyViz() { vizCtxs.forEach((c) => c.destroy()); vizCtxs = []; }
  function vizFigure(def, headingTag) {
    const tag = headingTag || "h3";
    return `<figure class="viz" data-viz="${esc(def.id)}"><div class="viz-head"><${tag}>${esc(def.title)}</${tag}><p>${esc(def.blurb || "")}</p></div><div class="viz-body"></div></figure>`;
  }
  function mountAllViz() {
    $main.querySelectorAll("figure.viz[data-viz]").forEach((fig) => {
      const def = VIZ.byId[fig.dataset.viz];
      if (def) vizCtxs.push(VIZ.mount(fig, def));
    });
  }

  // ---------- toast / HUD / theme ----------
  let toastTimer;
  function toast(msg) {
    $toast.textContent = msg;
    $toast.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => $toast.classList.remove("show"), 2600);
  }
  function renderHud() {
    const lv = S.level();
    $hud.innerHTML =
      `<span class="hud-item flame" title="Day streak">${I.flame}<b>${S.streak()}</b></span>` +
      `<span class="hud-item" title="Total XP">${I.bolt}<b>${lv.xp.toLocaleString()}</b><span class="visually-hidden">XP</span></span>` +
      `<span class="hud-me" title="Me">${'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="8" r="4"/><path d="M4 21c1.5-4 4.5-6 8-6s6.5 2 8 6"/></svg>'}</span>`;
  }
  function applyTheme() {
    const t = S.get().theme;
    if (t) document.documentElement.setAttribute("data-theme", t);
    else document.documentElement.removeAttribute("data-theme");
  }

  // ---------- routine & sessions ----------
  const ROUTINES = {
    evening: { name: "Evening block", time: "6:00–7:30 pm", blocks: [
      { name: "Build", min: 60, what: "Your current build node. Hints only after 10 stuck minutes.", main: true },
      { name: "Library", min: 20, what: "Read one Library lesson and answer its quiz." },
      { name: "Feed", min: 10, what: "Quiz cards in the Feed. Stop at the checkpoint." },
    ] },
    night: { name: "Night block", time: "9:00–11:30 pm", blocks: [
      { name: "ProntoPy", min: 60, what: "DSA in ProntoPy. Brute force first, then optimise. Log what you solve." },
      { name: "Build", min: 55, what: "Back to your build node or capstone.", main: true },
      { name: "Break", min: 10, what: "Stand up, water, stretch. No phone." },
      { name: "Life skills", min: 15, what: "One lesson from Communication, Character, Thinking or Power." },
      { name: "Mind", min: 10, what: "A Mind drill or three honest lines in your notes. Then sleep." },
    ] },
    weekend: { name: "Weekend deep work", time: "locked in", blocks: [
      { name: "Capstone", min: 120, what: "Deep work on your capstone or build node. Phone in another room.", main: true },
      { name: "Break", min: 20, what: "Walk, eat, no screens." },
      { name: "ProntoPy", min: 90, what: "DSA: one new pattern plus re-solving two old problems." },
      { name: "Break", min: 15, what: "Rest your eyes." },
      { name: "Library", min: 60, what: "Two or three lessons from a CS area, with quizzes." },
      { name: "Review", min: 30, what: "Review the week: notes, plan next week, write one Mind drill." },
    ] },
  };
  function currentRoutine() {
    const now = new Date(), day = now.getDay();
    if (day === 0 || day === 6) return "weekend";
    return now.getHours() < 20 ? "evening" : "night";
  }
  function blocks() { const s = S.get().session; return ROUTINES[(s && s.kind) || currentRoutine()].blocks; }
  let sessionTick;
  function renderSession() {
    const s = S.get().session;
    clearInterval(sessionTick);
    if (!s) { $session.hidden = true; return; }
    $session.hidden = false;
    const B = blocks();
    const draw = () => {
      const elapsed = Math.floor((Date.now() - s.start) / 1000);
      let acc = 0, block = null, remain = 0;
      for (const b of B) { acc += b.min * 60; if (elapsed < acc) { block = b; remain = acc - elapsed; break; } }
      if (!block) {
        $session.innerHTML = `<span>Block complete. That's how seniors are made.</span><span class="grow"></span><button type="button" data-act="end-session">Close</button>`;
        clearInterval(sessionTick);
        return;
      }
      const mm = String(Math.floor(remain / 60)).padStart(2, "0"), ss = String(remain % 60).padStart(2, "0");
      $session.innerHTML = `<span>${block.name}</span><span class="time">${mm}:${ss}</span><span class="grow small">${block.what}</span><button type="button" data-act="end-session">End</button>`;
    };
    draw();
    sessionTick = setInterval(draw, 1000);
  }

  // ---------- quests ----------
  function quests() {
    const st = S.get(), t = S.today(), ts = S.todayStats();
    const weekend = currentRoutine() === "weekend";
    const mindToday = Object.values(st.mind).some((m) => m.at === t);
    const habitsToday = (st.habitLog[t] || []).length > 0;
    const list = weekend
      ? [
          { id: "w-cap", text: "Deep work: finish a capstone milestone or a build node", manual: true },
          { id: "w-read", text: "Read 4 Library lessons", have: ts.lessons, need: 4 },
          { id: "w-pronto", text: "Log 6 ProntoPy problems", have: S.prontoToday(), need: 6 },
          { id: "w-mind", text: "Write one Mind drill", have: mindToday ? 1 : 0, need: 1 },
          { id: "w-plan", text: "Plan next week: pick 5 nodes and 15 problems", manual: true },
        ]
      : [
          { id: "d-build", text: "Work 60+ minutes on your build node", manual: true },
          { id: "d-read", text: "Read 2 Library lessons", have: ts.lessons, need: 2 },
          { id: "d-quiz", text: "Get 5 quiz answers right", have: ts.right, need: 5 },
          { id: "d-pronto", text: "Log 3 ProntoPy problems", have: S.prontoToday(), need: 3 },
          { id: "d-habits", text: "Log today's habits", have: habitsToday ? 1 : 0, need: 1 },
        ];
    list.forEach((q) => { q.done = S.questDone(q.id); if (!q.manual && !q.done && q.have >= q.need) { S.completeQuest(q.id); q.done = true; q.justNow = true; } });
    return list;
  }
  function questsHtml() {
    const Q = quests();
    const done = Q.filter((q) => q.done).length;
    const fresh = Q.filter((q) => q.justNow);
    if (fresh.length) setTimeout(() => toast(`Quest complete · +${S.XP.quest} XP`), 50);
    return `<section class="panel quests" aria-labelledby="q-title">
      <div class="quests-head"><h2 id="q-title">Today's quests</h2><span class="muted small">${done}/${Q.length}</span></div>
      <div class="meter"><i style="width:${(done / Q.length) * 100}%"></i></div>
      <ul class="quest-list">${Q.map((q) => `<li class="quest ${q.done ? "done" : ""}">
        <span class="quest-tick" aria-hidden="true">${q.done ? I.check.replace("<svg", '<svg width="16" height="16"') : ""}</span>
        <span class="quest-text">${esc(q.text)}${q.manual ? "" : ` <span class="muted small">${Math.min(q.have, q.need)}/${q.need}</span>`}</span>
        ${q.manual && !q.done ? `<button class="btn btn-quiet small" type="button" data-act="quest" data-q="${q.id}">Done</button>` : ""}
      </li>`).join("")}</ul>
      ${done === Q.length ? `<p class="small" style="margin:8px 0 0;color:var(--mint)">All quests done. Close the app and sleep well.</p>` : ""}
    </section>`;
  }

  // ---------- plan & pace ----------
  const PLAN = D.plan || null;
  function unitsDone() {
    const st = S.get();
    const nodes = Object.keys(st.done).filter((id) => byId[id]).length;
    const ms = D.capstones.reduce((a, c) => a + (st.cap[c.id] || []).length, 0);
    return nodes + ms;
  }
  function expected(key, date) {
    if (!PLAN) return 0;
    const t = (date || new Date()).getTime();
    const val = (m) => (key === "units" ? m.target.build + m.target.core + m.target.milestones : m.target[key]);
    let prevT = new Date(PLAN.start + "T00:00:00").getTime(), prevU = 0;
    for (const m of PLAN.months) {
      const endT = new Date(m.ends + "T23:59:59").getTime();
      const u = val(m);
      if (t <= endT) return Math.max(0, Math.round(prevU + (u - prevU) * Math.max(0, (t - prevT) / (endT - prevT))));
      prevT = endT; prevU = u;
    }
    return prevU;
  }
  function pace() {
    const exp = expected("units"), got = unitsDone(), diff = got - exp;
    if (diff >= 2) return { cls: "ahead", text: `Ahead of plan by ${diff}`, exp, got };
    if (diff <= -3) return { cls: "behind", text: `Behind plan by ${-diff}`, exp, got };
    return { cls: "on", text: "On track", exp, got };
  }
  function daysLeft() { return PLAN ? Math.max(0, Math.ceil((new Date(PLAN.end + "T23:59:59") - new Date()) / 86400000)) : 0; }

  // ---------- views: today ----------
  function viewToday() {
    const st = S.get();
    const lv = S.level();
    const nl = nextLesson("build");
    const nc = nextLesson("core");
    const doneCount = Object.keys(st.done).filter((id) => byId[id]).length;
    const hr = new Date().getHours();
    const hello = hr < 5 ? "Late night, Pank." : hr < 12 ? "Morning, Pank." : hr < 17 ? "Afternoon, Pank." : "Evening, Pank.";
    const rk = currentRoutine(), R = ROUTINES[rk];
    const nextRead = LIB.find((l) => !st.read[l.id]);
    const dayIndex = Math.floor(Date.now() / 86400000);
    const pending = D.mind.filter((d) => !st.mind[d.id]);
    const drill = (pending.length ? pending : D.mind)[dayIndex % (pending.length || D.mind.length)];
    const p = pace();
    const t = S.today();

    const nextHtml = nl ? `
      <section class="panel next-node" aria-labelledby="next-title">
        ${blueprintMark}
        <div class="phase-tag">${phaseLabel(nl.phase)} · ${esc(nl.phase.title)}</div>
        <h2 id="next-title">${esc(nl.title)}</h2>
        <p class="muted">${esc(nl.sub)}</p>
        <div class="btn-row">
          <a class="btn btn-lit" href="#/lesson/${nl.id}">Open this node</a>
          ${st.session ? "" : `<button class="btn" type="button" data-act="start-session" data-kind="${rk}">Start ${esc(R.name.toLowerCase())}</button>`}
        </div>
        <div class="second-node">
          ${nextRead ? `<div><span class="small muted">Next in the Library · ${esc(nextRead.area.title)}</span><br><a href="#/read/${nextRead.id}">${esc(nextRead.t)}</a></div>` : ""}
          ${nc ? `<div><span class="small muted">Weekend · Core CS ${nodeLabel(nc)}</span><br><a href="#/lesson/${nc.id}">${esc(nc.title)}</a></div>` : ""}
        </div>
        <div class="hour">
          <h3>${esc(R.name)} <span class="muted small">${esc(R.time)}</span></h3>
          <div class="hour-blocks" aria-hidden="true" style="grid-template-columns:${R.blocks.map((b) => b.min + "fr").join(" ")}">${R.blocks.map((b) => `<span class="${b.main ? "main" : b.name === "Break" ? "rest" : ""}"></span>`).join("")}</div>
          <ul class="hour-legend">${R.blocks.map((b) => `<li><b>${b.min} min</b> ${b.name}</li>`).join("")}</ul>
        </div>
      </section>` : `
      <section class="panel next-node">${blueprintMark}<h2>Every build node is done.</h2><p>Capstones, the Library and mock interviews carry you the rest of the way.</p><a class="btn btn-lit" href="#/capstones">Go to capstones</a></section>`;

    const habits = st.habits.map((hb) => {
      const on = (st.habitLog[t] || []).includes(hb.id);
      const streak = S.habitStreak(hb.id);
      return `<button type="button" class="habit ${on ? "on" : ""}" data-act="habit" data-h="${esc(hb.id)}" aria-pressed="${on}"><span class="habit-name">${esc(hb.name)}</span><span class="habit-streak">${streak ? `${streak} day${streak > 1 ? "s" : ""}` : "start today"}</span></button>`;
    }).join("");

    $main.innerHTML = `
      <section class="hero" aria-labelledby="hero-title">
        <canvas class="hero-sky" aria-hidden="true"></canvas>
        <div class="hero-in">
          <p class="hero-kicker">${daysLeft()} days to August · ${esc(lv.name)}</p>
          <h1 id="hero-title">${hello}</h1>
          <p class="hero-sub">Every dot behind this text is one lesson. The gold ones are yours. Light up the sky.</p>
          <div class="hero-stats">
            <div><b data-count="${doneCount}">0</b><span>nodes built</span></div>
            <div><b data-count="${Object.keys(st.read).filter((k) => libById[k]).length}">0</b><span>lessons read</span></div>
            <div><b data-count="${S.totalProblems()}">0</b><span>DSA problems</span></div>
            <div><b data-count="${lv.xp}">0</b><span>XP</span></div>
          </div>
          <div class="btn-row">
            ${nl ? `<a class="btn btn-lit" href="#/lesson/${nl.id}">Continue: ${esc(nl.title)}</a>` : ""}
            <a class="btn" href="#/progress">See all progress</a>
            <a class="btn" href="#/tutor">Ask ${esc(tutorName())}</a>
          </div>
        </div>
      </section>
      <div class="today-grid">
        <div class="stack-col">
          ${nextHtml}
          ${questsHtml()}
          ${PLAN ? `<section class="panel" aria-labelledby="plan-title">
            <div class="muted small">Road to August</div>
            <h2 id="plan-title" style="margin:4px 0 8px;font-size:1.4rem"><span class="pace ${p.cls}">${p.text}</span></h2>
            <p class="muted" style="margin:0 0 12px">${p.got} of ${p.exp} planned nodes and milestones done by today · ${daysLeft()} days to the end of August</p>
            <a class="btn" href="#/plan">See the month-by-month plan</a>
          </section>` : ""}
        </div>
        <div class="stack-col">
          <section class="panel level-card" aria-labelledby="lv-title">
            <div class="muted small" id="lv-title">Current level</div>
            <div class="level-name">${esc(lv.name)}</div>
            <div class="meter" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${Math.round(lv.pct * 100)}" aria-label="Progress to next level"><i style="width:${(lv.pct * 100).toFixed(1)}%"></i></div>
            <div class="small muted">${lv.next ? `${(lv.next.xp - lv.xp).toLocaleString()} XP to ${esc(lv.next.name)}` : "Top of the ladder."}</div>
            <div class="stat-row">
              <div class="stat"><b>${S.streak()}</b><span>day streak</span></div>
              <div class="stat"><b>${doneCount}</b><span>nodes built</span></div>
              <div class="stat"><b>${S.totalProblems()}</b><span>DSA problems</span></div>
            </div>
            <div class="heat" aria-label="Activity over the last 16 weeks">${heatmap(16)}</div>
          </section>
          <section class="panel" aria-labelledby="pp-title">
            <div class="quests-head"><h2 id="pp-title">ProntoPy check-in</h2>${st.prontoUrl ? `<a class="small" href="${esc(st.prontoUrl)}" target="_blank" rel="noopener">Open ProntoPy</a>` : `<a class="small" href="#/me">Add your ProntoPy link</a>`}</div>
            <p class="muted small" style="margin:4px 0 12px">DSA and Python live in ProntoPy. Log each problem you solve on your own here, so your plan and streak stay honest.</p>
            <div style="display:flex;align-items:center;gap:16px;flex-wrap:wrap">
              <div class="stat"><b style="font-family:var(--f-display);font-size:2rem;font-weight:800" id="pronto-today">${S.prontoToday()}</b><span class="muted small"> today · ${S.totalProblems()} total</span></div>
              <div class="btn-row" style="margin-left:auto">
                <button class="btn" type="button" data-act="pronto" data-d="-1" aria-label="Remove one">−1</button>
                <button class="btn btn-lit" type="button" data-act="pronto" data-d="1">+1 solved</button>
              </div>
            </div>
          </section>
          <section class="panel" aria-labelledby="hb-title">
            <div class="quests-head"><h2 id="hb-title">Habits</h2><a class="small" href="#/me">Edit</a></div>
            <p class="muted small" style="margin:4px 0 12px">Tap what you did today. Streaks are private to this browser.</p>
            <div class="habits">${habits}</div>
          </section>
          <section class="panel drill-card" aria-labelledby="drill-title">
            <div class="kind">${esc(drill.kind)} · today's drill</div>
            <h3 id="drill-title" style="margin-top:4px">${esc(drill.title)}</h3>
            <blockquote>${esc(drill.prompt)}</blockquote>
            <a class="btn" href="#/drill/${drill.id}">Do this drill</a>
          </section>
        </div>
      </div>`;
    heroStop = startConstellation($main.querySelector(".hero-sky"));
    countUp($main.querySelector(".hero"));
  }

  function tutorName() { try { return JSON.parse(localStorage.getItem("pnode:tutor") || "{}").name || "Nova"; } catch (e) { return "Nova"; } }
  function heatmap(weeks) {
    const log = S.get().log;
    const end = new Date();
    const start = new Date(end);
    start.setDate(end.getDate() - (weeks * 7 - 1) - end.getDay());
    let html = "";
    const t = S.today();
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      const key = S.today(d);
      const xp = log[key] || 0;
      const l = xp === 0 ? 0 : xp < 50 ? 1 : xp < 120 ? 2 : xp < 250 ? 3 : 4;
      html += `<i data-l="${l}" class="${key === t ? "today" : ""}" title="${key}: ${xp} XP"></i>`;
    }
    return html;
  }

  // ---------- views: feed ----------
  let feedState = null;
  function buildFeedPool() {
    const st = S.get();
    const pool = [];
    LIB.forEach((l) => {
      const base = { lesson: l, area: l.area.title, unread: !st.read[l.id] };
      pool.push({ ...base, kind: "Concept", title: l.t, html: l.body[0] });
      (l.keys || []).forEach((k) => pool.push({ ...base, kind: "Key idea", html: k }));
      if (l.fact) pool.push({ ...base, kind: "Did you know?", html: l.fact });
      if (l.ex) pool.push({ ...base, kind: "Real life", html: l.ex });
      (l.quiz || []).forEach((q, i) => pool.push({ ...base, kind: "Quick quiz", quiz: q, qid: `${l.id}#${i}` }));
    });
    LESSONS.forEach((l) => { if (SIMPLE[l.id]) pool.push({ kind: "From your path", area: phaseLabel(l.phase), title: l.title, html: SIMPLE[l.id], node: l, unread: !st.done[l.id] }); });
    D.mind.forEach((d) => pool.push({ kind: "Mind", area: d.kind, title: d.title, html: esc(d.prompt), drill: d, unread: !st.mind[d.id] }));
    // shuffle, then float unread cards to the front, then avoid same lesson twice in a row
    for (let i = pool.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [pool[i], pool[j]] = [pool[j], pool[i]]; }
    pool.sort((a, b) => (b.unread ? 1 : 0) - (a.unread ? 1 : 0));
    for (let i = 1; i < pool.length; i++) {
      if (pool[i].lesson && pool[i].lesson === pool[i - 1].lesson) {
        const k = pool.findIndex((c, j) => j > i && c.lesson !== pool[i].lesson);
        if (k > 0) [pool[i], pool[k]] = [pool[k], pool[i]];
      }
    }
    return pool;
  }
  const KIND_GLYPH = { "Concept": "◆", "Key idea": "→", "Did you know?": "!", "Real life": "●", "Quick quiz": "?", "From your path": "◎", "Mind": "∞" };
  function feedCardHtml(c, i) {
    if (c.checkpoint) {
      return `<article class="fcard checkpoint" data-i="${i}"><div class="fc">
        <div class="fc-kind">Checkpoint</div>
        <h2 class="fc-title">${c.n} cards. Good place to pause.</h2>
        <p class="fc-text">Scrolling fast feels productive, but one proper lesson sticks better than 50 cards. Want to go deep on something you just saw?</p>
        <div class="btn-row">${c.lesson ? `<a class="btn btn-lit" href="#/read/${c.lesson.id}">Read: ${esc(c.lesson.t)}</a>` : ""}<a class="btn" href="#/today">Back to today</a></div>
        <p class="small muted" style="margin-top:16px">Or keep scrolling. Your call.</p>
      </div></article>`;
    }
    const quiz = c.quiz ? `<div class="fc-quiz" data-qid="${esc(c.qid)}">${c.quiz.o.map((o, k) => `<button type="button" class="fc-opt" data-act="feed-answer" data-k="${k}">${esc(o)}</button>`).join("")}</div><p class="fc-why" hidden></p>` : "";
    const link = c.lesson ? `<a class="fc-link" href="#/read/${c.lesson.id}">${c.unread ? "Read the lesson" : "Read again"} · ${esc(c.lesson.t)}</a>`
      : c.node ? `<a class="fc-link" href="#/lesson/${c.node.id}">Open node ${esc(nodeLabel(c.node))}</a>`
      : c.drill ? `<a class="fc-link" href="#/drill/${c.drill.id}">Do this drill</a>` : "";
    return `<article class="fcard" data-i="${i}" data-kind="${esc(c.kind)}"><div class="fc">
      <span class="fc-glyph" aria-hidden="true">${KIND_GLYPH[c.kind] || "◆"}</span>
      <div class="fc-kind">${esc(c.kind)} <span>· ${esc(c.area)}</span></div>
      ${c.title ? `<h2 class="fc-title">${esc(c.title)}</h2>` : ""}
      ${c.quiz ? `<h2 class="fc-title fc-q">${esc(c.quiz.q)}</h2>` : `<p class="fc-text">${c.html}</p>`}
      ${quiz}
      ${link}
    </div></article>`;
  }
  function viewFeed() {
    document.body.classList.add("feed-mode");
    if (!LIB.length) { $main.innerHTML = `<div class="empty"><h2>The Library is empty.</h2></div>`; return; }
    feedState = { pool: buildFeedPool(), shown: 0, seen: new Set(), right: 0, answered: 0, cards: [] };
    $main.innerHTML = `<div class="feed" id="feed" tabindex="0" aria-label="Learning feed. Scroll for the next card."></div>
      <div class="feed-pill" id="feed-pill" aria-live="polite">0 cards · 0/0 right</div>`;
    appendFeed(14);
    const feed = $main.querySelector("#feed");
    feed.focus({ preventScroll: true });
    feedObserver = new IntersectionObserver((entries) => entries.forEach((e) => {
      if (!e.isIntersecting) return;
      e.target.classList.add("in");
      const i = +e.target.dataset.i;
      if (!feedState.seen.has(i)) { feedState.seen.add(i); if (!e.target.classList.contains("checkpoint")) S.dayStat("cards"); updatePill(); }
      if (i >= feedState.shown - 4) appendFeed(10);
    }), { root: feed, threshold: 0.6 });
    feed.querySelectorAll(".fcard").forEach((el) => feedObserver.observe(el));
  }
  let feedObserver = null;
  function appendFeed(n) {
    const feed = $main.querySelector("#feed");
    if (!feed) return;
    let html = "";
    for (let k = 0; k < n; k++) {
      const i = feedState.shown;
      let c;
      if (i > 0 && (i + 1) % 26 === 0) { const recent = feedState.cards.slice(-25).reverse().find((x) => x.lesson); c = { checkpoint: true, n: i - Math.floor(i / 26), lesson: recent && recent.lesson }; }
      else { if (!feedState.pool.length) feedState.pool = buildFeedPool(); c = feedState.pool.shift(); }
      feedState.cards[i] = c;
      html += feedCardHtml(c, i);
      feedState.shown++;
    }
    feed.insertAdjacentHTML("beforeend", html);
    if (feedObserver) feed.querySelectorAll(".fcard:not([data-obs])").forEach((el) => { el.dataset.obs = "1"; feedObserver.observe(el); });
    else feed.querySelectorAll(".fcard").forEach((el) => (el.dataset.obs = "1"));
  }
  function updatePill() {
    const pill = document.getElementById("feed-pill");
    if (pill) pill.textContent = `${plural(feedState.seen.size, "card")} · ${feedState.right}/${feedState.answered} right`;
  }

  // ---------- views: path ----------
  function viewMap(trackId) {
    const track = TRACKS.find((t) => t.id === trackId) || TRACKS[0];
    const st = S.get();
    const nl = nextLesson(track.id);
    const phases = D.phases.filter((p) => p.track === track.id);
    $main.innerHTML = `
      <div class="page-head">
        <h1>The path</h1>
        <p>${LESSONS.length} build nodes, three capstones and your Mind drills. DSA and Python live in ProntoPy; deep theory lives in the Library.</p>
      </div>
      <div class="btn-row" style="margin-bottom:20px"><a class="btn" href="#/capstones">Capstones</a><a class="btn" href="#/mind">Mind drills</a><a class="btn" href="#/plan">Road to August</a></div>
      <nav class="filter" aria-label="Tracks">
        ${TRACKS.map((t) => {
          const n = trackLessons(t.id).length, d = trackLessons(t.id).filter((l) => st.done[l.id]).length;
          return `<a href="#/map/${t.id}" class="track-tab" aria-pressed="${t.id === track.id}" style="text-decoration:none">${esc(t.short)} <span class="muted">${d}/${n}</span></a>`;
        }).join("")}
      </nav>
      <p class="track-note">${esc(track.note)}</p>
      <div style="height:24px"></div>
      ${phases.map((p) => {
        const done = p.lessons.filter((l) => st.done[l.id]).length;
        return `
        <section class="phase" aria-labelledby="ph-${p.id}">
          <div class="phase-head">
            <div class="phase-num" aria-hidden="true">${esc(p.code)}</div>
            <h2 id="ph-${p.id}">${esc(p.title)}</h2>
            <p>${esc(p.tagline)}</p>
            <div class="phase-progress">${done} of ${p.lessons.length} built</div>
          </div>
          <ol class="trail">
            ${p.lessons.map((l, i) => {
              const state = st.done[l.id] ? "done" : nl && nl.id === l.id ? "next" : "open";
              const hasViz = (VIZ.byNode[l.id] || []).length;
              return `<li><a class="node" data-state="${state}" href="#/lesson/${l.id}">
                <span class="node-dot">${state === "done" ? "✓" : `${esc(p.code)}.${i + 1}`}</span>
                <span><span class="node-title">${esc(l.title)}</span><br><span class="node-sub">${esc(l.sub)}${hasViz ? ` · ${hasViz} interactive` : ""}</span></span>
                <span class="node-xp">${state === "done" ? "Built" : `${lessonXp(l)} XP`}</span>
              </a></li>`;
            }).join("")}
          </ol>
        </section>`;
      }).join("")}`;
  }

  function resLink(r) {
    const isVideo = !!r.yt;
    const url = isVideo ? ytUrl(r.yt) : r.u;
    const kind = isVideo ? "video" : r.k || "doc";
    const label = { doc: "Docs / article", course: "Free course", video: "Free video search", tool: "Tool" }[kind];
    return `<li><a class="res" href="${esc(url)}" target="_blank" rel="noopener">
      <span class="res-icon">${I[kind] || I.doc}</span>
      <span><span class="res-title">${esc(r.t)}</span><br><span class="res-kind">${label}</span></span>
    </a></li>`;
  }

  function viewLesson(id) {
    destroyViz();
    const l = byId[id];
    if (!l) return viewNotFound();
    const st = S.get();
    const list = trackLessons(l.phase.track);
    const idx = list.indexOf(l);
    const prev = list[idx - 1], next = list[idx + 1];
    const checks = st.checks[id] || [];
    const hintsShown = st.hints[id] || 0;
    const done = !!st.done[id];
    const vizzes = VIZ.byNode[id] || [];
    const simple = SIMPLE[id];
    const related = (l.library || []).map((x) => libById[x]).filter(Boolean);

    $main.innerHTML = `
      <a class="crumb" href="#/map/${l.phase.track}">${I.back} Path</a>
      <div class="lesson-layout">
        <article>
          <header class="lesson-head">
            <div class="phase-tag">Node ${esc(nodeLabel(l))} · ${esc(l.phase.title)}</div>
            <h1>${esc(l.title)}</h1>
            <div class="meta"><span>About ${l.hours || 2} focused hours</span><span>Up to ${lessonXp(l) + S.XP.noHints} XP</span>${vizzes.length ? `<span>${plural(vizzes.length, "interactive explainer")}</span>` : ""}</div>
          </header>
          ${simple ? `<section class="section" aria-label="In plain words"><div class="plain">${I.sprout}<div><b>In plain words</b><p>${simple}</p></div></div></section>` : ""}
          <section class="section" aria-labelledby="s-concept">
            <h2 id="s-concept">${I.idea} The idea</h2>
            <div class="concept">${l.concept.map((p) => `<p>${p}</p>`).join("")}</div>
            ${l.objectives && l.objectives.length ? `<p class="muted" style="margin-top:16px"><b>By the end you can:</b></p><ul>${l.objectives.map((o) => `<li>${o}</li>`).join("")}</ul>` : ""}
          </section>
          ${vizzes.length ? `<section class="section viz-section" aria-labelledby="s-see" style="max-width:none">
            <h2 id="s-see">${I.eye} See it</h2>
            <p class="muted small">Press Play or step through it yourself. Predict what happens next before you click.</p>
            <div class="viz-list">${vizzes.map((v) => vizFigure(v)).join("")}</div>
          </section>` : ""}
          <section class="section" aria-labelledby="s-build">
            <h2 id="s-build">${I.hammer} Build it yourself</h2>
            <div class="build-brief">
              <div class="spec-label">The brief</div>
              <h3>${esc(l.build.title)}</h3>
              <p>${l.build.brief}</p>
              ${l.build.steps && l.build.steps.length ? `<ol>${l.build.steps.map((s) => `<li>${s}</li>`).join("")}</ol>` : ""}
              <p class="small muted" style="margin:0">No copy-paste. Type every line. If you get stuck, sketch the flow on paper before opening a hint.</p>
            </div>
          </section>
          <section class="section" aria-labelledby="s-checks">
            <h2 id="s-checks">${I.check} Done when</h2>
            <ul class="checks">${l.checks.map((c, i) => `<li><label class="check"><input type="checkbox" data-act="check" data-i="${i}" ${checks.includes(i) ? "checked" : ""}><span>${c}</span></label></li>`).join("")}</ul>
          </section>
          <section class="section" aria-labelledby="s-hints">
            <h2 id="s-hints">${I.key} Hints</h2>
            <p class="muted small">Open one at a time. Finish without any hint for a +${S.XP.noHints} XP bonus.</p>
            <div class="hint-list">${l.hints.slice(0, hintsShown).map((h, i) => `<div class="hint"><b>Hint ${i + 1}</b>${h}</div>`).join("")}</div>
            ${hintsShown < l.hints.length ? `<button class="btn" type="button" data-act="hint" style="margin-top:12px">Show hint ${hintsShown + 1} of ${l.hints.length}</button>` : `<p class="small muted" style="margin-top:12px">That's every hint. The rest is yours.</p>`}
          </section>
          <section class="section" aria-labelledby="s-res">
            <h2 id="s-res">${I.book} Learn from</h2>
            <ul class="res-list">${related.map((r) => `<li><a class="res" href="#/read/${r.id}"><span class="res-icon">${I.book}</span><span><span class="res-title">${esc(r.t)}</span><br><span class="res-kind">Pnode Library · ${esc(r.area.title)}</span></span></a></li>`).join("")}${l.res.map(resLink).join("")}</ul>
          </section>
          <section class="section" aria-labelledby="s-iq">
            <h2 id="s-iq">${I.target} Interview room</h2>
            <p class="muted small">Answer out loud first, then open to compare. Each one you review is +${S.XP.interview} XP.</p>
            ${l.iq.map((q, i) => `<details class="iq" data-i="${i}"><summary>${esc(q.q)}</summary><div class="answer"><p>${q.a}</p></div></details>`).join("")}
          </section>
          <section class="section" aria-labelledby="s-notes">
            <h2 id="s-notes">${I.pen} Your notes</h2>
            <label for="notes" class="visually-hidden">Notes for this node</label>
            <textarea id="notes" placeholder="What clicked, what broke, what you'd do differently. Future you will read this before interviews.">${esc(st.notes[id] || "")}</textarea>
            <div class="btn-row" style="margin-top:12px"><a class="btn btn-lit" href="#/tutor/node/${l.id}">${I.chat.replace("<svg", '<svg width="18" height="18"')} Ask ${esc(tutorName())} for a hint</a><button class="btn btn-quiet" type="button" data-act="ask">Copy a question for Claude</button></div>
          </section>
          <section class="section complete-box" aria-labelledby="s-done">
            <h2 id="s-done" class="visually-hidden">Complete</h2>
            ${done
              ? `<p class="done-stamp">${I.check.replace("<svg", '<svg width="22" height="22"')} Built on ${esc(st.done[id])}</p><button class="btn btn-quiet" type="button" data-act="undo">Mark as not built</button>`
              : `<div class="panel"><p class="big">Shipped it?</p><p class="muted">${checks.length} of ${l.checks.length} checks ticked. Be honest. Interviews will be.</p><button class="btn btn-lit" type="button" data-act="complete">Mark node as built</button></div>`}
          </section>
          <nav class="pager" aria-label="Lesson navigation">
            ${prev ? `<a href="#/lesson/${prev.id}"><small>Previous</small><b>${esc(prev.title)}</b></a>` : "<span></span>"}
            ${next ? `<a href="#/lesson/${next.id}"><small>Next</small><b>${esc(next.title)}</b></a>` : ""}
          </nav>
        </article>
        <aside class="lesson-aside" aria-label="Phase overview">
          <div class="panel">
            <div class="muted small">${phaseLabel(l.phase)}</div>
            <h3 style="margin:4px 0 12px">${esc(l.phase.title)}</h3>
            <ol class="small" style="padding-left:1.2em;margin:0">
              ${l.phase.lessons.map((x) => `<li>${x.id === id ? `<b>${esc(x.title)}</b>` : `<a href="#/lesson/${x.id}" style="color:${st.done[x.id] ? "var(--lit)" : "var(--ink-2)"}">${esc(x.title)}</a>`}</li>`).join("")}
            </ol>
          </div>
        </aside>
      </div>`;
    mountAllViz();
    $main.querySelectorAll("details.iq").forEach((d) => d.addEventListener("toggle", () => {
      if (d.open && S.toggleIq(id, +d.dataset.i, true)) { toast(`+${S.XP.interview} XP · question reviewed`); renderHud(); }
    }));
    const notes = $main.querySelector("#notes");
    let nt;
    notes.addEventListener("input", () => { clearTimeout(nt); nt = setTimeout(() => S.setNote(id, notes.value), 400); });
  }

  // ---------- views: library ----------
  function viewLibrary() {
    const st = S.get();
    const total = LIB.length, read = LIB.filter((l) => st.read[l.id]).length;
    const groupHtml = GROUPS.map((g) => {
      const areas = AREAS.filter((a) => a.group === g);
      if (!areas.length) return "";
      return `<section class="lib-group" aria-labelledby="g-${g.replace(/\W+/g, "")}">
        <h2 id="g-${g.replace(/\W+/g, "")}">${esc(g)}</h2>
        <div class="area-grid">
          ${areas.map((a) => {
            const ls = areaLessons(a), r = ls.filter((l) => st.read[l.id]).length;
            return `<a class="area-card" href="#/library/${a.id}">
              <span class="area-glyph" aria-hidden="true">${esc(a.glyph || "◆")}</span>
              <b>${esc(a.title)}</b>
              <span class="area-blurb">${esc(a.blurb)}</span>
              <span class="area-meta">${r}/${ls.length} read · ${plural(a.modules.length, "module")}</span>
              <span class="meter"><i style="width:${ls.length ? (r / ls.length) * 100 : 0}%"></i></span>
            </a>`;
          }).join("")}
          ${g === "Life skills" ? `<a class="area-card" href="#/mind"><span class="area-glyph" aria-hidden="true">∞</span><b>Mind drills</b><span class="area-blurb">Written exercises for problem solving, critical thinking and emotional intelligence.</span><span class="area-meta">${Object.keys(st.mind).length}/${D.mind.length} done</span><span class="meter"><i style="width:${(Object.keys(st.mind).length / D.mind.length) * 100}%"></i></span></a>` : ""}
        </div>
      </section>`;
    }).join("");
    $main.innerHTML = `
      <div class="page-head">
        <h1>Library</h1>
        <p>${total} lessons in simple English, each with a real-life example, a fact and a quick quiz. ${read} read so far. <a href="#/lab">Open the Lab</a> for every interactive explainer.</p>
      </div>
      <label class="visually-hidden" for="lib-search">Search the Library</label>
      <input id="lib-search" class="lib-search" type="search" placeholder="Search lessons: TCP, inflation, negotiation, Docker…" autocomplete="off">
      <div id="lib-results" class="lib-results" hidden></div>
      <div id="lib-groups">${groupHtml}
        <div class="deeper">${refsHtml(D.deeper, "Beyond Pnode: university and IIT-depth CS, all free")}<p class="muted small">Pnode gives you breadth and job skills. These give you the depth of a full CS degree. Pick one course at a time and do its problem sets.</p></div>
      </div>`;
    const input = $main.querySelector("#lib-search"), results = $main.querySelector("#lib-results"), groups = $main.querySelector("#lib-groups");
    input.addEventListener("input", () => {
      const q = input.value.trim().toLowerCase();
      if (q.length < 2) { results.hidden = true; groups.hidden = false; return; }
      const hits = LIB.filter((l) => (l.t + " " + strip(l.body.join(" ")) + " " + (l.keys || []).join(" ")).toLowerCase().includes(q)).slice(0, 40);
      results.hidden = false; groups.hidden = true;
      results.innerHTML = hits.length ? hits.map((l) => `<a class="lesson-row" href="#/read/${l.id}"><span class="lr-dot ${st.read[l.id] ? "on" : ""}" aria-hidden="true"></span><span><b>${esc(l.t)}</b><br><span class="muted small">${esc(l.area.title)} · ${esc(l.module.title)}</span></span><span class="muted small">${l.mins || 4} min</span></a>`).join("") : `<p class="muted">No lessons match "${esc(input.value)}".</p>`;
    });
  }

  const REFS = D.refs || {};
  const refKind = { course: I.course, book: I.book, video: I.video, docs: I.doc, site: I.globe };
  function refsHtml(list, title) {
    if (!list || !list.length) return "";
    return `<section class="refs" aria-label="${esc(title)}"><h2>${esc(title)}</h2><ul class="ref-list">${list.map((r) => `<li><a class="ref" href="${esc(r.u)}" target="_blank" rel="noopener"><span class="ref-ico" aria-hidden="true">${refKind[r.kind] || I.doc}</span><span><b>${esc(r.t)}</b><span class="muted small">${esc(r.why || (r.kind === "book" && r.free === false ? "Book (check your college library) · video summary link" : r.kind === "video" ? "YouTube" : r.kind === "course" ? "Free course" : r.kind === "docs" ? "Official docs" : "Website"))}</span></span></a></li>`).join("")}</ul></section>`;
  }
  function viewArea(id) {
    const a = areaById[id];
    if (!a) return viewNotFound();
    const st = S.get();
    const ls = areaLessons(a), r = ls.filter((l) => st.read[l.id]).length;
    const next = ls.find((l) => !st.read[l.id]);
    $main.innerHTML = `
      <a class="crumb" href="#/library">${I.back} Library</a>
      <div class="page-head">
        <div class="phase-tag">${esc(a.group)}</div>
        <h1>${esc(a.title)}</h1>
        <p>${esc(a.intro || a.blurb)}</p>
        <div class="meter" style="max-width:420px"><i style="width:${ls.length ? (r / ls.length) * 100 : 0}%"></i></div>
        <p class="small muted">${r} of ${ls.length} lessons read</p>
        ${next ? `<a class="btn btn-lit" href="#/read/${next.id}">${r ? "Continue" : "Start"}: ${esc(next.t)}</a>` : `<p class="done-stamp">${I.check.replace("<svg", '<svg width="22" height="22"')} Area complete</p>`}
      </div>
      ${a.modules.map((m, mi) => `<section class="module" aria-labelledby="m-${mi}">
        <h2 id="m-${mi}"><span class="module-num">${mi + 1}</span>${esc(m.title)}</h2>
        <div class="lesson-rows">${m.lessons.map((l) => `<a class="lesson-row" href="#/read/${l.id}"><span class="lr-dot ${st.read[l.id] ? "on" : ""}" aria-hidden="true"></span><span><b>${esc(l.t)}</b></span><span class="muted small">${l.mins || 4} min</span></a>`).join("")}</div>
      </section>`).join("")}
      ${refsHtml(REFS[a.id], "Go deeper: videos, books and courses")}`;
  }

  function viewRead(id) {
    destroyViz();
    const l = libById[id];
    if (!l) return viewNotFound();
    const st = S.get();
    const ls = areaLessons(l.area), i = ls.indexOf(l);
    const prev = ls[i - 1], next = ls[i + 1];
    const vizzes = (l.viz || []).map((v) => VIZ.byId[v]).filter(Boolean);
    const quiz = l.quiz || [];
    $main.innerHTML = `
      <a class="crumb" href="#/library/${l.area.id}">${I.back} ${esc(l.area.title)}</a>
      <article class="reader">
        <header class="lesson-head">
          <div class="phase-tag">${esc(l.module.title)} · lesson ${i + 1} of ${ls.length}</div>
          <h1>${esc(l.t)}</h1>
          <div class="meta"><span>${l.mins || 4} min read</span><span>+${S.XP.read} XP</span>${quiz.length ? `<span>${plural(quiz.length, "quiz question")}</span>` : ""}</div>
        </header>
        <div class="reader-body">${l.body.map((p) => (p.startsWith("<") ? p : `<p>${p}</p>`)).join("")}</div>
        ${l.keys && l.keys.length ? `<section class="keys" aria-label="Key ideas"><h2>${I.key} Remember this</h2><ul>${l.keys.map((k) => `<li>${k}</li>`).join("")}</ul></section>` : ""}
        <div class="reader-boxes">
          ${l.ex ? `<div class="rbox ex"><b>${I.globe} Real life</b><p>${l.ex}</p></div>` : ""}
          ${l.fact ? `<div class="rbox fact"><b>${I.star} Did you know?</b><p>${l.fact}</p></div>` : ""}
        </div>
        ${vizzes.length ? `<section class="section viz-section" style="max-width:none"><h2>${I.eye} See it</h2><div class="viz-list">${vizzes.map((v) => vizFigure(v)).join("")}</div></section>` : ""}
        ${quiz.length ? `<section class="section" aria-labelledby="s-quiz"><h2 id="s-quiz">${I.target} Quick check</h2>
          ${quiz.map((q, k) => {
            const qid = `${l.id}#${k}`, ans = st.quiz[qid];
            return `<div class="rquiz" data-qid="${esc(qid)}"><p class="rq">${esc(q.q)}</p><div class="fc-quiz">${q.o.map((o, n) => `<button type="button" class="fc-opt ${ans != null && n === q.a ? "right" : ""}" data-act="read-answer" data-k="${n}" ${ans != null ? "disabled" : ""}>${esc(o)}</button>`).join("")}</div><p class="fc-why" ${ans != null ? "" : "hidden"}>${esc(q.why || "")}</p></div>`;
          }).join("")}
        </section>` : ""}
        <section class="section tutor-cta"><a class="btn" href="#/tutor/read/${l.id}">${I.chat.replace("<svg", '<svg width="18" height="18"')} Ask ${esc(tutorName())} about this lesson</a></section>
        <section class="section complete-box">
          ${st.read[id] ? `<p class="done-stamp">${I.check.replace("<svg", '<svg width="22" height="22"')} Read on ${esc(st.read[id])}</p>` : `<button class="btn btn-lit" type="button" data-act="mark-read">Mark as read · +${S.XP.read} XP</button>`}
        </section>
        <nav class="pager" aria-label="Lesson navigation">
          ${prev ? `<a href="#/read/${prev.id}"><small>Previous</small><b>${esc(prev.t)}</b></a>` : "<span></span>"}
          ${next ? `<a href="#/read/${next.id}"><small>Next</small><b>${esc(next.t)}</b></a>` : `<a href="#/library/${l.area.id}"><small>Done</small><b>Back to ${esc(l.area.title)}</b></a>`}
        </nav>
      </article>`;
    mountAllViz();
  }

  // ---------- views: lab, plan, mind, capstones, me ----------
  function viewLab(vizId) {
    destroyViz();
    if (vizId) {
      const def = VIZ.byId[vizId];
      if (!def) return viewNotFound();
      const from = (def.nodes || []).map((n) => byId[n]).filter(Boolean);
      $main.innerHTML = `
        <a class="crumb" href="#/lab">${I.back} Lab</a>
        <div style="max-width:880px">
          ${vizFigure(def, "h1")}
          ${from.length ? `<p class="muted" style="margin-top:16px">Part of: ${from.map((l) => `<a href="#/lesson/${l.id}">${esc(nodeLabel(l))} ${esc(l.title)}</a>`).join(", ")}</p>` : ""}
        </div>`;
      $main.querySelector(".viz-head h1").style.fontSize = "1.3rem";
      mountAllViz();
      return;
    }
    const groups = [];
    const listed = new Set();
    D.phases.forEach((p) => {
      const items = [];
      p.lessons.forEach((l) => (VIZ.byNode[l.id] || []).forEach((v) => { if (!listed.has(v) && v.nodes.find((n) => byId[n]) === l.id) { listed.add(v); items.push({ v, label: `${nodeLabel(l)} ${l.title}` }); } }));
      if (items.length) groups.push({ title: (p.track === "build" ? `Phase ${p.n} · ` : "") + p.title, items });
    });
    const extra = VIZ.list.filter((v) => !listed.has(v)).map((v) => ({ v, label: "Library" }));
    if (extra.length) groups.push({ title: "More explainers", items: extra });
    $main.innerHTML = `
      <div class="page-head">
        <h1>Lab</h1>
        <p>All ${VIZ.list.length} interactive explainers in one place. Before an interview, spend two minutes replaying the ones for the topics you're rusty on.</p>
      </div>
      ${groups.map((g, gi) => `<section class="lab-group" aria-labelledby="lab-${gi}">
        <h2 id="lab-${gi}">${esc(g.title)}</h2>
        <div class="lab-grid">${g.items.map(({ v, label }) => `<a class="lab-card" href="#/lab/${v.id}"><b>${esc(v.title)}</b><span>${esc(v.blurb || "")}</span><span>${esc(label)}</span></a>`).join("")}</div>
      </section>`).join("")}`;
  }

  function viewPlan() {
    if (!PLAN) return viewNotFound();
    const st = S.get();
    const p = pace();
    const now = new Date();
    const curKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
    const count = (t) => trackLessons(t).filter((l) => st.done[l.id]).length;
    const msOf = (c) => (st.cap[c] || []).length;
    const msTotal = (c) => (capById[c] || { milestones: [] }).milestones.length;
    const ready = [
      { label: "Build path nodes", got: count("build"), of: trackLessons("build").length },
      { label: "Core CS nodes", got: count("core"), of: trackLessons("core").length },
      { label: "ProntoPy problems solved", got: S.totalProblems(), of: PLAN.problemsTarget || 300 },
      { label: "Library lessons read", got: Object.keys(st.read).filter((id) => libById[id]).length, of: Math.min(LIB.length || 1, PLAN.libraryTarget || LIB.length) },
      { label: "Taskforge milestones", got: msOf("taskforge"), of: msTotal("taskforge") },
      { label: "Bazaar milestones", got: msOf("bazaar"), of: msTotal("bazaar") },
      { label: "Pulse milestones", got: msOf("pulse"), of: msTotal("pulse") },
      { label: "Mind drills (your behavioural stories)", got: Object.keys(st.mind).length, of: D.mind.length },
    ];
    $main.innerHTML = `
      <a class="crumb" href="#/today">${I.back} Today</a>
      <div class="page-head"><h1>Road to August</h1><p>${esc(PLAN.intro)}</p></div>
      <div class="me-grid">
        <section class="panel">
          <div class="muted small">Today</div>
          <h2 style="margin:4px 0 8px"><span class="pace ${p.cls}">${p.text}</span></h2>
          <p class="muted">The plan expects ${p.exp} build nodes, Core CS nodes and capstone milestones done by today. You have ${p.got}. Library: ${Object.keys(st.read).length} of ${expected("library")} expected. ProntoPy: ${S.totalProblems()} of ${expected("pronto")} expected. ${daysLeft()} days left until the end of August.</p>
          <p class="small muted" style="margin:0">${p.cls === "behind" ? "Catch up with one longer weekend block, or drop a stretch goal. Don't steal from sleep or ProntoPy." : "Keep the daily chain. Consistency beats intensity."}</p>
        </section>
        <section class="panel">
          <h2 style="margin-bottom:12px;font-size:1.25rem">Ready for tough interviews when</h2>
          <ul class="ready-list">${ready.map((r) => `<li><div class="top"><b>${esc(r.label)}</b><span>${r.got} / ${r.of}</span></div><div class="meter"><i style="width:${Math.min(100, (r.got / Math.max(1, r.of)) * 100).toFixed(1)}%"></i></div></li>`).join("")}</ul>
        </section>
      </div>
      <section class="panel" style="margin-top:16px">
        <h2 style="font-size:1.25rem">Month by month</h2>
        ${PLAN.months.map((m) => `<div class="plan-month" data-now="${m.key === curKey ? 1 : 0}">
          <div><h3>${esc(m.label)}</h3><div class="when">${m.key === curKey ? "You are here" : ""}</div></div>
          <div><p style="margin:0 0 6px"><b>${esc(m.focus)}</b></p><ul>${m.items.map((x) => `<li>${x}</li>`).join("")}</ul></div>
        </div>`).join("")}
      </section>
      <section class="panel" style="margin-top:16px"><h2 style="font-size:1.25rem;margin-bottom:8px">The honest part</h2>${PLAN.honest.map((x) => `<p>${x}</p>`).join("")}</section>`;
  }

  function viewMind() {
    const st = S.get();
    const kinds = [...new Set(D.mind.map((d) => d.kind))];
    let active = "All";
    try { active = sessionStorage.getItem("pnode:mindKind") || "All"; } catch (e) { /* storage blocked */ }
    const list = D.mind.filter((d) => active === "All" || d.kind === active);
    $main.innerHTML = `
      <a class="crumb" href="#/library">${I.back} Library</a>
      <div class="page-head"><h1>Mind</h1><p>Code is the easy part. Seniors are hired for how they break down problems, question assumptions and handle people under pressure. Five minutes a day, written down.</p></div>
      <div class="filter" role="group" aria-label="Filter drills">${["All", ...kinds].map((k) => `<button type="button" data-act="mind-filter" data-k="${esc(k)}" aria-pressed="${k === active}">${esc(k)}</button>`).join("")}</div>
      <div class="drills">${list.map((d) => `<a class="drill" href="#/drill/${d.id}" data-done="${st.mind[d.id] ? 1 : 0}"><div class="kind">${esc(d.kind)}${st.mind[d.id] ? " · done" : ""}</div><h3>${esc(d.title)}</h3><p>${esc(d.why)}</p></a>`).join("")}</div>`;
  }

  function viewDrill(id) {
    const d = drillById[id];
    if (!d) return viewNotFound();
    const saved = S.get().mind[id];
    $main.innerHTML = `
      <a class="crumb" href="#/mind">${I.back} Mind</a>
      <article style="max-width:var(--measure)">
        <div class="kind">${esc(d.kind)}</div>
        <h1 style="margin:6px 0 16px;font-size:clamp(1.9rem,4vw,2.6rem)">${esc(d.title)}</h1>
        <p class="muted" style="font-size:1.06rem">${esc(d.why)}</p>
        <div class="panel drill-card" style="margin-top:24px"><blockquote style="margin-top:0">${esc(d.prompt)}</blockquote>${d.steps && d.steps.length ? `<ol>${d.steps.map((s) => `<li>${s}</li>`).join("")}</ol>` : ""}</div>
        <section class="section">
          <h2>${I.pen} Write it out</h2>
          <label for="drill-text" class="muted">${esc(d.reflect)}</label>
          <textarea id="drill-text" style="margin-top:8px;min-height:180px" placeholder="Write at least three honest sentences.">${esc(saved ? saved.text : "")}</textarea>
          <div class="btn-row" style="margin-top:12px"><button class="btn btn-lit" type="button" data-act="save-drill" data-id="${d.id}">${saved ? "Update my answer" : `Save · +${S.XP.drill} XP`}</button>${saved ? `<span class="small muted">Saved ${esc(saved.at)}</span>` : ""}</div>
        </section>
      </article>`;
  }

  function viewCapstones() {
    const st = S.get();
    $main.innerHTML = `
      <a class="crumb" href="#/map">${I.back} Path</a>
      <div class="page-head"><h1>Capstones</h1><p>Three production-grade projects, each harder than the last. With your full-time routine, all three are in the plan: Taskforge by April, Bazaar by May, Pulse by July.</p></div>
      <div class="caps">${D.capstones.map((c) => {
        const total = c.milestones.length, got = (st.cap[c.id] || []).length;
        const after = D.phases.find((p) => p.id === c.after);
        return `<a class="cap" href="#/capstone/${c.id}"><div class="cap-tier" aria-hidden="true">${c.tier}</div><div><h2>${esc(c.name)}</h2><p class="one-liner">${esc(c.oneLiner)}</p><ul class="chips">${c.stack.map((s) => `<li>${esc(s)}</li>`).join("")}</ul><p class="small muted" style="margin:12px 0 0">${got} of ${total} milestones · best started after Phase ${after ? after.n + " (" + esc(after.title) + ")" : "—"}</p></div></a>`;
      }).join("")}</div>`;
  }

  function viewCapstone(id) {
    const c = capById[id];
    if (!c) return viewNotFound();
    const st = S.get();
    const got = st.cap[id] || [];
    $main.innerHTML = `
      <a class="crumb" href="#/capstones">${I.back} Capstones</a>
      <div class="lesson-layout">
        <article>
          <header class="lesson-head"><div class="phase-tag">Capstone ${c.tier}</div><h1>${esc(c.name)}</h1><p class="muted" style="font-size:1.1rem;max-width:60ch">${esc(c.oneLiner)}</p></header>
          <section class="section"><h2>${I.idea} Why this project</h2><p>${c.why}</p></section>
          <section class="section"><h2>${I.target} What it must do</h2><ul>${c.features.map((f) => `<li>${f}</li>`).join("")}</ul></section>
          <section class="section"><h2>${I.key} Senior signals reviewers look for</h2><ul>${c.signals.map((f) => `<li>${f}</li>`).join("")}</ul></section>
          <section class="section"><h2>${I.hammer} Milestones</h2>
            ${c.milestones.map((m, i) => `<div class="milestone" data-done="${got.includes(i) ? 1 : 0}"><h3>${esc(m.title)}</h3><ul>${m.items.map((x) => `<li>${x}</li>`).join("")}</ul><label class="check" style="padding-left:0"><input type="checkbox" data-act="milestone" data-i="${i}" ${got.includes(i) ? "checked" : ""}><span>Milestone shipped and pushed · +${S.XP.milestone} XP</span></label></div>`).join("")}
          </section>
          <section class="section"><h2>${I.bolt.replace('fill="currentColor"', 'fill="currentColor" width="22" height="22"')} Stretch goals</h2><ul>${c.stretch.map((f) => `<li>${f}</li>`).join("")}</ul></section>
          <section class="section"><h2>${I.pen} Build log</h2><label for="cap-notes" class="visually-hidden">Build log</label><textarea id="cap-notes" placeholder="Decisions you made and why. This becomes your interview story.">${esc(st.capNotes[id] || "")}</textarea></section>
        </article>
        <aside class="lesson-aside"><div class="panel"><div class="muted small">Stack</div><ul class="chips" style="margin-top:8px">${c.stack.map((s) => `<li>${esc(s)}</li>`).join("")}</ul><div class="meter" style="margin-top:20px"><i style="width:${(got.length / c.milestones.length) * 100}%"></i></div><div class="small muted">${got.length} of ${c.milestones.length} milestones</div></div></aside>
      </div>`;
    const notes = $main.querySelector("#cap-notes");
    let nt;
    notes.addEventListener("input", () => { clearTimeout(nt); nt = setTimeout(() => S.setCapNote(id, notes.value), 400); });
  }

  function viewMe() {
    const st = S.get();
    const lv = S.level();
    const theme = st.theme || "system";
    $main.innerHTML = `
      <div class="page-head"><h1>Me</h1><p>Your progress lives only in this browser. Back it up now and then so a cleared browser or a new laptop doesn't wipe your streak.</p></div>
      <div class="me-grid">
        <section class="panel">
          <h2 style="margin-bottom:12px">Your routine</h2>
          <ul class="ladder">
            <li><b>Weekdays 6:00–7:30 pm</b><span>Build 60 · Library 20 · Feed 10</span></li>
            <li><b>Weekdays 9:00–11:30 pm</b><span>ProntoPy 60 · Build 55 · Life skills 15 · Mind 10</span></li>
            <li><b>Saturday and Sunday</b><span>Capstone 2h · ProntoPy 1.5h · Library 1h · Review</span></li>
          </ul>
          <p class="small muted" style="margin-top:12px">Today picks the right block automatically. Keep one half-day a week fully off.</p>
          <h2 style="margin:24px 0 12px">ProntoPy</h2>
          <label class="small muted" for="pp-url">Your ProntoPy link (Vercel or local)</label>
          <div class="btn-row" style="margin-top:6px"><input id="pp-url" class="lib-search" style="margin:0;flex:1;min-width:200px" type="url" placeholder="https://prontopy.vercel.app" value="${esc(st.prontoUrl || "")}"><button class="btn" type="button" data-act="save-pp">Save</button></div>
          <h2 style="margin:24px 0 12px">Habits</h2>
          <div class="habit-edit">${st.habits.map((hb) => `<div class="vitem" style="display:flex;justify-content:space-between;align-items:center;gap:8px"><span>${esc(hb.name)} <span class="muted small">· ${S.habitStreak(hb.id)} day streak</span></span><button class="btn btn-quiet small" type="button" data-act="habit-remove" data-h="${esc(hb.id)}">Remove</button></div>`).join("")}</div>
          <div class="btn-row" style="margin-top:8px"><label class="visually-hidden" for="habit-new">New habit</label><input id="habit-new" class="lib-search" style="margin:0;flex:1;min-width:180px" maxlength="40" placeholder="Add a habit, e.g. No smoking"><button class="btn" type="button" data-act="habit-add">Add</button></div>
          <h2 style="margin:24px 0 12px">The ladder</h2>
          <ul class="ladder">${S.LEVELS.map((L, i) => `<li data-reached="${lv.xp >= L.xp ? 1 : 0}" data-current="${i === lv.index ? 1 : 0}"><b>${esc(L.name)}</b><span>${L.xp.toLocaleString()} XP</span></li>`).join("")}</ul>
          <p class="small muted" style="margin-top:16px">You: ${lv.xp.toLocaleString()} XP · best streak ${S.bestStreak()} days · started ${esc(st.started)}</p>
        </section>
        <section class="panel">
          <h2 style="margin-bottom:12px">How XP works</h2>
          <ul>
            <li>Build a node: ${S.XP.lesson} XP, +${S.XP.noHints} if you used no hints</li>
            <li>Each acceptance check: ${S.XP.check} XP · each interview question reviewed: ${S.XP.interview} XP</li>
            <li>Each Library lesson read: ${S.XP.read} XP · each quiz answer right first time: ${S.XP.quiz} XP</li>
            <li>Each ProntoPy problem logged: ${S.XP.problem} XP · each daily quest: ${S.XP.quest} XP</li>
            <li>Each Mind drill: ${S.XP.drill} XP · each capstone milestone: ${S.XP.milestone} XP</li>
          </ul>
          <p class="small muted">Scrolling the Feed earns nothing by itself. Only answering quizzes and reading does.</p>
          <h2 style="margin:24px 0 12px">Appearance</h2>
          <div class="filter" role="group" aria-label="Theme">${["system", "dark", "light"].map((t) => `<button type="button" data-act="theme" data-t="${t}" aria-pressed="${theme === t}">${t[0].toUpperCase() + t.slice(1)}</button>`).join("")}</div>
          <h2 style="margin:24px 0 12px">Backup</h2>
          <div class="btn-row"><button class="btn" type="button" data-act="export">Download backup file</button><label class="btn" for="import-file">Restore from file</label><input id="import-file" type="file" accept="application/json,.json" class="visually-hidden"></div>
          <p class="small muted" style="margin:16px 0 8px">Or copy your backup as text, and paste one here to restore it on another device.</p>
          <label for="backup-text" class="visually-hidden">Backup text</label>
          <textarea id="backup-text" style="min-height:90px;font-family:var(--f-code);font-size:0.8rem" placeholder="Paste a Pnode backup here"></textarea>
          <div class="btn-row" style="margin-top:8px"><button class="btn" type="button" data-act="copy-backup">Copy backup</button><button class="btn" type="button" data-act="paste-import">Restore from pasted text</button></div>
          <div style="margin-top:20px;border-top:1px solid var(--line);padding-top:12px"><button class="btn btn-quiet" type="button" data-act="reset" style="color:var(--danger)">Reset everything</button><div id="reset-zone"></div></div>
        </section>
      </div>`;
    $main.querySelector("#import-file").addEventListener("change", (e) => {
      const f = e.target.files[0];
      if (!f) return;
      f.text().then((t) => { try { S.importJson(t); toast("Progress restored"); route(); } catch (err) { toast(err.message || "That file couldn't be read."); } });
    });
    $main.querySelector("#habit-new").addEventListener("keydown", (e) => { if (e.key === "Enter") $main.querySelector("[data-act=habit-add]").click(); });
  }

  function viewNotFound() {
    $main.innerHTML = `<div class="empty"><h2>That page doesn't exist.</h2><p>It may have been renamed. Head back to today.</p><a class="btn" href="#/today">Open today</a></div>`;
  }

  // ---------- hero constellation (Today) ----------
  // Every dot is a lesson: lit amber when you've done it, dim when you haven't.
  let heroStop = null;
  function startConstellation(canvas) {
    const st = S.get();
    const items = LESSONS.map((l) => !!st.done[l.id]).concat(LIB.map((l) => !!st.read[l.id]));
    const ctx2 = canvas.getContext("2d");
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let w = 0, h = 0, raf = 0, running = true;
    let seed = 7;
    const rnd = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
    const pts = items.map((lit, i) => ({ x: rnd(), y: rnd(), vx: (rnd() - 0.5) * 0.00018, vy: (rnd() - 0.5) * 0.00018, lit, r: lit ? 2.4 : 1.4, ph: rnd() * 6.28, i }));
    function size() {
      const r = canvas.getBoundingClientRect(), dpr = Math.min(2, window.devicePixelRatio || 1);
      w = r.width; h = r.height; canvas.width = w * dpr; canvas.height = h * dpr; ctx2.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    function colors() {
      const cs = getComputedStyle(document.documentElement);
      return { lit: cs.getPropertyValue("--lit").trim() || "#F5B83D", dim: cs.getPropertyValue("--sky").trim() || "#7FB7E8" };
    }
    let col = colors();
    function frame(t) {
      if (!running) return;
      ctx2.clearRect(0, 0, w, h);
      const link = Math.min(w, h) * 0.16;
      for (const p of pts) {
        if (!reduce) { p.x += p.vx; p.y += p.vy; if (p.x < 0 || p.x > 1) p.vx *= -1; if (p.y < 0 || p.y > 1) p.vy *= -1; }
      }
      ctx2.lineWidth = 1;
      for (let a = 0; a < pts.length; a++) {
        const p = pts[a], px = p.x * w, py = p.y * h;
        for (let b = a + 1; b < pts.length; b++) {
          const q = pts[b], dx = px - q.x * w, dy = py - q.y * h, d = Math.hypot(dx, dy);
          if (d < link) {
            ctx2.strokeStyle = p.lit && q.lit ? col.lit : col.dim;
            ctx2.globalAlpha = (1 - d / link) * (p.lit && q.lit ? 0.55 : 0.12);
            ctx2.beginPath(); ctx2.moveTo(px, py); ctx2.lineTo(q.x * w, q.y * h); ctx2.stroke();
          }
        }
      }
      for (const p of pts) {
        const tw = reduce ? 1 : 0.65 + 0.35 * Math.sin(t / 900 + p.ph);
        ctx2.globalAlpha = p.lit ? tw : 0.35 * tw;
        ctx2.fillStyle = p.lit ? col.lit : col.dim;
        ctx2.beginPath(); ctx2.arc(p.x * w, p.y * h, p.r, 0, 6.283); ctx2.fill();
        if (p.lit) { ctx2.globalAlpha = 0.12 * tw; ctx2.beginPath(); ctx2.arc(p.x * w, p.y * h, p.r * 4, 0, 6.283); ctx2.fill(); }
      }
      ctx2.globalAlpha = 1;
      if (!reduce) raf = requestAnimationFrame(frame);
    }
    size();
    const ro = new ResizeObserver(() => { size(); if (reduce) frame(0); });
    ro.observe(canvas);
    const mo = new MutationObserver(() => { col = colors(); });
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
    raf = requestAnimationFrame(frame);
    return () => { running = false; cancelAnimationFrame(raf); ro.disconnect(); mo.disconnect(); };
  }
  function countUp(root) {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    root.querySelectorAll("[data-count]").forEach((el) => {
      const to = +el.dataset.count;
      if (reduce || !to) { el.textContent = to.toLocaleString(); return; }
      const t0 = performance.now(), dur = 1100;
      const step = (t) => { const k = Math.min(1, (t - t0) / dur), e = 1 - Math.pow(1 - k, 3); el.textContent = Math.round(to * e).toLocaleString(); if (k < 1) requestAnimationFrame(step); };
      requestAnimationFrame(step);
    });
  }

  // ---------- views: progress dashboard ----------
  function ring(pct, label, sub, color) {
    const r = 34, c = 2 * Math.PI * r, p = Math.max(0, Math.min(1, pct));
    return `<div class="ring-card">
      <svg viewBox="0 0 84 84" class="ring" aria-hidden="true"><circle cx="42" cy="42" r="${r}" class="ring-bg"/><circle cx="42" cy="42" r="${r}" class="ring-fg" style="stroke:${color};--c:${c.toFixed(1)};--o:${(c * (1 - p)).toFixed(1)}" stroke-dasharray="${c.toFixed(1)}" stroke-dashoffset="${c.toFixed(1)}"/></svg>
      <div class="ring-pct">${Math.round(p * 100)}%</div>
      <b>${esc(label)}</b><span class="muted small">${esc(sub)}</span>
    </div>`;
  }
  function xpBars(days) {
    const log = S.get().log, vals = [];
    for (let i = days - 1; i >= 0; i--) { const d = new Date(); d.setDate(d.getDate() - i); vals.push({ k: S.today(d), v: log[S.today(d)] || 0, d }); }
    const max = Math.max(100, ...vals.map((x) => x.v)), W = 600, H = 160, bw = W / days;
    const bars = vals.map((x, i) => { const bh = Math.max(x.v ? 3 : 0, (x.v / max) * (H - 24)); return `<rect class="xpbar" style="--i:${i}" x="${(i * bw + 2).toFixed(1)}" y="${(H - 18 - bh).toFixed(1)}" width="${(bw - 4).toFixed(1)}" height="${bh.toFixed(1)}" rx="2"><title>${x.k}: ${x.v} XP</title></rect>`; }).join("");
    const labels = vals.map((x, i) => (i % 7 === days % 7 || i === days - 1 ? `<text x="${(i * bw + bw / 2).toFixed(1)}" y="${H - 4}" text-anchor="middle">${x.d.getDate()}/${x.d.getMonth() + 1}</text>` : "")).join("");
    const total = vals.reduce((a, x) => a + x.v, 0), active = vals.filter((x) => x.v).length;
    return { svg: `<svg viewBox="0 0 ${W} ${H}" class="chart" role="img" aria-label="XP earned each day for the last ${days} days">${bars}${labels}</svg>`, total, active };
  }
  function planChart() {
    if (!PLAN) return "";
    const st = S.get();
    const start = new Date(PLAN.start + "T00:00:00"), end = new Date(PLAN.end + "T23:59:59"), now = new Date();
    const doneDates = Object.entries(st.done).filter(([id]) => byId[id]).map(([, d]) => d).concat(Object.entries(st.read).filter(([id]) => libById[id]).map(([, d]) => d)).sort();
    const exp = (d) => expected("build", d) + expected("core", d) + expected("library", d);
    const goal = exp(end), W = 600, H = 200, pad = 28;
    const X = (d) => pad + ((d - start) / (end - start)) * (W - pad * 2), Y = (v) => H - pad - (v / Math.max(1, goal)) * (H - pad * 2);
    let ep = "", ap = "";
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 7)) ep += `${ep ? "L" : "M"}${X(d).toFixed(1)},${Y(exp(d)).toFixed(1)}`;
    let n = 0, i = 0;
    for (let d = new Date(start); d <= now && d <= end; d.setDate(d.getDate() + 1)) {
      const k = S.today(d); while (i < doneDates.length && doneDates[i] <= k) { n++; i++; }
      ap += `${ap ? "L" : "M"}${X(d).toFixed(1)},${Y(n).toFixed(1)}`;
    }
    n += doneDates.length - i;
    const nx = X(Math.min(now, end));
    const months = PLAN.months.map((m) => { const d = new Date(m.ends + "T00:00:00"); return `<text x="${X(d).toFixed(1)}" y="${H - 8}" text-anchor="end">${m.label.split(" ")[0]}</text>`; }).join("");
    return `<svg viewBox="0 0 ${W} ${H}" class="chart plan-chart" role="img" aria-label="Planned versus actual: ${n} of ${goal} units done">
      <line x1="${pad}" x2="${W - pad}" y1="${H - pad}" y2="${H - pad}" class="axis"/>
      <path d="${ep}" class="exp-line"/>
      ${ap ? `<path d="${ap}" class="act-line"/>` : ""}
      <line x1="${nx.toFixed(1)}" x2="${nx.toFixed(1)}" y1="${pad / 2}" y2="${H - pad}" class="now-line"/>
      <circle cx="${nx.toFixed(1)}" cy="${Y(n).toFixed(1)}" r="5" class="act-dot"/>
      ${months}
    </svg>
    <div class="legend"><span><i class="lg exp"></i>Plan</span><span><i class="lg act"></i>You (${n} of ${goal} nodes + lessons)</span></div>`;
  }
  let pgFilter = "all";
  function rerenderProgress() {
    const y = window.scrollY;
    const open = [...$main.querySelectorAll(".pg-group")].map((d) => d.open);
    viewProgress();
    $main.querySelectorAll(".pg-group").forEach((d, i) => { if (open[i] != null) d.open = open[i]; });
    window.scrollTo(0, y);
  }
  function viewProgress() {
    const st = S.get();
    const build = trackLessons("build"), core = trackLessons("core");
    const bDone = build.filter((l) => st.done[l.id]).length, cDone = core.filter((l) => st.done[l.id]).length;
    const rDone = LIB.filter((l) => st.read[l.id]).length;
    const msTotal = D.capstones.reduce((a, c) => a + c.milestones.length, 0), msDone = D.capstones.reduce((a, c) => a + (st.cap[c.id] || []).length, 0);
    const mDone = Object.keys(st.mind).length;
    const probs = S.totalProblems(), pTarget = (PLAN && PLAN.problemsTarget) || 300;
    const qs = Object.values(st.quiz || {}), qRight = qs.filter(Boolean).length;
    const xb = xpBars(30);
    const show = (on) => pgFilter === "all" || (pgFilter === "done" ? on : !on);
    const box = (on, act, attrs, label, href, meta) => show(on) ? `<li class="pg-item ${on ? "on" : ""}"><label class="pg-check"><input type="checkbox" data-act="${act}" ${attrs} ${on ? "checked" : ""}><span class="pg-box" aria-hidden="true">${I.check}</span><span class="visually-hidden">${esc(label)}</span></label><a href="${href}">${esc(label)}</a>${meta ? `<span class="muted small">${esc(meta)}</span>` : ""}</li>` : "";
    const group = (title, items, done, total, open) => `<details class="pg-group" ${open ? "open" : ""}><summary><span class="pg-title">${esc(title)}</span><span class="pg-count">${done}/${total}</span><span class="meter pg-meter"><i style="width:${total ? (done / total) * 100 : 0}%"></i></span></summary><ul class="pg-list">${items || `<li class="muted small">Nothing here for this filter.</li>`}</ul></details>`;

    const pathHtml = D.phases.map((p, pi) => {
      const done = p.lessons.filter((l) => st.done[l.id]).length;
      return group(`${phaseLabel(p)} · ${p.title}`, p.lessons.map((l) => box(!!st.done[l.id], "pg-node", `data-id="${l.id}"`, `${nodeLabel(l)} ${l.title}`, `#/lesson/${l.id}`, st.done[l.id] ? st.done[l.id] : "")).join(""), done, p.lessons.length, pi === 0 || (done > 0 && done < p.lessons.length));
    }).join("");
    const libHtml = AREAS.map((a) => {
      const ls = areaLessons(a), done = ls.filter((l) => st.read[l.id]).length;
      return group(a.title, ls.map((l) => box(!!st.read[l.id], "pg-read", `data-id="${l.id}"`, l.t, `#/read/${l.id}`, st.read[l.id] || "")).join(""), done, ls.length, done > 0 && done < ls.length);
    }).join("");
    const capHtml = D.capstones.map((c) => {
      const got = st.cap[c.id] || [];
      return group(c.name, c.milestones.map((m, i) => box(got.includes(i), "pg-ms", `data-cap="${c.id}" data-i="${i}"`, m.title, `#/capstone/${c.id}`, "")).join(""), got.length, c.milestones.length, got.length > 0 && got.length < c.milestones.length);
    }).join("");
    const mindHtml = group("Mind drills", D.mind.filter((d) => show(!!st.mind[d.id])).map((d) => `<li class="pg-item ${st.mind[d.id] ? "on" : ""}"><span class="pg-check"><span class="pg-box ${st.mind[d.id] ? "" : "empty"}" aria-hidden="true">${I.check}</span></span><a href="#/drill/${d.id}">${esc(d.title)}</a><span class="muted small">${esc(st.mind[d.id] ? st.mind[d.id].at : d.kind)}</span></li>`).join(""), mDone, D.mind.length, false);

    // weakest areas by quiz accuracy
    const byArea = {};
    Object.entries(st.quiz || {}).forEach(([qid, ok]) => { const l = libById[qid.split("#")[0]]; if (!l) return; const a = (byArea[l.area.id] = byArea[l.area.id] || { a: l.area, n: 0, r: 0 }); a.n++; if (ok) a.r++; });
    const weak = Object.values(byArea).filter((x) => x.n >= 3).sort((x, y) => x.r / x.n - y.r / y.n).slice(0, 3);

    $main.innerHTML = `
      <div class="page-head">
        <h1>Progress</h1>
        <p>Everything you've studied, and everything still waiting. Tick boxes to mark things done (or undone) from here.</p>
      </div>
      <section class="ring-row" aria-label="Completion">
        ${ring(bDone / build.length, "Build path", `${bDone} of ${build.length} nodes`, "var(--lit)")}
        ${ring(core.length ? cDone / core.length : 0, "Core CS", `${cDone} of ${core.length} nodes`, "var(--sky)")}
        ${ring(rDone / LIB.length, "Library", `${rDone} of ${LIB.length} lessons`, "var(--mint)")}
        ${ring(msTotal ? msDone / msTotal : 0, "Capstones", `${msDone} of ${msTotal} milestones`, "var(--plum)")}
        ${ring(probs / pTarget, "ProntoPy", `${probs} of ${pTarget} problems`, "var(--lit)")}
        ${ring(mDone / D.mind.length, "Mind drills", `${mDone} of ${D.mind.length} written`, "var(--sky)")}
      </section>
      <div class="pg-charts">
        <section class="panel">
          <h2 class="pg-h">Plan vs you</h2>
          <p class="muted small">Dashed line: where the Road to August expects you. Solid line: what you've actually finished.</p>
          ${planChart()}
        </section>
        <section class="panel">
          <h2 class="pg-h">Last 30 days</h2>
          <p class="muted small">${xb.total.toLocaleString()} XP over ${plural(xb.active, "active day")} · best streak ${S.bestStreak()} days · quiz accuracy ${qs.length ? Math.round((qRight / qs.length) * 100) + "%" : "–"}</p>
          ${xb.total ? xb.svg : `<div class="chart-empty">Your first XP bar appears the moment you answer a quiz or finish a node.</div>`}
        </section>
      </div>
      <section class="panel">
        <h2 class="pg-h">Every day you showed up</h2>
        <p class="muted small">Last 26 weeks. Darker squares mean more XP that day.</p>
        <div class="heat heat-wide" aria-label="Activity over the last 26 weeks">${heatmap(26)}</div>
      </section>
      ${weak.length ? `<section class="panel"><h2 class="pg-h">Revise these next</h2><p class="muted small">Your lowest quiz accuracy so far.</p><div class="weak-row">${weak.map((x) => `<a class="weak" href="#/library/${x.a.id}"><b>${esc(x.a.title)}</b><span>${Math.round((x.r / x.n) * 100)}% right · ${x.n} answers</span></a>`).join("")}</div></section>` : ""}
      <div class="pg-filter" role="radiogroup" aria-label="Show">
        ${[["all", "Everything"], ["todo", "Not done yet"], ["done", "Done"]].map(([k, t]) => `<button type="button" class="chip ${pgFilter === k ? "on" : ""}" role="radio" aria-checked="${pgFilter === k}" data-act="pg-filter" data-f="${k}">${t}</button>`).join("")}
      </div>
      <div class="pg-cols">
        <section><h2 class="pg-h">Path nodes</h2>${pathHtml}</section>
        <section><h2 class="pg-h">Library</h2>${libHtml}</section>
        <section><h2 class="pg-h">Capstones</h2>${capHtml}<h2 class="pg-h" style="margin-top:24px">Mind</h2>${mindHtml}</section>
      </div>`;
    requestAnimationFrame(() => $main.querySelectorAll(".ring-fg").forEach((c) => c.classList.add("go")));
  }

  // ---------- views: tutor ----------
  let tutorStop = null;
  function tutorProfile() {
    const st = S.get(), lv = S.level(), nl = nextLesson("build");
    const read = LIB.filter((l) => st.read[l.id]).length;
    const recent = LIB.filter((l) => st.read[l.id]).sort((a, b) => (st.read[b.id] > st.read[a.id] ? 1 : -1)).slice(0, 5).map((l) => l.t);
    return `level ${lv.name} (${lv.xp} XP), ${Object.keys(st.done).filter((id) => byId[id]).length}/${LESSONS.length} build nodes done, current node: ${nl ? nl.title : "all done"}, ${read}/${LIB.length} library lessons read${recent.length ? " (recently: " + recent.join("; ") + ")" : ""}, ${S.totalProblems()} DSA problems solved in ProntoPy, ${S.streak()}-day streak.`;
  }
  function viewTutor(kind, id) {
    let context = null;
    if (kind === "read" && libById[id]) { const l = libById[id]; context = { title: l.t, text: strip(l.body.join("\n")) + "\nKey ideas: " + strip((l.keys || []).join("; ")) + "\nExample: " + strip(l.ex || "") }; }
    if (kind === "node" && byId[id]) { const l = byId[id]; context = { title: l.title, text: strip([l.sub, SIMPLE[l.id] || "", (l.concept || []).join("\n"), "Objectives: " + (l.objectives || []).join("; "), l.build ? "Build task: " + l.build.title + ". " + (l.build.brief || "") + " Steps: " + (l.build.steps || []).join(" | ") : ""].join("\n")).slice(0, 6000) }; }
    if (!window.PnodeTutor) { $main.innerHTML = `<p>Tutor failed to load.</p>`; return; }
    tutorStop = window.PnodeTutor.mount($main, { context, profile: tutorProfile(), toast, prefill: kind === "node" ? "I'm stuck on this build. Give me one hint, not the answer: " : "" });
  }

  // ---------- quiz answering (feed + reader) ----------
  function answer(el, qid, q, from) {
    const wrap = el.closest(".fc-quiz");
    if (wrap.dataset.done) return;
    wrap.dataset.done = "1";
    const k = Number(el.dataset.k), correct = k === q.a;
    wrap.querySelectorAll(".fc-opt").forEach((b, n) => { b.disabled = true; if (n === q.a) b.classList.add("right"); });
    if (!correct) el.classList.add("wrong");
    const why = wrap.parentElement.querySelector(".fc-why");
    if (why) { why.hidden = false; why.textContent = (correct ? "Right. " : "Not quite. ") + (q.why || ""); }
    const first = S.answerQuiz(qid, correct);
    if (from === "feed") { feedState.answered++; if (correct) feedState.right++; updatePill(); }
    if (first === true) toast(`+${S.XP.quiz} XP`);
    renderHud();
  }

  // ---------- global actions ----------
  document.addEventListener("click", (e) => {
    const el = e.target.closest("[data-act]");
    if (!el) return;
    const act = el.dataset.act;
    const parts = location.hash.replace(/^#\//, "").split("/");
    const id = parts[1];

    if (act === "pg-filter") { pgFilter = el.dataset.f; rerenderProgress(); return; }
    if (act === "start-session") { S.startSession(el.dataset.kind || currentRoutine()); renderSession(); route(); toast("Block started. Phone face down."); }
    if (act === "end-session") { S.endSession(); renderSession(); route(); }
    if (act === "hint") { S.revealHint(id); viewLesson(id); const hs = $main.querySelectorAll(".hint"); hs[hs.length - 1]?.scrollIntoView({ block: "center", behavior: "smooth" }); }
    if (act === "cancel-complete") { viewLesson(id); return; }
    if (act === "complete" || act === "complete-force") {
      const l = byId[id];
      const ticked = (S.get().checks[id] || []).length;
      if (ticked < l.checks.length && act === "complete") {
        const box = $main.querySelector(".complete-box .panel");
        box.innerHTML = `<p class="big">Only ${ticked} of ${l.checks.length} checks ticked.</p><p class="muted">Mark it built anyway? You can come back and finish the checks later.</p><div class="btn-row"><button class="btn btn-lit" type="button" data-act="complete-force">Mark as built anyway</button><button class="btn btn-quiet" type="button" data-act="cancel-complete">Keep working</button></div>`;
        box.querySelector("[data-act=complete-force]").focus();
        return;
      }
      const before = S.level().index;
      const gained = S.completeLesson(id);
      const after = S.level();
      toast(after.index > before ? `Level up: ${after.name}` : `Node built · +${gained} XP`);
      renderHud();
      viewLesson(id);
    }
    if (act === "undo") { S.uncompleteLesson(id); renderHud(); viewLesson(id); }
    if (act === "pronto") {
      const n = S.addPronto(Number(el.dataset.d));
      const t = $main.querySelector("#pronto-today"); if (t) t.textContent = n;
      if (Number(el.dataset.d) > 0) toast(`+${S.XP.problem} XP · ${S.totalProblems()} problems solved`);
      renderHud(); viewToday();
    }
    if (act === "habit") { const on = S.toggleHabit(el.dataset.h); if (on) toast("Logged. Keep the chain."); viewToday(); }
    if (act === "habit-add") { const inp = $main.querySelector("#habit-new"); const v = inp.value.trim(); if (!v) { toast("Type a habit name first."); return; } S.addHabit(v); viewMe(); toast("Habit added"); }
    if (act === "habit-remove") { S.removeHabit(el.dataset.h); viewMe(); }
    if (act === "save-pp") { const v = $main.querySelector("#pp-url").value.trim(); if (v && !/^https?:\/\//i.test(v)) { toast("Use a full link starting with https://"); return; } S.setProntoUrl(v); toast("ProntoPy link saved"); }
    if (act === "quest") { if (S.completeQuest(el.dataset.q)) { toast(`Quest complete · +${S.XP.quest} XP`); renderHud(); viewToday(); } }
    if (act === "feed-answer") {
      const card = el.closest(".fcard"), c = feedState.cards[+card.dataset.i];
      answer(el, c.qid, c.quiz, "feed");
    }
    if (act === "read-answer") {
      const box = el.closest(".rquiz"), qid = box.dataset.qid, [lid, k] = qid.split("#");
      answer(el, qid, libById[lid].quiz[+k], "read");
      const all = [...$main.querySelectorAll(".rquiz .fc-quiz")].every((w) => w.dataset.done || w.querySelector("[disabled]"));
      if (all && S.markRead(lid)) { toast(`Lesson read · +${S.XP.read} XP`); renderHud(); const cb = $main.querySelector(".complete-box"); if (cb) cb.innerHTML = `<p class="done-stamp">${I.check.replace("<svg", '<svg width="22" height="22"')} Read today</p>`; }
    }
    if (act === "mark-read") { if (S.markRead(id)) { toast(`Lesson read · +${S.XP.read} XP`); renderHud(); } viewRead(id); }
    if (act === "ask") {
      const l = byId[id];
      const text = `I'm on Pnode node "${l.title}" (${phaseLabel(l.phase)}: ${l.phase.title}). The build: ${l.build.title}. Don't give me the full code. Ask me questions and give me the smallest nudge. My doubt: `;
      (navigator.clipboard ? navigator.clipboard.writeText(text) : Promise.reject()).then(() => toast("Copied. Paste it to Claude and add your doubt."), () => toast("Couldn't copy. Long-press to copy from notes instead."));
    }
    if (act === "save-drill") {
      const text = $main.querySelector("#drill-text").value.trim();
      if (text.length < 20) { toast("Write a little more. Three honest sentences."); return; }
      const first = S.saveDrill(el.dataset.id, text);
      toast(first ? `Saved · +${S.XP.drill} XP` : "Answer updated");
      renderHud(); viewDrill(el.dataset.id);
    }
    if (act === "mind-filter") { try { sessionStorage.setItem("pnode:mindKind", el.dataset.k); } catch (err) { /* storage blocked */ } viewMind(); }
    if (act === "theme") { S.setTheme(el.dataset.t === "system" ? null : el.dataset.t); applyTheme(); viewMe(); }
    if (act === "export") {
      const blob = new Blob([S.exportJson()], { type: "application/json" });
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob); a.download = `pnode-progress-${S.today()}.json`;
      document.body.appendChild(a); a.click(); a.remove();
      toast("Backup file saved");
    }
    if (act === "copy-backup") {
      const text = S.exportJson(), box = $main.querySelector("#backup-text");
      box.value = text;
      (navigator.clipboard ? navigator.clipboard.writeText(text) : Promise.reject()).then(() => toast("Backup copied. Paste it into a note to keep it safe."), () => { box.focus(); box.select(); toast("Select all and copy the text below."); });
    }
    if (act === "paste-import") {
      const text = $main.querySelector("#backup-text").value.trim();
      if (!text) { toast("Paste a backup into the box first."); return; }
      try { S.importJson(text); toast("Progress restored"); route(); } catch (err) { toast("That text isn't a Pnode backup. Paste the whole thing, including the braces."); }
    }
    if (act === "reset") {
      const zone = $main.querySelector("#reset-zone");
      zone.innerHTML = `<p class="small" style="color:var(--danger);margin:12px 0 8px"><b>Reset all progress, notes and your streak?</b> This can't be undone unless you saved a backup.</p><div class="btn-row"><button class="btn" type="button" data-act="reset-confirm" style="border-color:var(--danger);color:var(--danger)">Yes, reset everything</button><button class="btn btn-quiet" type="button" data-act="reset-cancel">Cancel</button></div>`;
      zone.querySelector("[data-act=reset-confirm]").focus();
    }
    if (act === "reset-cancel") { $main.querySelector("#reset-zone").innerHTML = ""; }
    if (act === "reset-confirm") { S.reset(); renderHud(); toast("Progress reset"); route(); }
  });

  document.addEventListener("change", (e) => {
    const el = e.target;
    if (!el.dataset || !el.dataset.act) return;
    const id = location.hash.replace(/^#\//, "").split("/")[1];
    if (el.dataset.act === "check") {
      const on = S.toggleCheck(id, +el.dataset.i);
      if (on) toast(`+${S.XP.check} XP`);
      renderHud();
      const box = $main.querySelector(".complete-box .muted");
      if (box) box.textContent = `${(S.get().checks[id] || []).length} of ${byId[id].checks.length} checks ticked. Be honest. Interviews will be.`;
    }
    if (el.dataset.act === "pg-node") {
      const nid = el.dataset.id;
      if (el.checked) { const g = S.completeLesson(nid); if (g) toast(`${byId[nid].title} built · +${g} XP`); } else S.uncompleteLesson(nid);
      renderHud(); rerenderProgress(); return;
    }
    if (el.dataset.act === "pg-read") {
      const lid = el.dataset.id;
      if (el.checked) { if (S.markRead(lid)) toast(`Read · +${S.XP.read} XP`); } else S.unmarkRead(lid);
      renderHud(); rerenderProgress(); return;
    }
    if (el.dataset.act === "pg-ms") {
      const on = S.toggleMilestone(el.dataset.cap, +el.dataset.i);
      if (on) toast(`Milestone shipped · +${S.XP.milestone} XP`);
      renderHud(); rerenderProgress(); return;
    }
    if (el.dataset.act === "milestone") {
      const before = S.level().index;
      const on = S.toggleMilestone(id, +el.dataset.i);
      const after = S.level();
      if (on) toast(after.index > before ? `Level up: ${after.name}` : `Milestone shipped · +${S.XP.milestone} XP`);
      renderHud(); viewCapstone(id);
    }
  });

  // keyboard: j/k or arrows move through feed cards
  document.addEventListener("keydown", (e) => {
    const feed = document.getElementById("feed");
    if (!feed || /input|textarea|select/i.test(document.activeElement.tagName)) return;
    if (["ArrowDown", "j", "PageDown"].includes(e.key)) { e.preventDefault(); feed.scrollBy({ top: feed.clientHeight, behavior: "smooth" }); }
    if (["ArrowUp", "k", "PageUp"].includes(e.key)) { e.preventDefault(); feed.scrollBy({ top: -feed.clientHeight, behavior: "smooth" }); }
  });

  // ---------- router ----------
  function route() {
    destroyViz();
    if (heroStop) { heroStop(); heroStop = null; }
    if (tutorStop) { tutorStop(); tutorStop = null; }
    if (feedObserver) { feedObserver.disconnect(); feedObserver = null; }
    document.body.classList.remove("feed-mode");
    const parts = location.hash.replace(/^#\/?/, "").split("/");
    const view = parts[0] || "today";
    const navKey = { lesson: "map", drill: "library", mind: "library", capstone: "map", capstones: "map", plan: "today", read: "library" }[view] || view;
    document.querySelectorAll("[data-nav]").forEach((a) => { if (a.dataset.nav === navKey) a.setAttribute("aria-current", "page"); else a.removeAttribute("aria-current"); });
    const titles = { progress: "Progress", tutor: "Tutor", today: "Today", feed: "Feed", map: "Path", library: "Library", lab: "Lab", plan: "Road to August", mind: "Mind", capstones: "Capstones", me: "Me" };
    switch (view) {
      case "today": viewToday(); break;
      case "feed": viewFeed(); break;
      case "map": viewMap(parts[1]); break;
      case "lesson": viewLesson(parts[1]); break;
      case "library": parts[1] ? viewArea(parts[1]) : viewLibrary(); break;
      case "read": viewRead(parts[1]); break;
      case "lab": viewLab(parts[1]); break;
      case "plan": viewPlan(); break;
      case "mind": viewMind(); break;
      case "drill": viewDrill(parts[1]); break;
      case "capstones": viewCapstones(); break;
      case "capstone": viewCapstone(parts[1]); break;
      case "me": viewMe(); break;
      case "progress": viewProgress(); break;
      case "tutor": viewTutor(parts[1], parts[2]); break;
      default: viewNotFound();
    }
    const t = view === "lesson" && byId[parts[1]] ? byId[parts[1]].title
      : view === "read" && libById[parts[1]] ? libById[parts[1]].t
      : view === "library" && areaById[parts[1]] ? areaById[parts[1]].title
      : view === "drill" && drillById[parts[1]] ? drillById[parts[1]].title
      : view === "capstone" && capById[parts[1]] ? capById[parts[1]].name
      : view === "lab" && VIZ.byId[parts[1]] ? VIZ.byId[parts[1]].title
      : titles[view] || "Pnode";
    document.title = t === "Pnode" ? "Pnode" : `${t} · Pnode`;
    renderHud();
  }

  window.addEventListener("hashchange", () => { route(); window.scrollTo(0, 0); if (!document.getElementById("feed")) $main.focus({ preventScroll: true }); });
  applyTheme();
  renderSession();
  route();

  // splash: hold the intro briefly on the first open of a session, then fade it out
  (function () {
    const sp = document.getElementById("splash");
    if (!sp) return;
    if (document.documentElement.classList.contains("no-splash")) { sp.remove(); return; }
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const wait = Math.max(0, (reduce ? 400 : 1700) - performance.now());
    setTimeout(() => { sp.classList.add("out"); setTimeout(() => sp.remove(), 700); }, wait);
  })();
})();
