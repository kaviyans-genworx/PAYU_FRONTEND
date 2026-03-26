import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "@/hooks/useAppStore";
import { logoutUser } from "@/features/auth";
import { Button } from "@/components/ui/button";
import {
  FileText,
  Upload,
  FileSpreadsheet,
  ShieldCheck,
  LayoutDashboard,
  LogOut,
  Menu,
  X,
  PanelLeftClose,
  PanelLeftOpen,
  ChevronRight,
  User,
  Users,
  UserPlus,
  CreditCard,
  BarChart3,
} from "lucide-react";

const ADMIN_ROLE_ID = 1;

const userNavItems = [
  { label: "Dashboard", icon: LayoutDashboard, href: "/dashboard" },
  { label: "Upload", icon: Upload, href: "/upload" },
  { label: "Invoices", icon: FileText, href: "/invoices" },
  { label: "Purchase Orders", icon: FileSpreadsheet, href: "/purchase-orders" },
  { label: "Validation", icon: ShieldCheck, href: "/validation" },
  { label: "Payments", icon: CreditCard, href: "/payments" },
];

const adminNavItems = [
  { label: "Admin Dashboard", icon: BarChart3, href: "/admin/dashboard" },
  { label: "User Management", icon: Users, href: "/admin/users" },
  { label: "Create User", icon: UserPlus, href: "/admin/users/create" },
];

export function DashboardLayout() {
  const dispatch = useAppDispatch();
  const { roleId } = useAppSelector((state) => state.auth);
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [logoutConfirmOpen, setLogoutConfirmOpen] = useState(false);
  const sidebarRef = useRef<HTMLElement>(null);
  const navItems = roleId === ADMIN_ROLE_ID ? adminNavItems : userNavItems;

  // Focus trap for mobile sidebar
  const trapFocus = useCallback((e: KeyboardEvent) => {
    if (!mobileSidebarOpen || !sidebarRef.current) return;
    if (e.key !== "Tab") return;
    const focusable = sidebarRef.current.querySelectorAll<HTMLElement>(
      'button, a, input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    if (focusable.length === 0) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (e.shiftKey) {
      if (document.activeElement === first) {
        e.preventDefault();
        last.focus();
      }
    } else {
      if (document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
  }, [mobileSidebarOpen]);

  useEffect(() => {
    document.addEventListener("keydown", trapFocus);
    return () => document.removeEventListener("keydown", trapFocus);
  }, [trapFocus]);

  // Focus sidebar when opened on mobile
  useEffect(() => {
    if (mobileSidebarOpen && sidebarRef.current) {
      const firstBtn = sidebarRef.current.querySelector<HTMLElement>("button, a");
      firstBtn?.focus();
    }
  }, [mobileSidebarOpen]);

  const handleLogout = async () => {
    await dispatch(logoutUser());
    setLogoutConfirmOpen(false);
    navigate("/", { replace: true });
  };

  const openLogoutConfirm = () => {
    setLogoutConfirmOpen(true);
  };

  const closeLogoutConfirm = () => {
    setLogoutConfirmOpen(false);
  };

  const isActive = (href: string) => location.pathname.startsWith(href);

  // Derive page title and breadcrumb from current route
  const pageInfo = useMemo(() => {
    const path = location.pathname;
    const matched = navItems.find((item) => path.startsWith(item.href));
    const title = matched?.label ?? "PAYU";
    const breadcrumbs: { label: string; href?: string }[] = [{ label: "Home", href: "/dashboard" }];

    if (matched && matched.href !== "/dashboard") {
      breadcrumbs.push({ label: matched.label, href: matched.href });
    }

    // Handle detail routes like /invoices/:id, /purchase-orders/:id, /validation/:groupId, /payments/:groupId, /acceptance/:groupId
    const detailMatch = path.match(/^\/(invoices|purchase-orders|validation|payments|acceptance)\/(.+)$/);
    if (detailMatch) {
      const segment = detailMatch[1];
      const id = detailMatch[2];
      const detailLabels: Record<string, string> = {
        invoices: "Invoice",
        "purchase-orders": "PO",
        validation: "Group",
        payments: "Payment",
        acceptance: "Acceptance",
      };
      breadcrumbs.push({ label: `${detailLabels[segment]} #${id}` });
    }

    return { title, breadcrumbs };
  }, [location.pathname]);

  return (
    <div className="h-screen flex overflow-hidden bg-background">
      {/* Skip to main content link */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:z-[100] focus:top-2 focus:left-2 focus:px-4 focus:py-2 focus:bg-primary focus:text-primary-foreground focus:rounded-md focus:text-sm focus:font-medium"
      >
        Skip to main content
      </a>

      {/* Sidebar */}
      <aside
        ref={sidebarRef}
        className={`
          fixed inset-y-0 left-0 z-50 flex flex-col bg-sidebar border-r border-sidebar-border overflow-x-hidden
          transition-all duration-200 ease-in-out
          ${collapsed ? "w-[68px]" : "w-64"}
          lg:relative
          ${mobileSidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
        `}
      >
        {/* Brand */}
        <div className="flex items-center gap-3 px-4 py-5 border-b border-sidebar-border shrink-0">
          <div className="flex items-center justify-center h-9 w-9 rounded-lg bg-sidebar-primary text-sidebar-primary-foreground shrink-0">
            <FileText className="h-5 w-5" />
          </div>
          {!collapsed && (
            <div className="overflow-hidden">
              <h2 className="text-sm font-bold text-sidebar-foreground">PAYU</h2>
              <p className="text-xs text-muted-foreground">Accounts Payable</p>
            </div>
          )}
          {/* Close button on mobile */}
          <button
            className="lg:hidden ml-auto text-sidebar-foreground"
            onClick={() => setMobileSidebarOpen(false)}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex flex-col gap-1 p-3 flex-1 overflow-y-auto overflow-x-hidden">
          {navItems.map((item) => {
            const active = isActive(item.href);
            return (
              <div key={item.label} className="relative group">
                <button
                  onClick={() => {
                    navigate(item.href);
                    setMobileSidebarOpen(false);
                  }}
                  aria-label={collapsed ? item.label : undefined}
                  aria-current={active ? "page" : undefined}
                  className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors w-full
                    ${collapsed ? "justify-center" : ""}
                    ${
                      active
                        ? "bg-sidebar-accent text-sidebar-accent-foreground"
                        : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                    }`}
                >
                  <item.icon className="h-4 w-4 shrink-0" />
                  {!collapsed && item.label}
                </button>
                {/* Tooltip for collapsed sidebar */}
                {collapsed && (
                  <span
                    role="tooltip"
                    className="absolute left-full top-1/2 -translate-y-1/2 ml-2 px-2 py-1 rounded-md bg-foreground text-background text-xs font-medium whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity z-50 shadow-lg"
                  >
                    {item.label}
                  </span>
                )}
              </div>
            );
          })}
        </nav>

        {/* Bottom actions */}
        <div className="shrink-0 p-3 border-t border-sidebar-border space-y-1 overflow-x-hidden">
          {/* Desktop collapse toggle */}
          <div className="relative group">
            <button
              onClick={() => setCollapsed((c) => !c)}
              className={`hidden lg:flex items-center gap-3 w-full rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground hover:text-sidebar-foreground hover:bg-sidebar-accent transition-colors ${collapsed ? "justify-center" : ""}`}
              aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              {collapsed ? (
                <PanelLeftOpen className="h-4 w-4 shrink-0" />
              ) : (
                <>
                  <PanelLeftClose className="h-4 w-4 shrink-0" />
                  Collapse
                </>
              )}
            </button>
            {collapsed && (
              <span role="tooltip" className="absolute left-full top-1/2 -translate-y-1/2 ml-2 px-2 py-1 rounded-md bg-foreground text-background text-xs font-medium whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity z-50 shadow-lg">
                Expand sidebar
              </span>
            )}
          </div>
          <div className="relative group">
            <Button
              variant="ghost"
              onClick={openLogoutConfirm}
              className={`w-full gap-3 text-muted-foreground hover:text-destructive ${collapsed ? "justify-center px-0" : "justify-start"}`}
              aria-label={collapsed ? "Sign out" : undefined}
            >
              <LogOut className="h-4 w-4 shrink-0" />
              {!collapsed && "Sign out"}
            </Button>
            {collapsed && (
              <span role="tooltip" className="absolute left-full top-1/2 -translate-y-1/2 ml-2 px-2 py-1 rounded-md bg-foreground text-background text-xs font-medium whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity z-50 shadow-lg">
                Sign out
              </span>
            )}
          </div>
        </div>
      </aside>

      {/* Overlay for mobile sidebar */}
      {mobileSidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          aria-hidden="true"
          onClick={() => setMobileSidebarOpen(false)}
        />
      )}

      {logoutConfirmOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 px-4" role="dialog" aria-modal="true" aria-labelledby="logout-confirm-title" aria-describedby="logout-confirm-description">
          <div className="w-full max-w-md rounded-xl border bg-background p-6 shadow-lg">
            <h2 id="logout-confirm-title" className="text-lg font-semibold text-foreground">Confirm sign out</h2>
            <p id="logout-confirm-description" className="mt-2 text-sm text-muted-foreground">
              Are you sure you want to sign out?
            </p>
            <div className="mt-6 flex justify-end gap-2">
              <Button variant="outline" onClick={closeLogoutConfirm}>
                Cancel
              </Button>
              <Button variant="destructive" onClick={handleLogout}>
                Sign out
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 h-screen">
        {/* Top bar */}
        <header className="sticky top-0 z-30 flex items-center gap-4 border-b bg-background/95 backdrop-blur px-6 py-3 shrink-0">
          <button
            className="lg:hidden text-foreground"
            onClick={() => setMobileSidebarOpen(true)}
            aria-label="Open navigation menu"
          >
            <Menu className="h-5 w-5" />
          </button>

          {/* Page title & breadcrumb */}
          <div className="flex-1 min-w-0">
            <nav aria-label="Breadcrumb" className="flex items-center gap-1 text-xs text-muted-foreground mb-0.5">
              {pageInfo.breadcrumbs.map((crumb, idx) => (
                <span key={idx} className="flex items-center gap-1">
                  {idx > 0 && <ChevronRight className="h-3 w-3" />}
                  {crumb.href && idx < pageInfo.breadcrumbs.length - 1 ? (
                    <button
                      onClick={() => navigate(crumb.href!)}
                      className="hover:text-foreground transition-colors"
                    >
                      {crumb.label}
                    </button>
                  ) : (
                    <span className="text-foreground/70">{crumb.label}</span>
                  )}
                </span>
              ))}
            </nav>
            <h1 className="text-sm font-semibold text-foreground truncate">{pageInfo.title}</h1>
          </div>

          {/* User menu */}
          <div className="flex items-center gap-2 shrink-0">
            <div className="flex items-center justify-center h-8 w-8 rounded-full bg-primary/10 text-primary" title="User account">
              <User className="h-4 w-4" />
            </div>
          </div>
        </header>

        {/* Page content — only this area scrolls */}
        <main id="main-content" className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
