LIB_ADD({
  id: "web-browser", title: "HTML, CSS, the DOM and the browser", group: "Web degree depth", order: 3, glyph: "WEB",
  blurb: "Semantic HTML and accessibility, the cascade and specificity, layout algorithms (flow, flexbox, grid), the DOM and events, and the rendering pipeline — with problems that make you compute specificity, contrast and flexbox sizes like a browser does.",
  intro: "Most developers treat CSS as trial and error. This subject teaches the actual algorithms the browser runs, so you can predict layouts instead of guessing, build accessible interfaces, and fix performance problems at their source.",
  modules: [
    { title: "1. HTML and CSS foundations", lessons: [
      { id: "wbr-html", t: "Semantic HTML and accessibility (WCAG)", mins: 35,
        body: [
          "HTML describes <b>meaning</b>, not looks. Semantic elements — <code>header, nav, main, article, section, aside, footer, h1–h6, button, a, label, ul, table</code> — tell browsers, search engines and <b>assistive technology</b> (screen readers, voice control, switch devices) what each part is.",
          "The <b>accessibility tree</b> is built from your DOM: each node gets a role (button, link, heading), a name (text, label, alt, aria-label) and states (expanded, checked, disabled). Screen readers read this tree, not your pixels.",
          "<b>First rule of ARIA</b>: don't use ARIA if a native element does the job. A <code>&lt;div onclick&gt;</code> isn't focusable, doesn't respond to Enter/Space and has no role; a <code>&lt;button&gt;</code> does all that for free. 'No ARIA is better than bad ARIA.'",
          "WCAG's four principles — <b>POUR</b>: Perceivable (alt text, captions, contrast), Operable (everything works with a keyboard, no keyboard traps, visible focus), Understandable (labels, clear errors), Robust (valid markup that assistive tech can parse). Level AA is the usual legal and industry target.",
          "<b>Contrast</b>: WCAG AA requires a ratio of at least <b>4.5:1</b> for normal text and <b>3:1</b> for large text (≥ 24 px, or ≥ 18.66 px bold) and UI components. Ratio = (L1 + 0.05) / (L2 + 0.05), where L is <b>relative luminance</b> computed from linearised sRGB: each channel c = v/255; linear = c ≤ 0.04045 ? c/12.92 : ((c + 0.055)/1.055)^2.4; L = 0.2126R + 0.7152G + 0.0722B.",
          "Forms: every input needs a <code>&lt;label for&gt;</code>; group related inputs with fieldset/legend; announce errors with text (not only red colour) and link them with aria-describedby. Images: meaningful images need alt text describing their purpose; decorative ones get <code>alt=\"\"</code>.",
        ],
        keys: ["Semantic elements build the accessibility tree.", "Native elements before ARIA.", "POUR: perceivable, operable, understandable, robust.", "AA contrast: 4.5:1 normal text, 3:1 large text."],
        ex: "Swiggy-style food apps with icon-only buttons need aria-label='Add to cart' — otherwise a screen reader announces just 'button'.",
        fact: "WebAIM's yearly analysis of the top one million home pages keeps finding detectable WCAG failures on well over 90% of them; low contrast text is the most common.",
        quiz: [
          { q: "Best element for something that submits or triggers an action?", o: ["div with onclick", "span", "button", "a without href"], a: 2, why: "Focusable, keyboard-operable and announced correctly." },
          { q: "Minimum AA contrast for normal body text?", o: ["3:1", "4.5:1", "7:1", "2:1"], a: 1, why: "7:1 is the stricter AAA level." },
          { q: "A purely decorative image should have…", o: ["No alt attribute", "alt=\"\"", "alt=\"image\"", "aria-label"], a: 1, why: "Empty alt tells screen readers to skip it." },
        ],
        pq: [
          { q: "List four things to check when auditing a page's keyboard accessibility.", a: "Every interactive element reachable with Tab in a logical order; visible focus indicator; Enter/Space activate controls; no keyboard traps (modals trap focus while open and return it on close); skip link to main content." },
          { q: "When is ARIA actually needed?", a: "For widgets with no native equivalent (tabs, comboboxes, tree views, live regions announcing async updates) — and then you must also implement the expected keyboard behaviour." },
        ],
        code: [
          { id: "br-contrast", t: "WCAG contrast ratio", diff: "Medium", fn: "contrastRatio",
            statement: "<p>Write <code>contrastRatio(hex1, hex2)</code> that takes two colours like <code>'#1a2b3c'</code> (6-digit hex) and returns the WCAG contrast ratio rounded to 2 decimal places (as a number). Use the relative-luminance formula from the lesson. The order of the arguments must not matter.</p>",
            examples: [{ in: "contrastRatio('#000000', '#ffffff')", out: "21" }, { in: "contrastRatio('#777777', '#ffffff')", out: "4.48 (fails AA for body text!)" }],
            hints: ["Parse each pair of hex digits with parseInt(h, 16).", "Linearise each channel, then L = 0.2126 R + 0.7152 G + 0.0722 B.", "Put the lighter luminance on top: (max + 0.05) / (min + 0.05); round with Math.round(x * 100) / 100."],
            starter: `function contrastRatio(hex1, hex2) {
  // your code here
}`,
            solution: `function contrastRatio(hex1, hex2) {
  const lum = (hex) => {
    const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255)
      .map((c) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  };
  const a = lum(hex1), b = lum(hex2);
  return Math.round(((Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05)) * 100) / 100;
}`,
            explain: "Human eyes are most sensitive to green, which is why its coefficient (0.7152) dominates the luminance formula.",
            tests: [
              { args: ["#000000", "#ffffff"], expect: 21 }, { args: ["#ffffff", "#000000"], expect: 21 }, { args: ["#777777", "#ffffff"], expect: 4.48 },
              { args: ["#ffffff", "#ffffff"], expect: 1 }, { args: ["#0f2a44", "#f5b83d"], expect: 8.23 },
            ] },
        ] },
      { id: "wbr-cascade", t: "The cascade, specificity, inheritance and the box model", mins: 35,
        body: [
          "When several rules set the same property on an element, the <b>cascade</b> decides the winner, in order: (1) <b>origin and importance</b> (user-agent &lt; user &lt; author; <code>!important</code> reverses the order), (2) <b>cascade layers</b> (<code>@layer</code> — earlier layers lose to later ones; unlayered styles beat layered ones), (3) <b>specificity</b>, (4) <b>order of appearance</b> (later wins). Inline styles beat any selector.",
          "<b>Specificity</b> is a triple (a, b, c): a = number of <b>ID</b> selectors; b = <b>classes, attribute selectors and pseudo-classes</b> (:hover, [type=\"text\"]); c = <b>type selectors and pseudo-elements</b> (div, ::before). Compare a first, then b, then c — no carrying: 11 classes never beat 1 ID. The universal selector * and combinators (&gt;, +, ~, space) add nothing. <code>:where()</code> adds zero; <code>:is()</code>, <code>:not()</code>, <code>:has()</code> take their most specific argument.",
          "<b>Inheritance</b>: text-related properties (color, font, line-height) inherit by default; box properties (margin, border, width) don't. Keywords: <code>inherit</code>, <code>initial</code>, <code>unset</code>, <code>revert</code>.",
          "<b>Box model</b>: content + padding + border + margin. With the default <code>box-sizing: content-box</code>, width sets only the content; with <code>border-box</code>, width includes padding and border (what everyone wants). Vertical margins of adjacent blocks <b>collapse</b> into the larger one.",
          "Units: px (absolute), % (of the containing block), em (parent font size), rem (root font size), vw/vh (viewport), ch, and container units (cqi). Use rem for type and spacing so user font-size settings are respected.",
          "Modern CSS: custom properties (<code>--brand</code>, inherited and live), nesting, <code>clamp()</code> for fluid type, <code>:has()</code> (the 'parent selector').",
        ],
        keys: ["Cascade: importance → layers → specificity → order.", "Specificity (ids, classes/attrs/pseudo-classes, types).", "No carrying between columns.", "border-box: width includes padding and border."],
        ex: "When a Bootstrap rule '.navbar .nav-link' beats your '.link', you're losing on specificity (0,2,0 vs 0,1,0) — raising it with !important is the wrong fix; a cascade layer or a matching selector is the right one.",
        fact: "Cascade layers (@layer) shipped in all major browsers in 2022 — the first new way to control the cascade in decades.",
        quiz: [
          { q: "Specificity of #nav .item a:hover?", o: ["(1,1,1)", "(1,2,1)", "(0,2,2)", "(1,1,2)"], a: 1, why: "1 ID; .item and :hover are 2 in b; a is 1 in c." },
          { q: "Which adds zero specificity?", o: [":is(.a)", ":not(#x)", ":where(.a #b)", ":hover"], a: 2, why: ":where() is always zero." },
          { q: "width: 200px; padding: 20px; border: 5px; box-sizing: content-box — rendered width?", o: ["200px", "240px", "250px", "210px"], a: 2, why: "200 + 2×20 + 2×5 = 250." },
        ],
        code: [
          { id: "br-specificity", t: "Compute specificity", diff: "Medium", fn: "specificity",
            statement: "<p>Write <code>specificity(selector)</code> returning <code>[a, b, c]</code> for a single compound/complex selector. Count: <code>#id</code> → a; <code>.class</code>, <code>[attr…]</code> and pseudo-classes like <code>:hover</code> → b; element names and pseudo-elements (<code>::before</code>) → c. Ignore <code>*</code> and combinators. You don't need to support <code>:is/:not/:where</code>.</p>",
            examples: [{ in: "specificity('#nav .item a:hover')", out: "[1, 2, 1]" }, { in: "specificity('ul li::before')", out: "[0, 0, 3]" }],
            hints: ["Use regular expressions to find each kind of token.", "Match ::pseudo-elements first and remove them, so their colons aren't counted as pseudo-classes.", "Element names are words that appear at the start or after a combinator/space and aren't part of .class, #id or :pseudo."],
            starter: `function specificity(selector) {
  // your code here
}`,
            solution: `function specificity(selector) {
  let s = selector;
  let a = 0, b = 0, c = 0;
  s = s.replace(/\\[[^\\]]*\\]/g, () => { b++; return ' '; });
  s = s.replace(/::[\\w-]+/g, () => { c++; return ' '; });
  s = s.replace(/#[\\w-]+/g, () => { a++; return ' '; });
  s = s.replace(/\\.[\\w-]+/g, () => { b++; return ' '; });
  s = s.replace(/:[\\w-]+(\\([^)]*\\))?/g, () => { b++; return ' '; });
  s = s.replace(/[>+~*]/g, ' ');
  c += (s.match(/[a-zA-Z][\\w-]*/g) || []).length;
  return [a, b, c];
}`,
            explain: "Removing each matched part (replacing it with a space) prevents double counting. Attribute selectors go first because their values could contain dots or colons.",
            tests: [
              { args: ["#nav .item a:hover"], expect: [1, 2, 1] }, { args: ["ul li::before"], expect: [0, 0, 3] }, { args: ["*"], expect: [0, 0, 0] },
              { args: ["input[type=\"text\"]:focus"], expect: [0, 2, 1] }, { args: [".a.b.c"], expect: [0, 3, 0] }, { args: ["main > article + p ~ span"], expect: [0, 0, 4] },
              { args: ["#a #b"], expect: [2, 0, 0] },
            ] },
          { id: "br-classnames", t: "classNames()", diff: "Easy", fn: "classNames",
            statement: "<p>Write the popular <code>classNames(...args)</code> helper: strings and numbers are included; objects include keys whose values are truthy; arrays are flattened recursively; falsy values are ignored. Return the classes joined by single spaces.</p>",
            examples: [{ in: "classNames('btn', {active: true, disabled: false}, ['lg', null])", out: "'btn active lg'" }],
            hints: ["Walk the arguments with a recursive helper that pushes into one array.", "Check Array.isArray before checking typeof 'object'."],
            starter: `function classNames(...args) {
  // your code here
}`,
            solution: `function classNames(...args) {
  const out = [];
  const walk = (x) => {
    if (!x) return;
    if (typeof x === 'string' || typeof x === 'number') out.push(String(x));
    else if (Array.isArray(x)) x.forEach(walk);
    else if (typeof x === 'object') for (const k in x) if (x[k]) out.push(k);
  };
  args.forEach(walk);
  return out.join(' ');
}`,
            tests: [
              { args: ["btn", { active: true, disabled: false }, ["lg", null]], expect: "btn active lg" }, { args: [null, false, "", 0], expect: "" },
              { args: [[["a", ["b"]], { c: 1 }]], expect: "a b c" }, { args: ["x", 1], expect: "x 1" },
            ] },
        ] },
      { id: "wbr-layout", t: "Layout algorithms: flow, positioning, flexbox and grid", mins: 40,
        body: [
          "<b>Normal flow</b>: block boxes stack vertically and take the full width; inline boxes flow in lines. A <b>block formatting context (BFC)</b> — created by <code>display: flow-root</code>, overflow other than visible, flex/grid items, floats — contains floats and stops margin collapsing across its edge.",
          "<b>Positioning</b>: <code>relative</code> (offset from its normal spot, still takes space), <code>absolute</code> (removed from flow, positioned relative to the nearest positioned ancestor), <code>fixed</code> (relative to the viewport), <code>sticky</code> (relative until a threshold, then sticks inside its scroll container). <b>Stacking contexts</b> (created by position + z-index, opacity &lt; 1, transform…) explain most 'z-index doesn't work' bugs: z-index only competes within the same stacking context.",
          "<b>Flexbox</b> lays items along one axis. Each item has <code>flex-basis</code> (starting size), <code>flex-grow</code> and <code>flex-shrink</code>. Algorithm (simplified, ignoring min/max): free space = container size − sum of bases. If positive, each item gets basis + free × grow / Σgrow. If negative, items shrink in proportion to <b>shrink × basis</b> (bigger items shrink more): size = basis + free × (shrink·basis) / Σ(shrink·basis). <code>flex: 1</code> means grow 1, shrink 1, basis 0%. Items also won't shrink below their min-content size (min-width: auto) — why long words overflow; fix with min-width: 0.",
          "<b>Grid</b> lays out two dimensions with tracks: <code>grid-template-columns: repeat(auto-fit, minmax(240px, 1fr))</code> makes responsive cards with no media queries. The <code>fr</code> unit shares free space after fixed tracks. Named areas make page layouts readable.",
          "<b>Responsive design</b>: mobile-first CSS, media queries for the viewport, <b>container queries</b> (<code>@container</code>) for component-level responsiveness, fluid sizes with clamp(), and responsive images (srcset, sizes) so phones don't download desktop images.",
        ],
        keys: ["BFC contains floats and margins.", "z-index only competes inside a stacking context.", "Flex grow shares free space by grow; shrink by shrink × basis.", "auto-fit + minmax = responsive grid without media queries."],
        ex: "A text-overflow ellipsis that refuses to work inside a flex item is the min-width: auto rule — adding min-width: 0 to the item fixes it.",
        fact: "CSS Grid shipped in Chrome, Firefox and Safari within a few weeks of each other in March 2017 — an unusually coordinated launch.",
        quiz: [
          { q: "Why does z-index: 9999 sometimes stay behind a z-index: 1 element?", o: ["Browser bug", "They're in different stacking contexts", "z-index max is 999", "Needs !important"], a: 1, why: "Its parent's stacking context is lower." },
          { q: "flex: 1 means…", o: ["grow 1, shrink 1, basis 0%", "grow 1, shrink 0, basis auto", "width 1px", "order 1"], a: 0, why: "That's the shorthand expansion." },
        ],
        wp: [
          { q: "Container 600 px. Items: A (basis 100, grow 1), B (basis 200, grow 2), C (basis 100, grow 1). Final widths?", s: ["Free space = 600 − 400 = 200.", "Σgrow = 4. A gets 200 × 1/4 = 50, B 200 × 2/4 = 100, C 50."], a: "A 150, B 300, C 150." },
          { q: "Container 300 px. Items: A (basis 200, shrink 1), B (basis 200, shrink 1). Final widths? What if A has shrink 3?", s: ["Free = 300 − 400 = −100. Weights shrink × basis: 200, 200 → each loses 50 → 150, 150.", "With A shrink 3: weights 600 and 200 (total 800). A loses 100 × 600/800 = 75 → 125; B loses 25 → 175."], a: "150/150; with shrink 3: A 125, B 175." },
        ],
        code: [
          { id: "br-flex", t: "Resolve flexible lengths like a browser", diff: "Hard", fn: "flexSizes",
            statement: "<p>Write <code>flexSizes(containerWidth, items)</code> where each item is <code>{basis, grow, shrink}</code> (numbers, px). Return the final widths (rounded to 2 decimals) using the simplified flexbox algorithm from this lesson: grow distributes positive free space by grow factors (if all grow are 0, items keep their basis); shrink distributes negative free space by <code>shrink × basis</code> (if all weights are 0, keep the basis).</p>",
            examples: [{ in: "flexSizes(600, [{basis:100,grow:1,shrink:1},{basis:200,grow:2,shrink:1},{basis:100,grow:1,shrink:1}])", out: "[150, 300, 150]" }],
            hints: ["free = containerWidth − Σ basis.", "If free ≥ 0 use grow weights; else use shrink × basis weights.", "Round each result with Math.round(x * 100) / 100."],
            starter: `function flexSizes(containerWidth, items) {
  // your code here
}`,
            solution: `function flexSizes(containerWidth, items) {
  const free = containerWidth - items.reduce((s, it) => s + it.basis, 0);
  const weights = items.map((it) => (free >= 0 ? it.grow : it.shrink * it.basis));
  const total = weights.reduce((a, b) => a + b, 0);
  return items.map((it, i) => {
    const size = total === 0 ? it.basis : it.basis + free * (weights[i] / total);
    return Math.round(size * 100) / 100;
  });
}`,
            explain: "Real browsers add more steps — min/max clamping that freezes items and loops — but this is the core of the spec's 'resolve flexible lengths' algorithm.",
            tests: [
              { args: [600, [{ basis: 100, grow: 1, shrink: 1 }, { basis: 200, grow: 2, shrink: 1 }, { basis: 100, grow: 1, shrink: 1 }]], expect: [150, 300, 150] },
              { args: [300, [{ basis: 200, grow: 0, shrink: 1 }, { basis: 200, grow: 0, shrink: 1 }]], expect: [150, 150] },
              { args: [300, [{ basis: 200, grow: 0, shrink: 3 }, { basis: 200, grow: 0, shrink: 1 }]], expect: [125, 175] },
              { args: [500, [{ basis: 100, grow: 0, shrink: 1 }, { basis: 100, grow: 0, shrink: 1 }]], expect: [100, 100] },
              { args: [100, [{ basis: 0, grow: 1, shrink: 1 }, { basis: 0, grow: 2, shrink: 1 }]], expect: [33.33, 66.67] },
            ] },
        ] },
    ] },
    { title: "2. The DOM and rendering", lessons: [
      { id: "wbr-dom", t: "The DOM, events and delegation", mins: 30,
        body: [
          "The <b>DOM</b> is a tree of nodes (elements, text, comments) built by parsing HTML. JavaScript reads and changes it: <code>querySelector(All)</code>, <code>createElement</code>, <code>append</code>, <code>classList</code>, <code>dataset</code>, <code>textContent</code> (safe) vs <code>innerHTML</code> (parses HTML — an XSS risk with user input).",
          "<b>Event flow</b>: <b>capture</b> phase from window down to the target, the <b>target</b> phase, then <b>bubble</b> phase back up. <code>addEventListener(type, fn, {capture, once, passive, signal})</code>. <code>stopPropagation</code> stops the flow; <code>preventDefault</code> cancels the default action (form submit, link navigation).",
          "<b>Event delegation</b>: attach one listener to a parent and use <code>event.target.closest(selector)</code> to find which child was clicked. Works for elements added later and uses less memory than thousands of listeners — Pnode itself handles almost every click this way.",
          "<b>Passive</b> listeners (<code>{passive: true}</code>) promise not to call preventDefault, so the browser can scroll without waiting for your JS.",
          "<b>Web Components</b>: custom elements (<code>customElements.define</code>), <b>Shadow DOM</b> (encapsulated DOM and styles), templates and slots — framework-free reusable components.",
          "<b>MutationObserver</b>, <b>IntersectionObserver</b> (lazy loading, infinite scroll, Pnode's Feed animations) and <b>ResizeObserver</b> replace expensive polling.",
        ],
        keys: ["Capture down, target, bubble up.", "Delegation: one listener + closest().", "textContent is safe; innerHTML parses HTML.", "Observers beat polling."],
        ex: "A todo list with 1,000 items and a delete button on each needs only one click listener on the list, using event.target.closest('[data-id]').",
        fact: "The DOM Level 1 specification was published by the W3C in 1998 to end the incompatible 'browser wars' scripting models.",
        quiz: [
          { q: "Which phase runs first?", o: ["Bubble", "Target", "Capture", "Random"], a: 2, why: "Events travel down before bubbling up." },
          { q: "Which is safe for inserting user-provided text?", o: ["innerHTML", "textContent", "outerHTML", "insertAdjacentHTML"], a: 1, why: "It never parses HTML." },
        ],
        code: [
          { id: "br-findall", t: "Walk a DOM-like tree", diff: "Easy", fn: "findAll",
            statement: "<p>A tree is given as plain objects <code>{tag, attrs, children}</code> (text nodes are strings). Write <code>findAll(root, tag)</code> that returns the <code>attrs.id</code> of every element with that tag name, in <b>document order</b> (depth-first, pre-order), including the root itself.</p>",
            examples: [{ in: "findAll({tag:'div',attrs:{id:'a'},children:[{tag:'p',attrs:{id:'b'},children:[]}]}, 'p')", out: "['b']" }],
            hints: ["Recursion: check the node, then visit children left to right.", "Skip string children — they're text nodes."],
            starter: `function findAll(root, tag) {
  // your code here
}`,
            solution: `function findAll(root, tag) {
  const out = [];
  (function visit(node) {
    if (typeof node === 'string') return;
    if (node.tag === tag) out.push(node.attrs && node.attrs.id);
    (node.children || []).forEach(visit);
  })(root);
  return out;
}`,
            tests: [
              { args: [{ tag: "div", attrs: { id: "a" }, children: [{ tag: "p", attrs: { id: "b" }, children: [] }] }, "p"], expect: ["b"] },
              { args: [{ tag: "ul", attrs: { id: "u" }, children: [{ tag: "li", attrs: { id: "1" }, children: ["x", { tag: "li", attrs: { id: "1a" }, children: [] }] }, { tag: "li", attrs: { id: "2" }, children: [] }] }, "li"], expect: ["1", "1a", "2"] },
              { args: [{ tag: "p", attrs: { id: "r" }, children: ["hi"] }, "p"], expect: ["r"] },
              { args: [{ tag: "div", attrs: {}, children: [] }, "span"], expect: [] },
            ] },
          { id: "br-delegate", t: "Event delegation: find the handler target", diff: "Medium", fn: "closest",
            statement: "<p>Implement the core of delegation without a DOM. Nodes are <code>{id, cls: [classes], parent}</code> objects (parent is another node or null). Write <code>closest(node, className, boundary)</code>: walk from <code>node</code> up through parents and return the <code>id</code> of the first node having <code>className</code>; stop (return null) if you pass <code>boundary</code> (the element the listener is attached to — it can itself match).</p>",
            examples: [{ in: "click on an <i> inside .delete-btn inside the list", out: "id of the .delete-btn" }],
            hints: ["A while loop following .parent.", "Check the boundary after checking the current node, then stop."],
            starter: `function closest(node, className, boundary) {
  // your code here
}`,
            solution: `function closest(node, className, boundary) {
  let cur = node;
  while (cur) {
    if (cur.cls.includes(className)) return cur.id;
    if (cur === boundary) return null;
    cur = cur.parent;
  }
  return null;
}`,
            tests: [
              { label: "icon inside button", run: `(f) => { const list = { id: 'list', cls: ['list'], parent: null }; const btn = { id: 'del-3', cls: ['delete-btn'], parent: list }; const icon = { id: 'i', cls: ['icon'], parent: btn }; return f(icon, 'delete-btn', list); }`, expect: "del-3" },
              { label: "outside the boundary", run: `(f) => { const page = { id: 'page', cls: ['delete-btn'], parent: null }; const list = { id: 'list', cls: [], parent: page }; const li = { id: 'li', cls: [], parent: list }; return f(li, 'delete-btn', list); }`, expect: null },
              { label: "node itself matches", run: `(f) => { const n = { id: 'n', cls: ['x'], parent: null }; return f(n, 'x', n); }`, expect: "n" },
            ] },
        ] },
      { id: "wbr-render", t: "The rendering pipeline and Core Web Vitals", mins: 35,
        body: [
          "From bytes to pixels: parse HTML → <b>DOM</b>; parse CSS → <b>CSSOM</b>; combine into the <b>render tree</b> (visible nodes with computed styles) → <b>layout</b> (geometry: positions and sizes) → <b>paint</b> (draw into layers) → <b>composite</b> (GPU combines layers).",
          "CSS is <b>render-blocking</b> (no paint until the CSSOM is ready). Classic <code>&lt;script&gt;</code> is <b>parser-blocking</b>; <code>defer</code> runs after parsing in order; <code>async</code> runs as soon as it downloads, in any order; module scripts defer by default. The <b>critical rendering path</b> is the minimum work to show the first pixels — keep critical CSS small and scripts deferred.",
          "Changing geometry (width, top, font-size) triggers <b>layout (reflow)</b> → paint → composite. Changing colour triggers paint → composite. Changing <code>transform</code> or <code>opacity</code> can skip both — only composite — which is why smooth animations use them.",
          "<b>Layout thrashing</b>: alternating DOM writes and reads of layout properties (offsetHeight, getBoundingClientRect) in a loop forces a synchronous layout each time. Batch reads, then writes (or use requestAnimationFrame).",
          "<b>Core Web Vitals</b> (Google's user-centric metrics): <b>LCP</b> (Largest Contentful Paint — good ≤ 2.5 s), <b>INP</b> (Interaction to Next Paint — good ≤ 200 ms; replaced FID in 2024), <b>CLS</b> (Cumulative Layout Shift — good ≤ 0.1). Measure them at the 75th percentile of real users.",
          "Fixes: preload the LCP image, compress and size images (AVIF/WebP, srcset), set width/height or aspect-ratio to prevent shifts, break up long tasks (&gt; 50 ms) to improve INP, server-render critical content, and lazy-load below-the-fold media.",
        ],
        keys: ["DOM + CSSOM → render tree → layout → paint → composite.", "transform/opacity animate on the compositor.", "Batch DOM reads before writes.", "LCP ≤ 2.5 s, INP ≤ 200 ms, CLS ≤ 0.1 (p75)."],
        ex: "An ad banner that loads late and pushes the article down creates layout shift (CLS) — reserving its space with min-height fixes it.",
        fact: "INP officially replaced First Input Delay (FID) as a Core Web Vital in March 2024.",
        quiz: [
          { q: "Which property is cheapest to animate?", o: ["width", "top", "transform", "margin"], a: 2, why: "It can be handled by the compositor without layout or paint." },
          { q: "A script tag with defer…", o: ["Blocks parsing", "Runs after parsing, in order", "Runs whenever it downloads", "Never runs"], a: 1, why: "That's the difference from async." },
          { q: "Good CLS is at most…", o: ["0.1", "1", "2.5", "200"], a: 0, why: "Layout shift score, not seconds." },
        ],
        pq: [
          { q: "Why is this loop slow, and how do you fix it? for (el of items) { el.style.height = el.offsetHeight + 10 + 'px'; }", a: "Each iteration reads layout (offsetHeight) after a write, forcing a synchronous reflow every time. First read all heights into an array, then write all styles." },
          { q: "Your LCP is 4 s on mobile. List four things to check.", a: "Is the LCP element an image that's lazy-loaded or not preloaded? Is it oversized or in an old format? Is render-blocking CSS/JS delaying first paint? Is the server response (TTFB) slow — would SSR/caching/CDN help?" },
        ],
        project: { t: "Lab: an accessible, fast landing page", brief: "Build a landing page for one of your capstones with no framework and measure it like a professional.", steps: ["Semantic structure: header/nav/main/sections/footer, one h1, logical headings, skip link.", "Responsive layout with grid auto-fit + minmax and container queries for the cards; fluid type with clamp().", "Keyboard test everything; add visible :focus-visible styles; check every colour pair with your contrastRatio function (≥ 4.5).", "Optimise: AVIF/WebP images with srcset and explicit sizes, defer scripts, inline critical CSS.", "Run Lighthouse (mobile) and get Performance, Accessibility and Best Practices all ≥ 95; record before/after LCP and CLS."], stretch: ["A custom element (web component) for an accordion with full keyboard support", "Dark mode with prefers-color-scheme and a toggle", "Reduced-motion support"] } },
    ] },
  ],
});
