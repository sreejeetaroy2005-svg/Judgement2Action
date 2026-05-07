import { useCallback, useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import {
  AlertTriangle,
  ArrowLeft,
  BookOpen,
  CheckCircle2,
  FileText,
  Gavel,
  Send,
} from 'lucide-react'
import {
  confidenceTier,
  getConflictDetail,
  type DeadlineConflictDetail,
  type MissingActionDetail,
} from '../data/conflictData'

function Toast({
  message,
  open,
}: {
  message: string
  open: boolean
}) {
  if (!open) return null
  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed bottom-6 right-4 z-50 flex max-w-sm items-center gap-3 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-900 shadow-lg sm:right-8"
    >
      <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600" />
      {message}
    </div>
  )
}

function DeadlineAnalysis({ data }: { data: DeadlineConflictDetail }) {
  const tier = confidenceTier(data.extractedConfidence)
  return (
    <>
      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
            <Gavel className="h-4 w-4 text-gov-navy" aria-hidden />
            Extracted from judgment
          </h3>
          <dl className="space-y-3 text-sm">
            <div>
              <dt className="text-xs font-medium text-slate-500">Deadline</dt>
              <dd className="mt-0.5 text-lg font-semibold tabular-nums text-slate-900">
                {data.extractedDeadlineDays} days
              </dd>
            </div>
            <div>
              <dt className="text-xs font-medium text-slate-500">Confidence</dt>
              <dd className="mt-0.5 font-medium text-slate-800">
                {data.extractedConfidence.toFixed(2)} ({tier})
              </dd>
            </div>
          </dl>
          <div className="mt-4 border-t border-slate-100 pt-4">
            <p className="mb-1 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-slate-500">
              <FileText className="h-3.5 w-3.5" aria-hidden />
              Source highlight
            </p>
            <blockquote className="rounded-md border border-amber-200/80 bg-amber-50/90 px-3 py-2 text-sm italic text-amber-950">
              “{data.sourceHighlight}”
            </blockquote>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
            <BookOpen className="h-4 w-4 text-gov-navy" aria-hidden />
            Rule-based expectation
          </h3>
          <dl className="space-y-3 text-sm">
            <div>
              <dt className="text-xs font-medium text-slate-500">
                Standard deadline
              </dt>
              <dd className="mt-0.5 text-lg font-semibold tabular-nums text-slate-900">
                {data.standardDeadlineDays} days
              </dd>
            </div>
            <div>
              <dt className="text-xs font-medium text-slate-500">Source</dt>
              <dd className="mt-0.5 font-medium text-slate-800">
                {data.ruleSource}
              </dd>
            </div>
          </dl>
        </div>
      </div>

      <div className="rounded-xl border border-amber-200 bg-amber-50/60 p-5 shadow-sm">
        <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold text-amber-950">
          <AlertTriangle className="h-4 w-4 shrink-0" aria-hidden />
          Conflict explanation
        </h3>
        <p className="text-sm leading-relaxed text-amber-950/90">
          {data.explanationLead}
        </p>
        <p className="mt-3 text-sm">
          <span className="font-semibold text-amber-950">Possible reason: </span>
          <span className="text-amber-900/90">{data.possibleReason}</span>
        </p>
      </div>
    </>
  )
}

function MissingActionAnalysis({ data }: { data: MissingActionDetail }) {
  return (
    <>
      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
            Expected workflow
          </h3>
          <p className="text-sm font-medium leading-relaxed text-slate-900">
            {data.expectedAction}
          </p>
          <div className="mt-4 border-t border-slate-100 pt-4">
            <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
              Source highlight
            </p>
            <blockquote className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm italic text-slate-700">
              “{data.sourceHighlight}”
            </blockquote>
          </div>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
            Extracted summary
          </h3>
          <p className="text-sm leading-relaxed text-slate-800">
            {data.extractedObservation}
          </p>
        </div>
      </div>

      <div className="rounded-xl border border-amber-200 bg-amber-50/60 p-5 shadow-sm">
        <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold text-amber-950">
          <AlertTriangle className="h-4 w-4 shrink-0" aria-hidden />
          Issue explanation
        </h3>
        <p className="text-sm leading-relaxed text-amber-950/90">
          {data.explanationLead}
        </p>
        <p className="mt-3 text-sm">
          <span className="font-semibold text-amber-950">Possible reason: </span>
          <span className="text-amber-900/90">{data.possibleReason}</span>
        </p>
      </div>
    </>
  )
}

export function ConflictDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const data = id ? getConflictDetail(id) : undefined

  const [toastOpen, setToastOpen] = useState(false)
  const [toastMessage, setToastMessage] = useState('')

  const dismissToast = useCallback(() => setToastOpen(false), [])

  useEffect(() => {
    if (!toastOpen) return
    const t = window.setTimeout(dismissToast, 3500)
    return () => window.clearTimeout(t)
  }, [toastOpen, dismissToast])

  if (!data) {
    return (
      <div className="mx-auto max-w-lg rounded-xl border border-slate-200 bg-white p-8 text-center shadow-sm">
        <p className="text-sm text-slate-600">Conflict record not found.</p>
        <Link
          to="/dashboard"
          className="mt-4 inline-flex text-sm font-semibold text-gov-blue hover:underline"
        >
          Return to dashboard
        </Link>
      </div>
    )
  }

  const isDeadline = data.issueType === 'Deadline Conflict'
  const bannerTitle = isDeadline
    ? 'Conflict detected (deadline mismatch)'
    : 'Attention: missing action detected'

  const handleApprove = () => {
    if (isDeadline) {
      setToastMessage(
        `Approved: using court-specified deadline (${data.extractedDeadlineDays} days).`,
      )
    } else {
      setToastMessage('Approved: action plan updated with required filing.')
    }
    setToastOpen(true)
  }

  const handleEditDeadline = () => {
    if (!isDeadline) {
      window.alert('Use the verification editor to add or adjust tasks (demo).')
      return
    }
    const raw = window.prompt(
      'Enter appeal deadline in days (e.g. 30, 40, or custom note)',
      String(data.standardDeadlineDays),
    )
    if (raw === null) return
    window.alert(`Saved for review: “${raw}” (demo — no persistence).`)
  }

  const handleEscalate = () => {
    window.alert(
      'Escalated to senior legal reviewer. A notification would be sent in production (demo).',
    )
  }

  return (
    <div className="relative mx-auto max-w-4xl space-y-6 pb-8">
      <Toast message={toastMessage} open={toastOpen} />

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-1.5 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden />
          Back
        </button>
        <Link
          to="/dashboard"
          className="text-sm font-medium text-gov-blue hover:underline"
        >
          Dashboard
        </Link>
      </div>

      <div
        className={`rounded-lg px-4 py-3 shadow-md sm:px-5 ${
          data.risk === 'High'
            ? 'bg-red-600 text-white ring-2 ring-red-800/40'
            : 'bg-amber-500 text-amber-950 ring-2 ring-amber-700/30'
        }`}
        role="alert"
      >
        <div className="flex flex-wrap items-center gap-2">
          <AlertTriangle className="h-5 w-5 shrink-0" aria-hidden />
          <span className="text-sm font-bold uppercase tracking-wide">
            {bannerTitle}
          </span>
          <span className="ml-auto flex items-center gap-2">
            <span className="text-xs font-medium opacity-90">
              {data.caseIdLabel}
            </span>
            <span
              className={`rounded-md px-2 py-0.5 text-xs font-bold ${
                data.risk === 'High'
                  ? 'bg-white/20 text-white'
                  : 'bg-amber-950/15 text-amber-950'
              }`}
            >
              {data.risk} risk
            </span>
          </span>
        </div>
      </div>

      <div className="flex flex-wrap items-end justify-between gap-3 border-b border-slate-200 pb-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Deadline conflict analysis
          </p>
          <h1 className="text-2xl font-semibold text-gov-navy">
            Judgment2Action review
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Department:{' '}
            <span className="font-medium text-slate-800">{data.department}</span>
            {' · '}
            Issue:{' '}
            <span className="font-medium text-slate-800">{data.issueType}</span>
          </p>
        </div>
      </div>

      {isDeadline ? (
        <DeadlineAnalysis data={data} />
      ) : (
        <MissingActionAnalysis data={data} />
      )}

      <div className="rounded-xl border border-emerald-200 bg-emerald-50/70 p-5 shadow-sm">
        <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-emerald-950">
          <CheckCircle2 className="h-4 w-4" aria-hidden />
          Recommended action
        </h3>
        <ul className="space-y-2 text-sm text-emerald-950/95">
          <li className="flex gap-2">
            <span className="text-emerald-600" aria-hidden>
              ✔
            </span>
            <span>{data.recommendationPrimary}</span>
          </li>
          <li className="flex gap-2">
            <span className="text-amber-600" aria-hidden>
              ⚠
            </span>
            <span>{data.recommendationSecondary}</span>
          </li>
        </ul>
        <div className="mt-4 rounded-md border border-emerald-200/80 bg-white/80 px-3 py-2 text-xs text-slate-700">
          <span className="font-semibold text-slate-800">Risk: </span>
          {data.riskNote}
        </div>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:justify-end">
        <button
          type="button"
          onClick={handleApprove}
          className="inline-flex items-center justify-center gap-2 rounded-md bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white shadow-md ring-2 ring-emerald-800/25 hover:bg-emerald-700"
        >
          <CheckCircle2 className="h-4 w-4" aria-hidden />
          Approve
        </button>
        <button
          type="button"
          onClick={handleEditDeadline}
          className="inline-flex items-center justify-center gap-2 rounded-md bg-amber-400 px-4 py-2.5 text-sm font-semibold text-amber-950 shadow-sm hover:bg-amber-500"
        >
          {isDeadline ? 'Edit deadline' : 'Edit action plan'}
        </button>
        <button
          type="button"
          onClick={handleEscalate}
          className="inline-flex items-center justify-center gap-2 rounded-md bg-slate-800 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-slate-900"
        >
          <Send className="h-4 w-4" aria-hidden />
          Escalate
        </button>
      </div>
    </div>
  )
}
