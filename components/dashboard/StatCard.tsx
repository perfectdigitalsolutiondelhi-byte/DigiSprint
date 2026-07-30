type StatCardProps = { label: string; value: string | number; detail: string; accent?: boolean };

export function StatCard({ label, value, detail, accent = false }: StatCardProps) {
  return <article className={`overview-stat${accent ? " accent" : ""}`}><span>{label}</span><strong>{value}</strong><p>{detail}</p></article>;
}
