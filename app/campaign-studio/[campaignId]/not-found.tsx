import Link from "next/link";
export default function NotFound() { return <main className="dashboard-content"><h1>Campaign not found</h1><p>This campaign does not exist or is outside your workspace.</p><Link href="/campaign-studio">Return to Campaign Studio</Link></main>; }
