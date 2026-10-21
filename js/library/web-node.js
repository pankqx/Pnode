LIB_ADD({
  id: "web-node", title: "Node.js and backend engineering", group: "Web degree depth", order: 6, glyph: "API",
  blurb: "The Node runtime, streams, middleware and layered architecture, validation, caching, rate limiting, testing and observability — with problems where you build Koa-style middleware, a Zod-like validator, an LRU cache, a token bucket and a stream line splitter.",
  intro: "Backend engineering is about correctness under load: valid inputs, predictable errors, fast responses and systems you can debug at 2 a.m. This subject teaches the architecture and the core building blocks behind every production API.",
  modules: [
    { title: "1. Runtime and architecture", lessons: [
      { id: "wnd-runtime", t: "The Node.js runtime: libuv, modules, buffers and streams", mins: 35,
        body: [
          "Node = V8 (runs JavaScript) + <b>libuv</b> (event loop, async I/O) + core modules. Network I/O uses the OS's non-blocking APIs (epoll, kqueue, IOCP); file system, DNS lookups, crypto and zlib use libuv's <b>thread pool</b> (4 threads by default, <code>UV_THREADPOOL_SIZE</code>).",
          "<b>Modules</b>: CommonJS (<code>require</code>, synchronous, <code>module.exports</code>) and ES modules (<code>import</code>, static, async loading, top-level await). Use ESM for new code (<code>\"type\": \"module\"</code>).",
          "<b>Buffers</b> are raw bytes outside the V8 heap; strings are converted with an encoding (utf8, base64, hex).",
          "<b>Streams</b> handle data piece by piece: Readable, Writable, Duplex (sockets) and Transform (gzip). They support <b>backpressure</b>: when a writable's buffer is full, <code>write()</code> returns false and the source should pause until 'drain'. <code>stream.pipeline()</code> connects streams and handles errors and cleanup.",
          "Chunk boundaries are arbitrary: a line, a JSON object or a multi-byte UTF-8 character can be split across two chunks. Parsers must carry a <b>remainder</b> between chunks.",
          "<b>Process</b>: <code>process.env</code> for configuration, exit codes, signals (SIGTERM for graceful shutdown), and <code>cluster</code>/multiple processes behind a load balancer to use all CPU cores.",
        ],
        keys: ["libuv: OS async for network, thread pool for fs/crypto/dns.", "Prefer ES modules.", "Streams + backpressure keep memory flat.", "Chunks can split lines and characters — carry a remainder."],
        ex: "Importing a 2 GB CSV of orders: a stream pipeline (file → CSV parser → batch insert) uses a few MB of memory; reading the whole file first can crash the server.",
        fact: "Ryan Dahl presented Node.js at JSConf EU in 2009; libuv was later written to make Node work well on Windows as well as Unix.",
        quiz: [
          { q: "Which work uses libuv's thread pool?", o: ["TCP sockets", "fs.readFile and crypto.pbkdf2", "setTimeout", "Promise.then"], a: 1, why: "Network I/O uses non-blocking OS APIs instead." },
          { q: "writable.write() returning false means…", o: ["Error", "Buffer full — pause until 'drain'", "Stream closed", "Success"], a: 1, why: "That's the backpressure signal." },
        ],
        code: [
          { id: "nd-lines", t: "Split a stream into lines", diff: "Medium", fn: "splitLines",
            statement: "<p>Data arrives as an array of string chunks with arbitrary boundaries. Write <code>splitLines(chunks)</code> that returns the complete lines in order (without the newline characters). Lines end with <code>\\n</code> or <code>\\r\\n</code>. A final line without a trailing newline is still returned if non-empty.</p>",
            examples: [{ in: "splitLines(['ab', 'c\\nde', 'f\\r\\ng'])", out: "['abc', 'def', 'g']" }],
            hints: ["Keep a buffer string; append each chunk, then cut out every complete line.", "Strip a trailing \\r from each line.", "At the end, flush the leftover buffer if it's not empty."],
            starter: `function splitLines(chunks) {
  // your code here
}`,
            solution: `function splitLines(chunks) {
  const out = [];
  let buf = '';
  for (const chunk of chunks) {
    buf += chunk;
    let i;
    while ((i = buf.indexOf('\\n')) !== -1) {
      out.push(buf.slice(0, i).replace(/\\r$/, ''));
      buf = buf.slice(i + 1);
    }
  }
  if (buf.replace(/\\r$/, '')) out.push(buf.replace(/\\r$/, ''));
  return out;
}`,
            explain: "This remainder technique is exactly how readline, NDJSON parsers and log processors work. A \\r\\n split across chunks still works because the \\r is stripped when the \\n arrives.",
            tests: [
              { args: [["ab", "c\nde", "f\r\ng"]], expect: ["abc", "def", "g"] }, { args: [["one\r", "\ntwo\n"]], expect: ["one", "two"] },
              { args: [["\n\n"]], expect: ["", ""] }, { args: [[]], expect: [] }, { args: [["a\nb\nc\n"]], expect: ["a", "b", "c"] },
            ] },
        ] },
      { id: "wnd-arch", t: "Middleware, layered architecture and error handling", mins: 35,
        body: [
          "<b>Middleware</b> is a pipeline of functions around a request: logging, auth, body parsing, rate limiting, then the route handler. Express uses <code>(req, res, next)</code>; Koa and Hono use an <b>onion model</b> with <code>async (ctx, next) =&gt; { before; await next(); after; }</code> so each layer can act before and after the inner ones (timing, error wrapping).",
          "<b>Layered architecture</b>: routes/controllers (HTTP only: parse, validate, map to status codes) → <b>services</b> (business rules, transactions) → <b>repositories</b> (database queries). Business logic that doesn't import Express can be unit-tested and reused from a queue worker or CLI.",
          "<b>Dependency injection</b>: pass collaborators (db, mailer, clock) into services instead of importing singletons — tests can pass fakes.",
          "<b>Errors</b>: distinguish <b>operational</b> errors (invalid input, not found, conflict, upstream timeout — expected, map to 4xx/503) from <b>programmer</b> errors (bugs — log, return 500, and often restart). Use typed error classes (<code>NotFoundError</code>) and one central error handler that formats Problem Details responses. Never leak stack traces to clients.",
          "<b>Configuration</b> from environment variables validated at startup (fail fast); secrets never in git. <b>Graceful shutdown</b>: on SIGTERM, stop accepting connections, finish in-flight requests, close DB pools, then exit.",
        ],
        keys: ["Onion middleware: before → await next() → after.", "Controllers handle HTTP; services hold business rules.", "Inject dependencies for testability.", "Central error handler; operational vs programmer errors."],
        ex: "A 'createOrder' service that takes {db, payments, clock} works the same from an HTTP route, a webhook and a test — and in tests the clock is fixed, so time bugs are reproducible.",
        fact: "Koa was created by the team behind Express to use async functions and the onion middleware model.",
        quiz: [
          { q: "Where should 'an order over ₹50,000 needs manager approval' live?", o: ["Route handler", "Service layer", "Database trigger only", "Frontend"], a: 1, why: "It's a business rule, independent of HTTP." },
          { q: "In onion middleware, code after await next() runs…", o: ["Before inner layers", "After inner layers finish", "Never", "In parallel"], a: 1, why: "That's how a timing middleware measures the whole request." },
        ],
        code: [
          { id: "nd-compose", t: "Koa-style middleware compose", diff: "Hard", fn: "compose",
            statement: "<p>Write <code>compose(middlewares)</code> returning <code>(ctx) =&gt; Promise</code>. Each middleware is <code>async (ctx, next) =&gt; …</code>. Calling <code>next()</code> runs the next middleware and returns a promise that resolves when it (and everything after it) finishes. If a middleware doesn't call next, later ones don't run. Calling <code>next()</code> twice in one middleware must reject with <code>Error('next() called multiple times')</code>. Errors thrown anywhere must reject the composed promise.</p>",
            examples: [{ in: "compose([async (c, n) => { c.log.push(1); await n(); c.log.push(4); }, async (c, n) => { c.log.push(2); await n(); c.log.push(3); }])({log: []})", out: "ctx.log = [1, 2, 3, 4]" }],
            hints: ["Write a dispatch(i) function that calls middlewares[i](ctx, () => dispatch(i + 1)).", "Track the last index dispatched to detect double next().", "Wrap calls in Promise.resolve and try/catch so sync throws become rejections."],
            starter: `function compose(middlewares) {
  // your code here
}`,
            solution: `function compose(middlewares) {
  return function (ctx) {
    let last = -1;
    function dispatch(i) {
      if (i <= last) return Promise.reject(new Error('next() called multiple times'));
      last = i;
      const fn = middlewares[i];
      if (!fn) return Promise.resolve();
      try {
        return Promise.resolve(fn(ctx, () => dispatch(i + 1)));
      } catch (err) {
        return Promise.reject(err);
      }
    }
    return dispatch(0);
  };
}`,
            explain: "This is essentially koa-compose. The onion order comes for free from awaiting the promise returned by next().",
            tests: [
              { label: "onion order", run: `async (compose) => { const ctx = { log: [] }; await compose([async (c, n) => { c.log.push(1); await n(); c.log.push(4); }, async (c, n) => { c.log.push(2); await n(); c.log.push(3); }])(ctx); return ctx.log; }`, expect: [1, 2, 3, 4] },
              { label: "stops without next", run: `async (compose) => { const ctx = { log: [] }; await compose([async (c) => { c.log.push('a'); }, async (c) => { c.log.push('b'); }])(ctx); return ctx.log; }`, expect: ["a"] },
              { label: "errors reject", run: `async (compose) => { try { await compose([async (c, n) => { await n(); }, () => { throw new Error('boom'); }])({}); return 'ok'; } catch (e) { return e.message; } }`, expect: "boom" },
              { label: "double next", run: `async (compose) => { try { await compose([async (c, n) => { await n(); await n(); }])({}); return 'ok'; } catch (e) { return e.message; } }`, expect: "next() called multiple times" },
              { label: "error handler middleware", run: `async (compose) => { const ctx = {}; await compose([async (c, n) => { try { await n(); } catch (e) { c.status = 500; c.body = e.message; } }, async () => { throw new Error('db down'); }])(ctx); return [ctx.status, ctx.body]; }`, expect: [500, "db down"] },
            ] },
        ] },
    ] },
    { title: "2. Correctness, performance and reliability", lessons: [
      { id: "wnd-validate", t: "Validation and data integrity", mins: 30,
        body: [
          "<b>Never trust input</b> — bodies, query strings, headers, webhooks, even data from your own frontend. Validate at the boundary, then work with typed, trusted data inside.",
          "Schema libraries (<b>Zod</b>, Valibot, Joi) describe shapes once and give you validation, clear error messages with <b>paths</b> (<code>items[2].qty: must be ≥ 1</code>) and TypeScript types (<code>z.infer</code>). Share schemas between frontend and backend in a monorepo.",
          "Validate <b>types</b>, <b>ranges</b> and <b>formats</b>; strip unknown fields (mass-assignment protection: a client must not be able to send <code>{role: 'admin'}</code>); normalise (trim, lower-case emails).",
          "The database is the last line of defence: NOT NULL, CHECK, UNIQUE and foreign keys catch what code misses — and race conditions that validation in code can't (two signups with the same email at the same moment).",
          "Return <b>422</b> (or 400) with all field errors at once, not one at a time.",
        ],
        keys: ["Validate at every boundary.", "Errors with paths, all at once.", "Strip unknown fields.", "DB constraints catch races."],
        ex: "Checking 'email not taken' in code, then inserting, can still create duplicates when two requests race; a UNIQUE index makes the second insert fail safely.",
        fact: "Zod was created by Colin McDonnell in 2020 and became one of the most downloaded validation libraries in the TypeScript ecosystem.",
        quiz: [
          { q: "Why strip unknown fields from request bodies?", o: ["Smaller logs", "Prevent mass assignment like role: 'admin'", "Faster JSON", "HTTP requires it"], a: 1, why: "Clients shouldn't control fields they aren't meant to set." },
          { q: "What prevents duplicate emails under concurrent signups?", o: ["A findOne check", "A UNIQUE constraint", "Frontend validation", "Sleep"], a: 1, why: "The database enforces it atomically." },
        ],
        code: [
          { id: "nd-validate", t: "A mini Zod: schema validation with paths", diff: "Hard", fn: "validate",
            statement: "<p>Write <code>validate(schema, value)</code> returning an array of error strings <code>'path: message'</code> (empty if valid). Schemas: <code>{type: 'string', min?, max?}</code> (length), <code>{type: 'number', min?, max?, int?}</code>, <code>{type: 'boolean'}</code>, <code>{type: 'array', items: schema, min?}</code> (min items), <code>{type: 'object', props: {key: schema}, optional?: [keys]}</code>. Messages: <code>'expected TYPE'</code>, <code>'too short'</code>, <code>'too long'</code>, <code>'too small'</code>, <code>'too large'</code>, <code>'not an integer'</code>, <code>'required'</code>, <code>'too few items'</code>. Paths join keys with dots and indexes as <code>[i]</code>; the root path is <code>'$'</code>. Report all errors, in schema order.</p>",
            examples: [{ in: "validate({type:'object',props:{name:{type:'string',min:2},tags:{type:'array',items:{type:'string'}}}}, {name:'A', tags:['x', 3]})", out: "['$.name: too short', '$.tags[1]: expected string']" }],
            hints: ["Write check(schema, value, path) that pushes into a shared errors array.", "Arrays are 'object' to typeof — use Array.isArray, and make sure null isn't accepted as an object.", "For objects: missing non-optional keys → 'required'; present keys → recurse."],
            starter: `function validate(schema, value) {
  // your code here
}`,
            solution: `function validate(schema, value) {
  const errors = [];
  const check = (s, v, path) => {
    const err = (m) => errors.push(path + ': ' + m);
    if (s.type === 'array') {
      if (!Array.isArray(v)) return err('expected array');
      if (s.min !== undefined && v.length < s.min) err('too few items');
      v.forEach((x, i) => check(s.items, x, path + '[' + i + ']'));
      return;
    }
    if (s.type === 'object') {
      if (typeof v !== 'object' || v === null || Array.isArray(v)) return err('expected object');
      for (const [k, sub] of Object.entries(s.props || {})) {
        if (v[k] === undefined) { if (!(s.optional || []).includes(k)) errors.push(path + '.' + k + ': required'); }
        else check(sub, v[k], path + '.' + k);
      }
      return;
    }
    if (typeof v !== s.type || (s.type === 'number' && Number.isNaN(v))) return err('expected ' + s.type);
    if (s.type === 'string') {
      if (s.min !== undefined && v.length < s.min) err('too short');
      if (s.max !== undefined && v.length > s.max) err('too long');
    }
    if (s.type === 'number') {
      if (s.int && !Number.isInteger(v)) err('not an integer');
      if (s.min !== undefined && v < s.min) err('too small');
      if (s.max !== undefined && v > s.max) err('too large');
    }
  };
  check(schema, value, '$');
  return errors;
}`,
            explain: "Real libraries add unions, transforms and custom refinements, but the core is this recursive walk that carries a path.",
            tests: [
              { args: [{ type: "object", props: { name: { type: "string", min: 2 }, tags: { type: "array", items: { type: "string" } } } }, { name: "A", tags: ["x", 3] }], expect: ["$.name: too short", "$.tags[1]: expected string"] },
              { args: [{ type: "object", props: { qty: { type: "number", int: true, min: 1 }, note: { type: "string" } }, optional: ["note"] }, { qty: 1.5 }], expect: ["$.qty: not an integer"] },
              { args: [{ type: "object", props: { a: { type: "boolean" } } }, {}], expect: ["$.a: required"] },
              { args: [{ type: "object", props: {} }, null], expect: ["$: expected object"] },
              { args: [{ type: "array", items: { type: "number", max: 10 }, min: 2 }, [11]], expect: ["$: too few items", "$[0]: too large"] },
              { args: [{ type: "object", props: { user: { type: "object", props: { email: { type: "string", max: 5 } } } } }, { user: { email: "toolong@x" } }], expect: ["$.user.email: too long"] },
              { args: [{ type: "string" }, "ok"], expect: [] },
            ] },
        ] },
      { id: "wnd-scale", t: "Performance and scaling: caching, rate limiting, queues and pools", mins: 40,
        body: [
          "<b>Measure first</b>: latency percentiles (p50, p95, p99), throughput, error rate, saturation. Averages hide the slow requests your users feel.",
          "<b>Caching</b>: in-process LRU caches (fast, per instance), Redis (shared), HTTP/CDN caches. Patterns: cache-aside (read: cache → DB on miss → fill), write-through, TTLs, explicit invalidation on writes. An <b>LRU</b> evicts the least recently used entry when full — a Map's insertion order makes it easy in JavaScript.",
          "<b>Rate limiting</b> protects your service and users: <b>token bucket</b> (a bucket of capacity C refills at r tokens/sec; each request takes one; allows short bursts up to C), fixed window, sliding window. Respond with 429 and Retry-After. Use Redis for limits shared across instances.",
          "<b>Queues</b> (BullMQ on Redis, RabbitMQ, SQS, Kafka) move slow or unreliable work (emails, image processing, webhooks) out of the request path. Workers must be <b>idempotent</b> (jobs may run more than once), use retries with backoff and a dead-letter queue.",
          "<b>Connection pools</b>: opening a DB connection is expensive, so reuse a pool of them; size it to the database's limits (many app instances × pool size can exceed max_connections — PgBouncer helps).",
          "<b>Horizontal scaling</b>: stateless app servers behind a load balancer; sessions and caches in shared stores; sticky sessions only when unavoidable (WebSockets).",
        ],
        keys: ["Watch p95/p99, not averages.", "LRU: evict least recently used; Map order helps.", "Token bucket allows bursts up to capacity.", "Queue jobs must be idempotent."],
        ex: "An OTP endpoint without rate limiting lets an attacker send thousands of SMS messages at your expense; a token bucket per phone number and per IP stops it.",
        fact: "Amazon famously found that every 100 ms of extra latency cost about 1% of sales, which is why large sites obsess over tail latency.",
        quiz: [
          { q: "Which rate limiter naturally allows short bursts?", o: ["Token bucket", "Fixed window only", "No limiter", "Round robin"], a: 0, why: "A full bucket can be spent at once, then refills steadily." },
          { q: "Why must queue workers be idempotent?", o: ["Speed", "Jobs can be delivered more than once", "Required by Redis", "To save memory"], a: 1, why: "At-least-once delivery is the norm." },
        ],
        code: [
          { id: "nd-lru", t: "LRU cache", diff: "Medium", fn: "LRUCache",
            statement: "<p>Implement class <code>LRUCache</code> with <code>constructor(capacity)</code>, <code>get(key)</code> (returns the value or <code>undefined</code>, and marks the key as most recently used), <code>set(key, value)</code> (inserts/updates and marks as most recent; if over capacity, evicts the least recently used) and a <code>size</code> getter. All operations O(1).</p>",
            examples: [{ in: "c = new LRUCache(2); c.set('a',1); c.set('b',2); c.get('a'); c.set('c',3); c.get('b')", out: "undefined (b was least recently used)" }],
            hints: ["A Map remembers insertion order: the first key is the oldest.", "To mark a key as recent, delete it and set it again.", "map.keys().next().value is the least recently used key."],
            starter: `class LRUCache {
  // your code here
}`,
            solution: `class LRUCache {
  constructor(capacity) { this.capacity = capacity; this.map = new Map(); }
  get(key) {
    if (!this.map.has(key)) return undefined;
    const v = this.map.get(key);
    this.map.delete(key); this.map.set(key, v);
    return v;
  }
  set(key, value) {
    if (this.map.has(key)) this.map.delete(key);
    this.map.set(key, value);
    if (this.map.size > this.capacity) this.map.delete(this.map.keys().next().value);
  }
  get size() { return this.map.size; }
}`,
            explain: "In languages without ordered maps you'd combine a hash map with a doubly linked list — same O(1) idea.",
            tests: [
              { label: "evicts least recent", run: `(L) => { const c = new L(2); c.set('a', 1); c.set('b', 2); c.get('a'); c.set('c', 3); return [c.get('b'), c.get('a'), c.get('c'), c.size]; }`, expect: [undefined, 1, 3, 2] },
              { label: "update moves to front", run: `(L) => { const c = new L(2); c.set('a', 1); c.set('b', 2); c.set('a', 10); c.set('c', 3); return [c.get('a'), c.get('b')]; }`, expect: [10, undefined] },
              { label: "capacity 1", run: `(L) => { const c = new L(1); c.set(1, 'x'); c.set(2, 'y'); return [c.get(1), c.get(2), c.size]; }`, expect: [undefined, "y", 1] },
            ] },
          { id: "nd-bucket", t: "Token bucket rate limiter", diff: "Medium", fn: "TokenBucket",
            statement: "<p>Implement class <code>TokenBucket</code> with <code>constructor(capacity, refillPerSec, now)</code> where <code>now()</code> returns the current time in milliseconds (injected so tests can control time). The bucket starts full. <code>take()</code> first refills tokens based on elapsed time (never above capacity), then if at least one token is available, consumes it and returns true; otherwise returns false. Fractional tokens are allowed internally.</p>",
            examples: [{ in: "capacity 3, refill 1/s: take() ×4 at t=0", out: "true, true, true, false; at t=1000 → true" }],
            hints: ["Store tokens and lastRefill.", "tokens = min(capacity, tokens + (now − last) / 1000 × rate).", "Injecting the clock is dependency injection — your tests stay fast and deterministic."],
            starter: `class TokenBucket {
  constructor(capacity, refillPerSec, now = Date.now) {
    // your code here
  }
  take() {
    // your code here
  }
}`,
            solution: `class TokenBucket {
  constructor(capacity, refillPerSec, now = Date.now) {
    this.capacity = capacity; this.rate = refillPerSec; this.now = now;
    this.tokens = capacity; this.last = now();
  }
  take() {
    const t = this.now();
    this.tokens = Math.min(this.capacity, this.tokens + ((t - this.last) / 1000) * this.rate);
    this.last = t;
    if (this.tokens >= 1) { this.tokens -= 1; return true; }
    return false;
  }
}`,
            tests: [
              { label: "burst then refill", run: `(TB) => { let t = 0; const b = new TB(3, 1, () => t); const r = [b.take(), b.take(), b.take(), b.take()]; t = 1000; r.push(b.take(), b.take()); return r; }`, expect: [true, true, true, false, true, false] },
              { label: "never above capacity", run: `(TB) => { let t = 0; const b = new TB(2, 10, () => t); t = 60000; return [b.take(), b.take(), b.take()]; }`, expect: [true, true, false] },
              { label: "fractional refill", run: `(TB) => { let t = 0; const b = new TB(1, 2, () => t); b.take(); t = 250; const a = b.take(); t = 500; return [a, b.take()]; }`, expect: [false, true] },
            ] },
        ] },
      { id: "wnd-ops", t: "Testing, observability and production readiness", mins: 35,
        body: [
          "<b>Test pyramid</b>: many fast <b>unit</b> tests (pure logic, services with fake dependencies), fewer <b>integration</b> tests (real database in Docker/Testcontainers, HTTP with Supertest), a few <b>end-to-end</b> tests (Playwright through the UI). Test behaviour, not implementation details.",
          "Test doubles: <b>stub</b> (returns canned data), <b>mock</b> (verifies calls), <b>fake</b> (working lightweight implementation, like an in-memory repository), <b>spy</b> (records calls). Prefer fakes and real dependencies where cheap; over-mocking tests your mocks, not your code.",
          "<b>Observability</b> answers 'what is happening and why': structured <b>logs</b> (JSON with request id, user id, level — pino), <b>metrics</b> (RED: rate, errors, duration; histograms for latency percentiles — Prometheus), and <b>traces</b> (one request across services — OpenTelemetry). Put a request/correlation id on everything.",
          "<b>Latency percentiles</b>: sort the durations; the p-th percentile is the value below which p% of samples fall. The nearest-rank method: rank = ⌈p/100 × n⌉, value = sorted[rank − 1].",
          "Production checklist: health and readiness endpoints, graceful shutdown, timeouts on every outbound call, retries with backoff, rate limits, input validation, secrets management, migrations in CI, alerts on symptoms (error rate, p95) not causes.",
        ],
        keys: ["Many unit, some integration, few E2E tests.", "Prefer fakes over heavy mocking.", "Logs, metrics, traces with a correlation id.", "Nearest-rank percentile: sorted[⌈p·n/100⌉ − 1]."],
        ex: "When p99 latency jumps but p50 doesn't, a trace of a slow request usually shows one dependency (a cold cache, a slow query) affecting a minority of calls.",
        fact: "OpenTelemetry formed in 2019 from the merger of the OpenTracing and OpenCensus projects and is now the standard for traces and metrics.",
        quiz: [
          { q: "Which test type uses a real database to check your repository layer?", o: ["Unit", "Integration", "Snapshot", "Lint"], a: 1, why: "It integrates code with real infrastructure." },
          { q: "Why alert on p95 latency rather than average?", o: ["Easier to compute", "Averages hide the slow experiences of many users", "Required by law", "Lower numbers"], a: 1, why: "Tail latency is what users notice." },
        ],
        code: [
          { id: "nd-pct", t: "Latency percentiles", diff: "Easy", fn: "percentiles",
            statement: "<p>Write <code>percentiles(durations, ps)</code> returning an object mapping each p in <code>ps</code> (e.g. 50, 95, 99) to the nearest-rank percentile of the durations: sort ascending, rank = <code>Math.ceil(p / 100 × n)</code> (at least 1), value = <code>sorted[rank − 1]</code>. Don't mutate the input array.</p>",
            examples: [{ in: "percentiles([5, 1, 3, 2, 4], [50, 100])", out: "{50: 3, 100: 5}" }],
            hints: ["Copy then sort numerically: [...arr].sort((a, b) => a − b).", "Default sort compares strings — 10 would come before 9!"],
            starter: `function percentiles(durations, ps) {
  // your code here
}`,
            solution: `function percentiles(durations, ps) {
  const s = [...durations].sort((a, b) => a - b);
  const out = {};
  for (const p of ps) out[p] = s[Math.max(1, Math.ceil((p / 100) * s.length)) - 1];
  return out;
}`,
            tests: [
              { args: [[5, 1, 3, 2, 4], [50, 100]], expect: { 50: 3, 100: 5 } }, { args: [[10, 9, 8, 100], [50, 95]], expect: { 50: 9, 95: 100 } },
              { label: "doesn't mutate", run: `(f) => { const a = [3, 1, 2]; f(a, [50]); return a; }`, expect: [3, 1, 2] },
              { label: "100 samples", run: `(f) => f(Array.from({ length: 100 }, (_, i) => 100 - i), [50, 95, 99])`, expect: { 50: 50, 95: 95, 99: 99 } },
            ] },
        ],
        project: { t: "Lab: a production-grade REST API", brief: "Build Taskforge's backend the way a senior engineer would, using every building block from this subject.", steps: ["Layered structure: routes → controllers → services → repositories, with dependency injection and a composition root.", "Zod validation on every input with Problem Details error responses; a central error handler; request ids in pino logs.", "PostgreSQL with migrations, constraints and a connection pool; cursor pagination for task lists.", "Redis: LRU/TTL caching for hot reads with invalidation on write, token-bucket rate limiting, and a BullMQ queue for email notifications with retries.", "Tests: unit tests for services with fakes, integration tests with Testcontainers + Supertest; a /health endpoint, graceful shutdown and a load test (autocannon or k6) reporting p50/p95/p99."], stretch: ["OpenTelemetry tracing exported to Jaeger", "OpenAPI documentation generated from your Zod schemas", "Docker Compose for the whole stack"] } },
    ] },
  ],
});
