LIB_ADD({
  id: "compilers", title: "Compilers and interpreters", group: "Computer science", order: 7, glyph: "{ }",
  blurb: "How your code becomes something a CPU can run: lexing, parsing, ASTs, optimisation and JITs.",
  intro: "Every tool you use daily, from TypeScript and Babel to ESLint, Prettier and V8, is a compiler or works like one. Knowing the stages makes you better at debugging, tooling and performance.",
  modules: [
    { title: "From text to tree", lessons: [
      { id: "cc-overview", t: "Compilers vs interpreters", mins: 4,
        body: [
          "A <b>compiler</b> translates a whole program into another language ahead of time (C to machine code, TypeScript to JavaScript). An <b>interpreter</b> reads and runs code directly, step by step.",
          "Modern languages mix both. Java compiles to <b>bytecode</b>, which the JVM runs and compiles further while running. JavaScript engines start interpreting immediately, then compile hot code into fast machine code (<b>JIT</b> compilation).",
          "The classic compiler pipeline: <b>lexing</b> → <b>parsing</b> → <b>semantic analysis</b> → <b>intermediate representation</b> → <b>optimisation</b> → <b>code generation</b>.",
        ],
        keys: ["Compilers translate ahead of time; interpreters run directly.", "JIT compilers compile hot code while the program runs.", "Pipeline: lex, parse, analyse, optimise, generate."],
        ex: "When you run tsc, TypeScript compiles your .ts files into plain .js, removing the types along the way.",
        fact: "A compiler that translates between two high-level languages (like TypeScript to JavaScript) is often called a transpiler.",
        quiz: [
          { q: "What does a JIT compiler do?", o: ["Compiles everything before running", "Compiles frequently used code while the program runs", "Only checks syntax", "Runs on the GPU"], a: 1, why: "It optimises the hot paths it actually sees." },
          { q: "TypeScript to JavaScript is an example of…", o: ["Interpreting", "Transpiling", "Linking", "Assembling"], a: 1, why: "It translates one high-level language into another." },
        ] },
      { id: "cc-lexparse", t: "Lexing and parsing", mins: 5,
        body: [
          "The <b>lexer</b> (tokenizer) chops source text into <b>tokens</b>: <code>let</code>, <code>total</code>, <code>=</code>, <code>42</code>, <code>;</code>. Whitespace and comments usually disappear here.",
          "The <b>parser</b> arranges tokens into an <b>abstract syntax tree</b> (AST) following the grammar. <code>2 + 3 * 4</code> becomes a tree where <code>*</code> sits below <code>+</code>, which is how precedence works.",
          "Most JS tools work on ASTs: ESLint walks the tree to find problems, Prettier reprints it neatly, and Babel rewrites it into older JavaScript.",
        ],
        keys: ["Lexer: text → tokens.", "Parser: tokens → abstract syntax tree.", "ESLint, Prettier and Babel are AST tools."],
        ex: "Paste any code into astexplorer.net and you can see its AST live. It's the fastest way to understand how linters work.",
        fact: "Prettier doesn't edit your formatting. It parses your code into an AST and prints a completely fresh version.",
        quiz: [
          { q: "What does a lexer produce?", o: ["An AST", "Tokens", "Machine code", "Bytecode"], a: 1, why: "It breaks text into meaningful pieces." },
          { q: "How does a parser handle 2 + 3 * 4?", o: ["Left to right: 20", "Builds a tree where * is applied first: 14", "Throws an error", "Randomly"], a: 1, why: "Grammar rules give * higher precedence." },
        ] },
      { id: "cc-semantic", t: "Semantic analysis and type checking", mins: 4,
        body: [
          "A program can be grammatically correct but meaningless: <code>let x = y + 1</code> when <code>y</code> doesn't exist. <b>Semantic analysis</b> catches these with a <b>symbol table</b> that tracks every name and its scope.",
          "<b>Type checking</b> is part of this stage. TypeScript's checker walks the AST, works out each expression's type, and reports mismatches before anything runs.",
          "Static checks (before running) catch bugs early; dynamic checks (while running) catch what static analysis can't prove.",
        ],
        keys: ["Valid grammar isn't the same as valid meaning.", "Symbol tables track names and scopes.", "Type checking happens on the AST before code runs."],
        ex: "'Cannot find name userr' in VS Code is semantic analysis telling you about a typo before you even save.",
        fact: "TypeScript's type system is so expressive that it's Turing complete; people have built small games and interpreters purely in types.",
        quiz: [
          { q: "Which stage catches using an undeclared variable?", o: ["Lexing", "Parsing", "Semantic analysis", "Code generation"], a: 2, why: "The grammar is fine; the meaning isn't." },
          { q: "What does a symbol table track?", o: ["CPU registers", "Names, their types and scopes", "Network packets", "Git commits"], a: 1, why: "It's the compiler's dictionary of identifiers." },
        ] },
    ] },
    { title: "Making it fast", lessons: [
      { id: "cc-optimise", t: "Optimisation and intermediate representations", mins: 5,
        body: [
          "Compilers translate the AST into an <b>intermediate representation</b> (IR), a simpler language that's easier to analyse and optimise.",
          "Common optimisations: <b>constant folding</b> (<code>60 * 60 * 24</code> becomes 86400), <b>dead code elimination</b> (remove code that can never run), <b>inlining</b> (paste a small function's body instead of calling it), and <b>loop-invariant code motion</b> (move unchanging work out of loops).",
          "<b>LLVM</b> is a widely used compiler toolkit with a shared IR; Rust, Swift and Clang (C/C++) all use it.",
        ],
        keys: ["IR is a simpler form that's easy to optimise.", "Constant folding, dead code removal and inlining are classics.", "LLVM powers many modern languages."],
        ex: "Bundlers like esbuild and Vite remove unused exports from your production build. That's 'tree shaking', a form of dead code elimination.",
        fact: "Because compilers optimise so aggressively, 'clever' micro-optimisations in source code often make no difference, while readable code does.",
        quiz: [
          { q: "Replacing 60 * 60 * 24 with 86400 at compile time is…", o: ["Inlining", "Constant folding", "Garbage collection", "Linking"], a: 1, why: "The value is computed once, before running." },
          { q: "Tree shaking in bundlers is a form of…", o: ["Dead code elimination", "Type checking", "Lexing", "Encryption"], a: 0, why: "Unused code is removed from the output." },
        ] },
      { id: "cc-v8", t: "How V8 runs your JavaScript", mins: 5,
        body: [
          "Chrome and Node use the <b>V8</b> engine. It parses your JS into an AST, then <b>Ignition</b> turns it into bytecode and starts interpreting right away, so pages start fast.",
          "While running, V8 watches which functions are hot and what types they receive. It then compiles them with an optimising compiler (<b>TurboFan</b>) into fast machine code built on those assumptions.",
          "If assumptions break (a function that always got numbers suddenly gets a string), V8 <b>deoptimises</b> back to bytecode. Keeping object shapes and argument types consistent helps your code stay fast.",
        ],
        keys: ["V8: parse → bytecode (Ignition) → optimised machine code (TurboFan).", "Optimisations rely on observed types and object shapes.", "Changing types can trigger deoptimisation."],
        ex: "A function called with numbers a million times, then once with a string, may suddenly run slower afterwards because V8 had to deoptimise it.",
        fact: "V8 gives objects hidden 'shapes' (hidden classes) so that property access can be nearly as fast as in statically typed languages.",
        quiz: [
          { q: "Why does V8 start by interpreting bytecode?", o: ["It's more secure", "So code starts running quickly", "Machine code is illegal", "To save disk"], a: 1, why: "Compiling everything first would delay startup." },
          { q: "What causes deoptimisation?", o: ["Comments", "Assumptions about types or shapes being broken", "Using const", "Short functions"], a: 1, why: "Optimised code was built on those assumptions." },
        ] },
      { id: "cc-gc", t: "Runtimes, garbage collectors and WebAssembly", mins: 5,
        body: [
          "A <b>runtime</b> is everything your code needs while running: memory management, standard library, event loop and more. Node.js is V8 plus libuv plus Node's APIs.",
          "<b>Garbage collectors</b> find memory no longer reachable and free it. V8's is <b>generational</b>: most objects die young, so new objects are collected often and cheaply; survivors move to an 'old' space checked less often.",
          "<b>WebAssembly</b> (Wasm) is a compact binary format that browsers run at near-native speed. Languages like Rust, C++ and Go compile to it, which is how apps like Figma and Photoshop on the web run heavy code.",
        ],
        keys: ["A runtime = engine + memory management + standard APIs.", "Generational GC: most objects die young.", "WebAssembly runs compiled code fast in the browser."],
        ex: "Figma's editor uses C++ compiled to WebAssembly, which is a big part of why it feels like a desktop app in the browser.",
        fact: "Deno and Bun are alternative JavaScript runtimes; Bun uses Apple's JavaScriptCore engine instead of V8.",
        quiz: [
          { q: "Why is V8's GC generational?", o: ["It's older", "Most objects die young, so new ones are collected cheaply and often", "It runs on GPUs", "It never frees memory"], a: 1, why: "Focusing on young objects finds most garbage quickly." },
          { q: "What is WebAssembly?", o: ["A CSS framework", "A binary format browsers run at near-native speed", "A database", "A JS library"], a: 1, why: "Compiled languages can target it for heavy work in the browser." },
        ] },
    ] },
  ],
});
