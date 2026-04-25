"use client";

import { motion } from "framer-motion";

export default function DeveloperSection() {
  return (
    <section className="relative py-24 bg-dark-900 overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 mesh-gradient" />

      <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Left - Text Content */}
          <motion.div
            initial={{ opacity: 0, x: -40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-green-500/10 border border-green-500/20 mb-6">
              <span className="text-sm text-green-400">For Developers</span>
            </div>
            <h2 className="text-4xl sm:text-5xl font-bold text-white leading-tight mb-6">
              Built on a modern
              <br />
              full-stack architecture
            </h2>
            <p className="text-lg text-gray-400 mb-8 max-w-md">
              FinSight showcases RAG pipelines, structured data extraction, real-time visualization, and blazing-fast LLM inference with Groq.
            </p>

            {/* Tech Stack */}
            <div className="flex flex-wrap gap-3 mb-8">
              {[
                "Next.js",
                "FastAPI",
                "PostgreSQL",
                "Groq API",
                "LLaMA 3",
                "LlamaIndex",
                "Recharts",
              ].map((tech) => (
                <span
                  key={tech}
                  className="px-3 py-1.5 bg-dark-700 text-gray-300 text-sm rounded-full border border-white/10"
                >
                  {tech}
                </span>
              ))}
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-wrap gap-4">
              <button className="px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-400 text-dark-900 rounded-full font-medium hover:from-green-400 hover:to-emerald-300 transition-colors">
                View on GitHub
              </button>
              <button className="px-6 py-3 bg-white/10 text-white rounded-full font-medium hover:bg-white/20 transition-colors border border-white/20">
                API Documentation
              </button>
            </div>
          </motion.div>

          {/* Right - Code Block */}
          <motion.div
            initial={{ opacity: 0, x: 40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="relative"
          >
            <div className="code-block rounded-2xl p-6 overflow-hidden shadow-2xl border border-white/5">
              {/* Window Controls */}
              <div className="flex items-center gap-2 mb-4">
                <div className="w-3 h-3 bg-red-500 rounded-full" />
                <div className="w-3 h-3 bg-yellow-500 rounded-full" />
                <div className="w-3 h-3 bg-green-500 rounded-full" />
                <span className="ml-4 text-xs text-gray-500">api/analyze.py</span>
              </div>

              {/* Code */}
              <pre className="text-sm overflow-x-auto">
                <code>
                  <span className="text-purple-400">from</span>
                  <span className="text-gray-300"> fastapi </span>
                  <span className="text-purple-400">import</span>
                  <span className="text-cyan-300"> FastAPI</span>
                  {"\n"}
                  <span className="text-purple-400">from</span>
                  <span className="text-gray-300"> groq </span>
                  <span className="text-purple-400">import</span>
                  <span className="text-cyan-300"> Groq</span>
                  {"\n"}
                  <span className="text-purple-400">from</span>
                  <span className="text-gray-300"> llama_index </span>
                  <span className="text-purple-400">import</span>
                  <span className="text-cyan-300"> VectorStoreIndex</span>
                  {"\n\n"}
                  <span className="text-cyan-300">app</span>
                  <span className="text-gray-300"> = </span>
                  <span className="text-yellow-300">FastAPI</span>
                  <span className="text-gray-300">()</span>
                  {"\n"}
                  <span className="text-cyan-300">client</span>
                  <span className="text-gray-300"> = </span>
                  <span className="text-yellow-300">Groq</span>
                  <span className="text-gray-300">()</span>
                  {"\n\n"}
                  <span className="text-gray-500"># Parse bank statement with LlamaIndex</span>
                  {"\n"}
                  <span className="text-purple-400">@app.post</span>
                  <span className="text-gray-300">(</span>
                  <span className="text-green-400">&quot;/analyze&quot;</span>
                  <span className="text-gray-300">)</span>
                  {"\n"}
                  <span className="text-purple-400">async def</span>
                  <span className="text-yellow-300"> analyze_statement</span>
                  <span className="text-gray-300">(file: UploadFile):</span>
                  {"\n"}
                  <span className="text-gray-300">{"    "}</span>
                  <span className="text-gray-500"># Extract transactions</span>
                  {"\n"}
                  <span className="text-gray-300">{"    "}transactions = </span>
                  <span className="text-purple-400">await</span>
                  <span className="text-yellow-300"> parse_document</span>
                  <span className="text-gray-300">(file)</span>
                  {"\n\n"}
                  <span className="text-gray-300">{"    "}</span>
                  <span className="text-gray-500"># Categorize with LLaMA 3</span>
                  {"\n"}
                  <span className="text-gray-300">{"    "}response = client.chat.completions.</span>
                  <span className="text-yellow-300">create</span>
                  <span className="text-gray-300">(</span>
                  {"\n"}
                  <span className="text-gray-300">{"        "}model=</span>
                  <span className="text-green-400">&quot;llama3-70b-8192&quot;</span>
                  <span className="text-gray-300">,</span>
                  {"\n"}
                  <span className="text-gray-300">{"        "}messages=[{"{"}</span>
                  {"\n"}
                  <span className="text-gray-300">{"            "}</span>
                  <span className="text-green-400">&quot;role&quot;</span>
                  <span className="text-gray-300">: </span>
                  <span className="text-green-400">&quot;user&quot;</span>
                  <span className="text-gray-300">,</span>
                  {"\n"}
                  <span className="text-gray-300">{"            "}</span>
                  <span className="text-green-400">&quot;content&quot;</span>
                  <span className="text-gray-300">: </span>
                  <span className="text-green-400">f&quot;Categorize: {"{"}transactions{"}"}&quot;</span>
                  {"\n"}
                  <span className="text-gray-300">{"        "}{"}"}]</span>
                  {"\n"}
                  <span className="text-gray-300">{"    "})</span>
                  {"\n\n"}
                  <span className="text-gray-300">{"    "}</span>
                  <span className="text-purple-400">return</span>
                  <span className="text-gray-300"> response</span>
                </code>
              </pre>
            </div>

            {/* Decorative glow */}
            <div className="absolute -inset-4 bg-gradient-to-r from-green-500/20 to-emerald-500/20 rounded-3xl blur-xl -z-10" />
          </motion.div>
        </div>

        {/* Architecture Diagram */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.3 }}
          className="mt-24"
        >
          <h3 className="text-2xl font-bold text-white text-center mb-12">System Architecture</h3>
          <div className="flex flex-wrap items-center justify-center gap-4">
            {[
              { name: "Next.js Frontend", color: "from-gray-600 to-gray-700" },
              { name: "→", isArrow: true },
              { name: "FastAPI Backend", color: "from-green-600 to-green-700" },
              { name: "→", isArrow: true },
              { name: "PostgreSQL", color: "from-blue-600 to-blue-700" },
              { name: "↔", isArrow: true },
              { name: "Groq + LLaMA 3", color: "from-purple-600 to-purple-700" },
            ].map((item, i) =>
              item.isArrow ? (
                <span key={i} className="text-green-400 text-2xl font-bold hidden md:block">
                  {item.name}
                </span>
              ) : (
                <div
                  key={item.name}
                  className={`px-6 py-3 bg-gradient-to-r ${item.color} rounded-xl text-white font-medium`}
                >
                  {item.name}
                </div>
              )
            )}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
