/* Explainers for tooling, testing, routing, auth and interview-prep nodes */
(function () {
  const { h, s, clear, button, row, caption, seg, range, chip, stat, stepper, sequence } = window.VZ;
  const add = window.PNODE_VIZ.add;

  // ---------------------------------------------------------------- semver
  add({
    id: "semver-ranges",
    title: "What does ^1.4.2 actually allow?",
    blurb: "Pick a range and see which published versions match",
    nodes: ["js-tooling"],
    mount(root) {
      const versions = ["1.3.9", "1.4.1", "1.4.2", "1.4.7", "1.5.0", "1.9.3", "2.0.0", "2.1.0"];
      const parse = (v) => v.split(".").map(Number);
      const cmp = (a, b) => { for (let i = 0; i < 3; i++) if (a[i] !== b[i]) return a[i] - b[i]; return 0; };
      const ranges = {
        "^1.4.2": (v) => cmp(v, [1, 4, 2]) >= 0 && v[0] === 1,
        "~1.4.2": (v) => cmp(v, [1, 4, 2]) >= 0 && v[0] === 1 && v[1] === 4,
        "1.4.2": (v) => cmp(v, [1, 4, 2]) === 0,
        ">=1.4.2 <3": (v) => cmp(v, [1, 4, 2]) >= 0 && v[0] < 3,
      };
      const notes = {
        "^1.4.2": "Caret (the npm default): any version with the same major, from 1.4.2 up. Minor and patch updates should be backwards compatible, so they're allowed. 2.0.0 might break you, so it isn't.",
        "~1.4.2": "Tilde: patch updates only (1.4.x). Safer, but you miss new features until you bump it yourself.",
        "1.4.2": "Exact: only that version. Fully predictable, but you have to update by hand, including security fixes.",
        ">=1.4.2 <3": "An explicit range. Rarely needed; it opts into a major version you haven't tested.",
      };
      let r = "^1.4.2";
      const host = h("div", { class: "vrow" });
      const cap = caption();
      function draw() {
        clear(host);
        const ok = versions.filter((v) => ranges[r](parse(v)));
        versions.forEach((v) => host.appendChild(chip(v, ranges[r](parse(v)) ? "mint" : "dim")));
        cap.textContent = `${notes[r]} npm install would pick the highest match: ${ok[ok.length - 1] || "none"}. The lockfile then pins exactly that version for everyone.`;
      }
      root.append(seg(Object.keys(ranges).map((v) => ({ v, label: v })), r, (v) => { r = v; draw(); }, "Range").el, h("div", { class: "small muted" }, "MAJOR.MINOR.PATCH → breaking.feature.fix"), host, cap);
      draw();
    },
  });

  // ---------------------------------------------------------------- strict flags
  add({
    id: "ts-strict-flags",
    title: "What each strict flag catches",
    blurb: "Turn flags on and watch bugs light up",
    nodes: ["ts-config"],
    mount(root) {
      const flags = { strictNullChecks: true, noImplicitAny: true, noUncheckedIndexedAccess: false, exactOptionalPropertyTypes: false };
      const bugs = [
        { code: "const user = users.find(u => u.id === id);\nuser.name.toUpperCase();", flag: "strictNullChecks", err: "'user' is possibly 'undefined'. find() returns undefined when nothing matches." },
        { code: "function total(items) {\n  return items.reduce((s, i) => s + i.price, 0);\n}", flag: "noImplicitAny", err: "Parameter 'items' implicitly has an 'any' type. Without the flag, every typo inside is silently allowed." },
        { code: "const first = names[0];\nfirst.trim();", flag: "noUncheckedIndexedAccess", err: "'first' is possibly 'undefined'. The array might be empty." },
        { code: "type Opts = { theme?: 'dark' | 'light' };\nconst o: Opts = { theme: undefined };", flag: "exactOptionalPropertyTypes", err: "An optional property may be missing, but not explicitly set to undefined. Catches subtle bugs when spreading options." },
      ];
      const list = h("div", { class: "vstack" });
      const stats = h("div", { class: "vstats" });
      const toggles = h("div", { class: "vrow" });
      function draw() {
        clear(toggles);
        Object.keys(flags).forEach((f) => { const c = h("input", { type: "checkbox", checked: flags[f] ? true : null }); c.addEventListener("change", () => { flags[f] = c.checked; draw(); }); toggles.appendChild(h("label", { class: "small", style: "display:flex;gap:6px;align-items:center;font-family:var(--f-code)" }, c, f)); });
        clear(list);
        let caught = 0;
        bugs.forEach((b) => { const on = flags[b.flag]; if (on) caught++; list.appendChild(h("div", { class: "vbox", style: on ? "border-color:var(--danger)" : "" }, h("pre", { class: "vcode", style: "margin:0 0 6px" }, b.code.split("\n").map((l) => h("div", null, l))), h("div", { class: "small", style: `color:var(${on ? "--danger" : "--ink-3"})` }, on ? "✗ compile error: " + b.err : `✓ compiles… and crashes at runtime later (needs ${b.flag})`))); });
        clear(stats).append(stat("bugs caught before running", `${caught}/${bugs.length}`, caught === bugs.length ? "good" : "bad"));
      }
      root.append(toggles, stats, list, caption("Every flag turns a runtime crash into a red squiggle. Turning them on in a new project costs nothing; turning them on in a big old one costs weeks. Start strict."));
      draw();
    },
  });

  // ---------------------------------------------------------------- URL state
  add({
    id: "url-state",
    title: "Put filters in the URL",
    blurb: "Refresh, share and press Back: which version survives?",
    nodes: ["react-routing"],
    mount(root) {
      let mode = "state", filters = { cat: "brownies", sort: "price", page: 2 }, lost = false;
      const url = h("div", { class: "vitem", style: "font:0.85rem var(--f-code);overflow-wrap:anywhere" });
      const view = h("div", { class: "vbox" });
      const cap = caption("You've filtered to brownies, sorted by price, on page 2.");
      function draw() {
        const shown = lost ? { cat: "all", sort: "newest", page: 1 } : filters;
        url.textContent = mode === "url" ? `pnode.shop/products?cat=${filters.cat}&sort=${filters.sort}&page=${filters.page}` : "pnode.shop/products";
        clear(view).append(h("h4", null, "what the user sees"), h("div", { class: "vrow" }, chip("category: " + shown.cat, lost ? "bad" : "mint"), chip("sort: " + shown.sort, lost ? "bad" : "mint"), chip("page " + shown.page, lost ? "bad" : "mint")));
      }
      function act(what) {
        lost = mode === "state";
        draw();
        cap.textContent = mode === "state"
          ? { refresh: "Refresh wiped useState. The user is back on page 1 of everything.", share: "Your friend opens the link and sees the default list, not the brownies you meant.", back: "Back takes the user out of the page entirely instead of to the previous filter." }[what]
          : { refresh: "The URL still holds the filters, so the page rebuilds exactly as it was.", share: "The link carries the filters. Your friend sees the same brownies on the same page.", back: "Each filter change pushed a history entry, so Back steps through filters like users expect." }[what];
      }
      root.append(seg([{ v: "state", label: "useState" }, { v: "url", label: "useSearchParams" }], mode, (v) => { mode = v; lost = false; draw(); cap.textContent = "Now try refresh, share or back."; }, "Where filters live").el, url, row(button("Refresh", () => act("refresh"), { lit: true }), button("Share link", () => act("share")), button("Press Back", () => act("back"))), view, cap);
      draw();
    },
  });

  // ---------------------------------------------------------------- cva variants
  add({
    id: "variants",
    title: "Typed component variants",
    blurb: "One Button, many looks, zero class-name soup",
    nodes: ["react-styling"],
    mount(root) {
      const v = { intent: "primary", size: "md" };
      const preview = h("div", { style: "padding:16px;display:grid;place-items:center;border:1px dashed var(--line-strong);border-radius:10px" });
      const code = h("pre", { class: "vcode" });
      const styles = { primary: "background:var(--lit);color:var(--lit-ink);border:1px solid var(--lit)", secondary: "background:transparent;color:var(--ink);border:1px solid var(--line-strong)", danger: "background:var(--danger);color:var(--bg);border:1px solid var(--danger)", ghost: "background:transparent;color:var(--ink-2);border:1px solid transparent" };
      const sizes = { sm: "padding:6px 10px;font-size:.8rem", md: "padding:10px 16px;font-size:.95rem", lg: "padding:14px 22px;font-size:1.1rem" };
      const tw = { primary: "bg-amber-400 text-stone-950", secondary: "border border-slate-400", danger: "bg-red-600 text-white", ghost: "text-slate-500 hover:bg-slate-100" };
      const twSize = { sm: "h-8 px-3 text-sm", md: "h-10 px-4", lg: "h-12 px-6 text-lg" };
      function draw() {
        clear(preview).appendChild(h("span", { style: `${styles[v.intent]};${sizes[v.size]};border-radius:999px;font-weight:700;font-family:var(--f-body)` }, "Place order"));
        clear(code);
        ["const button = cva('inline-flex items-center rounded-full font-semibold', {", "  variants: {", `    intent: { primary: '…', secondary: '…', danger: '…', ghost: '…' },`, `    size:   { sm: '…', md: '…', lg: '…' },`, "  },", "  defaultVariants: { intent: 'primary', size: 'md' },", "});", "", `<Button intent="${v.intent}" size="${v.size}" />`, `// → "inline-flex … ${tw[v.intent]} ${twSize[v.size]}"`, `<Button intent="huge" />  // ✗ type error: not a valid intent`].forEach((l, i) => code.appendChild(h("div", { class: i >= 8 ? "now" : "" }, l)));
      }
      root.append(row(seg(Object.keys(styles).map((x) => ({ v: x, label: x })), v.intent, (x) => { v.intent = x; draw(); }, "Intent").el, seg(Object.keys(sizes).map((x) => ({ v: x, label: x })), v.size, (x) => { v.size = x; draw(); }, "Size").el), preview, code,
        caption("Variants live in one place and are type-checked. Every button in the app looks consistent, and a designer's change touches one file."));
      draw();
    },
  });

  // ---------------------------------------------------------------- test levels
  add({
    id: "test-levels",
    title: "Which test catches which bug?",
    blurb: "Pick a bug and see the cheapest test that would catch it",
    nodes: ["react-testing", "api-testing", "e2e-testing"],
    mount(root) {
      const levels = [
        { k: "static", name: "Static (TypeScript, ESLint)", speed: "instant", cost: 1 },
        { k: "unit", name: "Unit (Vitest)", speed: "milliseconds", cost: 2 },
        { k: "integration", name: "Integration (Testing Library, Supertest)", speed: "under a second", cost: 3 },
        { k: "e2e", name: "End-to-end (Playwright)", speed: "seconds", cost: 5 },
      ];
      const bugs = [
        { b: "Typo: user.nmae", at: "static", why: "TypeScript flags the property before you even save." },
        { b: "Discount rounds ₹99.995 the wrong way", at: "unit", why: "Pure logic with many edge cases: perfect for fast unit tests." },
        { b: "Form shows no error when the API returns 400", at: "integration", why: "Needs the component and a mocked API together. Testing Library + MSW." },
        { b: "Non-owner can delete a note", at: "integration", why: "An API integration test logging in as another user catches it." },
        { b: "Checkout breaks after login redirect", at: "e2e", why: "Spans pages, cookies and redirects. Only a real browser run catches it reliably." },
        { b: "Wrong env var in production", at: "e2e", why: "A smoke test against the deployed preview catches config mistakes." },
      ];
      let pick = 0;
      const lv = h("div", { class: "vstack" });
      const cap = caption();
      function draw() {
        const bug = bugs[pick];
        clear(lv);
        levels.forEach((l) => lv.appendChild(h("div", { class: "vitem " + (l.k === bug.at ? "mint" : ""), style: "display:grid;grid-template-columns:1fr auto;gap:8px;align-items:center" }, h("div", null, h("b", null, l.name), h("div", { class: "small muted" }, `runs in ${l.speed}`)), h("span", { style: "letter-spacing:2px;color:var(--lit)" }, "₹".repeat(l.cost)))));
        cap.textContent = `Catch it at: ${levels.find((l) => l.k === bug.at).name}. ${bug.why} Push every check to the cheapest level that can catch it; keep a few end-to-end tests for the journeys that make money.`;
      }
      root.append(h("div", { class: "vrow" }, bugs.map((b, i) => button(b.b, () => { pick = i; draw(); }, { lit: i === 0 }))), lv, cap);
      draw();
    },
  });

  // ---------------------------------------------------------------- progressive enhancement
  add({
    id: "progressive-enhancement",
    title: "Server actions with and without JavaScript",
    blurb: "The same form, before and after the JS bundle loads",
    nodes: ["next-server-actions"],
    mount(root, ctx) {
      const host = h("div");
      const flows = {
        nojs: [
          { from: 0, to: 0, label: "JS still downloading (slow 3G)", say: "The HTML form is on screen, but React hasn't hydrated yet." },
          { from: 0, to: 1, label: "plain HTML POST (form data)", say: "The user submits anyway. A form with an action is just HTML, so the browser posts it like it's 1999." },
          { from: 1, to: 1, label: "server action runs: validate, save", say: "Next.js routes the POST to your server action. Validation and auth run as usual." },
          { from: 1, to: 0, label: "redirect → fresh page", tone: "good", say: "It responds with a full page or redirect. Slower to feel, but it works for everyone, even with JS blocked." },
        ],
        js: [
          { from: 0, to: 0, label: "hydrated: pending UI + optimistic", say: "Once JS loads, the same form upgrades: a pending spinner and an optimistic new item appear instantly." },
          { from: 0, to: 1, label: "fetch POST (action id + data)", say: "React calls the action in the background, no page reload." },
          { from: 1, to: 1, label: "validate, save, revalidatePath()", say: "Same server code. revalidatePath marks affected pages for fresh data." },
          { from: 1, to: 0, label: "updated RSC payload", tone: "good", say: "Only the changed parts stream back and merge in. One implementation, two experiences: that's progressive enhancement." },
        ],
      };
      root.append(seg([{ v: "nojs", label: "Before JS loads" }, { v: "js", label: "After hydration" }], "nojs", (v) => sequence(ctx, host, { actors: ["Browser", "Next.js server"], steps: flows[v] }), "State").el, host);
      sequence(ctx, host, { actors: ["Browser", "Next.js server"], steps: flows.nojs });
    },
  });

  // ---------------------------------------------------------------- OAuth
  add({
    id: "oauth-flow",
    title: "\"Sign in with GitHub\", step by step",
    blurb: "The OAuth authorisation code flow",
    nodes: ["next-auth"],
    mount(root, ctx) {
      sequence(ctx, root, {
        actors: ["Browser", "Your app", "GitHub"],
        steps: [
          { from: 0, to: 1, label: "click \"Sign in with GitHub\"", say: "The user wants to log in without creating a new password." },
          { from: 1, to: 0, label: "302 → github.com/login/oauth/authorize?client_id&state", say: "Your app redirects to GitHub with its public client id, the scopes it wants, a callback URL and a random state value (CSRF protection)." },
          { from: 0, to: 2, label: "user logs in + approves", say: "The user logs in on GitHub's own page. Your app never sees their GitHub password." },
          { from: 2, to: 0, label: "302 → /api/auth/callback?code=xyz&state", say: "GitHub sends the browser back with a short-lived one-time code." },
          { from: 0, to: 1, label: "GET callback (code, state)", say: "Your app checks state matches what it sent, so nobody can inject their own login." },
          { from: 1, to: 2, label: "POST code + client_secret", say: "Server to server, your app exchanges the code using its secret. The secret never touches the browser." },
          { from: 2, to: 1, label: "access token", say: "GitHub returns an access token for the approved scopes." },
          { from: 1, to: 2, label: "GET /user (token)", say: "Your app fetches the user's profile: id, name, email, avatar." },
          { from: 1, to: 1, label: "find or create user, create session", say: "Auth.js links the GitHub account to a user row via the Prisma adapter and starts a session." },
          { from: 1, to: 0, label: "Set-Cookie: session (HttpOnly)", tone: "good", say: "The browser gets a secure session cookie. Logged in." },
        ],
      });
    },
  });

  // ---------------------------------------------------------------- pattern recognizer
  add({
    id: "pattern-quiz",
    title: "Name that pattern",
    blurb: "Read the problem, pick the pattern before you code",
    nodes: ["dsa-patterns"],
    mount(root) {
      const Q = [
        ["Given a sorted array, find two numbers that add up to a target, using O(1) extra space.", "Two pointers", "Sorted + pair + O(1) space is the classic two-pointer signal."],
        ["Find the length of the longest substring with at most k distinct characters.", "Sliding window", "\"Longest substring with a condition\" means expand right, shrink left."],
        ["Find the minimum eating speed so all piles finish within h hours.", "Binary search on the answer", "\"Minimum X such that it works\" with a yes/no check that flips once."],
        ["Return all possible combinations of numbers that sum to a target.", "Backtracking", "\"All possible\" combinations or arrangements means explore and undo."],
        ["Find the shortest number of moves for a knight to reach a square.", "BFS", "Shortest path in an unweighted graph."],
        ["Return the k most frequent words.", "Heap (or bucket sort)", "Top-K means a size-k heap."],
        ["Count the number of ways to climb n stairs taking 1 or 2 steps.", "Dynamic programming", "Counting ways with overlapping subproblems."],
        ["Can all courses be finished given prerequisite pairs?", "Topological sort", "Dependencies and cycle detection in a directed graph."],
        ["Find the next warmer day for each day's temperature.", "Monotonic stack", "\"Next greater element\" for every position."],
        ["Merge all overlapping meeting times.", "Sort + sweep (intervals)", "Sort by start, compare with the last merged interval."],
      ];
      const options = [...new Set(Q.map((q) => q[1]))];
      let i = 0, score = 0, answered = false;
      const card = h("div", { class: "vbox" });
      const opts = h("div", { class: "vrow" });
      const fb = caption();
      const stats = h("div", { class: "vstats" });
      function draw() {
        answered = false;
        clear(card).append(h("h4", null, `Problem ${i + 1} of ${Q.length}`), h("p", { style: "margin:0;font-size:1.02rem" }, Q[i][0]));
        clear(opts); options.forEach((o) => opts.appendChild(button(o, () => answer(o))));
        fb.textContent = "Which pattern?";
        clear(stats).append(stat("score", `${score}/${Q.length}`, "lit"));
      }
      function answer(o) {
        if (answered) return; answered = true;
        const right = o === Q[i][1]; if (right) score++;
        [...opts.children].forEach((b) => { if (b.textContent === Q[i][1]) b.classList.add("vbtn-lit"); });
        fb.textContent = (right ? "Right. " : `Not quite: it's ${Q[i][1]}. `) + Q[i][2];
        clear(stats).append(stat("score", `${score}/${Q.length}`, "lit"));
      }
      root.append(card, opts, fb, stats, row(button("Next problem", () => { i = (i + 1) % Q.length; if (i === 0) score = 0; draw(); }, { lit: true })), h("p", { class: "small muted", style: "margin:0" }, "In a real interview, say the pattern and why out loud before writing any code."));
      draw();
    },
  });

  // ---------------------------------------------------------------- machine coding budget
  add({
    id: "machine-coding-budget",
    title: "Your 90-minute budget",
    blurb: "Where the time should go in a machine coding round",
    nodes: ["machine-coding"],
    mount(root, ctx) {
      const B = [["Clarify requirements, list entities", 10, "--plum"], ["Models + folder structure", 10, "--sky"], ["Core features, working end to end", 45, "--lit"], ["Edge cases + validation", 15, "--mint"], ["README: design + what's missing", 10, "--ink-3"]];
      const bar = h("div", { style: "display:flex;height:30px;border-radius:8px;overflow:hidden;border:1px solid var(--line)" }, ...B.map(([n, m, c]) => h("div", { title: n, style: `flex:${m};background:var(${c})` })));
      const list = h("div", { class: "vstack" }, ...B.map(([n, m, c]) => h("div", { class: "vitem", style: "display:flex;justify-content:space-between;gap:8px" }, h("span", null, h("i", { style: `display:inline-block;width:10px;height:10px;border-radius:3px;background:var(${c});margin-right:8px` }), n), h("b", null, m + " min"))));
      const clock = h("div", { class: "vstats" });
      const cap = caption("Commit every 20 minutes so you always have something working to submit.");
      let t0 = null, stop = null;
      function tick() {
        const el = (performance.now() - t0) / 1000 * 60; // 1 real second = 1 simulated minute
        let acc = 0, cur = B[B.length - 1];
        for (const b of B) { acc += b[1]; if (el < acc) { cur = b; break; } }
        clear(clock).append(stat("simulated minute", Math.min(90, Math.floor(el / 60) * 1 + 0) + "", "lit"), stat("you should be on", cur[0]));
      }
      root.append(bar, list, row(button("Simulate the round (1 sec = 1 min)", () => { if (stop) stop(); t0 = performance.now(); stop = ctx.loop(() => { tick(); if ((performance.now() - t0) / 1000 > 90) { stop(); stop = null; } }); }, { lit: true })), clock, cap);
    },
  });

  // ---------------------------------------------------------------- resume bullet checker
  add({
    id: "bullet-checker",
    title: "Resume bullet checker",
    blurb: "Type a bullet and see what recruiters notice",
    nodes: ["portfolio-resume"],
    mount(root) {
      const ta = h("textarea", { class: "vinput", style: "width:100%;min-height:80px;font-family:var(--f-body);font-size:.95rem", "aria-label": "Resume bullet" });
      const checks = h("div", { class: "vstack" });
      const presets = ["Worked on a project management app using React and Node.", "Built Taskforge, a real-time project tracker (React, Node, MongoDB, Socket.IO), cutting board load time from 1.8s to 320ms with compound indexes and optimistic updates."];
      const verbs = /^(built|designed|led|cut|reduced|improved|shipped|launched|created|implemented|automated|migrated|optimi[sz]ed|scaled|developed|architected)\b/i;
      function run() {
        const t = ta.value.trim(), words = t.split(/\s+/).filter(Boolean).length;
        const R = [
          [verbs.test(t), "Starts with a strong action verb", "Start with Built, Cut, Shipped, Designed… not \"Worked on\" or \"Responsible for\"."],
          [/\d/.test(t), "Has a number (impact, scale or speed)", "Add a measurable result: latency, users, % improvement, time saved."],
          [/(react|node|next|typescript|mongo|postgres|redis|docker|aws|socket)/i.test(t), "Names the key technologies", "Mention 2–4 relevant tools so keyword filters (ATS) match."],
          [/(by|with|using|through|via)\b/i.test(t), "Says how you did it", "Add the method: \"…with compound indexes and caching\"."],
          [words >= 12 && words <= 35, `Length is right (${words} words)`, "Aim for one or two lines: 12 to 35 words."],
        ];
        clear(checks);
        R.forEach(([ok, good, fix]) => checks.appendChild(h("div", { class: "vitem " + (ok ? "mint" : "bad") }, (ok ? "✓ " : "✗ ") + (ok ? good : fix))));
      }
      ta.addEventListener("input", run);
      root.append(row(button("Weak example", () => { ta.value = presets[0]; run(); }), button("Strong example", () => { ta.value = presets[1]; run(); }, { lit: true })), ta, checks, caption("Formula: action verb + what you built + how + measurable result. Your capstone build logs are where these numbers come from."));
      ta.value = presets[0]; run();
    },
  });

  // ---------------------------------------------------------------- STAR builder
  add({
    id: "star-builder",
    title: "STAR story builder",
    blurb: "Shape a behavioural answer and check it before you say it",
    nodes: ["interview-loop"],
    mount(root) {
      const F = { s: "Two days before our hackathon demo, our backend teammate fell sick.", t: "We still had to demo a working AI feature to the judges.", a: "I took over the API, cut scope to the one flow judges would see, wrote a mock for the slow model call, and paired with a teammate for two late nights to finish the integration.", r: "We demoed on time, reached the final round, and I learned to cut scope early instead of hoping." };
      const fields = { s: "Situation (1–2 sentences)", t: "Task (your goal)", a: "Action (most of the answer, in \"I\")", r: "Result (outcome + lesson, ideally a number)" };
      const inputs = {};
      const checks = h("div", { class: "vstack" });
      const stats = h("div", { class: "vstats" });
      function run() {
        const txt = Object.fromEntries(Object.keys(fields).map((k) => [k, inputs[k].value.trim()]));
        const words = (x) => x.split(/\s+/).filter(Boolean).length;
        const total = Object.values(txt).reduce((a, x) => a + words(x), 0);
        const iCount = (txt.a.match(/\bI\b/g) || []).length, weCount = (txt.a.match(/\bwe\b/gi) || []).length;
        const R = [
          [words(txt.a) >= words(txt.s) + words(txt.t), "Action is the longest part", "Spend most of the time on what YOU did."],
          [iCount >= weCount, `Says "I" more than "we" in the action (${iCount} vs ${weCount})`, `Interviewers hire you, not the team. Use "I" for your part (${iCount} I vs ${weCount} we).`],
          [txt.r.length > 0 && /(\d|learn|result|reached|won|cut|saved|improv)/i.test(txt.r), "Result has an outcome or lesson", "End with what happened and what you learned."],
          [total <= 260, `Fits in about 2 minutes spoken (${total} words)`, `Too long (${total} words). Trim to about 250 words.`],
        ];
        clear(checks); R.forEach(([ok, good, fix]) => checks.appendChild(h("div", { class: "vitem " + (ok ? "mint" : "bad") }, (ok ? "✓ " : "✗ ") + (ok ? good : fix))));
        clear(stats).append(stat("spoken length", `~${Math.round(total / 130 * 60)}s`, total <= 260 ? "good" : "bad"));
      }
      const form = h("div", { style: "display:grid;gap:8px" });
      Object.entries(fields).forEach(([k, label]) => { const t = h("textarea", { class: "vinput", style: "width:100%;min-height:56px;font-family:var(--f-body);font-size:.92rem", "aria-label": label }); t.value = F[k]; t.addEventListener("input", run); inputs[k] = t; form.appendChild(h("label", { class: "vselect" }, h("span", null, label), t)); });
      root.append(form, checks, stats, caption("Replace the example with your own story. Save your best versions in the Mind drills so they're ready on interview day."));
      run();
    },
  });
})();
