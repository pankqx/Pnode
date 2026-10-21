LIB_ADD({
  id: "web-js", title: "JavaScript in depth", group: "Web degree depth", order: 1, glyph: "JS",
  blurb: "Types and coercion, scope and closures, this and prototypes, functional patterns, objects and iterators, and how engines run your code — with coding problems you solve in the browser.",
  intro: "This is the language course a university would teach if it taught JavaScript properly. Every lesson ends with coding problems that run against automatic tests, just like ProntoPy. These are the same utilities (deepEqual, curry, bind, EventEmitter…) that Indian product companies ask in frontend and full-stack rounds.",
  modules: [
    { title: "1. Values and scope", lessons: [
      { id: "wjs-types", t: "Types, values and coercion", mins: 30,
        body: [
          "JavaScript has 7 <b>primitive</b> types — string, number, bigint, boolean, undefined, null, symbol — and one structural type, <b>object</b> (which includes arrays, functions, dates, maps…). Primitives are immutable and compared by value; objects are compared by <b>reference</b> (identity).",
          "<code>typeof</code> quirks you must know: <code>typeof null === 'object'</code> (a bug from 1995 kept for compatibility), <code>typeof function(){} === 'function'</code>, <code>typeof [] === 'object'</code> (use <code>Array.isArray</code>), <code>typeof NaN === 'number'</code>.",
          "<b>Falsy values</b> (exactly eight): false, 0, −0, 0n, '', null, undefined, NaN. Everything else is truthy — including '0', 'false', [] and {}.",
          "<b>== vs ===</b>: <code>===</code> compares without conversion. <code>==</code> converts first: null == undefined is true (and equal to nothing else); a boolean is converted to a number; an object is converted to a primitive (valueOf, then toString). That's why [] == false is true ([] → '' → 0, false → 0). Rule: always use === except <code>x == null</code> to check for null or undefined.",
          "<b>Numbers</b> are IEEE 754 doubles: 0.1 + 0.2 = 0.30000000000000004; integers are exact up to 2⁵³ − 1. NaN !== NaN — use <code>Number.isNaN</code> or <code>Object.is</code>. <code>Object.is(0, -0)</code> is false while <code>0 === -0</code> is true.",
          "The <b>+ operator</b> concatenates if either side becomes a string after ToPrimitive: 1 + '2' = '12', but 1 − '2' = −1 (minus always converts to numbers).",
        ],
        keys: ["7 primitives + object.", "Objects compare by reference.", "Eight falsy values; [] and {} are truthy.", "Use ===, except x == null."],
        ex: "A React component re-renders because a new object {} !== the previous {} even with identical contents — reference equality is why useMemo and stable props matter.",
        fact: "JavaScript was designed by Brendan Eich at Netscape in about ten days in May 1995.",
        quiz: [
          { q: "typeof null is…", o: ["'null'", "'object'", "'undefined'", "'number'"], a: 1, why: "A historical bug that can't be fixed without breaking the web." },
          { q: "Which value is truthy?", o: ["0", "''", "'0'", "NaN"], a: 2, why: "Any non-empty string is truthy." },
          { q: "[1,2] === [1,2] is…", o: ["true", "false", "TypeError", "undefined"], a: 1, why: "Two different array objects." },
        ],
        pq: [
          { q: "What do these print: '5' + 3, '5' − 3, true + 1, [] + {}?", a: "'53' (string concat), 2 (numeric), 2 (true → 1), '[object Object]' ([] → '', {} → '[object Object]')." },
          { q: "Why does NaN === NaN return false, and how do you test for NaN?", a: "IEEE 754 defines NaN as unequal to everything, including itself. Use Number.isNaN(x) or Object.is(x, NaN)." },
        ],
        code: [
          { id: "js-typeof", t: "A typeOf that tells the truth", diff: "Easy", fn: "typeOf",
            statement: "<p>Write <code>typeOf(value)</code> that returns a precise lowercase type name: <code>'null'</code>, <code>'undefined'</code>, <code>'array'</code>, <code>'date'</code>, <code>'regexp'</code>, <code>'map'</code>, <code>'set'</code>, <code>'function'</code>, <code>'object'</code> (plain objects), and the normal names for strings, numbers, booleans, bigints and symbols.</p>",
            examples: [{ in: "typeOf(null)", out: "'null'" }, { in: "typeOf([1, 2])", out: "'array'" }, { in: "typeOf(new Date())", out: "'date'" }],
            hints: ["typeof handles most primitives but lies for null and every object.", "Object.prototype.toString.call(x) returns strings like '[object Array]'."],
            starter: `function typeOf(value) {
  // your code here
}`,
            solution: `function typeOf(value) {
  if (value === null) return 'null';
  const t = typeof value;
  if (t !== 'object') return t;
  return Object.prototype.toString.call(value).slice(8, -1).toLowerCase();
}`,
            explain: "Object.prototype.toString reads the internal [[Class]]-like tag (Symbol.toStringTag) of built-in objects, giving 'Array', 'Date', 'Map' and so on.",
            complexity: "O(1).",
            tests: [
              { args: [null], expect: "null" }, { args: [undefined], expect: "undefined" }, { args: [[1, 2]], expect: "array" },
              { args: ["hi"], expect: "string" }, { args: [42], expect: "number" }, { args: [{ a: 1 }], expect: "object" },
              { label: "date", run: `(f) => f(new Date())`, expect: "date" }, { label: "regexp", run: `(f) => f(/a/)`, expect: "regexp" },
              { label: "map", run: `(f) => f(new Map())`, expect: "map" }, { label: "function", run: `(f) => f(() => 1)`, expect: "function" },
              { label: "bigint", run: `(f) => f(10n)`, expect: "bigint" },
            ] },
          { id: "js-deepequal", t: "deepEqual", diff: "Medium", fn: "deepEqual",
            statement: "<p>Write <code>deepEqual(a, b)</code> that returns true when two values are structurally equal: primitives compared with <code>Object.is</code> semantics (so NaN equals NaN), arrays element by element, plain objects by the same set of keys with deeply equal values.</p>",
            examples: [{ in: "deepEqual({a: [1, {b: 2}]}, {a: [1, {b: 2}]})", out: "true" }, { in: "deepEqual([1, 2], {0: 1, 1: 2})", out: "false" }],
            hints: ["Handle the 'same primitive' case with Object.is first.", "If either side isn't an object (or is null), they're not equal.", "Arrays and objects must not be considered equal to each other; then compare key counts and recurse."],
            starter: `function deepEqual(a, b) {
  // your code here
}`,
            solution: `function deepEqual(a, b) {
  if (Object.is(a, b)) return true;
  if (typeof a !== 'object' || typeof b !== 'object' || a === null || b === null) return false;
  if (Array.isArray(a) !== Array.isArray(b)) return false;
  const ka = Object.keys(a), kb = Object.keys(b);
  if (ka.length !== kb.length) return false;
  return ka.every((k) => Object.prototype.hasOwnProperty.call(b, k) && deepEqual(a[k], b[k]));
}`,
            explain: "Recursion mirrors the structure. Checking key counts plus 'every key of a exists in b' guarantees the key sets are identical.",
            complexity: "O(total number of nodes in both structures).",
            tests: [
              { args: [{ a: [1, { b: 2 }] }, { a: [1, { b: 2 }] }], expect: true }, { args: [[1, 2], { 0: 1, 1: 2 }], expect: false },
              { args: [NaN, NaN], expect: true }, { args: [{ a: 1 }, { a: 1, b: undefined }], expect: false }, { args: [{ a: 1, b: 2 }, { b: 2, a: 1 }], expect: true },
              { args: [[1, [2, [3]]], [1, [2, [4]]]], expect: false }, { args: [null, {}], expect: false }, { args: ["1", 1], expect: false },
            ] },
        ] },
      { id: "wjs-scope", t: "Scope, hoisting and closures", mins: 30,
        body: [
          "JavaScript uses <b>lexical scope</b>: a variable's visibility is decided by where code is written. Scopes: global, module, function, and <b>block</b> (for let/const/class).",
          "<b>Hoisting</b>: declarations are processed before code runs. <code>var</code> is hoisted and initialised to undefined; <code>function</code> declarations are hoisted with their body; <code>let</code>, <code>const</code> and <code>class</code> are hoisted but uninitialised — touching them early throws a ReferenceError (the <b>temporal dead zone</b>).",
          "A <b>closure</b> is a function together with the variables of the scope where it was created. The function keeps those variables alive even after the outer function returns. Closures power callbacks, React hooks, memoisation, private state and module patterns.",
          "Classic bug: <code>for (var i = 0; i &lt; 3; i++) setTimeout(() =&gt; console.log(i))</code> prints 3, 3, 3 — one shared var. With <code>let</code>, each iteration gets a fresh binding: 0, 1, 2.",
          "<b>Execution context</b>: each call creates an environment record (variables) linked to its outer environment — the <b>scope chain</b> the engine walks to resolve names.",
        ],
        keys: ["Lexical scope: decided by code position.", "let/const have a temporal dead zone.", "Closures keep outer variables alive.", "var in loops shares one binding; let creates one per iteration."],
        ex: "A React useState setter called in a setTimeout can see an old value — a 'stale closure' — because the callback closed over the state of an earlier render.",
        fact: "Closures come from Scheme (1975), one of JavaScript's main influences; Eich was originally hired to put Scheme in the browser.",
        quiz: [
          { q: "console.log(x); let x = 1; results in…", o: ["undefined", "1", "ReferenceError", "null"], a: 2, why: "x is in the temporal dead zone." },
          { q: "for (let i = 0; i &lt; 3; i++) setTimeout(() =&gt; console.log(i)) prints…", o: ["3 3 3", "0 1 2", "undefined ×3", "Nothing"], a: 1, why: "Each iteration has its own i." },
        ],
        pq: [
          { q: "What is a closure, in one sentence, and give one real use?", a: "A function bundled with references to the variables of its defining scope; used for private state, e.g. a counter factory whose count can't be touched from outside." },
          { q: "Why can closures cause memory leaks?", a: "A long-lived closure (event listener, timer, cache) keeps its whole captured scope reachable, including large objects you thought were gone." },
        ],
        code: [
          { id: "js-once", t: "once()", diff: "Easy", fn: "once",
            statement: "<p>Write <code>once(fn)</code> that returns a new function which calls <code>fn</code> only the first time it's called (passing along arguments and <code>this</code>) and returns that first result on every later call.</p>",
            examples: [{ in: "const init = once(() => 42); init(); init();", out: "42, 42 (fn ran once)" }],
            hints: ["You need two pieces of private state: whether it ran, and the result.", "Closures give you private state."],
            starter: `function once(fn) {
  // your code here
}`,
            solution: `function once(fn) {
  let done = false, result;
  return function (...args) {
    if (!done) { done = true; result = fn.apply(this, args); }
    return result;
  };
}`,
            explain: "done and result live in the closure, invisible to callers. Using apply forwards both this and the arguments.",
            tests: [
              { label: "returns first result each time", run: `(once) => { let n = 0; const f = once(() => ++n); return [f(), f(), f()]; }`, expect: [1, 1, 1] },
              { label: "passes arguments", run: `(once) => once((a, b) => a + b)(2, 3)`, expect: 5 },
              { label: "keeps this", run: `(once) => { const o = { v: 7, g: once(function () { return this.v; }) }; return o.g(); }`, expect: 7 },
            ] },
          { id: "js-memoize", t: "memoize()", diff: "Medium", fn: "memoize",
            statement: "<p>Write <code>memoize(fn, keyFn?)</code>. The returned function caches results by key. The default key is <code>JSON.stringify(args)</code>; an optional <code>keyFn(...args)</code> overrides it. Expose the cache size as a <code>size()</code> method on the returned function.</p>",
            examples: [{ in: "const sq = memoize(x => x * x); sq(4); sq(4); sq.size()", out: "16, 16, 1" }],
            hints: ["A Map from key to result is the cache.", "Functions are objects: you can attach sq.size = () => cache.size."],
            starter: `function memoize(fn, keyFn) {
  // your code here
}`,
            solution: `function memoize(fn, keyFn) {
  const cache = new Map();
  const m = function (...args) {
    const key = keyFn ? keyFn(...args) : JSON.stringify(args);
    if (cache.has(key)) return cache.get(key);
    const v = fn.apply(this, args);
    cache.set(key, v);
    return v;
  };
  m.size = () => cache.size;
  return m;
}`,
            explain: "Use cache.has rather than checking the value, so cached falsy results (0, '', undefined) are still hits.",
            complexity: "O(1) average per call after the key is computed.",
            tests: [
              { label: "caches calls", run: `(memoize) => { let calls = 0; const sq = memoize((x) => { calls++; return x * x; }); sq(4); sq(4); sq(5); return [sq(4), calls, sq.size()]; }`, expect: [16, 2, 2] },
              { label: "caches falsy results", run: `(memoize) => { let calls = 0; const z = memoize(() => { calls++; return 0; }); z(); z(); return calls; }`, expect: 1 },
              { label: "custom key", run: `(memoize) => { let calls = 0; const f = memoize((o) => { calls++; return o.id * 2; }, (o) => o.id); f({ id: 1, x: 1 }); f({ id: 1, x: 2 }); return calls; }`, expect: 1 },
              { label: "fibonacci becomes fast", run: `(memoize) => { const fib = memoize((n) => (n < 2 ? n : fib(n - 1) + fib(n - 2))); return fib(70); }`, expect: 190392490709135 },
            ] },
        ] },
      { id: "wjs-this", t: "this, prototypes, classes and new", mins: 35,
        body: [
          "<code>this</code> is decided by <b>how a function is called</b>, not where it's written: method call <code>obj.f()</code> → obj; plain call <code>f()</code> → undefined in strict mode (globalThis otherwise); <code>new F()</code> → the new object; <code>f.call(x)</code>/<code>apply</code>/<code>bind</code> → x. <b>Arrow functions</b> have no own this — they use the enclosing scope's this.",
          "Losing this: <code>const g = obj.f; g()</code> — the method is detached. Fix with bind, an arrow wrapper, or class fields with arrows.",
          "<b>Prototypes</b>: every object has an internal [[Prototype]] link (<code>Object.getPrototypeOf</code>). Property lookup walks this chain until found or null. <code>F.prototype</code> is the object that instances created by <code>new F()</code> link to.",
          "<b>What new does</b>: (1) create an object linked to F.prototype; (2) call F with this = that object; (3) if F returns an object, use it; otherwise return the new object.",
          "<b>class</b> syntax is mostly sugar over prototypes, with real differences: class bodies are strict, classes aren't hoisted like functions (TDZ), calling without new throws, and <code>#private</code> fields are truly private. <code>extends</code> sets up two chains: Child.prototype → Parent.prototype and Child → Parent (for static members); <code>super</code> calls the parent.",
          "<code>a instanceof F</code> checks whether F.prototype appears anywhere on a's prototype chain.",
        ],
        keys: ["this depends on the call site.", "Arrow functions inherit this.", "new: create, link, call, return.", "instanceof walks the prototype chain."],
        ex: "Passing this.handleClick to a button's onClick in a React class component without binding made this undefined — the reason class components needed bind in the constructor.",
        fact: "JavaScript's prototype-based objects were inspired by the Self language from Sun Microsystems.",
        quiz: [
          { q: "In strict mode, const g = obj.f; g() runs with this =…", o: ["obj", "undefined", "globalThis", "g"], a: 1, why: "A plain call has no receiver." },
          { q: "Arrow functions get this from…", o: ["The caller", "The enclosing lexical scope", "The prototype", "bind only"], a: 1, why: "They don't create their own this." },
        ],
        pq: [
          { q: "What does this print? const o = { n: 1, f() { return () =&gt; this.n; } }; console.log(o.f()());", a: "1 — the arrow captures this from f, which was called as o.f()." },
          { q: "Why do class fields like handle = () =&gt; {...} avoid binding issues, and what do they cost?", a: "Each instance gets its own arrow function with this fixed lexically. The cost: a new function per instance instead of one shared prototype method." },
        ],
        code: [
          { id: "js-bind", t: "Implement bind", diff: "Medium", fn: "myBind",
            statement: "<p>Write <code>myBind(fn, thisArg, ...preset)</code> that behaves like <code>fn.bind(thisArg, ...preset)</code>: the returned function calls <code>fn</code> with <code>this = thisArg</code> and the preset arguments followed by the new ones. Bonus (tested): if the bound function is called with <code>new</code>, ignore thisArg and construct a new instance of fn.</p>",
            examples: [{ in: "myBind(function (a, b) { return this.x + a + b; }, {x: 1}, 2)(3)", out: "6" }],
            hints: ["Return a function that uses fn.apply.", "Inside the returned function, new.target is defined when it's called with new.", "When called with new, return new fn(...allArgs)."],
            starter: `function myBind(fn, thisArg, ...preset) {
  // your code here
}`,
            solution: `function myBind(fn, thisArg, ...preset) {
  return function bound(...args) {
    if (new.target) return new fn(...preset, ...args);
    return fn.apply(thisArg, [...preset, ...args]);
  };
}`,
            explain: "Partial application is just concatenating preset and new arguments. new.target detects constructor calls, where bind is specified to ignore the bound this.",
            tests: [
              { label: "binds this and arguments", run: `(b) => b(function (a, c) { return this.x + a + c; }, { x: 1 }, 2)(3)`, expect: 6 },
              { label: "partial application", run: `(b) => { const add = (a, c, d) => a + c + d; return b(add, null, 1, 2)(3); }`, expect: 6 },
              { label: "works with new", run: `(b) => { function P(n) { this.n = n; } const B = b(P, { n: 99 }); const p = new B(5); return [p.n, p instanceof P]; }`, expect: [5, true] },
            ] },
          { id: "js-instanceof", t: "Implement instanceof", diff: "Medium", fn: "isInstanceOf",
            statement: "<p>Write <code>isInstanceOf(obj, Ctor)</code> that returns what <code>obj instanceof Ctor</code> would, without using <code>instanceof</code>: walk obj's prototype chain looking for <code>Ctor.prototype</code>. Primitives return false.</p>",
            examples: [{ in: "isInstanceOf([], Object)", out: "true" }, { in: "isInstanceOf(5, Number)", out: "false" }],
            hints: ["Object.getPrototypeOf(x) gives the next link.", "Stop when you reach null."],
            starter: `function isInstanceOf(obj, Ctor) {
  // your code here (don't use instanceof)
}`,
            solution: `function isInstanceOf(obj, Ctor) {
  if (obj === null || (typeof obj !== 'object' && typeof obj !== 'function')) return false;
  let p = Object.getPrototypeOf(obj);
  while (p !== null) {
    if (p === Ctor.prototype) return true;
    p = Object.getPrototypeOf(p);
  }
  return false;
}`,
            explain: "This is exactly the algorithm the engine uses (unless Ctor defines Symbol.hasInstance).",
            complexity: "O(length of the prototype chain).",
            tests: [
              { label: "[] instanceof Array", run: `(f) => f([], Array)`, expect: true }, { label: "[] instanceof Object", run: `(f) => f([], Object)`, expect: true },
              { label: "5 instanceof Number", run: `(f) => f(5, Number)`, expect: false }, { label: "null instanceof Object", run: `(f) => f(null, Object)`, expect: false },
              { label: "class hierarchy", run: `(f) => { class A {} class B extends A {} return [f(new B(), A), f(new A(), B)]; }`, expect: [true, false] },
              { label: "Object.create(null)", run: `(f) => f(Object.create(null), Object)`, expect: false },
            ] },
        ] },
    ] },
    { title: "2. Functions, objects and the engine", lessons: [
      { id: "wjs-func", t: "Higher-order functions, currying and composition", mins: 30,
        body: [
          "Functions are <b>first-class values</b>: store them, pass them, return them. A <b>higher-order function</b> takes or returns functions — map, filter, reduce, debounce, middleware, React HOCs.",
          "<b>Pure functions</b> return the same output for the same input and cause no side effects. They're easy to test, cache and run in parallel. Keep the impure parts (I/O, randomness, time) at the edges.",
          "<b>Immutability</b>: create new values instead of mutating — spread (<code>{...o, x: 1}</code>), <code>map</code>, <code>toSorted</code>. React and Redux rely on new references to detect change.",
          "<b>Currying</b> turns f(a, b, c) into f(a)(b)(c); <b>partial application</b> fixes some arguments. <code>fn.length</code> gives the number of declared parameters, which a generic curry uses to know when to call through.",
          "<b>Composition</b>: <code>compose(f, g)(x) = f(g(x))</code>; <code>pipe</code> runs left to right. Middleware chains, Redux enhancers and RxJS operators are all composition.",
          "<code>reduce</code> is the universal list operation: map, filter, groupBy and flatten can all be written with it.",
        ],
        keys: ["Higher-order = takes or returns functions.", "Pure functions are testable and cacheable.", "fn.length drives generic currying.", "pipe = left-to-right composition."],
        ex: "Express middleware (req, res, next) and Redux's applyMiddleware are function composition you already use without noticing.",
        fact: "Currying is named after logician Haskell Curry — the Haskell language is named after him too.",
        quiz: [
          { q: "Which is a pure function?", o: ["(x) =&gt; x * 2", "() =&gt; Date.now()", "(a) =&gt; a.push(1)", "() =&gt; Math.random()"], a: 0, why: "Same input, same output, no side effects." },
          { q: "pipe(f, g)(x) equals…", o: ["f(g(x))", "g(f(x))", "f(x) + g(x)", "[f(x), g(x)]"], a: 1, why: "Left to right: f first." },
        ],
        code: [
          { id: "js-flatten", t: "flatten(arr, depth)", diff: "Easy", fn: "flatten",
            statement: "<p>Write <code>flatten(arr, depth = 1)</code> that behaves like <code>Array.prototype.flat</code> without using it. <code>depth = Infinity</code> flattens completely.</p>",
            examples: [{ in: "flatten([1, [2, [3, [4]]]], 2)", out: "[1, 2, 3, [4]]" }],
            hints: ["Loop over items; if an item is an array and depth > 0, recurse with depth − 1.", "Otherwise push the item as is."],
            starter: `function flatten(arr, depth = 1) {
  // your code here (no .flat)
}`,
            solution: `function flatten(arr, depth = 1) {
  const out = [];
  for (const x of arr) {
    if (Array.isArray(x) && depth > 0) out.push(...flatten(x, depth - 1));
    else out.push(x);
  }
  return out;
}`,
            complexity: "O(n) over all elements visited.",
            tests: [
              { args: [[1, [2, [3, [4]]]], 2], expect: [1, 2, 3, [4]] }, { args: [[1, [2, [3]]]], expect: [1, 2, [3]] }, { args: [[[["a"]], "b"], 0], expect: [[["a"]], "b"] },
              { label: "Infinity", run: `(f) => f([1, [2, [3, [4, [5]]]]], Infinity)`, expect: [1, 2, 3, 4, 5] }, { args: [[]], expect: [] },
            ] },
          { id: "js-curry", t: "curry()", diff: "Medium", fn: "curry",
            statement: "<p>Write <code>curry(fn)</code>. The curried function collects arguments across calls and calls <code>fn</code> once it has at least <code>fn.length</code> arguments. Calls may pass several arguments at once.</p>",
            examples: [{ in: "const add3 = curry((a, b, c) => a + b + c); add3(1)(2)(3); add3(1, 2)(3); add3(1)(2, 3)", out: "6, 6, 6" }],
            hints: ["Return a function that takes ...args.", "If args.length >= fn.length, call fn; otherwise return a function that waits for more, combining old and new args."],
            starter: `function curry(fn) {
  // your code here
}`,
            solution: `function curry(fn) {
  return function curried(...args) {
    if (args.length >= fn.length) return fn.apply(this, args);
    return (...more) => curried.apply(this, [...args, ...more]);
  };
}`,
            explain: "Each partial call returns a new closure holding the arguments so far, so curried functions can be reused: const add1 = add3(1).",
            tests: [
              { label: "one at a time", run: `(curry) => curry((a, b, c) => a + b + c)(1)(2)(3)`, expect: 6 },
              { label: "mixed groups", run: `(curry) => { const f = curry((a, b, c) => a * b * c); return [f(2, 3)(4), f(2)(3, 4), f(2, 3, 4)]; }`, expect: [24, 24, 24] },
              { label: "reusable partials", run: `(curry) => { const add = curry((a, b) => a + b); const add10 = add(10); return [add10(1), add10(2)]; }`, expect: [11, 12] },
            ] },
          { id: "js-pipe", t: "pipe() and compose()", diff: "Easy", fn: "pipe",
            statement: "<p>Write <code>pipe(...fns)</code> that returns a function passing its input through each function left to right. With no functions it returns the input unchanged.</p>",
            examples: [{ in: "pipe(x => x + 1, x => x * 2)(5)", out: "12" }],
            hints: ["reduce over fns, starting from the input value."],
            starter: `function pipe(...fns) {
  // your code here
}`,
            solution: `function pipe(...fns) {
  return (x) => fns.reduce((v, f) => f(v), x);
}`,
            tests: [
              { label: "two functions", run: `(pipe) => pipe((x) => x + 1, (x) => x * 2)(5)`, expect: 12 },
              { label: "order matters", run: `(pipe) => pipe((x) => x * 2, (x) => x + 1)(5)`, expect: 11 },
              { label: "no functions", run: `(pipe) => pipe()(7)`, expect: 7 },
            ] },
        ] },
      { id: "wjs-objects", t: "Objects deep: descriptors, Map/Set, iterators, generators, Proxy", mins: 35,
        body: [
          "Each property has a <b>descriptor</b>: value, writable, enumerable, configurable (or get/set for accessors). <code>Object.freeze</code> makes properties non-writable and non-configurable — but only one level deep.",
          "<b>Map</b> keeps insertion order, allows any key type and has O(1) size; prefer it over plain objects for dictionaries. <b>Set</b> stores unique values. <b>WeakMap/WeakSet</b> hold keys weakly, so they don't prevent garbage collection — perfect for caching data about DOM nodes or objects you don't own.",
          "<b>Iteration protocol</b>: an object is iterable if it has a <code>[Symbol.iterator]()</code> method returning an iterator with <code>next()</code> → <code>{ value, done }</code>. for…of, spread and destructuring all use it.",
          "<b>Generators</b> (<code>function*</code>) produce iterators lazily with <code>yield</code>; they pause and resume, which makes infinite sequences and step-by-step algorithms easy. Async generators plus <code>for await</code> stream data.",
          "<b>Proxy</b> intercepts operations (get, set, has, deleteProperty…) on an object; <b>Reflect</b> performs the default behaviour. Vue 3 and MobX use proxies for reactivity.",
          "Copying: spread and <code>Object.assign</code> are shallow. <code>structuredClone</code> deep-copies most data (including Map, Set, Date and cycles) but not functions or class prototypes.",
        ],
        keys: ["freeze is shallow.", "Map for dictionaries; WeakMap for metadata without leaks.", "Iterables implement Symbol.iterator.", "structuredClone deep-copies data, not functions."],
        ex: "Vue's reactivity wraps your state in a Proxy: every get records a dependency and every set triggers the components that read that property.",
        fact: "structuredClone became available in all major browsers in 2022 — before that, people abused JSON.parse(JSON.stringify(x)), which loses dates, Maps and undefined.",
        quiz: [
          { q: "Object.freeze({a: {b: 1}}) — can you change .a.b?", o: ["No", "Yes, freeze is shallow", "Only in strict mode", "TypeError always"], a: 1, why: "The inner object isn't frozen." },
          { q: "Which lets keys be garbage-collected?", o: ["Map", "Object", "WeakMap", "Array"], a: 2, why: "Weak references don't keep keys alive." },
        ],
        code: [
          { id: "js-deepclone", t: "deepClone with cycles", diff: "Hard", fn: "deepClone",
            statement: "<p>Write <code>deepClone(value)</code> without structuredClone. Support plain objects, arrays, Date, Map, Set, nested structures and <b>circular references</b> (a cloned cycle must point to the cloned object, not the original). Primitives and functions are returned as is.</p>",
            examples: [{ in: "const a = {x: [1, {y: 2}]}; const b = deepClone(a); b.x[1].y = 9; a.x[1].y", out: "2" }],
            hints: ["Recursion handles nesting.", "Keep a Map from original object to its clone; check it first to handle cycles.", "Register the clone in the map before recursing into children."],
            starter: `function deepClone(value) {
  // your code here
}`,
            solution: `function deepClone(value, seen = new Map()) {
  if (value === null || typeof value !== 'object') return value;
  if (seen.has(value)) return seen.get(value);
  if (value instanceof Date) return new Date(value.getTime());
  if (value instanceof Map) {
    const m = new Map(); seen.set(value, m);
    value.forEach((v, k) => m.set(deepClone(k, seen), deepClone(v, seen)));
    return m;
  }
  if (value instanceof Set) {
    const s = new Set(); seen.set(value, s);
    value.forEach((v) => s.add(deepClone(v, seen)));
    return s;
  }
  const out = Array.isArray(value) ? [] : Object.create(Object.getPrototypeOf(value));
  seen.set(value, out);
  for (const k of Object.keys(value)) out[k] = deepClone(value[k], seen);
  return out;
}`,
            explain: "The seen map is what makes cycles work: when we meet an object again, we return the clone we already started instead of recursing forever.",
            complexity: "O(n) objects and properties.",
            tests: [
              { label: "independent copy", run: `(c) => { const a = { x: [1, { y: 2 }] }; const b = c(a); b.x[1].y = 9; return [a.x[1].y, b.x[1].y, a.x !== b.x]; }`, expect: [2, 9, true] },
              { label: "dates", run: `(c) => { const d = new Date(0); const e = c({ d }).d; return [e !== d, e.getTime()]; }`, expect: [true, 0] },
              { label: "maps and sets", run: `(c) => { const m = new Map([['k', { v: 1 }]]); const s = new Set([1, 2]); const r = c({ m, s }); r.m.get('k').v = 5; return [m.get('k').v, r.s.has(2), r.s !== s]; }`, expect: [1, true, true] },
              { label: "cycles", run: `(c) => { const a = { name: 'a' }; a.self = a; const b = c(a); return [b.self === b, b !== a]; }`, expect: [true, true] },
              { args: [5], expect: 5 },
            ] },
          { id: "js-emitter", t: "EventEmitter", diff: "Medium", fn: "EventEmitter",
            statement: "<p>Implement a class <code>EventEmitter</code> with <code>on(event, fn)</code> (returns an unsubscribe function), <code>once(event, fn)</code>, <code>off(event, fn)</code> and <code>emit(event, ...args)</code> (returns true if any listener ran). Listeners run in the order they were added; removing a listener during emit must not skip others.</p>",
            examples: [{ in: "e.on('hi', n => log(n)); e.emit('hi', 1)", out: "logs 1, returns true" }],
            hints: ["Store a Map from event name to an array of listeners.", "In emit, iterate over a copy of the array (slice) so removals during emit are safe.", "once can wrap fn in a function that removes itself then calls fn."],
            starter: `class EventEmitter {
  // your code here
}`,
            solution: `class EventEmitter {
  constructor() { this.map = new Map(); }
  on(event, fn) {
    if (!this.map.has(event)) this.map.set(event, []);
    this.map.get(event).push(fn);
    return () => this.off(event, fn);
  }
  once(event, fn) {
    const wrap = (...args) => { this.off(event, wrap); fn(...args); };
    return this.on(event, wrap);
  }
  off(event, fn) {
    const list = this.map.get(event);
    if (!list) return;
    const i = list.indexOf(fn);
    if (i !== -1) list.splice(i, 1);
  }
  emit(event, ...args) {
    const list = this.map.get(event);
    if (!list || !list.length) return false;
    list.slice().forEach((fn) => fn(...args));
    return true;
  }
}`,
            explain: "This is the observer pattern behind Node's EventEmitter, DOM events and many state libraries.",
            tests: [
              { label: "on + emit", run: `(E) => { const e = new E(); const got = []; e.on('a', (x, y) => got.push(x + y)); const r = e.emit('a', 1, 2); return [got, r, e.emit('none')]; }`, expect: [[3], true, false] },
              { label: "unsubscribe", run: `(E) => { const e = new E(); let n = 0; const off = e.on('a', () => n++); e.emit('a'); off(); e.emit('a'); return n; }`, expect: 1 },
              { label: "once", run: `(E) => { const e = new E(); let n = 0; e.once('a', () => n++); e.emit('a'); e.emit('a'); return n; }`, expect: 1 },
              { label: "order and safe removal", run: `(E) => { const e = new E(); const log = []; const f1 = () => { log.push(1); e.off('a', f1); }; e.on('a', f1); e.on('a', () => log.push(2)); e.emit('a'); e.emit('a'); return log; }`, expect: [1, 2, 2] },
            ] },
          { id: "js-range", t: "A lazy range generator", diff: "Easy", fn: "range",
            statement: "<p>Write a generator function <code>range(start, end, step = 1)</code> that yields numbers from start up to (not including) end. Support negative steps (counting down). It must be lazy: <code>range(0, Infinity)</code> must not hang.</p>",
            examples: [{ in: "[...range(0, 5)]", out: "[0, 1, 2, 3, 4]" }, { in: "[...range(5, 0, -2)]", out: "[5, 3, 1]" }],
            hints: ["Use function* and yield inside a loop.", "The loop condition depends on the sign of step."],
            starter: `function* range(start, end, step = 1) {
  // your code here
}`,
            solution: `function* range(start, end, step = 1) {
  if (step === 0) throw new Error('step must not be 0');
  for (let i = start; step > 0 ? i < end : i > end; i += step) yield i;
}`,
            tests: [
              { label: "basic", run: `(r) => [...r(0, 5)]`, expect: [0, 1, 2, 3, 4] }, { label: "step", run: `(r) => [...r(1, 10, 3)]`, expect: [1, 4, 7] },
              { label: "countdown", run: `(r) => [...r(5, 0, -2)]`, expect: [5, 3, 1] },
              { label: "lazy infinite", run: `(r) => { const out = []; for (const x of r(0, Infinity)) { if (x > 3) break; out.push(x); } return out; }`, expect: [0, 1, 2, 3] },
            ] },
        ] },
      { id: "wjs-engine", t: "How engines run JavaScript: V8, JIT, hidden classes and GC", mins: 30,
        body: [
          "V8 (Chrome, Node, Edge) parses source into an AST, compiles it to <b>bytecode</b> run by the <b>Ignition</b> interpreter, and recompiles hot functions with optimising compilers (<b>Sparkplug</b>, <b>Maglev</b>, <b>TurboFan</b>) using type feedback collected while running.",
          "Optimised code makes <b>assumptions</b> (this argument is always a small integer; this object always has shape X). If an assumption breaks, V8 <b>deoptimises</b> back to bytecode. Consistent types make code fast.",
          "<b>Hidden classes (shapes/maps)</b>: objects created with the same properties in the same order share a shape, so property access compiles to a fixed memory offset. <b>Inline caches</b> remember the shapes seen at each access site: monomorphic (one shape) is fastest; megamorphic (many) is slow. Initialise all properties in the constructor, in the same order; avoid delete.",
          "<b>Garbage collection</b>: V8 is generational — a fast <b>scavenger</b> copies live objects out of the young generation; a <b>mark-compact</b> collector handles the old generation, mostly concurrently and incrementally to avoid long pauses.",
          "Common leaks: forgotten timers and event listeners, growing caches/Maps, detached DOM nodes still referenced, closures capturing big objects. Find them with Chrome DevTools heap snapshots (compare two snapshots) and the Performance panel.",
        ],
        keys: ["Bytecode first, then JIT for hot code.", "Stable types and shapes keep code optimised.", "Generational GC: scavenge young, mark-compact old.", "Leaks = something still references it."],
        ex: "A Node API whose memory grows forever often has a module-level Map used as a cache with no size limit — an LRU cache fixes it.",
        fact: "V8 was released with Chrome in 2008; its speed made running JavaScript on servers (Node.js, 2009) practical.",
        quiz: [
          { q: "What causes a deoptimisation?", o: ["Comments", "A function's type assumptions being broken", "Using const", "Short variable names"], a: 1, why: "Optimised code is only valid for the types it saw." },
          { q: "Which pattern keeps objects sharing one hidden class?", o: ["Adding properties in random order", "Initialising the same properties in the same order", "Using delete", "Using eval"], a: 1, why: "Same layout, same shape." },
        ],
        pq: [
          { q: "How would you find a memory leak in a React app?", a: "Record heap snapshots before and after repeating an action (open/close a modal 10 times); compare them and look for objects whose count keeps growing (detached nodes, listeners); follow the retainer path to the code holding them." },
          { q: "Why can using delete obj.prop slow code down?", a: "It changes the object's shape (often to a slow dictionary mode), making inline caches at access sites polymorphic or megamorphic." },
        ],
        project: { t: "Lab: write your own lodash-lite", brief: "Package the utilities from this subject as a tested npm-style library — a portfolio piece that proves JavaScript depth.", steps: ["Create a repo js-core with src/ and test/ folders; use Node's built-in test runner (node --test).", "Move typeOf, deepEqual, deepClone, once, memoize, curry, pipe, flatten and EventEmitter in, each with its own tests (copy the cases from Pnode, then add edge cases).", "Add debounce and throttle from the next subject.", "Add JSDoc types (or convert to TypeScript) and a README with examples.", "Run a coverage report (node --test --experimental-test-coverage) and aim for 95%+."], stretch: ["Publish to npm under a scoped name", "Benchmark your deepClone against structuredClone", "Add GitHub Actions CI"] } },
    ] },
  ],
});
