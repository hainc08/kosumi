import { Topbar } from './Topbar'
import './PageShell.css'

interface PageShellProps { title: string; subtitle?: string; actions?: React.ReactNode; children: React.ReactNode }

export function PageShell({ title, subtitle, actions, children }: PageShellProps) {
  return (
    <>
      <Topbar title={title} subtitle={subtitle} actions={actions} />
      <div className="page">{children}</div>
    </>
  )
}
