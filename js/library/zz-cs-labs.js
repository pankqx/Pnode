/* Coding labs for the CS degree-depth subjects. Each problem is attached to an existing lesson. */

LIB_CODE("dos-sched1", [
  { id: "os-sched", t: "CPU scheduler: FCFS, SJF and SRTF", diff: "Hard", fn: "avgWaiting",
    statement: "<p>Write <code>avgWaiting(procs, algo)</code>. <code>procs</code> is an array of <code>{id, at, bt}</code> (arrival and burst times, integers). <code>algo</code> is <code>'FCFS'</code>, <code>'SJF'</code> (non-preemptive) or <code>'SRTF'</code> (preemptive). Return the average waiting time rounded to 2 decimals. Ties: earlier arrival first, then smaller id. If the CPU is idle, jump to the next arrival.</p>",
    examples: [{ in: "avgWaiting([{id:1,at:0,bt:8},{id:2,at:1,bt:4},{id:3,at:2,bt:9},{id:4,at:3,bt:5}], 'SRTF')", out: "6.5" }],
    hints: ["Simulate time one unit at a time for SRTF; for FCFS/SJF you can jump to completion.", "Waiting time = completion − arrival − burst.", "Keep a 'remaining' copy of each burst."],
    starter: `function avgWaiting(procs, algo) {
  // your code here
}`,
    solution: `function avgWaiting(procs, algo) {
  const ps = procs.map((p) => ({ ...p, rem: p.bt, ct: 0 }));
  const better = (a, b, key) => a[key] - b[key] || a.at - b.at || a.id - b.id;
  let t = 0, done = 0;
  while (done < ps.length) {
    const ready = ps.filter((p) => p.rem > 0 && p.at <= t);
    if (!ready.length) { t = Math.min(...ps.filter((p) => p.rem > 0).map((p) => p.at)); continue; }
    let p;
    if (algo === 'FCFS') p = ready.sort((a, b) => a.at - b.at || a.id - b.id)[0];
    else if (algo === 'SJF') p = ready.sort((a, b) => better(a, b, 'bt'))[0];
    else p = ready.sort((a, b) => better(a, b, 'rem'))[0];
    if (algo === 'SRTF') { p.rem -= 1; t += 1; } else { t += p.rem; p.rem = 0; }
    if (p.rem === 0) { p.ct = t; done++; }
  }
  const avg = ps.reduce((s, p) => s + (p.ct - p.at - p.bt), 0) / ps.length;
  return Math.round(avg * 100) / 100;
}`,
    explain: "One-unit steps make preemption trivial: every time unit, re-pick the process with the least remaining time.",
    tests: [
      { args: [[{ id: 1, at: 0, bt: 8 }, { id: 2, at: 1, bt: 4 }, { id: 3, at: 2, bt: 9 }, { id: 4, at: 3, bt: 5 }], "FCFS"], expect: 8.75 },
      { args: [[{ id: 1, at: 0, bt: 8 }, { id: 2, at: 1, bt: 4 }, { id: 3, at: 2, bt: 9 }, { id: 4, at: 3, bt: 5 }], "SJF"], expect: 7.75 },
      { args: [[{ id: 1, at: 0, bt: 8 }, { id: 2, at: 1, bt: 4 }, { id: 3, at: 2, bt: 9 }, { id: 4, at: 3, bt: 5 }], "SRTF"], expect: 6.5 },
      { args: [[{ id: 1, at: 0, bt: 24 }, { id: 2, at: 0, bt: 3 }, { id: 3, at: 0, bt: 3 }], "FCFS"], expect: 17 },
      { args: [[{ id: 1, at: 5, bt: 2 }, { id: 2, at: 0, bt: 1 }], "SJF"], expect: 0 },
    ] },
]);

LIB_CODE("dos-sched2", [
  { id: "os-rr", t: "Round robin scheduler", diff: "Medium", fn: "roundRobin",
    statement: "<p>Write <code>roundRobin(bursts, q)</code> for processes that all arrive at time 0 in the given order. Return the array of completion times. A process that doesn't finish within its quantum goes to the back of the queue.</p>",
    examples: [{ in: "roundRobin([24, 3, 3], 4)", out: "[30, 7, 10]" }],
    hints: ["Use a queue of indexes and a remaining-time array.", "Each turn runs min(q, remaining)."],
    starter: `function roundRobin(bursts, q) {
  // your code here
}`,
    solution: `function roundRobin(bursts, q) {
  const rem = bursts.slice(), ct = new Array(bursts.length).fill(0);
  const queue = bursts.map((_, i) => i);
  let t = 0;
  while (queue.length) {
    const i = queue.shift();
    const run = Math.min(q, rem[i]);
    t += run; rem[i] -= run;
    if (rem[i] > 0) queue.push(i); else ct[i] = t;
  }
  return ct;
}`,
    tests: [{ args: [[24, 3, 3], 4], expect: [30, 7, 10] }, { args: [[5, 5], 10], expect: [5, 10] }, { args: [[3, 1, 2], 1], expect: [6, 2, 5] }] },
]);

LIB_CODE("dos-deadlock", [
  { id: "os-banker", t: "Banker's safety algorithm", diff: "Medium", fn: "safeSequence",
    statement: "<p>Write <code>safeSequence(available, max, alloc)</code> (arrays of resource vectors). Need = max − alloc. Repeatedly pick the <b>lowest-numbered</b> unfinished process whose need ≤ work, finish it (work += its allocation), and restart the scan from process 0. Return the safe sequence of process indexes, or <code>null</code> if the state is unsafe.</p>",
    examples: [{ in: "the 5-process example from the lesson", out: "[1, 3, 0, 2, 4]" }],
    hints: ["Keep work = available.slice() and a finished[] array.", "A process fits if every need[j] <= work[j]."],
    starter: `function safeSequence(available, max, alloc) {
  // your code here
}`,
    solution: `function safeSequence(available, max, alloc) {
  const n = max.length, work = available.slice(), done = new Array(n).fill(false), seq = [];
  const need = max.map((row, i) => row.map((v, j) => v - alloc[i][j]));
  while (seq.length < n) {
    const i = need.findIndex((row, k) => !done[k] && row.every((v, j) => v <= work[j]));
    if (i === -1) return null;
    alloc[i].forEach((v, j) => (work[j] += v));
    done[i] = true; seq.push(i);
  }
  return seq;
}`,
    tests: [
      { args: [[3, 3, 2], [[7, 5, 3], [3, 2, 2], [9, 0, 2], [2, 2, 2], [4, 3, 3]], [[0, 1, 0], [2, 0, 0], [3, 0, 2], [2, 1, 1], [0, 0, 2]]], expect: [1, 3, 0, 2, 4] },
      { args: [[0, 0], [[1, 1], [1, 1]], [[0, 0], [0, 0]]], expect: null },
      { args: [[1], [[2], [1]], [[1], [0]]], expect: [0, 1] },
    ] },
]);

LIB_CODE("dos-vm", [
  { id: "os-pages", t: "Page replacement: FIFO, LRU and OPT", diff: "Medium", fn: "pageFaults",
    statement: "<p>Write <code>pageFaults(refs, frames, algo)</code> returning the number of page faults for <code>'FIFO'</code>, <code>'LRU'</code> or <code>'OPT'</code>, starting with empty frames. For OPT, evict the page whose next use is farthest away (never used again counts as infinitely far; ties → the page loaded earliest).</p>",
    examples: [{ in: "pageFaults([7,0,1,2,0,3,0,4,2,3,0,3,2,1,2,0,1,7,0,1], 3, 'LRU')", out: "12" }],
    hints: ["Keep the frames as an array in load order for FIFO.", "For LRU, move a page to the end on every hit; evict index 0.", "For OPT, look ahead with refs.indexOf(page, i + 1)."],
    starter: `function pageFaults(refs, frames, algo) {
  // your code here
}`,
    solution: `function pageFaults(refs, frames, algo) {
  let mem = [], faults = 0;
  refs.forEach((p, i) => {
    const at = mem.indexOf(p);
    if (at !== -1) { if (algo === 'LRU') { mem.splice(at, 1); mem.push(p); } return; }
    faults++;
    if (mem.length < frames) { mem.push(p); return; }
    let victim = 0;
    if (algo === 'OPT') {
      let far = -1;
      mem.forEach((q, k) => { const nx = refs.indexOf(q, i + 1); const d = nx === -1 ? Infinity : nx; if (d > far) { far = d; victim = k; } });
    }
    mem.splice(victim, 1); mem.push(p);
  });
  return faults;
}`,
    tests: [
      { args: [[7, 0, 1, 2, 0, 3, 0, 4, 2, 3, 0, 3, 2, 1, 2, 0, 1, 7, 0, 1], 3, "FIFO"], expect: 15 },
      { args: [[7, 0, 1, 2, 0, 3, 0, 4, 2, 3, 0, 3, 2, 1, 2, 0, 1, 7, 0, 1], 3, "LRU"], expect: 12 },
      { args: [[7, 0, 1, 2, 0, 3, 0, 4, 2, 3, 0, 3, 2, 1, 2, 0, 1, 7, 0, 1], 3, "OPT"], expect: 9 },
      { args: [[1, 2, 3, 4, 1, 2, 5, 1, 2, 3, 4, 5], 3, "FIFO"], expect: 9 }, { args: [[1, 2, 3, 4, 1, 2, 5, 1, 2, 3, 4, 5], 4, "FIFO"], expect: 10 },
    ] },
]);

LIB_CODE("dos-disk", [
  { id: "os-disk", t: "Disk scheduling: total head movement", diff: "Easy", fn: "headMovement",
    statement: "<p>Write <code>headMovement(queue, head, algo)</code> for <code>'FCFS'</code> and <code>'SSTF'</code> (on ties, pick the lower cylinder). Return the total number of cylinders the head moves.</p>",
    examples: [{ in: "headMovement([98,183,37,122,14,124,65,67], 53, 'SSTF')", out: "236" }],
    hints: ["FCFS: sum |next − current| in queue order.", "SSTF: repeatedly pick the pending request closest to the head."],
    starter: `function headMovement(queue, head, algo) {
  // your code here
}`,
    solution: `function headMovement(queue, head, algo) {
  let pos = head, total = 0;
  const pending = queue.slice();
  while (pending.length) {
    let i = 0;
    if (algo === 'SSTF') pending.forEach((c, k) => { const d = Math.abs(c - pos), b = Math.abs(pending[i] - pos); if (d < b || (d === b && c < pending[i])) i = k; });
    total += Math.abs(pending[i] - pos);
    pos = pending.splice(i, 1)[0];
  }
  return total;
}`,
    tests: [{ args: [[98, 183, 37, 122, 14, 124, 65, 67], 53, "FCFS"], expect: 640 }, { args: [[98, 183, 37, 122, 14, 124, 65, 67], 53, "SSTF"], expect: 236 }, { args: [[], 10, "FCFS"], expect: 0 }] },
]);

LIB_CODE("ddb-fd", [
  { id: "db-closure", t: "Attribute closure", diff: "Medium", fn: "closure",
    statement: "<p>Attributes are single letters. Write <code>closure(attrs, fds)</code> where <code>attrs</code> is a string like <code>'AD'</code> and <code>fds</code> is a list of <code>[lhs, rhs]</code> strings like <code>['CD', 'E']</code>. Return the closure as a string of letters in alphabetical order.</p>",
    examples: [{ in: "closure('AD', [['A','B'],['B','C'],['CD','E']])", out: "'ABCDE'" }],
    hints: ["Use a Set; loop until nothing new is added.", "An FD fires when every letter of its lhs is in the set."],
    starter: `function closure(attrs, fds) {
  // your code here
}`,
    solution: `function closure(attrs, fds) {
  const s = new Set(attrs);
  let changed = true;
  while (changed) {
    changed = false;
    for (const [l, r] of fds) {
      if ([...l].every((c) => s.has(c))) for (const c of r) if (!s.has(c)) { s.add(c); changed = true; }
    }
  }
  return [...s].sort().join('');
}`,
    tests: [{ args: ["AD", [["A", "B"], ["B", "C"], ["CD", "E"]]], expect: "ABCDE" }, { args: ["A", [["A", "B"], ["B", "C"], ["CD", "E"]]], expect: "ABC" }, { args: ["B", [["AB", "C"]]], expect: "B" }] },
  { id: "db-keys", t: "Find all candidate keys", diff: "Hard", fn: "candidateKeys",
    statement: "<p>Write <code>candidateKeys(attrs, fds)</code> (same format as the closure problem; <code>attrs</code> is all attributes of R). Return every candidate key as an alphabetically sorted string, with the list sorted by length then alphabetically. R has at most 8 attributes.</p>",
    examples: [{ in: "candidateKeys('ABCD', [['AB','C'],['C','D'],['D','A']])", out: "['AB', 'BC', 'BD']" }],
    hints: ["Try subsets in increasing size (there are at most 2⁸ = 256).", "A subset is a key if its closure is everything and it doesn't contain an already-found key.", "Reuse your closure function."],
    starter: `function candidateKeys(attrs, fds) {
  // your code here
}`,
    solution: `function candidateKeys(attrs, fds) {
  const all = [...attrs].sort();
  const close = (set) => {
    const s = new Set(set); let ch = true;
    while (ch) { ch = false; for (const [l, r] of fds) if ([...l].every((c) => s.has(c))) for (const c of r) if (!s.has(c)) { s.add(c); ch = true; } }
    return s;
  };
  const subsets = [];
  for (let m = 1; m < 1 << all.length; m++) subsets.push(all.filter((_, i) => m & (1 << i)).join(''));
  subsets.sort((a, b) => a.length - b.length || a.localeCompare(b));
  const keys = [];
  for (const s of subsets) {
    if (keys.some((k) => [...k].every((c) => s.includes(c)))) continue;
    if (close(s).size === all.length) keys.push(s);
  }
  return keys;
}`,
    tests: [
      { args: ["ABCD", [["AB", "C"], ["C", "D"], ["D", "A"]]], expect: ["AB", "BC", "BD"] }, { args: ["ABCDE", [["A", "B"], ["B", "C"], ["CD", "E"]]], expect: ["AD"] },
      { args: ["ABC", [["AB", "C"], ["C", "B"]]], expect: ["AB", "AC"] }, { args: ["AB", []], expect: ["AB"] },
    ] },
]);

LIB_CODE("ddb-txn", [
  { id: "db-serial", t: "Conflict serializability tester", diff: "Hard", fn: "serialOrder",
    statement: "<p>A schedule is an array like <code>['R1(A)', 'W2(A)', 'R1(B)']</code> (operation, transaction number, item). Write <code>serialOrder(schedule)</code> that builds the precedence graph and returns an equivalent serial order (array of transaction numbers; when several are possible, always pick the smallest available number next), or <code>null</code> if the schedule isn't conflict-serializable. Include every transaction that appears.</p>",
    examples: [{ in: "serialOrder(['R1(A)','R2(A)','W1(A)','W2(A)'])", out: "null" }],
    hints: ["Parse with a regex like /([RW])(\\d+)\\((\\w+)\\)/.", "For each pair i < j: different transactions, same item, at least one W → edge Ti → Tj.", "Kahn's topological sort, choosing the smallest ready node; if not all nodes are output, there's a cycle."],
    starter: `function serialOrder(schedule) {
  // your code here
}`,
    solution: `function serialOrder(schedule) {
  const ops = schedule.map((s) => { const m = s.match(/([RW])(\\d+)\\((\\w+)\\)/); return { op: m[1], t: +m[2], x: m[3] }; });
  const txns = [...new Set(ops.map((o) => o.t))];
  const edges = new Map(txns.map((t) => [t, new Set()]));
  for (let i = 0; i < ops.length; i++) for (let j = i + 1; j < ops.length; j++) {
    const a = ops[i], b = ops[j];
    if (a.t !== b.t && a.x === b.x && (a.op === 'W' || b.op === 'W')) edges.get(a.t).add(b.t);
  }
  const indeg = new Map(txns.map((t) => [t, 0]));
  edges.forEach((outs) => outs.forEach((v) => indeg.set(v, indeg.get(v) + 1)));
  const order = [];
  while (order.length < txns.length) {
    const ready = txns.filter((t) => indeg.get(t) === 0 && !order.includes(t)).sort((a, b) => a - b);
    if (!ready.length) return null;
    const t = ready[0];
    order.push(t);
    edges.get(t).forEach((v) => indeg.set(v, indeg.get(v) - 1));
  }
  return order;
}`,
    tests: [
      { args: [["R1(A)", "R2(A)", "W1(A)", "W2(A)"]], expect: null }, { args: [["R1(A)", "W1(A)", "R2(A)", "W2(A)", "R1(B)", "W1(B)", "R2(B)", "W2(B)"]], expect: [1, 2] },
      { args: [["R2(X)", "W2(X)", "R1(X)", "R3(Y)"]], expect: [2, 1, 3] }, { args: [["R1(A)", "W2(A)", "W1(A)", "W3(A)"]], expect: null },
    ] },
]);

LIB_CODE("dcn-ip", [
  { id: "cn-subnet", t: "Subnet calculator", diff: "Medium", fn: "subnet",
    statement: "<p>Write <code>subnet(cidr)</code> for strings like <code>'172.16.45.200/20'</code>. Return <code>{network, broadcast, mask, hosts}</code> as dotted strings and a number (<code>hosts = 2^(32−n) − 2</code>, but 0 for /31 and /32).</p>",
    examples: [{ in: "subnet('172.16.45.200/20')", out: "{network:'172.16.32.0', broadcast:'172.16.47.255', mask:'255.255.240.0', hosts:4094}" }],
    hints: ["Convert the IP to a 32-bit unsigned integer: ((a << 24) | (b << 16) | (c << 8) | d) >>> 0.", "mask = n === 0 ? 0 : (~0 << (32 − n)) >>> 0.", "network = ip & mask; broadcast = network | ~mask (use >>> 0 to keep it unsigned)."],
    starter: `function subnet(cidr) {
  // your code here
}`,
    solution: `function subnet(cidr) {
  const [ip, bits] = cidr.split('/');
  const n = +bits;
  const v = ip.split('.').reduce((acc, o) => ((acc << 8) | +o) >>> 0, 0);
  const mask = n === 0 ? 0 : (~0 << (32 - n)) >>> 0;
  const net = (v & mask) >>> 0, bc = (net | ~mask) >>> 0;
  const str = (x) => [24, 16, 8, 0].map((s) => (x >>> s) & 255).join('.');
  return { network: str(net), broadcast: str(bc), mask: str(mask), hosts: n >= 31 ? 0 : 2 ** (32 - n) - 2 };
}`,
    tests: [
      { args: ["172.16.45.200/20"], expect: { network: "172.16.32.0", broadcast: "172.16.47.255", mask: "255.255.240.0", hosts: 4094 } },
      { args: ["192.168.10.70/26"], expect: { network: "192.168.10.64", broadcast: "192.168.10.127", mask: "255.255.255.192", hosts: 62 } },
      { args: ["10.0.5.255/23"], expect: { network: "10.0.4.0", broadcast: "10.0.5.255", mask: "255.255.254.0", hosts: 510 } },
      { args: ["8.8.8.8/32"], expect: { network: "8.8.8.8", broadcast: "8.8.8.8", mask: "255.255.255.255", hosts: 0 } },
    ] },
]);

LIB_CODE("dcn-error", [
  { id: "cn-crc", t: "CRC remainder", diff: "Medium", fn: "crc",
    statement: "<p>Write <code>crc(data, gen)</code> where both are bit strings. Append (gen.length − 1) zeros to data, do mod-2 (XOR) long division by gen, and return the remainder as a bit string of length gen.length − 1.</p>",
    examples: [{ in: "crc('1101011111', '10011')", out: "'0010'" }],
    hints: ["Work on an array of 0/1 digits.", "Scan left to right; whenever the current bit is 1, XOR gen into the bits starting there."],
    starter: `function crc(data, gen) {
  // your code here
}`,
    solution: `function crc(data, gen) {
  const r = gen.length - 1;
  const bits = (data + '0'.repeat(r)).split('').map(Number);
  for (let i = 0; i + gen.length <= bits.length; i++) {
    if (bits[i] === 1) for (let j = 0; j < gen.length; j++) bits[i + j] ^= +gen[j];
  }
  return bits.slice(-r).join('');
}`,
    tests: [{ args: ["1101011111", "10011"], expect: "0010" }, { args: ["100100", "1101"], expect: "001" }, { args: ["0000", "101"], expect: "00" }] },
]);

LIB_CODE("dcn-routing", [
  { id: "cn-dijkstra", t: "Dijkstra shortest paths", diff: "Medium", fn: "shortest",
    statement: "<p>Write <code>shortest(edges, src)</code> where edges are undirected <code>[u, v, w]</code> triples with non-negative weights. Return an object mapping every node that appears to its shortest distance from src (<code>Infinity</code> if unreachable).</p>",
    examples: [{ in: "shortest([['A','B',4],['A','C',2],['C','B',1],['B','D',5],['C','D',8],['C','E',10],['D','E',2]], 'A')", out: "{A:0, B:3, C:2, D:8, E:10}" }],
    hints: ["Build an adjacency list.", "Repeatedly take the unvisited node with the smallest distance (a simple scan is fine for small graphs) and relax its edges."],
    starter: `function shortest(edges, src) {
  // your code here
}`,
    solution: `function shortest(edges, src) {
  const adj = new Map();
  const add = (a, b, w) => { if (!adj.has(a)) adj.set(a, []); adj.get(a).push([b, w]); };
  for (const [u, v, w] of edges) { add(u, v, w); add(v, u, w); }
  if (!adj.has(src)) adj.set(src, []);
  const dist = {}; for (const k of adj.keys()) dist[k] = Infinity;
  dist[src] = 0;
  const seen = new Set();
  while (seen.size < adj.size) {
    let u = null;
    for (const k of adj.keys()) if (!seen.has(k) && (u === null || dist[k] < dist[u])) u = k;
    if (dist[u] === Infinity) break;
    seen.add(u);
    for (const [v, w] of adj.get(u)) if (dist[u] + w < dist[v]) dist[v] = dist[u] + w;
  }
  return dist;
}`,
    tests: [
      { args: [[["A", "B", 4], ["A", "C", 2], ["C", "B", 1], ["B", "D", 5], ["C", "D", 8], ["C", "E", 10], ["D", "E", 2]], "A"], expect: { A: 0, B: 3, C: 2, D: 8, E: 10 } },
      { args: [[["x", "y", 1], ["z", "w", 1]], "x"], expect: { x: 0, y: 1, z: Infinity, w: Infinity } },
    ] },
]);

LIB_CODE("dco-repr", [
  { id: "co-twos", t: "Two's complement encoder", diff: "Easy", fn: "toTwos",
    statement: "<p>Write <code>toTwos(n, bits)</code> returning the two's complement bit string of integer n in the given width, or <code>null</code> if n doesn't fit (range −2^(bits−1) … 2^(bits−1) − 1).</p>",
    examples: [{ in: "toTwos(-45, 8)", out: "'11010011'" }],
    hints: ["For negative n, the pattern equals the unsigned value 2^bits + n.", "padStart the binary string to the width."],
    starter: `function toTwos(n, bits) {
  // your code here
}`,
    solution: `function toTwos(n, bits) {
  const min = -(2 ** (bits - 1)), max = 2 ** (bits - 1) - 1;
  if (n < min || n > max) return null;
  return (n < 0 ? 2 ** bits + n : n).toString(2).padStart(bits, '0');
}`,
    tests: [{ args: [-45, 8], expect: "11010011" }, { args: [5, 4], expect: "0101" }, { args: [-128, 8], expect: "10000000" }, { args: [128, 8], expect: null }, { args: [-1, 16], expect: "1111111111111111" }] },
]);

LIB_CODE("dco-cache", [
  { id: "co-cache", t: "Set-associative cache simulator", diff: "Medium", fn: "cacheStats",
    statement: "<p>Write <code>cacheStats(blocks, lines, ways)</code>: simulate a cache with <code>lines</code> total lines grouped into sets of <code>ways</code> lines (sets = lines / ways), LRU replacement within each set, given a sequence of <b>block numbers</b>. Return <code>{hits, misses}</code>. ways = 1 is direct-mapped; ways = lines is fully associative.</p>",
    examples: [{ in: "cacheStats([1,5,1,2,6,2,1], 4, 1)", out: "{hits: 1, misses: 6}" }],
    hints: ["set = block % sets.", "Keep each set as an array in LRU order (most recent last)."],
    starter: `function cacheStats(blocks, lines, ways) {
  // your code here
}`,
    solution: `function cacheStats(blocks, lines, ways) {
  const sets = lines / ways;
  const cache = Array.from({ length: sets }, () => []);
  let hits = 0, misses = 0;
  for (const b of blocks) {
    const s = cache[b % sets], i = s.indexOf(b);
    if (i !== -1) { hits++; s.splice(i, 1); s.push(b); continue; }
    misses++;
    if (s.length === ways) s.shift();
    s.push(b);
  }
  return { hits, misses };
}`,
    tests: [{ args: [[1, 5, 1, 2, 6, 2, 1], 4, 1], expect: { hits: 1, misses: 6 } }, { args: [[1, 5, 1, 2, 6, 2, 1], 4, 2], expect: { hits: 3, misses: 4 } }, { args: [[1, 5, 1, 2, 6, 2, 1], 4, 4], expect: { hits: 3, misses: 4 } }, { args: [[0, 4, 0, 4], 4, 1], expect: { hits: 0, misses: 4 } }] },
]);

LIB_CODE("dmt-nt", [
  { id: "mt-inverse", t: "Modular inverse with extended Euclid", diff: "Easy", fn: "modInverse",
    statement: "<p>Write <code>modInverse(a, m)</code> returning x in [0, m) with a·x ≡ 1 (mod m), or <code>null</code> if gcd(a, m) ≠ 1. Use the extended Euclidean algorithm (don't brute force).</p>",
    examples: [{ in: "modInverse(3, 11)", out: "4" }, { in: "modInverse(3, 40)", out: "27" }],
    hints: ["Track (old_r, r) and (old_s, s) through Euclid's steps.", "At the end old_r is the gcd and old_s the coefficient of a; normalise with ((x % m) + m) % m."],
    starter: `function modInverse(a, m) {
  // your code here
}`,
    solution: `function modInverse(a, m) {
  let [r0, r1] = [a, m], [s0, s1] = [1, 0];
  while (r1 !== 0) {
    const q = Math.floor(r0 / r1);
    [r0, r1] = [r1, r0 - q * r1];
    [s0, s1] = [s1, s0 - q * s1];
  }
  if (r0 !== 1) return null;
  return ((s0 % m) + m) % m;
}`,
    tests: [{ args: [3, 11], expect: 4 }, { args: [3, 40], expect: 27 }, { args: [6, 9], expect: null }, { args: [17, 3120], expect: 2753 }] },
]);

LIB_CODE("dmt-rel", [
  { id: "mt-topo", t: "Topological sort (dependency order)", diff: "Medium", fn: "topoSort",
    statement: "<p>Packages have dependencies: <code>deps</code> maps each package to the list it depends on. Write <code>topoSort(deps)</code> returning an install order where every package comes after its dependencies. When several are ready, pick the alphabetically smallest. Return <code>null</code> if there's a cycle. Packages that appear only as dependencies are included too.</p>",
    examples: [{ in: "topoSort({app: ['react', 'utils'], react: [], utils: ['lodash']})", out: "['lodash', 'react', 'utils', 'app']" }],
    hints: ["Kahn's algorithm: count unmet dependencies for each package.", "Repeatedly install the smallest package with zero unmet dependencies."],
    starter: `function topoSort(deps) {
  // your code here
}`,
    solution: `function topoSort(deps) {
  const nodes = new Set(Object.keys(deps));
  Object.values(deps).forEach((list) => list.forEach((d) => nodes.add(d)));
  const unmet = new Map([...nodes].map((n) => [n, (deps[n] || []).length]));
  const order = [];
  while (order.length < nodes.size) {
    const ready = [...nodes].filter((n) => unmet.get(n) === 0 && !order.includes(n)).sort();
    if (!ready.length) return null;
    const n = ready[0];
    order.push(n);
    for (const [p, list] of Object.entries(deps)) if (list.includes(n)) unmet.set(p, unmet.get(p) - 1);
  }
  return order;
}`,
    tests: [{ args: [{ app: ["react", "utils"], react: [], utils: ["lodash"] }], expect: ["lodash", "react", "utils", "app"] }, { args: [{ a: ["b"], b: ["a"] }], expect: null }, { args: [{}], expect: [] }] },
]);

LIB_CODE("dtc-dfa", [
  { id: "tc-dfa", t: "Run a DFA", diff: "Easy", fn: "runDfa",
    statement: "<p>A DFA is <code>{start, accept: [states], delta: {state: {symbol: nextState}}}</code>. Write <code>runDfa(dfa, input)</code> returning true if the DFA accepts the input string. A missing transition means reject (an implicit dead state).</p>",
    examples: [{ in: "binary numbers divisible by 3 on '110'", out: "true (6)" }],
    hints: ["Start at dfa.start and follow delta for each character.", "At the end check accept.includes(state)."],
    starter: `function runDfa(dfa, input) {
  // your code here
}`,
    solution: `function runDfa(dfa, input) {
  let q = dfa.start;
  for (const ch of input) {
    const next = dfa.delta[q] && dfa.delta[q][ch];
    if (next === undefined) return false;
    q = next;
  }
  return dfa.accept.includes(q);
}`,
    tests: [
      { args: [{ start: "0", accept: ["0"], delta: { 0: { 0: "0", 1: "1" }, 1: { 0: "2", 1: "0" }, 2: { 0: "1", 1: "2" } } }, "110"], expect: true },
      { args: [{ start: "0", accept: ["0"], delta: { 0: { 0: "0", 1: "1" }, 1: { 0: "2", 1: "0" }, 2: { 0: "1", 1: "2" } } }, "111"], expect: false },
      { args: [{ start: "s", accept: ["f"], delta: { s: { a: "f" } } }, "ab"], expect: false }, { args: [{ start: "s", accept: ["s"], delta: {} }, ""], expect: true },
    ] },
]);

LIB_CODE("dtc-nfa", [
  { id: "tc-nfa", t: "Simulate an ε-NFA", diff: "Medium", fn: "nfaAccepts",
    statement: "<p>An NFA is <code>{start, accept: [states], delta: {state: {symbol: [states]}}}</code>, where the symbol <code>''</code> (empty string) means an ε-move. Write <code>nfaAccepts(nfa, input)</code> by tracking the set of current states (with ε-closures) — Thompson's method, no backtracking.</p>",
    examples: [{ in: "NFA for 'second-to-last symbol is 1' on '0110'", out: "true" }],
    hints: ["Write closure(set): repeatedly add states reachable by '' moves.", "For each input symbol: move every state, then take the closure."],
    starter: `function nfaAccepts(nfa, input) {
  // your code here
}`,
    solution: `function nfaAccepts(nfa, input) {
  const step = (q, sym) => (nfa.delta[q] && nfa.delta[q][sym]) || [];
  const closure = (set) => {
    const s = new Set(set), stack = [...set];
    while (stack.length) for (const r of step(stack.pop(), '')) if (!s.has(r)) { s.add(r); stack.push(r); }
    return s;
  };
  let cur = closure([nfa.start]);
  for (const ch of input) {
    const next = [];
    cur.forEach((q) => next.push(...step(q, ch)));
    cur = closure(next);
  }
  return [...cur].some((q) => nfa.accept.includes(q));
}`,
    tests: [
      { args: [{ start: "q0", accept: ["q2"], delta: { q0: { 0: ["q0"], 1: ["q0", "q1"] }, q1: { 0: ["q2"], 1: ["q2"] } } }, "0110"], expect: true },
      { args: [{ start: "q0", accept: ["q2"], delta: { q0: { 0: ["q0"], 1: ["q0", "q1"] }, q1: { 0: ["q2"], 1: ["q2"] } } }, "0101"], expect: false },
      { args: [{ start: "a", accept: ["c"], delta: { a: { "": ["b"] }, b: { x: ["c"] } } }, "x"], expect: true },
      { args: [{ start: "a", accept: ["c"], delta: { a: { "": ["b"] }, b: { "": ["c"] } } }, ""], expect: true },
    ] },
]);

LIB_CODE("dcd-phases", [
  { id: "cd-lexer", t: "Write a lexer", diff: "Medium", fn: "tokenize",
    statement: "<p>Write <code>tokenize(src)</code> returning an array of <code>[type, value]</code> pairs. Types: <code>'kw'</code> (let, const, if, else, while, return, function), <code>'id'</code> (letters, digits, _; not starting with a digit), <code>'num'</code> (digits with an optional fractional part like 3.5), <code>'str'</code> (double-quoted, no escapes; value without quotes), <code>'op'</code> (longest match of <code>== != &lt;= &gt;= &amp;&amp; || + - * / = &lt; &gt; !</code>) and <code>'punc'</code> (<code>( ) { } ; ,</code>). Skip whitespace and <code>//</code> comments to end of line. Throw <code>Error('Unexpected character X at N')</code> for anything else (N = index).</p>",
    examples: [{ in: "tokenize('let x = 3.5;')", out: "[['kw','let'],['id','x'],['op','='],['num','3.5'],['punc',';']]" }],
    hints: ["Loop with an index; at each position try patterns in order.", "Sticky regexes (/…/y with lastIndex) are perfect for lexers.", "Check two-character operators before one-character ones (longest match)."],
    starter: `function tokenize(src) {
  // your code here
}`,
    solution: `function tokenize(src) {
  const kws = ['let', 'const', 'if', 'else', 'while', 'return', 'function'];
  const rules = [
    ['ws', /\\s+|\\/\\/[^\\n]*/y], ['num', /\\d+(\\.\\d+)?/y], ['id', /[A-Za-z_]\\w*/y], ['str', /"[^"]*"/y],
    ['op', /==|!=|<=|>=|&&|\\|\\||[+\\-*/=<>!]/y], ['punc', /[(){};,]/y],
  ];
  const out = [];
  let i = 0;
  outer: while (i < src.length) {
    for (const [type, re] of rules) {
      re.lastIndex = i;
      const m = re.exec(src);
      if (m) {
        i = re.lastIndex;
        if (type === 'ws') continue outer;
        if (type === 'id') out.push([kws.includes(m[0]) ? 'kw' : 'id', m[0]]);
        else if (type === 'str') out.push(['str', m[0].slice(1, -1)]);
        else out.push([type, m[0]]);
        continue outer;
      }
    }
    throw new Error('Unexpected character ' + src[i] + ' at ' + i);
  }
  return out;
}`,
    tests: [
      { args: ["let x = 3.5;"], expect: [["kw", "let"], ["id", "x"], ["op", "="], ["num", "3.5"], ["punc", ";"]] },
      { args: ["if (a1 >= 10 && b) { return \"ok\"; } // done"], expect: [["kw", "if"], ["punc", "("], ["id", "a1"], ["op", ">="], ["num", "10"], ["op", "&&"], ["id", "b"], ["punc", ")"], ["punc", "{"], ["kw", "return"], ["str", "ok"], ["punc", ";"], ["punc", "}"]] },
      { args: ["letter=1"], expect: [["id", "letter"], ["op", "="], ["num", "1"]] },
      { label: "error", run: `(t) => { try { t('x = @'); return 'no error'; } catch (e) { return e.message; } }`, expect: "Unexpected character @ at 4" },
    ] },
]);

LIB_CODE("dcd-ll", [
  { id: "cd-eval", t: "Recursive-descent expression evaluator", diff: "Hard", fn: "evaluate",
    statement: "<p>Write <code>evaluate(expr)</code> for arithmetic with numbers (integers or decimals), <code>+ - * /</code>, unary minus, parentheses and spaces, using a recursive-descent parser for the grammar <code>expr → term (('+'|'-') term)*</code>, <code>term → factor (('*'|'/') factor)*</code>, <code>factor → '-' factor | number | '(' expr ')'</code>. Operators are left-associative. Throw <code>Error('Syntax error')</code> on invalid input (including leftover characters). Don't use eval or Function.</p>",
    examples: [{ in: "evaluate('2 + 3 * (4 - 1) / -3')", out: "-1" }],
    hints: ["Keep a position index; write peek() and next() helpers that skip spaces.", "One function per grammar rule: expr calls term, term calls factor, factor may call expr.", "After parsing expr at the top level, make sure you've reached the end."],
    starter: `function evaluate(expr) {
  // your code here
}`,
    solution: `function evaluate(expr) {
  let i = 0;
  const skip = () => { while (expr[i] === ' ') i++; };
  const peek = () => { skip(); return expr[i]; };
  function parseExpr() {
    let v = parseTerm();
    while (peek() === '+' || peek() === '-') { const op = expr[i++]; const r = parseTerm(); v = op === '+' ? v + r : v - r; }
    return v;
  }
  function parseTerm() {
    let v = parseFactor();
    while (peek() === '*' || peek() === '/') { const op = expr[i++]; const r = parseFactor(); v = op === '*' ? v * r : v / r; }
    return v;
  }
  function parseFactor() {
    const c = peek();
    if (c === '-') { i++; return -parseFactor(); }
    if (c === '(') { i++; const v = parseExpr(); if (peek() !== ')') throw new Error('Syntax error'); i++; return v; }
    const m = /^\\d+(\\.\\d+)?/.exec(expr.slice(i));
    if (!m) throw new Error('Syntax error');
    i += m[0].length;
    return parseFloat(m[0]);
  }
  const v = parseExpr();
  if (peek() !== undefined) throw new Error('Syntax error');
  return v;
}`,
    explain: "Precedence comes from the grammar's layering: term binds tighter because expr is built out of terms. The while loops give left associativity (8 − 3 − 2 = 3, not 7).",
    tests: [
      { args: ["2 + 3 * (4 - 1) / -3"], expect: -1 }, { args: ["8 - 3 - 2"], expect: 3 }, { args: ["2 * (3 + 4) * 5"], expect: 70 }, { args: ["-(-2.5)"], expect: 2.5 },
      { label: "syntax error", run: `(e) => { try { e('2 +'); return 'no error'; } catch (x) { return x.message; } }`, expect: "Syntax error" },
      { label: "leftover input", run: `(e) => { try { e('(1 + 2))'); return 'no error'; } catch (x) { return x.message; } }`, expect: "Syntax error" },
    ] },
]);
