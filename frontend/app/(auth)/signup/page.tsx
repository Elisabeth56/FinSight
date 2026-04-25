"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { CheckCircle2 } from "lucide-react";

import { createClient } from "@/lib/supabase/client";
import {
  AuthForm,
  ErrorBanner,
  Field,
  GoogleButton,
  OrDivider,
  SubmitButton,
} from "../_components/AuthForm";

export default function SignupPage() {
  const router = useRouter();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [needsConfirm, setNeedsConfirm] = useState(false);

  async function handleEmailSignup(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    setLoading(true);
    const supabase = createClient();
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName },
        emailRedirectTo: `${window.location.origin}/callback`,
      },
    });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    // Supabase returns a session only if email confirmation is disabled.
    if (data.session) {
      router.push("/dashboard");
      router.refresh();
    } else {
      setNeedsConfirm(true);
      setLoading(false);
    }
  }

  async function handleGoogle() {
    setError(null);
    setGoogleLoading(true);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/callback?next=/dashboard`,
      },
    });
    if (error) {
      setError(error.message);
      setGoogleLoading(false);
    }
  }

  /* ---------- email-confirmation success state ---------- */
  if (needsConfirm) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center"
      >
        <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-green-500/20 flex items-center justify-center">
          <CheckCircle2 className="w-8 h-8 text-green-400" />
        </div>
        <h1 className="text-2xl font-bold text-white mb-2">Check your inbox</h1>
        <p className="text-sm text-gray-400 mb-8">
          We sent a confirmation link to{" "}
          <span className="text-white font-medium">{email}</span>. Click it to
          activate your account and start using FinSight.
        </p>
        <Link
          href="/login"
          className="inline-block px-6 py-3 rounded-xl bg-white/10 hover:bg-white/15
                     border border-white/10 text-white text-sm font-medium transition-colors"
        >
          Back to sign in
        </Link>
      </motion.div>
    );
  }

  /* ---------- form ---------- */
  return (
    <div>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="mb-8"
      >
        <h1 className="text-3xl font-bold text-white mb-2">
          Create your account
        </h1>
        <p className="text-sm text-gray-400">
          Start understanding your money in seconds.
        </p>
      </motion.div>

      <div className="space-y-4">
        <GoogleButton
          onClick={handleGoogle}
          loading={googleLoading}
          label="Sign up with Google"
        />

        <OrDivider />

        <AuthForm onSubmit={handleEmailSignup}>
          <Field
            id="full_name"
            label="Full name"
            value={fullName}
            onChange={setFullName}
            placeholder="Jane Doe"
            autoComplete="name"
            required
          />
          <Field
            id="email"
            label="Email"
            type="email"
            value={email}
            onChange={setEmail}
            placeholder="you@example.com"
            autoComplete="email"
            required
          />
          <Field
            id="password"
            label="Password"
            type="password"
            value={password}
            onChange={setPassword}
            placeholder="At least 8 characters"
            autoComplete="new-password"
            required
          />

          <ErrorBanner message={error} />

          <SubmitButton loading={loading}>Create account</SubmitButton>

          <p className="text-xs text-gray-500 text-center pt-2">
            By continuing you agree to our{" "}
            <Link href="#" className="text-gray-400 hover:text-gray-300 underline underline-offset-2">
              Terms
            </Link>{" "}
            and{" "}
            <Link href="#" className="text-gray-400 hover:text-gray-300 underline underline-offset-2">
              Privacy Policy
            </Link>
            .
          </p>
        </AuthForm>
      </div>

      <p className="mt-8 text-center text-sm text-gray-400">
        Already have an account?{" "}
        <Link
          href="/login"
          className="text-green-400 hover:text-green-300 font-medium"
        >
          Sign in
        </Link>
      </p>
    </div>
  );
}
