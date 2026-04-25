"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, Menu, X, TrendingUp } from "lucide-react";
import Link from "next/link";

const navItems = [
  { name: "Features", hasDropdown: true },
  { name: "How It Works", hasDropdown: false },
  { name: "Pricing", hasDropdown: false },
  { name: "Developers", hasDropdown: true },
  { name: "Resources", hasDropdown: true },
];

export default function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-dark-900/80 backdrop-blur-lg border-b border-white/5">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <nav className="flex items-center justify-between h-16 md:h-20">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-green-600 to-emerald-500 flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-white">FinSight</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-1">
            {navItems.map((item) => (
              <button
                key={item.name}
                className="flex items-center gap-1 px-3 py-2 text-sm text-gray-300 hover:text-white transition-colors"
              >
                {item.name}
                {item.hasDropdown && <ChevronDown className="w-4 h-4" />}
              </button>
            ))}
          </div>

          {/* CTA Buttons */}
          <div className="hidden md:flex items-center gap-3">
            <Link href="/signin">
             <button className="px-4 py-2 text-sm font-medium text-gray-300 hover:text-white transition-colors">
              Sign In
             </button>
            </Link>

            <Link href="/signup">
             <button className="px-5 py-2.5 text-sm font-medium text-dark-900 bg-gradient-to-r from-green-500 to-emerald-400 rounded-full hover:from-green-400 hover:to-emerald-300 transition-all duration-300 shadow-lg shadow-green-500/25">
              Get Started Free
             </button>
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? (
              <X className="w-6 h-6 text-white" />
            ) : (
              <Menu className="w-6 h-6 text-white" />
            )}
          </button>
        </nav>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="md:hidden absolute top-16 left-0 right-0 bg-dark-800 border-b border-white/5"
          >
            <div className="px-4 py-4 space-y-2">
              {navItems.map((item) => (
                <button
                  key={item.name}
                  className="flex items-center justify-between w-full px-3 py-2 text-gray-300"
                >
                  {item.name}
                  {item.hasDropdown && <ChevronDown className="w-4 h-4" />}
                </button>
              ))}
           <div className="pt-4 space-y-2">
            <Link href="/login">
             <button className="w-full px-4 py-2 text-sm font-medium text-gray-300 border border-white/10 rounded-full">
              Sign In
             </button>
            </Link>

            <Link href="/signup">
             <button className="w-full px-4 py-2 text-sm font-medium text-dark-900 bg-gradient-to-r from-green-500 to-emerald-400 rounded-full">
              Get Started Free
             </button>
            </Link>
             </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
