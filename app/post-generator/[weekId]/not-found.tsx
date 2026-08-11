import Link from "next/link";
export default function NotFound() { return <main className="dashboard-content"><h1>Approved week not found</h1><p>This week is unavailable, not approved, or belongs to another workspace.</p><Link href="/post-generator">Back to Post Generator</Link></main>; }
