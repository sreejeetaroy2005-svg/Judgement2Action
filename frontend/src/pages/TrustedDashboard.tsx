import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ShieldCheck,
  CalendarDays,
  ArrowRight,
  Loader2,
  Building2,
  AlertCircle,
  Clock,
  CheckCircle2,
} from 'lucide-react'
import {
  dashboardRows as dummyRows,
  type DashboardRow,
  type RiskLevel,
} from '../data/dummyData'
import { RiskBadge } from '../components/RiskBadge'

export function TrustedDashboard() {
  const [rows, setRows] = useState<DashboardRow[]>([])
  const [allCases, setAllCases] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    const fetchCases = async () => {
      try {
        const response = await fetch('https://judgement2action-1.onrender.com/cases')
        const data = await response.json()
        setAllCases(data)
        
        const mappedRows: DashboardRow[] = data.flatMap((c: any) => 
          (c.actions || []).map((a: any, idx: number) => ({
            id: c.id, // Keep original case ID
            actionId: `${c.id?.slice(0,8) || Math.random().toString(36).substr(2,9)}-${idx}`,
            caseName: c.case_title || "Untitled Judgment",
            department: a.department || "General",
            actionRequired: a.task,
            deadline: a.deadline,
            risk: (a.risk_level || 'Medium') as RiskLevel,
            status: c.status === 'approved' ? 'Approved' : 'Pending'
          }))
        )
        
        const approvedRows = mappedRows.filter(r => r.status === 'Approved')
        
        if (approvedRows.length === 0) {
          setRows(dummyRows.filter(r => r.status === 'Approved'))
        } else {
          setRows(approvedRows)
        }
      } catch (err) {
        console.error("Failed to fetch cases:", err)
        setRows(dummyRows.filter(r => r.status === 'Approved'))
      } finally {
        setLoading(false)
      }
    }

    fetchCases()
  }, [])

  const handleCardClick = (caseId: string) => {
    const caseData = allCases.find(c => c.id === caseId)
    if (caseData) {
      navigate('/verification', { 
        state: { 
          id: caseId, 
          caseData: caseData,
          fileName: caseData.file_name || 'Extracted Document'
        } 
      })
    } else {
      // Fallback for dummy data
      navigate('/verification', { state: { id: 'case-2024-1842' } })
    }
  }

  const groupedByDept = useMemo(() => {
    const groups: Record<string, DashboardRow[]> = {}
    rows.forEach(row => {
      if (!groups[row.department]) groups[row.department] = []
      groups[row.department].push(row)
    })
    return groups
  }, [rows])

  const stats = useMemo(() => {
    const highRisk = rows.filter(r => r.risk === 'High').length
    const depts = Object.keys(groupedByDept).length
    return { total: rows.length, highRisk, depts }
  }, [rows, groupedByDept])

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-10 w-10 animate-spin text-gov-blue" />
          <p className="text-slate-500 font-medium">Loading trusted decision-maker view...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-6xl space-y-10 py-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between border-b border-slate-200 pb-8">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 shadow-sm shadow-emerald-100">
              <ShieldCheck className="h-4 w-4" />
            </div>
            <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-widest">Verified Authority View</span>
          </div>
          <h1 className="text-4xl font-bold text-gov-navy font-display tracking-tight">Executive Compliance Summary</h1>
          <div className="mt-3 flex items-center gap-4">
            <p className="text-sm text-slate-500 max-w-lg leading-relaxed font-medium">
              Verified action plans extracted from official judgments. Structured data for strategic administrative oversight.
            </p>
            <div className="h-4 w-px bg-slate-300 hidden md:block" />
            <div className="hidden md:flex items-center gap-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              <Clock className="h-3 w-3" />
              Last Synced: {new Date().toLocaleTimeString()}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-6 bg-white px-8 py-5 rounded-3xl border border-slate-100 shadow-xl shadow-slate-200/50">
          <div className="text-center">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter mb-0.5">Approved</p>
            <p className="text-2xl font-black text-gov-navy leading-none">{stats.total}</p>
          </div>
          <div className="h-8 w-px bg-slate-100" />
          <div className="text-center">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter mb-0.5">High Risk</p>
            <p className="text-2xl font-black text-red-600 leading-none">{stats.highRisk}</p>
          </div>
          <div className="h-8 w-px bg-slate-100" />
          <div className="text-center">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter mb-0.5">Depts</p>
            <p className="text-2xl font-black text-gov-blue leading-none">{stats.depts}</p>
          </div>
        </div>
      </div>

      {/* Main Content: Grouped by Department */}
      <div className="grid gap-12">
        {Object.entries(groupedByDept).map(([dept, deptRows]) => (
          <section key={dept} className="relative">
            <div className="flex items-center gap-3 mb-6">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gov-navy/5 text-gov-navy">
                <Building2 className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gov-navy">{dept}</h2>
                <p className="text-xs font-medium text-slate-400">{deptRows.length} active obligation{deptRows.length > 1 ? 's' : ''}</p>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {deptRows.map((row) => (
                <div 
                  key={row.actionId} 
                  onClick={() => handleCardClick(row.id)}
                  className="group relative cursor-pointer overflow-hidden rounded-2xl bg-white border border-slate-200 p-6 transition-all hover:border-gov-blue hover:shadow-xl hover:shadow-gov-blue/5"
                >
                  {/* Risk Indicator Tag */}
                  <div className="absolute top-0 right-0 p-2">
                    <RiskBadge level={row.risk} />
                  </div>

                  <div className="mb-4">
                    <h3 className="text-sm font-bold text-slate-900 line-clamp-2 leading-snug group-hover:text-gov-blue transition-colors">
                      {row.caseName}
                    </h3>
                  </div>

                  <div className="space-y-4">
                    <div className="rounded-xl bg-slate-50 p-4 border border-slate-100">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
                        <AlertCircle className="h-3 w-3" />
                        Key Action Required
                      </p>
                      <p className="text-sm text-slate-700 font-medium leading-relaxed">
                        {row.actionRequired}
                      </p>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-slate-600">
                        <CalendarDays className="h-4 w-4 text-slate-400" />
                        <div>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Important Date</p>
                          <p className="text-xs font-mono font-bold text-slate-900">{row.deadline}</p>
                        </div>
                      </div>
                      
                      <button 
                        type="button"
                        onClick={(e) => { 
                          e.stopPropagation(); 
                          handleCardClick(row.id); 
                        }}
                        className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-50 text-slate-400 group-hover:bg-gov-blue group-hover:text-white transition-all shadow-sm focus:ring-2 focus:ring-gov-blue/20 outline-none"
                      >
                        <ArrowRight className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        ))}

        {rows.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 bg-white rounded-3xl border border-dashed border-slate-300">
            <div className="h-16 w-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
              <CheckCircle2 className="h-8 w-8 text-slate-300" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">No Approved Action Plans</h3>
            <p className="text-slate-500 text-sm">All pending judgments are currently under verification.</p>
          </div>
        )}
      </div>
    </div>
  )
}
