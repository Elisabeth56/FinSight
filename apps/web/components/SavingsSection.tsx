"use client";

import { motion } from "framer-motion";
import { Lightbulb, DollarSign, ArrowRight, Sparkles } from "lucide-react";

const savingsCategories = [
  "Subscriptions",
  "Dining Out",
  "Transportation",
  "Shopping",
  "Entertainment",
  "Utilities",
  "Groceries",
  "Insurance",
  "Memberships",
];

export default function SavingsSection() {
  return (
    <section className="relative py-24 overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-dark-900 via-green-950/10 to-dark-900" />
      
      {/* Animated lines */}
      <div className="absolute inset-0 overflow-hidden opacity-20">
        <svg
          className="absolute w-full h-full"
          viewBox="0 0 1440 600"
          fill="none"
        >
          {[...Array(4)].map((_, i) => (
            <motion.path
              key={i}
              d={`M0 ${200 + i * 80} Q 360 ${150 + i * 80}, 720 ${200 + i * 80} T 1440 ${200 + i * 80}`}
              stroke="rgba(34, 197, 94, 0.3)"
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
        {/* Savings Report Demo */}
        <motion.div
          initial={{ opacity: 0, y: 60 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 1 }}
          className="relative mb-20"
        >
          {/* Monitor Frame */}
          <div className="relative mx-auto max-w-4xl">
            {/* Monitor Stand */}
            <div className="absolute -bottom-16 left-1/2 -translate-x-1/2 w-28 h-16 bg-gradient-to-b from-gray-700 to-gray-800 rounded-b-lg" />
            <div className="absolute -bottom-20 left-1/2 -translate-x-1/2 w-40 h-3 bg-gray-800 rounded-full" />
            
            {/* Monitor Screen */}
            <div className="relative bg-gray-900 rounded-2xl p-3 device-shadow">
              <div className="bg-dark-800 rounded-xl overflow-hidden">
                <div className="p-8">
                  {/* Content Grid */}
                  <div className="grid md:grid-cols-2 gap-8 items-center">
                    {/* Left - Text */}
                    <div>
                      <div className="flex items-center gap-2 mb-4">
                        <Lightbulb className="w-6 h-6 text-yellow-400" />
                        <h3 className="text-2xl font-bold text-white">
                          Savings Opportunity Report
                        </h3>
                      </div>
                      <p className="text-gray-400 text-sm mb-6">
                        AI-generated recommendations based on your spending patterns and similar users.
                      </p>

                      {/* Savings Summary */}
                      <div className="bg-gradient-to-br from-green-500/20 to-emerald-500/20 rounded-xl p-4 border border-green-500/30">
                        <p className="text-sm text-gray-300 mb-2">Potential monthly savings</p>
                        <p className="text-4xl font-bold text-green-400">$347</p>
                        <p className="text-xs text-gray-400 mt-1">Based on 12 optimization opportunities</p>
                      </div>
                    </div>

                    {/* Right - Category Pills */}
                    <div className="flex flex-wrap gap-2 justify-center">
                      {savingsCategories.map((category, index) => (
                        <motion.div
                          key={category}
                          initial={{ opacity: 0, scale: 0.8 }}
                          whileInView={{ opacity: 1, scale: 1 }}
                          viewport={{ once: true }}
                          transition={{ duration: 0.3, delay: index * 0.05 }}
                          className="px-3 py-1.5 rounded-full text-sm bg-dark-600 text-gray-300 border border-white/10"
                        >
                          {category}
                        </motion.div>
                      ))}
                      <motion.div
                        initial={{ opacity: 0, scale: 0.8 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.3, delay: savingsCategories.length * 0.05 }}
                        className="px-4 py-1.5 rounded-full text-sm bg-gradient-to-r from-green-500 to-emerald-400 text-dark-900 font-semibold"
                      >
                        View All
                      </motion.div>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Camera */}
              <div className="absolute top-5 left-1/2 -translate-x-1/2 w-3 h-3 bg-gray-700 rounded-full" />
            </div>
          </div>
        </motion.div>

        {/* Savings Tips Section */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="bg-gradient-to-br from-dark-700 to-dark-800 rounded-3xl p-8 md:p-12 border border-white/5"
        >
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Sparkles className="w-5 h-5 text-green-400" />
                <span className="text-green-400 text-sm font-medium">AI-Powered Insights</span>
              </div>
              <h3 className="text-3xl font-bold text-white mb-4">
                Personalized savings
                <br />
                recommendations
              </h3>
              <p className="text-gray-400 mb-6">
                FinSight analyzes your unique spending patterns and compares them against anonymized data from similar users to find specific, actionable ways to save.
              </p>
              <button className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-400 text-dark-900 rounded-full font-medium hover:from-green-400 hover:to-emerald-300 transition-all">
                Generate My Report
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>

            {/* Sample Savings Card */}
            <div className="space-y-4">
              {[
                {
                  icon: DollarSign,
                  title: "Cancel unused subscriptions",
                  desc: "You have 3 subscriptions with no activity in 60+ days",
                  savings: "$45/mo",
                },
                {
                  icon: DollarSign,
                  title: "Switch to generic brands",
                  desc: "Based on your grocery purchases",
                  savings: "$78/mo",
                },
                {
                  icon: DollarSign,
                  title: "Optimize dining frequency",
                  desc: "Eating out 2x less could save significantly",
                  savings: "$120/mo",
                },
              ].map((tip, index) => (
                <motion.div
                  key={tip.title}
                  initial={{ opacity: 0, x: 20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  className="flex items-start gap-4 p-4 bg-dark-600/50 rounded-xl border border-white/5"
                >
                  <div className="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center flex-shrink-0">
                    <tip.icon className="w-5 h-5 text-green-400" />
                  </div>
                  <div className="flex-1">
                    <h4 className="text-white font-medium">{tip.title}</h4>
                    <p className="text-sm text-gray-400">{tip.desc}</p>
                  </div>
                  <span className="text-green-400 font-bold">{tip.savings}</span>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
