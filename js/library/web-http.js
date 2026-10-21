LIB_ADD({
  id: "web-http", title: "HTTP, APIs and web security protocols", group: "Web degree depth", order: 4, glyph: "HTTP",
  blurb: "HTTP semantics, caching, cookies, CORS, REST API design, pagination, idempotency, sessions vs JWT and OAuth — with problems where you parse requests, decide cache freshness, detect CORS preflights and match routes.",
  intro: "Every full-stack bug eventually becomes an HTTP question: why is this cached, why is CORS failing, why did the payment run twice, why did the user get logged out? This subject teaches the protocol and API design at the depth senior engineers work at.",
  modules: [
    { title: "1. The protocol", lessons: [
      { id: "wht-http", t: "HTTP semantics: methods, status codes, headers", mins: 35,
        body: [
          "An HTTP message is a <b>start line</b>, <b>headers</b>, an empty line, and an optional <b>body</b>. Request line: <code>GET /orders?page=2 HTTP/1.1</code>. Response line: <code>HTTP/1.1 200 OK</code>. Header names are case-insensitive. HTTP/2 and HTTP/3 change the framing (binary, multiplexed) but keep the same semantics.",
          "<b>Methods</b>: GET (read), HEAD (headers only), POST (create/process), PUT (replace), PATCH (partial update), DELETE, OPTIONS. <b>Safe</b> methods don't change state (GET, HEAD, OPTIONS). <b>Idempotent</b> methods give the same result if repeated (GET, HEAD, PUT, DELETE, OPTIONS) — POST and PATCH aren't guaranteed to be, which matters for retries.",
          "<b>Status codes</b>: 1xx informational; 2xx success (200 OK, 201 Created + Location, 204 No Content); 3xx redirect (301/308 permanent, 302/307 temporary, 304 Not Modified); 4xx client error (400 bad input, 401 unauthenticated, 403 forbidden, 404, 409 conflict, 422 validation, 429 rate limited); 5xx server error (500, 502 bad gateway, 503 unavailable, 504 gateway timeout).",
          "Key headers: <code>Content-Type</code> and <code>Accept</code> (content negotiation), <code>Content-Length</code> or <code>Transfer-Encoding: chunked</code>, <code>Authorization</code>, <code>Cache-Control</code>, <code>ETag</code>, <code>Location</code>, <code>Retry-After</code>, <code>Origin</code>.",
          "URLs: scheme://host:port/path?query#fragment. The fragment never reaches the server. Query strings are percent-encoded (<code>encodeURIComponent</code>); a + in form-encoded data means a space.",
        ],
        keys: ["Safe: no state change; idempotent: repeatable.", "POST isn't idempotent — careful with retries.", "401 = who are you; 403 = not allowed.", "The #fragment never reaches the server."],
        ex: "Returning 200 with {error: 'not found'} breaks caches, monitoring and client retry logic; returning 404 lets every tool understand what happened.",
        fact: "Status 418 'I'm a teapot' comes from an April Fools' RFC (2324, 1998) and is still recognised by many frameworks.",
        quiz: [
          { q: "Which method is idempotent but not safe?", o: ["GET", "POST", "PUT", "HEAD"], a: 2, why: "Repeating the same PUT gives the same state, but it changes state." },
          { q: "A logged-in user requests another user's private order. Best status?", o: ["401", "403 (or 404 to hide existence)", "400", "500"], a: 1, why: "They're authenticated but not authorised." },
          { q: "Which status tells a client it's being rate limited?", o: ["403", "429", "503", "418"], a: 1, why: "Too Many Requests, often with Retry-After." },
        ],
        code: [
          { id: "ht-query", t: "Parse a query string", diff: "Easy", fn: "parseQuery",
            statement: "<p>Write <code>parseQuery(qs)</code> for strings like <code>'?a=1&amp;b=hello%20world&amp;a=2&amp;flag'</code>. Return an object where values are decoded strings; a key with no '=' gets <code>''</code>; repeated keys become an array in order; '+' means a space. The leading '?' is optional.</p>",
            examples: [{ in: "parseQuery('?a=1&b=x+y&a=2&flag')", out: "{a: ['1', '2'], b: 'x y', flag: ''}" }],
            hints: ["Strip a leading ?, split on &, skip empty parts.", "Split each part on the first '=' only.", "Replace + with space before decodeURIComponent."],
            starter: `function parseQuery(qs) {
  // your code here (don't use URLSearchParams)
}`,
            solution: `function parseQuery(qs) {
  const out = {};
  const dec = (s) => decodeURIComponent(s.replace(/\\+/g, ' '));
  for (const part of qs.replace(/^\\?/, '').split('&')) {
    if (!part) continue;
    const i = part.indexOf('=');
    const k = dec(i === -1 ? part : part.slice(0, i));
    const v = i === -1 ? '' : dec(part.slice(i + 1));
    if (k in out) out[k] = [].concat(out[k], v);
    else out[k] = v;
  }
  return out;
}`,
            tests: [
              { args: ["?a=1&b=x+y&a=2&flag"], expect: { a: ["1", "2"], b: "x y", flag: "" } }, { args: ["name=Pank%20K&city=Mangaluru"], expect: { name: "Pank K", city: "Mangaluru" } },
              { args: [""], expect: {} }, { args: ["?eq=a%3Db%3Dc"], expect: { eq: "a=b=c" } }, { args: ["x=1&x=2&x=3"], expect: { x: ["1", "2", "3"] } },
            ] },
          { id: "ht-parse", t: "Parse a raw HTTP request", diff: "Medium", fn: "parseRequest",
            statement: "<p>Write <code>parseRequest(raw)</code> for a raw HTTP/1.1 request string with <code>\\r\\n</code> line endings. Return <code>{method, path, version, headers, body}</code> with header names lower-cased, header values trimmed, and body being everything after the first empty line (<code>''</code> if none).</p>",
            examples: [{ in: "'POST /login HTTP/1.1\\r\\nHost: x.com\\r\\nContent-Type: application/json\\r\\n\\r\\n{\"u\":1}'", out: "{method:'POST', path:'/login', version:'HTTP/1.1', headers:{host:'x.com','content-type':'application/json'}, body:'{\"u\":1}'}" }],
            hints: ["Split head and body at the first '\\r\\n\\r\\n'.", "The first head line splits on spaces into method, path, version.", "Header lines split on the first ':' only (values can contain colons, like Host: localhost:3000)."],
            starter: `function parseRequest(raw) {
  // your code here
}`,
            solution: `function parseRequest(raw) {
  const sep = raw.indexOf('\\r\\n\\r\\n');
  const head = sep === -1 ? raw : raw.slice(0, sep);
  const body = sep === -1 ? '' : raw.slice(sep + 4);
  const [start, ...lines] = head.split('\\r\\n');
  const [method, path, version] = start.split(' ');
  const headers = {};
  for (const line of lines) {
    const i = line.indexOf(':');
    if (i === -1) continue;
    headers[line.slice(0, i).trim().toLowerCase()] = line.slice(i + 1).trim();
  }
  return { method, path, version, headers, body };
}`,
            tests: [
              { args: ["POST /login HTTP/1.1\r\nHost: x.com\r\nContent-Type: application/json\r\n\r\n{\"u\":1}"], expect: { method: "POST", path: "/login", version: "HTTP/1.1", headers: { host: "x.com", "content-type": "application/json" }, body: "{\"u\":1}" } },
              { args: ["GET / HTTP/1.1\r\nHost: localhost:3000\r\n\r\n"], expect: { method: "GET", path: "/", version: "HTTP/1.1", headers: { host: "localhost:3000" }, body: "" } },
              { args: ["GET /a?b=1 HTTP/1.1\r\nX-Trace:   abc  "], expect: { method: "GET", path: "/a?b=1", version: "HTTP/1.1", headers: { "x-trace": "abc" }, body: "" } },
            ] },
        ] },
      { id: "wht-cache", t: "HTTP caching: Cache-Control, ETags and CDNs", mins: 35,
        body: [
          "Caches live in the browser (private), in proxies and <b>CDNs</b> (shared). <code>Cache-Control</code> directives: <code>max-age=N</code> (fresh for N seconds), <code>s-maxage</code> (shared caches only), <code>no-cache</code> (may store, but must <b>revalidate</b> before every use), <code>no-store</code> (never store — sensitive data), <code>private</code> (browser only), <code>public</code>, <code>immutable</code> (never revalidate while fresh), <code>stale-while-revalidate=N</code> (serve stale instantly while refreshing in the background).",
          "<b>Freshness</b>: a response is fresh while its age &lt; max-age. Once stale, the cache revalidates with a <b>conditional request</b>: <code>If-None-Match: \"etag\"</code> (or If-Modified-Since). If unchanged the server replies <b>304 Not Modified</b> with no body — cheap.",
          "<b>ETag</b>: an identifier for a version of a resource (often a content hash). Strong ETags change for any byte difference; weak ones (W/\"…\") for meaningful changes.",
          "Best practice for static assets: <b>fingerprint</b> file names (<code>app.3f9a1c.js</code>) and serve them with <code>Cache-Control: public, max-age=31536000, immutable</code>; serve HTML with <code>no-cache</code> so new deployments are seen immediately.",
          "<code>Vary</code> tells caches which request headers change the response (Accept-Encoding, Accept-Language). Forgetting Vary can serve gzipped content to clients that can't decode it — or one user's language to another.",
          "Application caches (Redis, in-memory) follow the same ideas: TTLs, invalidation on write, and avoiding a <b>cache stampede</b> when a hot key expires (locks, early refresh, stale-while-revalidate).",
        ],
        keys: ["no-cache = revalidate; no-store = never store.", "Stale + ETag → conditional request → 304.", "Fingerprinted assets: max-age 1 year + immutable.", "Vary lists headers that change the response."],
        ex: "Users seeing an old version of your site after deploy usually means index.html was cached with a long max-age. HTML should be no-cache; hashed JS/CSS can be cached for a year.",
        fact: "Phil Karlton's famous line: 'There are only two hard things in computer science: cache invalidation and naming things.'",
        quiz: [
          { q: "Which directive allows storing but forces revalidation each time?", o: ["no-store", "no-cache", "private", "immutable"], a: 1, why: "The name is misleading: it does cache." },
          { q: "A conditional request where the resource hasn't changed returns…", o: ["200 with body", "304 without body", "204", "412"], a: 1, why: "Not Modified: reuse your cached copy." },
        ],
        code: [
          { id: "ht-fresh", t: "Cache freshness decision", diff: "Medium", fn: "cacheDecision",
            statement: "<p>Write <code>cacheDecision(cacheControl, ageSeconds)</code>. Parse the Cache-Control header value (comma-separated, case-insensitive directives) and return: <code>'no-store'</code> if no-store is present; else <code>'revalidate'</code> if no-cache is present; else <code>'fresh'</code> if max-age is present and age &lt; max-age; else <code>'stale-while-revalidate'</code> if age &lt; max-age + stale-while-revalidate; otherwise <code>'stale'</code> (also when there's no max-age).</p>",
            examples: [{ in: "cacheDecision('public, max-age=60', 30)", out: "'fresh'" }, { in: "cacheDecision('max-age=60, stale-while-revalidate=30', 75)", out: "'stale-while-revalidate'" }],
            hints: ["Split on commas, trim, lower-case; directives may be 'name' or 'name=value'.", "Build an object of directives first, then apply the rules in order."],
            starter: `function cacheDecision(cacheControl, ageSeconds) {
  // your code here
}`,
            solution: `function cacheDecision(cacheControl, ageSeconds) {
  const d = {};
  for (const part of (cacheControl || '').split(',')) {
    const [k, v] = part.trim().toLowerCase().split('=');
    if (k) d[k] = v === undefined ? true : Number(v.replace(/"/g, ''));
  }
  if (d['no-store']) return 'no-store';
  if (d['no-cache']) return 'revalidate';
  if (typeof d['max-age'] === 'number') {
    if (ageSeconds < d['max-age']) return 'fresh';
    const swr = typeof d['stale-while-revalidate'] === 'number' ? d['stale-while-revalidate'] : 0;
    if (ageSeconds < d['max-age'] + swr) return 'stale-while-revalidate';
  }
  return 'stale';
}`,
            tests: [
              { args: ["public, max-age=60", 30], expect: "fresh" }, { args: ["max-age=60", 60], expect: "stale" }, { args: ["max-age=60, stale-while-revalidate=30", 75], expect: "stale-while-revalidate" },
              { args: ["No-Store", 0], expect: "no-store" }, { args: ["no-cache, max-age=600", 1], expect: "revalidate" }, { args: ["", 5], expect: "stale" },
              { args: ["private, MAX-AGE=10", 9], expect: "fresh" },
            ] },
        ] },
      { id: "wht-cors", t: "Cookies, same-origin policy and CORS", mins: 35,
        body: [
          "An <b>origin</b> is scheme + host + port. The <b>same-origin policy</b> stops a page from reading responses from other origins (it can still <i>send</i> many requests — which is why CSRF exists).",
          "<b>Cookies</b>: set with <code>Set-Cookie: sid=abc; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=3600</code>. HttpOnly hides it from JavaScript (limits XSS damage); Secure sends it only over HTTPS; <b>SameSite</b> controls cross-site sending: <code>Strict</code> (never cross-site), <code>Lax</code> (default in modern browsers; sent on top-level GET navigations), <code>None</code> (always; requires Secure).",
          "<b>CORS</b> lets a server opt in to cross-origin reads. Simple requests (GET/HEAD/POST with only 'safe' headers and form/text content types) are sent directly; the browser checks <code>Access-Control-Allow-Origin</code> on the response. Anything else — PUT/PATCH/DELETE, <code>Content-Type: application/json</code>, custom headers like Authorization — triggers a <b>preflight</b> <code>OPTIONS</code> request asking permission (Access-Control-Request-Method/Headers).",
          "With credentials (cookies) you need <code>Access-Control-Allow-Credentials: true</code> and an <b>exact</b> origin — <code>*</code> isn't allowed. Cache preflights with <code>Access-Control-Max-Age</code>.",
          "CORS is enforced by browsers only. It doesn't protect your API from curl or other servers — authentication and authorisation do.",
        ],
        keys: ["Origin = scheme + host + port.", "HttpOnly, Secure, SameSite on session cookies.", "JSON content type or custom headers → preflight.", "Credentials need an exact origin, not *."],
        ex: "Your React app on localhost:5173 calling your API on localhost:3000 is cross-origin (different port): POST with JSON triggers an OPTIONS preflight your Express app must answer.",
        fact: "Chrome made SameSite=Lax the default for cookies without a SameSite attribute in 2020, which broke many old login flows overnight.",
        quiz: [
          { q: "Are http://site.com and https://site.com the same origin?", o: ["Yes", "No — different schemes", "Only for GET", "Only with cookies"], a: 1, why: "Scheme is part of the origin." },
          { q: "Which request needs a preflight?", o: ["GET with Accept header", "POST with Content-Type: application/json", "POST form-urlencoded", "HEAD"], a: 1, why: "application/json isn't a CORS-safelisted content type." },
        ],
        code: [
          { id: "ht-cookies", t: "Parse a Cookie header", diff: "Easy", fn: "parseCookies",
            statement: "<p>Write <code>parseCookies(header)</code> for a request <code>Cookie</code> header like <code>'sid=abc; theme=dark; msg=hello%20there'</code>. Return an object of decoded values. Ignore empty segments; if a name repeats, keep the <b>first</b> value (that's what most servers do).</p>",
            examples: [{ in: "parseCookies('sid=abc; theme=dark')", out: "{sid: 'abc', theme: 'dark'}" }],
            hints: ["Split on ';', trim each part, split on the first '='.", "decodeURIComponent the value."],
            starter: `function parseCookies(header) {
  // your code here
}`,
            solution: `function parseCookies(header) {
  const out = {};
  for (const part of (header || '').split(';')) {
    const p = part.trim();
    if (!p) continue;
    const i = p.indexOf('=');
    if (i === -1) continue;
    const k = p.slice(0, i).trim();
    if (!(k in out)) out[k] = decodeURIComponent(p.slice(i + 1).trim());
  }
  return out;
}`,
            tests: [
              { args: ["sid=abc; theme=dark"], expect: { sid: "abc", theme: "dark" } }, { args: ["msg=hello%20there;;  a=1"], expect: { msg: "hello there", a: "1" } },
              { args: ["x=1; x=2"], expect: { x: "1" } }, { args: [""], expect: {} }, { args: ["token=a=b=c"], expect: { token: "a=b=c" } },
            ] },
          { id: "ht-preflight", t: "Will the browser send a preflight?", diff: "Medium", fn: "needsPreflight",
            statement: "<p>Write <code>needsPreflight({method, headers})</code> (headers: an object of name → value). Return false only for a CORS 'simple request': method GET, HEAD or POST; every header name (case-insensitive) is one of <code>accept, accept-language, content-language, content-type</code>; and if content-type is present, its media type (before any ';') is <code>application/x-www-form-urlencoded</code>, <code>multipart/form-data</code> or <code>text/plain</code>. Otherwise return true.</p>",
            examples: [{ in: "needsPreflight({method:'POST', headers:{'Content-Type':'application/json'}})", out: "true" }],
            hints: ["Lower-case the method and header names.", "Content-Type can carry parameters: 'text/plain; charset=utf-8'."],
            starter: `function needsPreflight({ method, headers = {} }) {
  // your code here
}`,
            solution: `function needsPreflight({ method, headers = {} }) {
  if (!['GET', 'HEAD', 'POST'].includes(method.toUpperCase())) return true;
  const safe = ['accept', 'accept-language', 'content-language', 'content-type'];
  const types = ['application/x-www-form-urlencoded', 'multipart/form-data', 'text/plain'];
  for (const [name, value] of Object.entries(headers)) {
    const n = name.toLowerCase();
    if (!safe.includes(n)) return true;
    if (n === 'content-type' && !types.includes(String(value).split(';')[0].trim().toLowerCase())) return true;
  }
  return false;
}`,
            tests: [
              { args: [{ method: "POST", headers: { "Content-Type": "application/json" } }], expect: true }, { args: [{ method: "GET", headers: { Accept: "application/json" } }], expect: false },
              { args: [{ method: "PUT", headers: {} }], expect: true }, { args: [{ method: "post", headers: { "content-type": "text/plain; charset=utf-8" } }], expect: false },
              { args: [{ method: "GET", headers: { Authorization: "Bearer x" } }], expect: true }, { args: [{ method: "HEAD" }], expect: false },
            ] },
        ] },
    ] },
    { title: "2. APIs and authentication", lessons: [
      { id: "wht-rest", t: "API design: resources, errors, pagination, idempotency, versioning", mins: 35,
        body: [
          "<b>REST</b> models <b>resources</b> with nouns and uses HTTP methods as verbs: <code>GET /orders</code>, <code>POST /orders</code>, <code>GET /orders/42</code>, <code>PATCH /orders/42</code>, <code>GET /users/7/orders</code>. Keep responses consistent and predictable.",
          "<b>Errors</b>: correct status codes plus a consistent body. RFC 9457 'Problem Details': <code>{type, title, status, detail, instance}</code>, plus field-level validation errors.",
          "<b>Pagination</b>: <b>offset</b> (<code>?page=3&amp;limit=20</code>) is simple but slow for deep pages (the database still scans skipped rows) and unstable when rows are inserted. <b>Cursor/keyset</b> pagination (<code>?after=eyJpZCI6MTIzfQ</code>, internally <code>WHERE (created_at, id) &lt; (…)</code>) is fast and stable — use it for feeds.",
          "<b>Idempotency keys</b>: clients send <code>Idempotency-Key: uuid</code> with POST; the server stores the result for that key and returns the same response on retries, so network retries can't double-charge.",
          "<b>Versioning</b>: URL (/v1/) or header; prefer additive, backwards-compatible changes (new optional fields) and deprecate slowly.",
          "Alternatives: <b>GraphQL</b> (clients ask for exactly the fields they need; one endpoint; watch for N+1 and query cost), <b>tRPC</b> (end-to-end TypeScript types between your own client and server), <b>gRPC</b> (binary Protobuf, service-to-service).",
          "Rate limiting (token bucket, sliding window), request validation at the edge (Zod), and documentation (OpenAPI) finish a professional API.",
        ],
        keys: ["Nouns for resources, methods for actions.", "Consistent error bodies (Problem Details).", "Cursor pagination for large, changing lists.", "Idempotency keys make POST retries safe."],
        ex: "Razorpay and Stripe accept idempotency keys on payment creation, so a mobile app that retries after a network timeout never charges a customer twice.",
        fact: "Roy Fielding defined REST in his 2000 PhD dissertation; he was also a principal author of the HTTP/1.1 specification.",
        quiz: [
          { q: "Why is OFFSET 100000 slow?", o: ["Network latency", "The database still walks the skipped rows", "JSON parsing", "Indexes are disabled"], a: 1, why: "Keyset pagination seeks directly with an index." },
          { q: "What protects against duplicate charges when a client retries POST /payments?", o: ["CORS", "An idempotency key", "HTTPS", "GraphQL"], a: 1, why: "The server returns the stored result for a repeated key." },
        ],
        code: [
          { id: "ht-route", t: "Match a route with parameters", diff: "Medium", fn: "matchRoute",
            statement: "<p>Write <code>matchRoute(pattern, path)</code> like Express's router. Patterns contain literal segments, <code>:params</code> and an optional final <code>*</code> wildcard. Return an object of params (with <code>'*'</code> holding the rest of the path) on a match, or <code>null</code>. Ignore a trailing slash and any query string in path; decode params with decodeURIComponent.</p>",
            examples: [{ in: "matchRoute('/users/:id/orders/:orderId', '/users/7/orders/42?x=1')", out: "{id: '7', orderId: '42'}" }, { in: "matchRoute('/files/*', '/files/a/b.txt')", out: "{'*': 'a/b.txt'}" }],
            hints: ["Strip the query, split both on '/', filter out empty segments.", "Walk segments in parallel; ':name' captures, literals must be equal.", "On '*', join the remaining path segments."],
            starter: `function matchRoute(pattern, path) {
  // your code here
}`,
            solution: `function matchRoute(pattern, path) {
  const ps = pattern.split('/').filter(Boolean);
  const xs = path.split('?')[0].split('/').filter(Boolean);
  const params = {};
  for (let i = 0; i < ps.length; i++) {
    const p = ps[i];
    if (p === '*') { params['*'] = xs.slice(i).map(decodeURIComponent).join('/'); return params; }
    if (i >= xs.length) return null;
    if (p[0] === ':') params[p.slice(1)] = decodeURIComponent(xs[i]);
    else if (p !== xs[i]) return null;
  }
  return xs.length === ps.length ? params : null;
}`,
            tests: [
              { args: ["/users/:id/orders/:orderId", "/users/7/orders/42?x=1"], expect: { id: "7", orderId: "42" } }, { args: ["/files/*", "/files/a/b.txt"], expect: { "*": "a/b.txt" } },
              { args: ["/users/:id", "/users"], expect: null }, { args: ["/users/:id", "/users/7/extra"], expect: null }, { args: ["/about", "/about/"], expect: {} },
              { args: ["/search/:q", "/search/hello%20world"], expect: { q: "hello world" } }, { args: ["/a/b", "/a/c"], expect: null },
            ] },
        ] },
      { id: "wht-auth", t: "Authentication: sessions, JWT, refresh tokens and OAuth", mins: 40,
        body: [
          "<b>Passwords</b>: never store them; store a slow, salted hash (<b>argon2id</b> or <b>bcrypt</b>). Rate-limit login and support 2FA.",
          "<b>Server sessions</b>: after login, store {sessionId → userId} in Redis/DB and send the id in an HttpOnly cookie. Easy to revoke (delete the session); needs a shared store across servers.",
          "<b>JWT</b>: three base64url parts <code>header.payload.signature</code>. The payload (claims: sub, exp, iat, roles) is <b>encoded, not encrypted</b> — anyone can read it; the signature (HMAC with a secret, or RSA/ECDSA with a key pair) proves it wasn't modified. Always verify the signature and <code>exp</code>, and pin the algorithm (reject 'none').",
          "A common secure pattern: short-lived <b>access token</b> (5–15 min, sent in Authorization header or memory) + long-lived <b>refresh token</b> in an HttpOnly cookie, with <b>rotation</b> (each refresh issues a new refresh token and invalidates the old; reuse detection logs everyone out).",
          "<b>OAuth 2.0</b> is delegated <b>authorisation</b> ('let this app read my Google Drive'); <b>OpenID Connect</b> adds identity ('log in with Google') via an ID token. For browsers and mobile, use the <b>Authorization Code flow with PKCE</b>. Never put client secrets in frontend code.",
          "Where to keep tokens in the browser: localStorage is readable by any XSS; HttpOnly cookies aren't, but need CSRF protection (SameSite + CSRF tokens). There's no perfect option — reduce XSS risk first.",
        ],
        keys: ["Hash passwords with argon2id/bcrypt.", "JWT payload is readable; the signature only proves integrity.", "Short access token + rotated refresh token.", "OAuth = authorisation; OIDC adds login; use PKCE."],
        ex: "Paste any JWT into a base64url decoder and you'll see its payload — which is why you must never put secrets like passwords or Aadhaar numbers inside one.",
        fact: "JSON Web Token is standardised as RFC 7519 (2015); OAuth 2.0 is RFC 6749 (2012).",
        quiz: [
          { q: "Is a JWT's payload encrypted?", o: ["Yes, always", "No, it's base64url-encoded and readable", "Only with HS256", "Only in cookies"], a: 1, why: "Signing ≠ encrypting (JWE exists for encryption)." },
          { q: "Which flow should a single-page app use for OAuth?", o: ["Implicit", "Password grant", "Authorization Code + PKCE", "Client credentials"], a: 2, why: "Implicit and password grants are deprecated for this." },
        ],
        code: [
          { id: "ht-jwt", t: "Decode a JWT and check expiry", diff: "Medium", fn: "inspectJwt",
            statement: "<p>Write <code>inspectJwt(token, nowSeconds)</code> that decodes (without verifying) a JWT and returns <code>{header, payload, expired}</code>. Parts are base64url (use - and _ instead of + and /, padding removed). <code>expired</code> is true if payload.exp exists and <code>nowSeconds &gt;= exp</code>. Throw <code>new Error('Malformed token')</code> if there aren't exactly three parts.</p>",
            examples: [{ in: "inspectJwt('eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiI3IiwiZXhwIjoxMDB9.sig', 50)", out: "{header:{alg:'HS256'}, payload:{sub:'7', exp:100}, expired:false}" }],
            hints: ["Convert base64url to base64: replace - with +, _ with /, then pad with '=' to a multiple of 4.", "atob decodes base64; JSON.parse the result.", "Remember: decoding is not verifying — never trust a token you haven't verified on the server."],
            starter: `function inspectJwt(token, nowSeconds) {
  // your code here
}`,
            solution: `function inspectJwt(token, nowSeconds) {
  const parts = String(token).split('.');
  if (parts.length !== 3) throw new Error('Malformed token');
  const decode = (s) => {
    let b = s.replace(/-/g, '+').replace(/_/g, '/');
    while (b.length % 4) b += '=';
    return JSON.parse(atob(b));
  };
  const header = decode(parts[0]);
  const payload = decode(parts[1]);
  const expired = typeof payload.exp === 'number' && nowSeconds >= payload.exp;
  return { header, payload, expired };
}`,
            tests: [
              { args: ["eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiI3IiwiZXhwIjoxMDB9.sig", 50], expect: { header: { alg: "HS256" }, payload: { sub: "7", exp: 100 }, expired: false } },
              { args: ["eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiI3IiwiZXhwIjoxMDB9.sig", 100], expect: { header: { alg: "HS256" }, payload: { sub: "7", exp: 100 }, expired: true } },
              { label: "base64url characters", run: `(f) => { const enc = (o) => btoa(JSON.stringify(o)).replace(/\\+/g, '-').replace(/\\//g, '_').replace(/=+$/, ''); const t = enc({ alg: 'none' }) + '.' + enc({ n: '>>>???' }) + '.x'; return f(t, 0).payload.n; }`, expect: ">>>???" },
              { label: "malformed", run: `(f) => { try { f('abc.def', 0); return 'no error'; } catch (e) { return e.message; } }`, expect: "Malformed token" },
            ] },
        ],
        project: { t: "Lab: an auth server you'd trust in production", brief: "Build the authentication service for Taskforge with Node/Express (or Fastify), PostgreSQL and Redis.", steps: ["Register/login with argon2id hashing, Zod validation and rate limiting per IP and per account.", "Short-lived access JWT (10 min) + refresh token in an HttpOnly, Secure, SameSite=Lax cookie with rotation and reuse detection.", "Logout everywhere: revoke all refresh tokens for a user.", "CORS configured for exactly your frontend origin with credentials; CSRF protection on cookie-authenticated routes.", "Integration tests with Supertest for every path, including expired, tampered and reused tokens."], stretch: ["Login with Google (OIDC, Authorization Code + PKCE)", "TOTP two-factor authentication", "Audit log of security events"] } },
    ] },
  ],
});
