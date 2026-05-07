import { NavLink, Outlet } from 'react-router-dom'
import { Scale, LayoutDashboard, FileUp, ClipboardCheck, ShieldCheck } from 'lucide-react'

const navClass = ({ isActive }: { isActive: boolean }) =>
  [
    'inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors',
    isActive
      ? 'bg-slate-200 text-gov-navy'
      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900',
  ].join(' ')

export function Layout() {
  return (
    <div className="flex min-h-screen flex-col bg-slate-100 font-sans text-slate-800">
      <header className="border-b border-slate-200 bg-white shadow-sm">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gov-navy text-white">
              <Scale className="h-5 w-5" aria-hidden />
            </div>
            <div className="text-left">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Official Use
              </p>
              <h1 className="text-lg font-semibold text-gov-navy">
                Judgment2Action
              </h1>
            </div>
          </div>
          <nav
            className="flex flex-wrap items-center gap-1"
            aria-label="Primary"
          >
            <NavLink to="/" end className={navClass}>
              <FileUp className="h-4 w-4 shrink-0" aria-hidden />
              Upload
            </NavLink>
            {localStorage.getItem('lastCase') && (
              <NavLink to="/verification" className={navClass}>
                <ClipboardCheck className="h-4 w-4 shrink-0" aria-hidden />
                Verification
              </NavLink>
            )}
            <NavLink to="/dashboard" className={navClass}>
              <LayoutDashboard className="h-4 w-4 shrink-0" aria-hidden />
              Dashboard
            </NavLink>
            <NavLink to="/trusted-view" className={navClass}>
              <ShieldCheck className="h-4 w-4 shrink-0" aria-hidden />
              Trusted View
            </NavLink>
          </nav>
        </div>
      </header>
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 sm:px-6 lg:px-8">
        <Outlet />
      </main>
      <footer className="border-t border-slate-200 bg-white py-4 text-center text-xs text-slate-500">
        Judgment2Action — Document workflow prototype. Demo data only.
      </footer>
    </div>
  )
}
