import { createBrowserRouter, Navigate } from 'react-router-dom'
import { AppShell } from '@/components/layout/AppShell'
import Placeholder from '@/pages/Placeholder'
import DashboardPage from '@/pages/Dashboard'
import SitesPage from '@/pages/Sites'
import WorkersPage from '@/pages/Workers'
import CustomersPage from '@/pages/Customers'
import ProjectsPage from '@/pages/Projects'
import QuotesPage from '@/pages/Quotes'
import QuotePreviewPage from '@/pages/QuotePreview'
import KanbanPage from '@/pages/Kanban'
import TimesheetPage from '@/pages/Timesheet'

export const router = createBrowserRouter([
  {
    path: '/', element: <AppShell />,
    children: [
      { index: true, element: <Navigate to="/dashboard" replace /> },
      { path: 'dashboard', element: <DashboardPage /> },
      { path: 'customers', element: <CustomersPage /> },
      { path: 'sites', element: <SitesPage /> },
      { path: 'workers', element: <WorkersPage /> },
      { path: 'projects', element: <ProjectsPage /> },
      { path: 'quotes', element: <QuotesPage /> },
      { path: 'assign', element: <KanbanPage /> },
      { path: 'timesheet', element: <TimesheetPage /> },
      { path: 'report', element: <Placeholder title="Hiệu suất" /> },
    ],
  },
  {
    path: '/quotes/:id/preview',
    element: <QuotePreviewPage />
  }
])
