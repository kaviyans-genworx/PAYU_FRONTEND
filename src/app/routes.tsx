// import React from "react";
import { createBrowserRouter, Navigate } from "react-router-dom";

import { AuthLayout } from "@/layouts/AuthLayout";
import { DashboardLayout } from "@/layouts/DashboardLayout";
import { ProtectedRoute } from "@/components/common/ProtectedRoute";
import { LoginPage } from "@/features/auth/components/LoginPage";
import { SignUpPage } from "@/features/auth/components/SignUpPage";
import { DashboardPage } from "@/features/dashboard";
import { UploadPage } from "@/features/upload";
import { ReviewPage } from "@/features/review";
import { InvoicesPage, InvoiceDetailPage } from "@/features/invoices";
import { PurchaseOrdersPage, PODetailPage } from "@/features/purchase-orders";

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
          {
            path: "review",
            element: <ReviewPage />,
          },
          {
            path: "invoices",
            element: <InvoicesPage />,
          },
          {
            path: "invoices/:id",
            element: <InvoiceDetailPage />,
          },
          {
            path: "purchase-orders",
            element: <PurchaseOrdersPage />,
          },
          {
            path: "purchase-orders/:id",
            element: <PODetailPage />,
          },
        ],
      },
    ],
  },
]);
