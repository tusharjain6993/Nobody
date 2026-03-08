import { Routes, Route, Navigate } from 'react-router-dom'
import { NotificationProvider } from './context/NotificationContext'
import { useHCMAuth } from './minister/HCMAuthContext'

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

function App() {
  const { isAuthenticated, user } = useHCMAuth();

  const defaultRoute = !isAuthenticated
    ? "/login"
    : user?.role === "admin"
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
          {/* Admin-only routes */}
          <Route path="/dashboard" element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <MinisterDashboard />
            </ProtectedRoute>
          } />
          <Route path="/employees" element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <EmployeesPage />
            </ProtectedRoute>
          } />
          <Route path="/employee" element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <EmployeesPage />
            </ProtectedRoute>
          } />
          <Route path="/department" element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <DepartmentPage />
            </ProtectedRoute>
          } />
          <Route path="/cases" element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <HCMCasesListPage />
            </ProtectedRoute>
          } />
          <Route path="/cases/:id" element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <HCMCaseDetailPage />
            </ProtectedRoute>
          } />

          {/* Citizen-only routes */}
          <Route path="/new-case" element={
            <ProtectedRoute allowedRoles={["citizen"]}>
              <HCMNewCasePage />
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
