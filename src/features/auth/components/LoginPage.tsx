// import React from "react";
import { Navigate } from "react-router-dom";
import { useAppSelector } from "@/hooks/useAppStore";
import { LoginForm } from "@/features/auth/components/LoginForm";

export function LoginPage() {
  const { isAuthenticated } = useAppSelector((state) => state.auth);

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return <LoginForm />;
}
