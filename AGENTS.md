# AGENTS.md — context for any AI working on Pnode

Give this file to an AI assistant (Claude, ChatGPT, Copilot, a local model) before asking about Pnode. It explains the whole project so you don't have to.

## What Pnode is

A personal learning web app for Pank (MCA student, India). Goal: job-ready full-stack engineer (TypeScript, React, Next.js, Node, MongoDB, PostgreSQL) with GATE-level CS fundamentals by **August 2027**. Single user, no backend, no accounts.

- Repo: `github.com/pankqx/Pnode` (old name `rea-testing` still redirects). Hosted on GitHub Pages from `main`, root folder.
- Stack: plain HTML + CSS + vanilla JavaScript. **No build step, no npm, no framework.** Open `index.html` directly or serve the folder.
- DSA and Python practice live in a separate app, **ProntoPy**; Pnode only logs a daily count.
- Git commits use the owner's identity `pankqx@gmail.com`. No AI co-author trailers.

## Routine the app is built around

College 9–4, hostel duty till 6. Pnode 6:00–7:30 pm and 9:00–11:30 pm on weekdays; weekends fully. `ROUTINES` in `js/app.js` encodes this.

## File map

```
index.html              shell, nav, splash screen, <script> tags in load order
css/styles.css          all styles; tokens on :root (dark first) + light theme
js/store.js             progress in localStorage key "pnode:v1"; XP, levels, streaks, habits, quests
js/app.js               router (hash routes) and every view
js/tutor.js             offline AI tutor (Ollama), chat history in localStorage "pnode:tutor"
js/runner.js            runs coding-problem code in a Blob Web Worker against tests (5 s timeout)
js/data/phase-*.js      build path nodes (Phases 0–8)
js/data/extra-nodes.js  extra build nodes inserted into phases
js/data/track-core.js   Core CS track nodes
js/data/simple.js       "In plain words" analogy per node
js/data/plan.js         Road to August month-by-month targets
js/data/mind.js         Mind drills (critical thinking, EI)
js/data/capstones.js    3 capstones: Taskforge, Bazaar, Pulse
js/data/refs.js         study links per Library area + "Beyond Pnode"
js/library/_lib.js      defines LIB_ADD()
js/library/web-*.js     Web degree depth subjects (JS, async, browser, HTTP, React, Node, TS, security) with coding problems
js/library/deep-*.js    Degree depth subjects (GATE level)
js/library/zz-cs-labs.js coding problems attached to deep CS lessons via LIB_CODE (loads last)
js/library/cs-*.js      CS overview areas
js/library/eng-*.js     AI, DevOps
js/library/life-*.js    life skills
js/library/world-*.js   news/economics, money, style
js/viz/core.js          explainer engine (PNODE_VIZ.add, VZ helpers)
js/viz/*.js             interactive explainers
AGENTS.md               this file
```

## Routes

`#/today` (hero, quests, routine, habits) · `#/feed` (swipe cards) · `#/map` (Path) · `#/lesson/<nodeId>` · `#/library` · `#/library/<areaId>` · `#/read/<lessonId>` · `#/progress` (dashboard + checklists) · `#/tutor`, `#/tutor/read/<lessonId>`, `#/tutor/node/<nodeId>`, `#/tutor/more/<lessonId>` · `#/problems` (all coding problems) · `#/code/<problemId>` (editor + tests) · `#/lab` · `#/plan` · `#/mind` · `#/drill/<id>` · `#/capstones` · `#/capstone/<id>` · `#/me` (settings, backup).

## Library lesson format

```js
LIB_ADD({
  id: "deep-os", title: "Operating systems", group: "Degree depth", order: 1, glyph: "OS",
  blurb: "one line", intro: "a paragraph",
  modules: [{ title: "Module name", lessons: [{
    id: "dos-proc",              // unique across the whole library
    t: "Lesson title", mins: 20,
    body: ["<p>-level HTML strings: paragraphs, <pre>, <table> allowed"],
    keys: ["key point"], ex: "real-life example", fact: "a true fact",
    quiz: [{ q: "MCQ", o: ["a","b","c","d"], a: 1, why: "explanation" }],   // at least 2
    wp: [{ q: "worked problem", s: ["step 1", "step 2"], a: "final answer" }], // optional
    pq: [{ q: "practice question", a: "model answer" }],                      // optional
    project: { t: "Mini project", brief: "...", steps: ["..."], stretch: ["..."] }, // optional
    viz: ["viz-id"],             // optional, must exist in js/viz
    code: [{                     // optional coding problems (ProntoPy-style)
      id: "js-once", t: "once()", diff: "Easy" | "Medium" | "Hard", fn: "once",  // fn = function/class name the tests call
      statement: "<p>html</p>", examples: [{ in, out, why? }], hints: ["..."], constraints?: "...",
      starter: "function once(fn) {}", solution: "...", explain?: "...", complexity?: "...",
      tests: [{ args: [plain data only], expect }, { label, run: "async (fn, console) => value", expect }]
    }]
  }]}]
});
```

New library files must also get a `<script src="js/library/FILE.js">` line under `<!-- LIBRARY -->` in `index.html`.

Problems can also be attached to an existing lesson from another file with `LIB_CODE(lessonId, [problems])`. Every solution must pass its tests and every starter must fail at least one (the maintainer's checker enforces this). Test `args` must be structured-cloneable (no functions) — use `run` for anything else.

## Progress data (localStorage "pnode:v1")

`done{nodeId:date}`, `checks`, `hints`, `iq`, `notes`, `read{lessonId:date}`, `quiz{"lessonId#i":bool}`, `mind`, `cap{capId:[milestoneIdx]}`, `log{date:xp}`, `solved{problemId:{at, diff}}`, `pronto{date:n}`, `habits`, `habitLog`, `quests`, `theme`. Backup/restore is on the Me page. Never rename these keys without a migration.

## Tutor (offline AI)

`js/tutor.js` calls Ollama at `http://localhost:11434` (`/api/tags`, `/api/chat` streaming NDJSON). Ollama must allow the page origin: env var `OLLAMA_ORIGINS=https://pankqx.github.io` (or `*`). Laptop: Dell G15 5510, 16 GB RAM, GTX 1650 4 GB. Recommended models: `qwen2.5-coder:7b` (main), `qwen2.5-coder:14b` (slow, harder questions), `qwen2.5-coder:1.5b` (VS Code autocomplete via the Continue extension). The tutor is a study companion only: no romance or adult content.

## Rules for any AI editing this project

1. Keep it build-free vanilla JS. Don't add frameworks, bundlers or npm dependencies.
2. Simple English in all content. Facts must be correct and current-agnostic (explain concepts, don't state today's prices or rates).
3. Every lesson needs `keys`, `ex`, `fact` and ≥2 quiz questions with a correct `a` index.
4. Keep both themes working (dark default, light) and phone width (390 px) without horizontal scroll.
5. Escape user text with `esc()` before putting it in HTML.
6. After changes, open `index.html`, visit Today, Library, a lesson, Progress and Tutor, and check the browser console for errors.

## How to ask for help cheaply

Paste this file plus only the file(s) involved and the exact error from the browser console (F12 → Console). Example: "AGENTS.md attached. On #/progress, ticking a Library box throws `TypeError: … at viewProgress (app.js:1040)`. Here is js/app.js lines 1000–1100."

Code drafts for problems are saved per problem in localStorage keys `pnode:code:<problemId>`.
