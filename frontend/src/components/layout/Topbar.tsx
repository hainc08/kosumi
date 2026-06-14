import { IconMenu2, IconSearch, IconBell, IconChevronDown } from '@tabler/icons-react'
import { useAppStore } from '@/stores/appStore'
import './Topbar.css'

interface TopbarProps { title: string; subtitle?: string; actions?: React.ReactNode }

export function Topbar({ title, subtitle, actions }: TopbarProps) {
  const { toggleSidebar, user } = useAppStore()
  return (
    <header className="topbar">
      <button className="topbar__menu" onClick={toggleSidebar} aria-label="Thu gọn menu"><IconMenu2 size={18} /></button>
      <div className="topbar__title">
        <span className="topbar__title-main">{title}</span>
        {subtitle && <span className="topbar__title-sub">· {subtitle}</span>}
      </div>
      <div className="topbar__right">
        {actions}
        <button className="topbar__icon" aria-label="Tìm kiếm"><IconSearch size={17} /></button>
        <button className="topbar__icon" aria-label="Thông báo"><IconBell size={17} /></button>
        <div className="topbar__user"><span className="topbar__avatar">{user.initials}</span><span className="topbar__role">{user.role}</span><IconChevronDown size={14} /></div>
      </div>
    </header>
  )
}
