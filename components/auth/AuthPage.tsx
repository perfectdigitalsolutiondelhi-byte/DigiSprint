import Link from "next/link";
import { AuthForm } from "./AuthForm";
import { Brand } from "../ui/Brand";
import { isSupabaseConfigured } from "../../lib/supabase/config";

export function AuthPage({ mode }: { mode: "login" | "signup" }) {
  return (
    <main className="auth-page">
      <section className="auth-story">
        <Brand />
        <div>
          <p className="ai-eyebrow"><span />Built for Indian business owners</p>
          <h2>Make marketing one less thing to worry about.</h2>
          <p>A focused workspace for daily content, important festivals and practical growth—personalised to your business.</p>
          <ul><li><span>01</span>One secure account</li><li><span>02</span>Your business context stays connected</li><li><span>03</span>Content built around your goals</li></ul>
        </div>
        <p className="auth-story-note">DigiSprint · AI marketing made practical</p>
      </section>
      <section className="auth-panel">
        <Link className="auth-back" href="/">? Back to DigiSprint</Link>
        <AuthForm mode={mode} configured={isSupabaseConfigured()} />
      </section>
    </main>
  );
}

