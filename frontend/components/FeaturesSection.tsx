"use client";

import { motion } from "framer-motion";
import { PieChart, TrendingUp, MessageSquare, Lightbulb } from "lucide-react";

const features = [
  {
    icon: PieChart,
    title: "Smart Categorization",
    description: "AI automatically categorizes every transaction into meaningful spending categories",
    gradient: "from-green-600 to-green-500",
  },
  {
    icon: TrendingUp,
    title: "Trend Analysis",
    description: "Visualize monthly patterns and detect anomalies in your spending behavior",
    gradient: "from-emerald-500 to-teal-500",
  },
  {
    icon: MessageSquare,
    title: "AI Chat Interface",
    description: "Ask questions in plain English and get instant answers about your finances",
    gradient: "from-blue-500 to-cyan-500",
  },
  {
    icon: Lightbulb,
    title: "Savings Insights",
    description: "Get personalized recommendations to optimize spending and save more",
    gradient: "from-purple-500 to-violet-500",
  },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.6,
      ease: "easeOut",
    },
  },
};

export default function FeaturesSection() {
  return (
    <section className="relative py-24 bg-dark-800 overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 mesh-gradient" />
      <div className="animated-lines" />

      <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-16 items-start">
          {/* Left Side - Text */}
          <motion.div
            initial={{ opacity: 0, x: -40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <h2 className="text-4xl sm:text-5xl font-bold text-white leading-tight mb-6">
              Everything you need to
              <br />
              <span className="text-gradient">understand your money</span>
            </h2>
            <p className="text-lg text-gray-400 max-w-md">
              Transform raw bank data into actionable financial intelligence
              with AI-powered analysis and visualization.
            </p>
          </motion.div>

          {/* Right Side - Feature Cards */}
          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid sm:grid-cols-2 gap-4"
          >
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                variants={itemVariants}
                className={`relative group rounded-2xl p-6 bg-gradient-to-br ${feature.gradient} overflow-hidden`}
              >
                {/* Glow Effect */}
                <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                
                {/* Icon */}
                <div className="relative mb-4">
                  <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                    <feature.icon className="w-6 h-6 text-white" />
                  </div>
                </div>

                {/* Content */}
                <div className="relative">
                  <h3 className="text-lg font-semibold text-white mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-sm text-white/80">
                    {feature.description}
                  </p>
                </div>

                {/* Decorative Elements */}
                <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-white/10 rounded-full blur-2xl" />
              </motion.div>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  );
}
