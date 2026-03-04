// import React from "react";
import { Outlet } from "react-router-dom";

export function AuthLayout() {
  return (
    <main className="min-h-screen">
      <Outlet />
    </main>
  );
}
