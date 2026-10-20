/* Pnode progress store. Everything lives in this browser's localStorage.
   Use Me → Export to back it up or move it to another device. */
(function () {
  const KEY = "pnode:v1";

  const XP = {
    lesson: 100,      // marking a lesson complete
    check: 10,        // each acceptance check ticked
    noHints: 40,      // bonus: completed a lesson without opening any hint
    interview: 5,     // each interview question reviewed
    drill: 25,        // each Mind drill written up
    milestone: 250,   // each capstone milestone
    problem: 5,       // each DSA problem logged
  };

  const LEVELS = [
    { name: "Intern", xp: 0 },
    { name: "Trainee", xp: 600 },
    { name: "Junior Dev", xp: 1800 },
    { name: "SDE-1", xp: 4000 },
    { name: "SDE-2", xp: 7500 },
    { name: "Senior", xp: 12000 },
    { name: "Staff", xp: 17500 },
    { name: "Principal", xp: 24000 },
  ];

  function blank() {
    return {
      v: 1,
      started: today(),
      done: {},      // lessonId -> ISO date
      checks: {},    // lessonId -> [index]
      hints: {},     // lessonId -> number revealed
      iq: {},        // lessonId -> [index]
      notes: {},     // lessonId -> text
      mind: {},      // drillId -> { at, text }
      cap: {},       // capstoneId -> [milestoneIndex]
      capNotes: {},  // capstoneId -> text
      log: {},       // YYYY-MM-DD -> xp earned that day
      session: null, // { start: ms }
      theme: null,
      hours: 2,      // daily session length: 1 or 2
      problems: {},  // lessonId -> problems solved for that pattern
    };
  }

  function today(d) {
    const x = d ? new Date(d) : new Date();
    const y = x.getFullYear();
    const m = String(x.getMonth() + 1).padStart(2, "0");
    const day = String(x.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  }

  let state = load();

  function load() {
    try {
      const raw = localStorage.getItem(KEY);
      if (!raw) return blank();
      return Object.assign(blank(), JSON.parse(raw));
    } catch (e) {
      return blank();
    }
  }

  function save() {
    try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) { /* storage unavailable: progress lasts this visit only */ }
  }

  function logXp(amount) {
    const t = today();
    state.log[t] = Math.max(0, (state.log[t] || 0) + amount);
    if (state.log[t] === 0) delete state.log[t];
  }

  function toggleIn(map, id, idx) {
    const arr = map[id] || [];
    const i = arr.indexOf(idx);
    if (i === -1) arr.push(idx); else arr.splice(i, 1);
    map[id] = arr;
    return i === -1; // true if now on
  }

  const api = {
    XP, LEVELS,
    get: () => state,
    today,

    toggleCheck(lessonId, idx) {
      const on = toggleIn(state.checks, lessonId, idx);
      logXp(on ? XP.check : -XP.check);
      save();
      return on;
    },
    revealHint(lessonId) {
      state.hints[lessonId] = (state.hints[lessonId] || 0) + 1;
      save();
      return state.hints[lessonId];
    },
    toggleIq(lessonId, idx, open) {
      const arr = state.iq[lessonId] || [];
      if (open && !arr.includes(idx)) { arr.push(idx); state.iq[lessonId] = arr; logXp(XP.interview); save(); return true; }
      return false;
    },
    setNote(lessonId, text) { state.notes[lessonId] = text; save(); },
    completeLesson(lessonId) {
      if (state.done[lessonId]) return 0;
      state.done[lessonId] = today();
      let gained = XP.lesson;
      if (!state.hints[lessonId]) gained += XP.noHints;
      logXp(gained);
      save();
      return gained;
    },
    uncompleteLesson(lessonId) {
      if (!state.done[lessonId]) return;
      const lost = XP.lesson + (state.hints[lessonId] ? 0 : XP.noHints);
      delete state.done[lessonId];
      logXp(-lost);
      save();
    },
    saveDrill(drillId, text) {
      const first = !state.mind[drillId];
      state.mind[drillId] = { at: today(), text };
      if (first) logXp(XP.drill);
      save();
      return first;
    },
    toggleMilestone(capId, idx) {
      const on = toggleIn(state.cap, capId, idx);
      logXp(on ? XP.milestone : -XP.milestone);
      save();
      return on;
    },
    setCapNote(capId, text) { state.capNotes[capId] = text; save(); },

    startSession() { state.session = { start: Date.now() }; save(); },
    endSession() { state.session = null; save(); },

    setTheme(t) { state.theme = t; save(); },
    setHours(n) { state.hours = n === 1 ? 1 : 2; save(); },
    addProblem(lessonId, delta) {
      const cur = state.problems[lessonId] || 0;
      const next = Math.max(0, cur + delta);
      if (next === cur) return cur;
      state.problems[lessonId] = next;
      logXp((next - cur) * XP.problem);
      save();
      return next;
    },
    totalProblems() { return Object.values(state.problems).reduce((a, b) => a + b, 0); },

    totalXp() {
      let xp = 0;
      for (const id in state.done) xp += XP.lesson + (state.hints[id] ? 0 : XP.noHints);
      for (const id in state.checks) xp += state.checks[id].length * XP.check;
      for (const id in state.iq) xp += state.iq[id].length * XP.interview;
      xp += Object.keys(state.mind).length * XP.drill;
      for (const id in state.cap) xp += state.cap[id].length * XP.milestone;
      for (const id in state.problems) xp += state.problems[id] * XP.problem;
      return xp;
    },
    level(xp) {
      if (xp == null) xp = api.totalXp();
      let i = 0;
      while (i + 1 < LEVELS.length && xp >= LEVELS[i + 1].xp) i++;
      const cur = LEVELS[i], next = LEVELS[i + 1] || null;
      const pct = next ? (xp - cur.xp) / (next.xp - cur.xp) : 1;
      return { index: i, name: cur.name, next, pct, xp };
    },
    streak() {
      let n = 0;
      const d = new Date();
      if (!state.log[today(d)]) d.setDate(d.getDate() - 1); // today not started yet: streak still alive from yesterday
      while (state.log[today(d)]) { n++; d.setDate(d.getDate() - 1); }
      return n;
    },
    bestStreak() {
      const days = Object.keys(state.log).sort();
      let best = 0, run = 0, prev = null;
      for (const day of days) {
        if (prev) {
          const p = new Date(prev); p.setDate(p.getDate() + 1);
          run = today(p) === day ? run + 1 : 1;
        } else run = 1;
        best = Math.max(best, run);
        prev = day;
      }
      return best;
    },

    exportJson() { return JSON.stringify(state, null, 2); },
    importJson(text) {
      const parsed = JSON.parse(text);
      if (!parsed || parsed.v !== 1 || typeof parsed.done !== "object") throw new Error("This file isn't a Pnode backup.");
      state = Object.assign(blank(), parsed);
      save();
    },
    reset() { state = blank(); save(); },
  };

  window.PnodeStore = api;
})();
