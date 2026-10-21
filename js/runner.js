/* Pnode code runner: runs a learner's JavaScript against tests inside a throwaway Web Worker.
   Works offline and on file:// because the worker is created from a Blob. */
(function () {
  const WORKER_SRC = `
    const clone = (v) => { try { return structuredClone(v); } catch (e) { return v; } };
    function eq(a, b) {
      if (Object.is(a, b)) return true;
      if (typeof a !== typeof b || a === null || b === null || typeof a !== "object") return false;
      if (Array.isArray(a) !== Array.isArray(b)) return false;
      if (a instanceof Map || a instanceof Set) { a = [...a]; b = b instanceof Map || b instanceof Set ? [...b] : b; }
      const ka = Object.keys(a), kb = Object.keys(b);
      if (ka.length !== kb.length) return false;
      return ka.every((k) => eq(a[k], b[k]));
    }
    function show(v) {
      if (v === undefined) return "undefined";
      if (typeof v === "function") return "[Function]";
      if (typeof v === "number" && !isFinite(v)) return String(v);
      if (v instanceof Map) return "Map(" + JSON.stringify([...v]) + ")";
      if (v instanceof Set) return "Set(" + JSON.stringify([...v]) + ")";
      try { return JSON.stringify(v, (k, x) => (typeof x === "number" && !isFinite(x) ? String(x) : x === undefined ? "undefined" : x)); } catch (e) { return String(v); }
    }
    self.onmessage = async (e) => {
      const { code, fn, tests } = e.data;
      const logs = [];
      const fmt = (args) => args.map((x) => (typeof x === "string" ? x : show(x))).join(" ");
      self.console = { log: (...a) => logs.push(fmt(a)), error: (...a) => logs.push("error: " + fmt(a)), warn: (...a) => logs.push("warn: " + fmt(a)), info: (...a) => logs.push(fmt(a)) };
      let target;
      try {
        target = new Function(code + "\\n;return (typeof " + fn + " !== 'undefined') ? " + fn + " : undefined;")();
      } catch (err) {
        self.postMessage({ compileError: String(err && err.message || err), logs }); return;
      }
      if (target === undefined) { self.postMessage({ compileError: "Couldn't find " + fn + ". Keep the function/class name from the starter code.", logs }); return; }
      const results = [];
      for (const t of tests) {
        const r = { label: t.label || "", expect: show(t.expect) };
        try {
          let got;
          if (t.run) got = await (new Function("return " + t.run)())(target, console);
          else got = await target(...clone(t.args || []));
          r.got = show(got);
          r.pass = eq(got, t.expect);
          if (t.args) r.input = (t.args || []).map(show).join(", ");
        } catch (err) { r.pass = false; r.error = String(err && err.message || err); }
        results.push(r);
      }
      self.postMessage({ results, logs: logs.slice(0, 200) });
    };
  `;
  let url = null;
  function workerUrl() { if (!url) url = URL.createObjectURL(new Blob([WORKER_SRC], { type: "text/javascript" })); return url; }

  function run(code, problem, timeoutMs) {
    return new Promise((resolve) => {
      const w = new Worker(workerUrl());
      const timer = setTimeout(() => { w.terminate(); resolve({ timeout: true, results: [], logs: [] }); }, timeoutMs || 5000);
      w.onmessage = (e) => { clearTimeout(timer); w.terminate(); resolve(e.data); };
      w.onerror = (e) => { clearTimeout(timer); w.terminate(); resolve({ compileError: e.message || "Error", results: [], logs: [] }); e.preventDefault(); };
      w.postMessage({ code, fn: problem.fn, tests: problem.tests });
    });
  }

  // Small editor helpers for a <textarea>: Tab indents, Enter keeps indentation, Ctrl/Cmd+Enter runs.
  function enhance(ta, onRun) {
    ta.addEventListener("keydown", (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "Enter") { e.preventDefault(); onRun(); return; }
      const s = ta.selectionStart, end = ta.selectionEnd, v = ta.value;
      if (e.key === "Tab") {
        e.preventDefault();
        if (e.shiftKey) {
          const ls = v.lastIndexOf("\n", s - 1) + 1;
          if (v.slice(ls, ls + 2) === "  ") { ta.value = v.slice(0, ls) + v.slice(ls + 2); ta.selectionStart = ta.selectionEnd = Math.max(ls, s - 2); }
        } else { ta.value = v.slice(0, s) + "  " + v.slice(end); ta.selectionStart = ta.selectionEnd = s + 2; }
        ta.dispatchEvent(new Event("input"));
      } else if (e.key === "Enter") {
        const ls = v.lastIndexOf("\n", s - 1) + 1;
        const indent = (v.slice(ls, s).match(/^\s*/) || [""])[0] + (/[{[(]\s*$/.test(v.slice(ls, s)) ? "  " : "");
        e.preventDefault();
        ta.value = v.slice(0, s) + "\n" + indent + v.slice(end);
        ta.selectionStart = ta.selectionEnd = s + 1 + indent.length;
        ta.dispatchEvent(new Event("input"));
      }
    });
  }

  window.PnodeRunner = { run, enhance };
})();
