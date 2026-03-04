import { Navigate } from "react-router-dom";
import { useAppSelector } from "@/hooks/useAppStore";
import { SignUpForm } from "@/features/auth/components/SignUpForm";

export function SignUpPage() {
  const { isAuthenticated } = useAppSelector((state) => state.auth);

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return <SignUpForm />;
}
