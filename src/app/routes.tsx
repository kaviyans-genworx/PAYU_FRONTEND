// import React from "react";
import { createBrowserRouter, Navigate } from "react-router-dom";

import { AuthLayout } from "@/layouts/AuthLayout";
import { DashboardLayout } from "@/layouts/DashboardLayout";
import { ProtectedRoute } from "@/components/common/ProtectedRoute";
import { LoginPage } from "@/features/auth/components/LoginPage";
import { SignUpPage } from "@/features/auth/components/SignUpPage";
import { DashboardPage } from "@/features/dashboard";
import { UploadPage } from "@/features/upload";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <Navigate to="/login" replace />,
  },
  {
    element: <AuthLayout />,
    children: [
      {
        path: "login",
        element: <LoginPage />,
      },
      {
        path: "signup",
        element: <SignUpPage />,
      },
    ],
  },
  {
    element: <ProtectedRoute />,
    children: [
      {
        element: <DashboardLayout />,
        children: [
          {
            path: "dashboard",
            element: <DashboardPage />,
          },
          {
            path: "upload",
            element: <UploadPage />,
          },
        ],
      },
    ],
  },
]);
