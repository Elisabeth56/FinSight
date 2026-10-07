"use client";

import { Suspense, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";

import { authClient } from "@/lib/auth/client";
import { authFailure, authMessage } from "@/lib/auth/messages";
import { safeNext } from "@/lib/auth/redirect";
import { ErrorBanner, Field, GoogleButton, OrDivider, SubmitButton } from "../_components/AuthForm";

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const next = safeNext(params.get("next"));

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState<string | null>(authMessage(params.get("error")));

  async function signInWithEmail(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const failure = await authFailure(() => authClient.signIn.email({ email, password }));
    if (failure) {
      setError(failure);
      setLoading(false);
      return;
    }
    router.push(next);
    router.refresh();
  }

  async function signInWithGoogle() {
    setError(null);
    setGoogleLoading(true);
    // on success the browser leaves for Google and comes back to `next`
    const failure = await authFailure(() => authClient.signIn.social({ provider: "google", callbackURL: `${window.location.origin}${next}` }));
    if (failure) {
      setError(failure);
      setGoogleLoading(false);
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-1.5">
        <h1 className="text-2xl font-semibold tracking-[-0.02em]">Welcome back</h1>
        <p className="text-sm text-ink-2">Sign in to see where your money went.</p>
      </div>

      <GoogleButton onClick={signInWithGoogle} loading={googleLoading} label="Continue with Google" />
      <OrDivider />

      <form onSubmit={signInWithEmail} className="flex flex-col gap-4">
        <Field id="email" label="Email" type="email" value={email} onChange={setEmail} autoComplete="email" placeholder="you@example.com" />
        <Field id="password" label="Password" type="password" value={password} onChange={setPassword} autoComplete="current-password" />
        <ErrorBanner message={error} />
        <SubmitButton loading={loading}>Sign in</SubmitButton>
      </form>

      <p className="text-center text-sm text-ink-2">
        New here?{" "}
        <Link href="/signup" className="font-medium text-brand">
          Create an account
        </Link>
      </p>
    </div>
  );
}
