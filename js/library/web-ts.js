LIB_ADD({
  id: "web-ts", title: "TypeScript's type system in depth", group: "Web degree depth", order: 7, glyph: "TS",
  blurb: "Structural typing, inference, narrowing, generics, keyof and mapped/conditional types, utility types, and modelling domains so illegal states can't compile — with type puzzles and runtime-safety problems.",
  intro: "TypeScript is a type system with its own logic: sets of values, assignability and type-level functions. Understanding it at this depth lets you write APIs that are impossible to misuse — the hallmark of a senior TypeScript engineer.",
  modules: [
    { title: "1. Types as sets", lessons: [
      { id: "wts-narrow", t: "Structural typing, unions and narrowing", mins: 35,
        body: [
          "Think of a type as a <b>set of values</b>. <code>string | number</code> is the union of two sets; <code>A &amp; B</code> is values that are in both. <code>never</code> is the empty set; <code>unknown</code> is every value (safe — you must narrow before use); <code>any</code> turns checking off (avoid).",
          "TypeScript is <b>structural</b>: a value is assignable to a type if it has the required shape, regardless of declared names. Object literals get an extra <b>excess property check</b> to catch typos.",
          "<b>Literal types</b> ('pending', 42, true) and <code>as const</code> keep values precise. <code>satisfies</code> checks a value against a type without widening it.",
          "<b>Narrowing</b> refines a union inside a branch: <code>typeof x === 'string'</code>, <code>'id' in x</code>, <code>x instanceof Date</code>, equality checks, truthiness, and <b>discriminated unions</b> — a shared literal field like <code>status</code> or <code>kind</code> tells TypeScript which member you have.",
          "<b>Type predicates</b> (<code>function isUser(x: unknown): x is User</code>) connect runtime checks to the type system — essential at boundaries (API responses, localStorage, JSON.parse).",
          "<b>Exhaustiveness</b>: in a switch over a discriminant, assign the leftover value to <code>never</code> in the default branch; adding a new union member then becomes a compile error everywhere it isn't handled.",
        ],
        keys: ["Types are sets of values.", "unknown is safe; any disables checking.", "Discriminated unions + switch = precise narrowing.", "never in default catches unhandled cases."],
        ex: "type Order = {status: 'pending'} | {status: 'shipped', trackingId: string}: inside if (o.status === 'shipped') TypeScript knows trackingId exists — and nowhere else.",
        fact: "TypeScript was released by Microsoft in 2012; its lead architect, Anders Hejlsberg, also designed C# and Turbo Pascal.",
        quiz: [
          { q: "Which type forces you to narrow before using the value?", o: ["any", "unknown", "never", "object"], a: 1, why: "unknown accepts everything but allows nothing until checked." },
          { q: "string & number is…", o: ["string | number", "never", "unknown", "any"], a: 1, why: "No value is both a string and a number." },
          { q: "TypeScript compares object types by…", o: ["Name", "Shape (structure)", "Declaration file", "Prototype"], a: 1, why: "It's structurally typed." },
        ],
        pq: [
          { q: "Write the type of a result that is either success with data or failure with an error message, and narrow it.", a: "type Result&lt;T&gt; = { ok: true; data: T } | { ok: false; error: string }. if (r.ok) { r.data } else { r.error } — the ok literal is the discriminant." },
          { q: "Why does const routes = ['home', 'about'] as const help?", a: "Its type becomes readonly ['home', 'about'] instead of string[], so (typeof routes)[number] is the union 'home' | 'about' — usable for type-safe links." },
        ],
        code: [
          { id: "ts-guard", t: "A runtime type guard for API data", diff: "Easy", fn: "isOrder",
            statement: "<p>Data from <code>fetch</code> is <code>unknown</code> until checked. Write <code>isOrder(x)</code> returning true only if x is a non-null object with <code>id</code> (a positive integer), <code>status</code> (one of 'pending', 'paid', 'shipped') and <code>items</code> (an array of objects each with a string <code>sku</code> and an integer <code>qty</code> ≥ 1). In TypeScript its signature would be <code>(x: unknown): x is Order</code>.</p>",
            examples: [{ in: "isOrder({id: 1, status: 'paid', items: [{sku: 'A1', qty: 2}]})", out: "true" }],
            hints: ["Check typeof x === 'object' && x !== null first.", "Number.isInteger handles 'positive integer' with a > 0 check.", "items.every(...) for each item."],
            starter: `function isOrder(x) {
  // your code here
}`,
            solution: `function isOrder(x) {
  if (typeof x !== 'object' || x === null) return false;
  const statuses = ['pending', 'paid', 'shipped'];
  return Number.isInteger(x.id) && x.id > 0 && statuses.includes(x.status) && Array.isArray(x.items) &&
    x.items.every((it) => typeof it === 'object' && it !== null && typeof it.sku === 'string' && Number.isInteger(it.qty) && it.qty >= 1);
}`,
            tests: [
              { args: [{ id: 1, status: "paid", items: [{ sku: "A1", qty: 2 }] }], expect: true }, { args: [{ id: 1, status: "lost", items: [] }], expect: false },
              { args: [{ id: 0, status: "paid", items: [] }], expect: false }, { args: [{ id: 2, status: "pending", items: [{ sku: "B", qty: 0 }] }], expect: false },
              { args: [null], expect: false }, { args: [{ id: 3, status: "shipped", items: [] }], expect: true }, { args: [{ id: 4, status: "paid", items: [null] }], expect: false },
            ] },
        ] },
      { id: "wts-generics", t: "Generics, keyof, mapped and conditional types", mins: 40,
        body: [
          "<b>Generics</b> are type parameters: <code>function first&lt;T&gt;(xs: T[]): T | undefined</code>. Constraints limit them: <code>&lt;T extends { id: string }&gt;</code>. Inference usually fills them in from arguments.",
          "<code>keyof T</code> is the union of T's keys; <code>T[K]</code> is an <b>indexed access</b> type. Together: <code>function get&lt;T, K extends keyof T&gt;(obj: T, key: K): T[K]</code> — a typo in key is a compile error and the return type is exact.",
          "<b>Mapped types</b> transform every property: <code>{ [K in keyof T]?: T[K] }</code> is <code>Partial&lt;T&gt;</code>; modifiers <code>readonly</code>, <code>-?</code> (remove optional); key remapping with <code>as</code> (<code>[K in keyof T as `get${Capitalize&lt;K &amp; string&gt;}`]</code>).",
          "<b>Conditional types</b>: <code>T extends U ? X : Y</code>, distributive over unions. <code>infer</code> extracts parts: <code>type Awaited2&lt;T&gt; = T extends Promise&lt;infer V&gt; ? V : T</code>.",
          "Built-in utility types: <code>Partial, Required, Readonly, Pick, Omit, Record, Exclude, Extract, NonNullable, ReturnType, Parameters, Awaited</code>. Template literal types build string unions ('GET /users' | 'POST /users').",
          "<b>Variance</b> in one line: arrays and object properties are checked covariantly; function parameters are contravariant under <code>strictFunctionTypes</code> — a handler for Animal can be used where a handler for Dog is expected, not the other way round.",
        ],
        keys: ["K extends keyof T, return T[K].", "Mapped types transform every property.", "Conditional types + infer extract types.", "Know the built-in utility types."],
        ex: "tRPC and Zod derive frontend types directly from backend code with inference, mapped and conditional types — no hand-written API types to drift out of sync.",
        fact: "TypeScript's type system is Turing-complete; people have written type-level programs that parse SQL or play tic-tac-toe at compile time.",
        quiz: [
          { q: "keyof { a: number; b: string } is…", o: ["'a' | 'b'", "number | string", "string", "['a','b']"], a: 0, why: "A union of the property names." },
          { q: "ReturnType&lt;() =&gt; Promise&lt;number&gt;&gt; is…", o: ["number", "Promise&lt;number&gt;", "() =&gt; number", "unknown"], a: 1, why: "Use Awaited&lt;…&gt; to unwrap the promise." },
        ],
        pq: [
          { q: "Implement MyPick&lt;T, K&gt; as a type.", a: "type MyPick&lt;T, K extends keyof T&gt; = { [P in K]: T[P] };" },
          { q: "Implement ElementType&lt;T&gt; that gives the element type of an array type, otherwise never.", a: "type ElementType&lt;T&gt; = T extends readonly (infer E)[] ? E : never;" },
          { q: "What is Exclude&lt;'a' | 'b' | 'c', 'a'&gt; and how does it work?", a: "'b' | 'c'. It's T extends U ? never : T, distributed over each member of the union." },
        ],
        code: [
          { id: "ts-pickomit", t: "pick and omit at runtime", diff: "Easy", fn: "pick",
            statement: "<p>TypeScript's <code>Pick</code> exists only at compile time. Write the runtime twin <code>pick(obj, keys)</code> that returns a new object with only the listed keys that exist on obj (own properties), in the order of <code>keys</code>. Its TypeScript signature would be <code>pick&lt;T, K extends keyof T&gt;(obj: T, keys: K[]): Pick&lt;T, K&gt;</code>.</p>",
            examples: [{ in: "pick({id: 1, name: 'A', pwd: 'x'}, ['id', 'name'])", out: "{id: 1, name: 'A'}" }],
            hints: ["Loop over keys and copy those that are own properties of obj."],
            starter: `function pick(obj, keys) {
  // your code here
}`,
            solution: `function pick(obj, keys) {
  const out = {};
  for (const k of keys) if (Object.prototype.hasOwnProperty.call(obj, k)) out[k] = obj[k];
  return out;
}`,
            tests: [
              { args: [{ id: 1, name: "A", pwd: "x" }, ["id", "name"]], expect: { id: 1, name: "A" } }, { args: [{ a: 1 }, ["b"]], expect: {} },
              { args: [{ a: undefined, b: 2 }, ["a"]], expect: { a: undefined } }, { args: [{}, []], expect: {} },
            ] },
        ] },
      { id: "wts-model", t: "Modelling domains: branded types, Result types and illegal states", mins: 35,
        body: [
          "<b>Make illegal states unrepresentable</b>: instead of <code>{loading: boolean; data?: T; error?: string}</code> (which allows loading + error + data at once), use a union: <code>{state: 'loading'} | {state: 'success', data: T} | {state: 'error', error: string}</code>.",
          "<b>Branded types</b> stop mixing up values with the same primitive type: <code>type UserId = string &amp; { readonly __brand: 'UserId' }</code>. A function taking UserId won't accept an OrderId or a raw string — create brands only after validation.",
          "<b>Errors as values</b>: a <code>Result&lt;T, E&gt;</code> type makes failure visible in signatures, unlike thrown exceptions which TypeScript can't track. Use it for expected failures (validation, not found); keep throwing for bugs.",
          "<b>Strictness</b>: enable <code>strict</code>, plus <code>noUncheckedIndexedAccess</code> (array/record access may be undefined) and <code>exactOptionalPropertyTypes</code>. Avoid <code>as</code> casts and non-null assertions (<code>!</code>) — each is a hole in the type system.",
          "Types disappear at runtime, so every boundary (HTTP, storage, env vars) needs runtime validation (Zod) that produces the types — one source of truth.",
        ],
        keys: ["Unions instead of combinations of booleans.", "Brands separate same-shaped IDs.", "Result types make expected failure explicit.", "Validate at runtime; derive types from schemas."],
        ex: "A payments function that takes (amountPaise: number, userId: string) can be called with arguments swapped; with branded Paise and UserId types, that bug can't compile.",
        fact: "The phrase 'make illegal states unrepresentable' was popularised by Yaron Minsky of Jane Street, writing about OCaml.",
        quiz: [
          { q: "Which models async data best?", o: ["{loading: boolean; error?: string; data?: T}", "A discriminated union of loading/success/error", "any", "string"], a: 1, why: "Only valid combinations can exist." },
          { q: "Why avoid 'as' casts?", o: ["They're slow", "They tell the compiler to trust you without checking", "They're deprecated", "They break JSX"], a: 1, why: "A wrong cast becomes a runtime bug." },
        ],
        code: [
          { id: "ts-result", t: "Errors as values: tryCatch", diff: "Easy", fn: "tryCatch",
            statement: "<p>Write <code>tryCatch(fn)</code> that calls <code>fn()</code> and returns <code>{ok: true, value}</code> on success or <code>{ok: false, error: message}</code> if it throws (use the error's message, or <code>String(error)</code> for non-Error throws). If fn returns a promise, return a promise of the same shape.</p>",
            examples: [{ in: "tryCatch(() => JSON.parse('{'))", out: "{ok: false, error: '…JSON…'}" }],
            hints: ["Wrap in try/catch.", "If the result has a .then method, attach then/catch handlers that build the same objects."],
            starter: `function tryCatch(fn) {
  // your code here
}`,
            solution: `function tryCatch(fn) {
  const fail = (e) => ({ ok: false, error: e instanceof Error ? e.message : String(e) });
  try {
    const v = fn();
    if (v && typeof v.then === 'function') return v.then((value) => ({ ok: true, value }), fail);
    return { ok: true, value: v };
  } catch (e) {
    return fail(e);
  }
}`,
            tests: [
              { label: "success", run: `(t) => t(() => 5)`, expect: { ok: true, value: 5 } },
              { label: "error", run: `(t) => t(() => { throw new Error('nope'); })`, expect: { ok: false, error: "nope" } },
              { label: "non-Error throw", run: `(t) => t(() => { throw 'raw'; })`, expect: { ok: false, error: "raw" } },
              { label: "async", run: `async (t) => [await t(async () => 1), await t(async () => { throw new Error('later'); })]`, expect: [{ ok: true, value: 1 }, { ok: false, error: "later" }] },
            ] },
        ] },
    ] },
  ],
});
