import { NavLink } from 'react-router-dom'
import {
  IconLayoutDashboard, IconUsersGroup, IconBuildingFactory2, IconUsers,
  IconBuilding, IconFileInvoice, IconColumns, IconClock, IconChartBar,
} from '@tabler/icons-react'
import { useAppStore } from '@/stores/appStore'
import './Sidebar.css'

interface NavItem { to: string; label: string; icon: React.ReactNode; group: string; ready: boolean }
const NAV: NavItem[] = [
  { to: '/dashboard', label: 'Dashboard', icon: <IconLayoutDashboard size={17} />, group: 'Tổng quan', ready: false },
  { to: '/customers', label: 'Khách hàng', icon: <IconUsersGroup size={17} />, group: 'Quản lý', ready: true },
  { to: '/sites', label: 'Công trường / Xưởng', icon: <IconBuildingFactory2 size={17} />, group: 'Quản lý', ready: false },
  { to: '/workers', label: 'Công nhân', icon: <IconUsers size={17} />, group: 'Quản lý', ready: true },
  { to: '/projects', label: 'Dự án', icon: <IconBuilding size={17} />, group: 'Quản lý', ready: true },
  { to: '/quotes', label: 'Báo giá', icon: <IconFileInvoice size={17} />, group: 'Quản lý', ready: true },
  { to: '/assign', label: 'Giao việc', icon: <IconColumns size={17} />, group: 'Sản xuất', ready: true },
  { to: '/timesheet', label: 'Chấm công', icon: <IconClock size={17} />, group: 'Sản xuất', ready: true },
  { to: '/report', label: 'Hiệu suất', icon: <IconChartBar size={17} />, group: 'Báo cáo', ready: false },
]

export function Sidebar() {
  const { sidebarCollapsed, user } = useAppStore()
  const groups = [...new Set(NAV.map((n) => n.group))]
  return (
    <aside className={`sidebar ${sidebarCollapsed ? 'sidebar--collapsed' : ''}`}>
      <div className="sidebar__brand">{sidebarCollapsed ? 'WS' : 'WorkShop Pro'}</div>
      <nav className="sidebar__nav">
        {groups.map((g) => (
          <div key={g} className="sidebar__group">
            {!sidebarCollapsed && <span className="sidebar__group-label">{g}</span>}
            {NAV.filter((n) => n.group === g).map((n) => (
              <NavLink key={n.to} to={n.to}
                className={({ isActive }) => `sidebar__item ${isActive ? 'sidebar__item--active' : ''} ${!n.ready ? 'sidebar__item--soon' : ''}`}
                title={n.label}>
                {n.icon}{!sidebarCollapsed && <span>{n.label}</span>}
              </NavLink>
            ))}
          </div>
        ))}
      </nav>
      <div className="sidebar__user">
        <span className="sidebar__avatar">{user.initials}</span>
        {!sidebarCollapsed && <div><div className="sidebar__user-name">{user.fullName}</div><div className="sidebar__user-role">{user.role}</div></div>}
      </div>
    </aside>
  )
}
