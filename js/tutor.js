/* Pnode Tutor: an offline AI tutor that talks to Ollama running on this computer.
   Nothing leaves the laptop: the browser calls http://localhost:11434 directly. */
(function () {
  const KEY = "pnode:tutor";
  const DEFAULTS = { endpoint: "http://localhost:11434", model: "", name: "Nova", history: [], mode: "teach" };

  const MODES = {
    teach: { label: "Teach me", hint: "Explain a concept from zero", rule: "Teach step by step in simple English. Start with an everyday analogy, then the real explanation, then a tiny example. End with one short question to check understanding." },
    code: { label: "Explain code", hint: "Paste code to understand it", rule: "Explain the code the student pastes line by line in simple English. Point out bugs, edge cases and how a senior engineer would improve it." },
    write: { label: "Write code", hint: "Get working code with reasons", rule: "Write clean, modern TypeScript/JavaScript (or the language asked). Explain the key decisions briefly. Prefer small, readable functions." },
    hint: { label: "Hints only", hint: "Stuck on a build? Nudges, no answers", rule: "The student is working on their own build. Never give the full solution. Ask a guiding question and give the smallest useful hint. Escalate only if they ask again." },
    quiz: { label: "Quiz me", hint: "Rapid questions on any topic", rule: "Ask one interview-style question at a time. Wait for the answer. Then grade it honestly (what was right, what was missing) and ask the next, slightly harder question." },
    interview: { label: "Mock interview", hint: "A strict but fair interviewer", rule: "Act as a senior engineer interviewing for an SDE-1 full-stack role in India. Ask one question at a time, follow up on weak answers, and at the end give a hire/no-hire with specific reasons." },
  };

  function load() {
    try { return Object.assign({}, DEFAULTS, JSON.parse(localStorage.getItem(KEY) || "{}")); } catch (e) { return Object.assign({}, DEFAULTS); }
  }
  function save(s) {
    try { s.history = s.history.slice(-60); localStorage.setItem(KEY, JSON.stringify(s)); } catch (e) { /* storage unavailable */ }
  }

  const esc = (s) => String(s == null ? "" : s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

  // Small, safe markdown: escape everything first, then add code blocks, inline code, bold, headings and lists.
  function md(text) {
    let thinking = "";
    text = text.replace(/<think>([\s\S]*?)(<\/think>|$)/g, (m, t) => { thinking += t; return ""; });
    const blocks = [];
    let s = esc(text).replace(/```(\w*)\n?([\s\S]*?)(```|$)/g, (m, lang, code) => {
      blocks.push(`<div class="tt-code"><div class="tt-code-bar"><span>${lang || "code"}</span><button type="button" class="tt-copy">Copy</button></div><pre><code>${code.replace(/\n$/, "")}</code></pre></div>`);
      return `\u0000${blocks.length - 1}\u0000`;
    });
    s = s.replace(/`([^`\n]+)`/g, "<code>$1</code>")
      .replace(/\*\*([^*\n]+)\*\*/g, "<b>$1</b>")
      .replace(/^#{1,4} (.+)$/gm, "<h4>$1</h4>");
    const out = [];
    let list = null;
    s.split("\n").forEach((line) => {
      const li = line.match(/^\s*(?:[-*]|\d+\.) (.+)/);
      if (li) { if (!list) { list = []; } list.push(`<li>${li[1]}</li>`); return; }
      if (list) { out.push(`<ul>${list.join("")}</ul>`); list = null; }
      if (/^\u0000\d+\u0000$/.test(line.trim()) || /^<h4>/.test(line)) out.push(line);
      else if (line.trim()) out.push(`<p>${line}</p>`);
    });
    if (list) out.push(`<ul>${list.join("")}</ul>`);
    let html = out.join("").replace(/\u0000(\d+)\u0000/g, (m, i) => blocks[+i]);
    if (thinking.trim()) html = `<details class="tt-think"><summary>Thinking</summary><p>${esc(thinking.trim())}</p></details>` + html;
    return html;
  }

  function systemPrompt(s, ctx) {
    const mode = MODES[s.mode] || MODES.teach;
    return [
      `You are ${s.name}, a personal computer-science and full-stack tutor inside Pnode, a learning app. Your student is Pank, an MCA student in India preparing for full-stack (TypeScript, React, Next.js, Node, MongoDB, PostgreSQL) interviews by August 2027.`,
      "Style: warm, encouraging and direct, like a brilliant friend who is also a senior engineer. Simple English, short paragraphs, real-world examples. Be honest when an answer is wrong. Never make up facts; say when you're not sure.",
      "You are a tutor and study companion only: keep things friendly and professional, with no romance or flirting. If he seems stressed or down, be kind, suggest a short break, and encourage talking to people he trusts.",
      `Current mode: ${mode.label}. ${mode.rule}`,
      ctx.profile ? `His progress right now: ${ctx.profile}` : "",
      ctx.context ? `He is studying this lesson. Use it as context:\nTITLE: ${ctx.context.title}\n${ctx.context.text}` : "",
    ].filter(Boolean).join("\n\n");
  }

  function mount(root, ctx) {
    const s = load();
    let controller = null;
    let models = [];

    root.innerHTML = `
      <div class="page-head tt-head">
        <div class="tt-avatar" aria-hidden="true"><span></span><span></span><span></span></div>
        <div>
          <h1><span id="tt-name">${esc(s.name)}</span>, your offline tutor</h1>
          <p class="muted">Runs on your laptop with Ollama. No internet, no account, nothing leaves your computer.</p>
        </div>
        <span class="tt-status" id="tt-status">Checking…</span>
      </div>
      <div class="tt-setup" id="tt-setup" hidden></div>
      <div class="tt-bar">
        <label class="visually-hidden" for="tt-model">Model</label>
        <select id="tt-model" class="tt-select"></select>
        <div class="tt-modes" role="radiogroup" aria-label="Tutor mode">
          ${Object.entries(MODES).map(([k, m]) => `<button type="button" class="chip ${s.mode === k ? "on" : ""}" role="radio" aria-checked="${s.mode === k}" data-mode="${k}" title="${esc(m.hint)}">${esc(m.label)}</button>`).join("")}
        </div>
      </div>
      ${ctx.context ? `<div class="tt-context">Studying: <b>${esc(ctx.context.title)}</b> <span class="muted small">— the tutor can see this lesson</span></div>` : ""}
      <div class="tt-log" id="tt-log" aria-live="polite"></div>
      <form class="tt-form" id="tt-form">
        <label class="visually-hidden" for="tt-input">Message</label>
        <textarea id="tt-input" rows="2" placeholder="Ask anything: explain closures, review my code, quiz me on TCP…"></textarea>
        <div class="tt-actions">
          <button type="button" class="btn" id="tt-clear">New chat</button>
          <button type="button" class="btn" id="tt-stop" hidden>Stop</button>
          <button type="submit" class="btn btn-lit" id="tt-send">Send</button>
        </div>
      </form>
      <details class="panel tt-settings">
        <summary>Tutor settings</summary>
        <div class="tt-grid">
          <label>Tutor's name <input id="tt-set-name" value="${esc(s.name)}" maxlength="24"></label>
          <label>Ollama address <input id="tt-set-ep" value="${esc(s.endpoint)}"></label>
        </div>
        <button type="button" class="btn" id="tt-save">Save settings</button>
      </details>`;

    const $ = (sel) => root.querySelector(sel);
    const log = $("#tt-log"), input = $("#tt-input"), status = $("#tt-status"), modelSel = $("#tt-model");

    function renderLog() {
      if (!s.history.length) {
        const starters = ctx.context
          ? [`Explain "${ctx.context.title}" like I'm new to it`, "Quiz me on this lesson", "Give me a real interview question on this"]
          : ["Explain the JavaScript event loop simply", "What should I study tonight?", "Quiz me on HTTP and REST", "Review this code: (paste it)"];
        log.innerHTML = `<div class="tt-empty"><p>Hi Pank, I'm ${esc(s.name)}. What are we learning today?</p><div class="tt-starters">${starters.map((t) => `<button type="button" class="chip" data-starter="${esc(t)}">${esc(t)}</button>`).join("")}</div></div>`;
        return;
      }
      log.innerHTML = s.history.map((m) => `<div class="tt-msg ${m.role}"><div class="tt-bubble">${m.role === "user" ? `<p>${esc(m.content).replace(/\n/g, "<br>")}</p>` : md(m.content)}</div></div>`).join("");
      log.scrollTop = log.scrollHeight;
    }

    function setupHtml(reason) {
      const origin = location.origin === "null" || location.protocol === "file:" ? "*" : location.origin;
      return `<h2>Set up your offline tutor (one time, about 15 minutes)</h2>
        <p class="muted">${esc(reason)}</p>
        <ol>
          <li><b>Install Ollama</b> from <a href="https://ollama.com/download" target="_blank" rel="noopener">ollama.com/download</a> (Windows, Linux or Mac). Use hostel Wi-Fi or a hotspot once; after that everything is offline.</li>
          <li><b>Download a model</b> in a terminal. Pick by your laptop's RAM:
            <ul>
              <li>8 GB RAM: <code>ollama pull qwen2.5-coder:7b</code> (about 4.7 GB)</li>
              <li>16 GB RAM: <code>ollama pull qwen2.5-coder:14b</code> (about 9 GB)</li>
              <li>Also good for general questions: <code>ollama pull gemma3:4b</code></li>
            </ul></li>
          <li><b>Allow Pnode to talk to it.</b> Ollama blocks web pages by default. Set <code>OLLAMA_ORIGINS</code> to <code>${esc(origin)}</code>:
            <ul>
              <li>Windows: Settings → search "environment variables" → New user variable → name <code>OLLAMA_ORIGINS</code>, value <code>${esc(origin)}</code>. Quit Ollama from the tray and open it again.</li>
              <li>Linux: <code>sudo systemctl edit ollama</code>, add <code>[Service]</code> and <code>Environment="OLLAMA_ORIGINS=${esc(origin)}"</code>, then <code>sudo systemctl restart ollama</code>.</li>
            </ul></li>
          <li>Come back here and press <button type="button" class="btn" data-retry>Check again</button></li>
        </ol>
        <p class="small muted">Model names change often; browse <a href="https://ollama.com/library" target="_blank" rel="noopener">ollama.com/library</a> for newer coding models that fit your RAM.</p>`;
    }

    async function connect() {
      status.textContent = "Checking…"; status.className = "tt-status";
      try {
        const r = await fetch(s.endpoint.replace(/\/$/, "") + "/api/tags");
        if (!r.ok) throw new Error("bad status " + r.status);
        const j = await r.json();
        models = (j.models || []).map((m) => m.name);
        if (!models.length) {
          status.textContent = "No models yet"; status.classList.add("warn");
          $("#tt-setup").hidden = false; $("#tt-setup").innerHTML = setupHtml("Ollama is running, but no model is downloaded yet. Do step 2.");
          return;
        }
        if (!models.includes(s.model)) s.model = models.find((m) => /coder|qwen/i.test(m)) || models[0];
        modelSel.innerHTML = models.map((m) => `<option ${m === s.model ? "selected" : ""}>${esc(m)}</option>`).join("");
        status.textContent = "Online · offline AI"; status.classList.add("ok");
        $("#tt-setup").hidden = true;
        save(s);
      } catch (e) {
        status.textContent = "Not connected"; status.classList.add("warn");
        modelSel.innerHTML = `<option>No model</option>`;
        $("#tt-setup").hidden = false;
        $("#tt-setup").innerHTML = setupHtml("Pnode couldn't reach Ollama at " + s.endpoint + ". Either it isn't installed or running, or it needs permission to talk to this page.");
      }
    }

    async function send(text) {
      if (!text.trim() || controller) return;
      if (!models.length) { ctx.toast("Set up Ollama first (steps above)."); return; }
      s.history.push({ role: "user", content: text.trim() });
      const reply = { role: "assistant", content: "" };
      s.history.push(reply);
      renderLog();
      const bubble = log.lastElementChild.querySelector(".tt-bubble");
      bubble.innerHTML = `<span class="tt-typing"><i></i><i></i><i></i></span>`;
      input.value = "";
      controller = new AbortController();
      $("#tt-stop").hidden = false; $("#tt-send").disabled = true;
      try {
        const messages = [{ role: "system", content: systemPrompt(s, ctx) }].concat(s.history.slice(-20, -1).map((m) => ({ role: m.role, content: m.content })));
        const r = await fetch(s.endpoint.replace(/\/$/, "") + "/api/chat", {
          method: "POST", signal: controller.signal, headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ model: s.model, messages, stream: true, options: { num_ctx: 8192 } }),
        });
        if (!r.ok || !r.body) throw new Error("Ollama returned " + r.status);
        const reader = r.body.getReader(), dec = new TextDecoder();
        let buf = "", last = 0;
        for (;;) {
          const { done, value } = await reader.read();
          if (done) break;
          buf += dec.decode(value, { stream: true });
          const lines = buf.split("\n"); buf = lines.pop();
          for (const line of lines) {
            if (!line.trim()) continue;
            const j = JSON.parse(line);
            if (j.error) throw new Error(j.error);
            if (j.message && j.message.content) reply.content += j.message.content;
          }
          if (Date.now() - last > 60) { bubble.innerHTML = md(reply.content) || `<span class="tt-typing"><i></i><i></i><i></i></span>`; log.scrollTop = log.scrollHeight; last = Date.now(); }
        }
      } catch (e) {
        if (e.name !== "AbortError") reply.content += (reply.content ? "\n\n" : "") + "_(Couldn't finish: " + e.message + ". Is Ollama still running?)_";
      }
      controller = null;
      if (!reply.content) reply.content = "(stopped)";
      $("#tt-stop").hidden = true; $("#tt-send").disabled = false;
      bubble.innerHTML = md(reply.content);
      log.scrollTop = log.scrollHeight;
      save(s);
      if (ctx.onAnswer) ctx.onAnswer();
    }

    root.addEventListener("click", (e) => {
      const t = e.target;
      if (t.closest("[data-mode]")) {
        s.mode = t.closest("[data-mode]").dataset.mode; save(s);
        root.querySelectorAll("[data-mode]").forEach((b) => { const on = b.dataset.mode === s.mode; b.classList.toggle("on", on); b.setAttribute("aria-checked", on); });
        ctx.toast(MODES[s.mode].hint);
      }
      if (t.closest("[data-starter]")) { const v = t.closest("[data-starter]").dataset.starter; if (/\(paste it\)/.test(v)) { input.value = "Review this code:\n"; input.focus(); } else send(v); }
      if (t.closest("[data-retry]")) connect();
      if (t.closest(".tt-copy")) {
        const code = t.closest(".tt-code").querySelector("code").textContent;
        (navigator.clipboard ? navigator.clipboard.writeText(code) : Promise.reject()).then(() => ctx.toast("Code copied"), () => ctx.toast("Couldn't copy"));
      }
    });
    $("#tt-form").addEventListener("submit", (e) => { e.preventDefault(); send(input.value); });
    input.addEventListener("keydown", (e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(input.value); } });
    $("#tt-stop").addEventListener("click", () => controller && controller.abort());
    $("#tt-clear").addEventListener("click", () => { if (controller) controller.abort(); s.history = []; save(s); renderLog(); });
    modelSel.addEventListener("change", () => { s.model = modelSel.value; save(s); });
    $("#tt-save").addEventListener("click", () => {
      s.name = $("#tt-set-name").value.trim() || "Nova";
      s.endpoint = $("#tt-set-ep").value.trim() || DEFAULTS.endpoint;
      save(s); $("#tt-name").textContent = s.name; renderLog(); connect(); ctx.toast("Tutor settings saved");
    });

    renderLog();
    connect();
    if (ctx.prefill) { input.value = ctx.prefill; }
    return () => { if (controller) controller.abort(); };
  }

  window.PnodeTutor = { mount, MODES, md };
})();
