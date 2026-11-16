/* Road to May: month-by-month plan for the full-time routine
   (from 1 Dec 2026: full-time, about 6.5 hours a day Monday–Saturday; Sunday for review).
   target values are cumulative counts expected by the end of each month:
   build = build-path nodes, core = Core CS nodes, milestones = capstone milestones (all three capstones),
   library = Library lessons read, pronto = ProntoPy problems logged. */
window.PNODE = window.PNODE || { phases: [], mind: [], capstones: [] };
window.PNODE.plan = {
  start: "2026-10-21",
  end: "2027-05-31",
  problemsTarget: 250,
  libraryTarget: 200,
  intro: "From 1 December you're full-time: about 6.5 hours a day, Monday to Saturday, with Sunday for review and rest. That's roughly 39 hours a week. This plan gets you job-ready by graduation in May: the full build path, two capstones, AI engineering and DevOps in practice, 250 ProntoPy problems, and daily job applications from day one. Your MCA project report is due in April and is built into the plan.",
  months: [
    { key: "2026-10", label: "Oct 2026", ends: "2026-10-31", target: { build: 6, core: 1, milestones: 0, library: 14, pronto: 15 }, focus: "Lock in the routine", items: ["Phase 0: the whole web foundations phase", "ProntoPy: Python basics and complexity", "Library: How computers work, Critical thinking", "Set up your habits and delete Instagram from your phone's home screen"] },
    { key: "2026-11", label: "Nov 2026", ends: "2026-11-30", target: { build: 15, core: 2, milestones: 0, library: 40, pronto: 45 }, focus: "JavaScript, then exams", items: ["Phase 1: the JavaScript nodes", "18–28 Nov: exams only. Pnode can wait.", "ProntoPy: arrays, hashing, two pointers", "Core CS: OOP and SOLID"] },
    { key: "2026-12", label: "Dec 2026", ends: "2026-12-31", target: { build: 29, core: 3, milestones: 0, library: 75, pronto: 85 }, focus: "Full-time starts: TypeScript and React", items: ["Phase 2 (TypeScript) and Phase 3 (React)", "AI engineering, module 1: talking to models", "DevOps in practice, module 1: Linux and the network", "Jobs: 3 tailored applications a day, starting 1 December"] },
    { key: "2027-01", label: "Jan 2027", ends: "2027-01-31", target: { build: 44, core: 5, milestones: 2, library: 105, pronto: 120 }, focus: "Backend and databases", items: ["Phase 4 (Node and APIs) and Phase 5 (databases)", "AI engineering, module 2: embeddings, chunking, RAG", "DevOps in practice, module 2: Docker and Compose", "Taskforge milestones 1–2 · campus drives: register for every one"] },
    { key: "2027-02", label: "Feb 2027", ends: "2027-02-28", target: { build: 50, core: 6, milestones: 5, library: 135, pronto: 155 }, focus: "Next.js, ship Taskforge, build the RAG project", items: ["Phase 6: Next.js", "Taskforge milestones 3–5, deployed", "AI engineering, modules 3–4, plus the 'Chat with your syllabus' project", "DevOps in practice, module 3: CI/CD on every repo"] },
    { key: "2027-03", label: "Mar 2027", ends: "2027-03-31", target: { build: 60, core: 7, milestones: 8, library: 165, pronto: 190 }, focus: "Senior engineering and production", items: ["Phase 7: senior engineering", "DevOps in practice, modules 4–5, plus 'Ship one project like a professional' on AWS", "Bazaar milestones 1–3", "MCA report: full draft to your professor by mid-March"] },
    { key: "2027-04", label: "Apr 2027", ends: "2027-04-30", target: { build: 67, core: 7, milestones: 10, library: 185, pronto: 220 }, focus: "Report, interviews, apply hard", items: ["Submit the MCA project report", "Phase 8: system design, machine coding, resume, interview loop", "Bazaar milestones 4–5", "10 applications a day, 2 mock interviews a week"] },
    { key: "2027-05", label: "May 2027", ends: "2027-05-31", target: { build: 67, core: 7, milestones: 10, library: 200, pronto: 250 }, focus: "Interview and graduate", items: ["Apply widely, ask for referrals, follow up on every application", "One ProntoPy problem and one Feed session a day to stay sharp", "Review your Mind drills before every behavioural round", "Pulse is optional: build it only after you have an offer"] },
  ],
  honest: [
    "From December to May you have roughly 1,000 full-time hours. The plan uses around 850 of them, so there's slack for bad weeks, interviews and rest. Use the slack. Don't fill it.",
    "The biggest risk now isn't lack of time; it's burning out in February, or spending your hours building Pnode instead of learning in it. Protect 7 hours of sleep, your four gym days and one half-day off a week. Recovery is part of the plan.",
    "Top 10% comes from showing up daily and shipping real projects, not from being a genius. Most people who start a plan like this quit by month three. If you're still here in May, you're already ahead of most of them.",
    "No platform can guarantee a specific offer. The hiring market, referrals and getting the interview matter too. This plan makes sure that when you get the interview, you're ready for it.",
  ],
};
