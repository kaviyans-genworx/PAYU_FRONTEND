// import React from "react";
import { Navigate, Outlet } from "react-router-dom";
import { useAppSelector } from "@/hooks/useAppStore";

export function ProtectedRoute() {
  const { isAuthenticated } = useAppSelector((state) => state.auth);

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}
