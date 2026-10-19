/* Pnode — app shell, router and views. Plain JS, no build step. */
(function () {
  const S = window.PnodeStore;
  const D = window.PNODE;
  const $main = document.getElementById("main");
  const $hud = document.getElementById("hud");
  const $toast = document.getElementById("toast");
  const $session = document.getElementById("session-bar");

  // ---------- data helpers ----------
  D.phases.sort((a, b) => a.n - b.n);
  const LESSONS = [];
  D.phases.forEach((p) => p.lessons.forEach((l) => { l.phase = p; LESSONS.push(l); }));
  const byId = Object.fromEntries(LESSONS.map((l) => [l.id, l]));
  const drillById = Object.fromEntries(D.mind.map((d) => [d.id, d]));
  const capById = Object.fromEntries(D.capstones.map((c) => [c.id, c]));

  const esc = (s) => String(s == null ? "" : s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const nextLesson = () => LESSONS.find((l) => !S.get().done[l.id]) || null;
  const lessonXp = (l) => S.XP.lesson + l.checks.length * S.XP.check + l.iq.length * S.XP.interview;
  const ytUrl = (q) => "https://www.youtube.com/results?search_query=" + encodeURIComponent(q);

  // ---------- icons ----------
  const I = {
    doc: '<svg viewBox="0 0 24 24"><path d="M6 3h8l4 4v14H6z"/><path d="M14 3v4h4M9 12h6M9 16h6"/></svg>',
    video: '<svg viewBox="0 0 24 24"><rect x="3" y="5" width="18" height="14" rx="3"/><path d="M10 9l5 3-5 3z"/></svg>',
    course: '<svg viewBox="0 0 24 24"><path d="M2 8l10-5 10 5-10 5z"/><path d="M6 10v5c3 2.5 9 2.5 12 0v-5"/></svg>',
    tool: '<svg viewBox="0 0 24 24"><path d="M14.7 6.3a4 4 0 0 0-5.4 5.4L3 18l3 3 6.3-6.3a4 4 0 0 0 5.4-5.4l-2.5 2.5-2.5-.5-.5-2.5z"/></svg>',
    flame: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2c1 4 5 5.5 5 11a5 5 0 0 1-10 0c0-2.5 1.2-4 2.5-5 .2 1.8 1 3 2.2 3.5C11 9 11.5 5 12 2z"/></svg>',
    bolt: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M13 2L4 14h7l-1 8 9-12h-7z"/></svg>',
    idea: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18h6M10 21h4M12 3a6 6 0 0 0-3.5 10.9c.6.5 1 1.2 1 2V16h5v-.1c0-.8.4-1.5 1-2A6 6 0 0 0 12 3z"/></svg>',
    hammer: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 4l6 6-3 3-6-6zM11 7L3 15l3 3 8-8"/></svg>',
    check: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 12l5 5L20 6"/></svg>',
    key: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="8" cy="15" r="4"/><path d="M11 12l9-9M17 6l3 3"/></svg>',
    book: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 4h6a2 2 0 0 1 2 2v14a2 2 0 0 0-2-2H4zM20 4h-6a2 2 0 0 0-2 2v14a2 2 0 0 1 2-2h6z"/></svg>',
    chat: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12z"/></svg>',
    pen: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 20h4L19 9l-4-4L4 16z"/></svg>',
    back: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M15 18l-6-6 6-6"/></svg>',
    target: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1.5"/></svg>',
  };
  const blueprintMark = '<svg class="blueprint-mark" viewBox="0 0 200 200" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><circle cx="100" cy="100" r="80"/><circle cx="100" cy="100" r="50" stroke-dasharray="4 6"/><circle cx="100" cy="100" r="12" fill="currentColor"/><path d="M100 0v200M0 100h200"/></svg>';

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

  // ---------- focus hour ----------
  const HOUR = [
    { name: "Learn", min: 10, what: "Read the concept and one resource." },
    { name: "Build", min: 35, what: "Work the build challenge. Hints only when stuck for 10+ minutes." },
    { name: "Interview", min: 10, what: "Answer the interview questions out loud before revealing." },
    { name: "Mind", min: 5, what: "One Mind drill or a 3-line reflection." },
  ];
  let sessionTick;
  function renderSession() {
    const s = S.get().session;
    clearInterval(sessionTick);
    if (!s) { $session.hidden = true; return; }
    $session.hidden = false;
    const draw = () => {
      const elapsed = Math.floor((Date.now() - s.start) / 1000);
      let acc = 0, block = null, remain = 0;
      for (const b of HOUR) { acc += b.min * 60; if (elapsed < acc) { block = b; remain = acc - elapsed; break; } }
      if (!block) {
        $session.innerHTML = `<span>Hour complete. That's how seniors are made.</span><span class="grow"></span><button type="button" data-act="end-session">Close</button>`;
        clearInterval(sessionTick);
        return;
      }
      const mm = String(Math.floor(remain / 60)).padStart(2, "0"), ss = String(remain % 60).padStart(2, "0");
      $session.innerHTML = `<span>${block.name}</span><span class="time">${mm}:${ss}</span><span class="grow small">${block.what}</span><button type="button" data-act="end-session">End hour</button>`;
    };
    draw();
    sessionTick = setInterval(draw, 1000);
  }

  // ---------- views ----------
  function viewToday() {
    const st = S.get();
    const lv = S.level();
    const nl = nextLesson();
    const doneCount = Object.keys(st.done).length;
    const hr = new Date().getHours();
    const hello = hr < 5 ? "Late night, Pank." : hr < 12 ? "Morning, Pank." : hr < 17 ? "Afternoon, Pank." : "Evening, Pank.";
    const line = doneCount === 0
      ? "One hour a day. You write every line. Start at the first node."
      : `${doneCount} of ${LESSONS.length} nodes built. Keep the chain going.`;

    // daily drill: rotate by day so it changes each day
    const dayIndex = Math.floor(Date.now() / 86400000);
    const pending = D.mind.filter((d) => !st.mind[d.id]);
    const drill = (pending.length ? pending : D.mind)[dayIndex % (pending.length || D.mind.length)];

    const nextHtml = nl ? `
      <section class="panel next-node" aria-labelledby="next-title">
        ${blueprintMark}
        <div class="phase-tag">Phase ${nl.phase.n} · ${esc(nl.phase.title)}</div>
        <h2 id="next-title">${esc(nl.title)}</h2>
        <p class="muted">${esc(nl.sub)}</p>
        <div class="btn-row">
          <a class="btn btn-lit" href="#/lesson/${nl.id}">Open this node</a>
          ${st.session ? "" : '<button class="btn" type="button" data-act="start-session">Start my hour</button>'}
        </div>
        <div class="hour">
          <h3>Your hour</h3>
          <div class="hour-blocks" aria-hidden="true"><span></span><span></span><span></span><span></span></div>
          <ul class="hour-legend">${HOUR.map((b) => `<li><b>${b.min} min</b> ${b.name}</li>`).join("")}</ul>
          <p class="small muted">Hours spill over? Fine. A node usually takes ${nl.hours || 2}–${(nl.hours || 2) + 1} hours. Progress beats pace.</p>
        </div>
      </section>` : `
      <section class="panel next-node">
        ${blueprintMark}
        <h2>Every node is built.</h2>
        <p>Now the capstones carry you the rest of the way.</p>
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
              <div class="stat"><b>${Object.keys(st.mind).length}</b><span>Mind drills</span></div>
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
    start.setDate(end.getDate() - (weeks * 7 - 1) - end.getDay()); // align columns to Sunday
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

  function viewMap() {
    const st = S.get();
    const nl = nextLesson();
    $main.innerHTML = `
      <div class="page-head">
        <h1>The map</h1>
        <p>${LESSONS.length} nodes across ${D.phases.length} phases, from your first HTML page to the system design round. Follow the order. Each phase builds on the one before it.</p>
      </div>
      ${D.phases.map((p) => {
        const done = p.lessons.filter((l) => st.done[l.id]).length;
        return `
        <section class="phase" aria-labelledby="ph-${p.id}">
          <div class="phase-head">
            <div class="phase-num" aria-hidden="true">${p.n}</div>
            <h2 id="ph-${p.id}">${esc(p.title)}</h2>
            <p>${esc(p.tagline)}</p>
            <div class="phase-progress">${done} of ${p.lessons.length} built</div>
          </div>
          <ol class="trail">
            ${p.lessons.map((l, i) => {
              const state = st.done[l.id] ? "done" : nl && nl.id === l.id ? "next" : "open";
              return `<li><a class="node" data-state="${state}" href="#/lesson/${l.id}">
                <span class="node-dot">${state === "done" ? "✓" : `${p.n}.${i + 1}`}</span>
                <span><span class="node-title">${esc(l.title)}</span><br><span class="node-sub">${esc(l.sub)}</span></span>
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
    const l = byId[id];
    if (!l) return viewNotFound();
    const st = S.get();
    const idx = LESSONS.indexOf(l);
    const prev = LESSONS[idx - 1], next = LESSONS[idx + 1];
    const checks = st.checks[id] || [];
    const hintsShown = st.hints[id] || 0;
    const iqSeen = st.iq[id] || [];
    const done = !!st.done[id];
    const posInPhase = l.phase.lessons.indexOf(l) + 1;

    $main.innerHTML = `
      <a class="crumb" href="#/map">${I.back} Map</a>
      <div class="lesson-layout">
        <article>
          <header class="lesson-head">
            <div class="phase-tag">Node ${l.phase.n}.${posInPhase} · ${esc(l.phase.title)}</div>
            <h1>${esc(l.title)}</h1>
            <div class="meta"><span>About ${l.hours || 2} focused hours</span><span>Up to ${lessonXp(l) + S.XP.noHints} XP</span></div>
          </header>

          <section class="section" aria-labelledby="s-concept">
            <h2 id="s-concept">${I.idea} The idea</h2>
            <div class="concept">${l.concept.map((p) => `<p>${p}</p>`).join("")}</div>
            ${l.objectives && l.objectives.length ? `<p class="muted" style="margin-top:16px"><b>By the end you can:</b></p><ul>${l.objectives.map((o) => `<li>${o}</li>`).join("")}</ul>` : ""}
          </section>

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
            ${l.iq.map((q, i) => `<details class="iq" data-i="${i}" ${iqSeen.includes(i) ? "" : ""}><summary>${esc(q.q)}</summary><div class="answer"><p>${q.a}</p></div></details>`).join("")}
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
            <div class="muted small">Phase ${l.phase.n}</div>
            <h3 style="margin:4px 0 12px">${esc(l.phase.title)}</h3>
            <ol class="small" style="padding-left:1.2em;margin:0">
              ${l.phase.lessons.map((x) => `<li>${x.id === id ? `<b>${esc(x.title)}</b>` : `<a href="#/lesson/${x.id}" style="color:${st.done[x.id] ? "var(--lit)" : "var(--ink-2)"}">${esc(x.title)}</a>`}</li>`).join("")}
            </ol>
          </div>
        </aside>
      </div>`;

    // events specific to this view
    $main.querySelectorAll("details.iq").forEach((d) => d.addEventListener("toggle", () => {
      if (d.open && S.toggleIq(id, +d.dataset.i, true)) { toast(`+${S.XP.interview} XP · question reviewed`); renderHud(); }
    }));
    const notes = $main.querySelector("#notes");
    let nt;
    notes.addEventListener("input", () => { clearTimeout(nt); nt = setTimeout(() => S.setNote(id, notes.value), 400); });
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
        <p>Three production-grade projects, each harder than the last. These are what you show in interviews: real users, real tradeoffs, real deployments. Start each one when its phase is built.</p>
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
      <div class="page-head"><h1>Me</h1><p>Your progress lives only in this browser. Export it now and then so a cleared browser or a new laptop doesn't wipe your streak.</p></div>
      <div class="me-grid">
        <section class="panel">
          <h2 style="margin-bottom:12px">The ladder</h2>
          <ul class="ladder">${S.LEVELS.map((L, i) => `<li data-reached="${lv.xp >= L.xp ? 1 : 0}" data-current="${i === lv.index ? 1 : 0}"><b>${esc(L.name)}</b><span>${L.xp.toLocaleString()} XP</span></li>`).join("")}</ul>
          <p class="small muted" style="margin-top:16px">You: ${lv.xp.toLocaleString()} XP · best streak ${S.bestStreak()} days · started ${esc(st.started)}</p>
        </section>
        <section class="panel">
          <h2 style="margin-bottom:12px">How XP works</h2>
          <ul>
            <li>Build a node: ${S.XP.lesson} XP, +${S.XP.noHints} if you used no hints</li>
            <li>Each acceptance check: ${S.XP.check} XP</li>
            <li>Each interview question reviewed: ${S.XP.interview} XP</li>
            <li>Each Mind drill: ${S.XP.drill} XP</li>
            <li>Each capstone milestone: ${S.XP.milestone} XP</li>
          </ul>
          <p class="small muted">Any XP on a day keeps your streak alive.</p>
          <h2 style="margin:24px 0 12px">Appearance</h2>
          <div class="filter" role="group" aria-label="Theme">
            ${["system", "dark", "light"].map((t) => `<button type="button" data-act="theme" data-t="${t}" aria-pressed="${theme === t}">${t[0].toUpperCase() + t.slice(1)}</button>`).join("")}
          </div>
          <h2 style="margin:24px 0 12px">Backup</h2>
          <div class="btn-row">
            <button class="btn" type="button" data-act="export">Export progress</button>
            <label class="btn" for="import-file" tabindex="0">Import progress</label>
            <input id="import-file" type="file" accept="application/json,.json" class="visually-hidden">
            <button class="btn btn-quiet" type="button" data-act="reset" style="color:var(--danger)">Reset everything</button>
          </div>
        </section>
      </div>`;
    $main.querySelector("#import-file").addEventListener("change", (e) => {
      const f = e.target.files[0];
      if (!f) return;
      f.text().then((t) => {
        try { S.importJson(t); toast("Progress imported"); route(); }
        catch (err) { toast(err.message || "That file couldn't be read."); }
      });
    });
  }

  function viewNotFound() {
    $main.innerHTML = `<div class="empty"><h2>That node doesn't exist.</h2><p>It may have been renamed. Head back to the map.</p><a class="btn" href="#/map">Open the map</a></div>`;
  }

  // ---------- global actions ----------
  document.addEventListener("click", (e) => {
    const el = e.target.closest("[data-act]");
    if (!el) return;
    const act = el.dataset.act;
    const parts = location.hash.replace(/^#\//, "").split("/");
    const id = parts[1];

    if (act === "start-session") { S.startSession(); renderSession(); route(); toast("Hour started. Phone face down."); }
    if (act === "end-session") { S.endSession(); renderSession(); route(); }
    if (act === "hint") { S.revealHint(id); viewLesson(id); const hs = $main.querySelectorAll(".hint"); hs[hs.length - 1]?.scrollIntoView({ block: "center", behavior: "smooth" }); }
    if (act === "complete") {
      const l = byId[id];
      const ticked = (S.get().checks[id] || []).length;
      if (ticked < l.checks.length && !confirm(`Only ${ticked} of ${l.checks.length} checks are ticked. Mark as built anyway?`)) return;
      const before = S.level().index;
      const gained = S.completeLesson(id);
      const after = S.level();
      toast(after.index > before ? `Level up: ${after.name}` : `Node built · +${gained} XP`);
      renderHud();
      viewLesson(id);
    }
    if (act === "undo") { S.uncompleteLesson(id); renderHud(); viewLesson(id); }
    if (act === "ask") {
      const l = byId[id];
      const text = `I'm on Pnode node "${l.title}" (Phase ${l.phase.n}: ${l.phase.title}). The build: ${l.build.title}. Don't give me the full code. Ask me questions and give me the smallest nudge. My doubt: `;
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
    if (act === "export") {
      const blob = new Blob([S.exportJson()], { type: "application/json" });
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = `pnode-progress-${S.today()}.json`;
      document.body.appendChild(a); a.click(); a.remove();
      toast("Progress exported");
    }
    if (act === "reset") {
      if (confirm("Reset all progress, notes and streak? This can't be undone unless you exported a backup.")) { S.reset(); renderHud(); toast("Progress reset"); route(); }
    }
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
    const parts = location.hash.replace(/^#\/?/, "").split("/");
    const view = parts[0] || "today";
    const navKey = { lesson: "map", drill: "mind", capstone: "capstones" }[view] || view;
    document.querySelectorAll("[data-nav]").forEach((a) => {
      if (a.dataset.nav === navKey) a.setAttribute("aria-current", "page"); else a.removeAttribute("aria-current");
    });
    const titles = { today: "Today", map: "Map", mind: "Mind", capstones: "Capstones", me: "Me" };
    switch (view) {
      case "today": viewToday(); break;
      case "map": viewMap(); break;
      case "lesson": viewLesson(parts[1]); break;
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
      : titles[view] || "Pnode";
    document.title = t === "Pnode" ? "Pnode" : `${t} · Pnode`;
    renderHud();
  }

  window.addEventListener("hashchange", () => { route(); window.scrollTo(0, 0); $main.focus({ preventScroll: true }); });
  applyTheme();
  renderSession();
  route();
})();
