import { Navigate } from "react-router-dom";
import { useHCMAuth } from "../minister/HCMAuthContext";

export default function ProtectedRoute({ children, allowedRoles }) {
  const { isAuthenticated, user } = useHCMAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user?.role)) {
    if (user?.role === "citizen") {
      return <Navigate to="/new-case" replace />;
    }
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}
