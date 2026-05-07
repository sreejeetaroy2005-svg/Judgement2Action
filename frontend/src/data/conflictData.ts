import type { RiskLevel } from './dummyData'

export type ConflictIssueType = 'Deadline Conflict' | 'Missing Action'

export interface HighPriorityIssue {
  caseId: string
  issue: ConflictIssueType
  risk: RiskLevel
  detailId: string
}

export interface DeadlineConflictDetail {
  id: string
  caseIdLabel: string
  department: string
  issueType: 'Deadline Conflict'
  risk: RiskLevel
  extractedDeadlineDays: number
  extractedConfidence: number
  sourceHighlight: string
  standardDeadlineDays: number
  ruleSource: string
  explanationLead: string
  possibleReason: string
  recommendationPrimary: string
  recommendationSecondary: string
  riskNote: string
}

export interface MissingActionDetail {
  id: string
  caseIdLabel: string
  department: string
  issueType: 'Missing Action'
  risk: RiskLevel
  expectedAction: string
  extractedObservation: string
  sourceHighlight: string
  explanationLead: string
  possibleReason: string
  recommendationPrimary: string
  recommendationSecondary: string
  riskNote: string
}

export type ConflictDetail = DeadlineConflictDetail | MissingActionDetail

export const highPriorityIssues: HighPriorityIssue[] = [
  {
    caseId: '2024/HC/1234',
    issue: 'Deadline Conflict',
    risk: 'High',
    detailId: '2024-HC-1234',
  },
  {
    caseId: '2024/HC/5678',
    issue: 'Missing Action',
    risk: 'Medium',
    detailId: '2024-HC-5678',
  },
]

export const conflictDetailsById: Record<string, ConflictDetail> = {
  '2024-HC-1234': {
    id: '2024-HC-1234',
    caseIdLabel: '2024/HC/1234',
    department: 'Legal',
    issueType: 'Deadline Conflict',
    risk: 'High',
    extractedDeadlineDays: 40,
    extractedConfidence: 0.91,
    sourceHighlight: '…file appeal within 40 days…',
    standardDeadlineDays: 30,
    ruleSource: 'Limitation Rule',
    explanationLead:
      'The court-specified deadline (40 days) differs from the standard rule (30 days).',
    possibleReason: 'Court has granted extended time in this case.',
    recommendationPrimary: 'Follow court-specified deadline (40 days).',
    recommendationSecondary: 'Flag for legal verification.',
    riskNote:
      'Using the wrong deadline could prejudice appeal rights or trigger non-compliance.',
  },
  '2024-HC-5678': {
    id: '2024-HC-5678',
    caseIdLabel: '2024/HC/5678',
    department: 'Operations',
    issueType: 'Missing Action',
    risk: 'Medium',
    expectedAction:
      'Notice of appearance and preliminary response within 14 days of service.',
    extractedObservation:
      'No explicit filing obligation detected in the extracted obligations list.',
    sourceHighlight: '…parties shall confer on scheduling within 10 days…',
    explanationLead:
      'Standard workflow requires an early filing that was not surfaced as a structured action.',
    possibleReason:
      'OCR gap, non-standard order wording, or conditional trigger not evaluated.',
    recommendationPrimary: 'Add “File notice of appearance” to the action plan.',
    recommendationSecondary: 'Re-run extraction with legal ruleset B.',
    riskNote: 'Missing the filing may result in default or waived defenses.',
  },
}

/** Main case strip on verification (Screen 1 style) keyed by extract id */
export const mainCaseViewByExtractId: Record<
  string,
  {
    caseIdLabel: string
    department: string
    conflictDetailId: string
    judgmentSummary: string[]
    keyActions: string[]
  }
> = {
  'case-2024-1842': {
    caseIdLabel: '2024/HC/1234',
    department: 'Legal',
    conflictDetailId: '2024-HC-1234',
    judgmentSummary: [
      'Appeal to be filed within 40 days',
      'State is respondent',
    ],
    keyActions: ['File Appeal', 'Prepare documents'],
  },
}

export function getConflictDetail(id: string): ConflictDetail | undefined {
  return conflictDetailsById[id]
}

export function confidenceTier(
  c: number,
): 'High' | 'Medium' | 'Low' {
  if (c >= 0.85) return 'High'
  if (c >= 0.65) return 'Medium'
  return 'Low'
}
