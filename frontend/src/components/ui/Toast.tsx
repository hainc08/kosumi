import { IconCheck, IconAlertTriangle, IconInfoCircle } from '@tabler/icons-react'
import { useToastStore } from '@/stores/toastStore'
import './Toast.css'

export function Toast() {
  const { message, type } = useToastStore()
  if (!message) return null
  const Icon = type === 'success' ? IconCheck : type === 'error' ? IconAlertTriangle : IconInfoCircle
  return (
    <div className={`toast toast--${type}`}>
      <Icon size={16} /><span>{message}</span>
    </div>
  )
}
