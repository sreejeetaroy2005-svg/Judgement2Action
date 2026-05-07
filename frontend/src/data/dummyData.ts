export type RiskLevel = 'High' | 'Medium' | 'Low'

export interface FieldConfidence {
  value: string
  confidence: number
}

/** Structured extraction shown on the verification page after PDF processing */
export interface VerificationExtract {
  id: string
  documentFileName: string
  caseDetails: {
    caseTitle: FieldConfidence
    dateOfOrder: FieldConfidence
  }
  parties: {
    petitioner: FieldConfidence
    respondent: FieldConfidence
  }
  keyDirections: { text: string; confidence: number }[]
  timelines: { text: string; confidence: number }[]
  highlights: {
    id: string
    label: string
    topPercent: number
    heightPercent: number
  }[]
  /** Inline preview segments; those with highlightId map to explainability legend */
  previewSegments: {
    text: string
    highlightId?: string
  }[]
  actionPlan: {
    id: string
    task: string
    department: string
    deadline: string
    risk: RiskLevel
  }[]
}

export interface DashboardRow {
  id: string
  caseName: string
  department: string
  actionRequired: string
  deadline: string
  risk: RiskLevel
  status: 'Approved' | 'Pending'
}

export const verificationExtract: VerificationExtract = {
  id: 'case-2024-1842',
  documentFileName: 'Administrative_Order_2024-1842.pdf',
  caseDetails: {
    caseTitle: {
      value: 'Dept. of Environmental Affairs v. Northfield Utilities Co.',
      confidence: 92,
    },
    dateOfOrder: { value: 'March 14, 2024', confidence: 85 },
  },
  parties: {
    petitioner: {
      value: 'Dept. of Environmental Affairs',
      confidence: 88,
    },
    respondent: {
      value: 'Northfield Utilities Co.',
      confidence: 91,
    },
  },
  keyDirections: [
    {
      text: 'Respondent shall submit a revised remediation plan within 45 days of this order.',
      confidence: 87,
    },
    {
      text: 'All discharge monitoring shall comply with Schedule A sampling frequencies.',
      confidence: 83,
    },
    {
      text: 'Quarterly compliance reports must be filed with the regional office.',
      confidence: 76,
    },
  ],
  timelines: [
    {
      text: 'Initial compliance filing required within 30 days of service of this order.',
      confidence: 90,
    },
    {
      text: 'Appeal of this decision may be filed within 90 days under Administrative Rule 7.4.',
      confidence: 82,
    },
    {
      text: 'Site inspection and verification to be completed within 60 days of plan approval.',
      confidence: 74,
    },
  ],
  highlights: [
    { id: 'h1', label: 'Case caption', topPercent: 6, heightPercent: 12 },
    { id: 'h2', label: 'Orders', topPercent: 38, heightPercent: 18 },
    { id: 'h3', label: 'Timelines', topPercent: 62, heightPercent: 14 },
  ],
  previewSegments: [
    { text: 'IN THE MATTER OF: ', highlightId: 'h1' },
    {
      text: 'Dept. of Environmental Affairs v. Northfield Utilities Co.',
      highlightId: 'h1',
    },
    {
      text: ' — Administrative Order No. 2024-1842, dated March 14, 2024. ',
    },
    {
      text: 'IT IS HEREBY ORDERED that respondent shall submit a revised remediation plan within 45 days.',
      highlightId: 'h2',
    },
    {
      text: ' Monitoring shall follow Schedule A. ',
    },
    {
      text: 'Appeal may be filed within 90 days pursuant to applicable rules.',
      highlightId: 'h3',
    },
    {
      text: ' Compliance filings are due within 30 days of service.',
      highlightId: 'h3',
    },
  ],
  actionPlan: [
    {
      id: 'ap1',
      task: 'Prepare and file revised remediation plan',
      department: 'Environmental Compliance',
      deadline: '2024-04-28',
      risk: 'High',
    },
    {
      id: 'ap2',
      task: 'Update discharge monitoring procedures',
      department: 'Operations',
      deadline: '2024-05-15',
      risk: 'Medium',
    },
    {
      id: 'ap3',
      task: 'Schedule joint site inspection',
      department: 'Field Services',
      deadline: '2024-05-10',
      risk: 'Low',
    },
    {
      id: 'ap4',
      task: 'Draft Q1 compliance report template',
      department: 'Legal & Reporting',
      deadline: '2024-06-20',
      risk: 'Low',
    },
  ],
}

export const dashboardStats = {
  totalCases: 128,
  highRiskCases: 14,
  upcomingDeadlines: 23,
}

export const dashboardRows: DashboardRow[] = [
  {
    id: '1',
    caseName: 'Dept. of Environmental Affairs v. Northfield Utilities Co.',
    department: 'Environmental Compliance',
    actionRequired: 'File remediation plan',
    deadline: '2024-04-28',
    risk: 'High',
    status: 'Pending',
  },
  {
    id: '2',
    caseName: 'State Housing Authority — In re: Willow Creek',
    department: 'Housing Programs',
    actionRequired: 'Submit affordability audit',
    deadline: '2024-05-02',
    risk: 'Medium',
    status: 'Approved',
  },
  {
    id: '3',
    caseName: 'Regional Transit Board Order 2023-09',
    department: 'Transportation',
    actionRequired: 'Safety mitigation checklist',
    deadline: '2024-05-18',
    risk: 'Low',
    status: 'Pending',
  },
  {
    id: '4',
    caseName: 'Public Health — Laboratory Certification Appeal',
    department: 'Public Health',
    actionRequired: 'Respond to findings letter',
    deadline: '2024-04-30',
    risk: 'High',
    status: 'Pending',
  },
  {
    id: '5',
    caseName: 'Dept. of Revenue — Tax Settlement Agreement',
    department: 'Finance',
    actionRequired: 'Execute payment schedule',
    deadline: '2024-06-01',
    risk: 'Medium',
    status: 'Approved',
  },
  {
    id: '6',
    caseName: 'Workforce Development Grant Oversight',
    department: 'Labor & Workforce',
    actionRequired: 'Quarterly performance metrics',
    deadline: '2024-05-25',
    risk: 'Low',
    status: 'Approved',
  },
]

export const departments = [
  'All departments',
  ...Array.from(new Set(dashboardRows.map((r) => r.department))).sort(),
]

export const riskLevels: (RiskLevel | 'All')[] = ['All', 'High', 'Medium', 'Low']
