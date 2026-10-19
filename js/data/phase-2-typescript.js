window.PNODE = window.PNODE || { phases: [], mind: [], capstones: [] };
window.PNODE.phases.push({
  id: "typescript",
  n: 2,
  title: "TypeScript",
  tagline: "Types are how large teams move fast without breaking things. Most 20+ LPA job posts list TypeScript as a must.",
  lessons: [
    {
      id: "ts-basics",
      title: "Types, inference and narrowing",
      sub: "Let the compiler catch bugs before your users do",
      hours: 2,
      concept: [
        `TypeScript is JavaScript plus a type checker that runs before your code does. It removes the types at build time, so nothing extra ships to the browser. Its job is to turn "undefined is not a function" at 2am into a red squiggle while you type.`,
        `Let inference do most of the work: annotate function parameters and public boundaries, and let TypeScript figure out locals. Union types (<code>string | null</code>) model "one of these", and narrowing (<code>typeof</code>, <code>in</code>, <code>instanceof</code>, equality checks) tells the compiler which one you have in a given branch.`,
        `<code>unknown</code> is the safe version of <code>any</code>: you must narrow before using it. Treat <code>any</code> as a hole in your safety net.`,
      ],
      objectives: [
        `Annotate only where it adds value`,
        `Narrow unions without casts`,
        `Prefer unknown over any`,
      ],
      build: {
        title: "Port js-core to TypeScript",
        brief: `Convert your <code>js-core</code> utilities (typeOf, deepEqual, debounce, pool and more) to TypeScript with <code>strict: true</code>.`,
        steps: [
          `Add <code>typescript</code> and a <code>tsconfig.json</code> with strict mode on.`,
          `Type debounce so the returned function keeps the original parameter types.`,
          `Type pool so results keep each task's return type.`,
          `Remove every <code>any</code>; use <code>unknown</code> and narrowing instead.`,
          `Add <code>tsc --noEmit</code> as a <code>typecheck</code> script and run it in CI.`,
        ],
      },
      checks: [
        `<code>npm run typecheck</code> passes with zero errors in strict mode`,
        `Search the repo: zero uses of <code>any</code> and zero <code>@ts-ignore</code>`,
        `Hovering over a debounced function in your editor shows the original parameter types`,
        `CI runs typecheck on every push`,
      ],
      hints: [
        `<code>function debounce&lt;A extends unknown[]&gt;(fn: (...args: A) =&gt; void, ms: number)</code> captures the argument list as a tuple type.`,
        `Built-in <code>Parameters&lt;F&gt;</code> and <code>ReturnType&lt;F&gt;</code> are handy, but the generic tuple approach reads more clearly.`,
        `If you're stuck on a type, write a tiny <code>const test: Expected = actual</code> line to see exactly what TypeScript thinks.`,
      ],
      res: [
        { t: "TypeScript Handbook: Everyday types", u: "https://www.typescriptlang.org/docs/handbook/2/everyday-types.html", k: "doc" },
        { t: "TypeScript Handbook: Narrowing", u: "https://www.typescriptlang.org/docs/handbook/2/narrowing.html", k: "doc" },
        { t: "Total TypeScript: free beginner tutorial", u: "https://www.totaltypescript.com/tutorials/beginners-typescript", k: "course" },
        { t: "TypeScript Playground", u: "https://www.typescriptlang.org/play", k: "tool" },
        { t: "TypeScript full course for beginners", yt: "typescript full course for beginners" },
      ],
      iq: [
        { q: "What's the difference between any and unknown?", a: `<code>any</code> switches type checking off for that value, so anything goes. <code>unknown</code> accepts any value but forces you to narrow before you use it, keeping safety while still accepting untyped data.` },
        { q: "type vs interface?", a: `Both describe object shapes. Interfaces can be reopened (declaration merging) and extended, which suits public library APIs. Type aliases can express unions, tuples and mapped or conditional types. Most teams pick one convention and use type for unions.` },
      ],
    },
    {
      id: "ts-generics",
      title: "Generics and utility types",
      sub: "Write once, keep type safety for every caller",
      hours: 3,
      concept: [
        `Generics are type parameters: a function like <code>first&lt;T&gt;(items: T[]): T | undefined</code> works for any array and still knows exactly what comes out. Constraints (<code>T extends { id: string }</code>) say what a generic must at least have.`,
        `Utility types transform existing types: <code>Partial</code>, <code>Required</code>, <code>Pick</code>, <code>Omit</code>, <code>Record</code>, <code>Readonly</code>, <code>ReturnType</code>, <code>Awaited</code>. They keep a single source of truth, so a <code>User</code> change flows everywhere.`,
        `Mapped types and <code>keyof</code> let you build your own utilities. You don't need to be a type wizard, but reading these fluently is expected at senior level.`,
      ],
      objectives: [
        `Write generic functions with constraints`,
        `Derive types from other types instead of duplicating`,
        `Build one mapped type yourself`,
      ],
      build: {
        title: "Type-safe in-memory repository",
        brief: `Build a generic <code>Repository&lt;T extends { id: string }&gt;</code> class that stores any entity type with full type safety, as practice for real data layers later.`,
        steps: [
          `Methods: <code>create(input: Omit&lt;T, "id"&gt;)</code>, <code>findById</code>, <code>findMany(filter: Partial&lt;T&gt;)</code>, <code>update(id, patch)</code>, <code>delete</code>.`,
          `Add <code>sortBy&lt;K extends keyof T&gt;(key: K)</code> that only accepts real field names.`,
          `Write your own <code>DeepPartial&lt;T&gt;</code> and <code>DeepReadonly&lt;T&gt;</code> mapped types.`,
          `Create <code>User</code> and <code>Order</code> repositories and show that passing the wrong field is a compile error.`,
          `Add type-level tests with <code>expectTypeOf</code> from Vitest.`,
        ],
      },
      checks: [
        `<code>repo.sortBy("notAField")</code> fails to compile`,
        `<code>findById</code> returns <code>T | undefined</code>, forcing callers to handle missing items`,
        `DeepReadonly blocks nested writes (show a compile error in a test file)`,
        `Type tests run in CI`,
      ],
      hints: [
        `A mapped type looks like <code>{ [K in keyof T]: ... }</code>. For "deep", check <code>T[K] extends object ? DeepPartial&lt;T[K]&gt; : T[K]</code>.`,
        `Generate ids with <code>crypto.randomUUID()</code>, which exists in Node 19+ and every modern browser.`,
        `<code>expectTypeOf(x).toEqualTypeOf&lt;Expected&gt;()</code> fails the typecheck, not the runtime, when wrong. Run Vitest with <code>--typecheck</code>.`,
      ],
      res: [
        { t: "TypeScript Handbook: Generics", u: "https://www.typescriptlang.org/docs/handbook/2/generics.html", k: "doc" },
        { t: "TypeScript: Utility types", u: "https://www.typescriptlang.org/docs/handbook/utility-types.html", k: "doc" },
        { t: "TypeScript Handbook: Mapped types", u: "https://www.typescriptlang.org/docs/handbook/2/mapped-types.html", k: "doc" },
        { t: "Type Challenges (practice)", u: "https://github.com/type-challenges/type-challenges", k: "tool" },
        { t: "TypeScript generics explained", yt: "typescript generics explained simply" },
      ],
      iq: [
        { q: "Why use generics instead of any?", a: `Generics keep the relationship between input and output types. With any, you lose all checking downstream. With <code>T</code>, the caller's exact type flows through, so autocomplete and errors still work.` },
        { q: "Explain keyof and indexed access types.", a: `<code>keyof T</code> is the union of T's property names. <code>T[K]</code> is the type of property K. Together they let you write functions like <code>get&lt;T, K extends keyof T&gt;(obj: T, key: K): T[K]</code> that are exact for every key.` },
      ],
    },
    {
      id: "ts-modeling",
      title: "Modelling domains with types",
      sub: "Discriminated unions and making illegal states impossible",
      hours: 2,
      concept: [
        `Many bugs are impossible states: <code>isLoading: true</code> together with <code>error</code> and <code>data</code> all set. A discriminated union describes each real state separately, using a shared literal field like <code>status</code>, so impossible combinations can't even be written.`,
        `With a <code>switch</code> on the discriminant, TypeScript narrows each branch. Add an exhaustiveness check with <code>never</code> and the compiler will tell you about every place to update when you add a new state.`,
        `Branded types (<code>type UserId = string &amp; { __brand: "UserId" }</code>) stop you from passing an order id where a user id was expected, even though both are strings.`,
      ],
      objectives: [
        `Model async state and workflows as discriminated unions`,
        `Use exhaustive switches with never`,
        `Use branded types for ids and money`,
      ],
      build: {
        title: "Order state machine",
        brief: `Model the order lifecycle you'll use in the Bazaar capstone as types plus pure transition functions.`,
        steps: [
          `States: Draft, Placed, Paid, Shipped, Delivered, Cancelled, Refunded. Each carries only the data valid for it (Shipped has a tracking id; Draft doesn't).`,
          `A <code>transition(order, event)</code> function that only allows legal moves and returns a typed error otherwise.`,
          `Branded <code>OrderId</code>, <code>UserId</code> and <code>Paise</code> types, with constructor functions that validate.`,
          `An exhaustive <code>describe(order)</code> that returns customer-facing text for each state.`,
          `Tests for every legal and illegal transition.`,
        ],
      },
      checks: [
        `You can't construct a Shipped order without a tracking id (compile error)`,
        `Adding a new state causes compile errors exactly where handling is missing`,
        `Passing a UserId where an OrderId is expected fails to compile`,
        `Transition table is documented in the README`,
      ],
      hints: [
        `End the switch with <code>default: { const _exhaustive: never = order; return _exhaustive; }</code>.`,
        `Return a result type instead of throwing: <code>{ ok: true, value } | { ok: false, error }</code>.`,
        `A brand constructor: <code>const Paise = (n: number) =&gt; { if (!Number.isInteger(n)) throw ...; return n as Paise; }</code>.`,
      ],
      res: [
        { t: "TypeScript Handbook: Discriminated unions", u: "https://www.typescriptlang.org/docs/handbook/2/narrowing.html#discriminated-unions", k: "doc" },
        { t: "Making impossible states impossible (talk)", yt: "making impossible states impossible richard feldman" },
        { t: "Total TypeScript: Branded types", u: "https://www.totaltypescript.com/four-essential-typescript-patterns", k: "doc" },
      ],
      iq: [
        { q: "What's a discriminated union and why use it?", a: `A union of object types that share a literal field (like <code>type: "circle" | "square"</code>). Checking that field narrows to the exact member. It models states precisely, removes impossible combinations and gives exhaustive checks.` },
        { q: "How do you guarantee a switch handles every case?", a: `Assign the value to a variable of type never in the default branch. If a case is unhandled, the value isn't never there, so the compiler errors.` },
      ],
    },
    {
      id: "ts-zod",
      title: "Runtime validation with Zod",
      sub: "Types disappear at runtime. Validate data at the edges.",
      hours: 2,
      concept: [
        `TypeScript types are erased when the code runs, so they can't protect you from a malformed API response, a bad form submission or a hostile request body. You need runtime validation at every boundary where data enters your program.`,
        `Zod lets you define a schema once and get both a validator and a TypeScript type (<code>z.infer</code>). The same schema can be shared between frontend forms and backend routes, so they never drift apart.`,
        `Validate at the edges (HTTP input, environment variables, third-party APIs, localStorage) and trust typed data inside. That's the senior pattern: "parse, don't validate."`,
      ],
      objectives: [
        `Define schemas and infer types from them`,
        `Validate environment variables at startup`,
        `Return helpful, field-level error messages`,
      ],
      build: {
        title: "Safe API client",
        brief: `Wrap a public API (for example JSONPlaceholder or the GitHub API) in a typed client where every response is validated with Zod.`,
        steps: [
          `Schemas for users, posts and comments; infer types with <code>z.infer</code>.`,
          `A generic <code>request(url, schema)</code> that fetches, validates and returns typed data, or a typed error.`,
          `Deliberately break one schema field and show the clear error you get.`,
          `Validate <code>process.env</code> (base URL, timeout) at startup and crash early with a readable message.`,
          `Transform data in the schema (string dates to Date objects).`,
        ],
      },
      checks: [
        `No manual type that duplicates a schema`,
        `Invalid responses produce an error naming the bad field`,
        `Missing env vars stop the app at startup with a clear message`,
        `Tests cover a valid response, an invalid response and a network failure`,
      ],
      hints: [
        `<code>schema.safeParse(data)</code> returns <code>{ success, data | error }</code> instead of throwing.`,
        `<code>error.flatten()</code> gives you field-level messages that are easy to show in forms.`,
        `<code>z.coerce.date()</code> or <code>z.string().transform(s =&gt; new Date(s))</code> handles date strings.`,
      ],
      res: [
        { t: "Zod documentation", u: "https://zod.dev/", k: "doc" },
        { t: "Parse, don't validate (article)", u: "https://lexi-lambda.github.io/blog/2019/11/05/parse-don-t-validate/", k: "doc" },
        { t: "Zod tutorial", yt: "zod typescript validation tutorial" },
      ],
      iq: [
        { q: "If you use TypeScript, why do you still need runtime validation?", a: `Types are erased at compile time and only describe what you expect. Data from users, networks, files and env vars can be anything, so you validate at those boundaries and convert unknown into typed data.` },
        { q: "How would you share validation between frontend and backend?", a: `Put Zod schemas in a shared package (monorepo) and import them in both the form layer and the API route. One source of truth for rules and types.` },
      ],
    },
    {
      id: "ts-config",
      title: "tsconfig, strictness and monorepos",
      sub: "Project setup that scales to a team",
      hours: 2,
      concept: [
        `<code>tsconfig.json</code> controls how strict TypeScript is and how it resolves modules. <code>strict</code>, <code>noUncheckedIndexedAccess</code> and <code>exactOptionalPropertyTypes</code> catch real bugs; turning them on early is far cheaper than later.`,
        `Real companies often keep frontend, backend and shared code in one monorepo with workspaces (npm, pnpm or Turborepo). Shared types and Zod schemas live in a package both apps import.`,
        `Path aliases (<code>@/components</code>), project references and declaration files (<code>.d.ts</code>) are what you'll meet in large codebases. Know what each is for.`,
      ],
      objectives: [
        `Configure a strict tsconfig and explain each flag`,
        `Set up a workspace monorepo with a shared package`,
        `Type an untyped library with a declaration file`,
      ],
      build: {
        title: "Monorepo starter",
        brief: `Create a pnpm (or npm) workspace monorepo you'll reuse for capstones: <code>apps/web</code>, <code>apps/api</code> and <code>packages/shared</code>.`,
        steps: [
          `<code>packages/shared</code> exports Zod schemas and types.`,
          `<code>apps/api</code> (a tiny Node script for now) and <code>apps/web</code> (a Vite vanilla TS app) both import from shared.`,
          `A base <code>tsconfig.base.json</code> that the apps extend, with strict flags on.`,
          `Root scripts that typecheck, lint and test every package.`,
          `Write a <code>.d.ts</code> for a tiny untyped JS file and import it with types.`,
        ],
      },
      checks: [
        `Changing a shared schema produces type errors in both apps where relevant`,
        `One root command runs typecheck across the whole repo`,
        `README explains every tsconfig flag you turned on, in one line each`,
        `Repo is set up as a GitHub template for future projects`,
      ],
      hints: [
        `pnpm workspaces: a <code>pnpm-workspace.yaml</code> listing <code>apps/*</code> and <code>packages/*</code>, then depend on <code>"@pnode/shared": "workspace:*"</code>.`,
        `<code>noUncheckedIndexedAccess</code> makes <code>arr[0]</code> typed as possibly undefined. Annoying at first, but it catches real crashes.`,
        `In GitHub repo settings, tick "Template repository".`,
      ],
      res: [
        { t: "TSConfig reference", u: "https://www.typescriptlang.org/tsconfig/", k: "doc" },
        { t: "pnpm workspaces", u: "https://pnpm.io/workspaces", k: "doc" },
        { t: "Turborepo: Getting started", u: "https://turborepo.com/docs", k: "doc" },
        { t: "TypeScript monorepo setup", yt: "typescript monorepo pnpm workspaces tutorial" },
      ],
      iq: [
        { q: "What does strict mode enable in TypeScript?", a: `A family of flags including strictNullChecks (null and undefined must be handled), noImplicitAny, strictFunctionTypes, strictBindCallApply and useUnknownInCatchVariables. strictNullChecks alone prevents a huge class of runtime errors.` },
        { q: "Why would a company use a monorepo?", a: `Shared code and types without publishing packages, atomic changes across frontend and backend, one CI setup and consistent tooling. Downsides: tooling complexity and slower CI without caching (which tools like Turborepo or Nx address).` },
      ],
    },
  ],
});
