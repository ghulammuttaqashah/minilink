import { Navigate, Outlet, useLocation } from "react-router-dom";
import LoadingSpinner from "./LoadingSpinner";
import { useAuth } from "../context/AuthContext";

export function ProtectedRoute() {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return <div className="flex min-h-screen items-center justify-center bg-slate-950"><LoadingSpinner label="Checking your session" /></div>;
  }

  return isAuthenticated ? <Outlet /> : <Navigate to="/auth" replace state={{ from: location }} />;
}

export function PublicOnlyRoute() {
  const { isAuthenticated, isLoading } = useAuth();
  if (isLoading) {
    return <div className="flex min-h-screen items-center justify-center bg-slate-950"><LoadingSpinner label="Checking your session" /></div>;
  }
  return isAuthenticated ? <Navigate to="/dashboard" replace /> : <Outlet />;
}
