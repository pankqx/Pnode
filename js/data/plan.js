/* Road to August: month-by-month plan at two hours a day.
   target values are cumulative counts expected by the end of each month:
   build = build-path nodes, dsa = DSA track nodes, core = Core CS nodes, milestones = Taskforge + Bazaar milestones. */
window.PNODE = window.PNODE || { phases: [], mind: [], capstones: [] };
window.PNODE.plan = {
  start: "2026-10-20",
  end: "2027-08-31",
  problemsTarget: 150,
  intro: "A month-by-month route from today to the end of August 2027, at two hours a day. It leaves room for lighter weeks during semester exams. If a month slips, cut stretch goals, never the DSA track.",
  months: [
    { key: "2026-10", label: "Oct 2026", ends: "2026-10-31", target: { build: 3, dsa: 1, core: 0, milestones: 0 }, focus: "Settle into the routine", items: ["Phase 0: how the web works, Git, semantic HTML", "DSA D1.1: Big-O and your dsa-log repo", "Set the daily 2-hour slot and protect it"] },
    { key: "2026-11", label: "Nov 2026", ends: "2026-11-30", target: { build: 9, dsa: 2, core: 1, milestones: 0 }, focus: "Foundations done, JavaScript begins", items: ["Finish Phase 0 (CSS, forms)", "Phase 1: values, closures, objects", "DSA D1.2: arrays and hashing (8 problems)", "Core CS: OOP and SOLID on a weekend"] },
    { key: "2026-12", label: "Dec 2026", ends: "2026-12-31", target: { build: 15, dsa: 3, core: 1, milestones: 0 }, focus: "JavaScript, deeply (exam-friendly month)", items: ["Phase 1: async, DOM, fetch, memory, tooling", "DSA D1.3: two pointers", "During exams, drop to 1 hour: keep the streak with DSA only"] },
    { key: "2027-01", label: "Jan 2027", ends: "2027-01-31", target: { build: 22, dsa: 4, core: 2, milestones: 0 }, focus: "TypeScript, then React", items: ["Phase 2: all five TypeScript nodes", "Phase 3: thinking in React, state", "DSA D1.4: sliding window", "Core CS: processes and scheduling"] },
    { key: "2027-02", label: "Feb 2027", ends: "2027-02-28", target: { build: 29, dsa: 5, core: 3, milestones: 0 }, focus: "React to senior depth", items: ["Phase 3: effects, server state, routing, Tailwind kit, performance, internals, testing", "DSA D1.5: binary search", "Core CS: concurrency"] },
    { key: "2027-03", label: "Mar 2027", ends: "2027-03-31", target: { build: 38, dsa: 6, core: 4, milestones: 0 }, focus: "Backend: Node and APIs", items: ["Phase 4: all nine nodes, including auth, security and API styles", "DSA D1.6: linked lists, stacks, LRU cache", "Core CS: memory and paging"] },
    { key: "2027-04", label: "Apr 2027", ends: "2027-04-30", target: { build: 44, dsa: 8, core: 5, milestones: 2 }, focus: "Databases, then start Taskforge", items: ["Phase 5: modelling, MongoDB, indexes, SQL, transactions", "Taskforge milestones 1–2: plan, auth and workspaces", "DSA D2.1–D2.2: backtracking and trees", "Core CS: networks"] },
    { key: "2027-05", label: "May 2027", ends: "2027-05-31", target: { build: 50, dsa: 9, core: 6, milestones: 5 }, focus: "Ship Taskforge, learn Next.js", items: ["Taskforge milestones 3–5: boards, real-time, deploy", "Phase 6: all six Next.js nodes", "DSA D2.3: graphs", "Core CS: DBMS theory"] },
    { key: "2027-06", label: "Jun 2027", ends: "2027-06-30", target: { build: 58, dsa: 11, core: 7, milestones: 7 }, focus: "Senior engineering + Bazaar", items: ["Phase 7: real-time, queues, Docker, Kubernetes, CI/CD, observability", "Bazaar milestones 1–2: data model and storefront", "DSA D2.4–D2.5: heaps and dynamic programming", "Core CS: design patterns and LLD"] },
    { key: "2027-07", label: "Jul 2027", ends: "2027-07-31", target: { build: 63, dsa: 12, core: 7, milestones: 10 }, focus: "Ship Bazaar, start interview season", items: ["Bazaar milestones 3–5: checkout, back office, deploy", "Phase 7 finish + Phase 8: system design fundamentals and practice", "DSA D2.6: intervals and greedy; reach 150 problems", "Weekly timed assessments and mock interviews begin"] },
    { key: "2027-08", label: "Aug 2027", ends: "2027-08-31", target: { build: 67, dsa: 12, core: 7, milestones: 10 }, focus: "Apply and interview", items: ["Phase 8: frontend design, machine coding, resume, interview loop", "Two full mock loops; tailor your resume per role", "Apply widely, ask for referrals, keep one DSA problem a day", "Stretch: Pulse milestones 1–2 if time allows"] },
  ],
  honest: [
    "At two hours a day you have roughly 600 hours until the end of August. After exams, illness and off days, expect about 450 real hours. This plan needs close to 400, so there's some slack, but not a lot.",
    "At one hour a day the same path takes about 18 months. By August you'd have strong fundamentals and one capstone. That's enough for many good roles, but usually not for the toughest product-company loops.",
    "Tough interviews are mostly gated by DSA and by how well you explain your projects. Don't skip DSA days to build faster, and write your capstone build logs as you go; they become your interview stories.",
    "No platform can guarantee a 24 LPA offer. The hiring market, referrals and getting the interview in the first place matter too. What this plan can do is make sure that when you get the interview, you're ready for it.",
  ],
};
