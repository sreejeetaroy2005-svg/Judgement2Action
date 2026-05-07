import type { RiskLevel } from '../data/dummyData'

const styles: Record<RiskLevel, string> = {
  High: 'bg-red-100 text-red-800 ring-red-200',
  Medium: 'bg-amber-100 text-amber-900 ring-amber-200',
  Low: 'bg-emerald-100 text-emerald-900 ring-emerald-200',
}

export function RiskBadge({ level }: { level: RiskLevel }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset ${styles[level]}`}
    >
      {level}
    </span>
  )
}
