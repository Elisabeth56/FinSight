"use client";

import { motion } from "framer-motion";
import { Sparkles, Upload, TrendingUp, PieChart, MessageSquare } from "lucide-react";

export default function HeroSection() {
  return (
    <section className="relative min-h-screen overflow-hidden">
      {/* Background Gradient */}
      <div className="absolute inset-0 hero-bg" />
      
      {/* Animated Wave Lines */}
      <div className="absolute inset-0 overflow-hidden">
        <svg
          className="absolute w-full h-full opacity-20"
          viewBox="0 0 1440 800"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <motion.path
            d="M-100 400 Q 200 350, 400 400 T 800 400 T 1200 400 T 1600 400"
            stroke="rgba(34, 197, 94, 0.4)"
            strokeWidth="1"
            fill="none"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 2, ease: "easeInOut" }}
          />
          <motion.path
            d="M-100 450 Q 250 400, 450 450 T 850 450 T 1250 450 T 1650 450"
            stroke="rgba(34, 197, 94, 0.3)"
            strokeWidth="1"
            fill="none"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 2.5, ease: "easeInOut", delay: 0.2 }}
          />
          <motion.path
            d="M-100 500 Q 300 450, 500 500 T 900 500 T 1300 500 T 1700 500"
            stroke="rgba(34, 197, 94, 0.2)"
            strokeWidth="1"
            fill="none"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 3, ease: "easeInOut", delay: 0.4 }}
          />
        </svg>
      </div>

      <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-32 pb-20">
        <div className="text-center">
          {/* Trust Badge */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm border border-green-500/30 mb-8"
          >
            <Sparkles className="w-4 h-4 text-green-400" />
            <span className="text-sm text-green-100">Powered by Groq + LLaMA 3 for instant insights</span>
            <Sparkles className="w-4 h-4 text-green-400" />
          </motion.div>

          {/* Main Heading */}
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-5xl sm:text-6xl lg:text-7xl font-bold text-white leading-tight"
          >
            Your finances,
            <br />
            <span className="text-gradient">crystal clear</span>
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="mt-6 text-lg text-green-100/80 max-w-2xl mx-auto"
          >
            Upload your bank statement and let AI reveal where your money goes.
            Get instant spend categorization, trend analysis, and chat with your
            financial data using natural language.
          </motion.p>

          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
            className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <button className="btn-primary px-8 py-4 text-base font-medium text-dark-900 bg-gradient-to-r from-green-400 to-emerald-300 rounded-full hover:from-green-300 hover:to-emerald-200 transition-all duration-300 shadow-lg shadow-green-500/30 flex items-center gap-2">
              <Upload className="w-5 h-5" />
              Upload Statement
            </button>
            <button className="px-8 py-4 text-base font-medium text-white border border-white/20 rounded-full hover:bg-white/10 transition-all duration-300">
              See Demo
            </button>
          </motion.div>

          {/* Feature Pills */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.8 }}
            className="mt-12 flex flex-wrap items-center justify-center gap-3"
          >
            {[
              { icon: PieChart, text: "Auto-Categorization" },
              { icon: TrendingUp, text: "Trend Analysis" },
              { icon: MessageSquare, text: "AI Chat" },
            ].map((feature, index) => (
              <div
                key={feature.text}
                className="flex items-center gap-2 px-4 py-2 bg-white/5 rounded-full border border-white/10"
              >
                <feature.icon className="w-4 h-4 text-green-400" />
                <span className="text-sm text-white/80">{feature.text}</span>
              </div>
            ))}
          </motion.div>
        </div>

        {/* Dashboard Mockup */}
        <motion.div
          initial={{ opacity: 0, y: 60 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 1 }}
          className="mt-20 relative"
        >
          {/* Desktop Monitor Frame */}
          <div className="relative mx-auto max-w-5xl">
            {/* Monitor Stand */}
            <div className="absolute -bottom-16 left-1/2 -translate-x-1/2 w-32 h-20 bg-gradient-to-b from-gray-700 to-gray-800 rounded-b-lg" />
            <div className="absolute -bottom-20 left-1/2 -translate-x-1/2 w-48 h-4 bg-gray-800 rounded-full" />
            
            {/* Monitor Screen */}
            <div className="relative bg-gray-900 rounded-2xl p-2 device-shadow">
              <div className="bg-dark-800 rounded-xl overflow-hidden aspect-video">
                {/* Screen Content - Dashboard Preview */}
                <div className="p-6 h-full flex flex-col">
                  {/* Dashboard Header */}
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-green-600 to-emerald-500 flex items-center justify-center">
                        <TrendingUp className="w-4 h-4 text-white" />
                      </div>
                      <span className="text-sm text-white font-semibold">FinSight Dashboard</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-400">March 2024</span>
                      <div className="w-6 h-6 rounded-full bg-green-500/20 flex items-center justify-center">
                        <div className="w-2 h-2 rounded-full bg-green-400" />
                      </div>
                    </div>
                  </div>
                  
                  {/* Dashboard Grid */}
                  <div className="flex-1 grid grid-cols-3 gap-4">
                    {/* Spending Overview Card */}
                    <div className="col-span-2 bg-dark-700/50 rounded-xl p-4 border border-white/5">
                      <p className="text-xs text-gray-400 mb-2">Monthly Spending</p>
                      <p className="text-2xl font-bold text-white mb-4">$4,235.50</p>
                      {/* Mini Chart */}
                      <div className="flex items-end gap-1 h-16">
                        {[40, 65, 45, 80, 55, 70, 90, 60, 75, 85, 50, 95].map((height, i) => (
                          <div
                            key={i}
                            className="flex-1 bg-gradient-to-t from-green-600 to-green-400 rounded-t"
                            style={{ height: `${height}%` }}
                          />
                        ))}
                      </div>
                    </div>

                    {/* Categories Card */}
                    <div className="bg-dark-700/50 rounded-xl p-4 border border-white/5">
                      <p className="text-xs text-gray-400 mb-3">Top Categories</p>
                      <div className="space-y-2">
                        {[
                          { name: "Food & Dining", amount: "$892", color: "bg-green-500" },
                          { name: "Transport", amount: "$456", color: "bg-emerald-500" },
                          { name: "Shopping", amount: "$723", color: "bg-blue-500" },
                        ].map((cat) => (
                          <div key={cat.name} className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <div className={`w-2 h-2 rounded-full ${cat.color}`} />
                              <span className="text-xs text-gray-300">{cat.name}</span>
                            </div>
                            <span className="text-xs text-white font-medium">{cat.amount}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* AI Chat Card */}
                    <div className="col-span-3 bg-dark-700/50 rounded-xl p-4 border border-white/5">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-green-500 to-emerald-400 flex items-center justify-center">
                          <MessageSquare className="w-4 h-4 text-white" />
                        </div>
                        <div className="flex-1 bg-dark-600 rounded-full px-4 py-2">
                          <span className="text-xs text-gray-400">Ask: "Where did most of my money go in March?"</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Camera Notch */}
              <div className="absolute top-4 left-1/2 -translate-x-1/2 w-3 h-3 bg-gray-700 rounded-full" />
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
