"use client";

import { useState, type FormEvent, type ReactNode } from "react";
import { motion } from "framer-motion";
import { AlertCircle, Eye, EyeOff, Loader2 } from "lucide-react";

/* ---------- Google button ---------- */
export function GoogleButton({
  onClick,
  loading,
  label,
}: {
  onClick: () => void;
  loading?: boolean;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={loading}
      className="w-full flex items-center justify-center gap-3 py-3 px-4 rounded-xl
                 bg-white/5 hover:bg-white/10 border border-white/10
                 text-white font-medium text-sm
                 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {loading ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : (
        <GoogleIcon />
      )}
      <span>{label}</span>
    </button>
  );
}

function GoogleIcon() {
  return (
    <svg className="w-4 h-4" viewBox="0 0 24 24" aria-hidden>
      <path
        fill="#EA4335"
        d="M12 10.2v3.8h5.3c-.2 1.4-1.6 4-5.3 4-3.2 0-5.8-2.6-5.8-5.9s2.6-5.9 5.8-5.9c1.8 0 3 .8 3.7 1.4l2.5-2.4C16.6 3.7 14.5 2.8 12 2.8 6.9 2.8 2.8 6.9 2.8 12S6.9 21.2 12 21.2c6.7 0 9-4.7 9-7.2 0-.5-.1-.9-.1-1.3H12z"
      />
      <path
        fill="#34A853"
        d="M12 21.2c2.5 0 4.6-.8 6.1-2.2l-3-2.3c-.8.6-1.9 1-3.1 1-2.4 0-4.4-1.6-5.1-3.8H3.8v2.4c1.5 3 4.7 4.9 8.2 4.9z"
      />
      <path
        fill="#FBBC05"
        d="M6.9 13.9c-.2-.6-.3-1.2-.3-1.9s.1-1.3.3-1.9V7.7H3.8C3.2 9 2.8 10.4 2.8 12s.4 3 1 4.3l3.1-2.4z"
      />
      <path
        fill="#4285F4"
        d="M12 6.2c1.4 0 2.6.5 3.5 1.4l2.6-2.6C16.6 3.6 14.5 2.8 12 2.8 8.5 2.8 5.3 4.7 3.8 7.7l3.1 2.4c.7-2.2 2.7-3.9 5.1-3.9z"
      />
    </svg>
  );
}

/* ---------- divider ---------- */
export function OrDivider() {
  return (
    <div className="relative my-6">
      <div className="absolute inset-0 flex items-center">
        <div className="w-full border-t border-white/10" />
      </div>
      <div className="relative flex justify-center text-xs">
        <span className="bg-dark-900 px-3 text-gray-500 uppercase tracking-wider">
          or continue with email
        </span>
      </div>
    </div>
  );
}

/* ---------- text input ---------- */
export function Field({
  label,
  id,
  type = "text",
  value,
  onChange,
  placeholder,
  autoComplete,
  required,
}: {
  label: string;
  id: string;
  type?: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  autoComplete?: string;
  required?: boolean;
}) {
  const [show, setShow] = useState(false);
  const isPassword = type === "password";
  const inputType = isPassword ? (show ? "text" : "password") : type;

  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="block text-sm text-gray-300 font-medium">
        {label}
      </label>
      <div className="relative">
        <input
          id={id}
          type={inputType}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          autoComplete={autoComplete}
          required={required}
          className="w-full px-4 py-3 rounded-xl bg-dark-800 border border-white/10
                     text-white placeholder-gray-500 text-sm
                     focus:outline-none focus:border-green-500/50 focus:ring-2 focus:ring-green-500/20
                     transition-colors"
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setShow((s) => !s)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300"
            tabIndex={-1}
            aria-label={show ? "Hide password" : "Show password"}
          >
            {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        )}
      </div>
    </div>
  );
}

/* ---------- primary submit ---------- */
export function SubmitButton({
  loading,
  children,
}: {
  loading?: boolean;
  children: ReactNode;
}) {
  return (
    <button
      type="submit"
      disabled={loading}
      className="w-full py-3 px-4 rounded-xl font-medium text-sm
                 text-dark-900 bg-gradient-to-r from-green-500 to-emerald-400
                 hover:from-green-400 hover:to-emerald-300
                 shadow-lg shadow-green-500/25
                 disabled:opacity-60 disabled:cursor-not-allowed
                 transition-all flex items-center justify-center gap-2"
    >
      {loading && <Loader2 className="w-4 h-4 animate-spin" />}
      {children}
    </button>
  );
}

/* ---------- error banner ---------- */
export function ErrorBanner({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-start gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/20"
    >
      <AlertCircle className="w-4 h-4 text-red-400 mt-0.5 flex-shrink-0" />
      <p className="text-sm text-red-300">{message}</p>
    </motion.div>
  );
}

/* ---------- generic form wrapper with stagger-in ---------- */
export function AuthForm({
  onSubmit,
  children,
}: {
  onSubmit: (e: FormEvent) => void;
  children: ReactNode;
}) {
  return (
    <motion.form
      onSubmit={onSubmit}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-4"
    >
      {children}
    </motion.form>
  );
}
