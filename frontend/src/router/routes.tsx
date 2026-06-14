import { createBrowserRouter, Navigate } from 'react-router-dom'
import { AppShell } from '@/components/layout/AppShell'
import Placeholder from '@/pages/Placeholder'
import WorkersPage from '@/pages/Workers'

export const router = createBrowserRouter([
  {
    path: '/', element: <AppShell />,
    children: [
      { index: true, element: <Navigate to="/workers" replace /> },
      { path: 'dashboard', element: <Placeholder title="Dashboard" /> },
      { path: 'customers', element: <Placeholder title="Khách hàng" /> },
      { path: 'sites', element: <Placeholder title="Công trường / Xưởng" /> },
      { path: 'workers', element: <WorkersPage /> },
      { path: 'projects', element: <Placeholder title="Dự án" /> },
      { path: 'quotes', element: <Placeholder title="Báo giá" /> },
      { path: 'quotes/:id/preview', element: <Placeholder title="Xem trước báo giá" /> },
      { path: 'assign', element: <Placeholder title="Giao việc Kanban" /> },
      { path: 'timesheet', element: <Placeholder title="Chấm công" /> },
      { path: 'report', element: <Placeholder title="Hiệu suất" /> },
    ],
  },
])
