/* Pnode — app shell, router and views. Plain JS, no build step. */
(function () {
  const S = window.PnodeStore;
  const D = window.PNODE;
  const VIZ = window.PNODE_VIZ || { list: [], byId: {}, byNode: {}, mount() {} };
  const $main = document.getElementById("main");
  const $hud = document.getElementById("hud");
  const $toast = document.getElementById("toast");
  const $session = document.getElementById("session-bar");

  // ---------- data helpers ----------
  const TRACKS = [
    { id: "build", name: "Build path", short: "Build", note: "Your main path, in order. Web basics to senior engineering." },
    { id: "dsa", name: "DSA track", short: "DSA", note: "Runs alongside the build path, about 30 minutes a day. This is what online assessments and coding rounds test." },
    { id: "core", name: "Core CS", short: "Core CS", note: "OS, networks, DBMS, OOP and design patterns. Indian interview loops ask these often. One node most weekends." },
  ];
  const TRACK_ORDER = { build: 0, dsa: 1, core: 2 };
  D.phases.forEach((p) => { p.track = p.track || "build"; p.code = p.code != null ? String(p.code) : String(p.n); });
  D.phases.sort((a, b) => TRACK_ORDER[a.track] - TRACK_ORDER[b.track] || a.n - b.n);
  const LESSONS = [];
  D.phases.forEach((p) => p.lessons.forEach((l) => { l.phase = p; LESSONS.push(l); }));
  const byId = Object.fromEntries(LESSONS.map((l) => [l.id, l]));
  const drillById = Object.fromEntries(D.mind.map((d) => [d.id, d]));
  const capById = Object.fromEntries(D.capstones.map((c) => [c.id, c]));
  const SIMPLE = D.simple || {};
  const trackLessons = (t) => LESSONS.filter((l) => l.phase.track === t);

  const esc = (s) => String(s == null ? "" : s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const nextLesson = (track) => trackLessons(track || "build").find((l) => !S.get().done[l.id]) || null;
  const lessonXp = (l) => S.XP.lesson + l.checks.length * S.XP.check + l.iq.length * S.XP.interview;
  const ytUrl = (q) => "https://www.youtube.com/results?search_query=" + encodeURIComponent(q);
  const phaseLabel = (p) => (p.track === "build" ? `Phase ${p.n}` : p.track === "dsa" ? "DSA track" : "Core CS track");
  const nodeLabel = (l) => `${l.phase.code}.${l.phase.lessons.indexOf(l) + 1}`;

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
    tally: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 4v16M10 4v16M15 4v16M3 16l16-8"/></svg>',
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

  // ---------- toast ----------
  let toastTimer;
  function toast(msg) {
    $toast.textContent = msg;
    $toast.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => $toast.classList.remove("show"), 2600);
  }

  // ---------- HUD ----------
  function renderHud() {
    const lv = S.level();
    $hud.innerHTML =
      `<span class="hud-item flame" title="Day streak">${I.flame}<b>${S.streak()}</b></span>` +
      `<span class="hud-item" title="Total XP">${I.bolt}<b>${lv.xp.toLocaleString()}</b><span class="visually-hidden">XP</span></span>`;
  }

  // ---------- theme ----------
  function applyTheme() {
    const t = S.get().theme;
    if (t) document.documentElement.setAttribute("data-theme", t);
    else document.documentElement.removeAttribute("data-theme");
  }

  // ---------- focus session ----------
  function blocks() {
    return S.get().hours === 1
      ? [
          { name: "Learn", min: 10, what: "Read the idea, play with the explainer, skim one resource." },
          { name: "Build", min: 30, what: "Work the build challenge. Hints only when stuck for 10+ minutes.", main: true },
          { name: "DSA", min: 15, what: "One problem from your current DSA node. Say the complexity out loud." },
          { name: "Mind", min: 5, what: "One interview question out loud, or a Mind drill." },
        ]
      : [
          { name: "Learn", min: 15, what: "Read the idea, play with the explainer, skim one resource." },
          { name: "Build", min: 60, what: "Work the build challenge. Hints only when stuck for 10+ minutes.", main: true },
          { name: "DSA", min: 30, what: "One or two problems from your current DSA node. Brute force first, then optimise." },
          { name: "Interview", min: 10, what: "Answer the interview questions out loud before revealing." },
          { name: "Mind", min: 5, what: "One Mind drill or a 3-line reflection." },
        ];
  }
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
        $session.innerHTML = `<span>Session complete. That's how seniors are made.</span><span class="grow"></span><button type="button" data-act="end-session">Close</button>`;
        clearInterval(sessionTick);
        return;
      }
      const mm = String(Math.floor(remain / 60)).padStart(2, "0"), ss = String(remain % 60).padStart(2, "0");
      $session.innerHTML = `<span>${block.name}</span><span class="time">${mm}:${ss}</span><span class="grow small">${block.what}</span><button type="button" data-act="end-session">End session</button>`;
    };
    draw();
    sessionTick = setInterval(draw, 1000);
  }

  // ---------- plan & pace ----------
  const PLAN = D.plan || null;
  function unitsDone() {
    const st = S.get();
    const nodes = Object.keys(st.done).filter((id) => byId[id]).length;
    const ms = ["taskforge", "bazaar"].reduce((a, c) => a + (st.cap[c] || []).length, 0);
    return nodes + ms;
  }
  function expectedUnits(date) {
    if (!PLAN) return 0;
    const t = (date || new Date()).getTime();
    let prevT = new Date(PLAN.start + "T00:00:00").getTime(), prevU = 0;
    for (const m of PLAN.months) {
      const endT = new Date(m.ends + "T23:59:59").getTime();
      const u = m.target.build + m.target.dsa + m.target.core + m.target.milestones;
      if (t <= endT) return Math.max(0, Math.round(prevU + (u - prevU) * Math.max(0, (t - prevT) / (endT - prevT))));
      prevT = endT; prevU = u;
    }
    return prevU;
  }
  function pace() {
    const exp = expectedUnits(), got = unitsDone(), diff = got - exp;
    if (diff >= 2) return { cls: "ahead", text: `Ahead of plan by ${diff}`, exp, got };
    if (diff <= -3) return { cls: "behind", text: `Behind plan by ${-diff}`, exp, got };
    return { cls: "on", text: "On track", exp, got };
  }
  function daysLeft() {
    if (!PLAN) return 0;
    return Math.max(0, Math.ceil((new Date(PLAN.end + "T23:59:59") - new Date()) / 86400000));
  }

  // ---------- views ----------
  function viewToday() {
    const st = S.get();
    const lv = S.level();
    const nl = nextLesson("build");
    const nd = nextLesson("dsa");
    const nc = nextLesson("core");
    const doneCount = Object.keys(st.done).filter((id) => byId[id]).length;
    const hr = new Date().getHours();
    const hello = hr < 5 ? "Late night, Pank." : hr < 12 ? "Morning, Pank." : hr < 17 ? "Afternoon, Pank." : "Evening, Pank.";
    const B = blocks();
    const line = doneCount === 0
      ? `${st.hours === 1 ? "One hour" : "Two hours"} a day. You write every line. Start at the first node.`
      : `${doneCount} of ${LESSONS.length} nodes built. Keep the chain going.`;
    const weekend = [0, 6].includes(new Date().getDay());

    const dayIndex = Math.floor(Date.now() / 86400000);
    const pending = D.mind.filter((d) => !st.mind[d.id]);
    const drill = (pending.length ? pending : D.mind)[dayIndex % (pending.length || D.mind.length)];
    const p = pace();

    const side = [];
    if (nd) side.push(`<div><span class="small muted">Alongside it · DSA ${nodeLabel(nd)}</span><br><a href="#/lesson/${nd.id}">${esc(nd.title)}</a></div>`);
    if (nc) side.push(`<div><span class="small muted">${weekend ? "This weekend" : "Weekend"} · Core CS ${nodeLabel(nc)}</span><br><a href="#/lesson/${nc.id}">${esc(nc.title)}</a></div>`);

    const nextHtml = nl ? `
      <section class="panel next-node" aria-labelledby="next-title">
        ${blueprintMark}
        <div class="phase-tag">${phaseLabel(nl.phase)} · ${esc(nl.phase.title)}</div>
        <h2 id="next-title">${esc(nl.title)}</h2>
        <p class="muted">${esc(nl.sub)}</p>
        <div class="btn-row">
          <a class="btn btn-lit" href="#/lesson/${nl.id}">Open this node</a>
          ${st.session ? "" : `<button class="btn" type="button" data-act="start-session">Start my ${st.hours === 1 ? "hour" : "2 hours"}</button>`}
        </div>
        ${side.length ? `<div class="second-node">${side.join("")}</div>` : ""}
        <div class="hour">
          <h3>Your ${st.hours === 1 ? "hour" : "two hours"}</h3>
          <div class="hour-blocks" aria-hidden="true" style="grid-template-columns:${B.map((b) => b.min + "fr").join(" ")}">${B.map((b) => `<span class="${b.main ? "main" : ""}"></span>`).join("")}</div>
          <ul class="hour-legend">${B.map((b) => `<li><b>${b.min} min</b> ${b.name}</li>`).join("")}</ul>
          <p class="small muted">Change the session length on the Me page. A node usually takes ${nl.hours || 2}–${(nl.hours || 2) + 1} build hours. Progress beats pace.</p>
        </div>
      </section>` : `
      <section class="panel next-node">
        ${blueprintMark}
        <h2>Every build node is done.</h2>
        <p>Now the capstones and mock interviews carry you the rest of the way.</p>
        <a class="btn btn-lit" href="#/capstones">Go to capstones</a>
      </section>`;

    $main.innerHTML = `
      <div class="greeting">
        <h1>${hello}</h1>
        <p>${line}</p>
      </div>
      <div class="today-grid">
        <div>
          ${nextHtml}
          ${PLAN ? `<section class="panel" aria-labelledby="plan-title">
            <div class="muted small">Road to August</div>
            <h2 id="plan-title" style="margin:4px 0 8px;font-size:1.4rem"><span class="pace ${p.cls}">${p.text}</span></h2>
            <p class="muted" style="margin:0 0 12px">${p.got} of ${p.exp} planned nodes and milestones done by today · ${daysLeft()} days to the end of August</p>
            <a class="btn" href="#/plan">See the month-by-month plan</a>
          </section>` : ""}
        </div>
        <div>
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
          <section class="panel drill-card" aria-labelledby="drill-title">
            <div class="kind">${esc(drill.kind)} · today's drill</div>
            <h3 id="drill-title" style="margin-top:4px">${esc(drill.title)}</h3>
            <blockquote>${esc(drill.prompt)}</blockquote>
            <a class="btn" href="#/drill/${drill.id}">Do this drill</a>
          </section>
        </div>
      </div>`;
  }

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

  function viewMap(trackId) {
    const track = TRACKS.find((t) => t.id === trackId) || TRACKS[0];
    const st = S.get();
    const nl = nextLesson(track.id);
    const phases = D.phases.filter((p) => p.track === track.id);
    const total = trackLessons(track.id).length;
    $main.innerHTML = `
      <div class="page-head">
        <h1>The map</h1>
        <p>${LESSONS.length} nodes in three tracks. The build path is your spine. DSA and Core CS run alongside it.</p>
      </div>
      <nav class="filter" aria-label="Tracks">
        ${TRACKS.map((t) => {
          const n = trackLessons(t.id).length, d = trackLessons(t.id).filter((l) => st.done[l.id]).length;
          return `<a href="#/map/${t.id}" role="button" class="track-tab" aria-pressed="${t.id === track.id}" style="text-decoration:none">${esc(t.short)} <span class="muted">${d}/${n}</span></a>`;
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
      }).join("")}
      ${total === 0 ? `<div class="empty">This track has no nodes yet.</div>` : ""}`;
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
    const isDsa = l.phase.track === "dsa";
    const solved = (st.problems || {})[id] || 0;
    const mapHref = `#/map/${l.phase.track}`;

    $main.innerHTML = `
      <a class="crumb" href="${mapHref}">${I.back} Map</a>
      <div class="lesson-layout">
        <article>
          <header class="lesson-head">
            <div class="phase-tag">Node ${esc(nodeLabel(l))} · ${esc(l.phase.title)}</div>
            <h1>${esc(l.title)}</h1>
            <div class="meta"><span>About ${l.hours || 2} focused hours</span><span>Up to ${lessonXp(l) + S.XP.noHints} XP</span>${vizzes.length ? `<span>${vizzes.length} interactive explainer${vizzes.length > 1 ? "s" : ""}</span>` : ""}</div>
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

          ${isDsa ? `<section class="section" aria-labelledby="s-tally">
            <h2 id="s-tally">${I.tally} Problems solved on this pattern</h2>
            <div class="panel" style="display:flex;align-items:center;gap:16px;flex-wrap:wrap">
              <div class="stat"><b style="font-family:var(--f-display);font-size:2rem;font-weight:800" id="tally">${solved}</b><span class="muted small"> solved · ${S.totalProblems()} across all patterns</span></div>
              <div class="btn-row" style="margin-left:auto">
                <button class="btn" type="button" data-act="problem" data-d="-1" aria-label="Remove one">−1</button>
                <button class="btn btn-lit" type="button" data-act="problem" data-d="1">+1 solved</button>
              </div>
            </div>
            <p class="small muted">Log a problem only when you solved it yourself and can state its time and space complexity. +${S.XP.problem} XP each.</p>
          </section>` : ""}

          <section class="section" aria-labelledby="s-checks">
            <h2 id="s-checks">${I.check} Done when</h2>
            <ul class="checks">
              ${l.checks.map((c, i) => `<li><label class="check"><input type="checkbox" data-act="check" data-i="${i}" ${checks.includes(i) ? "checked" : ""}><span>${c}</span></label></li>`).join("")}
            </ul>
          </section>

          <section class="section" aria-labelledby="s-hints">
            <h2 id="s-hints">${I.key} Hints</h2>
            <p class="muted small">Open one at a time. Finish without any hint for a +${S.XP.noHints} XP bonus.</p>
            <div class="hint-list">
              ${l.hints.slice(0, hintsShown).map((h, i) => `<div class="hint"><b>Hint ${i + 1}</b>${h}</div>`).join("")}
            </div>
            ${hintsShown < l.hints.length ? `<button class="btn" type="button" data-act="hint" style="margin-top:12px">Show hint ${hintsShown + 1} of ${l.hints.length}</button>` : `<p class="small muted" style="margin-top:12px">That's every hint. The rest is yours.</p>`}
          </section>

          <section class="section" aria-labelledby="s-res">
            <h2 id="s-res">${I.book} Learn from</h2>
            <ul class="res-list">${l.res.map(resLink).join("")}</ul>
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
            <div class="btn-row" style="margin-top:12px">
              <button class="btn btn-quiet" type="button" data-act="ask">${I.chat.replace("<svg", '<svg width="18" height="18"')} Copy a question for Claude</button>
            </div>
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
    D.phases.forEach((p) => {
      const items = [];
      p.lessons.forEach((l) => (VIZ.byNode[l.id] || []).forEach((v) => { if (!items.some((x) => x.v === v) && v.nodes[0] === l.id) items.push({ v, l }); }));
      if (items.length) groups.push({ p, items });
    });
    $main.innerHTML = `
      <div class="page-head">
        <h1>Lab</h1>
        <p>All ${VIZ.list.length} interactive explainers in one place. Before an interview, spend two minutes replaying the ones for the topics you're rusty on.</p>
      </div>
      ${groups.map(({ p, items }) => `<section class="lab-group" aria-labelledby="lab-${p.id}">
        <h2 id="lab-${p.id}">${esc(p.track === "build" ? `Phase ${p.n} · ` : "")}${esc(p.title)}</h2>
        <div class="lab-grid">${items.map(({ v, l }) => `<a class="lab-card" href="#/lab/${v.id}"><b>${esc(v.title)}</b><span>${esc(v.blurb || "")}</span><span>${esc(nodeLabel(l))} ${esc(l.title)}</span></a>`).join("")}</div>
      </section>`).join("")}`;
  }

  function viewPlan() {
    if (!PLAN) return viewNotFound();
    const st = S.get();
    const p = pace();
    const now = new Date();
    const curKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
    const count = (t) => trackLessons(t).filter((l) => st.done[l.id]).length;
    const ms = (c) => (st.cap[c] || []).length;
    const ready = [
      { label: "Build path nodes", got: count("build"), of: trackLessons("build").length },
      { label: "DSA track nodes", got: count("dsa"), of: trackLessons("dsa").length },
      { label: "DSA problems solved", got: S.totalProblems(), of: PLAN.problemsTarget || 150 },
      { label: "Core CS nodes", got: count("core"), of: trackLessons("core").length },
      { label: "Taskforge milestones (capstone 1)", got: ms("taskforge"), of: (capById.taskforge || { milestones: [] }).milestones.length },
      { label: "Bazaar milestones (capstone 2)", got: ms("bazaar"), of: (capById.bazaar || { milestones: [] }).milestones.length },
      { label: "Mind drills (your behavioural stories)", got: Object.keys(st.mind).length, of: D.mind.length },
    ];
    $main.innerHTML = `
      <div class="page-head">
        <h1>Road to August</h1>
        <p>${esc(PLAN.intro)}</p>
      </div>
      <div class="me-grid">
        <section class="panel">
          <div class="muted small">Today</div>
          <h2 style="margin:4px 0 8px"><span class="pace ${p.cls}">${p.text}</span></h2>
          <p class="muted">The plan expects ${p.exp} nodes and capstone milestones done by today. You have ${p.got}. ${daysLeft()} days left until the end of August.</p>
          <p class="small muted" style="margin:0">${p.cls === "behind" ? "Catch up with one longer weekend session, or drop a stretch goal. Don't skip DSA days to catch up on building." : "Keep the daily chain. Consistency beats intensity."}</p>
        </section>
        <section class="panel">
          <h2 style="margin-bottom:12px;font-size:1.25rem">Ready for tough interviews when</h2>
          <ul class="ready-list">
            ${ready.map((r) => `<li><div class="top"><b>${esc(r.label)}</b><span>${r.got} / ${r.of}</span></div><div class="meter"><i style="width:${Math.min(100, (r.got / Math.max(1, r.of)) * 100).toFixed(1)}%"></i></div></li>`).join("")}
          </ul>
          <p class="small muted" style="margin:12px 0 0">Plus: 5 timed system designs, 4 machine coding builds and 2 full mock loops, all inside Phase 8.</p>
        </section>
      </div>
      <section class="panel" style="margin-top:16px">
        <h2 style="font-size:1.25rem">Month by month</h2>
        ${PLAN.months.map((m) => `<div class="plan-month" data-now="${m.key === curKey ? 1 : 0}">
          <div><h3>${esc(m.label)}</h3><div class="when">${m.key === curKey ? "You are here" : ""}</div></div>
          <div>
            <p style="margin:0 0 6px"><b>${esc(m.focus)}</b></p>
            <ul>${m.items.map((x) => `<li>${x}</li>`).join("")}</ul>
          </div>
        </div>`).join("")}
      </section>
      <section class="panel" style="margin-top:16px">
        <h2 style="font-size:1.25rem;margin-bottom:8px">The honest part</h2>
        ${PLAN.honest.map((x) => `<p>${x}</p>`).join("")}
      </section>`;
  }

  function viewMind() {
    const st = S.get();
    const kinds = [...new Set(D.mind.map((d) => d.kind))];
    let active = "All";
    try { active = sessionStorage.getItem("pnode:mindKind") || "All"; } catch (e) { /* storage blocked */ }
    const list = D.mind.filter((d) => active === "All" || d.kind === active);
    $main.innerHTML = `
      <div class="page-head">
        <h1>Mind</h1>
        <p>Code is the easy part. Seniors are hired for how they break down problems, question assumptions and handle people under pressure. Five minutes a day, written down.</p>
      </div>
      <div class="filter" role="group" aria-label="Filter drills">
        ${["All", ...kinds].map((k) => `<button type="button" data-act="mind-filter" data-k="${esc(k)}" aria-pressed="${k === active}">${esc(k)}</button>`).join("")}
      </div>
      <div class="drills">
        ${list.map((d) => `<a class="drill" href="#/drill/${d.id}" data-done="${st.mind[d.id] ? 1 : 0}">
          <div class="kind">${esc(d.kind)}${st.mind[d.id] ? " · done" : ""}</div>
          <h3>${esc(d.title)}</h3>
          <p>${esc(d.why)}</p>
        </a>`).join("")}
      </div>`;
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
        <div class="panel drill-card" style="margin-top:24px">
          <blockquote style="margin-top:0">${esc(d.prompt)}</blockquote>
          ${d.steps && d.steps.length ? `<ol>${d.steps.map((s) => `<li>${s}</li>`).join("")}</ol>` : ""}
        </div>
        <section class="section">
          <h2>${I.pen} Write it out</h2>
          <label for="drill-text" class="muted">${esc(d.reflect)}</label>
          <textarea id="drill-text" style="margin-top:8px;min-height:180px" placeholder="Write at least three honest sentences.">${esc(saved ? saved.text : "")}</textarea>
          <div class="btn-row" style="margin-top:12px">
            <button class="btn btn-lit" type="button" data-act="save-drill" data-id="${d.id}">${saved ? "Update my answer" : `Save · +${S.XP.drill} XP`}</button>
            ${saved ? `<span class="small muted">Saved ${esc(saved.at)}</span>` : ""}
          </div>
        </section>
      </article>`;
  }

  function viewCapstones() {
    const st = S.get();
    $main.innerHTML = `
      <div class="page-head">
        <h1>Capstones</h1>
        <p>Three production-grade projects, each harder than the last. These are what you show in interviews: real users, real tradeoffs, real deployments. By August, finish Taskforge and Bazaar properly. Pulse is your stretch goal.</p>
      </div>
      <div class="caps">
        ${D.capstones.map((c) => {
          const total = c.milestones.length, got = (st.cap[c.id] || []).length;
          const after = D.phases.find((p) => p.id === c.after);
          return `<a class="cap" href="#/capstone/${c.id}">
            <div class="cap-tier" aria-hidden="true">${c.tier}</div>
            <div>
              <h2>${esc(c.name)}</h2>
              <p class="one-liner">${esc(c.oneLiner)}</p>
              <ul class="chips">${c.stack.map((s) => `<li>${esc(s)}</li>`).join("")}</ul>
              <p class="small muted" style="margin:12px 0 0">${got} of ${total} milestones · best started after Phase ${after ? after.n + " (" + esc(after.title) + ")" : "—"}</p>
            </div>
          </a>`;
        }).join("")}
      </div>`;
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
          <header class="lesson-head">
            <div class="phase-tag">Capstone ${c.tier}</div>
            <h1>${esc(c.name)}</h1>
            <p class="muted" style="font-size:1.1rem;max-width:60ch">${esc(c.oneLiner)}</p>
          </header>
          <section class="section"><h2>${I.idea} Why this project</h2><p>${c.why}</p></section>
          <section class="section"><h2>${I.target} What it must do</h2><ul>${c.features.map((f) => `<li>${f}</li>`).join("")}</ul></section>
          <section class="section"><h2>${I.key} Senior signals reviewers look for</h2><ul>${c.signals.map((f) => `<li>${f}</li>`).join("")}</ul></section>
          <section class="section"><h2>${I.hammer} Milestones</h2>
            ${c.milestones.map((m, i) => `<div class="milestone" data-done="${got.includes(i) ? 1 : 0}">
              <h3>${esc(m.title)}</h3>
              <ul>${m.items.map((x) => `<li>${x}</li>`).join("")}</ul>
              <label class="check" style="padding-left:0"><input type="checkbox" data-act="milestone" data-i="${i}" ${got.includes(i) ? "checked" : ""}><span>Milestone shipped and pushed · +${S.XP.milestone} XP</span></label>
            </div>`).join("")}
          </section>
          <section class="section"><h2>${I.bolt.replace('fill="currentColor"', 'fill="currentColor" width="22" height="22"')} Stretch goals</h2><ul>${c.stretch.map((f) => `<li>${f}</li>`).join("")}</ul></section>
          <section class="section"><h2>${I.pen} Build log</h2>
            <label for="cap-notes" class="visually-hidden">Build log</label>
            <textarea id="cap-notes" placeholder="Decisions you made and why. This becomes your interview story.">${esc(st.capNotes[id] || "")}</textarea>
          </section>
        </article>
        <aside class="lesson-aside">
          <div class="panel">
            <div class="muted small">Stack</div>
            <ul class="chips" style="margin-top:8px">${c.stack.map((s) => `<li>${esc(s)}</li>`).join("")}</ul>
            <div class="meter" style="margin-top:20px"><i style="width:${(got.length / c.milestones.length) * 100}%"></i></div>
            <div class="small muted">${got.length} of ${c.milestones.length} milestones</div>
          </div>
        </aside>
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
          <h2 style="margin-bottom:12px">The ladder</h2>
          <ul class="ladder">${S.LEVELS.map((L, i) => `<li data-reached="${lv.xp >= L.xp ? 1 : 0}" data-current="${i === lv.index ? 1 : 0}"><b>${esc(L.name)}</b><span>${L.xp.toLocaleString()} XP</span></li>`).join("")}</ul>
          <p class="small muted" style="margin-top:16px">You: ${lv.xp.toLocaleString()} XP · best streak ${S.bestStreak()} days · started ${esc(st.started)}</p>
          <h2 style="margin:24px 0 12px">How XP works</h2>
          <ul>
            <li>Build a node: ${S.XP.lesson} XP, +${S.XP.noHints} if you used no hints</li>
            <li>Each acceptance check: ${S.XP.check} XP</li>
            <li>Each interview question reviewed: ${S.XP.interview} XP</li>
            <li>Each DSA problem logged: ${S.XP.problem} XP</li>
            <li>Each Mind drill: ${S.XP.drill} XP</li>
            <li>Each capstone milestone: ${S.XP.milestone} XP</li>
          </ul>
          <p class="small muted">Any XP on a day keeps your streak alive.</p>
        </section>
        <section class="panel">
          <h2 style="margin-bottom:12px">Daily session</h2>
          <div class="filter" role="group" aria-label="Session length">
            ${[1, 2].map((n) => `<button type="button" data-act="hours" data-n="${n}" aria-pressed="${(st.hours || 2) === n}">${n === 1 ? "1 hour" : "2 hours"}</button>`).join("")}
          </div>
          <p class="small muted">${(st.hours || 2) === 2 ? "Learn 15 · Build 60 · DSA 30 · Interview 10 · Mind 5." : "Learn 10 · Build 30 · DSA 15 · Mind 5. On this pace the full path takes about twice as long."}</p>
          <h2 style="margin:24px 0 12px">Appearance</h2>
          <div class="filter" role="group" aria-label="Theme">
            ${["system", "dark", "light"].map((t) => `<button type="button" data-act="theme" data-t="${t}" aria-pressed="${theme === t}">${t[0].toUpperCase() + t.slice(1)}</button>`).join("")}
          </div>
          <h2 style="margin:24px 0 12px">Backup</h2>
          <div class="btn-row">
            <button class="btn" type="button" data-act="export">Download backup file</button>
            <label class="btn" for="import-file">Restore from file</label>
            <input id="import-file" type="file" accept="application/json,.json" class="visually-hidden">
          </div>
          <p class="small muted" style="margin:16px 0 8px">Or copy your backup as text, and paste one here to restore it on another device.</p>
          <label for="backup-text" class="visually-hidden">Backup text</label>
          <textarea id="backup-text" style="min-height:90px;font-family:var(--f-code);font-size:0.8rem" placeholder="Paste a Pnode backup here"></textarea>
          <div class="btn-row" style="margin-top:8px">
            <button class="btn" type="button" data-act="copy-backup">Copy backup</button>
            <button class="btn" type="button" data-act="paste-import">Restore from pasted text</button>
          </div>
          <div style="margin-top:20px;border-top:1px solid var(--line);padding-top:12px">
            <button class="btn btn-quiet" type="button" data-act="reset" style="color:var(--danger)">Reset everything</button>
            <div id="reset-zone"></div>
          </div>
        </section>
      </div>`;
    $main.querySelector("#import-file").addEventListener("change", (e) => {
      const f = e.target.files[0];
      if (!f) return;
      f.text().then((t) => {
        try { S.importJson(t); toast("Progress restored"); route(); }
        catch (err) { toast(err.message || "That file couldn't be read."); }
      });
    });
  }

  function viewNotFound() {
    $main.innerHTML = `<div class="empty"><h2>That page doesn't exist.</h2><p>It may have been renamed. Head back to the map.</p><a class="btn" href="#/map">Open the map</a></div>`;
  }

  // ---------- global actions ----------
  document.addEventListener("click", (e) => {
    const el = e.target.closest("[data-act]");
    if (!el) return;
    const act = el.dataset.act;
    const parts = location.hash.replace(/^#\//, "").split("/");
    const id = parts[1];

    if (act === "start-session") { S.startSession(); renderSession(); route(); toast("Session started. Phone face down."); }
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
    if (act === "problem") {
      const n = S.addProblem(id, Number(el.dataset.d));
      const t = $main.querySelector("#tally");
      if (t) t.textContent = n;
      if (Number(el.dataset.d) > 0) toast(`+${S.XP.problem} XP · ${S.totalProblems()} problems solved`);
      renderHud();
    }
    if (act === "ask") {
      const l = byId[id];
      const text = `I'm on Pnode node "${l.title}" (${phaseLabel(l.phase)}: ${l.phase.title}). The build: ${l.build.title}. Don't give me the full code. Ask me questions and give me the smallest nudge. My doubt: `;
      (navigator.clipboard ? navigator.clipboard.writeText(text) : Promise.reject()).then(
        () => toast("Copied. Paste it to Claude and add your doubt."),
        () => toast("Couldn't copy. Long-press to copy from notes instead.")
      );
    }
    if (act === "save-drill") {
      const text = $main.querySelector("#drill-text").value.trim();
      if (text.length < 20) { toast("Write a little more. Three honest sentences."); return; }
      const first = S.saveDrill(el.dataset.id, text);
      toast(first ? `Saved · +${S.XP.drill} XP` : "Answer updated");
      renderHud();
      viewDrill(el.dataset.id);
    }
    if (act === "mind-filter") { try { sessionStorage.setItem("pnode:mindKind", el.dataset.k); } catch (e) { /* storage blocked */ } viewMind(); }
    if (act === "theme") { S.setTheme(el.dataset.t === "system" ? null : el.dataset.t); applyTheme(); viewMe(); }
    if (act === "hours") { S.setHours(Number(el.dataset.n)); renderSession(); viewMe(); toast(`Daily session: ${el.dataset.n === "1" ? "1 hour" : "2 hours"}`); }
    if (act === "export") {
      const blob = new Blob([S.exportJson()], { type: "application/json" });
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = `pnode-progress-${S.today()}.json`;
      document.body.appendChild(a); a.click(); a.remove();
      toast("Backup file saved");
    }
    if (act === "copy-backup") {
      const text = S.exportJson();
      const box = $main.querySelector("#backup-text");
      box.value = text;
      (navigator.clipboard ? navigator.clipboard.writeText(text) : Promise.reject()).then(
        () => toast("Backup copied. Paste it into a note to keep it safe."),
        () => { box.focus(); box.select(); toast("Select all and copy the text below."); }
      );
    }
    if (act === "paste-import") {
      const text = $main.querySelector("#backup-text").value.trim();
      if (!text) { toast("Paste a backup into the box first."); return; }
      try { S.importJson(text); toast("Progress restored"); route(); }
      catch (err) { toast("That text isn't a Pnode backup. Paste the whole thing, including the braces."); }
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
    if (el.dataset.act === "milestone") {
      const before = S.level().index;
      const on = S.toggleMilestone(id, +el.dataset.i);
      const after = S.level();
      if (on) toast(after.index > before ? `Level up: ${after.name}` : `Milestone shipped · +${S.XP.milestone} XP`);
      renderHud();
      viewCapstone(id);
    }
  });

  // ---------- router ----------
  function route() {
    destroyViz();
    const parts = location.hash.replace(/^#\/?/, "").split("/");
    const view = parts[0] || "today";
    const navKey = { lesson: "map", drill: "mind", capstone: "capstones", plan: "today" }[view] || view;
    document.querySelectorAll("[data-nav]").forEach((a) => {
      if (a.dataset.nav === navKey) a.setAttribute("aria-current", "page"); else a.removeAttribute("aria-current");
    });
    const titles = { today: "Today", map: "Map", lab: "Lab", plan: "Road to August", mind: "Mind", capstones: "Capstones", me: "Me" };
    switch (view) {
      case "today": viewToday(); break;
      case "map": viewMap(parts[1]); break;
      case "lesson": viewLesson(parts[1]); break;
      case "lab": viewLab(parts[1]); break;
      case "plan": viewPlan(); break;
      case "mind": viewMind(); break;
      case "drill": viewDrill(parts[1]); break;
      case "capstones": viewCapstones(); break;
      case "capstone": viewCapstone(parts[1]); break;
      case "me": viewMe(); break;
      default: viewNotFound();
    }
    const t = view === "lesson" && byId[parts[1]] ? byId[parts[1]].title
      : view === "drill" && drillById[parts[1]] ? drillById[parts[1]].title
      : view === "capstone" && capById[parts[1]] ? capById[parts[1]].name
      : view === "lab" && VIZ.byId[parts[1]] ? VIZ.byId[parts[1]].title
      : titles[view] || "Pnode";
    document.title = t === "Pnode" ? "Pnode" : `${t} · Pnode`;
    renderHud();
  }

  window.addEventListener("hashchange", () => { route(); window.scrollTo(0, 0); $main.focus({ preventScroll: true }); });
  applyTheme();
  renderSession();
  route();
})();
