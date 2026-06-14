import { create } from 'zustand'

interface MockUser { fullName: string; role: string; initials: string }

interface AppState {
  sidebarCollapsed: boolean
  toggleSidebar: () => void
  user: MockUser
}

export const useAppStore = create<AppState>((set) => ({
  sidebarCollapsed: false,
  toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
  user: { fullName: 'Mai Văn Hải', role: 'Quản lý xưởng', initials: 'MH' },
}))
