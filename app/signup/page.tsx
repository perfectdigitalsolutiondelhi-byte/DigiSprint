import type { Metadata } from "next";
import { AuthPage } from "../../components/auth/AuthPage";

export const metadata: Metadata = { title: "Create account", description: "Create your DigiSprint AI marketing workspace.", robots: { index: false, follow: false } };
export default function SignupPage() { return <AuthPage mode="signup" />; }

