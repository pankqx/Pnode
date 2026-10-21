# Pnode

A build-it-yourself path from web basics to senior full-stack engineer, in TypeScript, React, Next.js, Node, MongoDB and PostgreSQL, plus a huge library of computer science, engineering, life skills and world knowledge. DSA and Python practice live in ProntoPy, which Pnode links to and tracks daily.

- **Today**: your current routine block (evening 6–7:30, night 9–11:30, weekends locked in), daily quests, next node, plan pace, ProntoPy check-in, habits and a Mind drill.
- **Feed**: a swipeable feed of concept, key-idea, fact, real-life and quiz cards drawn from the whole library, with checkpoints so it never becomes endless scrolling. XP comes from answering, not scrolling.
- **Path**: 74 nodes in two tracks.
  - **Build path** (67 nodes, Phases 0–8): web foundations → JavaScript → TypeScript → React → Node and APIs → databases → Next.js → senior engineering → landing the role.
  - **Core CS** (7 nodes): OOP and SOLID, processes and scheduling, concurrency, memory, networks, DBMS theory, design patterns and LLD.
- **Library**: 21 areas and 208 short lessons, each with key points, a real-life example, a fact and recall quizzes.
  - Computer science: how computers work, operating systems, networks, databases, discrete maths, theory of computation, compilers, security, distributed systems, software engineering and history.
  - Engineering and AI: AI concepts for builders, DevOps and cloud.
  - Life skills: learning how to learn, communication and English, character and EI, critical thinking, power and influence, career and job hunt.
  - World and money: reading the news and economics, money and trading (educational only), style on a budget.
- **Every node** has: an "In plain words" analogy, the idea, interactive explainers, a build brief you code yourself, acceptance checks, progressive hints, free resources, interview questions and notes.
- **Lab**: every interactive explainer in one place (event loop, React re-renders, JWT flow, SQL joins, race conditions, consistent hashing, CPU scheduling, Docker layers, Kubernetes reconcile and many more).
- **Mind**: written drills for problem solving, critical thinking and emotional intelligence.
- **Capstones**: Taskforge, Bazaar and Pulse, with milestones and the senior signals reviewers look for.
- **Road to August**: a month-by-month plan to August 2027 with build, core, capstone, library and ProntoPy targets.
- **XP, levels, streaks and habits**: Intern → Principal.

Progress is stored in your browser (localStorage). Use **Me → Copy backup** (or Download backup file) to save it, and paste or load it on another device to restore.

## Run it

No build step and no dependencies. Either:

- open `index.html` directly in a browser (works offline, apart from web fonts), or
- serve the folder: `python3 -m http.server 8000`, then visit http://localhost:8000, or
- enable GitHub Pages: repo **Settings → Pages → Deploy from a branch → main / (root)**.

## Structure

```
index.html
css/styles.css
js/store.js            progress, XP, levels, streaks, problem tally
js/app.js              router and views (Today, Feed, Path, Library, Lab, Plan, Mind, Capstones, Me)
js/data/phase-*.js     build path, one file per phase
js/data/extra-nodes.js extra build nodes inserted into phases
js/data/track-core.js  Core CS track
js/data/simple.js      "In plain words" analogies
js/data/plan.js        Road to August plan
js/data/mind.js        Mind drills
js/data/capstones.js   capstone specs
js/library/_lib.js     LIB_ADD() registry for library areas
js/library/*.js        one file per library area
js/viz/core.js         explainer engine: helpers, stepper, sequence diagrams
js/viz/*.js            the explainers, grouped by area
```

To add an explainer: `PNODE_VIZ.add({ id, title, blurb, nodes: ["lesson-id"], mount(root, ctx) { … } })`. Use `ctx.every`, `ctx.after` and `ctx.loop` for timers so they're cleaned up when you navigate away.

To add a library area: `LIB_ADD({ id, title, group, order, glyph, blurb, intro, modules: [{ title, lessons: [{ id, t, mins, body, keys, ex, fact, quiz, viz }] }] })`, then add its `<script>` under `<!-- LIBRARY -->` in index.html.
