LIB_ADD({
  id: "learning", title: "Learning how to learn", group: "Life skills", order: 0, glyph: "LRN",
  blurb: "Recall, spacing, deliberate practice and going deep on one thing — the methods behind fast learners.",
  intro: "Start here. These methods multiply everything else in Pnode: how to remember what you read, practise the right way and become genuinely expert in at least one thing.",
  modules: [
    { title: "Remembering", lessons: [
      { id: "lr-recall", t: "Active recall beats rereading", mins: 4,
        body: [
          "Rereading feels productive but builds weak memory. <b>Active recall</b> — testing yourself without looking — builds strong memory.",
          "After each lesson, close it and explain the key idea out loud or write it from memory. Then check what you missed.",
          "That's why Pnode puts quizzes in every lesson and the Feed: every answer is a recall rep.",
        ],
        keys: ["Testing yourself > rereading.", "Close the page and explain.", "Mistakes during recall are useful."],
        ex: "After reading about indexes, close the page and write: 'An index is…, it speeds up…, it costs…'. Gaps show you what to reread.",
        fact: "The 'testing effect' — that retrieval practice improves long-term memory — is one of the most replicated findings in learning research.",
        quiz: [
          { q: "Which builds stronger memory?", o: ["Rereading", "Testing yourself", "Highlighting", "Copying notes"], a: 1, why: "Retrieval strengthens memory." },
          { q: "Getting a recall question wrong is…", o: ["Wasted time", "Useful: it shows what to fix", "Embarrassing", "Pointless"], a: 1, why: "Errors guide study." },
        ] },
      { id: "lr-spacing", t: "Spaced repetition", mins: 4,
        body: [
          "We forget quickly after learning — Ebbinghaus called it the <b>forgetting curve</b>. Reviewing just before you'd forget resets and flattens the curve.",
          "Review after about 1 day, 3 days, a week, then a month. Each review takes less time and lasts longer.",
          "Use Pnode's Review block and Feed for this: old lessons resurface as quiz cards.",
        ],
        keys: ["Forgetting is fast without review.", "Space reviews out over time.", "Short reviews, long memory."],
        ex: "Ten minutes reviewing last week's networking lessons beats an hour of new reading you'll forget.",
        fact: "Hermann Ebbinghaus studied forgetting on himself in the 1880s using lists of nonsense syllables.",
        quiz: [
          { q: "Spaced repetition means…", o: ["Cramming once", "Reviewing at increasing intervals", "Never reviewing", "Reading faster"], a: 1, why: "It fights the forgetting curve." },
          { q: "Who described the forgetting curve?", o: ["Einstein", "Ebbinghaus", "Turing", "Freud"], a: 1, why: "Hermann Ebbinghaus, 1880s." },
        ] },
      { id: "lr-interleave", t: "Interleaving and mixing topics", mins: 4,
        body: [
          "Practising one type of problem in a block feels easy. <b>Interleaving</b> — mixing different types — feels harder but trains you to choose the right method, which is what interviews test.",
          "Mix: a React task, a SQL question, a networking card. The Feed does this automatically.",
          "Difficulty that makes you think is 'desirable difficulty'.",
        ],
        keys: ["Mixing topics trains method choice.", "Harder now, better later.", "The Feed interleaves for you."],
        ex: "Solving 10 random ProntoPy problems teaches pattern recognition better than 10 sliding-window problems in a row.",
        fact: "The term 'desirable difficulties' was coined by psychologist Robert Bjork.",
        quiz: [
          { q: "Interleaving means…", o: ["One topic for hours", "Mixing different problem types", "Skipping practice", "Reading only"], a: 1, why: "It builds the skill of choosing methods." },
          { q: "Why does interleaving feel harder?", o: ["It's worse", "You must decide which method fits each problem", "It's random", "No reason"], a: 1, why: "That decision is the skill." },
        ] },
    ] },
    { title: "Practising", lessons: [
      { id: "lr-deliberate", t: "Deliberate practice", mins: 5,
        body: [
          "Experts don't just practise more; they practise <b>deliberately</b>: specific goals, just beyond current ability, with fast feedback, and focused on weaknesses.",
          "Bad practice: rebuilding the same todo app. Good practice: building it again with tests, auth and a time limit — then comparing with a senior's code.",
          "Track weaknesses in a list and attack the top one each week.",
        ],
        keys: ["Specific goals just beyond your level.", "Fast feedback.", "Target weaknesses."],
        ex: "You're slow at CSS layouts. This week: 5 layouts from real websites, timed, compared with their actual CSS.",
        fact: "Psychologist Anders Ericsson's research on expert performance made deliberate practice famous.",
        quiz: [
          { q: "Deliberate practice focuses on…", o: ["Comfortable tasks", "Weaknesses with feedback", "Repeating easy things", "Watching videos"], a: 1, why: "Growth happens at the edge of ability." },
          { q: "Which is deliberate practice?", o: ["Copying a tutorial again", "Timed rebuild with a new constraint and comparison", "Reading docs passively", "Scrolling"], a: 1, why: "Goal, challenge and feedback." },
        ] },
      { id: "lr-tutorial-hell", t: "Escaping tutorial hell", mins: 4,
        body: [
          "Tutorial hell is watching course after course without being able to build alone.",
          "Rule: for every hour of watching or reading, spend at least two hours building without the tutorial open.",
          "Getting stuck is the learning. Read error messages, check docs, try for 30 minutes, then use hints — that's how Pnode's build nodes work.",
        ],
        keys: ["Build more than you watch.", "Stuck = learning.", "Docs and errors before answers."],
        ex: "After a React video, close it and build the same feature for a different idea — a recipe app instead of a todo app.",
        fact: "Many self-taught developers describe building their own projects as the turning point in their learning.",
        quiz: [
          { q: "Best escape from tutorial hell?", o: ["Another course", "Build alone without the tutorial", "Read more reviews", "Buy a book"], a: 1, why: "Building forces real understanding." },
          { q: "Being stuck while coding is…", o: ["Failure", "Where learning happens", "A sign to quit", "Rare"], a: 1, why: "Struggle builds skill." },
        ] },
    ] },
    { title: "Going deep", lessons: [
      { id: "lr-t-shaped", t: "Be T-shaped: know one thing deeply", mins: 5,
        body: [
          "A <b>T-shaped</b> engineer knows a little about many things (the top bar) and a lot about one thing (the vertical bar).",
          "Your broad bar: full-stack, CS basics, life skills. Pick one deep bar by spring: maybe databases and performance, real-time systems, or frontend performance.",
          "Depth makes you memorable in interviews: 'the person who really understands PostgreSQL indexing'.",
        ],
        keys: ["Broad base, one deep specialty.", "Pick your deep bar by spring.", "Depth makes you memorable."],
        ex: "Going deep on databases: read the PostgreSQL docs on indexes and MVCC, write a blog post, add benchmarks to your capstone.",
        fact: "The term 'T-shaped skills' has been used in management and design since the 1990s.",
        quiz: [
          { q: "T-shaped means…", o: ["Only generalist", "Broad knowledge plus one deep area", "Only specialist", "Tall"], a: 1, why: "Both breadth and depth." },
          { q: "Why go deep on one thing?", o: ["It's required", "It makes you memorable and valuable", "To avoid other topics", "No reason"], a: 1, why: "Depth stands out." },
        ] },
      { id: "lr-teach", t: "Learn in public and teach", mins: 4,
        body: [
          "Teaching forces clarity: if you can't explain it simply, you don't understand it yet.",
          "Write short posts about what you learned, answer questions in communities, explain concepts to a friend.",
          "Bonus: public learning builds a reputation that leads to opportunities and referrals.",
        ],
        keys: ["Teaching reveals gaps.", "Write short public notes.", "Reputation compounds."],
        ex: "A post 'How I fixed an N+1 query that made my API 10× slower' teaches you, helps others and shows recruiters your skill.",
        fact: "Researchers sometimes call the boost from preparing to teach the 'protégé effect'.",
        quiz: [
          { q: "Why teach what you learn?", o: ["To show off", "It reveals gaps and deepens understanding", "It's required", "No benefit"], a: 1, why: "Explaining exposes weak spots." },
          { q: "A side benefit of learning in public?", o: ["None", "Reputation and opportunities", "Less learning", "More stress only"], a: 1, why: "People see your growth." },
        ] },
    ] },
  ],
});
