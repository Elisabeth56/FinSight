"use client";

import { motion } from "framer-motion";
import { Upload, FileText, CheckCircle, MessageSquare, Send, Zap } from "lucide-react";

export default function DemoSection() {
  return (
    <section className="relative py-24 bg-dark-900">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl sm:text-5xl font-bold text-white mb-4">
            From upload to insights
            <br />
            <span className="text-gradient">in seconds</span>
          </h2>
          <p className="text-lg text-gray-400 max-w-2xl mx-auto">
            Simply upload your bank statement and our AI does the rest.
            No manual categorization, no spreadsheets, no hassle.
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Upload Flow */}
          <motion.div
            initial={{ opacity: 0, x: -40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="relative"
          >
            <div className="bg-dark-800 rounded-2xl p-8 border border-white/5">
              {/* Upload Zone */}
              <div className="border-2 border-dashed border-green-500/30 rounded-xl p-8 text-center mb-6 hover:border-green-500/50 transition-colors cursor-pointer">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-500/10 flex items-center justify-center">
                  <Upload className="w-8 h-8 text-green-400" />
                </div>
                <p className="text-white font-medium mb-2">Drop your statement here</p>
                <p className="text-sm text-gray-400">Supports CSV, PDF, OFX formats</p>
              </div>

              {/* Processing Steps */}
              <div className="space-y-4">
                {[
                  { icon: FileText, text: "Parsing transactions", status: "complete" },
                  { icon: Zap, text: "AI categorization", status: "complete" },
                  { icon: CheckCircle, text: "Insights generated", status: "complete" },
                ].map((step, index) => (
                  <motion.div
                    key={step.text}
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: index * 0.2 }}
                    className="flex items-center gap-4 p-3 bg-dark-700/50 rounded-lg"
                  >
                    <div className="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center">
                      <step.icon className="w-5 h-5 text-green-400" />
                    </div>
                    <span className="text-white flex-1">{step.text}</span>
                    <CheckCircle className="w-5 h-5 text-green-400" />
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>

          {/* Chat Interface */}
          <motion.div
            initial={{ opacity: 0, x: 40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="relative"
          >
            <div className="bg-gradient-to-br from-green-900/40 to-emerald-900/40 rounded-3xl p-6 border border-green-500/20">
              {/* Chat Header */}
              <div className="flex items-center gap-3 mb-6 pb-4 border-b border-white/10">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-500 to-emerald-400 flex items-center justify-center">
                  <MessageSquare className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-white font-medium">FinSight AI</p>
                  <p className="text-xs text-green-400">Powered by LLaMA 3 via Groq</p>
                </div>
              </div>

              {/* Chat Messages */}
              <div className="space-y-4 mb-6">
                {/* User Message */}
                <div className="flex justify-end">
                  <div className="bg-green-600 rounded-2xl rounded-br-md px-4 py-3 max-w-[80%]">
                    <p className="text-white text-sm">Where did most of my money go in March?</p>
                  </div>
                </div>

                {/* AI Response */}
                <div className="flex justify-start">
                  <div className="bg-dark-700 rounded-2xl rounded-bl-md px-4 py-3 max-w-[85%]">
                    <p className="text-white text-sm mb-3">
                      Based on your March transactions, here&apos;s the breakdown:
                    </p>
                    <div className="space-y-2 mb-3">
                      {[
                        { category: "Food & Dining", amount: "$892.45", percent: "28%" },
                        { category: "Shopping", amount: "$723.20", percent: "23%" },
                        { category: "Transport", amount: "$456.00", percent: "14%" },
                      ].map((item) => (
                        <div key={item.category} className="flex items-center justify-between text-sm">
                          <span className="text-gray-300">{item.category}</span>
                          <span className="text-green-400 font-medium">{item.amount} ({item.percent})</span>
                        </div>
                      ))}
                    </div>
                    <p className="text-gray-400 text-xs">
                      💡 Tip: Your dining expenses increased 15% from February. Consider meal prepping!
                    </p>
                  </div>
                </div>
              </div>

              {/* Chat Input */}
              <div className="flex items-center gap-3">
                <div className="flex-1 bg-dark-700 rounded-full px-4 py-3 border border-white/10">
                  <input
                    type="text"
                    placeholder="Ask about your finances..."
                    className="w-full bg-transparent text-white text-sm outline-none placeholder-gray-500"
                  />
                </div>
                <button className="w-12 h-12 rounded-full bg-gradient-to-r from-green-500 to-emerald-400 flex items-center justify-center hover:from-green-400 hover:to-emerald-300 transition-all">
                  <Send className="w-5 h-5 text-white" />
                </button>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Supported Banks */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="mt-20 text-center"
        >
          <p className="text-sm text-gray-500 mb-8">Works with statements from any bank</p>
          <div className="flex items-center justify-center gap-12 flex-wrap opacity-50">
            {["Chase", "Bank of America", "Wells Fargo", "Citi", "Capital One"].map((bank) => (
              <div key={bank} className="text-gray-400 font-medium">
                {bank}
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
