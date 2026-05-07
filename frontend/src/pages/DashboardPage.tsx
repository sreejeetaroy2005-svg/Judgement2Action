import { useEffect, useMemo, useState, ComponentType } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  AlertTriangle,
  CalendarClock,
  CheckCircle2,
  Clock,
  FolderOpen,
  Filter,
  Loader2,
  Siren,
} from 'lucide-react'
import { highPriorityIssues } from '../data/conflictData'
import {
  dashboardRows as dummyRows,
  departments as dummyDepts,
  riskLevels,
  type DashboardRow,
  type RiskLevel,
} from '../data/dummyData'
import { RiskBadge } from '../components/RiskBadge'

function StatCard({
  title,
  value,
  icon: Icon,
  accent,
}: {
  title: string
  value: number
  icon: ComponentType<{ className?: string }>
  accent: string
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            {title}
          </p>
          <p className="mt-2 text-3xl font-semibold tabular-nums text-gov-navy">
            {value}
          </p>
        </div>
        <div
          className={`flex h-11 w-11 items-center justify-center rounded-lg ${accent}`}
        >
          <Icon className="h-5 w-5 text-white" aria-hidden />
        </div>
      </div>
    </div>
  )
}

function StatusPill({ status }: { status: DashboardRow['status'] }) {
  const cls =
    status === 'Approved'
      ? 'bg-emerald-100 text-emerald-900 ring-emerald-200'
      : 'bg-slate-100 text-slate-800 ring-slate-200'
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset ${cls}`}
    >
      {status}
    </span>
  )
}

export function DashboardPage() {
  const [dept, setDept] = useState('All departments')
  const [risk, setRisk] = useState<(typeof riskLevels)[number]>('All')
  const [statusFilter, setStatusFilter] = useState('All')
  const [rows, setRows] = useState<DashboardRow[]>([])
  const [allCases, setAllCases] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    const fetchCases = async () => {
      try {
        const response = await fetch('http://localhost:8000/cases')
        const data = await response.json()
        setAllCases(data)
        
        const mappedRows: DashboardRow[] = data.flatMap((c: any) => 
          (c.actions || []).map((a: any, idx: number) => ({
            id: `${c.id}-${idx}`,
            caseName: c.case_title || "Untitled Judgment",
            department: a.department || "General",
            actionRequired: a.task,
            deadline: a.deadline,
            risk: (a.risk_level || 'Medium') as RiskLevel,
            status: c.status === 'approved' ? 'Approved' : 'Pending'
          }))
        )
        
        if (mappedRows.length === 0) {
          setRows(dummyRows)
        } else {
          setRows(mappedRows)
        }
      } catch (err) {
        console.error("Failed to fetch cases:", err)
        setRows(dummyRows)
      } finally {
        setLoading(false)
      }
    }

    fetchCases()
  }, [])

  const filtered = useMemo(() => {
    return rows.filter((row) => {
      const deptOk = dept === 'All departments' || row.department === dept
      const riskOk = risk === 'All' || row.risk === risk
      const statusOk = statusFilter === 'All' || row.status === statusFilter
      return deptOk && riskOk && statusOk
    })
  }, [rows, dept, risk, statusFilter])

  const stats = useMemo(() => {
    const highRisk = rows.filter(r => r.risk === 'High').length
    const verified = rows.filter(r => r.status === 'Approved').length
    const pending = rows.filter(r => r.status === 'Pending').length
    return { highRisk, verified, pending, total: rows.length }
  }, [rows])

  const dynamicDepts = useMemo(() => {
    const unique = Array.from(new Set(rows.map(r => r.department)))
    return ['All departments', ...unique.sort()]
  }, [rows])

  const handleRowClick = (row: DashboardRow) => {
    const caseId = row.id.split('-')[0]
    const caseData = allCases.find(c => c.id === caseId)
    
    if (caseData) {
      navigate('/verification', { 
        state: { 
          id: caseId, 
          caseData: caseData,
          fileName: caseData.file_name || 'Extracted Document'
        } 
      })
    } else if (['1','2','3','4','5','6'].includes(caseId)) {
      navigate('/verification', { state: { id: 'case-2024-1842' } })
    }
  }

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-gov-blue" />
        <span className="ml-2 text-slate-500">Loading live dashboard data...</span>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-gov-navy font-display">Compliance Dashboard</h2>
          <p className="mt-1 text-sm text-slate-500">
            Real-time tracking of legal obligations and administrative actions.
          </p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1 bg-emerald-50 text-emerald-700 rounded-full border border-emerald-100 text-xs font-medium">
          <CheckCircle2 className="h-3 w-3" />
          System Active
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-4">
        <StatCard
          title="Total matters"
          value={stats.total}
          icon={FolderOpen}
          accent="bg-gov-navy"
        />
        <StatCard
          title="High risk"
          value={stats.highRisk}
          icon={AlertTriangle}
          accent="bg-red-600"
        />
        <StatCard
          title="Verified"
          value={stats.verified}
          icon={CheckCircle2}
          accent="bg-emerald-600"
        />
        <StatCard
          title="Pending"
          value={stats.pending}
          icon={Clock}
          accent="bg-amber-500"
        />
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center gap-2 text-sm font-bold text-slate-800 uppercase tracking-wider">
            <Filter className="h-4 w-4 text-slate-400" />
            Filter Matters
          </div>
          <div className="flex flex-wrap gap-4">
            <div className="flex flex-col gap-1.5">
              <span className="text-[10px] font-bold uppercase text-slate-400">Department</span>
              <select
                value={dept}
                onChange={(e) => setDept(e.target.value)}
                className="min-w-[180px] rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm focus:ring-2 focus:ring-gov-blue/20 outline-none transition-all"
              >
                {dynamicDepts.map((d) => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
            <div className="flex flex-col gap-1.5">
              <span className="text-[10px] font-bold uppercase text-slate-400">Risk Level</span>
              <select
                value={risk}
                onChange={(e) => setRisk(e.target.value as RiskLevel | 'All')}
                className="min-w-[120px] rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm focus:ring-2 focus:ring-gov-blue/20 outline-none transition-all"
              >
                {riskLevels.map((r) => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
            <div className="flex flex-col gap-1.5">
              <span className="text-[10px] font-bold uppercase text-slate-400">Status</span>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="min-w-[120px] rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm focus:ring-2 focus:ring-gov-blue/20 outline-none transition-all"
              >
                <option value="All">All Status</option>
                <option value="Approved">Verified</option>
                <option value="Pending">Pending</option>
              </select>
            </div>
          </div>
        </div>

        <div className="overflow-hidden rounded-lg border border-slate-200">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50/50">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-widest">Case Matter</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-widest">Department</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-widest">Action Item</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-widest">Deadline</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-widest">Risk</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-widest">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {filtered.map((row) => (
                <tr 
                  key={row.id} 
                  onClick={() => handleRowClick(row)}
                  className="hover:bg-slate-50/50 transition-colors cursor-pointer group"
                >
                  <td className="px-6 py-4">
                    <div className="text-sm font-semibold text-gov-navy group-hover:text-gov-blue">{row.caseName}</div>
                    <div className="text-[10px] font-mono text-slate-400 mt-0.5">{row.id}</div>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-600">{row.department}</td>
                  <td className="px-6 py-4 text-sm text-slate-700 max-w-xs truncate">{row.actionRequired}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-1.5 text-xs font-mono font-medium text-slate-600">
                      <CalendarClock className="h-3.5 w-3.5 text-slate-400" />
                      {row.deadline}
                    </div>
                  </td>
                  <td className="px-6 py-4"><RiskBadge level={row.risk} /></td>
                  <td className="px-6 py-4"><StatusPill status={row.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
