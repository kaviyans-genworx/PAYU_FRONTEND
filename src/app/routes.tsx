// import React from "react";
import { createBrowserRouter } from "react-router-dom";

import { AuthLayout } from "@/layouts/AuthLayout";
import { DashboardLayout } from "@/layouts/DashboardLayout";
import { ProtectedRoute } from "@/components/common/ProtectedRoute";
import { LandingPage } from "@/features/landing/components/LandingPage";
import { AdminCreateUserPage } from "@/features/auth/components/AdminCreateUserPage";
import { AdminUserManagementPage } from "@/features/auth/components/AdminUserManagementPage";
import {
  AdminDashboardPage,
} from "@/features/admin";
import { ChangePasswordPage } from "@/features/auth/components/ChangePasswordPage";
import { LoginPage } from "@/features/auth/components/LoginPage";
import { DashboardPage } from "@/features/dashboard";
import { UploadPage } from "@/features/upload";
import { ReviewPage } from "@/features/review";
import { InvoicesPage, InvoiceDetailPage } from "@/features/invoices";
import { PurchaseOrdersPage, PODetailPage } from "@/features/purchase-orders";
import {
  ValidationGroupsPage,
  ValidationGroupDetailPage,
  ValidationMailPage,
  ValidationFlowPage,
} from "@/features/validation";
import {
  AcceptancePage,
  PaymentsPage,
  PaymentDetailPage,
} from "@/features/payments";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <LandingPage />,
  },
  {
    element: <AuthLayout />,
    children: [
      {
        path: "login",
        element: <LoginPage />,
      },
    ],
  },
  {
    element: <ProtectedRoute />,
    children: [
      {
        path: "change-password",
        element: <ChangePasswordPage />,
      },
      {
        element: <DashboardLayout />,
        children: [
          {
            path: "admin/dashboard",
            element: <AdminDashboardPage />,
          },
          {
            path: "admin/users",
            element: <AdminUserManagementPage />,
          },
          {
            path: "admin/users/create",
            element: <AdminCreateUserPage />,
          },

          {
            path: "admin/invoices/:id",
            element: <InvoiceDetailPage />,
          },
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
          {
            path: "validation",
            element: <ValidationGroupsPage />,
          },
          {
            path: "validation/:groupId",
            element: <ValidationGroupDetailPage />,
          },
          {
            path: "validation/:groupId/send-mail",
            element: <ValidationMailPage />,
          },
          {
            path: "validation/:groupId/flow",
            element: <ValidationFlowPage />,
          },
          {
            path: "acceptance/:groupId",
            element: <AcceptancePage />,
          },
          {
            path: "payments",
            element: <PaymentsPage />,
          },
          {
            path: "payments/:groupId",
            element: <PaymentDetailPage />,
          },
        ],
      },
    ],
  },
]);
