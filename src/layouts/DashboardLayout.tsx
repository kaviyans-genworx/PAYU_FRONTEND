import { useState } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import { useAppDispatch } from "@/hooks/useAppStore";
import { logoutUser } from "@/features/auth";
import { Button } from "@/components/ui/button";
import {
  FileText,
  LayoutDashboard,
  Upload,
  Settings,
  LogOut,
  Menu,
  X,
} from "lucide-react";

const navItems = [
  { label: "Dashboard", icon: LayoutDashboard, href: "/dashboard" },
  { label: "Upload", icon: Upload, href: "/upload" },
  { label: "Settings", icon: Settings, href: "/settings" },
];

export function DashboardLayout() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = async () => {
    await dispatch(logoutUser());
    navigate("/login", { replace: true });
  };

  return (
    <div className="min-h-screen flex bg-background">
      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 transform bg-sidebar border-r border-sidebar-border transition-transform duration-200 ease-in-out lg:relative lg:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Brand */}
        <div className="flex items-center gap-3 px-6 py-5 border-b border-sidebar-border">
          <div className="flex items-center justify-center h-9 w-9 rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
            <FileText className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-sidebar-foreground">PAYU</h2>
            <p className="text-xs text-muted-foreground">Accounts Payable</p>
          </div>
          {/* Close button on mobile */}
          <button
            className="lg:hidden ml-auto text-sidebar-foreground"
            onClick={() => setSidebarOpen(false)}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex flex-col gap-1 p-4">
          {navItems.map((item) => (
            <button
              key={item.label}
              onClick={() => {
                navigate(item.href);
                setSidebarOpen(false);
              }}
              className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors"
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </button>
          ))}
        </nav>

        {/* Logout at bottom */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-sidebar-border">
          <Button
            variant="ghost"
            onClick={handleLogout}
            className="w-full justify-start gap-3 text-muted-foreground hover:text-destructive"
          >
            <LogOut className="h-4 w-4" />
            Sign out
          </Button>
        </div>
      </aside>

      {/* Overlay for mobile sidebar */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <header className="sticky top-0 z-30 flex items-center gap-4 border-b bg-background/95 backdrop-blur px-6 py-3">
          <button
            className="lg:hidden text-foreground"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="h-5 w-5" />
          </button>
          <div className="flex-1" />
        </header>

        {/* Page content */}
        <main className="flex-1 p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
