import { Routes, Route, Navigate } from 'react-router-dom'
import { NotificationProvider } from './context/NotificationContext'
import { useHCMAuth } from './minister/HCMAuthContext'
import { isStaffRole } from './constants/caseStatus'

import MainLayout from './Components/MainLayout'
import ProtectedRoute from './Components/ProtectedRoute'
import MinisterDashboard from './Components/pages/MinisterDashboard/MinisterDashboard'
import SettingsPage from './Components/pages/SettingsPage'
import EmployeesPage from './Components/pages/EmployeesPage'
import DepartmentPage from './Components/pages/DepartmentPage'

import HCMLoginPage from './minister/pages/HCMLoginPage'
import HCMRegisterPage from './minister/pages/HCMRegisterPage'
import HCMCasesListPage from './minister/pages/HCMCasesListPage'
import HCMCaseDetailPage from './minister/pages/HCMCaseDetailPage'
import HCMNewCasePage from './minister/pages/HCMNewCasePage'
import CitizenMyCasesPage from './minister/pages/CitizenMyCasesPage'
import WorkflowPipelinePage from './minister/pages/WorkflowPipelinePage'
import PendencyMonitorPage from './minister/pages/PendencyMonitorPage'

const STAFF_ROLES = ["admin", "ps", "aps", "additional_ps", "staff", "official"];

function App() {
  const { isAuthenticated, user } = useHCMAuth();

  const defaultRoute = !isAuthenticated
    ? "/login"
    : isStaffRole(user?.role)
      ? "/dashboard"
      : "/new-case";

  return (
    <NotificationProvider>
      <Routes>
        {/* Public routes */}
        <Route path="/login" element={
          isAuthenticated ? <Navigate to={defaultRoute} replace /> : <HCMLoginPage />
        } />
        <Route path="/register" element={
          isAuthenticated ? <Navigate to={defaultRoute} replace /> : <HCMRegisterPage />
        } />

        {/* Protected routes inside MainLayout */}
        <Route element={
          <ProtectedRoute>
            <MainLayout />
          </ProtectedRoute>
        }>
          {/* Staff routes (admin, PS, APS, staff, etc.) */}
          <Route path="/dashboard" element={
            <ProtectedRoute allowedRoles={STAFF_ROLES}>
              <MinisterDashboard />
            </ProtectedRoute>
          } />
          <Route path="/workflow" element={
            <ProtectedRoute allowedRoles={STAFF_ROLES}>
              <WorkflowPipelinePage />
            </ProtectedRoute>
          } />
          <Route path="/pendency" element={
            <ProtectedRoute allowedRoles={STAFF_ROLES}>
              <PendencyMonitorPage />
            </ProtectedRoute>
          } />
          <Route path="/employees" element={
            <ProtectedRoute allowedRoles={STAFF_ROLES}>
              <EmployeesPage />
            </ProtectedRoute>
          } />
          <Route path="/department" element={
            <ProtectedRoute allowedRoles={STAFF_ROLES}>
              <DepartmentPage />
            </ProtectedRoute>
          } />
          <Route path="/cases" element={
            <ProtectedRoute allowedRoles={STAFF_ROLES}>
              <HCMCasesListPage />
            </ProtectedRoute>
          } />
          <Route path="/cases/archived" element={
            <ProtectedRoute allowedRoles={STAFF_ROLES}>
              <HCMCasesListPage defaultView="archived" />
            </ProtectedRoute>
          } />
          <Route path="/cases/deleted" element={
            <ProtectedRoute allowedRoles={STAFF_ROLES}>
              <HCMCasesListPage defaultView="deleted" />
            </ProtectedRoute>
          } />
          <Route path="/cases/:id" element={
            <ProtectedRoute allowedRoles={STAFF_ROLES}>
              <HCMCaseDetailPage />
            </ProtectedRoute>
          } />

          {/* Citizen-only routes */}
          <Route path="/new-case" element={
            <ProtectedRoute allowedRoles={["citizen"]}>
              <HCMNewCasePage />
            </ProtectedRoute>
          } />
          <Route path="/my-cases" element={
            <ProtectedRoute allowedRoles={["citizen"]}>
              <CitizenMyCasesPage />
            </ProtectedRoute>
          } />

          {/* Shared routes */}
          <Route path="/settings" element={<SettingsPage />} />
        </Route>

        {/* Catch-all */}
        <Route path="/" element={<Navigate to={defaultRoute} replace />} />
        <Route path="*" element={<Navigate to={defaultRoute} replace />} />
      </Routes>
    </NotificationProvider>
  )
}

export default App
