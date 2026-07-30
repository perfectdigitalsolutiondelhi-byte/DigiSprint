"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { createClient } from "../../lib/supabase/client";

type AuthFormProps = { mode: "login" | "signup"; configured: boolean };

export function AuthForm({ mode, configured }: AuthFormProps) {
  const [status, setStatus] = useState<"idle" | "loading" | "sent" | "error">("idle");
  const [message, setMessage] = useState("");
  const isSignup = mode === "signup";

  async function handleEmail(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!configured) return;
    const formData = new FormData(event.currentTarget);
    const email = String(formData.get("email") ?? "").trim();
    const fullName = String(formData.get("fullName") ?? "").trim();
    setStatus("loading");
    setMessage("");
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
        data: isSignup ? { full_name: fullName } : undefined,
        shouldCreateUser: isSignup,
      },
    });
    if (error) {
      setStatus("error");
      setMessage(error.message);
      return;
    }
    setStatus("sent");
    setMessage(`Check ${email} for your secure sign-in link.`);
  }

  async function handleGoogle() {
    if (!configured) return;
    setStatus("loading");
    setMessage("");
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
    if (error) {
      setStatus("error");
      setMessage(error.message);
    }
  }

  return (
    <div className="auth-card">
      <div className="auth-card-heading">
        <span>{isSignup ? "Create your workspace" : "Welcome back"}</span>
        <h1>{isSignup ? "Start marketing with clarity." : "Continue your marketing day."}</h1>
        <p>{isSignup ? "Set up your DigiSprint account. Your business details come next." : "Sign in to access your daily posts, campaigns and AI tools."}</p>
      </div>
      {!configured && <div className="auth-notice" role="status">Authentication is ready for configuration. Add the Supabase public URL and anonymous key to enable sign-in.</div>}
      <button className="auth-google" disabled={!configured || status === "loading"} onClick={handleGoogle} type="button"><span aria-hidden="true">G</span> Continue with Google</button>
      <div className="auth-divider"><span>or use email</span></div>
      <form onSubmit={handleEmail}>
        {isSignup && <label>Full name<input autoComplete="name" disabled={!configured} name="fullName" placeholder="Your full name" required type="text" /></label>}
        <label>Work email<input autoComplete="email" disabled={!configured} name="email" placeholder="you@business.com" required type="email" /></label>
        <button className="auth-submit" disabled={!configured || status === "loading" || status === "sent"} type="submit">{status === "loading" ? "Please wait…" : status === "sent" ? "Link sent" : isSignup ? "Create account with email" : "Email me a sign-in link"}</button>
      </form>
      {message && <p className={`auth-message ${status}`} role="status">{message}</p>}
      <p className="auth-switch">{isSignup ? "Already have an account?" : "New to DigiSprint?"} <Link href={isSignup ? "/login" : "/signup"}>{isSignup ? "Sign in" : "Create an account"}</Link></p>
      <small>By continuing, you agree to use DigiSprint responsibly and accept our terms and privacy policy.</small>
    </div>
  );
}

