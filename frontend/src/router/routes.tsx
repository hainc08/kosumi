import { createBrowserRouter, Navigate } from 'react-router-dom'
import { AppShell } from '@/components/layout/AppShell'
import Placeholder from '@/pages/Placeholder'
import WorkersPage from '@/pages/Workers'
import CustomersPage from '@/pages/Customers'
import ProjectsPage from '@/pages/Projects'
import QuotesPage from '@/pages/Quotes'
import QuotePreviewPage from '@/pages/QuotePreview'
import KanbanPage from '@/pages/Kanban'

export const router = createBrowserRouter([
  {
    path: '/', element: <AppShell />,
    children: [
      { index: true, element: <Navigate to="/workers" replace /> },
      { path: 'dashboard', element: <Placeholder title="Dashboard" /> },
      { path: 'customers', element: <CustomersPage /> },
      { path: 'sites', element: <Placeholder title="Công trường / Xưởng" /> },
      { path: 'workers', element: <WorkersPage /> },
      { path: 'projects', element: <ProjectsPage /> },
      { path: 'quotes', element: <QuotesPage /> },
      { path: 'assign', element: <KanbanPage /> },
      { path: 'timesheet', element: <Placeholder title="Chấm công" /> },
      { path: 'report', element: <Placeholder title="Hiệu suất" /> },
    ],
  },
  {
    path: '/quotes/:id/preview',
    element: <QuotePreviewPage />
  }
])
