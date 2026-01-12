import { useAuth } from "./AuthProvider";
import { Navigate } from "react-router-dom";

export default function ProtectedRoute({ children }) {
  const { authenticated } = useAuth();

  if (!authenticated) return <Navigate to="/login" replace />;
  return children;
}