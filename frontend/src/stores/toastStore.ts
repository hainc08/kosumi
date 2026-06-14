import { create } from 'zustand'

export type ToastType = 'success' | 'error' | 'info'
interface ToastState {
  message: string | null
  type: ToastType
  show: (message: string, type?: ToastType) => void
  hide: () => void
}

export const useToastStore = create<ToastState>((set) => ({
  message: null,
  type: 'success',
  show: (message, type = 'success') => {
    set({ message, type })
    setTimeout(() => set({ message: null }), 3000)
  },
  hide: () => set({ message: null }),
}))
