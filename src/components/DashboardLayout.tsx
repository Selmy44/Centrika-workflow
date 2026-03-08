import { useAuth } from "@/_core/hooks/useAuth";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
  useSidebar,
  SidebarMenuSub,
  SidebarMenuSubItem,
  SidebarMenuSubButton,
} from "@/components/ui/sidebar";
import { APP_LOGO, APP_TITLE, getLoginUrl } from "@/const";
import { trpc } from "@/lib/trpc";
import { useIsMobile } from "@/hooks/useMobile";
import { LayoutDashboard, LogOut, PanelLeft, FileText, CheckCircle, Settings, Users, Bell, TrendingUp, DollarSign, Search, ChevronDown, Car, Calendar, BarChart3, User, Lock, AlertCircle } from "lucide-react";
import { useTheme } from "@/contexts/ThemeContext";
import ThemeToggleIcon from "@/components/ui/ThemeToggleIcon";
import NotificationIcon from "@/components/NotificationIcon";
import { CSSProperties, useCallback, useEffect, useRef, useState } from "react";
import { useLocation } from "wouter";
import { DashboardLayoutSkeleton } from './DashboardLayoutSkeleton';
import { Button } from "./ui/button";
import { CreateRequestDialog } from "@/components/CreateRequestDialog";

const menuItems = [
  { icon: LayoutDashboard, label: "Dashboard", path: "/" },
  {
    icon: FileText,
    label: "New Request",
    path: "#",
    submenu: [
      { label: "Leave Request", action: "leave" },
      { label: "Car Request", action: "car" },
      { label: "Expenditure Request", action: "expenditure" },
    ]
  },
  { icon: FileText, label: "My Requests", path: "/requests" },
  { icon: Calendar, label: "Leave Balance", path: "/leave-balance" },
];

const adminMenuItems = [
  { icon: LayoutDashboard, label: "Dashboard", path: "/" },
  { icon: Users, label: "User Management", path: "/admin/users" },
  { icon: Search, label: "Employee Directory", path: "/employee-directory" },
  { icon: CheckCircle, label: "Approvals", path: "/approvals" },
  {
    icon: BarChart3,
    label: "System Reports",
    path: "#",
    submenu: [
      { label: "Request Analytics", path: "/leave-analytics" },
      { label: "Leave Statistics", path: "/leave-analytics" },
    ]
  },
  {
    icon: Lock,
    label: "Security",
    path: "#",
    submenu: [
      { label: "Audit Logs", path: "/system-settings" },
      { label: "System Settings", path: "/system-settings" },
    ]
  },
];

const financeMenuItems = [
  { icon: LayoutDashboard, label: "Dashboard", path: "/" },
  { icon: DollarSign, label: "Finance Reports", path: "/finance" },
  { icon: CheckCircle, label: "Pending Approvals", path: "/approvals" },
  { icon: TrendingUp, label: "Expenditure Tracking", path: "/expenditure-tracking" },
  {
    icon: BarChart3,
    label: "Budget Analysis",
    path: "/budget-analysis",
    submenu: [
      { label: "Budget Overview", path: "/budget-analysis" },
      { label: "Spending Reports", path: "/expenditure-tracking" },
    ]
  },
  { icon: AlertCircle, label: "Audit Log", path: "/system-settings" },
];

const hrMenuItems = [
  { icon: LayoutDashboard, label: "HR Dashboard", path: "/" },
  { icon: Users, label: "Employee Management", path: "/admin/users" },
  { icon: Search, label: "Employee Directory", path: "/employee-directory" },
  { icon: CheckCircle, label: "Approvals", path: "/approvals" },
  {
    icon: Calendar,
    label: "Leave Management",
    path: "#",
    submenu: [
      { label: "Company Calendar", path: "/company-calendar" },
      { label: "Leave Approvals", path: "/approvals" },
      { label: "Leave Reports", path: "/leave-analytics" },
    ]
  },
  {
    icon: Bell,
    label: "Invitations",
    path: "#",
    submenu: [
      { label: "Pending Invitations", path: "/admin/users" },
      { label: "Sent Invitations", path: "/admin/users" },
    ]
  },
  {
    icon: BarChart3,
    label: "Analytics & Reports",
    path: "#",
    submenu: [
      { label: "Leave Statistics", path: "/leave-analytics" },
      { label: "Request Statistics", path: "/leave-analytics" },
      { label: "Employee Directory", path: "/employee-directory" },
    ]
  },
];

const deptHeadMenuItems = [
  { icon: LayoutDashboard, label: "Dashboard", path: "/" },
  { icon: CheckCircle, label: "Pending Approvals", path: "/approvals" },
  { icon: Users, label: "Department Team", path: "/employee-directory" },
  {
    icon: FileText,
    label: "New Request",
    path: "#",
    submenu: [
      { label: "Leave Request", action: "leave" },
      { label: "Car Request", action: "car" },
      { label: "Expenditure Request", action: "expenditure" },
    ]
  },
  { icon: FileText, label: "My Requests", path: "/requests" },
  {
    icon: Calendar,
    label: "Leave Management",
    path: "#",
    submenu: [
      { label: "Team Leave Status", path: "/company-calendar" },
      { label: "Approval History", path: "/approval-history" },
    ]
  },
  {
    icon: BarChart3,
    label: "Analytics",
    path: "#",
    submenu: [
      { label: "Request Analytics", path: "/request-analytics" },
      { label: "Team Statistics", path: "/team-statistics" },
    ]
  },
];

const ceoMenuItems = [
  { icon: LayoutDashboard, label: "Executive Dashboard", path: "/" },
  { icon: CheckCircle, label: "Approvals", path: "/approvals" },
  {
    icon: BarChart3,
    label: "Business Analytics",
    path: "#",
    submenu: [
      { label: "Company Overview", path: "/" },
      { label: "Leave Analytics", path: "/leave-analytics" },
      { label: "Budget Analysis", path: "/budget-analysis" },
      { label: "Department Report", path: "/department-report" },
    ]
  },
  { icon: Users, label: "Organization View", path: "/employee-directory" },
  { icon: Search, label: "Employee Directory", path: "/employee-directory" },
  {
    icon: TrendingUp,
    label: "Strategic Reports",
    path: "#",
    submenu: [
      { label: "Leave Analytics", path: "/leave-analytics" },
      { label: "Budget Analytics", path: "/budget-analysis" },
    ]
  },
];

const SIDEBAR_WIDTH_KEY = "sidebar-width";
const DEFAULT_WIDTH = 280;
const MIN_WIDTH = 200;
const MAX_WIDTH = 480;

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarWidth, setSidebarWidth] = useState(() => {
    const saved = localStorage.getItem(SIDEBAR_WIDTH_KEY);
    return saved ? parseInt(saved, 10) : DEFAULT_WIDTH;
  });
  const { loading, user } = useAuth();

  useEffect(() => {
    localStorage.setItem(SIDEBAR_WIDTH_KEY, sidebarWidth.toString());
  }, [sidebarWidth]);

  if (loading) {
    return <DashboardLayoutSkeleton />
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center gap-8 p-8 max-w-md w-full">
          <div className="flex flex-col items-center gap-6">
            <div className="relative group">
              <div className="relative">
                <img
                  src={APP_LOGO}
                  alt={APP_TITLE}
                  className="h-20 w-20 rounded-xl object-cover shadow"
                />
              </div>
            </div>
            <div className="text-center space-y-2">
              <h1 className="text-2xl font-bold tracking-tight">{APP_TITLE}</h1>
              <p className="text-sm text-muted-foreground">
                Please sign in to continue
              </p>
            </div>
          </div>
          <Button
            onClick={() => {
              window.location.href = getLoginUrl();
            }}
            size="lg"
            className="w-full shadow-lg hover:shadow-xl transition-all"
          >
            Sign in
          </Button>
        </div>
      </div>
    );
  }

  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": `${sidebarWidth}px`,
        } as CSSProperties
      }
    >
      <DashboardLayoutContent setSidebarWidth={setSidebarWidth}>
        {children}
      </DashboardLayoutContent>
    </SidebarProvider>
  );
}

type DashboardLayoutContentProps = {
  children: React.ReactNode;
  setSidebarWidth: (width: number) => void;
};

function DashboardLayoutContent({
  children,
  setSidebarWidth,
}: DashboardLayoutContentProps) {
  const { user, logout, hasRole } = useAuth();

  const getCombinedMenuItems = useCallback(() => {
    if (!user) return menuItems;

    // Base menus depending on roles
    let combined: any[] = [];
    if (hasRole('admin')) combined = [...combined, ...adminMenuItems];
    if (hasRole('ceo_md')) combined = [...combined, ...ceoMenuItems];
    if (hasRole('head_of_department')) combined = [...combined, ...deptHeadMenuItems];
    if (hasRole('hr')) combined = [...combined, ...hrMenuItems];
    if (hasRole('head_of_finance')) combined = [...combined, ...financeMenuItems];

    if (combined.length === 0) {
      combined = [...menuItems];
    }

    const seenLabels = new Set();
    return combined.filter(item => {
      if (seenLabels.has(item.label)) return false;
      seenLabels.add(item.label);
      return true;
    });
  }, [user, hasRole]);

  const { data: pendingApprovals } = trpc.requests.listPendingApprovals.useQuery(undefined, { enabled: !!user && user.role !== "user" });
  const { theme, toggleTheme, switchable } = useTheme();
  const [location, setLocation] = useLocation();
  const { state, toggleSidebar } = useSidebar();
  const isCollapsed = state === "collapsed";
  const [isResizing, setIsResizing] = useState(false);
  const sidebarRef = useRef<HTMLDivElement>(null);
  const activeMenuItem = menuItems.find(item => item.path === location);
  const isMobile = useIsMobile();
  const [showRequestDialog, setShowRequestDialog] = useState(false);
  const [requestType, setRequestType] = useState<"leave" | "car" | "expenditure">("leave");
  const [expandedItem, setExpandedItem] = useState<string | null>(null);

  const handleRequestItemClick = (action: string) => {
    setRequestType(action as "leave" | "car" | "expenditure");
    setShowRequestDialog(true);
  };

  useEffect(() => {
    if (isCollapsed) {
      setIsResizing(false);
    }
  }, [isCollapsed]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing) return;

      const sidebarLeft = sidebarRef.current?.getBoundingClientRect().left ?? 0;
      const newWidth = e.clientX - sidebarLeft;
      if (newWidth >= MIN_WIDTH && newWidth <= MAX_WIDTH) {
        setSidebarWidth(newWidth);
      }
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    if (isResizing) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "col-resize";
      document.body.style.userSelect = "none";
    }

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };
  }, [isResizing, setSidebarWidth]);

  return (
    <>
      <div className="relative" ref={sidebarRef}>
        <Sidebar
          collapsible="icon"
          className="border-r border-blue-200 dark:border-slate-700 bg-blue-50 dark:bg-slate-900"
          disableTransition={isResizing}
        >
          <SidebarHeader className="h-16 justify-center">
            <div className="flex items-center gap-3 pl-2 group-data-[collapsible=icon]:px-0 transition-all w-full">
              {isCollapsed ? (
                <div className="relative h-8 w-8 shrink-0 group">
                  <img
                    src={APP_LOGO}
                    className="h-8 w-8 rounded-md object-cover shadow-md dark:shadow-lg cursor-pointer"
                    alt="Logo"
                    onClick={toggleSidebar}
                  />
                  <button
                    onClick={toggleSidebar}
                    className="absolute inset-0 hidden items-center justify-center bg-accent rounded-md ring-1 ring-border focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <PanelLeft className="h-4 w-4 text-foreground" />
                  </button>
                </div>
              ) : (
                <>
                  <div className="flex items-center gap-3 min-w-0">
                    <img
                      src={APP_LOGO}
                      className="h-8 w-8 rounded-md object-cover shadow-md dark:shadow-lg shrink-0"
                      alt="Logo"
                    />
                    <span className="font-semibold tracking-tight truncate">
                      {APP_TITLE}
                    </span>
                  </div>
                  <button
                    onClick={toggleSidebar}
                    className="ml-auto h-8 w-8 flex items-center justify-center hover:bg-accent rounded-lg transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring shrink-0"
                  >
                    <PanelLeft className="h-4 w-4 text-muted-foreground" />
                  </button>
                </>
              )}
            </div>
          </SidebarHeader>

          <SidebarContent className="gap-0">
            <SidebarMenu className="px-2 py-1">
              {getCombinedMenuItems().map((item: any) => {
                const isActive = location === item.path;
                const hasSubmenu = "submenu" in item && item.submenu;

                // Check if any submenu item is active
                const isSubmenuActive = hasSubmenu && item.submenu?.some((subitem: any) => subitem.path === location);

                // Keep dropdown open if submenu is active
                const shouldExpand = expandedItem === item.label || isSubmenuActive;

                return (
                  <SidebarMenuItem key={item.path}>
                    <SidebarMenuButton
                      isActive={isActive}
                      onClick={() => hasSubmenu ? setExpandedItem(expandedItem === item.label ? null : item.label) : (item.path !== "#" && setLocation(item.path))}
                      tooltip={item.label}
                      className={`h-10 transition-all font-normal`}
                    >
                      <item.icon
                        className={`h-4 w-4 ${isActive ? "text-white dark:text-white" : ""}`}
                      />
                      <span>{item.label}</span>
                      {hasSubmenu && (
                        <ChevronDown className={`ml-auto h-4 w-4 transition-transform ${shouldExpand ? "rotate-180" : ""}`} />
                      )}
                    </SidebarMenuButton>

                    {hasSubmenu && shouldExpand && (
                      <SidebarMenuSub className="ml-0 border-l-2 border-blue-500/30 pl-4 py-2">
                        {item.submenu?.map((subitem: any) => {
                          const isSubitemActive = subitem.path === location;
                          return (
                            <SidebarMenuSubItem key={subitem.action || subitem.path || subitem.label}>
                              <SidebarMenuSubButton
                                onClick={() => {
                                  if (subitem.action) {
                                    handleRequestItemClick(subitem.action);
                                  } else if (subitem.path) {
                                    setLocation(subitem.path);
                                  }
                                }}
                                className={`h-9 text-sm font-medium rounded-md transition-all duration-200 ${isSubitemActive
                                  ? "bg-blue-500/20 text-blue-400 font-semibold"
                                  : "text-muted-foreground hover:text-foreground hover:bg-accent"
                                  }`}
                              >
                                {subitem.label}
                              </SidebarMenuSubButton>
                            </SidebarMenuSubItem>
                          );
                        })}
                      </SidebarMenuSub>
                    )}
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarContent>

          <SidebarFooter className="p-3">
            <SidebarMenu className="px-2 pb-2 border-t border-border pt-2 mt-auto">
              {[
                { icon: User, label: "Profile", path: "/profile" },
                { icon: Settings, label: "Settings", path: "/settings" }
              ].map((item) => {
                const isActive = location === item.path;
                return (
                  <SidebarMenuItem key={item.path}>
                    <SidebarMenuButton
                      isActive={isActive}
                      onClick={() => setLocation(item.path)}
                      tooltip={item.label}
                      className={`h-10 transition-all font-normal`}
                    >
                      <item.icon className={`h-4 w-4 ${isActive ? "text-white dark:text-white" : ""}`} />
                      <span>{item.label}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-3 rounded-lg px-2 py-2 mt-1 hover:bg-slate-100 dark:hover:bg-slate-800/50 transition-colors w-full text-left group-data-[collapsible=icon]:justify-center focus:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                  <Avatar className="h-9 w-9 border shrink-0">
                    <AvatarFallback className="text-xs font-medium">
                      {user?.name?.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0 group-data-[collapsible=icon]:hidden">
                    <p className="text-sm font-medium truncate leading-none">
                      {user?.name || "-"}
                    </p>
                    <p className="text-xs text-muted-foreground truncate mt-1.5">
                      {user?.email || "-"}
                    </p>
                  </div>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem
                  onClick={logout}
                  className="cursor-pointer text-destructive focus:text-destructive"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Sign out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarFooter>
        </Sidebar>
        <div
          className={`absolute top-0 right-0 w-1 h-full cursor-col-resize hover:bg-primary/20 transition-colors ${isCollapsed ? "hidden" : ""}`}
          onMouseDown={() => {
            if (isCollapsed) return;
            setIsResizing(true);
          }}
          style={{ zIndex: 50 }}
        />
      </div>

      <SidebarInset>
        <div className="relative">
          <div className="absolute top-4 left-4 flex items-center gap-2 z-50 md:hidden">
            <SidebarTrigger className="h-10 w-10" />
          </div>
          {switchable && (
            <div className="absolute top-4 right-4 flex items-center gap-2 z-50">
              <NotificationIcon />
              <button
                onClick={() => toggleTheme?.()}
                title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
                aria-label="Toggle theme"
                className="h-10 w-10 flex items-center justify-center rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-ring text-slate-600 dark:text-slate-300 bg-gradient-to-br from-slate-100 to-slate-200 dark:bg-gradient-to-br dark:from-slate-800 dark:to-slate-900 shadow-sm hover:shadow-md dark:hover:shadow-lg hover:from-slate-200 hover:to-slate-300 dark:hover:from-slate-700 dark:hover:to-slate-800 transition-all duration-200 border border-slate-300 dark:border-slate-600"
              >
                <ThemeToggleIcon theme={theme} className="h-5 w-5" />
              </button>
            </div>
          )}
          <main className="flex-1 p-6 pt-20 min-h-screen">{children}</main>
        </div>
      </SidebarInset>

      {/* Request Creation Dialog */}
      <CreateRequestDialog
        open={showRequestDialog}
        onOpenChange={setShowRequestDialog}
        initialRequestType={requestType}
      />
    </>
  );
}
