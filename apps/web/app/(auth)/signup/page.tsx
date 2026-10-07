"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { authClient } from "@/lib/auth/client";
import { authFailure, authMessage } from "@/lib/auth/messages";
import { ErrorBanner, Field, GoogleButton, OrDivider, SubmitButton } from "../_components/AuthForm";

const MIN_PASSWORD = 8;

export default function SignupPage() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function signUpWithEmail(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (password.length < MIN_PASSWORD) {
      setError(authMessage("weak_password"));
      return;
    }
    setLoading(true);
    const failure = await authFailure(() => authClient.signUp.email({ name, email, password }));
    if (failure) {
      setError(failure);
      setLoading(false);
      return;
    }
    router.push("/dashboard");
    router.refresh();
  }

  async function signUpWithGoogle() {
    setError(null);
    setGoogleLoading(true);
    const failure = await authFailure(() => authClient.signIn.social({ provider: "google", callbackURL: `${window.location.origin}/dashboard` }));
    if (failure) {
      setError(failure);
      setGoogleLoading(false);
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-1.5">
        <h1 className="text-2xl font-semibold tracking-[-0.02em]">Create your account</h1>
        <p className="text-sm text-ink-2">One statement in, and you&apos;ll see every naira sorted.</p>
      </div>

      <GoogleButton onClick={signUpWithGoogle} loading={googleLoading} label="Sign up with Google" />
      <OrDivider />

      <form onSubmit={signUpWithEmail} className="flex flex-col gap-4">
        <Field id="name" label="Name" value={name} onChange={setName} autoComplete="name" />
        <Field id="email" label="Email" type="email" value={email} onChange={setEmail} autoComplete="email" placeholder="you@example.com" />
        <Field id="password" label="Password" type="password" value={password} onChange={setPassword} autoComplete="new-password" placeholder="At least 8 characters" />
        <ErrorBanner message={error} />
        <SubmitButton loading={loading}>Create account</SubmitButton>
      </form>

      <p className="text-center text-sm text-ink-2">
        Already have an account?{" "}
        <Link href="/login" className="font-medium text-brand">
          Sign in
        </Link>
      </p>
    </div>
  );
}
