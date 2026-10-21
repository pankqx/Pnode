/* Study references for each Library area, plus "university depth" extras.
   kind: course | book | video | docs | site. free: false marks paid books (find them in your college library). */
window.PNODE = window.PNODE || {};
(function () {
  const yt = (q) => "https://www.youtube.com/results?search_query=" + encodeURIComponent(q);
  const np = (q) => "https://www.youtube.com/results?search_query=" + encodeURIComponent("NPTEL " + q);
  window.PNODE.refs = {
    computers: [
      { kind: "course", t: "Nand2Tetris: build a computer from logic gates", u: "https://www.nand2tetris.org/" },
      { kind: "course", t: "Harvard CS50: Introduction to Computer Science", u: "https://cs50.harvard.edu/x/" },
      { kind: "video", t: "Ben Eater: building an 8-bit computer on breadboards", u: yt("Ben Eater 8-bit computer") },
      { kind: "video", t: "Crash Course Computer Science (full series)", u: yt("Crash Course Computer Science playlist") },
      { kind: "book", t: "Code by Charles Petzold", u: yt("Code Charles Petzold book summary"), free: false },
    ],
    os: [
      { kind: "book", t: "Operating Systems: Three Easy Pieces (free chapter PDFs)", u: "https://pages.cs.wisc.edu/~remzi/OSTEP/" },
      { kind: "course", t: "The Missing Semester of Your CS Education (MIT)", u: "https://missing.csail.mit.edu/" },
      { kind: "video", t: "NPTEL Operating Systems lectures (IIT professors)", u: np("operating systems IIT") },
    ],
    networks: [
      { kind: "book", t: "Computer Networks: A Systems Approach (free online)", u: "https://book.systemsapproach.org/" },
      { kind: "book", t: "High Performance Browser Networking (free online)", u: "https://hpbn.co/" },
      { kind: "docs", t: "Beej's Guide to Network Programming", u: "https://beej.us/guide/bgnet/" },
      { kind: "video", t: "Kurose & Ross: Computer Networking lectures", u: yt("Kurose Ross computer networking lectures") },
      { kind: "video", t: "NPTEL Computer Networks (IIT)", u: np("computer networks IIT") },
    ],
    databases: [
      { kind: "course", t: "CMU 15-445 Database Systems (lectures on YouTube)", u: "https://15445.courses.cmu.edu/" },
      { kind: "site", t: "Use The Index, Luke: SQL indexing explained", u: "https://use-the-index-luke.com/" },
      { kind: "docs", t: "PostgreSQL documentation", u: "https://www.postgresql.org/docs/" },
      { kind: "video", t: "NPTEL Database Management Systems (IIT)", u: np("database management system IIT") },
    ],
    math: [
      { kind: "course", t: "MIT OCW: Mathematics for Computer Science", u: "https://ocw.mit.edu/search/?q=mathematics%20for%20computer%20science" },
      { kind: "site", t: "3Blue1Brown: visual maths (linear algebra, calculus, probability)", u: "https://www.3blue1brown.com/" },
      { kind: "video", t: "NPTEL Discrete Mathematics (IIT)", u: np("discrete mathematics IIT") },
      { kind: "course", t: "Khan Academy: probability and statistics", u: "https://www.khanacademy.org/math/statistics-probability" },
    ],
    theory: [
      { kind: "video", t: "NPTEL Theory of Computation (IIT)", u: np("theory of computation IIT") },
      { kind: "book", t: "Introduction to the Theory of Computation by Michael Sipser", u: yt("Sipser theory of computation lecture MIT 18.404"), free: false },
      { kind: "course", t: "MIT 18.404 Theory of Computation (OCW)", u: "https://ocw.mit.edu/search/?q=18.404" },
    ],
    compilers: [
      { kind: "book", t: "Crafting Interpreters (free online)", u: "https://craftinginterpreters.com/" },
      { kind: "video", t: "NPTEL Compiler Design (IIT)", u: np("compiler design IIT") },
    ],
    security: [
      { kind: "course", t: "PortSwigger Web Security Academy (free labs)", u: "https://portswigger.net/web-security" },
      { kind: "docs", t: "OWASP Top 10", u: "https://owasp.org/www-project-top-ten/" },
      { kind: "docs", t: "OWASP Cheat Sheet Series", u: "https://cheatsheetseries.owasp.org/" },
    ],
    distributed: [
      { kind: "course", t: "MIT 6.5840 (6.824) Distributed Systems", u: "https://pdos.csail.mit.edu/6.824/" },
      { kind: "video", t: "Martin Kleppmann: Distributed Systems lecture series", u: yt("Martin Kleppmann distributed systems lecture series") },
      { kind: "book", t: "Designing Data-Intensive Applications by Martin Kleppmann", u: yt("Designing Data-Intensive Applications summary"), free: false },
      { kind: "course", t: "System Design Primer (GitHub)", u: "https://github.com/donnemartin/system-design-primer" },
    ],
    swe: [
      { kind: "docs", t: "Google Engineering Practices: code review guide", u: "https://google.github.io/eng-practices/" },
      { kind: "site", t: "Teach Yourself Computer Science", u: "https://teachyourselfcs.com/" },
      { kind: "book", t: "The Pragmatic Programmer", u: yt("The Pragmatic Programmer key lessons"), free: false },
    ],
    ai: [
      { kind: "course", t: "Andrej Karpathy: Neural Networks, Zero to Hero", u: "https://karpathy.ai/zero-to-hero.html" },
      { kind: "video", t: "3Blue1Brown: Neural networks series", u: yt("3Blue1Brown neural networks") },
      { kind: "course", t: "fast.ai: Practical Deep Learning for Coders", u: "https://course.fast.ai/" },
      { kind: "course", t: "Hugging Face courses (LLMs, agents)", u: "https://huggingface.co/learn" },
      { kind: "site", t: "Ollama: run models on your laptop", u: "https://ollama.com/" },
    ],
    devops: [
      { kind: "site", t: "roadmap.sh DevOps roadmap", u: "https://roadmap.sh/devops" },
      { kind: "docs", t: "Docker: Get started", u: "https://docs.docker.com/get-started/" },
      { kind: "docs", t: "Kubernetes tutorials", u: "https://kubernetes.io/docs/tutorials/" },
      { kind: "docs", t: "GitHub Actions documentation", u: "https://docs.github.com/en/actions" },
      { kind: "book", t: "Google SRE books (free online)", u: "https://sre.google/books/" },
    ],
    learning: [
      { kind: "course", t: "Learning How to Learn (Coursera, free to audit)", u: "https://www.coursera.org/learn/learning-how-to-learn" },
      { kind: "book", t: "Make It Stick by Brown, Roediger and McDaniel", u: yt("Make It Stick science of successful learning summary"), free: false },
    ],
    communication: [
      { kind: "site", t: "BBC Learning English", u: "https://www.bbc.co.uk/learningenglish" },
      { kind: "docs", t: "Plain language guidelines", u: "https://www.plainlanguage.gov/guidelines/" },
      { kind: "site", t: "Toastmasters International (find a club)", u: "https://www.toastmasters.org/" },
      { kind: "video", t: "How to speak (Patrick Winston, MIT)", u: yt("Patrick Winston How to Speak MIT") },
    ],
    character: [
      { kind: "site", t: "Greater Good Science Center (Berkeley)", u: "https://greatergood.berkeley.edu/" },
      { kind: "book", t: "Atomic Habits by James Clear", u: yt("Atomic Habits summary James Clear"), free: false },
      { kind: "book", t: "Emotional Intelligence by Daniel Goleman", u: yt("Daniel Goleman emotional intelligence talk"), free: false },
    ],
    thinking: [
      { kind: "site", t: "Farnam Street: mental models", u: "https://fs.blog/mental-models/" },
      { kind: "book", t: "Thinking, Fast and Slow by Daniel Kahneman", u: yt("Kahneman Thinking Fast and Slow talk"), free: false },
      { kind: "video", t: "Crash Course: logical fallacies", u: yt("Crash Course Philosophy fallacies") },
    ],
    power: [
      { kind: "site", t: "Harvard Program on Negotiation: daily articles", u: "https://www.pon.harvard.edu/daily/" },
      { kind: "book", t: "Getting to Yes by Fisher and Ury", u: yt("Getting to Yes summary negotiation"), free: false },
      { kind: "book", t: "Influence by Robert Cialdini", u: yt("Robert Cialdini influence principles talk"), free: false },
    ],
    career: [
      { kind: "site", t: "Tech Interview Handbook", u: "https://www.techinterviewhandbook.org/" },
      { kind: "site", t: "GitHub Student Developer Pack (free Copilot for verified students)", u: "https://education.github.com/pack" },
      { kind: "site", t: "levels.fyi: real salary data", u: "https://www.levels.fyi/" },
    ],
    news: [
      { kind: "site", t: "Reserve Bank of India: press releases", u: "https://www.rbi.org.in/" },
      { kind: "site", t: "Press Information Bureau (government releases)", u: "https://pib.gov.in/" },
      { kind: "course", t: "Khan Academy: Macroeconomics", u: "https://www.khanacademy.org/economics-finance-domain/macroeconomics" },
      { kind: "site", t: "MoSPI: official statistics (GDP, CPI)", u: "https://www.mospi.gov.in/" },
    ],
    money: [
      { kind: "course", t: "Zerodha Varsity: free markets and trading modules", u: "https://zerodha.com/varsity/" },
      { kind: "site", t: "SEBI investor website", u: "https://investor.sebi.gov.in/" },
      { kind: "video", t: "SEBI study on F&O trader losses (news coverage)", u: yt("SEBI study F&O traders lose money") },
    ],
    style: [
      { kind: "video", t: "Capsule wardrobe basics for men", u: yt("capsule wardrobe men basics budget") },
      { kind: "video", t: "How a shirt should fit", u: yt("how a shirt should fit men") },
    ],
  };

  // Going beyond Pnode: university and IIT-depth computer science, all free.
  window.PNODE.deeper = [
    { kind: "course", t: "NPTEL: free courses taught by IIT and IISc professors", u: "https://nptel.ac.in/courses", why: "The closest thing to sitting in IIT classrooms. Many have exams with certificates." },
    { kind: "course", t: "OSSU: a complete free CS degree curriculum", u: "https://github.com/ossu/computer-science", why: "A full degree's worth of courses in order, with real assignments." },
    { kind: "site", t: "Teach Yourself Computer Science", u: "https://teachyourselfcs.com/", why: "Nine subjects, the best book and lecture series for each." },
    { kind: "course", t: "MIT OpenCourseWare", u: "https://ocw.mit.edu/", why: "Full MIT lectures, problem sets and exams. Do the problem sets; that's where depth comes from." },
    { kind: "course", t: "CMU 15-445 Database Systems", u: "https://15445.courses.cmu.edu/", why: "Build parts of a real database engine." },
    { kind: "course", t: "MIT 6.5840 Distributed Systems", u: "https://pdos.csail.mit.edu/6.824/", why: "Implement Raft and a sharded key-value store." },
  ];
})();
