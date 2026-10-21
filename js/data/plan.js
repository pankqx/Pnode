/* Road to August: month-by-month plan for the full-time routine
   (weekdays 6:00–7:30 pm and 9:00–11:30 pm, weekends locked in).
   target values are cumulative counts expected by the end of each month:
   build = build-path nodes, core = Core CS nodes, milestones = capstone milestones (all three capstones),
   library = Library lessons read, pronto = ProntoPy problems logged. */
window.PNODE = window.PNODE || { phases: [], mind: [], capstones: [] };
window.PNODE.plan = {
  start: "2026-10-21",
  end: "2027-08-31",
  problemsTarget: 300,
  libraryTarget: 200,
  intro: "Your routine: 6:00–7:30 pm and 9:00–11:30 pm on weekdays, and weekends locked in. That's about 35 hours a week. This plan finishes the build path, all three capstones, the Library and 300 ProntoPy problems by July, and leaves August for applications and interviews. Exam weeks are lighter by design.",
  months: [
    { key: "2026-10", label: "Oct 2026", ends: "2026-10-31", target: { build: 6, core: 1, milestones: 0, library: 10, pronto: 15 }, focus: "Lock in the routine", items: ["Phase 0: the whole web foundations phase", "ProntoPy: Python basics and complexity", "Library: How computers work, Critical thinking", "Set up your habits and delete Instagram from your phone's home screen"] },
    { key: "2026-11", label: "Nov 2026", ends: "2026-11-30", target: { build: 15, core: 2, milestones: 0, library: 35, pronto: 50 }, focus: "JavaScript, deeply", items: ["Phase 1: all nine JavaScript nodes", "ProntoPy: arrays, hashing, two pointers", "Library: Operating systems, Communication", "Core CS: OOP and SOLID"] },
    { key: "2026-12", label: "Dec 2026", ends: "2026-12-31", target: { build: 20, core: 3, milestones: 0, library: 55, pronto: 80 }, focus: "TypeScript (exam-friendly month)", items: ["Phase 2: all five TypeScript nodes", "During exams: one evening block a day, Feed only at night", "ProntoPy: sliding window, binary search", "Library: Character and emotional intelligence"] },
    { key: "2027-01", label: "Jan 2027", ends: "2027-01-31", target: { build: 29, core: 4, milestones: 0, library: 80, pronto: 110 }, focus: "React to senior depth", items: ["Phase 3: all nine React nodes", "ProntoPy: stacks, linked lists, recursion", "Library: Networks, Reading the news", "Core CS: processes and scheduling"] },
    { key: "2027-02", label: "Feb 2027", ends: "2027-02-28", target: { build: 38, core: 5, milestones: 0, library: 105, pronto: 140 }, focus: "Backend: Node and APIs", items: ["Phase 4: all nine Node and API nodes", "ProntoPy: trees and backtracking", "Library: Security, Power dynamics", "Core CS: concurrency"] },
    { key: "2027-03", label: "Mar 2027", ends: "2027-03-31", target: { build: 44, core: 6, milestones: 3, library: 130, pronto: 170 }, focus: "Databases, then Taskforge", items: ["Phase 5: all six database nodes", "Taskforge milestones 1–3 on weekends", "ProntoPy: heaps and graphs", "Library: Databases deep dive, Money and trading"] },
    { key: "2027-04", label: "Apr 2027", ends: "2027-04-30", target: { build: 50, core: 7, milestones: 6, library: 155, pronto: 200 }, focus: "Ship Taskforge, learn Next.js", items: ["Taskforge milestones 4–5, deployed with a README", "Phase 6: all six Next.js nodes", "Bazaar milestone 1", "ProntoPy: dynamic programming"] },
    { key: "2027-05", label: "May 2027", ends: "2027-05-31", target: { build: 60, core: 7, milestones: 10, library: 180, pronto: 235 }, focus: "Senior engineering + Bazaar", items: ["Phase 7: all ten senior engineering nodes", "Bazaar milestones 2–5, deployed", "Library: Distributed systems, DevOps, AI concepts", "ProntoPy: greedy, intervals, advanced graphs"] },
    { key: "2027-06", label: "Jun 2027", ends: "2027-06-30", target: { build: 63, core: 7, milestones: 13, library: 190, pronto: 270 }, focus: "Pulse + system design", items: ["Pulse milestones 1–3", "Phase 8: system design fundamentals and practice", "Weekly timed assessments begin", "Library: Theory of computation, Compilers"] },
    { key: "2027-07", label: "Jul 2027", ends: "2027-07-31", target: { build: 67, core: 7, milestones: 15, library: 200, pronto: 300 }, focus: "Finish everything, start interview season", items: ["Pulse milestones 4–5, with load test numbers", "Phase 8: frontend design, machine coding, resume, interview loop", "Two full mock loops, recorded and reviewed", "Resume and GitHub polished with real numbers"] },
    { key: "2027-08", label: "Aug 2027", ends: "2027-08-31", target: { build: 67, core: 7, milestones: 15, library: 200, pronto: 330 }, focus: "Apply and interview", items: ["Apply widely, ask for referrals, follow up", "One ProntoPy problem and one Feed session a day to stay sharp", "Review your Mind drills before every behavioural round", "Keep the gym and sleep routine through interview stress"] },
  ],
  honest: [
    "At this routine you have about 1,300 hours until the end of August. The plan uses around 1,000 of them, so there's real slack for exams, bad weeks and rest. Use the slack. Don't fill it.",
    "The biggest risk now isn't lack of time; it's burning out in February. Protect 7 hours of sleep, your four gym days and one half-day off a week. Recovery is part of the plan.",
    "Top 10% comes from showing up daily and shipping real projects, not from being a genius. Most people who start a plan like this quit by month three. If you're still here in May, you're already ahead of most of them.",
    "No platform can guarantee a specific offer. The hiring market, referrals and getting the interview matter too. This plan makes sure that when you get the interview, you're ready for it.",
  ],
};
