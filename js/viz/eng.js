/* AI engineering and DevOps explainers: RAG pipeline, agent loop, CI/CD pipeline */
(function () {
  const { h, clear, button, row, caption, seg, stat, stepper, sequence } = window.VZ;
  const add = window.PNODE_VIZ.add;

  // ---------------------------------------------------------------- RAG pipeline
  add({
    id: "rag-pipeline",
    title: "RAG, step by step",
    blurb: "Pick a question and watch retrieval find the right chunks before the model answers.",
    nodes: ["dai-rag", "dai-embed"],
    mount(root, ctx) {
      const DOCS = [
        { id: "D1", text: "Hostel gates close at 10:30 pm. Late entry needs the warden's permission." },
        { id: "D2", text: "The laundry machine can be booked for one hour per student per day." },
        { id: "D3", text: "Mess timings: breakfast 7 to 9 am, lunch 12:30 to 2 pm, dinner 7:30 to 9:30 pm." },
        { id: "D4", text: "Guests may visit the common room between 4 pm and 7 pm on weekends." },
        { id: "D5", text: "Wi-Fi passwords change on the first day of every month at the office." },
      ];
      const QS = {
        gate: "What time do the hostel gates close?",
        dinner: "When is dinner served in the mess?",
        wifi: "When does the Wi-Fi password change?",
      };
      const STOP = new Set("the a an is at in on of to do does what when time be can and for per every by".split(" "));
      const words = (t) => t.toLowerCase().replace(/[^a-z0-9 ]/g, " ").split(/\s+/).filter((w) => w && !STOP.has(w));
      function score(q, d) {
        const qa = new Set(words(q)), da = new Set(words(d));
        let hit = 0; qa.forEach((w) => { if (da.has(w)) hit++; });
        return qa.size ? hit / qa.size : 0;
      }
      let qk = "gate", grounded = true;
      const stage = h("div", { class: "vstack" });
      const cap = caption();
      const FR = [
        { name: "1. Index your documents", say: "Before anyone asks anything, documents are split into small chunks and each chunk is turned into an embedding (a list of numbers that captures its meaning). They're stored in a vector database." },
        { name: "2. Embed the question", say: "The user's question is turned into an embedding with the same model, so questions and chunks live in the same 'meaning space'." },
        { name: "3. Score every chunk", say: "Each chunk gets a similarity score against the question. Real systems use cosine similarity on embeddings. This demo uses word overlap so you can see why each chunk scores what it does." },
        { name: "4. Keep the top 2", say: "Only the best matches go into the prompt. Fewer, better chunks beat dumping everything in: cheaper, faster and less confusing for the model." },
        { name: "5. Build the prompt", say: "The prompt says: answer only from these sources, cite them, and say 'I don't know' if they don't contain the answer." },
        { name: "6. Grounded answer", say: "" },
      ];
      function draw(i) {
        clear(stage);
        const q = QS[qk];
        const ranked = DOCS.map((d) => ({ ...d, s: score(q, d.text) })).sort((a, b) => b.s - a.s);
        const top = ranked.slice(0, 2);
        stage.appendChild(h("div", { class: "vchip" }, FR[i].name));
        if (i === 0) DOCS.forEach((d) => stage.appendChild(h("div", { class: "vitem" }, `${d.id} · ${d.text}`, h("div", { class: "muted small" }, "→ [0.12, −0.41, 0.88, …]"))));
        if (i === 1) stage.appendChild(h("div", { class: "vitem lit" }, `"${q}"`, h("div", { class: "muted small" }, "→ [0.10, −0.38, 0.91, …]")));
        if (i === 2 || i === 3) ranked.forEach((d) => {
          const keep = i === 3 && top.includes(d);
          stage.appendChild(h("div", { class: "vitem" + (keep ? " mint" : i === 3 ? "" : d.s > 0 ? " lit" : ""), style: i === 3 && !keep ? "opacity:.4" : "" },
            h("div", { style: "display:flex;justify-content:space-between;gap:8px" }, h("span", null, d.id), h("b", null, d.s.toFixed(2))),
            h("div", { style: `height:6px;border-radius:6px;background:var(--lit);width:${Math.max(3, d.s * 100)}%;margin:4px 0` }),
            h("span", { class: "muted small" }, d.text)));
        });
        if (i === 4) stage.appendChild(h("pre", { class: "vcode", style: "padding:10px;white-space:pre-wrap" },
          `System: Answer ONLY from the sources. Cite like [D1].\nIf the sources don't say, reply "I don't know."\n\n${top.map((d) => `[${d.id}] ${d.text}`).join("\n")}\n\nUser: ${q}`));
        if (i === 5) {
          const best = top[0];
          const ans = {
            gate: "The hostel gates close at 10:30 pm. Late entry needs the warden's permission. [D1]",
            dinner: "Dinner is served from 7:30 to 9:30 pm. [D3]",
            wifi: "The Wi-Fi password changes on the first day of every month. [D5]",
          }[qk];
          stage.appendChild(h("div", { class: "vitem " + (grounded ? "mint" : "bad") }, grounded ? ans : "Most hostels close their gates around 11 pm, so probably 11.", h("div", { class: "muted small" }, grounded ? `Grounded in ${best.id}. You can check the source.` : "No sources were given. A confident, plausible and wrong answer: a hallucination.")));
          cap.textContent = grounded ? "The answer is short, correct and cites its source. That's why RAG is the most common pattern in real AI products: it lets a model answer about data it was never trained on." : "Same model, no retrieval. It doesn't know your hostel's rules, so it guesses. Turn retrieval back on to compare.";
          return;
        }
        cap.textContent = FR[i].say;
      }
      const st = stepper(ctx, { count: FR.length, speed: 2600, render: draw });
      const qs = seg(Object.keys(QS).map((k) => ({ v: k, label: { gate: "Gate time", dinner: "Dinner", wifi: "Wi-Fi" }[k] })), qk, (v) => { qk = v; st.go(st.index); }, "Question");
      const gs = seg([{ v: "on", label: "With retrieval" }, { v: "off", label: "No retrieval" }], "on", (v) => { grounded = v === "on"; st.go(5); }, "Retrieval");
      root.append(row(qs.el, gs.el), stage, cap, st.el);
      st.go(0);
    },
  });

  // ---------------------------------------------------------------- agent loop
  add({
    id: "agent-loop",
    title: "The agent loop",
    blurb: "How an LLM uses tools: it asks, your code runs the tool, the result goes back in.",
    nodes: ["dai-tools"],
    mount(root, ctx) {
      const host = h("div");
      root.append(host);
      sequence(ctx, host, {
        actors: ["User", "Your app", "LLM", "Tool"],
        speed: 2100,
        steps: [
          { from: 0, to: 1, label: "\"Is it raining in Mangaluru?\"", say: "The user asks something the model can't know from training: live weather." },
          { from: 1, to: 2, label: "messages + tool list", say: "Your app sends the conversation plus a list of tools, each with a name, a description and a JSON schema for its arguments." },
          { from: 2, to: 1, label: "tool_call: get_weather({city})", say: "The model doesn't run anything. It replies with a request: 'please call get_weather with city = Mangaluru'.", tone: "lit" },
          { from: 1, to: 3, label: "validate → call API", say: "YOUR code checks the arguments, checks permissions, and calls the real weather API. This is where you stay in control.", tone: "mint" },
          { from: 3, to: 1, label: "{rain: true, temp: 27}", say: "The tool returns plain data." },
          { from: 1, to: 2, label: "tool_result", say: "Your app appends the result to the conversation and calls the model again." },
          { from: 2, to: 1, label: "final answer", say: "Now the model has the facts and writes the answer. If it needed more, it would request another tool. That repeat-until-done cycle is an agent.", tone: "lit" },
          { from: 1, to: 0, label: "\"Yes, 27 °C and raining.\"", say: "Always cap the loop (for example 8 steps) and log every tool call, so a confused agent can't loop forever or burn money." },
        ],
      });
    },
  });

  // ---------------------------------------------------------------- CI/CD pipeline
  add({
    id: "cicd-pipeline",
    title: "A CI/CD pipeline",
    blurb: "Push code and watch it flow to production, or get stopped.",
    nodes: ["ddo-ci", "ddo-deploy"],
    mount(root, ctx) {
      const STAGES = [
        ["git push", "A commit lands on main (or a pull request opens)."],
        ["Lint + type-check", "Fast checks first. Fail in 30 seconds, not 10 minutes."],
        ["Unit tests", "Hundreds of small tests run in parallel."],
        ["Build image", "docker build, tagged with the commit SHA, pushed to a registry."],
        ["Deploy staging", "The same image goes to a staging environment."],
        ["Smoke tests", "A few real requests: health check, log in, load the home page."],
        ["Deploy prod", "The same tested image is promoted to production, gradually."],
        ["Monitor", "Watch error rate and latency. If they spike, roll back automatically."],
      ];
      let mode = "ok";
      const list = h("div", { class: "vstack" });
      const stats = h("div", { class: "vstats" });
      const cap = caption();
      const failAt = () => (mode === "test" ? 2 : mode === "deploy" ? 7 : -1);
      function draw(i) {
        clear(list);
        const f = failAt();
        STAGES.forEach(([name, what], j) => {
          let cls = "", tag = "waiting";
          if (f >= 0 && i >= f) {
            if (j < f) { cls = "mint"; tag = "passed"; }
            else if (j === f) { cls = "bad"; tag = mode === "deploy" ? "errors 9% → ROLLBACK" : "FAILED"; }
            else tag = "skipped";
          } else if (j < i) { cls = "mint"; tag = "passed"; }
          else if (j === i) { cls = i === STAGES.length - 1 ? "mint" : "lit"; tag = i === STAGES.length - 1 ? "healthy" : "running"; }
          list.appendChild(h("div", { class: "vitem " + cls, style: "display:flex;justify-content:space-between;gap:8px" + (tag === "skipped" ? ";opacity:.4" : "") }, h("span", null, name), h("span", { class: "muted" }, tag)));
        });
        const cur = Math.min(i, STAGES.length - 1);
        if (f >= 0 && i >= f) {
          cap.textContent = mode === "test"
            ? "A unit test failed, so the pipeline stopped. Nothing after it ran and production was never touched. That's the whole point of CI: a broken change can't reach users."
            : "Production looked fine during deploy, but monitoring saw errors climb. The pipeline rolled back to the previous image automatically. Users saw a blip, not an outage.";
        } else cap.textContent = STAGES[cur][1];
        clear(stats).append(stat("stage", `${cur + 1}/${STAGES.length}`), stat("result", f >= 0 && i >= f ? (mode === "test" ? "blocked" : "rolled back") : i >= STAGES.length - 1 ? "shipped" : "in progress", f >= 0 && i >= f ? "bad" : i >= STAGES.length - 1 ? "good" : ""));
      }
      const st = stepper(ctx, { count: () => (failAt() >= 0 ? failAt() + 1 : STAGES.length), speed: 1300, render: draw });
      const sg = seg([{ v: "ok", label: "Good change" }, { v: "test", label: "Break a test" }, { v: "deploy", label: "Bad deploy" }], mode, (v) => { mode = v; st.go(0); }, "Scenario");
      root.append(sg.el, list, stats, cap, st.el);
      st.go(0);
    },
  });
})();
