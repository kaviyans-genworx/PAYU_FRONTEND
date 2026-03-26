import { Navigate } from "react-router-dom";
import { useAppSelector } from "@/hooks/useAppStore";
import { LoginForm } from "@/features/auth/components/LoginForm";

export function LoginPage() {
  const { isAuthenticated, roleId } = useAppSelector((state) => state.auth);

  // Only redirect if the user is FULLY authenticated (token validated + role resolved).
  // A stale token in localStorage sets isAuthenticated=true but roleId stays null
  // until fetchCurrentUser succeeds, so we wait for roleId to avoid redirect loops.
  if (isAuthenticated && roleId !== null) {
    return <Navigate to={roleId === 1 ? "/admin/dashboard" : "/dashboard"} replace />;
  }

  return <LoginForm />;
}
