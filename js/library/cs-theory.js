LIB_ADD({
  id: "theory", title: "Theory of computation", group: "Computer science", order: 6, glyph: "λ",
  blurb: "What computers can and can't do: automata, regex, grammars, Turing machines, P vs NP.",
  intro: "Before computers existed, mathematicians asked what 'computing' even means. Their answers explain regex, parsers, why some bugs are impossible to detect automatically, and why some problems will never be fast.",
  modules: [
    { title: "Machines and languages", lessons: [
      { id: "th-automata", t: "Finite automata: machines with no memory", mins: 5,
        body: [
          "A <b>finite automaton</b> is a machine with a fixed set of <b>states</b> and rules for moving between them on each input symbol. It has no memory beyond its current state.",
          "A traffic light, a vending machine and a login form's states (idle → typing → submitting → success/error) are all finite automata, also called <b>state machines</b>.",
          "In code, modelling something as a state machine (with libraries like XState, or a TypeScript discriminated union) prevents impossible states like 'loading and error at the same time'.",
        ],
        keys: ["A finite automaton = states + transitions, no extra memory.", "Many UI flows are state machines.", "Explicit states prevent impossible combinations."],
        ex: "A UPI payment screen: entering PIN → processing → success or failed. You can't go from 'failed' to 'success' without retrying.",
        fact: "Regular expressions and finite automata are mathematically equivalent: every regex can be turned into one, and vice versa.",
        quiz: [
          { q: "What does a finite automaton lack?", o: ["States", "Transitions", "Memory beyond its current state", "Input"], a: 2, why: "It only knows which state it's in." },
          { q: "Which is a good example of a state machine?", o: ["A sorting algorithm", "A traffic light", "A database index", "A CSS file"], a: 1, why: "Fixed states with rules for switching between them." },
        ], viz: ["order-state-machine"] },
      { id: "th-regex", t: "Regular languages and regex limits", mins: 5,
        body: [
          "A <b>regular expression</b> describes a pattern: <code>^\\d{6}$</code> matches a 6-digit Indian PIN code. Regex is great for validation, search and simple extraction.",
          "Because regex equals a finite automaton (no memory), it <b>can't count unlimited nesting</b>. No true regex can check that brackets are balanced to any depth, or properly parse HTML.",
          "Some regex engines use backtracking, so a badly written pattern can take exponential time on certain inputs (<b>ReDoS</b>), freezing a server.",
        ],
        keys: ["Regex is perfect for flat patterns.", "Regex can't match unlimited nesting like balanced brackets.", "Careless patterns can cause catastrophic backtracking."],
        ex: "Validating an email with regex is fine for a quick check; parsing a whole HTML page with regex is a famous bad idea.",
        fact: "In 2019, a single badly behaving regular expression caused a global Cloudflare outage of about 27 minutes by maxing out CPUs worldwide.",
        quiz: [
          { q: "Why can't a pure regex check balanced brackets of any depth?", o: ["Regex is slow", "It has no memory to count nesting", "Brackets are special characters", "It can, easily"], a: 1, why: "Counting unlimited nesting needs a stack, which finite automata don't have." },
          { q: "What is ReDoS?", o: ["A database", "A regex that takes extremely long on some inputs, freezing a server", "A Redis command", "A DNS attack"], a: 1, why: "Catastrophic backtracking can be exploited as denial of service." },
        ] },
      { id: "th-grammar", t: "Context-free grammars and parsing", mins: 5,
        body: [
          "A <b>context-free grammar</b> describes nested structure with rules like <code>expr → expr + term | term</code>. Programming languages, JSON and HTML are defined this way.",
          "A <b>pushdown automaton</b> is a finite automaton plus a <b>stack</b>, and it can recognise context-free languages. The stack is what lets it handle nesting, exactly like the bracket-matching problem.",
          "<b>Parsers</b> use grammars to turn text into a tree. Every time you run code, a parser first checks it follows the language's grammar, which is where 'SyntaxError' comes from.",
        ],
        keys: ["Grammars describe nested structure.", "Adding a stack to an automaton lets it handle nesting.", "Parsers build trees from text using grammars."],
        ex: "JSON.parse uses a grammar to turn a string into objects and arrays, and throws when the text breaks the rules.",
        fact: "The Backus–Naur Form (BNF) notation for grammars was popularised by the ALGOL 60 report, and versions of it still define languages today.",
        quiz: [
          { q: "What does a pushdown automaton add to a finite automaton?", o: ["A clock", "A stack", "A network card", "A second CPU"], a: 1, why: "The stack lets it remember nesting." },
          { q: "Where do SyntaxErrors come from?", o: ["The database", "The parser checking the grammar", "The network", "The garbage collector"], a: 1, why: "Code that breaks the grammar can't be parsed." },
        ] },
    ] },
    { title: "Limits of computation", lessons: [
      { id: "th-turing", t: "Turing machines: what 'computable' means", mins: 5,
        body: [
          "In 1936, Alan Turing described an imaginary machine: an infinite tape, a head that reads and writes symbols, and a table of rules. Despite its simplicity, it can compute anything any computer can.",
          "A language or system that can simulate a Turing machine is <b>Turing complete</b>. JavaScript, Python and C are. So, surprisingly, are Excel formulas (with LAMBDA), Minecraft redstone and some card games.",
          "The <b>Church–Turing thesis</b> says anything computable by any reasonable method is computable by a Turing machine. Faster hardware changes speed, not what's possible.",
        ],
        keys: ["A Turing machine is a tape, a head and rules.", "Turing complete = can compute anything computable.", "Hardware changes speed, not what's possible."],
        ex: "Your laptop and a phone are both Turing complete: given enough time and memory, either could run any program the other can.",
        fact: "Turing also helped break Germany's Enigma code at Bletchley Park in World War II.",
        quiz: [
          { q: "What does 'Turing complete' mean?", o: ["Very fast", "Can compute anything a Turing machine can", "Has no bugs", "Uses a tape"], a: 1, why: "It can simulate any computation, given enough resources." },
          { q: "Which is NOT Turing complete on its own?", o: ["Python", "JavaScript", "A regular expression", "C"], a: 2, why: "Pure regex is a finite automaton with no extra memory." },
        ] },
      { id: "th-halting", t: "The halting problem: some things can't be computed", mins: 5,
        body: [
          "Can you write a program that looks at any program and input and decides whether it will eventually stop or loop forever? Turing proved: <b>no</b>. This is the <b>halting problem</b>.",
          "The proof is a clever contradiction: if such a checker existed, you could build a program that does the opposite of whatever the checker predicts about itself.",
          "Practical meaning: no tool can perfectly detect all infinite loops, all bugs or all malware. Linters and type checkers are useful precisely because they accept being incomplete.",
        ],
        keys: ["No program can decide whether every program halts.", "Proved by contradiction (self-reference).", "Perfect bug or virus detection is impossible in general."],
        ex: "TypeScript sometimes says 'possibly undefined' when you know it's fine. That caution is the price of a checker that must work on all programs.",
        fact: "Rice's theorem generalises this: almost any non-trivial question about what a program does, in general, is undecidable.",
        quiz: [
          { q: "What did Turing prove about the halting problem?", o: ["It's easy", "No general algorithm can solve it", "It needs quantum computers", "It's solved by compilers"], a: 1, why: "A perfect halting checker leads to a contradiction." },
          { q: "What does this imply for tools?", o: ["Linters are useless", "No tool can find every bug in every program", "All bugs can be found automatically", "Tests are unnecessary"], a: 1, why: "Tools must trade completeness for usefulness." },
        ] },
      { id: "th-pnp", t: "P vs NP in plain words", mins: 5,
        body: [
          "<b>P</b> is the set of problems solvable quickly (in polynomial time), like sorting or shortest paths. <b>NP</b> is the set of problems where a proposed answer can be <b>checked</b> quickly, like a filled Sudoku.",
          "<b>NP-complete</b> problems are the hardest in NP: if any one of them had a fast solution, they all would. Examples: travelling salesman (decision version), scheduling, packing a bag optimally.",
          "Nobody knows whether P = NP. Most experts believe P ≠ NP. In practice, for NP-hard problems we use approximations, heuristics and smart limits instead of perfect answers.",
        ],
        keys: ["P: fast to solve. NP: fast to check.", "NP-complete problems all stand or fall together.", "For NP-hard problems, use heuristics and approximations."],
        ex: "Delivery apps planning routes for many riders can't find the perfect plan quickly, so they use good-enough heuristics refreshed constantly.",
        fact: "P vs NP is one of the Clay Mathematics Institute's Millennium Prize Problems, each with a US$1 million reward.",
        quiz: [
          { q: "A completed Sudoku is easy to check but hard to solve. That's a hallmark of…", o: ["P", "NP", "Regular languages", "Halting problems"], a: 1, why: "NP = answers can be verified quickly." },
          { q: "How do engineers handle NP-hard problems in practice?", o: ["Wait for faster computers", "Use heuristics and approximations", "Avoid them completely", "Use regex"], a: 1, why: "Good-enough answers fast beat perfect answers never." },
        ] },
    ] },
  ],
});
