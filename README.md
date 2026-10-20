# Pnode

A build-it-yourself path from web basics to senior full-stack engineer, in TypeScript, React, Next.js, Node, MongoDB and PostgreSQL, with DSA and Core CS tracks for tough interview loops.

- **Map**: 86 nodes in three tracks.
  - **Build path** (67 nodes, Phases 0–8): web foundations → JavaScript → TypeScript → React → Node and APIs → databases → Next.js → senior engineering → landing the role.
  - **DSA track** (12 nodes): Big-O, hashing, two pointers, sliding window, binary search, lists and stacks, backtracking, trees, graphs, heaps, DP, intervals and greedy.
  - **Core CS** (7 nodes): OOP and SOLID, processes and scheduling, concurrency, memory, networks, DBMS theory, design patterns and LLD.
- **Every node** has: an "In plain words" analogy, the idea, interactive explainers, a build brief you code yourself, acceptance checks, progressive hints, free resources, interview questions and notes.
- **Lab**: all 98 interactive explainers in one place (event loop simulator, React re-render tree, JWT refresh flow, SQL joins, race conditions, consistent hashing, BFS/DFS grid, DP tables, CPU scheduling and many more).
- **Mind**: written drills for problem solving, critical thinking and emotional intelligence.
- **Capstones**: Taskforge, Bazaar and Pulse, with milestones and the senior signals reviewers look for.
- **Road to August**: a month-by-month plan to August 2027 at two hours a day, an on-track meter and a readiness checklist.
- **XP, levels and streaks**: Intern → Principal, DSA problem tally, 1-hour or 2-hour daily sessions.

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
js/app.js              router and views (Today, Map, Lab, Plan, Mind, Capstones, Me)
js/data/phase-*.js     build path, one file per phase
js/data/extra-nodes.js extra build nodes inserted into phases
js/data/track-dsa.js   DSA track
js/data/track-core.js  Core CS track
js/data/simple.js      "In plain words" analogies
js/data/plan.js        Road to August plan
js/data/mind.js        Mind drills
js/data/capstones.js   capstone specs
js/viz/core.js         explainer engine: helpers, stepper, sequence diagrams
js/viz/*.js            the explainers, grouped by area
```

To add an explainer: `PNODE_VIZ.add({ id, title, blurb, nodes: ["lesson-id"], mount(root, ctx) { … } })`. Use `ctx.every`, `ctx.after` and `ctx.loop` for timers so they're cleaned up when you navigate away.
