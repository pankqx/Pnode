window.PNODE = window.PNODE || { phases: [], mind: [], capstones: [] };
window.PNODE.phases.push({
  id: "career",
  n: 8,
  title: "Landing the role",
  tagline: "System design, DSA patterns, machine coding, a portfolio that gets shortlisted and an interview loop you can walk into calmly.",
  lessons: [
    {
      id: "sd-fundamentals",
      title: "System design fundamentals",
      sub: "Scaling, load balancing, caching, sharding, CAP and estimates",
      hours: 3,
      concept: [
        `System design interviews test how you think about large systems: you won't build one in 45 minutes, but you'll show you can reason about scale, tradeoffs and failure. Most product companies hiring at 20+ LPA include at least one round.`,
        `The building blocks repeat: load balancers, stateless services, caches (CDN, Redis), databases (replication for reads, sharding for writes), queues, object storage, and search indexes. CAP and consistency models describe what you give up when networks fail.`,
        `Back-of-the-envelope estimates (requests per second, storage per year, bandwidth) ground your design in numbers instead of guesses. You already built most of these pieces in Phases 4 to 7, so you can talk from experience.`,
      ],
      objectives: [
        `Explain each building block and when to use it`,
        `Do quick capacity estimates`,
        `Discuss consistency and availability tradeoffs`,
      ],
      build: {
        title: "Your system design notebook",
        brief: `Create a <code>system-design</code> repo with one page per building block, written in your own words, each with a diagram and a real example from your own projects.`,
        steps: [
          `Pages: load balancing, caching, CDN, replication, sharding, queues, consistent hashing, rate limiting, CAP and consistency.`,
          `For each: what it is, when to use it, its costs, and where you used it in Pnode.`,
          `An estimates cheat sheet: latency numbers, powers of two, and a worked example (estimating a WhatsApp-scale chat's storage).`,
          `Draw diagrams with Excalidraw and commit the images.`,
        ],
      },
      checks: [
        `All nine pages written in your own words`,
        `Each page links to where you used the idea in your own code`,
        `The estimates example shows every calculation step`,
        `You can explain any page out loud in two minutes without notes`,
      ],
      hints: [
        `A day has about 86,400 seconds; round to 100,000 for quick maths.`,
        `Explain sharding with your own data: "if notes were sharded by userId, what query would become hard?"`,
        `Excalidraw is free in the browser and exports PNG and SVG.`,
      ],
      res: [
        { t: "System Design Primer", u: "https://github.com/donnemartin/system-design-primer", k: "course" },
        { t: "ByteByteGo (free articles)", u: "https://blog.bytebytego.com/", k: "doc" },
        { t: "Excalidraw", u: "https://excalidraw.com/", k: "tool" },
        { t: "System design fundamentals", yt: "system design fundamentals for beginners" },
      ],
      iq: [
        { q: "Explain the CAP theorem.", a: `When a network partition happens, a distributed system must choose between consistency (every read sees the latest write) and availability (every request gets a response). Partitions can't be avoided, so the real choice is CP or AP behaviour during failures, plus latency vs consistency tradeoffs the rest of the time.` },
        { q: "Replication vs sharding?", a: `Replication copies the same data to several nodes for read scaling and fault tolerance. Sharding splits data across nodes by a key to scale writes and storage. Large systems use both: each shard is replicated.` },
      ],
    },
    {
      id: "sd-practice",
      title: "System design practice",
      sub: "A repeatable framework and five classic problems",
      hours: 4,
      concept: [
        `Use the same framework every time: clarify requirements (functional and non-functional), estimate scale, define the API, design the data model, draw the high-level design, then deep-dive into the hardest parts and discuss bottlenecks and tradeoffs.`,
        `Interviewers grade communication as much as the design: asking good questions, stating assumptions, considering alternatives and responding well to hints.`,
        `Practise out loud with a timer. Record yourself on your phone and listen back; it's uncomfortable and it works.`,
      ],
      objectives: [
        `Run the framework within 45 minutes`,
        `Design five classic systems`,
        `Present tradeoffs clearly out loud`,
      ],
      build: {
        title: "Five designs, timed",
        brief: `Design five systems using the framework, 45 minutes each, writing up a one-page summary and recording yourself explaining at least two.`,
        steps: [
          `URL shortener (ids, redirects, analytics, hot keys).`,
          `Real-time chat like WhatsApp (delivery, online status, groups, message ordering).`,
          `News feed (fan-out on write vs read, ranking, caching).`,
          `Food delivery tracking (location updates, matching, ETAs).`,
          `Rate limiter as a service (token bucket, distributed counters).`,
        ],
      },
      checks: [
        `Each write-up covers requirements, estimates, API, data model, diagram and tradeoffs`,
        `Each design was finished inside 45 minutes`,
        `At least two recorded explanations, re-recorded once after self-review`,
        `One mock interview done with a friend or on a free peer-practice platform`,
      ],
      hints: [
        `Spend the first 5 minutes only on questions and requirements; candidates who skip this usually design the wrong thing.`,
        `For each component, ask "what happens when this fails?" That leads naturally into the deep dive.`,
        `Compare your designs with published write-ups afterwards and note what you missed.`,
      ],
      res: [
        { t: "Hello Interview: System design in a hurry", u: "https://www.hellointerview.com/learn/system-design/in-a-hurry/introduction", k: "course" },
        { t: "System Design Primer: Example solutions", u: "https://github.com/donnemartin/system-design-primer#system-design-interview-questions-with-solutions", k: "doc" },
        { t: "System design mock interview", yt: "system design mock interview url shortener" },
      ],
      iq: [
        { q: "Design a URL shortener. Where would you start?", a: `Clarify scale (reads far outnumber writes), custom aliases, expiry and analytics. Estimate requests per second and storage. API: create and redirect. Ids via base62 of a counter or random with collision check. Store in a key-value store, cache hot links, redirect with 301 or 302 depending on analytics needs, and send click events to a queue.` },
        { q: "Fan-out on write vs fan-out on read for a news feed?", a: `On write: push each post into followers' feeds when it's created, so reads are fast but celebrities cause huge write storms. On read: build the feed when requested, which is cheap to write but slow to read. Real systems mix them, using fan-out on write for most users and on read for accounts with huge followings.` },
      ],
    },
    {
      id: "dsa-patterns",
      title: "DSA patterns for interviews",
      sub: "The patterns behind most coding rounds, in TypeScript",
      hours: 4,
      concept: [
        `Online assessments and coding rounds still gate most 20+ LPA roles. Grinding random problems is slow. Learning about 15 patterns (two pointers, sliding window, hashing, binary search, BFS and DFS, backtracking, heaps, intervals, dynamic programming and so on) lets you recognise most problems.`,
        `For each problem, talk through brute force first, then optimise, stating time and space complexity. Interviewers care about your process and communication as much as the final code.`,
        `Practise in the language you'll use at work. TypeScript is fine in most interviews, and it keeps your full-stack muscle memory in one place.`,
      ],
      objectives: [
        `Recognise the common patterns from problem wording`,
        `Explain complexity confidently`,
        `Solve medium problems in 30 minutes`,
      ],
      build: {
        title: "Pattern log",
        brief: `Work through a structured list (NeetCode 150 or Striver's A2Z) in TypeScript, logging every problem in a repo.`,
        steps: [
          `For each pattern, solve at least five problems, starting easy.`,
          `For each problem, log the pattern, the key insight in one line, complexity, and whether you needed help.`,
          `Revisit problems you needed help with after 3 days and again after 2 weeks.`,
          `Do one timed mock (two mediums in 60 minutes) every week.`,
          `Keep a "mistakes I repeat" list.`,
        ],
      },
      checks: [
        `At least 100 problems logged across all major patterns`,
        `Every logged problem has its complexity written`,
        `Weekly mocks recorded with times`,
        `Mistakes list reviewed before every mock`,
      ],
      hints: [
        `Sorted array or "pair that sums to" usually means two pointers or binary search.`,
        `"Longest or shortest subarray or substring with a condition" usually means sliding window.`,
        `"Top K" or "Kth largest" usually means a heap; "all combinations" usually means backtracking.`,
      ],
      res: [
        { t: "NeetCode roadmap", u: "https://neetcode.io/roadmap", k: "course" },
        { t: "Striver's A2Z DSA sheet", u: "https://takeuforward.org/", k: "course" },
        { t: "LeetCode", u: "https://leetcode.com/", k: "tool" },
        { t: "Big-O cheat sheet", u: "https://www.bigocheatsheet.com/", k: "doc" },
        { t: "Coding interview patterns", yt: "coding interview patterns explained" },
      ],
      iq: [
        { q: "How do you approach a problem you've never seen?", a: `Restate it and clarify inputs, outputs and edge cases. Work through a small example by hand. Say a brute-force solution and its complexity. Look for the pattern that removes repeated work. Code it cleanly, then test with edge cases out loud.` },
        { q: "What's the time complexity of sorting, and why does it matter?", a: `Comparison sorts are O(n log n) at best. It matters because sorting first often unlocks two pointers or binary search, turning an O(n²) brute force into O(n log n).` },
      ],
    },
    {
      id: "machine-coding",
      title: "The machine coding round",
      sub: "Build a working, well-structured app in 90 minutes",
      hours: 3,
      concept: [
        `Many Indian product companies run a machine coding round: you get a problem like "build a Trello board", "build a cart with offers" or "build a parking lot system", and 90 to 120 minutes to deliver working, clean, extensible code.`,
        `Evaluators look for working features first, then structure (separation of concerns, clear models), extensibility (adding a new rule shouldn't mean rewriting), and edge cases. A half-working beautiful design loses to a fully working simple one.`,
        `Prepare a mental starter: folder layout, state approach and testing setup you can lay down in five minutes without thinking.`,
      ],
      objectives: [
        `Deliver a working app under time pressure`,
        `Structure code for extension`,
        `Prioritise ruthlessly`,
      ],
      build: {
        title: "Four timed builds",
        brief: `Do four machine coding problems with a strict 90-minute timer, committing at the end of each and reviewing yourself afterwards.`,
        steps: [
          `Frontend: an autocomplete search with caching, keyboard navigation and debouncing.`,
          `Frontend: a nested comments widget with reply, edit, delete and collapse.`,
          `Backend or LLD: a parking lot system with multiple floors, vehicle types and pricing rules.`,
          `Full stack: a splitwise-style expense API with a minimal UI.`,
          `After each, write what you'd change with another hour.`,
        ],
      },
      checks: [
        `Each build runs and covers the core requirements at the 90-minute mark`,
        `Each has a short README explaining the design`,
        `Adding a new pricing or offer rule touches only one or two files`,
        `Self-review notes written for all four`,
      ],
      hints: [
        `Spend 10 minutes on requirements and models, 60 on core features, 15 on edge cases, 5 on the README.`,
        `For rule-heavy problems (pricing, offers), use a strategy pattern: one interface, one class per rule.`,
        `Commit every 20 minutes so you always have a working version to submit.`,
      ],
      res: [
        { t: "Low-level design primer", u: "https://github.com/prasadgujar/low-level-design-primer", k: "doc" },
        { t: "Refactoring Guru: Design patterns", u: "https://refactoring.guru/design-patterns", k: "doc" },
        { t: "Frontend machine coding questions", yt: "frontend machine coding round interview questions" },
      ],
      iq: [
        { q: "How do you structure code to be extensible?", a: `Model the domain clearly, depend on interfaces rather than concrete classes, keep rules in separate strategy objects, isolate I/O from logic, and follow open-closed: add new behaviour by adding code, not editing working code.` },
        { q: "You're out of time with features unfinished. What do you do?", a: `Make sure what exists runs end to end, stub or clearly mark unfinished parts, and explain in the README what's missing and how you'd build it. Working and honest beats ambitious and broken.` },
      ],
    },
    {
      id: "portfolio-resume",
      title: "Portfolio, GitHub and resume",
      sub: "Getting shortlisted for 20+ LPA roles",
      hours: 2,
      concept: [
        `Recruiters spend seconds on a resume. Lead with impact and numbers ("cut p95 latency from 900ms to 120ms with indexes and caching"), not lists of technologies. Your capstones give you exactly these stories.`,
        `Your GitHub is a second resume: pinned capstones with clear READMEs, screenshots, live demos, architecture diagrams and tests. Hiring managers open repos to check whether you can write maintainable code.`,
        `Apply strategically: tailored resumes, referrals (often the strongest channel), and a short, specific message to engineers at companies you like.`,
      ],
      objectives: [
        `Write impact-driven resume bullets`,
        `Make each capstone repo recruiter-ready`,
        `Build a referral and outreach routine`,
      ],
      build: {
        title: "Launch kit",
        brief: `Prepare everything you need to apply: resume, GitHub profile, portfolio page and outreach system.`,
        steps: [
          `Rewrite resume bullets for each capstone using action, what, how and a measurable result.`,
          `Polish each capstone README: one-line pitch, demo link, screenshots, architecture diagram, tech decisions, how to run.`,
          `A GitHub profile README and pinned repos.`,
          `A simple portfolio page linking capstones with short case studies.`,
          `A tracker of 50 target companies with roles, contacts and status.`,
        ],
      },
      checks: [
        `Every resume bullet has a number or a concrete outcome`,
        `Every pinned repo has a live demo or a video`,
        `A senior engineer friend or mentor has reviewed the resume`,
        `Tracker has 50 companies and at least 10 outreach messages sent`,
      ],
      hints: [
        `Bullet shape: "Built X using Y, which improved Z by N."`,
        `Record a 60-second Loom-style walkthrough for each capstone; many reviewers prefer video.`,
        `Outreach: one specific line about their product, one line about what you built that's related, one small ask.`,
      ],
      res: [
        { t: "Tech Interview Handbook: Resume", u: "https://www.techinterviewhandbook.org/resume/", k: "doc" },
        { t: "GitHub: Managing your profile README", u: "https://docs.github.com/en/account-and-profile/setting-up-and-managing-your-github-profile/customizing-your-profile/managing-your-profile-readme", k: "doc" },
        { t: "Software engineer resume tips", yt: "software engineer resume tips get shortlisted" },
      ],
      iq: [
        { q: "Walk me through a project you're proud of.", a: `Use your strongest capstone. Context (the problem), your role, two or three hard technical decisions with tradeoffs, a measurable result, and what you'd do differently. Keep it to about two minutes and invite follow-up questions.` },
        { q: "Why should we hire you over someone with more experience?", a: `Point to evidence: production-grade projects with tests, CI and monitoring, the speed you learned a full stack, and how you think about tradeoffs. Keep it confident and specific, not defensive.` },
      ],
    },
    {
      id: "interview-loop",
      title: "The interview loop and offer",
      sub: "Behavioural rounds, STAR stories and negotiation",
      hours: 2,
      concept: [
        `Behavioural rounds check how you work with people: ownership, conflict, failure, learning and pressure. Prepare six to eight true stories using STAR (Situation, Task, Action, Result) and adapt them to each question.`,
        `Your Mind drills are interview prep in disguise. The scope-creep reply, the disagreement message and the bad-day reset are exactly the stories interviewers want.`,
        `When an offer comes, research market ranges, ask about the full breakdown (fixed, variable, joining bonus, stock), and negotiate politely with data. Most companies expect it.`,
      ],
      objectives: [
        `Prepare a bank of STAR stories`,
        `Run full mock loops`,
        `Negotiate an offer with confidence`,
      ],
      build: {
        title: "Interview readiness pack",
        brief: `Assemble your interview pack and run two full mock loops.`,
        steps: [
          `Eight STAR stories: conflict, failure, ownership, learning fast, a tough bug, a tradeoff, helping someone, handling pressure.`,
          `Questions to ask interviewers, tailored to product companies.`,
          `Two full mock loops with friends or peers: DSA, machine coding or system design, and behavioural.`,
          `A salary research note for your target roles and cities.`,
          `A one-page "day before the interview" checklist.`,
        ],
      },
      checks: [
        `Each STAR story is under two minutes spoken and ends with a result`,
        `Two full mock loops done with written feedback`,
        `Salary note lists sources and ranges`,
        `You can answer "tell me about yourself" in 60 seconds without notes`,
      ],
      hints: [
        `Spend most of each STAR story on the Action, and say "I", not "we", for your own part.`,
        `Look up salary data on levels.fyi and Glassdoor, and ask people at those companies directly.`,
        `When negotiating, thank them, state your number with a reason, and stay quiet after; let them respond.`,
      ],
      res: [
        { t: "Tech Interview Handbook: Behavioural", u: "https://www.techinterviewhandbook.org/behavioral-interview/", k: "doc" },
        { t: "levels.fyi", u: "https://www.levels.fyi/", k: "tool" },
        { t: "Tech Interview Handbook: Negotiation", u: "https://www.techinterviewhandbook.org/negotiation/", k: "doc" },
        { t: "STAR method interview answers", yt: "star method behavioral interview software engineer" },
      ],
      iq: [
        { q: "Tell me about a time you failed.", a: `Choose a real, meaningful failure (not a disguised strength). Briefly set the scene, own your part clearly, explain what you did to recover, and spend most of the answer on what you changed afterwards, with evidence that the change stuck.` },
        { q: "Tell me about a disagreement with a teammate.", a: `Show you listened first, separated the person from the problem, used data or a small experiment to decide, and committed fully once a decision was made, even if it wasn't yours. End with the outcome and the relationship afterwards.` },
      ],
    },
  ],
});
