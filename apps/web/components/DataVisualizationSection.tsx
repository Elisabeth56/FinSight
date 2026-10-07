"use client";

import { motion } from "framer-motion";
import { BarChart3, AlertTriangle, TrendingDown, TrendingUp } from "lucide-react";

export default function DataVisualizationSection() {
  return (
    <section className="relative py-24 overflow-hidden">
      {/* Background Gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-dark-800 via-green-950/20 to-dark-900" />
      
      {/* Animated Wave Lines */}
      <div className="absolute inset-0 overflow-hidden opacity-20">
        <svg
          className="absolute w-full h-full"
          viewBox="0 0 1440 800"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {[...Array(5)].map((_, i) => (
            <motion.path
              key={i}
              d={`M-100 ${300 + i * 50} Q ${200 + i * 50} ${250 + i * 30}, ${400 + i * 50} ${300 + i * 50} T ${800 + i * 50} ${300 + i * 50} T ${1200 + i * 50} ${300 + i * 50} T ${1600 + i * 50} ${300 + i * 50}`}
              stroke="rgba(34, 197, 94, 0.3)"
              strokeWidth="1"
              fill="none"
              initial={{ pathLength: 0, opacity: 0 }}
              whileInView={{ pathLength: 1, opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 2 + i * 0.3, ease: "easeInOut" }}
            />
          ))}
        </svg>
      </div>

      <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Desktop Mockup */}
        <motion.div
          initial={{ opacity: 0, y: 60 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 1 }}
          className="relative mb-32"
        >
          {/* Monitor Frame */}
          <div className="relative mx-auto max-w-5xl">
            {/* Monitor Stand */}
            <div className="absolute -bottom-16 left-1/2 -translate-x-1/2 w-32 h-20 bg-gradient-to-b from-gray-700 to-gray-800 rounded-b-lg" />
            <div className="absolute -bottom-20 left-1/2 -translate-x-1/2 w-48 h-4 bg-gray-800 rounded-full" />
            
            {/* Monitor Screen */}
            <div className="relative bg-gray-900 rounded-2xl p-3 device-shadow">
              <div className="bg-dark-800 rounded-xl overflow-hidden">
                <div className="p-8">
                  {/* Section Header */}
                  <div className="flex items-start justify-between mb-8">
                    <div>
                      <h2 className="text-2xl font-bold text-white mb-2">
                        Visual spending insights
                        <br />
                        powered by Recharts
                      </h2>
                    </div>
                    <div className="max-w-xs text-right">
                      <p className="text-sm text-gray-400">
                        Beautiful, interactive charts help you understand spending patterns at a glance.
                      </p>
                    </div>
                  </div>

                  {/* Chart Demo */}
                  <div className="grid md:grid-cols-2 gap-6">
                    {/* Monthly Trend Chart */}
                    <div className="bg-dark-700/50 rounded-2xl p-6 border border-white/5">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold text-white">Monthly Trends</h3>
                        <BarChart3 className="w-5 h-5 text-green-400" />
                      </div>
                      {/* Mock Bar Chart */}
                      <div className="flex items-end justify-between gap-2 h-32">
                        {[
                          { month: "Jan", height: 60, color: "from-green-600 to-green-500" },
                          { month: "Feb", height: 75, color: "from-green-600 to-green-500" },
                          { month: "Mar", height: 55, color: "from-green-600 to-green-500" },
                          { month: "Apr", height: 90, color: "from-red-500 to-orange-500" },
                          { month: "May", height: 70, color: "from-green-600 to-green-500" },
                          { month: "Jun", height: 65, color: "from-green-600 to-green-500" },
                        ].map((bar) => (
                          <div key={bar.month} className="flex-1 flex flex-col items-center gap-2">
                            <motion.div
                              className={`w-full bg-gradient-to-t ${bar.color} rounded-t`}
                              initial={{ height: 0 }}
                              whileInView={{ height: `${bar.height}%` }}
                              viewport={{ once: true }}
                              transition={{ duration: 0.8, ease: "easeOut" }}
                            />
                            <span className="text-xs text-gray-400">{bar.month}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Anomaly Detection Card */}
                    <div className="bg-gradient-to-br from-orange-500/20 to-red-500/20 rounded-2xl p-6 border border-orange-500/30">
                      <div className="flex items-center gap-3 mb-4">
                        <AlertTriangle className="w-6 h-6 text-orange-400" />
                        <h3 className="text-lg font-semibold text-white">Anomaly Detected</h3>
                      </div>
                      <p className="text-sm text-gray-300 mb-4">
                        Your April spending was <span className="text-orange-400 font-bold">32% higher</span> than your 3-month average.
                      </p>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-400">Unusual charges:</span>
                          <span className="text-white font-medium">3 transactions</span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-400">Total anomaly amount:</span>
                          <span className="text-orange-400 font-medium">$847.00</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Camera */}
              <div className="absolute top-5 left-1/2 -translate-x-1/2 w-3 h-3 bg-gray-700 rounded-full" />
            </div>
          </div>
        </motion.div>

        {/* Analytics Features */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="grid lg:grid-cols-2 gap-16 items-center"
        >
          {/* Left - Text */}
          <div>
            <h2 className="text-4xl font-bold text-white mb-6">
              Data visualization
              <br />
              that tells a story
            </h2>
            <p className="text-gray-400 mb-8">
              Our analytics engine uses LlamaIndex for intelligent document parsing and Recharts for stunning visualizations — turning complex financial data into clear, actionable insights.
            </p>

            <div className="space-y-6">
              <div>
                <h3 className="text-xl font-semibold text-white mb-2">
                  Automated anomaly detection catches unusual spending
                </h3>
                <p className="text-gray-400 text-sm">
                  Machine learning algorithms identify patterns and flag transactions that don&apos;t fit your typical behavior — helping you catch fraud or unintended subscriptions.
                </p>
              </div>
            </div>
          </div>

          {/* Right - Feature List */}
          <div className="relative">
            <div className="glass-card rounded-2xl p-8">
              <div className="space-y-4">
                {[
                  { icon: BarChart3, name: "Monthly Comparisons" },
                  { icon: TrendingUp, name: "Category Trends" },
                  { icon: AlertTriangle, name: "Anomaly Alerts" },
                  { icon: TrendingDown, name: "Savings Tracking" },
                ].map((feature, index) => (
                  <motion.div
                    key={feature.name}
                    initial={{ opacity: 0, x: 20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                    className="flex items-center gap-4 p-4 bg-white/5 rounded-xl hover:bg-white/10 transition-colors"
                  >
                    <div className="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center">
                      <feature.icon className="w-5 h-5 text-green-400" />
                    </div>
                    <span className="text-white font-medium">{feature.name}</span>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Decorative connection lines */}
            <svg
              className="absolute -left-12 top-1/2 -translate-y-1/2 w-12 h-32 hidden lg:block"
              viewBox="0 0 48 128"
              fill="none"
            >
              <path
                d="M48 0 L24 32 L24 96 L48 128"
                stroke="rgba(34, 197, 94, 0.3)"
                strokeWidth="1"
                fill="none"
              />
              <circle cx="24" cy="32" r="3" fill="rgba(34, 197, 94, 0.5)" />
              <circle cx="24" cy="64" r="3" fill="rgba(34, 197, 94, 0.5)" />
              <circle cx="24" cy="96" r="3" fill="rgba(34, 197, 94, 0.5)" />
            </svg>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
