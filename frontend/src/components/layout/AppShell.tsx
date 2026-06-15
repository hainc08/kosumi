import { Outlet } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { Toast } from '@/components/ui/Toast'
import { useAppStore } from '@/stores/appStore'
import './AppShell.css'

export function AppShell() {
  const { mobileNavOpen, closeMobileNav } = useAppStore()
  return (
    <div className="shell">
      <Sidebar />
      {mobileNavOpen && <div className="shell__backdrop" onClick={closeMobileNav} aria-hidden />}
      <main className="shell__main"><Outlet /></main>
      <Toast />
    </div>
  )
}
