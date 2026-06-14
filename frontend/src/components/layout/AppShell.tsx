import { Outlet } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { Toast } from '@/components/ui/Toast'
import './AppShell.css'

export function AppShell() {
  return (
    <div className="shell">
      <Sidebar />
      <main className="shell__main"><Outlet /></main>
      <Toast />
    </div>
  )
}
