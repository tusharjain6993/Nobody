import { Routes, Route, Navigate } from "react-router-dom";
import { NotificationProvider } from "./context/NotificationContext";
import { useHCMAuth } from "./minister/HCMAuthContext";

import MainLayout from "./Components/MainLayout";
import ProtectedRoute from "./Components/ProtectedRoute";
import DashboardPage from "./Components/pages/MinisterDashboard/MinisterDashboard";
import SettingsPage from "./Components/pages/SettingsPage";

import HCMLoginPage from "./minister/pages/HCMLoginPage";
import HCMRegisterPage from "./minister/pages/HCMRegisterPage";
import HCMCasesListPage from "./minister/pages/HCMCasesListPage";
import HCMCaseDetailPage from "./minister/pages/HCMCaseDetailPage";
import HCMNewCasePage from "./minister/pages/HCMNewCasePage";
import CitizenMyCasesPage from "./minister/pages/CitizenMyCasesPage";
import MeetingsPage from "./minister/pages/MeetingsPage";
import MinisterDashboardPage from "./minister/pages/MinisterDashboardPage";
import MinisterCalendarPage from "./minister/pages/MinisterCalendarPage";

function App() {
  const { isAuthenticated, user } = useHCMAuth();

  const defaultRoute = !isAuthenticated
    ? "/login"
    : user?.role === "admin"
      ? "/dashboard"
      : user?.role === "minister"
        ? "/minister/dashboard"
      : user?.role === "deo"
        ? "/meetings"
        : "/new-case";

  return (
    <NotificationProvider>
      <Routes>
        <Route path="/login" element={isAuthenticated ? <Navigate to={defaultRoute} replace /> : <HCMLoginPage />} />
        <Route path="/register" element={isAuthenticated ? <Navigate to={defaultRoute} replace /> : <HCMRegisterPage />} />

        <Route
          element={(
            <ProtectedRoute>
              <MainLayout />
            </ProtectedRoute>
          )}
        >
          <Route
            path="/dashboard"
            element={(
              <ProtectedRoute allowedRoles={["admin"]}>
                <DashboardPage />
              </ProtectedRoute>
            )}
          />
          <Route
            path="/minister/dashboard"
            element={(
              <ProtectedRoute allowedRoles={["minister"]}>
                <MinisterDashboardPage />
              </ProtectedRoute>
            )}
          />
          <Route
            path="/minister/calendar"
            element={(
              <ProtectedRoute allowedRoles={["minister"]}>
                <MinisterCalendarPage />
              </ProtectedRoute>
            )}
          />
          <Route
            path="/cases"
            element={(
              <ProtectedRoute allowedRoles={["admin"]}>
                <HCMCasesListPage />
              </ProtectedRoute>
            )}
          />
          <Route
            path="/cases/:itemType/:id"
            element={(
              <ProtectedRoute allowedRoles={["admin"]}>
                <HCMCaseDetailPage />
              </ProtectedRoute>
            )}
          />
          <Route
            path="/meetings"
            element={(
              <ProtectedRoute allowedRoles={["admin", "deo", "citizen"]}>
                <MeetingsPage />
              </ProtectedRoute>
            )}
          />
          <Route
            path="/new-case"
            element={(
              <ProtectedRoute allowedRoles={["citizen"]}>
                <HCMNewCasePage />
              </ProtectedRoute>
            )}
          />
          <Route
            path="/my-cases"
            element={(
              <ProtectedRoute allowedRoles={["citizen"]}>
                <CitizenMyCasesPage />
              </ProtectedRoute>
            )}
          />
          <Route path="/settings" element={<SettingsPage />} />
        </Route>

        <Route path="/" element={<Navigate to={defaultRoute} replace />} />
        <Route path="*" element={<Navigate to={defaultRoute} replace />} />
      </Routes>
    </NotificationProvider>
  );
}

export default App;
