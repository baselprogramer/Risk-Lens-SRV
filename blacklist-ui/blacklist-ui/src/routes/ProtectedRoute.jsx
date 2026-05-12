import { Navigate } from "react-router-dom";
import { getToken, getUserRole } from "../services/authService";

export default function ProtectedRoute({ children, allowedRoles }) {
  const token = getToken();
  const role  = getUserRole();

  // ما في token → login
  if (!token) return <Navigate to="/login" replace />;

  // role مش مسموح → login
  if (allowedRoles && !allowedRoles.includes(role))
    return <Navigate to="/login" replace />;

  return children;
}