"use client";

import { motion } from "framer-motion";
import { PieChart, TrendingUp, MessageSquare } from "lucide-react";

const mobileFeatures = [
  {
    icon: PieChart,
    title: "Smart Categories",
    description: "Auto-categorize every transaction instantly",
    gradient: "from-green-600 to-green-500",
  },
  {
    icon: TrendingUp,
    title: "Trend Insights",
    description: "Visualize spending patterns over time",
    gradient: "from-emerald-500 to-teal-500",
  },
  {
    icon: MessageSquare,
    title: "AI Assistant",
    description: "Ask questions about your finances naturally",
    gradient: "from-blue-500 to-cyan-500",
  },
];

export default function MobileShowcase() {
  return (
    <section className="relative py-24 overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-green-700 via-green-600 to-emerald-600" />
      
      {/* Wave lines background */}
      <div className="absolute inset-0 overflow-hidden opacity-30">
        <svg className="absolute w-full h-full" viewBox="0 0 1440 600" fill="none">
          {[...Array(6)].map((_, i) => (
            <motion.path
              key={i}
              d={`M-100 ${100 + i * 80} Q 300 ${50 + i * 80}, 600 ${100 + i * 80} T 1200 ${100 + i * 80} T 1800 ${100 + i * 80}`}
              stroke="rgba(255, 255, 255, 0.2)"
              strokeWidth="1"
              fill="none"
              initial={{ pathLength: 0 }}
              whileInView={{ pathLength: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 2, delay: i * 0.2 }}
            />
          ))}
        </svg>
      </div>

      <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col lg:flex-row items-center gap-16">
          {/* iPhone Mockup */}
          <motion.div
            initial={{ opacity: 0, x: -60 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 1 }}
            className="relative"
          >
            {/* Phone Frame */}
            <div className="relative w-72 h-[580px] bg-gray-900 rounded-[3rem] p-3 shadow-2xl">
              {/* Dynamic Island */}
              <div className="absolute top-4 left-1/2 -translate-x-1/2 w-24 h-6 bg-black rounded-full z-10" />
              
              {/* Screen */}
              <div className="w-full h-full bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 rounded-[2.5rem] overflow-hidden">
                {/* Status Bar */}
                <div className="flex items-center justify-between px-8 pt-14 pb-4">
                  <span className="text-white text-xs">9:41</span>
                  <div className="flex items-center gap-1">
                    <div className="w-4 h-2 bg-white/60 rounded-sm" />
                    <div className="w-1 h-2 bg-white/60 rounded-sm" />
                  </div>
                </div>

                {/* Content */}
                <div className="px-6 pt-4">
                  {/* Header */}
                  <h3 className="text-2xl font-bold text-white mb-2">
                    Your finances
                    <br />
                    in your pocket
                  </h3>
                  <p className="text-sm text-gray-400 mb-8">
                    Get instant insights anywhere with the FinSight mobile experience
                  </p>

                  {/* Feature Cards */}
                  <div className="space-y-3">
                    {mobileFeatures.map((feature, index) => (
                      <motion.div
                        key={feature.title}
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.5, delay: index * 0.1 }}
                        className={`bg-gradient-to-r ${feature.gradient} rounded-2xl p-4`}
                      >
                        <div className="flex items-start gap-3">
                          <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                            <feature.icon className="w-5 h-5 text-white" />
                          </div>
                          <div>
                            <h4 className="text-white font-semibold">
                              {feature.title}
                            </h4>
                            <p className="text-white/80 text-xs">
                              {feature.description}
                            </p>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Home Indicator */}
              <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-32 h-1 bg-white/50 rounded-full" />
            </div>

            {/* Phone Shadow */}
            <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 w-64 h-8 bg-black/20 blur-xl rounded-full" />
          </motion.div>

          {/* Decorative Element */}
          <motion.div
            initial={{ opacity: 0, rotate: -10 }}
            whileInView={{ opacity: 1, rotate: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 1, delay: 0.3 }}
            className="hidden lg:block absolute bottom-20 right-20"
          >
            {/* Decorative shape */}
            <div className="relative w-20 h-20">
              <div className="absolute inset-0 bg-gray-800 rounded-2xl rotate-45" />
              <div className="absolute inset-2 bg-gray-700 rounded-xl rotate-45" />
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
