LIB_ADD({
  id: "web-async", title: "Asynchronous JavaScript and the event loop", group: "Web degree depth", order: 2, glyph: "ASY",
  blurb: "Call stack, task and microtask queues, rendering, Node's loop phases, promises from the inside, async/await, cancellation and concurrency control — with problems that make you build Promise.all, retry, debounce and a task pool.",
  intro: "Async code is where most real bugs live: race conditions, unhandled rejections, frozen UIs, request floods. After this subject you'll predict the exact output order of any snippet and write the async utilities interviewers love to ask for.",
  modules: [
    { title: "1. The event loop", lessons: [
      { id: "was-loop", t: "Call stack, tasks, microtasks and rendering", mins: 35,
        body: [
          "JavaScript runs on <b>one thread</b> with one <b>call stack</b>. Long synchronous work blocks everything: clicks, rendering, timers.",
          "The host (browser or Node) provides async APIs (timers, network, DOM events). When they finish, they queue a callback. The <b>event loop</b> repeats: (1) run one <b>task</b> (macrotask) from the task queue — a script, a timer callback, an event handler; (2) run <b>all microtasks</b> until that queue is empty — promise reactions (<code>then</code>/<code>await</code> continuations), <code>queueMicrotask</code>, MutationObserver; (3) if it's time, <b>render</b> (requestAnimationFrame callbacks, style, layout, paint); repeat.",
          "Consequences: promise callbacks always run before the next setTimeout callback, even setTimeout(fn, 0). A microtask that keeps queueing microtasks starves rendering just like an infinite loop.",
          "Classic puzzle:<pre>console.log(1);\nsetTimeout(() =&gt; console.log(2));\nPromise.resolve().then(() =&gt; console.log(3));\nqueueMicrotask(() =&gt; console.log(4));\nconsole.log(5);</pre>Output: <b>1 5 3 4 2</b> — sync first, then microtasks in order, then the timer task.",
          "<code>await x</code> splits an async function: everything after it runs as a microtask once x settles. An async function runs synchronously until its first await.",
          "<b>Node.js</b> phases (libuv): timers → pending callbacks → poll (I/O) → check (<code>setImmediate</code>) → close callbacks. <code>process.nextTick</code> runs before promise microtasks, after the current operation. Inside an I/O callback, setImmediate always runs before setTimeout(…, 0).",
          "Browsers clamp nested timers to at least 4 ms after several levels and throttle timers in background tabs.",
        ],
        keys: ["One task, then all microtasks, then maybe render.", "Promise callbacks beat setTimeout(…, 0).", "Code after await is a microtask.", "Node: nextTick before promises; setImmediate in the check phase."],
        ex: "A 'Loading…' spinner that never appears because you set state and then ran a heavy loop: the browser never got a chance to render between them. Splitting the work (or a Web Worker) fixes it.",
        fact: "The HTML specification, not the JavaScript (ECMAScript) specification, defines the browser's event loop; ECMAScript only defines jobs (microtasks).",
        quiz: [
          { q: "Which runs first after the current script: a resolved promise's then, or setTimeout(…, 0)?", o: ["setTimeout", "The promise's then", "Random", "Whichever was written first"], a: 1, why: "Microtasks drain before the next task." },
          { q: "In Node, which runs first: process.nextTick or Promise.resolve().then?", o: ["Promise then", "process.nextTick", "Same time", "Depends on OS"], a: 1, why: "The nextTick queue is processed before the promise microtask queue." },
          { q: "async function f() { console.log('a'); await null; console.log('b'); } f(); console.log('c'); prints…", o: ["a b c", "a c b", "c a b", "b a c"], a: 1, why: "f runs synchronously until await; the rest is a microtask." },
        ],
        wp: [
          { q: "Predict the output:<pre>setTimeout(() =&gt; console.log('T1'));\nPromise.resolve().then(() =&gt; {\n  console.log('P1');\n  setTimeout(() =&gt; console.log('T2'));\n  Promise.resolve().then(() =&gt; console.log('P2'));\n});\nconsole.log('S');</pre>", s: ["Synchronous: S.", "Microtasks: P1 runs, queues timer T2 (after T1) and microtask P2; microtasks keep draining → P2.", "Tasks: T1, then T2."], a: "S, P1, P2, T1, T2." },
          { q: "Predict: <pre>async function a() { console.log(1); await b(); console.log(2); }\nasync function b() { console.log(3); }\na(); console.log(4);</pre>", s: ["a() logs 1, calls b() which logs 3 and returns a resolved promise.", "await suspends a; control returns: log 4.", "Microtask resumes a: log 2."], a: "1, 3, 4, 2." },
        ],
        pq: [
          { q: "Why does a while loop waiting for a flag set by setTimeout never end?", a: "The loop occupies the only thread, so the event loop never gets to run the timer callback that would set the flag." },
          { q: "How would you keep the UI responsive while processing 1 million items?", a: "Chunk the work (process ~1,000 items, then yield with setTimeout/scheduler.yield/requestIdleCallback), or move it to a Web Worker." },
        ] },
      { id: "was-promise", t: "Promises from the inside", mins: 35,
        body: [
          "A promise is a placeholder for a future value with three states: <b>pending</b>, <b>fulfilled</b>, <b>rejected</b>. It settles once and never changes again.",
          "<code>then(onFulfilled, onRejected)</code> returns a <b>new promise</b> resolved with whatever the handler returns — a value, or another promise (which is adopted). Throwing inside a handler rejects the new promise. That's why chains work and why you must <b>return</b> inner promises.",
          "<code>catch(fn)</code> = <code>then(undefined, fn)</code>; <code>finally(fn)</code> runs either way and passes the original result through. An error skips fulfilled handlers until a rejection handler.",
          "Combinators: <code>Promise.all</code> (all fulfil → array in input order; first rejection rejects), <code>allSettled</code> (wait for all, never rejects), <code>race</code> (first to settle), <code>any</code> (first to fulfil; AggregateError if all reject).",
          "<b>Unhandled rejections</b> crash Node processes (since Node 15) and log errors in browsers. Every promise chain needs a handler at the end.",
          "Common mistakes: forgetting to return in a then; mixing callbacks and promises; <code>await</code> inside <code>forEach</code> (forEach doesn't wait — use for…of or Promise.all with map); sequential awaits for independent work (use Promise.all).",
        ],
        keys: ["then returns a new promise.", "Return inner promises to keep chains flat.", "all: fail fast; allSettled: never fails.", "await inside forEach doesn't wait."],
        ex: "Loading a dashboard's user, orders and notifications with three sequential awaits takes the sum of their times; Promise.all takes only the slowest one.",
        fact: "Promises were standardised in ES2015 after years of community libraries (Q, Bluebird) following the Promises/A+ specification.",
        quiz: [
          { q: "Promise.all([p1, p2]) when p2 rejects first…", o: ["Waits for p1 then resolves", "Rejects immediately with p2's reason", "Resolves with [p1]", "Never settles"], a: 1, why: "It fails fast." },
          { q: "Which never rejects?", o: ["all", "race", "allSettled", "any"], a: 2, why: "It reports each outcome instead." },
        ],
        pq: [
          { q: "What does this log? Promise.resolve(1).then(x =&gt; { x + 1 }).then(console.log)", a: "undefined — the arrow with braces doesn't return anything." },
          { q: "Rewrite to run in parallel: const a = await getA(); const b = await getB();", a: "const [a, b] = await Promise.all([getA(), getB()]);" },
        ],
        code: [
          { id: "as-all", t: "Implement Promise.all", diff: "Medium", fn: "promiseAll",
            statement: "<p>Write <code>promiseAll(items)</code> behaving like <code>Promise.all</code>: items may be promises or plain values; resolve with results <b>in input order</b>; reject as soon as any promise rejects; an empty array resolves to <code>[]</code>.</p>",
            examples: [{ in: "promiseAll([1, Promise.resolve(2), sleep(10).then(() => 3)])", out: "[1, 2, 3]" }],
            hints: ["Return new Promise((resolve, reject) => …).", "Wrap each item with Promise.resolve so plain values work.", "Store each result at its index and count how many finished; resolve when the count reaches the length."],
            starter: `function promiseAll(items) {
  // your code here
}`,
            solution: `function promiseAll(items) {
  return new Promise((resolve, reject) => {
    const out = new Array(items.length);
    let left = items.length;
    if (left === 0) return resolve(out);
    items.forEach((it, i) => {
      Promise.resolve(it).then((v) => {
        out[i] = v;
        if (--left === 0) resolve(out);
      }, reject);
    });
  });
}`,
            explain: "Results go into their index, not the order they finish. Calling reject more than once is harmless because a promise settles only once.",
            tests: [
              { label: "values and promises in order", run: `async (all) => all([1, Promise.resolve(2), new Promise((r) => setTimeout(() => r(3), 20)), new Promise((r) => setTimeout(() => r(4), 5))])`, expect: [1, 2, 3, 4] },
              { label: "empty", run: `async (all) => all([])`, expect: [] },
              { label: "rejects fast", run: `async (all) => { const t0 = Date.now(); try { await all([new Promise((r) => setTimeout(r, 300)), Promise.reject(new Error('boom'))]); return 'resolved'; } catch (e) { return [e.message, Date.now() - t0 < 200]; } }`, expect: ["boom", true] },
            ] },
          { id: "as-settled", t: "Implement Promise.allSettled", diff: "Easy", fn: "allSettled",
            statement: "<p>Write <code>allSettled(items)</code> that waits for every item and resolves to an array of <code>{status: 'fulfilled', value}</code> or <code>{status: 'rejected', reason}</code> objects, in input order. It never rejects.</p>",
            examples: [{ in: "allSettled([1, Promise.reject('x')])", out: "[{status:'fulfilled', value:1}, {status:'rejected', reason:'x'}]" }],
            hints: ["Map each item to a promise that always fulfils: .then(value => ({…}), reason => ({…})).", "Then you can use Promise.all on those."],
            starter: `function allSettled(items) {
  // your code here
}`,
            solution: `function allSettled(items) {
  return Promise.all(items.map((it) => Promise.resolve(it).then(
    (value) => ({ status: 'fulfilled', value }),
    (reason) => ({ status: 'rejected', reason })
  )));
}`,
            tests: [
              { label: "mixed", run: `async (f) => f([1, Promise.reject('x'), Promise.resolve(3)])`, expect: [{ status: "fulfilled", value: 1 }, { status: "rejected", reason: "x" }, { status: "fulfilled", value: 3 }] },
              { label: "empty", run: `async (f) => f([])`, expect: [] },
            ] },
        ] },
    ] },
    { title: "2. Async patterns", lessons: [
      { id: "was-patterns", t: "Retries, timeouts, cancellation and concurrency limits", mins: 35,
        body: [
          "Networks fail. <b>Retry</b> transient failures (timeouts, 503, 429) with <b>exponential backoff</b> (wait 100 ms, 200 ms, 400 ms…) plus <b>jitter</b> (randomness) so thousands of clients don't retry in lockstep. Never blindly retry non-idempotent operations like 'charge card' — use idempotency keys.",
          "<b>Timeouts</b>: a request that never returns is worse than one that fails. Race the work against a timer, or use <code>AbortSignal.timeout(ms)</code> with fetch.",
          "<b>Cancellation</b>: <code>AbortController</code> creates a signal you pass to fetch (and your own async functions); <code>controller.abort()</code> rejects with an AbortError. Use it to cancel stale searches when the user keeps typing, and in React effects' cleanup.",
          "<b>Concurrency limits</b>: firing 10,000 requests at once overwhelms servers, browsers (~6 connections per host on HTTP/1.1) and rate limits. A <b>pool</b> keeps at most N tasks in flight and starts the next as one finishes.",
          "<b>Debounce</b> waits until calls stop for N ms (search boxes, resize handlers). <b>Throttle</b> runs at most once per N ms (scroll handlers, analytics).",
          "<b>Race conditions in UIs</b>: responses can arrive out of order. Fixes: abort previous requests, or ignore responses whose request id isn't the latest.",
        ],
        keys: ["Retry with exponential backoff + jitter.", "Every network call needs a timeout.", "AbortController cancels fetches.", "Debounce waits for quiet; throttle limits rate."],
        ex: "A search box that fires a request per keystroke and shows whichever response arrives last can display results for 'ap' after you typed 'apple'. Debounce plus abort fixes it.",
        fact: "AWS's architecture guidance popularised 'exponential backoff and jitter' after measuring how synchronised retries made outages worse.",
        quiz: [
          { q: "Which suits a search-as-you-type box?", o: ["Throttle", "Debounce", "Retry", "Promise.race"], a: 1, why: "Wait until the user pauses." },
          { q: "Why add jitter to backoff?", o: ["Looks random", "Avoid many clients retrying at the same instant", "Faster success", "Required by HTTP"], a: 1, why: "Synchronised retries create traffic spikes." },
        ],
        code: [
          { id: "as-timeout", t: "withTimeout()", diff: "Easy", fn: "withTimeout",
            statement: "<p>Write <code>withTimeout(promise, ms)</code> that resolves/rejects like <code>promise</code>, but rejects with <code>new Error('Timeout')</code> if it hasn't settled within <code>ms</code> milliseconds. Clear the timer when the promise settles first.</p>",
            examples: [{ in: "withTimeout(sleep(50), 10)", out: "rejects with Error('Timeout')" }],
            hints: ["Promise.race between the work and a timer promise.", "Use finally to clearTimeout."],
            starter: `function withTimeout(promise, ms) {
  // your code here
}`,
            solution: `function withTimeout(promise, ms) {
  let id;
  const timer = new Promise((_, reject) => { id = setTimeout(() => reject(new Error('Timeout')), ms); });
  return Promise.race([promise, timer]).finally(() => clearTimeout(id));
}`,
            tests: [
              { label: "fast promise wins", run: `async (f) => f(new Promise((r) => setTimeout(() => r('ok'), 10)), 100)`, expect: "ok" },
              { label: "slow promise times out", run: `async (f) => { try { await f(new Promise((r) => setTimeout(r, 200)), 20); return 'no'; } catch (e) { return e.message; } }`, expect: "Timeout" },
              { label: "passes rejections", run: `async (f) => { try { await f(Promise.reject(new Error('bad')), 50); } catch (e) { return e.message; } }`, expect: "bad" },
            ] },
          { id: "as-retry", t: "retry with exponential backoff", diff: "Medium", fn: "retry",
            statement: "<p>Write <code>retry(fn, {retries, baseMs})</code>. Call the async function <code>fn(attempt)</code> (attempt starts at 0). If it rejects, wait <code>baseMs × 2^attempt</code> ms and try again, up to <code>retries</code> extra attempts. Resolve with the first success, or reject with the last error.</p>",
            examples: [{ in: "retry(flaky, {retries: 3, baseMs: 10})", out: "waits 10, 20, 40 ms between attempts" }],
            hints: ["A for loop from attempt 0 to retries, with try/catch around await fn(attempt).", "Sleep with await new Promise(r => setTimeout(r, ms)).", "Don't sleep after the final failure."],
            starter: `async function retry(fn, { retries = 3, baseMs = 100 } = {}) {
  // your code here
}`,
            solution: `async function retry(fn, { retries = 3, baseMs = 100 } = {}) {
  let lastErr;
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await fn(attempt);
    } catch (err) {
      lastErr = err;
      if (attempt < retries) await new Promise((r) => setTimeout(r, baseMs * 2 ** attempt));
    }
  }
  throw lastErr;
}`,
            explain: "In production, add jitter (multiply the wait by a random factor) and only retry errors that are likely to be temporary.",
            tests: [
              { label: "succeeds on third try", run: `async (retry) => { let n = 0; const v = await retry(async () => { n++; if (n < 3) throw new Error('x'); return 'ok'; }, { retries: 5, baseMs: 5 }); return [v, n]; }`, expect: ["ok", 3] },
              { label: "gives up", run: `async (retry) => { let n = 0; try { await retry(async () => { n++; throw new Error('fail' + n); }, { retries: 2, baseMs: 5 }); } catch (e) { return [e.message, n]; } }`, expect: ["fail3", 3] },
              { label: "backoff timing", run: `async (retry) => { const t = []; const t0 = Date.now(); try { await retry(async () => { t.push(Date.now() - t0); throw 0; }, { retries: 2, baseMs: 40 }); } catch (e) {} return [t.length, t[1] >= 35, t[2] - t[1] >= 70]; }`, expect: [3, true, true] },
            ] },
          { id: "as-pool", t: "Run tasks with a concurrency limit", diff: "Hard", fn: "mapLimit",
            statement: "<p>Write <code>mapLimit(items, limit, worker)</code> where <code>worker(item)</code> returns a promise. Run at most <code>limit</code> workers at the same time, start the next item as soon as one finishes, and resolve with all results <b>in input order</b>. If any worker rejects, reject.</p>",
            examples: [{ in: "mapLimit([1,2,3,4,5], 2, fetchUser)", out: "never more than 2 requests in flight" }],
            hints: ["Keep a shared index of the next item to start.", "Start `limit` 'runner' loops; each runner takes the next index until none are left.", "await Promise.all(runners), then return the results array."],
            starter: `async function mapLimit(items, limit, worker) {
  // your code here
}`,
            solution: `async function mapLimit(items, limit, worker) {
  const results = new Array(items.length);
  let next = 0;
  async function runner() {
    while (next < items.length) {
      const i = next++;
      results[i] = await worker(items[i], i);
    }
  }
  const n = Math.max(1, Math.min(limit, items.length));
  await Promise.all(Array.from({ length: n }, runner));
  return results;
}`,
            explain: "Because JavaScript is single-threaded, next++ can't race: each runner grabs a unique index synchronously before awaiting.",
            complexity: "Total time ≈ sum of task times / limit (for similar tasks).",
            tests: [
              { label: "order and limit", run: `async (mapLimit) => { let active = 0, peak = 0; const res = await mapLimit([30, 10, 20, 5, 15], 2, async (ms) => { active++; peak = Math.max(peak, active); await new Promise((r) => setTimeout(r, ms)); active--; return ms * 2; }); return [res, peak]; }`, expect: [[60, 20, 40, 10, 30], 2] },
              { label: "actually parallel", run: `async (mapLimit) => { const t0 = Date.now(); await mapLimit([50, 50, 50, 50], 4, (ms) => new Promise((r) => setTimeout(r, ms))); return Date.now() - t0 < 150; }`, expect: true },
              { label: "rejects", run: `async (mapLimit) => { try { await mapLimit([1, 2, 3], 2, async (x) => { if (x === 2) throw new Error('bad'); return x; }); return 'ok'; } catch (e) { return e.message; } }`, expect: "bad" },
              { label: "empty input", run: `async (mapLimit) => mapLimit([], 3, async (x) => x)`, expect: [] },
            ] },
          { id: "as-debounce", t: "debounce()", diff: "Medium", fn: "debounce",
            statement: "<p>Write <code>debounce(fn, ms)</code>. The returned function delays calling <code>fn</code> until <code>ms</code> milliseconds have passed without another call, then calls it once with the <b>latest</b> arguments and <code>this</code>. Add a <code>cancel()</code> method.</p>",
            examples: [{ in: "const d = debounce(save, 300); d(1); d(2); d(3);", out: "save(3) called once, 300 ms after the last call" }],
            hints: ["Keep the timer id in the closure; clearTimeout on every call, then set a new timer.", "Store this and args at call time so the timer uses the latest ones."],
            starter: `function debounce(fn, ms) {
  // your code here
}`,
            solution: `function debounce(fn, ms) {
  let id = null;
  function debounced(...args) {
    clearTimeout(id);
    id = setTimeout(() => { id = null; fn.apply(this, args); }, ms);
  }
  debounced.cancel = () => { clearTimeout(id); id = null; };
  return debounced;
}`,
            tests: [
              { label: "calls once with last args", run: `async (debounce) => { const calls = []; const d = debounce((x) => calls.push(x), 30); d(1); d(2); d(3); await new Promise((r) => setTimeout(r, 80)); return calls; }`, expect: [3] },
              { label: "separate bursts", run: `async (debounce) => { const calls = []; const d = debounce((x) => calls.push(x), 20); d('a'); await new Promise((r) => setTimeout(r, 60)); d('b'); await new Promise((r) => setTimeout(r, 60)); return calls; }`, expect: ["a", "b"] },
              { label: "cancel", run: `async (debounce) => { let n = 0; const d = debounce(() => n++, 20); d(); d.cancel(); await new Promise((r) => setTimeout(r, 50)); return n; }`, expect: 0 },
            ] },
          { id: "as-throttle", t: "throttle()", diff: "Medium", fn: "throttle",
            statement: "<p>Write <code>throttle(fn, ms)</code>: the first call runs immediately; calls during the next <code>ms</code> milliseconds are ignored except the <b>last</b> one, which runs when the window ends (a 'trailing' call). The result: at most one call per window, and the final state is never lost.</p>",
            examples: [{ in: "t(1); t(2); t(3); (within 100 ms)", out: "fn(1) now, fn(3) at ~100 ms" }],
            hints: ["Track whether you're inside a window (a timer is running).", "While inside, just remember the latest args.", "When the window ends, if there were saved args, call fn with them and start a new window."],
            starter: `function throttle(fn, ms) {
  // your code here
}`,
            solution: `function throttle(fn, ms) {
  let timer = null, pending = null;
  const start = () => {
    timer = setTimeout(() => {
      timer = null;
      if (pending) { const [ctx, args] = pending; pending = null; fn.apply(ctx, args); start(); }
    }, ms);
  };
  return function (...args) {
    if (timer) { pending = [this, args]; return; }
    fn.apply(this, args);
    start();
  };
}`,
            tests: [
              { label: "leading + trailing", run: `async (throttle) => { const calls = []; const t = throttle((x) => calls.push(x), 40); t(1); t(2); t(3); await new Promise((r) => setTimeout(r, 100)); return calls; }`, expect: [1, 3] },
              { label: "single call", run: `async (throttle) => { const calls = []; const t = throttle((x) => calls.push(x), 20); t('x'); await new Promise((r) => setTimeout(r, 50)); return calls; }`, expect: ["x"] },
              { label: "rate limited", run: `async (throttle) => { let n = 0; const t = throttle(() => n++, 50); const end = Date.now() + 120; while (Date.now() < end) { t(); await new Promise((r) => setTimeout(r, 5)); } await new Promise((r) => setTimeout(r, 60)); return n >= 3 && n <= 5; }`, expect: true },
            ] },
        ] },
      { id: "was-workers", t: "Parallelism: Web Workers, worker threads and streams", mins: 25,
        body: [
          "Async ≠ parallel. Async lets one thread wait efficiently; CPU-heavy work still blocks it. For real parallelism use <b>Web Workers</b> (browser) or <b>worker_threads</b> (Node): separate threads with their own event loops, communicating by <b>message passing</b> (structured clone) or <b>transferable</b> objects (ArrayBuffers moved without copying). <b>SharedArrayBuffer</b> + <b>Atomics</b> allow true shared memory.",
          "This very page runs your code in a Web Worker so an infinite loop can be killed after 5 seconds without freezing Pnode.",
          "<b>Streams</b> process data piece by piece instead of loading it all: <code>fetch</code> response bodies are ReadableStreams; Node has Readable/Writable/Transform streams with <b>backpressure</b> (a fast producer pauses when the consumer's buffer is full). <code>pipeline()</code> wires them safely.",
          "<b>Async iterators</b> (<code>for await…of</code>) are the clean way to consume streams, paginated APIs and event sources.",
        ],
        keys: ["Async isn't parallel; workers are.", "Workers communicate by messages.", "Streams + backpressure keep memory flat.", "for await…of consumes async sources."],
        ex: "Generating a PDF or resizing images in the browser inside a Web Worker keeps scrolling smooth; doing it on the main thread freezes the page.",
        fact: "Node's single process can handle tens of thousands of concurrent connections precisely because waiting on I/O doesn't need a thread per connection.",
        quiz: [
          { q: "To speed up a CPU-heavy image filter in the browser, use…", o: ["async/await", "A Web Worker", "setTimeout(0)", "More promises"], a: 1, why: "Only another thread runs in parallel." },
          { q: "Backpressure means…", o: ["Compressing data", "Slowing the producer when the consumer can't keep up", "Retrying", "Encrypting streams"], a: 1, why: "It prevents unbounded buffering." },
        ],
        pq: [
          { q: "Why does reading a 5 GB file with fs.readFile crash Node, and what's the fix?", a: "It tries to load everything into memory (and exceeds buffer limits). Stream it with fs.createReadStream and pipeline, processing chunks." },
          { q: "What is a transferable object?", a: "An object like ArrayBuffer whose ownership moves to the worker instead of being copied; the sender can no longer use it, but the transfer is nearly free." },
        ],
        project: { t: "Lab: a resilient API client", brief: "Write fetchJson(url, options) for your capstones — the async utilities from this subject combined into production-grade code.", steps: ["Timeouts with AbortSignal.timeout and a clear error type.", "Retry only on network errors, 429 and 5xx, with exponential backoff + jitter; respect a Retry-After header.", "Deduplicate identical in-flight GET requests (return the same promise).", "Add mapLimit for bulk calls and an AbortController-based cancel.", "Test it against a tiny Express server that randomly fails or delays responses."], stretch: ["Circuit breaker that stops calling a failing service for 30 s", "Response caching with stale-while-revalidate", "Metrics: count retries and timeouts"] } },
    ] },
  ],
});
