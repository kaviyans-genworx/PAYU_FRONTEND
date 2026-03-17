import { useEffect } from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";

import { fetchCurrentUser } from "@/features/auth";
import { useAppDispatch, useAppSelector } from "@/hooks/useAppStore";

const ADMIN_ROLE_ID = 1;

export function ProtectedRoute() {
  const dispatch = useAppDispatch();
  const location = useLocation();
  const { isAuthenticated, roleId, isFirstLogin, isLoading } = useAppSelector(
    (state) => state.auth,
  );

  useEffect(() => {
    if (isAuthenticated && roleId === null && !isLoading) {
      void dispatch(fetchCurrentUser());
    }
  }, [dispatch, isAuthenticated, isLoading, roleId]);

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (isLoading || roleId === null) {
    return null;
  }

  if (roleId !== ADMIN_ROLE_ID && isFirstLogin && location.pathname !== "/change-password") {
    return <Navigate to="/change-password" replace />;
  }

  if ((roleId === ADMIN_ROLE_ID || !isFirstLogin) && location.pathname === "/change-password") {
    return <Navigate to={roleId === ADMIN_ROLE_ID ? "/admin/users" : "/dashboard"} replace />;
  }

  if (roleId === ADMIN_ROLE_ID) {
    if (!location.pathname.startsWith("/admin/users") && location.pathname !== "/change-password") {
      return <Navigate to="/admin/users" replace />;
    }
  } else if (location.pathname.startsWith("/admin/users")) {
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
}
