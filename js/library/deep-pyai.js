LIB_ADD({
  id: "deep-pyai", title: "The Python AI stack", group: "Engineering and AI", order: 5, glyph: "PY",
  blurb: "The tools AI job posts actually list: Python for AI work, NumPy and pandas, scikit-learn and ML metrics, deep learning and Hugging Face, LangChain, LangGraph and multi-agent systems, vector stores (FAISS, Chroma, pgvector), Whisper and speech pipelines, FastAPI serving, MCP servers, LLM observability and fine-tuning. Every lesson ends with something you build in Python on your laptop.",
  intro: "AI hiring in India mostly asks for Python: LangChain, LangGraph, FAISS or Chroma, Hugging Face, FastAPI and a bit of classic ML. 'AI engineering, hands-on' taught you the ideas in JavaScript. This subject maps them onto the Python tools, so your resume can list them honestly. Pnode can't run Python in the browser, so each lesson has a 'Build it' task: do it in VS Code or Jupyter, push it to GitHub, then tick the lesson. Your edge over a typical AI-only candidate: you can also build the frontend, the API and deploy it.",
  modules: [
    { title: "1. Python and data foundations", lessons: [
      { id: "dpy-env", t: "Python for AI engineers: environments, typing, async, FastAPI", mins: 35,
        body: [
          "<b>Environments</b>: every project gets its own virtual environment so package versions don't clash. <code>python -m venv .venv</code> then <code>source .venv/bin/activate</code>, or the faster <b>uv</b> tool (<code>uv init</code>, <code>uv add fastapi</code>). Pin versions in <code>pyproject.toml</code> or <code>requirements.txt</code>.",
          "<b>Type hints + Pydantic</b>: <code>def score(text: str) -&gt; float</code>. Pydantic models validate data at runtime, the way Zod does in TypeScript. LLM structured output, FastAPI request bodies and LangChain tools all use them.",
          "<b>async/await</b>: like JavaScript. LLM and HTTP calls are slow I/O, so <code>asyncio.gather()</code> runs several at once instead of one after another.",
          "<b>Notebooks vs scripts</b>: Jupyter is great for exploring data and trying prompts. Production code lives in <code>.py</code> modules with tests. A common junior mistake is shipping a notebook.",
          "<b>FastAPI</b> is the standard way to serve AI in Python: type-hinted routes, automatic validation, async support and auto-generated docs at <code>/docs</code>.",
          "<pre>from fastapi import FastAPI\nfrom pydantic import BaseModel\n\napp = FastAPI()\n\nclass Ask(BaseModel):\n    question: str\n    top_k: int = 4\n\n@app.post('/ask')\nasync def ask(body: Ask):\n    chunks = await retrieve(body.question, body.top_k)\n    return {'answer': await generate(body.question, chunks)}</pre>",
        ],
        keys: ["One virtual environment per project; pin versions.", "Pydantic = runtime validation from type hints.", "asyncio.gather for parallel LLM calls.", "Explore in notebooks, ship modules, serve with FastAPI."],
        ex: "Your RAG backend in FastAPI: POST /ask validates the body with Pydantic, retrieves chunks and streams an answer. Docs appear at /docs automatically.",
        fact: "FastAPI is built on Starlette for the web layer and Pydantic for data validation, which is why it's both fast and strict about types.",
        quiz: [
          { q: "What plays the role of Zod in Python AI code?", o: ["NumPy", "Pydantic", "Jupyter", "pip"], a: 1, why: "Pydantic validates data against typed models at runtime." },
          { q: "You need 10 independent LLM calls. Fastest approach?", o: ["A for loop with await", "asyncio.gather", "time.sleep between calls", "Threads per character"], a: 1, why: "gather runs the waits at the same time." },
        ],
        project: { t: "Build it: a typed FastAPI service", brief: "Set up a clean Python AI project you'll reuse for every lesson in this subject.", steps: ["Create the project with uv (or venv) and a pyproject.toml.", "Add FastAPI, a Pydantic model and one POST route that calls an LLM (or Ollama locally).", "Add pytest with one test using FastAPI's TestClient.", "Push to GitHub as pank-ai-lab with a README."], stretch: ["Add ruff for linting and a GitHub Actions workflow that runs pytest."] } },

      { id: "dpy-data", t: "NumPy and pandas: the data toolkit", mins: 35,
        body: [
          "<b>NumPy</b> arrays are fast, fixed-type grids of numbers. Operations work on whole arrays at once (<b>vectorisation</b>): <code>a * 2</code> doubles every element without a Python loop. Embeddings are NumPy arrays; cosine similarity is <code>a @ b / (norm(a) * norm(b))</code>.",
          "<b>Broadcasting</b>: compare one query vector with a matrix of 10,000 document vectors in one line: <code>docs @ q</code> gives all 10,000 dot products.",
          "<b>pandas</b> DataFrames are tables in memory. Daily moves: <code>read_csv</code>, <code>head</code>, <code>info</code>, <code>describe</code>, filtering with <code>df[df.score &gt; 0.8]</code>, <code>groupby().agg()</code>, <code>merge</code> (a SQL join), handling missing values with <code>isna</code>/<code>fillna</code>.",
          "In AI work you'll use pandas to clean training or eval data, analyse logs of model calls (cost per day, failure rate per prompt version) and prepare documents for RAG.",
          "If you know SQL, pandas is mostly the same ideas: filter = WHERE, groupby = GROUP BY, merge = JOIN.",
        ],
        keys: ["Vectorise: whole-array operations, no Python loops.", "docs @ q scores every document at once.", "pandas = SQL ideas on in-memory tables.", "Use pandas for eval data and LLM cost logs."],
        ex: "You export 5,000 chatbot logs to CSV. Three pandas lines show that 70% of the cost comes from one prompt version that also fails most often.",
        fact: "pandas was started by Wes McKinney in 2008 while he worked at a hedge fund, to make financial data analysis in Python practical.",
        quiz: [
          { q: "Scoring a query against 10,000 embeddings in NumPy is best done with…", o: ["A Python for loop", "One matrix–vector product", "pandas.merge", "Sorting first"], a: 1, why: "Vectorised maths runs in optimised C, far faster than a loop." },
          { q: "pandas merge is most like which SQL operation?", o: ["WHERE", "JOIN", "ORDER BY", "INSERT"], a: 1, why: "It combines two tables on matching keys." },
        ],
        project: { t: "Build it: LLM cost analyser", brief: "Practise pandas on data that matters to an AI engineer.", steps: ["Generate or log 500 fake LLM calls: timestamp, prompt_version, input_tokens, output_tokens, latency_ms, success.", "Compute cost per call, then cost and failure rate per prompt version and per day.", "Plot cost per day with Matplotlib.", "Write three findings in the README, like a short report."] } },

      { id: "dpy-ml", t: "Classic ML with scikit-learn, and the metrics interviewers ask about", mins: 40,
        body: [
          "Not every AI problem needs an LLM. Spam detection, churn prediction or ticket routing are often faster, cheaper and more accurate with classic models.",
          "The workflow: split data into <b>train</b> and <b>test</b> sets (never test on training data) → build features → fit a model → evaluate on the test set. scikit-learn makes it uniform: <code>model.fit(X_train, y_train)</code>, <code>model.predict(X_test)</code>. Wrap preprocessing and model in a <code>Pipeline</code> so the same steps run in training and production.",
          "<b>Overfitting</b>: great on training data, poor on new data, because the model memorised instead of learning. Fixes: more data, simpler models, regularisation, cross-validation.",
          "<b>Metrics</b>: accuracy misleads when classes are imbalanced (99% 'not fraud' gets 99% accuracy by always saying 'not fraud'). <b>Precision</b> = of everything flagged, how much was right: TP/(TP+FP). <b>Recall</b> = of all real positives, how many were caught: TP/(TP+FN). <b>F1</b> is their harmonic mean.",
          "Which matters depends on cost: a cancer screen wants high recall (don't miss cases); a spam filter wants high precision (don't bin real email).",
        ],
        keys: ["Classic ML is often the right tool.", "Train/test split; Pipelines for consistency.", "Overfitting = memorising.", "Precision = TP/(TP+FP), recall = TP/(TP+FN), F1 balances them."],
        ex: "A college helpdesk routes 2,000 tickets a day to Hostel, Fees or Exams. A TF-IDF + logistic regression model does it in milliseconds for free, and an LLM handles only the unclear ones.",
        fact: "scikit-learn began as a Google Summer of Code project in 2007 and became the most widely used classic ML library in Python.",
        quiz: [
          { q: "A fraud model flags 100 transactions; 20 are really fraud. Precision is…", o: ["20%", "80%", "100%", "Can't tell"], a: 0, why: "TP/(TP+FP) = 20/100." },
          { q: "For a disease screening test, which metric matters most?", o: ["Precision", "Recall", "Training accuracy", "Latency"], a: 1, why: "Missing a real case is the costly error." },
          { q: "Training accuracy 99%, test accuracy 62%. This is…", o: ["Underfitting", "Overfitting", "Perfect", "A data leak fixed"], a: 1, why: "It memorised the training data." },
        ],
        wp: [{ q: "Confusion matrix: TP = 40, FP = 10, FN = 20, TN = 930. Compute precision, recall and F1.", s: ["Precision = 40/(40+10) = 0.8.", "Recall = 40/(40+20) ≈ 0.667.", "F1 = 2PR/(P+R) = 2×0.8×0.667/1.467 ≈ 0.727."], a: "Precision 0.80, recall 0.67, F1 ≈ 0.73. Accuracy is 97% here, which looks great and hides that a third of positives are missed." }],
        code: [
          { id: "py-prf", t: "Precision, recall and F1", diff: "Easy", fn: "prf",
            statement: "<p>Write <code>prf(actual, predicted)</code> for two equal-length arrays of 0/1 labels (1 = positive). Return <code>{ precision, recall, f1 }</code>, each rounded to 2 decimals. If a denominator is 0, that metric is 0.</p>",
            examples: [{ in: "prf([1,1,0,0], [1,0,1,0])", out: "{ precision: 0.5, recall: 0.5, f1: 0.5 }" }],
            hints: ["Count TP (1,1), FP (actual 0, predicted 1) and FN (actual 1, predicted 0).", "F1 = 2PR/(P+R); compute it from the unrounded values."],
            starter: `function prf(actual, predicted) {
  // your code here
}`,
            solution: `function prf(actual, predicted) {
  let tp = 0, fp = 0, fn = 0;
  for (let i = 0; i < actual.length; i++) {
    if (predicted[i] === 1 && actual[i] === 1) tp++;
    else if (predicted[i] === 1) fp++;
    else if (actual[i] === 1) fn++;
  }
  const p = tp + fp ? tp / (tp + fp) : 0;
  const r = tp + fn ? tp / (tp + fn) : 0;
  const f = p + r ? (2 * p * r) / (p + r) : 0;
  const r2 = (x) => Math.round(x * 100) / 100;
  return { precision: r2(p), recall: r2(r), f1: r2(f) };
}`,
            explain: "This is what sklearn.metrics.classification_report prints for each class.",
            tests: [
              { args: [[1, 1, 0, 0], [1, 0, 1, 0]], expect: { precision: 0.5, recall: 0.5, f1: 0.5 } },
              { args: [[1, 1, 1, 0], [1, 1, 0, 0]], expect: { precision: 1, recall: 0.67, f1: 0.8 } },
              { args: [[0, 0, 0], [0, 0, 0]], expect: { precision: 0, recall: 0, f1: 0 } },
              { args: [[1, 0, 1, 0, 1], [1, 1, 1, 1, 0]], expect: { precision: 0.5, recall: 0.67, f1: 0.57 } },
            ] },
          { id: "py-knn", t: "k-nearest-neighbours classifier", diff: "Medium", fn: "knn",
            statement: "<p>Write <code>knn(train, point, k)</code>. <code>train</code> is an array of <code>{ x: [numbers], label }</code>. Find the <code>k</code> training points with the smallest Euclidean distance to <code>point</code> (ties: earlier in the array first) and return the most common label among them. If labels tie in count, return the one whose nearest member is closest.</p>",
            examples: [{ in: "knn([{x:[0,0],label:'a'},{x:[0,1],label:'a'},{x:[5,5],label:'b'}], [0,0.4], 3)", out: "'a'" }],
            hints: ["Sort a copy by distance (sort is stable for ties).", "Walk the k nearest in order; the first label to reach the top count wins ties."],
            starter: `function knn(train, point, k) {
  // your code here
}`,
            solution: `function knn(train, point, k) {
  const dist = (a) => Math.sqrt(a.reduce((s, v, i) => s + (v - point[i]) ** 2, 0));
  const near = train.map((t) => ({ label: t.label, d: dist(t.x) })).sort((p, q) => p.d - q.d).slice(0, k);
  const count = {};
  near.forEach((n) => (count[n.label] = (count[n.label] || 0) + 1));
  const best = Math.max(...Object.values(count));
  return near.find((n) => count[n.label] === best).label;
}`,
            explain: "kNN has no training step: it just remembers the data. Vector search in RAG is the same 'find the nearest neighbours' idea.",
            tests: [
              { args: [[{ x: [0, 0], label: "a" }, { x: [0, 1], label: "a" }, { x: [5, 5], label: "b" }], [0, 0.4], 3], expect: "a" },
              { args: [[{ x: [0, 0], label: "a" }, { x: [5, 5], label: "b" }, { x: [6, 5], label: "b" }], [5, 4], 1], expect: "b" },
              { args: [[{ x: [1], label: "x" }, { x: [3], label: "y" }], [2.2], 2], expect: "y" },
              { args: [[{ x: [0], label: "p" }, { x: [10], label: "q" }, { x: [11], label: "q" }, { x: [1], label: "p" }], [2], 3], expect: "p" },
            ] },
        ],
        project: { t: "Build it: ticket router", brief: "Classic ML vs LLM on the same problem, with numbers.", steps: ["Make or find a dataset of 1,000+ short support tickets with 3–5 categories.", "Train TF-IDF + LogisticRegression in a scikit-learn Pipeline; print classification_report.", "Classify the same test set with an LLM prompt; compare accuracy, cost and latency in a table.", "Write which you'd ship and why."] } },

      { id: "dpy-dl", t: "Deep learning and Hugging Face, just enough", mins: 35,
        body: [
          "A neural network stacks layers of weighted sums and non-linear functions; training adjusts the weights with gradient descent to reduce a loss. <b>PyTorch</b> is the dominant framework in research and most new work; <b>TensorFlow/Keras</b> still appear in older projects and job posts. Learn the concepts once and either is readable.",
          "For an AI engineer the key skill is <b>using</b> pretrained models, not training from scratch. <b>Hugging Face</b> is the hub: thousands of models (text, vision, speech) and datasets. The <code>transformers</code> <code>pipeline()</code> runs a model in two lines.",
          "<pre>from transformers import pipeline\nclf = pipeline('sentiment-analysis')\nclf('The placement talk was really useful')\n# [{'label': 'POSITIVE', 'score': 0.99}]</pre>",
          "<b>sentence-transformers</b> gives you free, local embedding models, perfect for RAG experiments without an API bill.",
          "Know the vocabulary for interviews: epoch, batch, learning rate, overfitting, dropout, CNN (images), RNN (old sequence models), transformer (attention, today's standard), GPU vs CPU, inference vs training.",
        ],
        keys: ["PyTorch dominates; Keras still appears.", "AI engineers mostly use pretrained models.", "Hugging Face pipeline() for quick tasks.", "sentence-transformers for free local embeddings."],
        ex: "Instead of paying an API to tag the sentiment of 50,000 app reviews, a small Hugging Face model runs on your laptop overnight for free.",
        fact: "Hugging Face started in 2016 as a chatbot app for teenagers before pivoting to become the main open hub for machine-learning models.",
        quiz: [
          { q: "As an AI engineer, the most common way you'll use deep learning is…", o: ["Training GPT-sized models", "Using pretrained models and APIs", "Writing CUDA kernels", "Avoiding it"], a: 1, why: "Training large models from scratch is rare outside big labs." },
          { q: "Free local embeddings for a RAG prototype?", o: ["sentence-transformers", "pandas", "Matplotlib", "FastAPI"], a: 0, why: "It packages embedding models that run on your own machine." },
        ],
        project: { t: "Build it: local review analyser", brief: "Use two Hugging Face pipelines locally.", steps: ["Load 500 product or app reviews into pandas.", "Run sentiment analysis and zero-shot classification (topics: price, quality, delivery).", "Summarise results in a table and a bar chart.", "Note how long it took on your GPU vs CPU."] } },
    ] },

    { title: "2. Frameworks for LLM apps", lessons: [
      { id: "dpy-langchain", t: "LangChain: building blocks, and when not to use it", mins: 40,
        body: [
          "<b>LangChain</b> gives standard interfaces for the parts of an LLM app: <b>chat models</b> (swap providers with one line), <b>prompt templates</b>, <b>output parsers</b>, <b>document loaders</b> (PDF, web, YouTube), <b>text splitters</b>, <b>embeddings</b>, <b>vector stores</b> and <b>retrievers</b>.",
          "<b>LCEL</b> (LangChain Expression Language) pipes components together with <code>|</code>:",
          "<pre>prompt = ChatPromptTemplate.from_template(\n  'Answer from the context only.\\nContext: {context}\\nQuestion: {question}')\nchain = (\n  {'context': retriever | format_docs, 'question': RunnablePassthrough()}\n  | prompt | llm | StrOutputParser()\n)\nchain.invoke('When do hostel gates close?')</pre>",
          "Patterns you'll see in job posts: <b>RAG chains</b>, <b>map-reduce summarisation</b> (summarise each chunk, then summarise the summaries, for long transcripts), <b>structured output</b> with Pydantic models, and <b>conversational memory</b>.",
          "Honest view: LangChain is fast for prototypes and appears on many resumes, but its abstractions change often and can hide what's happening. Know how to build RAG <i>without</i> it (you already did in JavaScript), so you can debug it and explain it in interviews.",
        ],
        keys: ["Standard interfaces: models, prompts, loaders, splitters, retrievers.", "LCEL composes with |.", "Map-reduce for long documents.", "Know the plain version underneath."],
        ex: "A meeting assistant: a loader pulls a YouTube transcript, a splitter chunks it, a map-reduce chain summarises it, and a RAG chain answers questions about the meeting.",
        fact: "LangChain was first released as an open-source Python package in October 2022, weeks before ChatGPT launched.",
        quiz: [
          { q: "Best way to summarise a 3-hour transcript that doesn't fit in one prompt?", o: ["Truncate it", "Map-reduce: summarise chunks, then combine", "Raise temperature", "Use a bigger font"], a: 1, why: "Each chunk fits, and the summaries fit together." },
          { q: "Why learn to build RAG without a framework too?", o: ["Frameworks are illegal", "To debug it and explain it in interviews", "It's always faster", "LangChain can't do RAG"], a: 1, why: "Understanding the plain steps makes the framework transparent." },
        ],
        project: { t: "Build it: meeting assistant", brief: "A resume-grade LangChain project, but with a real API and frontend so it stands out.", steps: ["Ingest a YouTube URL or audio file; transcribe it (see the Whisper lesson).", "Map-reduce summary plus extracted action items as a Pydantic model.", "RAG chat over the transcript with Chroma.", "Serve it with FastAPI and build a small React or Next.js UI instead of only Streamlit."], stretch: ["Export to PDF; add speaker-wise summaries."] } },

      { id: "dpy-langgraph", t: "LangGraph, multi-agent systems and MCP", mins: 40,
        body: [
          "Plain agent loops get messy when you need branches, retries, memory across sessions or a human approval step. <b>LangGraph</b> models an agent as a <b>graph</b>: <b>nodes</b> are steps (call model, run tool, check result), <b>edges</b> decide what runs next (including conditional edges), and a shared <b>state</b> object flows through it.",
          "<b>Checkpointing</b> saves state after each step, so a conversation can resume later, and a run can pause for <b>human-in-the-loop</b> approval before a risky tool call.",
          "<b>Multi-agent patterns</b>: a <b>supervisor</b> routes work to specialist agents (researcher, writer, reviewer); or agents hand off to each other. Use them only when one agent with good tools isn't enough. More agents means more cost, latency and ways to fail.",
          "<b>MCP</b> (Model Context Protocol) is an open standard for exposing tools and data to AI apps. Write one MCP server (for example 'search my notes', 'list placement drives') and any MCP-capable client can use it. With the Python SDK, a server with one tool is about 15 lines.",
          "<b>LangSmith</b> and open-source alternatives like Langfuse trace every step of a chain or graph (inputs, outputs, tokens, latency), which is essential for debugging agents.",
        ],
        keys: ["LangGraph: nodes, edges, shared state.", "Checkpoints enable memory and human approval.", "Multi-agent only when one agent isn't enough.", "MCP: write a tool server once, use it in many clients."],
        ex: "An HR-policy assistant: a router node decides between 'search policies' (RAG) and 'leave balance' (database tool), and a human-approval node is required before 'apply leave'.",
        fact: "MCP was introduced by Anthropic in late 2024 as an open protocol and has since been adopted by many AI tools and IDEs.",
        quiz: [
          { q: "What does a LangGraph checkpoint enable?", o: ["Faster GPUs", "Resuming runs and human-in-the-loop pauses", "Cheaper tokens", "Image generation"], a: 1, why: "Saved state can be reloaded and continued." },
          { q: "When should you reach for multiple agents?", o: ["Always", "When one well-equipped agent clearly can't handle the task", "To impress interviewers", "Never"], a: 1, why: "Each extra agent adds cost and failure points." },
        ],
        project: { t: "Build it: placement-cell agent", brief: "A LangGraph agent with real tools and a human check.", steps: ["Tools: search placement PDFs (RAG), list upcoming drives (SQLite), draft an email.", "Graph: router → tool nodes → answer; a human-approval node before 'send email'.", "Checkpoint with SQLite so chats resume.", "Expose the drives tool as an MCP server too, and connect it to an MCP client."] } },

      { id: "dpy-vectors", t: "Vector stores: FAISS, Chroma and pgvector", mins: 30,
        body: [
          "<b>FAISS</b> (from Meta): a library, not a server. Extremely fast in-process search; you handle saving and metadata yourself. Great for experiments and batch jobs.",
          "<b>Chroma</b>: a simple embedded or client–server vector database with metadata filtering. The easiest start for prototypes and many LangChain tutorials.",
          "<b>pgvector</b>: vectors inside PostgreSQL. One database for users, documents and embeddings, with SQL joins, transactions and backups you already know. A strong production default for small to medium apps.",
          "Managed services (several cloud vector databases exist) add scale and operations for very large collections.",
          "<b>Index types</b>: <b>flat</b> (exact, compares everything), <b>IVF</b> (clusters vectors, searches the nearest clusters), <b>HNSW</b> (a navigable graph; fast and accurate, uses more memory). Approximate indexes trade a little recall for big speed gains.",
          "Always store <b>metadata</b> (source, page, date, owner) and filter on it, for example only search documents this user may see.",
        ],
        keys: ["FAISS = fast library; Chroma = easy database; pgvector = vectors in Postgres.", "Flat is exact; IVF and HNSW are approximate and fast.", "Filter on metadata for permissions.", "pgvector is a strong production default."],
        ex: "A college portal keeps students, notices and notice embeddings in one PostgreSQL database with pgvector, so 'search notices for my department' is one SQL query with a WHERE clause.",
        fact: "HNSW stands for Hierarchical Navigable Small World, named after 'small-world' networks where any two points are a few hops apart.",
        quiz: [
          { q: "Which is a library rather than a database server?", o: ["FAISS", "PostgreSQL", "Chroma server", "Redis"], a: 0, why: "FAISS runs in your process; persistence is up to you." },
          { q: "Why filter vector search on metadata?", o: ["It's prettier", "So users only retrieve documents they're allowed to see", "To change embeddings", "It's required by HNSW"], a: 1, why: "Retrieval must respect permissions." },
        ],
        project: { t: "Build it: vector store shoot-out", brief: "Same 2,000 chunks, three stores, measured.", steps: ["Embed the chunks once with sentence-transformers and save the vectors.", "Load them into FAISS, Chroma and pgvector (Docker).", "Run 50 queries; record latency and whether the expected chunk is in the top 4.", "Write a table and a recommendation in the README."] } },

      { id: "dpy-speech", t: "Speech and multimodal pipelines: Whisper and friends", mins: 30,
        body: [
          "<b>Whisper</b> (OpenAI, open weights) turns speech into text in many languages, including Indian languages to varying quality. Run it locally (faster-whisper is a popular optimised version) or through hosted APIs. Indian providers such as Sarvam AI focus on Indian languages.",
          "A real pipeline: download audio (yt-dlp for YouTube) → convert and split into chunks with ffmpeg → transcribe each chunk → stitch with timestamps → clean up → summarise, or index for RAG.",
          "Long audio is slow, so run it as a <b>background job</b> (a queue plus a worker) and show progress, rather than making an HTTP request wait 20 minutes.",
          "Multimodal models also read images: screenshots, receipts and handwritten answer sheets. Extraction with a schema (vendor, total, date) is a very common real task.",
        ],
        keys: ["Whisper for speech-to-text; check quality per language.", "Pipeline: download → split → transcribe → stitch → summarise.", "Long jobs belong in background workers.", "Multimodal + schema = document extraction."],
        ex: "A lecture recorder: upload a 1-hour class, get a timestamped transcript in 10 minutes, a 1-page summary and a chat that answers 'what did sir say about deadlocks?'.",
        fact: "Whisper was trained on hundreds of thousands of hours of multilingual audio collected from the web, which is why it handles accents well.",
        quiz: [
          { q: "Transcribing a 2-hour video in a web app should run…", o: ["Inside the HTTP request", "As a background job with progress updates", "In the browser only", "Overnight by hand"], a: 1, why: "Requests time out; workers don't." },
          { q: "Which tool splits and converts audio files?", o: ["ffmpeg", "pandas", "Terraform", "Nginx"], a: 0, why: "ffmpeg is the standard media tool." },
        ] },
    ] },

    { title: "3. Production AI", lessons: [
      { id: "dpy-serve", t: "Serving AI: FastAPI, streaming, queues and Docker", mins: 35,
        body: [
          "Streamlit and Gradio are great for <b>demos</b>: a UI in 30 lines. Real products need an <b>API</b> (FastAPI) and a proper frontend (React or Next.js). Showing both on your resume is a clear edge over Streamlit-only candidates.",
          "<b>Streaming</b>: FastAPI's <code>StreamingResponse</code> sends tokens as Server-Sent Events; the browser renders them as they arrive.",
          "<b>Background work</b>: ingestion, transcription and re-indexing go to a queue (Celery, RQ or Arq with Redis). The API returns a job id; the client polls or listens for completion.",
          "<b>Caching</b>: identical questions and embeddings of identical text can be cached (Redis) to save money and time.",
          "<b>Containerise</b>: a slim Python base image, dependencies installed in their own layer, model files mounted or downloaded at start, a non-root user, and a <code>/health</code> endpoint. Then the CI/CD and AWS lessons from 'DevOps in practice' apply unchanged.",
          "<b>Rate limits and auth</b> on every AI endpoint: they cost real money per call, so an open endpoint is an open wallet.",
        ],
        keys: ["Streamlit for demos, FastAPI + real frontend for products.", "Stream tokens with SSE.", "Queues for long jobs; cache repeated work.", "Auth and rate limits on every paid endpoint."],
        ex: "Someone finds your public /ask endpoint and scripts 100,000 calls overnight. With per-user rate limits and auth, the damage is a few blocked requests instead of a huge API bill.",
        fact: "Server-Sent Events is a plain HTTP feature that has existed for years; LLM chat apps made it popular again.",
        quiz: [
          { q: "Why put auth and rate limits on an LLM endpoint?", o: ["Style", "Every call costs money; open endpoints get abused", "FastAPI requires it", "To improve answers"], a: 1, why: "Unprotected AI endpoints are a direct cost risk." },
          { q: "Re-indexing 10,000 PDFs should run…", o: ["In the request", "In a background worker", "In the browser", "Manually"], a: 1, why: "Long work belongs in a queue." },
        ] },

      { id: "dpy-observe", t: "LLMOps: tracing, evals in CI, and guardrails", mins: 30,
        body: [
          "<b>Tracing</b>: record each request's full path (retrieved chunks, prompt, model, tokens, latency, tool calls) in LangSmith, Langfuse or your own logs. When a user says 'it gave a wrong answer', you can see exactly why.",
          "<b>Evals in CI</b>: keep a versioned eval set; a GitHub Actions job runs it when prompts or retrieval code change and fails the build if the pass rate drops. That's testing for AI.",
          "<b>Prompt versioning</b>: prompts are code. Keep them in files under git, with a version id logged on every call.",
          "<b>Guardrails</b>: validate inputs (length, language, topic), redact personal data, validate outputs against schemas, and add refusal paths. Monitor cost per user and per day with alerts.",
          "<b>Feedback loops</b>: thumbs up/down in the UI, stored with the trace, become new eval cases.",
        ],
        keys: ["Trace every step of every request.", "Run evals in CI; fail on regressions.", "Version prompts like code.", "Guardrails + cost alerts + user feedback."],
        ex: "A prompt tweak improves tone but quietly breaks citation formatting. The eval job in CI fails on 6 citation cases, so it never reaches users.",
        fact: "LLMOps borrows heavily from MLOps and DevOps: versioning, automated tests and monitoring, applied to prompts and model behaviour.",
        quiz: [
          { q: "Best way to catch a prompt change that breaks answers?", o: ["Hope", "Run an eval suite in CI", "Ask users", "Use a bigger model"], a: 1, why: "Automated evals catch regressions before release." },
          { q: "Thumbs-down feedback should become…", o: ["Ignored", "New eval cases", "Deleted", "Training data for every model automatically"], a: 1, why: "Real failures make the best tests." },
        ] },

      { id: "dpy-finetune", t: "Fine-tuning, LoRA and when it's worth it", mins: 25,
        body: [
          "<b>Fine-tuning</b> continues training a pretrained model on your examples to change its <i>behaviour</i>: a format, a tone, a narrow classification task. It's not a reliable way to add facts; use RAG for knowledge.",
          "<b>LoRA</b> (low-rank adaptation) trains small adapter matrices instead of all the weights, so a 7B model can be tuned on one consumer or cloud GPU. <b>QLoRA</b> does this on a quantised model to save more memory.",
          "You need a few hundred to a few thousand high-quality input → output pairs. Bad data gives a confidently bad model.",
          "Order of attack: better prompt → few-shot examples → RAG → a smaller model with good prompts → fine-tune. Most products never need step 5.",
          "Interview answer worth memorising: 'RAG for knowledge that changes, fine-tuning for behaviour that doesn't, and evals to prove either one helped.'",
        ],
        keys: ["Fine-tune for behaviour, RAG for knowledge.", "LoRA/QLoRA make tuning affordable.", "Data quality decides the result.", "Try prompts, few-shot and RAG first."],
        ex: "A legal-tech startup fine-tunes a small model to always output clauses in its strict house format, and uses RAG to fetch the actual laws.",
        fact: "The LoRA paper came from Microsoft researchers in 2021 and quickly became the standard way to fine-tune large models cheaply.",
        quiz: [
          { q: "Your bot must know this week's updated fee structure. Best approach?", o: ["Fine-tune weekly", "RAG over the latest documents", "Longer system prompt with old data", "Train from scratch"], a: 1, why: "RAG updates as soon as the document changes." },
          { q: "What does LoRA train?", o: ["All weights", "Small adapter matrices", "Only the tokenizer", "Nothing"], a: 1, why: "That's what makes it cheap." },
        ],
        pq: [{ q: "In an interview: 'When would you fine-tune instead of using RAG?'", a: "When I need consistent behaviour or format that prompting and few-shot examples can't achieve, I have enough high-quality examples, and evals show a gain. For knowledge, especially changing knowledge, I'd use RAG." }] },
    ] },
  ],
});
