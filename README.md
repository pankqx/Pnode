# Pnode

A build-it-yourself path from web basics to senior full-stack engineer, in TypeScript, React, Next.js, Node and MongoDB/PostgreSQL.

- **Map**: phases of nodes from "how the web works" to system design. Each node has an idea, a build brief you code yourself, acceptance checks, progressive hints, free resources and interview questions.
- **Mind**: short written drills for problem solving, critical thinking and emotional intelligence.
- **Capstones**: three production-grade projects (Taskforge, Bazaar, Pulse) with milestones and the senior signals reviewers look for.
- **XP, levels and streaks**: Intern → Principal. Any XP on a day keeps the streak alive.

Progress is stored in your browser (localStorage). Use **Me → Export progress** to back it up or move it to another device.

## Run it

No build step and no dependencies. Either:

- open `index.html` directly in a browser (works offline, apart from web fonts), or
- serve the folder: `python3 -m http.server 8000`, then visit http://localhost:8000, or
- enable GitHub Pages: repo **Settings → Pages → Deploy from a branch → main / (root)**.

## Structure

```
index.html
css/styles.css
js/store.js          progress, XP, levels, streaks
js/app.js            router and views
js/data/phase-*.js   curriculum, one file per phase
js/data/mind.js      Mind drills
js/data/capstones.js capstone specs
```

To add a node, push a lesson object into the right phase file. The fields are `id, title, sub, hours, concept, objectives, build, checks, hints, res, iq`.
