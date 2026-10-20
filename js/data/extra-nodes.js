/* Extra build-path nodes inserted into existing phases, plus small updates to existing nodes. */
(function () {
  const D = window.PNODE;
  function insertAfter(phaseId, afterId, lesson) {
    const p = D.phases.find((x) => x.id === phaseId);
    if (!p) return;
    const i = p.lessons.findIndex((l) => l.id === afterId);
    p.lessons.splice(i < 0 ? p.lessons.length : i + 1, 0, lesson);
  }

  insertAfter("javascript", "js-fetch", {
    id: "js-memory",
    title: "Memory, garbage collection and leaks",
    sub: "Reachability, WeakMap, generators and finding leaks",
    hours: 2,
    concept: [
      `JavaScript frees memory automatically, but only for objects nothing can reach any more. Starting from roots (globals, the current call stack, the DOM), the garbage collector marks everything reachable and sweeps the rest. Cycles are fine; reachability is all that matters.`,
      `Leaks are references you forgot about: event listeners never removed, timers never cleared, ever-growing caches and Maps, closures holding big objects, detached DOM nodes. In a long-running server or a single-page app they slowly eat memory until things crash.`,
      `<code>WeakMap</code> and <code>WeakRef</code> hold objects without keeping them alive. Generators and iterators produce values lazily, one at a time, so you can process huge or infinite sequences in constant memory.`,
    ],
    objectives: [`Explain mark-and-sweep and reachability`, `Find a leak with DevTools heap snapshots`, `Use WeakMap and generators where they fit`],
    build: {
      title: "Leak hunt",
      brief: `Build a small page that leaks memory on purpose in three ways, prove it with DevTools, then fix each leak.`,
      steps: [`A "open modal" button that adds a window resize listener and never removes it.`, `A setInterval started on every navigation and never cleared.`, `An in-memory cache Map that grows forever, then fix it with an LRU limit or a WeakMap keyed by objects.`, `Take heap snapshots before and after 50 clicks and compare them in the Memory panel; screenshot the evidence.`, `Bonus: a generator <code>function* range(start, end, step)</code> and a lazy <code>take(n, iterable)</code>.`],
    },
    checks: [`Each leak shows clear growth in heap snapshots`, `Each fix shows flat memory after 50 clicks`, `README explains each leak in one sentence`, `Generator utilities have tests`],
    hints: [`Use an AbortController: pass its signal to addEventListener, then call abort() to remove every listener at once.`, `In the Memory panel, use "Comparison" view between two snapshots and sort by "# Delta".`, `WeakMap keys must be objects; entries disappear when the key object is garbage collected.`],
    res: [{ t: "MDN: Memory management", u: "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Memory_management", k: "doc" }, { t: "Chrome DevTools: Fix memory problems", u: "https://developer.chrome.com/docs/devtools/memory-problems", k: "doc" }, { t: "javascript.info: Generators", u: "https://javascript.info/generators", k: "doc" }, { t: "JavaScript memory leaks explained", yt: "javascript memory leaks chrome devtools heap snapshot" }],
    iq: [
      { q: "How does JavaScript garbage collection work?", a: `Mark-and-sweep (with generational optimisations in V8): starting from roots, mark every reachable object; anything unmarked is freed. Young objects are collected often and cheaply; long-lived ones are promoted and collected less often.` },
      { q: "Name common memory leaks in a React or Node app.", a: `Listeners or subscriptions without cleanup, intervals not cleared, unbounded caches or arrays, closures capturing large objects, and global variables. In React, a missing useEffect cleanup is the usual culprit.` },
    ],
  });

  insertAfter("react", "react-performance", {
    id: "react-internals",
    title: "React under the hood",
    sub: "Reconciliation, keys, Fiber, batching and concurrent rendering",
    hours: 2,
    concept: [
      `When state changes, React re-runs your components to get a new element tree, compares it with the previous one (reconciliation), and applies the smallest set of DOM changes. Two rules make this fast: different element types mean "replace the subtree", and keys identify children across renders.`,
      `Fiber is React's internal unit of work. It lets React split rendering into small chunks, pause for urgent updates like typing, and resume. That's what makes concurrent features such as <code>useTransition</code> and Suspense possible.`,
      `React batches state updates in the same event, renders in two phases (render, which must be pure, then commit, which touches the DOM), and in development StrictMode renders twice to catch impure components and missing cleanups.`,
    ],
    objectives: [`Explain reconciliation and why keys matter`, `Describe render vs commit phases`, `Explain batching, StrictMode and transitions`],
    build: {
      title: "Mini React",
      brief: `Build a tiny React-like library (about 200 lines) to understand what the real one does: createElement, render, a basic diff and useState.`,
      steps: [`<code>createElement(type, props, ...children)</code> returning plain objects.`, `<code>render(element, container)</code> that builds real DOM nodes.`, `A naive diff that updates changed text and attributes instead of rebuilding everything.`, `<code>useState</code> using a hooks array and a cursor, which shows why hooks must be called in the same order.`, `A counter and a todo list app built on your library.`],
    },
    checks: [`Counter and todo list work using only your library`, `Diffing updates text without replacing unchanged nodes (verify in DevTools)`, `README explains why the rules of hooks exist, using your implementation`],
    hints: [`Store hooks per component in an array; reset the cursor to 0 before each render.`, `Start with full re-render of the root on every setState, then add diffing.`, `"Build your own React" by Rodrigo Pombo is the classic walkthrough. Read it after a first attempt of your own.`],
    res: [{ t: "react.dev: Preserving and resetting state", u: "https://react.dev/learn/preserving-and-resetting-state", k: "doc" }, { t: "Build your own React (Rodrigo Pombo)", u: "https://pomb.us/build-your-own-react/", k: "course" }, { t: "react.dev: useTransition", u: "https://react.dev/reference/react/useTransition", k: "doc" }, { t: "React Fiber explained", yt: "react fiber reconciliation explained" }],
    iq: [
      { q: "What is reconciliation?", a: `React's process of comparing the new element tree with the previous one to work out minimal DOM updates. It assumes elements of different types produce different trees, and uses keys to match list children.` },
      { q: "Why does StrictMode render components twice in development?", a: `To surface side effects in render (which must be pure) and missing effect cleanups. It mounts, unmounts and remounts effects so bugs that would appear with fast refresh or future features show up early. It doesn't happen in production.` },
    ],
  });

  insertAfter("node", "node-runtime", {
    id: "node-internals",
    title: "Node internals and scaling a server",
    sub: "Event loop phases, libuv, worker threads and clustering",
    hours: 2,
    concept: [
      `Node's event loop runs in phases: timers, pending callbacks, poll (I/O), check (setImmediate), close callbacks, with process.nextTick and promise microtasks run between them. libuv uses a small thread pool for file system, DNS and crypto work.`,
      `Node is fast for I/O because it never waits: while one request waits on the database, others run. But any synchronous CPU work (big JSON parsing, image resizing, sync hashing) blocks every request on that process.`,
      `To use more CPU cores, run several processes (cluster module, PM2, or multiple containers behind a load balancer) and move heavy computation to worker threads or a queue. Measure with event loop lag.`,
    ],
    objectives: [`Order nextTick, promises, setTimeout and setImmediate`, `Detect event loop blocking`, `Scale across cores with workers and clustering`],
    build: {
      title: "Unblock the server",
      brief: `Build an Express endpoint that does heavy CPU work, prove it blocks everything else, then fix it.`,
      steps: [`<code>GET /hash?rounds=…</code> that hashes synchronously for about 500ms, plus a fast <code>GET /ping</code>.`, `Load test with autocannon: show /ping latency explode while /hash runs.`, `Move the work to a worker thread pool (piscina or your own) and re-test.`, `Run four instances with the cluster module (or PM2) and compare throughput.`, `Add an event loop lag metric with <code>perf_hooks.monitorEventLoopDelay</code>.`],
    },
    checks: [`Before/after numbers for /ping p99 recorded in the README`, `Worker pool keeps /ping under 20ms while hashing`, `Event loop lag metric exposed and explained`],
    hints: [`<code>npx autocannon -c 50 -d 10 http://localhost:3000/ping</code> gives latency percentiles.`, `Worker threads communicate with postMessage; transfer large buffers instead of copying them.`, `In containers, prefer one process per container and scale containers, rather than cluster inside.`],
    res: [{ t: "Node.js: Don't block the event loop", u: "https://nodejs.org/en/learn/asynchronous-work/dont-block-the-event-loop", k: "doc" }, { t: "Node.js: worker_threads", u: "https://nodejs.org/api/worker_threads.html", k: "doc" }, { t: "autocannon", u: "https://github.com/mcollina/autocannon", k: "tool" }, { t: "Node.js event loop phases explained", yt: "node js event loop phases explained" }],
    iq: [
      { q: "process.nextTick vs setImmediate vs setTimeout(0)?", a: `nextTick runs before any other queued work, even before promise callbacks. setImmediate runs in the check phase right after I/O polling. setTimeout(0) runs in the timers phase. In an I/O callback, setImmediate always fires before setTimeout(0).` },
      { q: "How do you use all CPU cores with Node?", a: `Run multiple Node processes: the cluster module, PM2, or more containers or pods behind a load balancer. For CPU-heavy tasks inside one request, use worker threads. Keep app servers stateless so any instance can serve any request.` },
    ],
  });

  insertAfter("node", "api-testing", {
    id: "api-styles",
    title: "API styles: REST, GraphQL, tRPC and gRPC",
    sub: "Choosing the right contract between client and server",
    hours: 2,
    concept: [
      `REST maps resources to URLs and HTTP verbs; it's simple, cacheable and universal. GraphQL exposes one endpoint where clients ask for exactly the fields they need, which helps when many clients need different shapes. tRPC gives end-to-end TypeScript types between your own frontend and backend with no schema files. gRPC uses Protocol Buffers over HTTP/2 for fast service-to-service calls.`,
      `Each has costs: GraphQL needs careful handling of N+1 queries (DataLoader), query cost limits and caching; tRPC only fits TypeScript monorepos; gRPC isn't browser-native. REST remains the default for public APIs.`,
      `Seniors pick based on clients, team and caching needs, not hype, and can explain the tradeoff in an interview.`,
    ],
    objectives: [`Build the same feature in REST, GraphQL and tRPC`, `Solve GraphQL N+1 with DataLoader`, `Justify an API style for a given product`],
    build: {
      title: "Same feature, three APIs",
      brief: `Expose "a user with their latest posts and comment counts" from your Notes/Blog data in three styles and compare.`,
      steps: [`REST: <code>/users/:id</code> and <code>/users/:id/posts</code>, with an optional <code>?include=posts</code>.`, `GraphQL with GraphQL Yoga or Apollo Server: User, Post, Comment types. Log SQL to show N+1, then fix it with DataLoader.`, `tRPC router in your monorepo with a typed React client.`, `A comparison table: round trips, payload size, type safety, caching, tooling.`],
    },
    checks: [`All three return the same data`, `GraphQL N+1 fixed and proven by the query log`, `tRPC client gets compile errors when the server changes a field`, `Comparison table committed with a recommendation`],
    hints: [`DataLoader batches all <code>load(id)</code> calls in one tick into a single <code>WHERE id IN (...)</code> query.`, `Add a depth or complexity limit to GraphQL so one query can't ask for everything.`, `tRPC pairs naturally with TanStack Query on the client.`],
    res: [{ t: "GraphQL: Learn", u: "https://graphql.org/learn/", k: "course" }, { t: "DataLoader", u: "https://github.com/graphql/dataloader", k: "tool" }, { t: "tRPC docs", u: "https://trpc.io/docs", k: "doc" }, { t: "REST vs GraphQL vs gRPC", yt: "rest vs graphql vs grpc explained" }],
    iq: [
      { q: "When would you choose GraphQL over REST?", a: `When many clients (web, mobile, partners) need different slices of connected data and over-fetching or round trips hurt. Not for simple CRUD, heavily cached public data, or a small team without capacity to manage schema, performance limits and caching.` },
      { q: "What is the N+1 problem in GraphQL and how do you fix it?", a: `Resolvers run per field, so resolving author for 50 posts triggers 50 queries. DataLoader collects all requested ids in the same tick and batches them into one query, with per-request caching.` },
    ],
  });

  insertAfter("senior", "queues", {
    id: "microservices",
    title: "Monoliths, microservices and events",
    sub: "Service boundaries, sync vs async, and the costs nobody mentions",
    hours: 2,
    concept: [
      `A modular monolith (one deployable, clean internal modules) is the right starting point for almost every team. Microservices split a system into independently deployable services, usually owned by different teams, which helps at scale but adds network calls, distributed failures and operational cost.`,
      `Synchronous chains (A calls B calls C over HTTP) couple availability: if one is down, all are. Asynchronous events through a queue or log (Kafka, RabbitMQ, SQS) decouple services but bring eventual consistency, duplicate messages and harder debugging.`,
      `Patterns you'll be asked about: API gateway, database per service, saga for multi-service transactions, outbox pattern for reliable events, idempotent consumers, and circuit breakers for failing dependencies.`,
    ],
    objectives: [`Argue monolith vs microservices for a given team`, `Choose sync or async for each interaction`, `Explain saga, outbox and circuit breaker`],
    build: {
      title: "Split one feature out",
      brief: `Take your Notes system and extract notifications into a separate service that communicates through events.`,
      steps: [`Notes service publishes NoteShared events to a queue (BullMQ, or RabbitMQ in Docker).`, `A separate notifications service consumes events and sends emails, idempotently.`, `Implement the outbox pattern: write the event to an outbox table in the same transaction as the note change, then relay it.`, `Add a circuit breaker around an HTTP call to a flaky fake service (opossum, or your own).`, `Write a one-page decision record: why this boundary, what got harder.`],
    },
    checks: [`Notes keeps working when the notifications service is stopped; events are delivered after restart`, `No duplicate emails when an event is delivered twice`, `Outbox guarantees no lost events if the process crashes after commit`, `Decision record committed`],
    hints: [`Idempotency: store processed event ids with a unique constraint and skip duplicates.`, `Circuit breaker states: closed (normal), open (fail fast), half-open (try one request).`, `An Architecture Decision Record has: context, decision, alternatives, consequences.`],
    res: [{ t: "Microservices.io patterns", u: "https://microservices.io/patterns/index.html", k: "doc" }, { t: "Martin Fowler: Monolith First", u: "https://martinfowler.com/bliki/MonolithFirst.html", k: "doc" }, { t: "Transactional outbox pattern", u: "https://microservices.io/patterns/data/transactional-outbox.html", k: "doc" }, { t: "Microservices vs monolith explained", yt: "microservices vs monolith explained" }],
    iq: [
      { q: "When would you NOT use microservices?", a: `Small teams, early products, unclear domain boundaries, or no capacity for observability, CI/CD and on-call per service. A modular monolith gets most of the benefits with far less operational overhead.` },
      { q: "How do you keep data consistent across services without a distributed transaction?", a: `Sagas: a sequence of local transactions, each publishing an event, with compensating actions to undo earlier steps on failure. Combine with the outbox pattern so events aren't lost, and idempotent consumers so duplicates are harmless.` },
    ],
  });

  insertAfter("senior", "docker", {
    id: "kubernetes",
    title: "Kubernetes basics",
    sub: "Pods, deployments, services, scaling and self-healing",
    hours: 2,
    concept: [
      `Kubernetes runs containers across a cluster of machines and keeps them in the state you declare. You write YAML saying "3 replicas of this image", and controllers continuously compare reality with that and fix differences: restarting crashed pods, rescheduling from dead nodes.`,
      `Core objects: a Pod (one or more containers), a Deployment (manages replicas and rolling updates), a Service (stable network address in front of pods), ConfigMaps and Secrets (configuration), and Ingress (HTTP routing from outside).`,
      `Readiness probes stop traffic until a pod is ready; liveness probes restart stuck pods; resource requests and limits keep one app from starving others; the HorizontalPodAutoscaler scales replicas on CPU or custom metrics.`,
    ],
    objectives: [`Deploy an app to a local cluster`, `Explain pod, deployment, service, ingress`, `Configure probes, resources and autoscaling`],
    build: {
      title: "Run your stack on local Kubernetes",
      brief: `Deploy your containerised API and Redis to a local cluster with kind or minikube.`,
      steps: [`Create a cluster with kind (or minikube) and load your API image.`, `Deployment with 3 replicas, readiness and liveness probes on <code>/health</code>, resource requests and limits.`, `Service and Ingress so you can reach it from your browser.`, `ConfigMap for settings and a Secret for the database URL.`, `Kill a pod and watch it come back; run a rolling update with a new image tag and zero failed requests.`],
    },
    checks: [`kubectl get pods shows 3 healthy replicas`, `Deleting a pod triggers automatic replacement`, `Rolling update completes while a load test shows no errors`, `All manifests committed with comments`],
    hints: [`<code>kind load docker-image my-api:dev</code> makes a local image available to the cluster.`, `<code>kubectl rollout status deployment/api</code> watches an update; <code>kubectl rollout undo</code> rolls back.`, `Readiness should check dependencies you need to serve; liveness should only check the process itself.`],
    res: [{ t: "Kubernetes: Tutorials", u: "https://kubernetes.io/docs/tutorials/kubernetes-basics/", k: "course" }, { t: "kind", u: "https://kind.sigs.k8s.io/", k: "tool" }, { t: "Kubernetes: Configure probes", u: "https://kubernetes.io/docs/tasks/configure-pod-container/configure-liveness-readiness-startup-probes/", k: "doc" }, { t: "Kubernetes crash course", yt: "kubernetes crash course for absolute beginners" }],
    iq: [
      { q: "Readiness vs liveness probe?", a: `Readiness decides whether a pod should receive traffic (failing removes it from the Service but keeps it running). Liveness decides whether the container is stuck and should be restarted. Mixing them up causes restart loops during slow startups or dependency outages.` },
      { q: "How does a rolling update avoid downtime?", a: `The Deployment creates new pods gradually (maxSurge) and only removes old ones once new ones pass readiness (maxUnavailable), so serving capacity stays up throughout. Combine with backwards-compatible schema changes.` },
    ],
  });

  insertAfter("career", "sd-practice", {
    id: "frontend-sd",
    title: "Frontend system design",
    sub: "Designing the client side of large products",
    hours: 3,
    concept: [
      `Full-stack and frontend loops increasingly include a frontend design round: design the client for a news feed, autocomplete, chat app or Google Docs-style editor. The focus is component architecture, state, data fetching, performance, accessibility and offline behaviour.`,
      `A good structure: requirements (functional and non-functional), component tree, data model and API contract, state management (server cache vs client state), rendering strategy (SSR, CSR, streaming), performance (virtualisation, code splitting, image loading), accessibility and edge cases (slow network, errors, offline).`,
      `Show depth on one or two areas the interviewer cares about: optimistic updates and conflict handling, infinite scroll with cursor pagination, or real-time updates with reconnection.`,
    ],
    objectives: [`Run a frontend design using a fixed structure`, `Design state and data flow for a complex UI`, `Discuss performance and accessibility with specifics`],
    build: {
      title: "Three frontend designs",
      brief: `Write design docs (and a small prototype for one) for three classic frontend problems.`,
      steps: [`News feed: infinite scroll, cursor pagination, virtualised list, optimistic likes, new-posts banner.`, `Autocomplete: debouncing, caching, abort, keyboard navigation, ARIA combobox, highlighting matches.`, `Chat: WebSocket connection management, message ordering and dedupe, unsent message queue while offline, read receipts.`, `Build a working prototype of the autocomplete with your component kit.`],
    },
    checks: [`Each doc covers requirements, components, data/API, state, performance, accessibility, edge cases`, `Autocomplete prototype passes keyboard and screen reader checks`, `One doc recorded as a 15-minute talk-through`],
    hints: [`Start each design from the user's journeys, not the tech stack.`, `For autocomplete, follow the WAI-ARIA combobox pattern exactly.`, `Draw the component tree and mark which components own which state.`],
    res: [{ t: "GreatFrontEnd: Front end system design guide (free articles)", u: "https://www.greatfrontend.com/front-end-system-design-playbook", k: "course" }, { t: "WAI-ARIA: Combobox pattern", u: "https://www.w3.org/WAI/ARIA/apg/patterns/combobox/", k: "doc" }, { t: "Frontend system design interview", yt: "frontend system design interview news feed" }],
    iq: [
      { q: "How would you design infinite scroll for a feed?", a: `Cursor-based pagination API, IntersectionObserver sentinel to load the next page, a virtualised list to keep DOM size constant, cached pages in a server-state library, skeletons while loading, scroll restoration on back navigation, and a "new posts" banner instead of shifting content.` },
      { q: "How do you handle optimistic updates that fail?", a: `Snapshot previous state, apply the change immediately, send the request, and on failure roll back to the snapshot and show a clear error with retry. Invalidate or refetch afterwards to converge with the server.` },
    ],
  });

  // The DSA track now teaches the patterns, so the career node focuses on interview conditions.
  const career = D.phases.find((p) => p.id === "career");
  const dsaNode = career && career.lessons.find((l) => l.id === "dsa-patterns");
  if (dsaNode) {
    dsaNode.title = "DSA under interview conditions";
    dsaNode.sub = "Timed online assessments, mock rounds and communicating while you code";
    dsaNode.concept = [
      `By now the DSA track has taught you the patterns. This node is about performing under pressure: online assessments with a timer, live rounds where you think out loud, and recovering when you're stuck.`,
      `Interviewers grade communication as much as correctness: clarifying questions, a stated brute force, the optimisation idea before code, clean code, and testing your own solution with edge cases.`,
      `Practice in realistic conditions every week: a timer, no autocomplete, and someone (or a recording) listening. Review every mock and add your repeated mistakes to a list you read before each interview.`,
    ];
    dsaNode.build = {
      title: "Mock interview season",
      brief: `Run a structured mock schedule for the final months before applying.`,
      steps: [`Weekly: one timed online assessment set (2 problems, 70 minutes) on LeetCode or a similar site.`, `Weekly: one live mock with a friend or a free peer platform, speaking the whole time.`, `Re-solve every problem you got wrong after 3 days and after 2 weeks.`, `Keep a "mistakes I repeat" list and read it before each mock.`, `Target: 150+ problems logged across the DSA track by July.`],
    };
    dsaNode.checks = [`8 timed assessments done, with scores and times logged`, `6 live mocks done, each with written feedback`, `"Mistakes I repeat" list kept and read before every mock`, `150+ problems logged across the DSA track`];
    dsaNode.hints = [`If you're stuck for 5 minutes, say the brute force out loud and code it. A working O(n²) beats a blank screen.`, `Before coding, state the complexity you're aiming for and why.`, `When you finish, trace one normal case and one edge case out loud before saying you're done.`];
  }
})();
