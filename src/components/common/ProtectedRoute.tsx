import { useEffect, useRef } from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";

import { fetchCurrentUser, refreshToken } from "@/features/auth";
import { useAppDispatch, useAppSelector } from "@/hooks/useAppStore";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";

const ADMIN_ROLE_ID = 1;

export function ProtectedRoute() {
  const dispatch = useAppDispatch();
  const location = useLocation();
  const { isAuthenticated, accessToken, roleId, isFirstLogin, isLoading, error } =
    useAppSelector((state) => state.auth);

  // Track whether we've already attempted validation + refresh to avoid infinite loops
  const hasAttemptedAuth = useRef(false);

  useEffect(() => {
    if (!accessToken || hasAttemptedAuth.current) return;

    if (roleId === null && !isLoading) {
      hasAttemptedAuth.current = true;

      // First, try to validate the current token
      dispatch(fetchCurrentUser()).then((result) => {
        if (fetchCurrentUser.rejected.match(result)) {
          // Token validation failed — attempt refresh once
          dispatch(refreshToken()).then((refreshResult) => {
            if (refreshToken.fulfilled.match(refreshResult)) {
              // Refresh succeeded — re-validate with new token
              dispatch(fetchCurrentUser());
            }
            // If refresh also fails, refreshToken.rejected in the slice
            // will clear auth state (isAuthenticated=false, token removed).
            // The Navigate below will handle the redirect.
          });
        }
      });
    }
  }, [dispatch, accessToken, isLoading, roleId]);

  // No token at all → go to login
  if (!isAuthenticated && !accessToken) {
    return <Navigate to="/" replace />;
  }

  // Still loading or waiting for validation to complete
  if (isLoading || (accessToken && roleId === null && !error)) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner size={36} />
      </div>
    );
  }

  // Auth failed completely (error + no role) → redirect to home
  if (error && roleId === null) {
    return <Navigate to="/" replace />;
  }

  if (roleId !== ADMIN_ROLE_ID && isFirstLogin && location.pathname !== "/change-password") {
    return <Navigate to="/change-password" replace />;
  }

  if ((roleId === ADMIN_ROLE_ID || !isFirstLogin) && location.pathname === "/change-password") {
    return <Navigate to={roleId === ADMIN_ROLE_ID ? "/admin/dashboard" : "/dashboard"} replace />;
  }

  if (roleId === ADMIN_ROLE_ID) {
    if (!location.pathname.startsWith("/admin/") && location.pathname !== "/change-password") {
      return <Navigate to="/admin/dashboard" replace />;
    }
  } else if (location.pathname.startsWith("/admin/")) {
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
}
