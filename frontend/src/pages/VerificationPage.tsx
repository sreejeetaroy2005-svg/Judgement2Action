import type { ComponentType, ReactNode } from 'react'
import { useCallback, useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import {
  AlertTriangle,
  Briefcase,
  CheckCircle2,
  Clock,
  FileText,
  Loader2,
  Pencil,
  Pin,
  Scale,
  Users,
  XCircle,
} from 'lucide-react'
import { mainCaseViewByExtractId } from '../data/conflictData'
import { verificationExtract } from '../data/dummyData'
import { ConfidenceBadge } from '../components/ConfidenceBadge'
import { RiskBadge } from '../components/RiskBadge'

const HIGHLIGHT_MARK: Record<string, string> = {
  h1: 'bg-sky-200/80 text-sky-950 decoration-sky-600/50',
  h2: 'bg-amber-200/80 text-amber-950 decoration-amber-700/50',
  h3: 'bg-violet-200/75 text-violet-950 decoration-violet-700/50',
}

function SectionCard({
  title,
  icon: Icon,
  children,
}: {
  title: string
  icon: ComponentType<{ className?: string }>
  children: ReactNode
}) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <h3 className="mb-4 flex items-center gap-2 border-b border-slate-100 pb-3 text-sm font-semibold text-gov-navy">
        <Icon className="h-4 w-4 shrink-0 text-slate-500" aria-hidden />
        {title}
      </h3>
      {children}
    </section>
  )
}

function FieldBlock({
  label,
  confidence,
  value,
  editing,
  onChange,
  multiline,
}: {
  label: string
  confidence: number
  value: string
  editing: boolean
  onChange: (v: string) => void
  multiline?: boolean
}) {
  return (
    <div className="space-y-1.5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="text-xs font-medium uppercase tracking-wide text-slate-500">
          {label}
        </span>
        <ConfidenceBadge value={confidence} />
      </div>
      {editing ? (
        multiline ? (
          <textarea
            value={value}
            onChange={(e) => onChange(e.target.value)}
            rows={3}
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-gov-blue focus:outline-none focus:ring-2 focus:ring-gov-blue/20"
          />
        ) : (
          <input
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-gov-blue focus:outline-none focus:ring-2 focus:ring-gov-blue/20"
          />
        )
      ) : (
        <p className="text-sm leading-relaxed text-slate-800">{value}</p>
      )}
    </div>
  )
}

export function VerificationPage() {
  const location = useLocation()
  
  // Try to get state from navigation, fallback to localStorage
  const savedCase = localStorage.getItem('lastCase');
  const localState = savedCase ? JSON.parse(savedCase) : null;
  
  const state = (location.state as any) || localState;

  // Use real data from state if available, otherwise fallback to demo data
  const src = state?.caseData ? {
    id: state.id,
    caseDetails: {
      caseTitle: { value: state.caseData.case_title || 'Untitled Case', confidence: 0.95 },
      dateOfOrder: { value: state.caseData.date || 'Date not extracted', confidence: 0.98 }
    },
    parties: {
      petitioner: { value: state.caseData.parties?.[0] || 'Not identified', confidence: 0.92 },
      respondent: { value: state.caseData.parties?.[1] || 'Not identified', confidence: 0.92 }
    },
    // Use directive_sentences (exact court language) as the key directions
    keyDirections: (state.caseData.directive_sentences || state.caseData.orders || []).map(
      (d: string) => ({ text: d, confidence: 0.9 })
    ),
    // Use the structured deadlines array from the backend
    timelines: (state.caseData.deadlines || []).map((d: any) => ({
      text: typeof d === 'string' ? d : `${d.text}${d.associated_directive ? ' — ' + d.associated_directive : ''}`,
      confidence: 0.85
    })),
    actionPlan: (state.caseData.actions || []).map((a: any, i: number) => ({
      id: `action-${i}`,
      task: a.task,
      department: a.department || a.responsible_department || 'Concerned Department',
      deadline: a.deadline || 'Within statutory period',
      risk: a.risk_level || a.risk || 'MEDIUM',
      risk_level: a.risk_level || a.risk || 'MEDIUM',
      urgency_score: a.urgency_score || 5,
      reason: a.reason || 'Mandatory court directive.',
      what_if_delayed: a.what_if_delayed || 'May result in non-compliance and procedural default.',
      evidence_text: a.evidence_text || '',
      confidence: a.confidence || 0.85,
    })),
    // Use preview_summary if available, fallback to directive_sentences for the document preview
    previewSegments: (() => {
      const segments: string[] = state.caseData.preview_summary || state.caseData.directive_sentences || state.caseData.orders || []
      if (segments.length === 0) return [{ text: 'Analysis complete. Review the extracted fields below.' }]
      return segments.map((s: string) => ({ text: s }))
    })(),
    highlights: []
  } : verificationExtract;

  const mainCase = state?.caseData ? null : mainCaseViewByExtractId[src.id];
  const displayFile = state?.fileName ?? (src as any).documentFileName;
  const sourceLabel =
    state?.documentSource === 'scanned'
      ? 'Scanned'
      : state?.documentSource === 'digital'
        ? 'Digital'
        : null

  const [isEditing, setIsEditing] = useState(false)
  const [toastOpen, setToastOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  const [caseTitle, setCaseTitle] = useState(src.caseDetails.caseTitle.value)
  const [dateOfOrder, setDateOfOrder] = useState(
    src.caseDetails.dateOfOrder.value,
  )
  const [petitioner, setPetitioner] = useState(src.parties.petitioner.value)
  const [respondent, setRespondent] = useState(src.parties.respondent.value)
  const [directions, setDirections] = useState(
    src.keyDirections.map((d: any) => d.text),
  )
  const [timelineTexts, setTimelineTexts] = useState(
    src.timelines.map((t: any) => t.text),
  )

  const dismissToast = useCallback(() => setToastOpen(false), [])

  useEffect(() => {
    if (!toastOpen) return
    const t = window.setTimeout(dismissToast, 3500)
    return () => window.clearTimeout(t)
  }, [toastOpen, dismissToast])

  const updateDirection = (index: number, text: string) => {
    setDirections((prev) => {
      const next = [...prev]
      next[index] = text
      return next
    })
  }

  const updateTimeline = (index: number, text: string) => {
    setTimelineTexts((prev) => {
      const next = [...prev]
      next[index] = text
      return next
    })
  }

  const handleApprove = async () => {
    if (!state?.id) {
      setToastOpen(true)
      return
    }

    setLoading(true)
    try {
      const updatedData = {
        case_title: caseTitle,
        date: dateOfOrder,
        parties: [petitioner, respondent],
        directives: directions,
        deadlines: timelineTexts,
        actions: src.actionPlan // You could also make these editable if needed
      }

      const response = await fetch(`https://judgement2action-1.onrender.com/verify/${state.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'approved',
          ...updatedData
        })
      })

      if (!response.ok) throw new Error('Failed to approve')

      setToastOpen(true)
    } catch (error) {
      console.error('Approval error:', error)
      alert('Failed to save approval to database.')
    } finally {
      setLoading(false)
    }
  }

  const handleReject = async () => {
    if (!state?.id) return

    setLoading(true)
    try {
      await fetch(`https://judgement2action-1.onrender.com/verify/${state.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'rejected' })
      })
      window.alert('Data rejected and status updated in database.')
    } catch (error) {
      console.error('Reject error:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="relative space-y-8 pb-6">
      {toastOpen && (
        <div
          role="status"
          aria-live="polite"
          className="fixed bottom-6 right-4 z-50 flex max-w-sm items-center gap-3 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-900 shadow-lg sm:right-8"
        >
          <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600" />
          Approved successfully
        </div>
      )}

      <div className="flex flex-col gap-2 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Judgment2Action
          </p>
          <h2 className="text-2xl font-semibold text-gov-navy">
            Verify extracted data
          </h2>
          <p className="mt-1 max-w-2xl text-sm text-slate-600">
            Review AI-extracted fields and the proposed action plan. Confidence
            scores reflect model certainty only.
          </p>
        </div>
        <p className="text-xs text-slate-500">
          Matter ID:{' '}
          <span className="font-mono font-medium text-slate-700">{src.id}</span>
        </p>
      </div>

      {mainCase && (
        <section
          className="overflow-hidden rounded-xl border-2 border-red-200 bg-white shadow-md ring-1 ring-red-100"
          aria-label="Main case summary and conflict alert"
        >
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 bg-slate-50 px-4 py-3 text-sm">
            <span className="font-mono font-semibold text-slate-800">
              Case ID: {mainCase.caseIdLabel}
            </span>
            <span className="text-slate-600">
              Department:{' '}
              <span className="font-medium text-slate-900">
                {mainCase.department}
              </span>
            </span>
          </div>
          <div className="border-b border-dashed border-amber-200/80 bg-amber-50 px-4 py-3">
            <div className="flex flex-wrap items-center gap-3">
              <AlertTriangle
                className="h-5 w-5 shrink-0 text-amber-600"
                aria-hidden
              />
              <span className="text-sm font-bold uppercase tracking-wide text-amber-950">
                Conflict detected (deadline mismatch)
              </span>
              <Link
                to={`/conflicts/${mainCase.conflictDetailId}`}
                className="ml-auto text-sm font-semibold text-gov-blue underline-offset-2 hover:underline"
              >
                View details
              </Link>
            </div>
          </div>
          <div className="grid gap-0 sm:grid-cols-2">
            <div className="border-b border-dashed border-slate-200 p-4 sm:border-b-0 sm:border-r">
              <h4 className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                <FileText className="h-4 w-4 text-slate-500" aria-hidden />
                Judgment summary
              </h4>
              <ul className="list-inside list-disc space-y-1 text-sm text-slate-800">
                {mainCase.judgmentSummary.map((line, i) => (
                  <li key={i}>{line}</li>
                ))}
              </ul>
            </div>
            <div className="p-4">
              <h4 className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                <Pin className="h-4 w-4 text-red-500" aria-hidden />
                Key actions
              </h4>
              <ul className="list-inside list-disc space-y-1 text-sm text-slate-800">
                {mainCase.keyActions.map((line, i) => (
                  <li key={i}>{line}</li>
                ))}
              </ul>
            </div>
          </div>
        </section>
      )}

      <div className="flex flex-col gap-6 lg:flex-row lg:items-stretch">
        <div className="flex w-full flex-col gap-4 lg:w-[60%] lg:shrink-0">
          <SectionCard title="Case details" icon={Briefcase}>
            <div className="space-y-4">
              <FieldBlock
                label="Case title"
                confidence={src.caseDetails.caseTitle.confidence}
                value={caseTitle}
                editing={isEditing}
                onChange={setCaseTitle}
              />
              <FieldBlock
                label="Date of order"
                confidence={src.caseDetails.dateOfOrder.confidence}
                value={dateOfOrder}
                editing={isEditing}
                onChange={setDateOfOrder}
              />
            </div>
          </SectionCard>

          <SectionCard title="Parties involved" icon={Users}>
            <div className="space-y-4">
              <FieldBlock
                label="Petitioner"
                confidence={src.parties.petitioner.confidence}
                value={petitioner}
                editing={isEditing}
                onChange={setPetitioner}
              />
              <FieldBlock
                label="Respondent"
                confidence={src.parties.respondent.confidence}
                value={respondent}
                editing={isEditing}
                onChange={setRespondent}
              />
            </div>
          </SectionCard>

          <SectionCard title="Key directions / orders" icon={AlertTriangle}>
            <ul className="space-y-3">
              {directions.map((text, i) => (
                <li
                  key={i}
                  className="rounded-lg border border-slate-100 bg-slate-50/80 p-3"
                >
                  <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                    <span className="text-xs font-medium text-slate-500">
                      Order {i + 1}
                    </span>
                    <ConfidenceBadge
                      value={src.keyDirections[i]?.confidence ?? 0}
                    />
                  </div>
                  {isEditing ? (
                    <textarea
                      value={text}
                      onChange={(e) => updateDirection(i, e.target.value)}
                      rows={2}
                      className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 shadow-sm focus:border-gov-blue focus:outline-none focus:ring-2 focus:ring-gov-blue/20"
                    />
                  ) : (
                    <p className="pl-4 text-sm leading-relaxed text-slate-800 [text-indent:-1rem]">
                      • {text}
                    </p>
                  )}
                </li>
              ))}
            </ul>
          </SectionCard>

          <SectionCard title="Timelines" icon={Clock}>
            <ul className="space-y-3">
              {timelineTexts.length === 0 ? (
                <li className="rounded-lg border border-dashed border-slate-200 bg-slate-50/60 px-4 py-3 text-sm text-slate-400 italic text-center">
                  No explicit deadlines extracted from this judgment.
                </li>
              ) : timelineTexts.map((text, i) => {
                // Split off the associated_directive suffix if present
                const dashIdx = text.indexOf(' \u2014 ')
                const deadlineText = dashIdx > 0 ? text.slice(0, dashIdx) : text
                const associatedDirective = dashIdx > 0 ? text.slice(dashIdx + 3) : null
                return (
                  <li
                    key={i}
                    className="flex flex-col gap-1.5 rounded-lg border border-slate-100 bg-slate-50/80 px-3 py-2.5"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        {isEditing ? (
                          <textarea
                            value={text}
                            onChange={(e) => updateTimeline(i, e.target.value)}
                            rows={2}
                            className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-gov-blue focus:outline-none focus:ring-2 focus:ring-gov-blue/20"
                          />
                        ) : (
                          <p className="text-sm font-medium leading-snug text-slate-800">{deadlineText}</p>
                        )}
                      </div>
                      <ConfidenceBadge value={src.timelines[i]?.confidence ?? 0} />
                    </div>
                    {!isEditing && associatedDirective && (
                      <p className="text-[11px] leading-relaxed text-slate-500 italic border-l-2 border-slate-200 pl-2">
                        {associatedDirective.length > 160
                          ? associatedDirective.slice(0, 160).trimEnd() + '\u2026'
                          : associatedDirective}
                      </p>
                    )}
                  </li>
                )
              })}
            </ul>
          </SectionCard>
        </div>

        <aside className="flex w-full flex-col gap-6 lg:w-[40%] lg:min-w-0">
          {/* Document Preview */}
          <div className="flex h-fit flex-col rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <h3 className="text-sm font-semibold text-slate-900">
                Document Preview
              </h3>
              <div className="flex max-w-full flex-wrap items-center justify-end gap-2">
                {sourceLabel && (
                  <span className="shrink-0 rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600 ring-1 ring-slate-200">
                    {sourceLabel}
                  </span>
                )}
                <span className="max-w-[220px] truncate text-xs text-slate-500">
                  {displayFile}
                </span>
              </div>
            </div>

            <div className="relative min-h-[min(300px,35vh)] flex-1 overflow-hidden rounded-lg border border-slate-200 bg-slate-50">
              <div className="absolute inset-0 bg-[linear-gradient(to_bottom,transparent,rgba(148,163,184,0.05))]" />
              <div className="relative h-full overflow-y-auto p-5">
                <ol className="space-y-3 list-none">
                  {src.previewSegments.map((seg: any, idx: number) =>
                    seg.highlightId ? (
                      <li key={idx}>
                        <mark
                          className={`rounded-sm px-0.5 py-0 underline decoration-2 text-[13px] leading-[1.7] ${HIGHLIGHT_MARK[seg.highlightId] ?? 'bg-yellow-100'}`}
                        >
                          {seg.text}
                        </mark>
                      </li>
                    ) : (
                      <li key={idx} className="flex gap-2 text-[13px] leading-[1.7] text-slate-700">
                        <span className="shrink-0 mt-0.5 text-[10px] font-bold text-gov-blue/60 select-none">{idx + 1}.</span>
                        <span>{seg.text}</span>
                      </li>
                    ),
                  )}
                </ol>
              </div>
            </div>
          </div>

          {/* Similar Cases / Precedents (from Kaggle Dataset) */}
          <div className="flex flex-col rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center gap-2 border-b border-slate-100 pb-3">
              <Scale className="h-4 w-4 text-gov-blue" />
              <h3 className="text-sm font-semibold text-gov-navy uppercase tracking-wider">
                Relevant Legal Precedents
              </h3>
            </div>
            <div className="space-y-4">
              {(state?.caseData?.similar_cases || []).length > 0 ? (
                state.caseData.similar_cases.map((c: any, i: number) => (
                  <div key={i} className="rounded-lg border border-slate-100 bg-slate-50 p-3 space-y-2">
                    {/* Header: case ID + year + match % */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] font-bold text-gov-blue uppercase tracking-wide">{c.case_id}</span>
                        <span className="text-[10px] text-slate-400">·</span>
                        <span className="text-[10px] font-medium text-slate-500">{c.year}</span>
                      </div>
                      <span className="inline-flex items-center gap-0.5 rounded-full bg-emerald-50 px-2 py-0.5 text-[9px] font-bold text-emerald-700 ring-1 ring-emerald-200">
                        {(c.similarity * 100).toFixed(0)}% Match
                      </span>
                    </div>

                    {/* Case title */}
                    <p className="text-xs font-semibold text-slate-800 leading-snug">{c.title}</p>

                    {/* Directive snippet — clean, no raw string quotes */}
                    {c.relevant_directive && (
                      <div className="rounded border-l-2 border-gov-blue/50 bg-white pl-3 pr-2 py-2">
                        <p className="text-[10px] font-semibold text-gov-blue uppercase tracking-wide mb-1">Key Directive</p>
                        <p className="text-[11px] leading-relaxed text-slate-700">{c.relevant_directive}</p>
                      </div>
                    )}

                    {/* Historical action plan if available */}
                    {c.action_plan && c.action_plan !== 'No historical action plan available' && (
                      <p className="text-[10px] text-slate-500 italic pt-1">
                        Historical action: {c.action_plan}
                      </p>
                    )}
                  </div>
                ))
              ) : (
                <p className="text-xs text-slate-500 italic text-center py-4">
                  No similar precedents found in the Supreme Court dataset.
                </p>
              )}
            </div>
            <p className="mt-4 text-[9px] text-slate-400 italic">
              Powered by SC Judgments Dataset (1950-2024)
            </p>
          </div>
        </aside>
      </div>

      <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-6 border-b border-slate-100 pb-4">
          <h3 className="text-lg font-bold text-gov-navy font-display uppercase tracking-wider">
            AI Generated Strategic Action Plan
          </h3>
          <p className="text-sm text-slate-500 mt-1">
            Review the proposed actions based on the extracted legal directives.
          </p>
        </div>
        
        <div className="space-y-6">
          {src.actionPlan.map((action: any, idx: number) => (
            <div key={action.id || idx} className="rounded-xl border border-slate-200 overflow-hidden bg-slate-50/30">
              <div className="flex flex-col md:flex-row">
                <div className="flex-1 p-5 border-b md:border-b-0 md:border-r border-slate-200">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-gov-navy text-[10px] font-bold text-white">
                        {idx + 1}
                      </span>
                      <h4 className="font-bold text-gov-navy uppercase text-xs tracking-widest">Proposed Action</h4>
                    </div>
                    <div className="flex gap-2">
                      <RiskBadge level={action.risk_level || action.risk} />
                      <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 text-[10px] font-bold border border-slate-200">
                        Urgency: {action.urgency_score || 5}/10
                      </div>
                    </div>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-3">
                      <div className="group">
                        <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Task Description</label>
                        <p className="text-sm font-semibold text-slate-800">{action.task}</p>
                      </div>
                      <div className="group">
                        <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Responsible Entity</label>
                        <p className="text-sm text-slate-700">{action.department}</p>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <div className="group">
                        <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Strict Deadline</label>
                        <div className="flex items-center gap-1.5 text-sm font-mono font-bold text-red-600">
                          <Clock className="h-3.5 w-3.5" />
                          {action.deadline}
                        </div>
                      </div>
                      <div className="group">
                        <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Confidence Score</label>
                        <ConfidenceBadge value={action.confidence || 0.85} />
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 pt-4 border-t border-slate-100">
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div>
                        <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Reasoning</label>
                        <p className="text-xs text-slate-600 italic leading-relaxed">
                          {action.reason || 'Mandatory directive with legal compliance obligation.'}
                        </p>
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-red-400 uppercase mb-1 block underline decoration-red-200 decoration-2">Risk of Delay</label>
                        <p className="text-xs text-red-700 font-medium leading-relaxed">
                          {action.what_if_delayed || 'May result in non-compliance and procedural default.'}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="w-full md:w-[35%] bg-slate-50/80 p-5">
                  <div className="flex items-center gap-2 mb-3">
                    <Pin className="h-3.5 w-3.5 text-slate-400" />
                    <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Supporting Evidence</h4>
                  </div>
                  <div className="rounded-lg bg-white p-3 border border-slate-200 shadow-sm relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-1 h-full bg-gov-blue rounded-l-lg" />
                    {action.evidence_text ? (
                      <p className="text-[11px] leading-relaxed text-slate-700 pl-1">
                        {(() => {
                          const raw: string = action.evidence_text
                          const snippet = raw.slice(0, 200)
                          const stop = Math.max(snippet.lastIndexOf('. '), snippet.lastIndexOf('? '), snippet.lastIndexOf('! '))
                          return stop > 40 ? raw.slice(0, stop + 1) : (raw.length > 200 ? snippet.trimEnd() + '\u2026' : raw)
                        })()}
                      </p>
                    ) : (
                      <p className="text-[11px] leading-relaxed text-slate-400 italic pl-1">
                        No direct text extracted for this directive.
                      </p>
                    )}
                  </div>
                  <div className="mt-3 flex justify-end gap-2">
                    <button className="text-[10px] font-bold text-gov-blue hover:underline">Edit Action</button>
                    <button className="text-[10px] font-bold text-red-500 hover:underline">Reject</button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:justify-end border-t border-slate-100 pt-6">
          <button
            type="button"
            onClick={handleApprove}
            disabled={loading}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-600 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-emerald-200 hover:bg-emerald-700 hover:shadow-emerald-300 transition-all active:scale-95 disabled:opacity-50"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <CheckCircle2 className="h-4 w-4" />
            )}
            {loading ? 'Processing Approval...' : 'Approve & Finalize Plan'}
          </button>
          
          <button
            type="button"
            onClick={handleReject}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-white border border-red-200 px-6 py-3 text-sm font-bold text-red-600 hover:bg-red-50 transition-all active:scale-95"
          >
            <XCircle className="h-4 w-4" />
            Discard Analysis
          </button>
        </div>
      </section>
    </div>
  )
}
