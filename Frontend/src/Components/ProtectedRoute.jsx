import { Navigate } from "react-router-dom";
import { useHCMAuth } from "../minister/HCMAuthContext";

export default function ProtectedRoute({ children, allowedRoles }) {
  const { isAuthenticated, user } = useHCMAuth();

  if (!isAuthenticated) return <Navigate to="/login" replace />;

  if (allowedRoles && !allowedRoles.includes(user?.role)) {
    if (user?.role === "citizen") return <Navigate to="/new-case" replace />;
    if (user?.role === "deo") return <Navigate to="/meetings" replace />;
    if (user?.role === "minister") return <Navigate to="/minister/dashboard" replace />;
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}
