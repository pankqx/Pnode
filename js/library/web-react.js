LIB_ADD({
  id: "web-react", title: "React from first principles", group: "Web degree depth", order: 5, glyph: "RX",
  blurb: "Virtual DOM, JSX, reconciliation and keys, Fiber, the hooks model, state management and rendering strategies (CSR, SSR, SSG, RSC) — with problems where you build createElement, renderToString, a hooks runtime, a Redux-style store and keyed list diffing.",
  intro: "Instead of memorising React rules, you'll rebuild the ideas behind them. Once you've written your own hooks runtime, the rules of hooks, stale closures and re-render behaviour stop being mysterious.",
  modules: [
    { title: "1. How React works", lessons: [
      { id: "wre-vdom", t: "UI = f(state): JSX, elements and the virtual DOM", mins: 30,
        body: [
          "React's core idea: describe the UI for a given state, and let React work out how to update the screen. <b>UI = f(state)</b>.",
          "JSX is syntax sugar: <code>&lt;Button kind=\"primary\"&gt;Save&lt;/Button&gt;</code> compiles to <code>jsx(Button, {kind: 'primary', children: 'Save'})</code> (older: <code>React.createElement</code>). The result is a plain <b>element</b> object — <code>{type, props, key}</code> — a cheap description, not a DOM node.",
          "Components are functions from props to elements. Rendering a tree produces a tree of elements: the <b>virtual DOM</b>. React compares the new tree with the previous one and applies the minimal DOM changes (the commit).",
          "<b>Render vs commit</b>: the render phase calls your components (must be pure — no side effects); the commit phase touches the DOM and then runs effects. Rendering can happen many times (Strict Mode double-invokes in development to catch impurity).",
          "A component re-renders when its state changes, its parent re-renders (unless memoised and props are shallow-equal), or a context it reads changes. Re-rendering ≠ DOM update — the diff decides that.",
        ],
        keys: ["JSX compiles to element objects.", "Elements are descriptions; React owns the DOM.", "Render must be pure; effects run after commit.", "Parent re-render re-renders children by default."],
        ex: "Typing in a search box re-renders the whole page component on every keystroke; moving the input's state into a small child component limits what re-renders.",
        fact: "React was created by Jordan Walke at Facebook and open-sourced in 2013; the virtual DOM idea was inspired partly by XHP, a PHP extension used at Facebook.",
        quiz: [
          { q: "What does JSX compile to?", o: ["HTML strings", "Function calls that return element objects", "DOM nodes", "Templates"], a: 1, why: "jsx()/createElement return plain objects." },
          { q: "Where should side effects like fetching go?", o: ["Directly in the component body", "In effects, event handlers or data-fetching libraries", "In JSX", "In CSS"], a: 1, why: "The render phase must be pure." },
        ],
        code: [
          { id: "rx-h", t: "createElement (h)", diff: "Easy", fn: "h",
            statement: "<p>Write <code>h(type, props, ...children)</code> returning <code>{type, props}</code> where <code>props</code> is a copy of props (or {}) with a <code>children</code> array added. Flatten nested child arrays, drop <code>null</code>, <code>undefined</code>, <code>true</code> and <code>false</code> children, and turn numbers into strings. Move <code>key</code> out of props into a top-level <code>key</code> field (null if missing).</p>",
            examples: [{ in: "h('li', {key: 1, class: 'x'}, 'A', [2, false])", out: "{type: 'li', key: 1, props: {class: 'x', children: ['A', '2']}}" }],
            hints: ["Spread props into a new object and delete key from the copy.", "children.flat(Infinity) then filter and map."],
            starter: `function h(type, props, ...children) {
  // your code here
}`,
            solution: `function h(type, props, ...children) {
  const { key = null, ...rest } = props || {};
  const kids = children.flat(Infinity)
    .filter((c) => c !== null && c !== undefined && typeof c !== 'boolean')
    .map((c) => (typeof c === 'number' ? String(c) : c));
  return { type, key, props: { ...rest, children: kids } };
}`,
            explain: "Dropping booleans is what makes {cond && <X/>} work in JSX.",
            tests: [
              { args: ["li", { key: 1, class: "x" }, "A", [2, false]], expect: { type: "li", key: 1, props: { class: "x", children: ["A", "2"] } } },
              { args: ["div", null], expect: { type: "div", key: null, props: { children: [] } } },
              { args: ["ul", {}, [["a", null], [true, ["b"]]], 0], expect: { type: "ul", key: null, props: { children: ["a", "b", "0"] } } },
            ] },
          { id: "rx-render", t: "renderToString", diff: "Medium", fn: "renderToString",
            statement: "<p>Write <code>renderToString(node)</code> for elements shaped like <code>{type, props: {...attrs, children}}</code> (as from <code>h</code>). Strings render as <b>escaped</b> text (&amp; &lt; &gt; \" '). <code>type</code> may also be a function component: call it with props and render the result. Attributes render as <code>name=\"escaped value\"</code> in the given order; skip <code>children</code>, and skip attributes whose value is null, undefined or false; <code>true</code> renders just the name. Void elements <code>br, img, input, hr, meta, link</code> have no closing tag.</p>",
            examples: [{ in: "renderToString(h('p', {class: 'a'}, 'x < y'))", out: "'&lt;p class=\"a\"&gt;x &amp;lt; y&lt;/p&gt;'" }],
            hints: ["Recursion: strings → escape; functions → render(type(props)); otherwise build the tag.", "Escape & first, then the other characters."],
            starter: `function renderToString(node) {
  // your code here
}`,
            solution: `function renderToString(node) {
  const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  if (typeof node === 'string') return esc(node);
  if (typeof node.type === 'function') return renderToString(node.type(node.props));
  const { children = [], ...attrs } = node.props || {};
  let attrStr = '';
  for (const [k, v] of Object.entries(attrs)) {
    if (v === null || v === undefined || v === false) continue;
    attrStr += v === true ? ' ' + k : ' ' + k + '="' + esc(v) + '"';
  }
  const voids = ['br', 'img', 'input', 'hr', 'meta', 'link'];
  if (voids.includes(node.type)) return '<' + node.type + attrStr + '>';
  return '<' + node.type + attrStr + '>' + children.map(renderToString).join('') + '</' + node.type + '>';
}`,
            explain: "This is the essence of server-side rendering: turn the element tree into an HTML string. Escaping text is what makes React safe from XSS by default.",
            tests: [
              { args: [{ type: "p", props: { class: "a", children: ["x < y"] } }], expect: "<p class=\"a\">x &lt; y</p>" },
              { args: [{ type: "input", props: { type: "checkbox", checked: true, disabled: false, children: [] } }], expect: "<input type=\"checkbox\" checked>" },
              { label: "function component", run: `(r) => { const Hello = (p) => ({ type: 'b', props: { children: ['Hi ' + p.name] } }); return r({ type: Hello, props: { name: '<Pank>', children: [] } }); }`, expect: "<b>Hi &lt;Pank&gt;</b>" },
              { args: [{ type: "ul", props: { children: [{ type: "li", props: { children: ["1"] } }, { type: "li", props: { title: "\"q\"", children: ["2"] } }] } }], expect: "<ul><li>1</li><li title=\"&quot;q&quot;\">2</li></ul>" },
            ] },
        ] },
      { id: "wre-reconcile", t: "Reconciliation, keys and Fiber", mins: 35,
        body: [
          "Comparing two arbitrary trees optimally is O(n³). React uses two <b>heuristics</b> to make it O(n): (1) elements of <b>different types</b> produce entirely different trees (unmount the old subtree, mount the new); (2) <b>keys</b> identify which children are the same across renders.",
          "Same type at the same position → keep the DOM node/component instance, update props, recurse into children. That's why state 'sticks' to a position: rendering <code>{a ? &lt;Form/&gt; : &lt;Form/&gt;}</code> keeps the same Form state.",
          "Keys must be <b>stable and unique among siblings</b>. Using the array index as key breaks when items are inserted, removed or reordered: state and DOM (like input text) attach to the wrong item. Changing a component's key on purpose <b>resets</b> its state.",
          "For keyed lists, efficient libraries compute the minimum number of DOM moves: map each new child to its old index, find the <b>longest increasing subsequence</b> (LIS) of those indexes — those nodes are already in the right relative order and stay put; everything else moves. Vue 3 and Inferno use exactly this.",
          "<b>Fiber</b> (React 16+) represents work as a linked tree of units that can be paused, prioritised and resumed. That enables <b>concurrent rendering</b>: <code>startTransition</code> marks updates as interruptible, so typing stays responsive while a big list re-renders; <code>useDeferredValue</code> lags a value behind.",
          "<b>Batching</b>: React 18 batches multiple state updates in the same event (and in promises/timeouts) into one render.",
        ],
        keys: ["Different type → remount; same type → update.", "Keys must be stable and unique; index keys break on reorder.", "Changing key resets state.", "LIS finds which keyed nodes don't need to move."],
        ex: "A to-do list using index keys: delete the first item and the text you were typing in the second item's input jumps to the wrong row.",
        fact: "React's Fiber rewrite took around two years and shipped with React 16 in 2017 without breaking the public API.",
        quiz: [
          { q: "Why are array indexes bad keys for reorderable lists?", o: ["They're numbers", "Identity follows position, not the item", "They're slow", "React forbids them"], a: 1, why: "After a reorder, item 0 is a different item but keeps item 0's state." },
          { q: "How do you deliberately reset a component's state?", o: ["Call reset()", "Change its key", "Use index as key", "Remount the app"], a: 1, why: "A new key means a new component instance." },
        ],
        code: [
          { id: "rx-lis", t: "Keyed list diff with the longest increasing subsequence", diff: "Hard", fn: "keyedDiff",
            statement: "<p>Write <code>keyedDiff(oldKeys, newKeys)</code> returning <code>{remove, insert, move}</code>: <code>remove</code> = old keys not in new (old order); <code>insert</code> = new keys not in old (new order); <code>move</code> = keys present in both that are <b>not</b> part of the longest increasing subsequence of their old indexes, listed in new order. (Tests use inputs with a unique LIS.)</p>",
            examples: [{ in: "keyedDiff(['a','b','c','d'], ['a','c','d','b','e'])", out: "{remove: [], insert: ['e'], move: ['b']}", why: "Old indexes of a, c, d, b are 0, 2, 3, 1. The LIS 0, 2, 3 (a, c, d) stays; b moves; e is new." }],
            hints: ["Build a map key → old index.", "For new keys that exist in old, collect their old indexes in new order.", "Compute the LIS of that index list (O(n log n) with patience sorting, or O(n²) DP is fine here) and mark its members as staying."],
            starter: `function keyedDiff(oldKeys, newKeys) {
  // your code here
}`,
            solution: `function keyedDiff(oldKeys, newKeys) {
  const oldIndex = new Map(oldKeys.map((k, i) => [k, i]));
  const newSet = new Set(newKeys);
  const remove = oldKeys.filter((k) => !newSet.has(k));
  const insert = newKeys.filter((k) => !oldIndex.has(k));
  const common = newKeys.filter((k) => oldIndex.has(k));
  const idx = common.map((k) => oldIndex.get(k));
  const n = idx.length, len = new Array(n).fill(1), prev = new Array(n).fill(-1);
  let best = -1;
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < i; j++) if (idx[j] < idx[i] && len[j] + 1 > len[i]) { len[i] = len[j] + 1; prev[i] = j; }
    if (best === -1 || len[i] > len[best]) best = i;
  }
  const stay = new Set();
  for (let i = best; i !== -1; i = prev[i]) stay.add(common[i]);
  const move = common.filter((k) => !stay.has(k));
  return { remove, insert, move };
}`,
            explain: "Nodes in the LIS are already in correct relative order, so moving only the others gives the minimum number of DOM moves.",
            complexity: "O(n²) here; O(n log n) with patience sorting.",
            tests: [
              { args: [["a", "b", "c", "d"], ["a", "c", "d", "b", "e"]], expect: { remove: [], insert: ["e"], move: ["b"] } },
              { args: [["a", "b", "c", "d"], ["b", "c", "d", "a"]], expect: { remove: [], insert: [], move: ["a"] } },
              { args: [["x", "a", "b"], ["a", "b", "y"]], expect: { remove: ["x"], insert: ["y"], move: [] } },
              { args: [["1", "2", "3", "4", "5"], ["5", "1", "2", "3", "4"]], expect: { remove: [], insert: [], move: ["5"] } },
              { args: [[], ["a"]], expect: { remove: [], insert: ["a"], move: [] } },
            ] },
        ] },
    ] },
    { title: "2. Hooks, state and rendering strategies", lessons: [
      { id: "wre-hooks", t: "The hooks model: how useState and useEffect really work", mins: 40,
        body: [
          "Each component instance (fiber) keeps a <b>list of hook slots</b>. On every render, hooks are matched to slots <b>by call order</b>: the first useState call gets slot 0, the second slot 1… That's the whole reason for the <b>rules of hooks</b>: call them unconditionally, at the top level, in the same order every render.",
          "<code>useState</code> returns the slot's current value and a stable setter. Calling the setter queues an update and schedules a re-render; the new value appears <b>on the next render</b>, not immediately. Use the functional form <code>setCount(c =&gt; c + 1)</code> when the next state depends on the previous one.",
          "<code>useEffect(fn, deps)</code> runs after commit when deps changed (compared with Object.is); its returned cleanup runs before the next effect and on unmount. Effects are for <b>synchronising with external systems</b> (subscriptions, timers, non-React widgets) — not for deriving state.",
          "<b>Stale closures</b>: an effect or callback sees the props/state of the render that created it. Fix with correct dependency arrays, functional updates, or a ref for 'latest value'.",
          "<code>useRef</code> is a mutable box that survives renders without causing them. <code>useMemo</code>/<code>useCallback</code> cache values/functions between renders — useful for expensive work and stable props to memoised children; the React Compiler can add these automatically.",
          "<b>Custom hooks</b> are just functions that call hooks — reusable stateful logic (useDebounce, useFetch, useLocalStorage).",
        ],
        keys: ["Hooks are matched by call order.", "State updates show up on the next render.", "Effects synchronise with external systems; clean up.", "Stale closure = a callback from an old render."],
        ex: "setCount(count + 1) called twice in one click adds 1, not 2 — both calls read the same count from that render. setCount(c =&gt; c + 1) twice adds 2.",
        fact: "Hooks were introduced at React Conf 2018 and shipped in React 16.8 (February 2019).",
        quiz: [
          { q: "Why can't hooks be called inside an if?", o: ["Performance", "Slots are matched by call order", "Syntax error", "Effects break"], a: 1, why: "Skipping a call shifts every later hook to the wrong slot." },
          { q: "After setCount(5) inside a handler, console.log(count) prints…", o: ["5", "The old value", "undefined", "Throws"], a: 1, why: "count is a constant from the current render." },
        ],
        code: [
          { id: "rx-hooks", t: "Build a tiny hooks runtime", diff: "Hard", fn: "createRuntime",
            statement: "<p>Write <code>createRuntime(Component)</code> that returns <code>{render, useState}</code>. <code>render()</code> resets the hook index, calls <code>Component()</code> and returns its result. Inside Component, <code>useState(initial)</code> returns <code>[value, setValue]</code>: slots are kept by call order; <code>initial</code> may be a function (lazy init, called only on the first render); <code>setValue(next)</code> accepts a value or an updater function and stores the new state (it does not re-render by itself — the test calls render again). Setters must be stable across renders.</p>",
            examples: [{ in: "const rt = createRuntime(() => { const [n, setN] = rt.useState(0); return {n, inc: () => setN(x => x + 1)}; }); rt.render().inc(); rt.render().n", out: "1" }],
            hints: ["Keep states = [] and setters = [] in the closure, plus a cursor reset by render().", "useState uses i = cursor++; if states.length <= i, initialise.", "Create the setter once per slot and reuse it, capturing i."],
            starter: `function createRuntime(Component) {
  // your code here
}`,
            solution: `function createRuntime(Component) {
  const states = [], setters = [];
  let cursor = 0;
  function useState(initial) {
    const i = cursor++;
    if (states.length <= i) {
      states[i] = typeof initial === 'function' ? initial() : initial;
      setters[i] = (next) => { states[i] = typeof next === 'function' ? next(states[i]) : next; };
    }
    return [states[i], setters[i]];
  }
  function render() { cursor = 0; return Component(); }
  return { render, useState };
}`,
            explain: "This is, in miniature, what React does per component: an array of slots and a cursor. Now you can see why conditional hooks would read the wrong slot.",
            tests: [
              { label: "counter", run: `(cr) => { const rt = cr(() => { const [n, setN] = rt.useState(0); return { n, inc: () => setN((x) => x + 1) }; }); rt.render().inc(); rt.render().inc(); return rt.render().n; }`, expect: 2 },
              { label: "two states keep their slots", run: `(cr) => { const rt = cr(() => { const [a, setA] = rt.useState('x'); const [b, setB] = rt.useState(10); return { a, b, setA, setB }; }); const r = rt.render(); r.setB(20); r.setA('y'); const r2 = rt.render(); return [r2.a, r2.b]; }`, expect: ["y", 20] },
              { label: "lazy initial state runs once", run: `(cr) => { let calls = 0; const rt = cr(() => rt.useState(() => { calls++; return 1; })[0]); rt.render(); rt.render(); rt.render(); return calls; }`, expect: 1 },
              { label: "stable setter", run: `(cr) => { const rt = cr(() => rt.useState(0)[1]); return rt.render() === rt.render(); }`, expect: true },
              { label: "functional updates stack", run: `(cr) => { const rt = cr(() => rt.useState(0)); const [, set] = rt.render(); set((x) => x + 1); set((x) => x + 1); return rt.render()[0]; }`, expect: 2 },
            ] },
        ] },
      { id: "wre-state", t: "State management: where state should live", mins: 35,
        body: [
          "Kinds of state: <b>local UI state</b> (open/closed, input text) → useState; <b>shared client state</b> (theme, cart) → lift it up, Context, or a store (Zustand, Redux Toolkit); <b>server state</b> (data from APIs) → a cache like TanStack Query or SWR (handles loading, errors, refetching, invalidation); <b>URL state</b> (filters, page) → the URL; <b>form state</b> → React Hook Form + Zod.",
          "<b>Derive, don't duplicate</b>: if something can be computed from existing state/props (filtered list, total), compute it during render (memoise if expensive) instead of storing it.",
          "<b>Context</b> passes values down without prop drilling, but every consumer re-renders when the value changes. Split contexts, memoise the value, or use a store with <b>selectors</b> for frequently changing data.",
          "<b>Flux/Redux</b> pattern: a single store, state changes only through <b>actions</b> handled by pure <b>reducers</b> (<code>(state, action) =&gt; newState</code>), subscribers notified after each dispatch. Predictable, debuggable (time travel), testable.",
          "Re-render control: <code>React.memo</code> skips re-rendering when props are <b>shallowly equal</b> — which only works if you don't create new objects/functions each render (useMemo/useCallback, or the React Compiler).",
        ],
        keys: ["Server state belongs in a query cache.", "Derive values instead of syncing copies.", "Context consumers all re-render on change.", "Reducers: pure (state, action) → new state."],
        ex: "Storing both 'items' and 'filteredItems' in state means every add/delete must update both — and someday one won't. Keep items and the filter; derive the filtered list.",
        fact: "Redux was created by Dan Abramov and Andrew Clark in 2015, inspired by Flux and the Elm architecture.",
        quiz: [
          { q: "Best home for data fetched from your API?", o: ["A useState in App", "A server-state cache like TanStack Query", "localStorage", "Context only"], a: 1, why: "It handles caching, refetching and staleness." },
          { q: "React.memo compares props using…", o: ["Deep equality", "Shallow equality", "JSON.stringify", "Nothing"], a: 1, why: "Same keys, Object.is on each value." },
        ],
        code: [
          { id: "rx-shallow", t: "shallowEqual", diff: "Easy", fn: "shallowEqual",
            statement: "<p>Write <code>shallowEqual(a, b)</code> the way React.memo compares props: true if <code>Object.is(a, b)</code>; otherwise both must be non-null objects with the same own keys and <code>Object.is</code>-equal values for each key (no recursion).</p>",
            examples: [{ in: "shallowEqual({x: 1}, {x: 1})", out: "true" }, { in: "shallowEqual({o: {}}, {o: {}})", out: "false" }],
            hints: ["Compare key counts first.", "Then every key of a must exist in b with Object.is-equal value."],
            starter: `function shallowEqual(a, b) {
  // your code here
}`,
            solution: `function shallowEqual(a, b) {
  if (Object.is(a, b)) return true;
  if (typeof a !== 'object' || typeof b !== 'object' || !a || !b) return false;
  const ka = Object.keys(a), kb = Object.keys(b);
  return ka.length === kb.length && ka.every((k) => Object.prototype.hasOwnProperty.call(b, k) && Object.is(a[k], b[k]));
}`,
            tests: [
              { args: [{ x: 1 }, { x: 1 }], expect: true }, { args: [{ o: {} }, { o: {} }], expect: false }, { args: [{ a: 1 }, { a: 1, b: 2 }], expect: false },
              { args: [null, null], expect: true }, { args: [{ n: NaN }, { n: NaN }], expect: true }, { args: [{ a: 1 }, null], expect: false },
            ] },
          { id: "rx-store", t: "A Redux-style store", diff: "Medium", fn: "createStore",
            statement: "<p>Write <code>createStore(reducer, initialState)</code> returning <code>{getState, dispatch, subscribe}</code>. <code>dispatch(action)</code> sets state to <code>reducer(state, action)</code> and calls every listener (in subscription order) — but only if the state reference changed. <code>subscribe(fn)</code> returns an unsubscribe function. Also dispatch an initial <code>{type: '@@init'}</code> action when the store is created (without notifying).</p>",
            examples: [{ in: "const s = createStore(counter, 0); s.dispatch({type: 'inc'}); s.getState()", out: "1" }],
            hints: ["state = reducer(initialState, {type: '@@init'}) at creation.", "Keep listeners in a Set or array; call a copy during dispatch."],
            starter: `function createStore(reducer, initialState) {
  // your code here
}`,
            solution: `function createStore(reducer, initialState) {
  let state = reducer(initialState, { type: '@@init' });
  const listeners = new Set();
  return {
    getState: () => state,
    dispatch(action) {
      const next = reducer(state, action);
      if (next !== state) { state = next; [...listeners].forEach((fn) => fn()); }
      return action;
    },
    subscribe(fn) { listeners.add(fn); return () => listeners.delete(fn); },
  };
}`,
            explain: "Skipping notifications when the reference didn't change is why reducers must return the same state object for actions they don't handle — and a new object when they do.",
            tests: [
              { label: "dispatch updates state", run: `(cs) => { const s = cs((st, a) => (a.type === 'inc' ? st + 1 : st), 0); s.dispatch({ type: 'inc' }); s.dispatch({ type: 'inc' }); return s.getState(); }`, expect: 2 },
              { label: "notifies only on change", run: `(cs) => { const s = cs((st, a) => (a.type === 'inc' ? st + 1 : st), 0); let n = 0; s.subscribe(() => n++); s.dispatch({ type: 'inc' }); s.dispatch({ type: 'noop' }); return n; }`, expect: 1 },
              { label: "unsubscribe", run: `(cs) => { const s = cs((st) => ({ ...st }), {}); let n = 0; const off = s.subscribe(() => n++); s.dispatch({ type: 'x' }); off(); s.dispatch({ type: 'x' }); return n; }`, expect: 1 },
              { label: "init action", run: `(cs) => { const seen = []; const s = cs((st, a) => { seen.push(a.type); return st; }, 5); return [seen, s.getState()]; }`, expect: [["@@init"], 5] },
            ] },
        ] },
      { id: "wre-strategies", t: "Rendering strategies: CSR, SSR, SSG, ISR, streaming and Server Components", mins: 35,
        body: [
          "<b>CSR</b> (client-side rendering): the server sends an almost empty HTML page plus JavaScript that builds the UI. Simple hosting; slow first paint on slow phones; weak SEO without extra work.",
          "<b>SSR</b> (server-side rendering): HTML is rendered per request on the server, then <b>hydrated</b> (React attaches event handlers to the existing HTML). Fast first paint and good SEO, but every request costs server time, and the page isn't interactive until hydration finishes. Hydration mismatches happen when server and client render different output (dates, random values, browser-only APIs).",
          "<b>SSG</b> (static generation): HTML built at deploy time and served from a CDN — fastest, but data is frozen until the next build. <b>ISR</b> (incremental static regeneration): static pages regenerated in the background after a revalidate interval or on demand.",
          "<b>Streaming SSR</b> sends HTML in chunks: the shell first, then each <code>&lt;Suspense&gt;</code> boundary as its data resolves, so slow data doesn't block the whole page.",
          "<b>React Server Components</b> (Next.js App Router): components that run only on the server — they can read the database directly, and their code never ships to the browser. <b>Client Components</b> (<code>'use client'</code>) handle interactivity. Pass serialisable props across the boundary; keep client components as small leaves.",
          "Choosing: marketing pages → SSG/ISR; dashboards behind login → CSR or SSR with server components; product pages needing SEO and fresh prices → SSR/ISR with streaming.",
        ],
        keys: ["CSR: JS builds the page; SSR: server HTML + hydration.", "SSG/ISR: prebuilt HTML from a CDN.", "Streaming sends Suspense boundaries as ready.", "Server Components never ship their code to the client."],
        ex: "Your Bazaar product page can be ISR (revalidate every 60 s) for SEO and speed, with a small client component for the 'Add to cart' button.",
        fact: "Server Components were first previewed by the React team in December 2020 and became the default model in Next.js's App Router (2023).",
        quiz: [
          { q: "What is hydration?", o: ["Compressing HTML", "Attaching React's event handlers and state to server-rendered HTML", "Caching API data", "Minifying CSS"], a: 1, why: "The HTML becomes interactive." },
          { q: "A Server Component can…", o: ["Use useState", "Read from the database directly", "Handle onClick", "Use window"], a: 1, why: "It runs only on the server." },
        ],
        pq: [
          { q: "Why does new Date().toLocaleTimeString() in a component cause a hydration warning?", a: "The server renders one time string and the client renders a different one moments later; React detects the mismatched HTML. Render times in an effect on the client, or pass a fixed value from the server." },
          { q: "When would you choose plain CSR today?", a: "For apps behind a login where SEO doesn't matter and the app is highly interactive (internal dashboards, editors), especially if you want simple static hosting." },
        ],
        project: { t: "Lab: build mini-React", brief: "Turn this subject's problems into a working UI library of about 300 lines, then build a to-do app with it.", steps: ["h() to create elements (reuse your solution).", "render(element, container): create real DOM nodes, set attributes and event listeners (onClick → addEventListener).", "A diff/patch step: compare old and new trees; same type → update attributes and recurse; different → replace; keyed children use your keyedDiff.", "useState with your hooks runtime, where setState schedules a re-render with queueMicrotask (batching!).", "Build a to-do app with add, toggle, delete and reorder; check in DevTools that only changed nodes update."], stretch: ["useEffect with dependency arrays and cleanups", "Function components with props and children", "Compare performance with React on 1,000 rows"] } },
    ] },
  ],
});
