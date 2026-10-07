"use client";

import { Suspense, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";

import { createClient } from "@/lib/supabase/client";
import {
  AuthForm,
  ErrorBanner,
  Field,
  GoogleButton,
  OrDivider,
  SubmitButton,
} from "../_components/AuthForm";

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginContent />
    </Suspense>
  );
}

function LoginContent() {
  const router = useRouter();
  const params = useSearchParams();
  const nextPath = params.get("next") || "/dashboard";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleEmailLogin(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    router.push(nextPath);
    router.refresh();
  }

  async function handleGoogle() {
    setError(null);
    setGoogleLoading(true);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/callback?next=${encodeURIComponent(nextPath)}`,
      },
    });
    if (error) {
      setError(error.message);
      setGoogleLoading(false);
    }
    // on success the browser is redirected away — no further action here
  }

  return (
    <div>
      {/* heading */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="mb-8"
      >
        <h1 className="text-3xl font-bold text-white mb-2">Welcome back</h1>
        <p className="text-sm text-gray-400">
          Sign in to keep exploring your finances.
        </p>
      </motion.div>

      <div className="space-y-4">
        <GoogleButton
          onClick={handleGoogle}
          loading={googleLoading}
          label="Continue with Google"
        />

        <OrDivider />

        <AuthForm onSubmit={handleEmailLogin}>
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

          <div>
            <Field
              id="password"
              label="Password"
              type="password"
              value={password}
              onChange={setPassword}
              placeholder="••••••••"
              autoComplete="current-password"
              required
            />
            <div className="mt-2 text-right">
              <Link
                href="/forgot-password"
                className="text-xs text-green-400 hover:text-green-300"
              >
                Forgot password?
              </Link>
            </div>
          </div>

          <ErrorBanner message={error} />

          <SubmitButton loading={loading}>Sign in</SubmitButton>
        </AuthForm>
      </div>

      <p className="mt-8 text-center text-sm text-gray-400">
        Don&apos;t have an account?{" "}
        <Link
          href="/signup"
          className="text-green-400 hover:text-green-300 font-medium"
        >
          Sign up
        </Link>
      </p>
    </div>
  );
}
