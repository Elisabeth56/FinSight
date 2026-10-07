"use client";

import { useState, type ReactNode } from "react";

/** Google sign-in, a quiet surface pill above the email form. */
export function GoogleButton({ onClick, loading, label }: { onClick: () => void; loading?: boolean; label: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={loading}
      className="flex h-12 w-full items-center justify-center gap-3 rounded-full bg-sunk text-sm font-medium text-ink transition-colors duration-200 ease-ui hover:bg-paper disabled:opacity-60"
    >
      <GoogleIcon />
      {loading ? "Opening Google…" : label}
    </button>
  );
}

function GoogleIcon() {
  return (
    <svg className="size-4" viewBox="0 0 24 24" aria-hidden>
      <path fill="#EA4335" d="M12 10.2v3.8h5.3c-.2 1.4-1.6 4-5.3 4-3.2 0-5.8-2.6-5.8-5.9s2.6-5.9 5.8-5.9c1.8 0 3 .8 3.7 1.4l2.5-2.4C16.6 3.7 14.5 2.8 12 2.8 6.9 2.8 2.8 6.9 2.8 12S6.9 21.2 12 21.2c6.7 0 9-4.7 9-7.2 0-.5-.1-.9-.1-1.3H12z" />
      <path fill="#34A853" d="M12 21.2c2.5 0 4.6-.8 6.1-2.2l-3-2.3c-.8.6-1.9 1-3.1 1-2.4 0-4.4-1.6-5.1-3.8H3.8v2.4c1.5 3 4.7 4.9 8.2 4.9z" />
      <path fill="#FBBC05" d="M6.9 13.9c-.2-.6-.3-1.2-.3-1.9s.1-1.3.3-1.9V7.7H3.8C3.2 9 2.8 10.4 2.8 12s.4 3 1 4.3l3.1-2.4z" />
      <path fill="#4285F4" d="M12 6.2c1.4 0 2.6.5 3.5 1.4l2.6-2.6C16.6 3.6 14.5 2.8 12 2.8 8.5 2.8 5.3 4.7 3.8 7.7l3.1 2.4c.7-2.2 2.7-3.9 5.1-3.9z" />
    </svg>
  );
}

export function OrDivider() {
  return (
    <div className="flex items-center gap-3 text-xs text-ink-3">
      <span className="h-px flex-1 bg-line" />
      or with email
      <span className="h-px flex-1 bg-line" />
    </div>
  );
}

type FieldProps = {
  label: string;
  id: string;
  type?: string;
  value: string;
  onChange: (v: string) => void;
  autoComplete?: string;
  placeholder?: string;
};

export function Field({ label, id, type = "text", value, onChange, autoComplete, placeholder }: FieldProps) {
  const [shown, setShown] = useState(false);
  const isPassword = type === "password";
  return (
    <label htmlFor={id} className="flex flex-col gap-1.5 text-sm">
      <span className="font-medium text-ink-2">{label}</span>
      <span className="relative">
        <input
          id={id}
          type={isPassword && shown ? "text" : type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onBlur={(e) => !isPassword && onChange(e.target.value.trim())}
          autoComplete={autoComplete}
          placeholder={placeholder}
          required
          className="h-12 w-full rounded-md border border-line bg-paper px-4 text-[15px] text-ink placeholder:text-ink-4 focus:border-brand focus:outline-none"
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setShown((s) => !s)}
            className="absolute inset-y-0 right-3 my-auto h-8 rounded-full px-2 text-xs text-ink-3 hover:text-ink"
          >
            {shown ? "Hide" : "Show"}
          </button>
        )}
      </span>
    </label>
  );
}

export function ErrorBanner({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <p role="alert" className="rounded-xl bg-sunk px-4 py-3 text-sm text-danger">
      {message}
    </p>
  );
}

export function SubmitButton({ loading, children }: { loading?: boolean; children: ReactNode }) {
  return (
    <button
      type="submit"
      disabled={loading}
      className="h-12 w-full rounded-full bg-brand text-sm font-medium text-on-brand transition-[transform,box-shadow] duration-200 ease-ui hover:-translate-y-0.5 disabled:translate-y-0 disabled:opacity-60"
    >
      {loading ? "One moment…" : children}
    </button>
  );
}
