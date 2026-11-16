LIB_ADD({
  id: "deep-devops", title: "DevOps in practice", group: "Engineering and AI", order: 4, glyph: "OPS",
  blurb: "Take an app from your laptop to production: Linux, networking and reverse proxies, Docker and Compose, CI/CD with GitHub Actions, safe deploys, AWS basics, Terraform, Kubernetes, observability and secrets. Problems include chmod, Nginx-style routing, service start order, semver, canary checks, IAM policy evaluation, a Terraform-style plan and percentiles.",
  intro: "'DevOps and cloud' gave you the map. This subject is the hands-on version: the commands, files and decisions you'll meet in your first job. Each module ends with something you deploy. The goal: you can say 'I containerised it, wrote the pipeline, deployed it on AWS and set up monitoring' and explain every part.",
  modules: [
    { title: "1. Linux and the network", lessons: [
      { id: "ddo-linux", t: "Linux for servers: processes, permissions and systemd", mins: 35,
        body: [
          "Almost every server runs Linux, so the terminal is your workplace. Daily commands: <code>ls -la</code>, <code>cd</code>, <code>cat</code>/<code>less</code>, <code>grep -rn</code>, <code>tail -f</code> (follow a log), <code>ps aux</code>, <code>top</code>/<code>htop</code>, <code>df -h</code> (disk), <code>free -h</code> (memory), <code>ss -tlnp</code> (which process is listening on which port).",
          "<b>Permissions</b>: each file has an owner, a group and permissions for owner / group / others: read (4), write (2), execute (1). <code>chmod 755 deploy.sh</code> = rwx for the owner, r-x for the others. <code>chmod 600 key.pem</code> = only the owner can read and write it, which SSH demands for private keys.",
          "<b>Users</b>: don't run apps as root. Create a service user so a hacked app can't take over the whole machine. Use <code>sudo</code> only for admin tasks.",
          "<b>systemd</b> keeps services running: it starts them at boot and restarts them if they crash. A unit file says what to run, as which user, and with which environment. Manage it with <code>systemctl start|stop|restart|status myapp</code> and read logs with <code>journalctl -u myapp -f</code>.",
          "<b>SSH</b>: log in with keys, not passwords. <code>ssh -i key.pem ubuntu@IP</code>. Disable password login on servers.",
        ],
        keys: ["Learn the 15 commands you'll use every day.", "rwx = 4+2+1 for owner, group, others.", "Never run apps as root.", "systemd restarts crashed services; journalctl shows their logs."],
        ex: "Your Node app dies at 3 a.m. With a systemd unit and Restart=always it's back in 2 seconds, and journalctl shows the error that killed it.",
        fact: "Linux runs on the overwhelming majority of the world's servers and on every one of the TOP500 supercomputers.",
        quiz: [
          { q: "chmod 640 file gives others…", o: ["Read", "Read and write", "No access", "Execute"], a: 2, why: "6 = rw owner, 4 = r group, 0 = nothing for others." },
          { q: "Which command shows which process is listening on port 3000?", o: ["df -h", "ss -tlnp", "chmod", "free -h"], a: 1, why: "ss lists sockets; -l listening, -t TCP, -n numeric, -p process." },
          { q: "Why run your app as a dedicated non-root user?", o: ["It's faster", "A compromised app can't take over the whole server", "Linux requires it", "To save disk"], a: 1, why: "Least privilege limits the damage." },
        ],
        code: [
          { id: "do-chmod", t: "chmod numbers to rwx", diff: "Easy", fn: "chmodToString",
            statement: "<p>Write <code>chmodToString(mode)</code> that converts a 3-digit octal permission string like <code>\"755\"</code> into its symbolic form <code>\"rwxr-xr-x\"</code>.</p>",
            examples: [{ in: "chmodToString('644')", out: "'rw-r--r--'" }],
            hints: ["Each digit is a sum of 4 (r), 2 (w) and 1 (x).", "Check each bit with &: (d & 4) ? 'r' : '-'."],
            starter: `function chmodToString(mode) {
  // your code here
}`,
            solution: `function chmodToString(mode) {
  return mode.split('').map((c) => {
    const d = Number(c);
    return (d & 4 ? 'r' : '-') + (d & 2 ? 'w' : '-') + (d & 1 ? 'x' : '-');
  }).join('');
}`,
            tests: [
              { args: ["755"], expect: "rwxr-xr-x" }, { args: ["644"], expect: "rw-r--r--" },
              { args: ["700"], expect: "rwx------" }, { args: ["000"], expect: "---------" }, { args: ["751"], expect: "rwxr-x--x" },
            ] },
        ] },

      { id: "ddo-net", t: "Networking for DevOps: DNS, ports, reverse proxies and TLS", mins: 35,
        body: [
          "A request to <code>app.example.com</code>: <b>DNS</b> turns the name into an IP (an A record; a CNAME points a name at another name) → the browser connects to port 443 → <b>TLS</b> encrypts the connection with a certificate → the server answers.",
          "A <b>reverse proxy</b> (Nginx, Caddy, a cloud load balancer) sits in front of your app: it terminates TLS, serves static files, compresses responses, and forwards requests to apps on internal ports like 3000. Your Node app never faces the internet directly.",
          "Nginx picks a <code>location</code> block by <b>longest matching prefix</b>: with <code>/</code> and <code>/api</code> defined, <code>/api/users</code> goes to the <code>/api</code> block.",
          "<pre>server {\n  listen 443 ssl;\n  server_name app.example.com;\n  location /     { root /var/www/app; try_files $uri /index.html; }\n  location /api/ { proxy_pass http://127.0.0.1:3000; }\n}</pre>",
          "<b>Certificates</b>: Let's Encrypt issues free ones and certbot renews them automatically. Caddy does it all by default.",
          "<b>Firewalls</b>: open only what you need, usually 22 (SSH, ideally from your IP only), 80 and 443. Databases should never be open to the internet.",
        ],
        keys: ["DNS: name → IP (A) or name → name (CNAME).", "Reverse proxy handles TLS, static files and routing.", "Nginx chooses the longest matching location prefix.", "Open only 22, 80 and 443; never expose the database."],
        ex: "Your portfolio and API on one cheap server: Nginx serves the React build at / and forwards /api/ to Node on port 3000, all over one free certificate.",
        fact: "Let's Encrypt has issued billions of certificates and is a major reason most web traffic is now encrypted.",
        quiz: [
          { q: "Locations / and /api exist. Where does /api/login go?", o: ["/", "/api", "Both", "404"], a: 1, why: "The longest matching prefix wins." },
          { q: "Which port should a production database have open to the internet?", o: ["5432", "3306", "None", "443"], a: 2, why: "Only your app servers should reach it, over a private network." },
        ],
        code: [
          { id: "do-route", t: "Longest-prefix routing", diff: "Easy", fn: "matchLocation",
            statement: "<p>Write <code>matchLocation(path, prefixes)</code> that returns the longest prefix the path starts with, or <code>null</code> if none match. This is how Nginx chooses a prefix <code>location</code>.</p>",
            examples: [{ in: "matchLocation('/api/users', ['/', '/api', '/api/admin'])", out: "'/api'" }],
            hints: ["Filter with path.startsWith(p).", "Keep the longest one."],
            starter: `function matchLocation(path, prefixes) {
  // your code here
}`,
            solution: `function matchLocation(path, prefixes) {
  let best = null;
  for (const p of prefixes) {
    if (path.startsWith(p) && (best === null || p.length > best.length)) best = p;
  }
  return best;
}`,
            tests: [
              { args: ["/api/users", ["/", "/api", "/api/admin"]], expect: "/api" },
              { args: ["/static/a.css", ["/", "/static/"]], expect: "/static/" },
              { args: ["/x", ["/api"]], expect: null },
              { args: ["/api/admin/x", ["/api", "/api/admin"]], expect: "/api/admin" },
            ] },
        ] },
    ] },

    { title: "2. Containers", lessons: [
      { id: "ddo-docker", t: "Docker images done right", mins: 35, viz: ["docker-layers"],
        body: [
          "An <b>image</b> is a read-only package of your app plus everything it needs. A <b>container</b> is a running instance of an image. Same image on your laptop, in CI and in production means no more 'works on my machine'.",
          "Each Dockerfile instruction makes a cached <b>layer</b>. Copy <code>package*.json</code> and install dependencies <i>before</i> copying your source, so code edits don't reinstall everything.",
          "<b>Multi-stage builds</b>: build in a full image, then copy only the output into a small runtime image. Smaller images pull faster and have fewer vulnerabilities.",
          "<pre>FROM node:22-alpine AS build\nWORKDIR /app\nCOPY package*.json ./\nRUN npm ci\nCOPY . .\nRUN npm run build\n\nFROM node:22-alpine\nWORKDIR /app\nENV NODE_ENV=production\nCOPY --from=build /app/dist ./dist\nCOPY package*.json ./\nRUN npm ci --omit=dev\nUSER node\nEXPOSE 3000\nCMD [\"node\", \"dist/server.js\"]</pre>",
          "Good habits: a <code>.dockerignore</code> (node_modules, .git, .env), a non-root <code>USER</code>, config through environment variables, logs to stdout, and tags with the git commit SHA instead of only <code>latest</code>.",
          "Containers are disposable: anything written inside disappears when they're replaced. Data that must survive goes into <b>volumes</b> or managed services.",
        ],
        keys: ["Image = package; container = running instance.", "Install dependencies before copying source for caching.", "Multi-stage builds keep runtime images small.", "Non-root user, .dockerignore, env config, logs to stdout."],
        ex: "Your Tonefer backend as a 90 MB multi-stage image instead of 1.2 GB: deploys go from 3 minutes to 20 seconds.",
        fact: "Docker was first shown publicly in a 5-minute lightning talk at PyCon in 2013.",
        quiz: [
          { q: "Why copy package.json before the source code?", o: ["Docker requires it", "So dependency install stays cached when only code changes", "Smaller image", "Security"], a: 1, why: "Layers rebuild from the first changed line onward." },
          { q: "Where should a container write data that must survive a redeploy?", o: ["Inside the container", "A volume or managed database", "/tmp", "The image"], a: 1, why: "Container filesystems are thrown away on replacement." },
        ],
        pq: [{ q: "Why tag images with the git SHA?", a: "You know exactly which code is running, and rolling back means redeploying a specific previous tag. 'latest' changes under you." }] },

      { id: "ddo-compose", t: "Docker Compose: a whole app with one command", mins: 30,
        body: [
          "Real apps are several containers: API, database, cache, maybe a worker. <b>Docker Compose</b> describes them in one <code>compose.yaml</code> and starts them all with <code>docker compose up</code>.",
          "<pre>services:\n  db:\n    image: postgres:16\n    environment: { POSTGRES_PASSWORD: dev }\n    volumes: [pgdata:/var/lib/postgresql/data]\n    healthcheck: { test: [\"CMD\", \"pg_isready\"], interval: 5s }\n  api:\n    build: .\n    ports: [\"3000:3000\"]\n    environment: { DATABASE_URL: postgres://postgres:dev@db:5432/postgres }\n    depends_on: { db: { condition: service_healthy } }\nvolumes: { pgdata: {} }</pre>",
          "Services reach each other <b>by service name</b> (<code>db:5432</code>) on a private network Compose creates.",
          "<code>depends_on</code> controls start order. Plain order only means 'started', not 'ready', so add a <b>healthcheck</b> and <code>condition: service_healthy</code>. Your app should also retry its database connection.",
          "Compose is perfect for local development and small single-server deployments. For many servers you move to a managed container service or Kubernetes.",
        ],
        keys: ["One file, whole stack, one command.", "Services find each other by name.", "depends_on + healthcheck for real readiness.", "Great for dev and small servers."],
        ex: "A new teammate runs docker compose up and has the API, PostgreSQL and Redis running in two minutes, without installing any of them.",
        fact: "The original Compose tool was called Fig, built by a small startup that Docker acquired in 2014.",
        quiz: [
          { q: "From the api container, the database host is…", o: ["localhost", "db", "127.0.0.1", "The laptop's IP"], a: 1, why: "Compose's network resolves service names." },
          { q: "depends_on alone guarantees the database is…", o: ["Ready for queries", "Started, not necessarily ready", "Migrated", "Backed up"], a: 1, why: "Add a healthcheck for readiness." },
        ],
        code: [
          { id: "do-order", t: "Service start order", diff: "Medium", fn: "startOrder",
            statement: "<p>Write <code>startOrder(services)</code>. <code>services</code> maps each name to the names it depends on. Return an order where every service comes after its dependencies. Whenever several are ready, take them alphabetically. If there's a cycle, return <code>null</code>.</p>",
            examples: [{ in: "startOrder({ web: ['api'], api: ['db', 'cache'], db: [], cache: [] })", out: "['cache', 'db', 'api', 'web']" }],
            hints: ["This is topological sorting (Kahn's algorithm): count unmet dependencies for each service.", "Keep a list of ready services; each time, sort it and take the first.", "If you finish with fewer services than you started with, there was a cycle."],
            starter: `function startOrder(services) {
  // your code here
}`,
            solution: `function startOrder(services) {
  const names = Object.keys(services);
  const left = {}, users = {};
  for (const n of names) { left[n] = services[n].length; users[n] = []; }
  for (const n of names) for (const d of services[n]) users[d].push(n);
  let ready = names.filter((n) => left[n] === 0);
  const out = [];
  while (ready.length) {
    ready.sort();
    const n = ready.shift();
    out.push(n);
    for (const u of users[n]) if (--left[u] === 0) ready.push(u);
  }
  return out.length === names.length ? out : null;
}`,
            explain: "Compose, Kubernetes init ordering, Terraform and build tools like Make all do this same dependency sort.",
            complexity: "O(V log V + E).",
            tests: [
              { args: [{ web: ["api"], api: ["db", "cache"], db: [], cache: [] }], expect: ["cache", "db", "api", "web"] },
              { args: [{ a: [] }], expect: ["a"] },
              { args: [{ a: ["b"], b: ["a"] }], expect: null },
              { args: [{ worker: ["db"], web: ["db"], db: [] }], expect: ["db", "web", "worker"] },
            ] },
        ] },
    ] },

    { title: "3. Delivery", lessons: [
      { id: "ddo-ci", t: "CI/CD with GitHub Actions", mins: 35, viz: ["cicd-pipeline"],
        body: [
          "<b>CI</b> (continuous integration): every push and pull request automatically runs lint, type-check, tests and a build. <b>CD</b> (continuous delivery/deployment): a passing main branch is automatically deployed.",
          "GitHub Actions workflows live in <code>.github/workflows/*.yml</code>. A workflow has <b>triggers</b> (<code>on: push</code>), <b>jobs</b> (run on fresh virtual machines, in parallel unless one <code>needs</code> another) and <b>steps</b> (shell commands or reusable actions).",
          "<pre>name: ci\non: [push, pull_request]\njobs:\n  test:\n    runs-on: ubuntu-latest\n    steps:\n      - uses: actions/checkout@v4\n      - uses: actions/setup-node@v4\n        with: { node-version: 22, cache: npm }\n      - run: npm ci\n      - run: npm run lint &amp;&amp; npm test\n  deploy:\n    needs: test\n    if: github.ref == 'refs/heads/main'\n    runs-on: ubuntu-latest\n    steps:\n      - run: echo \"build image, push, deploy\"</pre>",
          "Order steps fast → slow so failures show up quickly. Cache dependencies. Keep secrets in <b>repository secrets</b> (<code>${{ secrets.NAME }}</code>), never in the YAML.",
          "<b>Versioning</b>: semantic versions MAJOR.MINOR.PATCH. Breaking change → major; new feature → minor; bug fix → patch.",
          "Pnode itself deploys with a GitHub Actions workflow. Open <code>.github/workflows/pages.yml</code> and read it line by line.",
        ],
        keys: ["CI checks every change; CD ships passing main.", "Workflow → jobs → steps; needs creates order.", "Fast checks first, cache dependencies.", "Secrets in repository settings, never in YAML."],
        ex: "With CI on your repos, a recruiter sees green checkmarks on every commit. It shows you work like a professional team.",
        fact: "Pull-request checks are so standard that many companies block merging until every required check is green.",
        quiz: [
          { q: "In GitHub Actions, jobs run…", o: ["Always one after another", "In parallel unless linked with needs", "Only on main", "On your laptop"], a: 1, why: "needs creates dependencies between jobs." },
          { q: "A bug fix to version 2.4.1 becomes…", o: ["3.0.0", "2.5.0", "2.4.2", "2.4.1-fix"], a: 2, why: "Fixes bump PATCH." },
        ],
        code: [
          { id: "do-semver", t: "Bump a semantic version", diff: "Easy", fn: "bump",
            statement: "<p>Write <code>bump(version, type)</code> where type is <code>'major'</code>, <code>'minor'</code> or <code>'patch'</code>. Lower parts reset to 0. Keep a leading <code>v</code> if there is one.</p>",
            examples: [{ in: "bump('1.4.2', 'minor')", out: "'1.5.0'" }, { in: "bump('v2.0.1', 'patch')", out: "'v2.0.2'" }],
            hints: ["Strip a leading 'v', split on '.', convert to numbers.", "Patch numbers compare as numbers: 0.9.9 → 0.9.10."],
            starter: `function bump(version, type) {
  // your code here
}`,
            solution: `function bump(version, type) {
  const v = version.startsWith('v') ? 'v' : '';
  let [ma, mi, pa] = version.slice(v.length).split('.').map(Number);
  if (type === 'major') { ma++; mi = 0; pa = 0; }
  else if (type === 'minor') { mi++; pa = 0; }
  else pa++;
  return v + [ma, mi, pa].join('.');
}`,
            tests: [
              { args: ["1.4.2", "minor"], expect: "1.5.0" }, { args: ["1.4.2", "major"], expect: "2.0.0" },
              { args: ["0.9.9", "patch"], expect: "0.9.10" }, { args: ["v2.0.1", "patch"], expect: "v2.0.2" },
            ] },
        ] },

      { id: "ddo-deploy", t: "Deploying safely: blue-green, canary and rollback", mins: 30, viz: ["cicd-pipeline"],
        body: [
          "<b>Rolling</b>: replace instances a few at a time. Simple, but old and new versions run side by side for a while, so changes must be backward compatible.",
          "<b>Blue-green</b>: run the new version (green) next to the old (blue), test it, then switch all traffic at once. Rollback = switch back. Costs double capacity briefly.",
          "<b>Canary</b>: send a small share of traffic (say 5%) to the new version, compare its error rate and latency with the old one, then increase step by step or roll back automatically.",
          "<b>Feature flags</b> separate deploying code from releasing features: ship the code switched off, then turn it on for 1% of users.",
          "Database changes need the <b>expand–contract</b> pattern: add the new column first, deploy code that writes both, backfill, switch reads, then remove the old column later. Never break the running version.",
          "A deploy isn't done when the command finishes. It's done when the metrics look normal.",
        ],
        keys: ["Rolling, blue-green and canary trade speed, cost and safety.", "Canary = small traffic slice + automatic comparison.", "Feature flags split deploy from release.", "Expand–contract for schema changes."],
        ex: "A food-delivery app ships a new checkout to 2% of users. Errors double within 10 minutes, the canary rolls back on its own, and 98% of users never notice.",
        fact: "Large tech companies often deploy to production many times a day. Small, frequent deploys are easier to debug and roll back than big monthly releases.",
        quiz: [
          { q: "Which strategy lets you compare a new version on real traffic with minimal risk?", o: ["Big-bang", "Canary", "Manual FTP", "Rebooting"], a: 1, why: "A small slice of users sees it first." },
          { q: "You want to rename a column without downtime. First step?", o: ["Rename it", "Add the new column (expand)", "Drop the old one", "Stop the app"], a: 1, why: "Expand first, contract last." },
        ],
        code: [
          { id: "do-canary", t: "Canary decision", diff: "Medium", fn: "canary",
            statement: "<p>Write <code>canary(base, can, maxRatio)</code>. <code>base</code> and <code>can</code> are <code>{ req, err }</code> counts. If the canary has fewer than 100 requests, return <code>'wait'</code>. Otherwise compare error rates (err/req): if the canary's rate is at most <code>max(baseRate × maxRatio, 0.001)</code>, return <code>'promote'</code>, else <code>'rollback'</code>.</p>",
            examples: [{ in: "canary({req:10000,err:50}, {req:500,err:2}, 1.5)", out: "'promote'" }],
            hints: ["The 0.001 floor means a baseline with zero errors doesn't make the limit impossibly strict.","Check the 'wait' case first."],
            starter: `function canary(base, can, maxRatio) {
  // your code here
}`,
            solution: `function canary(base, can, maxRatio) {
  if (can.req < 100) return 'wait';
  const baseRate = base.req ? base.err / base.req : 0;
  const canRate = can.err / can.req;
  return canRate <= Math.max(baseRate * maxRatio, 0.001) ? 'promote' : 'rollback';
}`,
            tests: [
              { args: [{ req: 10000, err: 50 }, { req: 500, err: 2 }, 1.5], expect: "promote" },
              { args: [{ req: 10000, err: 50 }, { req: 500, err: 10 }, 1.5], expect: "rollback" },
              { args: [{ req: 10000, err: 50 }, { req: 50, err: 0 }, 1.5], expect: "wait" },
              { args: [{ req: 1000, err: 0 }, { req: 200, err: 0 }, 2], expect: "promote" },
              { args: [{ req: 1000, err: 0 }, { req: 200, err: 1 }, 2], expect: "rollback" },
            ] },
        ] },
    ] },

    { title: "4. Cloud and infrastructure as code", lessons: [
      { id: "ddo-aws", t: "AWS core for a fresher: EC2, S3, IAM, VPC, RDS", mins: 40,
        body: [
          "You don't need 200 services. These cover most junior work:",
          "<b>EC2</b>: virtual servers. You pick an instance size, an OS image and a <b>security group</b> (a firewall: which ports are open, to whom). <b>S3</b>: object storage for files, backups and static sites. <b>RDS</b>: managed PostgreSQL/MySQL with backups and patching handled for you.",
          "<b>IAM</b>: who can do what. Users, groups and <b>roles</b> get <b>policies</b>: JSON statements of Effect (Allow/Deny), Action (like <code>s3:GetObject</code>) and Resource (an ARN). Everything is denied by default; an explicit Deny beats any Allow. Give apps <b>roles</b>, not long-lived access keys.",
          "<b>VPC</b>: your private network. Public subnets hold load balancers; private subnets hold app servers and databases that the internet can't reach directly.",
          "<b>Regions and availability zones</b>: pick a region near your users (Mumbai for India) and spread across 2+ zones for resilience.",
          "<b>Cost safety</b>: set a billing alarm on day one, use free-tier-eligible sizes, and stop or delete what you're not using. Forgotten resources are how students get surprise bills.",
        ],
        keys: ["EC2 servers, S3 files, RDS databases.", "IAM: default deny, explicit Deny wins, roles over keys.", "Private subnets for apps and databases.", "Billing alarm on day one."],
        ex: "Deploying your project: React build in S3 behind a CDN, API on an EC2 instance in a private subnet behind a load balancer, PostgreSQL on RDS, the API reading S3 through an IAM role with no keys in code.",
        fact: "Leaked cloud access keys pushed to public GitHub repos are scanned for by bots within minutes, which is why roles and secret scanning matter.",
        quiz: [
          { q: "A policy allows s3:* and another explicitly denies s3:DeleteObject. Can the user delete?", o: ["Yes", "No, explicit Deny wins", "Only on weekends", "Depends on region"], a: 1, why: "Deny always overrides Allow." },
          { q: "Where should your production database live?", o: ["Public subnet with port 5432 open", "Private subnet, reachable only from app servers", "On your laptop", "In S3"], a: 1, why: "Keep it off the internet." },
        ],
        code: [
          { id: "do-iam", t: "Evaluate an IAM-style policy", diff: "Hard", fn: "isAllowed",
            statement: "<p>Write <code>isAllowed(statements, action, resource)</code>. Each statement is <code>{ effect: 'Allow' | 'Deny', action, resource }</code> where action and resource may contain <code>*</code> wildcards matching any run of characters (including none). Rules: if any matching statement is a Deny, return false. Else, if any matching statement is an Allow, return true. Else return false.</p>",
            examples: [{ in: "isAllowed([{effect:'Allow',action:'s3:Get*',resource:'arn:aws:s3:::photos/*'}], 's3:GetObject', 'arn:aws:s3:::photos/a.jpg')", out: "true" }],
            hints: ["Write a glob(pattern, text) helper first. Recursion: '*' either matches nothing (skip it) or eats one character.", "Then: matching = statements where both action and resource match."],
            starter: `function isAllowed(statements, action, resource) {
  // your code here
}`,
            solution: `function isAllowed(statements, action, resource) {
  const glob = (p, s) => {
    if (p === '') return s === '';
    if (p[0] === '*') return glob(p.slice(1), s) || (s !== '' && glob(p, s.slice(1)));
    return s !== '' && p[0] === s[0] && glob(p.slice(1), s.slice(1));
  };
  const hits = statements.filter((st) => glob(st.action, action) && glob(st.resource, resource));
  if (hits.some((st) => st.effect === 'Deny')) return false;
  return hits.some((st) => st.effect === 'Allow');
}`,
            explain: "Real IAM adds conditions, principals and more, but 'default deny, explicit deny wins' is the heart of it.",
            tests: [
              { args: [[{ effect: "Allow", action: "s3:Get*", resource: "arn:aws:s3:::photos/*" }], "s3:GetObject", "arn:aws:s3:::photos/a.jpg"], expect: true },
              { args: [[{ effect: "Allow", action: "s3:Get*", resource: "arn:aws:s3:::photos/*" }], "s3:PutObject", "arn:aws:s3:::photos/a.jpg"], expect: false },
              { args: [[{ effect: "Allow", action: "s3:Get*", resource: "arn:aws:s3:::photos/*" }], "s3:GetObject", "arn:aws:s3:::secrets/k"], expect: false },
              { args: [[{ effect: "Allow", action: "*", resource: "*" }, { effect: "Deny", action: "s3:DeleteObject", resource: "*" }], "s3:DeleteObject", "arn:aws:s3:::x/y"], expect: false },
              { args: [[{ effect: "Allow", action: "*", resource: "*" }, { effect: "Deny", action: "s3:DeleteObject", resource: "*" }], "s3:GetObject", "arn:aws:s3:::x/y"], expect: true },
              { args: [[], "s3:GetObject", "x"], expect: false },
            ] },
        ] },

      { id: "ddo-iac", t: "Terraform: infrastructure as code", mins: 35,
        body: [
          "Clicking around a cloud console doesn't scale and can't be reviewed. <b>Infrastructure as code</b> describes servers, networks and databases in files you commit, review and reuse.",
          "<b>Terraform</b> is declarative: you describe the <i>desired</i> state. <code>terraform plan</code> compares it with the real state and shows what it will <b>create</b>, <b>update</b> or <b>destroy</b>. <code>terraform apply</code> makes it so.",
          "<pre>resource \"aws_s3_bucket\" \"site\" {\n  bucket = \"pank-portfolio-site\"\n}\n\nresource \"aws_instance\" \"api\" {\n  ami           = var.ubuntu_ami\n  instance_type = \"t3.micro\"\n  tags = { Name = \"api\" }\n}</pre>",
          "The <b>state file</b> records what Terraform created. In a team, keep it in remote storage with locking so two people can't apply at once, and never commit it (it can contain secrets).",
          "Always read the plan before applying. A plan that says 'destroy database' is the most important line you'll read all day.",
        ],
        keys: ["Infra in reviewed, versioned files.", "Declarative: desired state; plan shows the diff.", "Remote, locked state; never commit it.", "Read every plan before apply."],
        ex: "Your whole project's AWS setup recreated in a new region with one command, because it's all in Terraform files instead of someone's memory of console clicks.",
        fact: "HashiCorp released Terraform in 2014; an open-source fork, OpenTofu, now exists alongside it.",
        quiz: [
          { q: "terraform plan…", o: ["Changes infrastructure", "Shows what apply would change", "Deletes state", "Installs AWS"], a: 1, why: "It's a dry run." },
          { q: "Why not commit the state file?", o: ["It's too big", "It can contain secrets and causes conflicts", "Git can't store JSON", "Terraform forbids it"], a: 1, why: "Use remote state with locking instead." },
        ],
        code: [
          { id: "do-plan", t: "A tiny terraform plan", diff: "Medium", fn: "planDiff",
            statement: "<p>Write <code>planDiff(current, desired)</code>. Both map resource names to flat config objects. Return <code>{ create, update, destroy }</code>: names only in desired, names in both whose config differs (any key added, removed or changed), and names only in current. Sort each list alphabetically.</p>",
            examples: [{ in: "planDiff({ web: {size:'small'}, old: {} }, { web: {size:'large'}, db: {engine:'pg'} })", out: "{ create: ['db'], update: ['web'], destroy: ['old'] }" }],
            hints: ["Two objects are equal if they have the same keys and every value matches.", "Loop over desired for create/update, over current for destroy."],
            starter: `function planDiff(current, desired) {
  // your code here
}`,
            solution: `function planDiff(current, desired) {
  const same = (a, b) => {
    const ka = Object.keys(a), kb = Object.keys(b);
    return ka.length === kb.length && ka.every((k) => k in b && a[k] === b[k]);
  };
  const create = [], update = [], destroy = [];
  for (const n of Object.keys(desired)) {
    if (!(n in current)) create.push(n);
    else if (!same(current[n], desired[n])) update.push(n);
  }
  for (const n of Object.keys(current)) if (!(n in desired)) destroy.push(n);
  return { create: create.sort(), update: update.sort(), destroy: destroy.sort() };
}`,
            tests: [
              { args: [{ web: { size: "small" }, old: {} }, { web: { size: "large" }, db: { engine: "pg" } }], expect: { create: ["db"], update: ["web"], destroy: ["old"] } },
              { args: [{ a: { x: "1" } }, { a: { x: "1" } }], expect: { create: [], update: [], destroy: [] } },
              { args: [{ a: { x: "1" } }, { a: { x: "1", y: "2" } }], expect: { create: [], update: ["a"], destroy: [] } },
              { args: [{}, { z: {}, b: {} }], expect: { create: ["b", "z"], update: [], destroy: [] } },
            ] },
        ] },
    ] },

    { title: "5. Running it in production", lessons: [
      { id: "ddo-k8s", t: "Kubernetes objects you'll actually touch", mins: 35, viz: ["k8s-reconcile"],
        body: [
          "Kubernetes runs containers across many machines and keeps them in the state you declared. You write YAML for <b>desired state</b>; controllers constantly <b>reconcile</b> reality towards it.",
          "<b>Pod</b>: one or more containers that run together (usually one). <b>Deployment</b>: 'keep 3 replicas of this pod running, roll out new versions gradually'. <b>Service</b>: a stable name and IP that load-balances across pods. <b>Ingress</b>: HTTP routing from outside into services. <b>ConfigMap</b> / <b>Secret</b>: configuration and credentials.",
          "<b>Probes</b>: a <i>readiness</i> probe decides when a pod gets traffic; a <i>liveness</i> probe restarts a stuck pod. <b>Requests/limits</b> reserve and cap CPU and memory.",
          "Everyday commands: <code>kubectl get pods</code>, <code>kubectl describe pod X</code> (events explain most problems), <code>kubectl logs X -f</code>, <code>kubectl rollout status|undo deployment/api</code>.",
          "Honest advice: many startups don't need Kubernetes. Learn the concepts and run a local cluster (kind or minikube) to understand it, but don't put your portfolio project on it just to say you did.",
        ],
        keys: ["Declare desired state; controllers reconcile.", "Pod → Deployment → Service → Ingress.", "Readiness gates traffic, liveness restarts.", "kubectl describe shows the events that explain failures."],
        ex: "A pod keeps crashing with CrashLoopBackOff. kubectl describe shows 'OOMKilled': the memory limit is too low. One YAML line fixes it.",
        fact: "Kubernetes comes from Greek for 'helmsman', and 'k8s' replaces the 8 letters between k and s.",
        quiz: [
          { q: "Which object gives a stable address to a changing set of pods?", o: ["Pod", "Service", "ConfigMap", "Node"], a: 1, why: "Pods come and go; the Service stays." },
          { q: "A pod is running but not ready yet. It should…", o: ["Get traffic anyway", "Get no traffic until readiness passes", "Be deleted", "Restart"], a: 1, why: "That's the readiness probe's job." },
        ] },

      { id: "ddo-obs", t: "Observability: logs, metrics, traces and SLOs", mins: 35,
        body: [
          "<b>Logs</b>: what happened. Write structured JSON (level, message, request id, user id) to stdout, then ship them somewhere searchable.",
          "<b>Metrics</b>: numbers over time. Watch the four golden signals: <b>latency</b>, <b>traffic</b>, <b>errors</b>, <b>saturation</b> (how full CPU, memory and queues are). Prometheus + Grafana is the classic open-source pair.",
          "<b>Traces</b>: one request's path across services, with timings for each hop. OpenTelemetry is the standard way to produce all three.",
          "Look at <b>percentiles</b>, not averages. p50 is the typical user; p99 is the slowest 1%, often your most active customers. An average of 120 ms can hide a p99 of 4 seconds.",
          "<b>SLO</b>: a target like '99.9% of requests succeed over 30 days'. The <b>error budget</b> is what's left: 0.1% of requests may fail. Budget left → ship features. Budget spent → focus on reliability.",
          "Alert on symptoms users feel (error rate, latency), not on every CPU spike, or people start ignoring alerts.",
        ],
        keys: ["Logs, metrics, traces: what happened, how much, where.", "Golden signals: latency, traffic, errors, saturation.", "Use p95/p99, not averages.", "SLO + error budget turn reliability into a decision."],
        ex: "Users complain checkout is slow. A trace shows 90% of the time is one unindexed SQL query. You find it in 5 minutes instead of guessing for a day.",
        fact: "Google's free 'Site Reliability Engineering' book introduced error budgets to a wide audience.",
        quiz: [
          { q: "Why prefer p99 over average latency?", o: ["It's smaller", "Averages hide the slow tail that real users feel", "It's required", "Easier maths"], a: 1, why: "A few very slow requests barely move the average." },
          { q: "A 99.9% SLO over 1,000,000 requests allows how many failures?", o: ["10", "100", "1,000", "10,000"], a: 2, why: "0.1% of 1,000,000 = 1,000." },
        ],
        code: [
          { id: "do-pct", t: "Latency percentile", diff: "Easy", fn: "percentile",
            statement: "<p>Write <code>percentile(values, p)</code> using the nearest-rank method: sort ascending, rank = ⌈p/100 × n⌉ (minimum 1), return the value at that rank (1-based). Return <code>null</code> for an empty list. Don't change the input array.</p>",
            examples: [{ in: "percentile([100, 200, 300, 400, 500], 50)", out: "300" }, { in: "percentile([100, 200, 300, 400, 500], 99)", out: "500" }],
            hints: ["Copy before sorting: [...values].sort((a, b) => a - b).", "Math.ceil, then Math.max(rank, 1)."],
            starter: `function percentile(values, p) {
  // your code here
}`,
            solution: `function percentile(values, p) {
  if (!values.length) return null;
  const s = [...values].sort((a, b) => a - b);
  const rank = Math.max(1, Math.ceil((p / 100) * s.length));
  return s[rank - 1];
}`,
            tests: [
              { args: [[100, 200, 300, 400, 500], 50], expect: 300 }, { args: [[100, 200, 300, 400, 500], 99], expect: 500 },
              { args: [[100, 200, 300, 400, 500], 0], expect: 100 }, { args: [[], 90], expect: null }, { args: [[5, 1, 4, 2, 3], 90], expect: 5 },
            ] },
          { id: "do-budget", t: "Error budget remaining", diff: "Easy", fn: "budgetLeft",
            statement: "<p>Write <code>budgetLeft(slo, total, failed)</code>. Allowed failures = total × (1 − slo). Return (allowed − failed) / allowed, rounded to 2 decimals. Negative means the budget is overspent.</p>",
            examples: [{ in: "budgetLeft(0.99, 10000, 50)", out: "0.5" }],
            hints: ["Math.round(x * 100) / 100."],
            starter: `function budgetLeft(slo, total, failed) {
  // your code here
}`,
            solution: `function budgetLeft(slo, total, failed) {
  const allowed = total * (1 - slo);
  return Math.round(((allowed - failed) / allowed) * 100) / 100;
}`,
            tests: [
              { args: [0.99, 10000, 50], expect: 0.5 }, { args: [0.999, 100000, 100], expect: 0 },
              { args: [0.99, 1000, 0], expect: 1 }, { args: [0.99, 1000, 20], expect: -1 },
            ] },
        ] },

      { id: "ddo-secrets", t: "Secrets and supply-chain security", mins: 25,
        body: [
          "<b>Secrets</b> (API keys, database passwords, tokens) never go in code or git. Locally: a <code>.env</code> file listed in <code>.gitignore</code>. In CI: repository secrets. In production: the platform's secret store (AWS Secrets Manager or SSM Parameter Store, Kubernetes Secrets) injected as environment variables.",
          "If a secret is ever pushed, <b>rotate it immediately</b>. Deleting the commit isn't enough: it may already be cloned or scraped. Turn on GitHub secret scanning.",
          "<b>Supply chain</b>: your app is mostly other people's code. Commit the lockfile, use <code>npm ci</code> in CI, run <code>npm audit</code> or Dependabot, and be suspicious of new packages with near-identical names to popular ones (typosquatting).",
          "<b>Images</b>: use small official base images, scan them (for example with Trivy), and rebuild regularly to pick up security patches.",
          "Least privilege everywhere: CI tokens that can only deploy, database users that can only reach their own tables.",
        ],
        keys: ["Secrets: .env locally, secret stores in CI and production.", "Leaked secret → rotate, don't just delete.", "Lockfiles, npm ci and dependency scanning.", "Scan and rebuild images regularly."],
        ex: "A student pushes an AWS key to a public repo and wakes up to a large bill from crypto-mining servers someone launched overnight. Rotating keys and using roles prevents it.",
        fact: "The 2021 Log4Shell vulnerability in a widely used Java logging library showed how one deep dependency can expose a huge share of the internet.",
        quiz: [
          { q: "You pushed a database password to GitHub. First action?", o: ["Delete the commit and relax", "Rotate the password immediately", "Make the repo private and relax", "Nothing"], a: 1, why: "Assume it's already been copied." },
          { q: "Why use npm ci in CI instead of npm install?", o: ["It's prettier", "It installs exactly what the lockfile says", "It skips tests", "It updates packages"], a: 1, why: "Reproducible installs, no surprise upgrades." },
        ],
        project: { t: "Ship one project like a professional", brief: "Take your strongest project (Tonefer or ProntoPy) and give it a real production setup. This is what turns 'I built an app' into 'I can run software'.", steps: ["Multi-stage Dockerfile + compose.yaml with the app and PostgreSQL.", "GitHub Actions: lint, test and build on every PR; build and push an image tagged with the SHA on main.", "Deploy to one EC2 instance with Nginx + Let's Encrypt, running the app as a non-root systemd service or with Compose.", "Secrets from SSM Parameter Store or GitHub secrets; a billing alarm on the account.", "Structured logs, a /health endpoint, an uptime check and a README section: 'How this is deployed', with a diagram."], stretch: ["Write the AWS setup in Terraform.", "Add a canary or blue-green switch with two Compose stacks behind Nginx."] } },
    ] },
  ],
});
