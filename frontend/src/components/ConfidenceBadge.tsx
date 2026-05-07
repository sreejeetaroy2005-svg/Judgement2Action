export function ConfidenceBadge({ value }: { value: number }) {
  return (
    <span
      className="inline-flex max-w-full shrink-0 items-center rounded border border-slate-200 bg-white px-2 py-0.5 text-xs font-medium tabular-nums text-slate-600 shadow-sm"
      title={`Model confidence: ${value}%`}
    >
      {value}% confidence
    </span>
  )
}
