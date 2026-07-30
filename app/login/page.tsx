import type { Metadata } from "next";
import { AuthPage } from "../../components/auth/AuthPage";

export const metadata: Metadata = { title: "Sign in", description: "Sign in to your DigiSprint AI marketing workspace.", robots: { index: false, follow: false } };
export default function LoginPage() { return <AuthPage mode="login" />; }

