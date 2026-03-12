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
import { LayoutDashboard, LogOut, PanelLeft, FileText, CheckCircle, Settings, Users, Bell, TrendingUp, DollarSign, Search, ChevronDown, Car, Calendar, BarChart3, User, Lock, AlertCircle, Building2 } from "lucide-react";
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
      { label: "Asset Request", action: "asset" },
    ]
  },
  { icon: FileText, label: "My Requests", path: "/requests" },
  { icon: Calendar, label: "Leave Balance", path: "/leave-balance" },
];

const adminMenuItems = [
  { icon: LayoutDashboard, label: "Dashboard", path: "/" },
  {
    icon: FileText,
    label: "New Request",
    path: "#",
    submenu: [
      { label: "Leave Request", action: "leave" },
      { label: "Car Request", action: "car" },
      { label: "Expenditure Request", action: "expenditure" },
      { label: "Asset Request", action: "asset" },
    ]
  },
  { icon: FileText, label: "My Requests", path: "/requests" },
  { icon: Users, label: "User Management", path: "/admin/users" },
  { icon: Building2, label: "Department Management", path: "/admin/departments" },
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
  {
    icon: FileText,
    label: "New Request",
    path: "#",
    submenu: [
      { label: "Leave Request", action: "leave" },
      { label: "Car Request", action: "car" },
      { label: "Expenditure Request", action: "expenditure" },
      { label: "Asset Request", action: "asset" },
    ]
  },
  { icon: FileText, label: "My Requests", path: "/requests" },
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
  {
    icon: FileText,
    label: "New Request",
    path: "#",
    submenu: [
      { label: "Leave Request", action: "leave" },
      { label: "Car Request", action: "car" },
      { label: "Expenditure Request", action: "expenditure" },
      { label: "Asset Request", action: "asset" },
    ]
  },
  { icon: FileText, label: "My Requests", path: "/requests" },
  { icon: Users, label: "Employee Management", path: "/admin/users" },
  { icon: Building2, label: "Department Management", path: "/admin/departments" },
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
      { label: "Asset Request", action: "asset" },
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
  {
    icon: FileText,
    label: "New Request",
    path: "#",
    submenu: [
      { label: "Leave Request", action: "leave" },
      { label: "Car Request", action: "car" },
      { label: "Expenditure Request", action: "expenditure" },
      { label: "Asset Request", action: "asset" },
    ]
  },
  { icon: FileText, label: "My Requests", path: "/requests" },
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
  { icon: Building2, label: "Department Management", path: "/admin/departments" },
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
  const isMobile = useIsMobile();
  const [showRequestDialog, setShowRequestDialog] = useState(false);
  const [requestType, setRequestType] = useState<"leave" | "car" | "expenditure" | "asset">("leave");
  const [expandedItem, setExpandedItem] = useState<string | null>(null);

  const handleRequestItemClick = (action: string) => {
    setRequestType(action as "leave" | "car" | "expenditure" | "asset");
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

  const allMenus = getCombinedMenuItems();
  const currentPath = location.split('?')[0]; // Ignore query params
  const activeMenuItem = allMenus.find(item => {
    if (item.path === currentPath) return true;
    if (item.submenu) {
      return item.submenu.some((sub: any) => sub.path === currentPath);
    }
    return false;
  });

  return (
    <>
      <div className="relative" ref={sidebarRef}>
        <Sidebar
          collapsible="icon"
          className="border-r border-blue-200/50 dark:border-slate-800 bg-blue-50/50 dark:bg-slate-900/50"
          disableTransition={isResizing}
        >
          <SidebarHeader className="h-20 justify-center">
            <div className="flex items-center gap-3 px-3 transition-all w-full">
              {isCollapsed ? (
                <div className="relative h-10 w-10 shrink-0 group">
                  <img
                    src={APP_LOGO}
                    className="h-10 w-10 rounded-xl object-cover shadow-lg dark:shadow-blue-500/20 cursor-pointer"
                    alt="Logo"
                    onClick={toggleSidebar}
                  />
                  <button
                    onClick={toggleSidebar}
                    className="absolute inset-0 hidden items-center justify-center bg-accent rounded-xl ring-1 ring-border focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <PanelLeft className="h-5 w-5 text-foreground" />
                  </button>
                </div>
              ) : (
                <>
                  <div className="flex items-center gap-3 min-w-0">
                    <img
                      src={APP_LOGO}
                      className="h-10 w-10 rounded-xl object-cover shadow-lg dark:shadow-blue-500/20 shrink-0"
                      alt="Logo"
                    />
                    <div className="flex flex-col min-w-0">
                      <span className="font-bold text-slate-900 dark:text-slate-100 tracking-tight truncate">
                        Centrika
                      </span>
                      <span className="text-[10px] font-medium text-blue-500 uppercase tracking-widest">
                        OnePortal
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={toggleSidebar}
                    className="ml-auto h-8 w-8 flex items-center justify-center hover:bg-white dark:hover:bg-slate-800 rounded-lg transition-all shadow-sm hover:shadow border border-transparent hover:border-blue-100 dark:hover:border-slate-700 shrink-0"
                  >
                    <PanelLeft className="h-4 w-4 text-slate-400" />
                  </button>
                </>
              )}
            </div>
          </SidebarHeader>

          <SidebarContent className="gap-0 py-2">
            <SidebarMenu className="px-3 py-2 space-y-1">
              {allMenus.map((item: any) => {
                const isActive = location === item.path || (item.submenu?.some((sub: any) => sub.path === location));
                const hasSubmenu = "submenu" in item && item.submenu;
                const shouldExpand = expandedItem === item.label || (hasSubmenu && item.submenu?.some((sub: any) => sub.path === location));

                return (
                  <SidebarMenuItem key={item.label}>
                    <SidebarMenuButton
                      isActive={isActive}
                      onClick={() => hasSubmenu ? setExpandedItem(expandedItem === item.label ? null : item.label) : (item.path !== "#" && setLocation(item.path))}
                      tooltip={item.label}
                      className={`h-11 transition-all font-medium rounded-xl ${isActive 
                        ? "bg-blue-600 text-white shadow-lg shadow-blue-500/30 hover:bg-blue-700" 
                        : "text-slate-600 dark:text-slate-400 hover:bg-blue-50 dark:hover:bg-slate-800 hover:text-blue-600 dark:hover:text-blue-400"
                      }`}
                    >
                      <item.icon
                        className={`h-4.5 w-4.5 ${isActive ? "text-white" : ""}`}
                      />
                      <span className="ml-1">{item.label}</span>
                      {hasSubmenu && (
                        <ChevronDown className={`ml-auto h-3.5 w-3.5 transition-transform duration-200 ${shouldExpand ? "rotate-180" : ""}`} />
                      )}
                    </SidebarMenuButton>

                    {hasSubmenu && shouldExpand && (
                      <SidebarMenuSub className="ml-5 border-l border-blue-200 dark:border-slate-800 pl-4 py-2 mt-1 space-y-1">
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
                                className={`h-9 text-[13px] font-medium rounded-lg transition-all duration-200 ${isSubitemActive
                                  ? "text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20"
                                  : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800"
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

          <SidebarFooter className="p-4 gap-4 mt-auto border-t border-blue-100 dark:border-slate-800">
            <div className="space-y-3">
              <div className="px-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest group-data-[collapsible=icon]:hidden">
                Profile & Settings
              </div>
              
              <div className="space-y-1">
                {[
                  { icon: User, label: "My Profile", path: "/profile" },
                  { icon: Settings, label: "Settings", path: "/settings" }
                ].map((item) => {
                  const isActive = location === item.path;
                  return (
                    <button
                      key={item.path}
                      onClick={() => setLocation(item.path)}
                      className={`flex items-center gap-3 w-full h-10 px-3 rounded-xl transition-all text-sm font-medium ${isActive 
                        ? "bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 shadow-sm border border-blue-100 dark:border-blue-900/30" 
                        : "text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100"
                      }`}
                    >
                      <item.icon className="h-4 w-4 shrink-0" />
                      <span className="group-data-[collapsible=icon]:hidden">{item.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="space-y-3 pt-2">
              <button 
                onClick={logout}
                className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 hover:text-rose-600 transition-all w-full group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0"
              >
                <LogOut className="h-4 w-4 shrink-0" />
                <span className="group-data-[collapsible=icon]:hidden">Sign Out</span>
              </button>
            </div>
          </SidebarFooter>
        </Sidebar>
        <div
          className={`absolute top-0 right-0 w-1 h-full cursor-col-resize hover:bg-blue-500/20 transition-colors ${isCollapsed ? "hidden" : ""}`}
          onMouseDown={() => {
            if (isCollapsed) return;
            setIsResizing(true);
          }}
          style={{ zIndex: 50 }}
        />
      </div>

      <SidebarInset className="bg-slate-50/50 dark:bg-slate-950/50">
        <header className="sticky top-0 z-40 w-full bg-white/70 dark:bg-slate-900/70 backdrop-blur-md px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <SidebarTrigger className="md:hidden h-9 w-9 border shadow-xs" />
            <div className="flex items-center gap-2">
              <span className="h-5 w-1 bg-blue-500 rounded-full" />
              <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100 uppercase tracking-widest opacity-80">
                {activeMenuItem?.label || "Workspace"}
              </h2>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {switchable && (
              <>
                <NotificationIcon />
                <button
                  onClick={() => toggleTheme?.()}
                  title={theme === "dark" ? "Light Mode" : "Dark Mode"}
                  className="h-10 w-10 flex items-center justify-center rounded-xl bg-transparent hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
                >
                  <ThemeToggleIcon theme={theme} className="h-5 w-5 text-slate-600 dark:text-slate-400" />
                </button>
              </>
            )}

            <div className="flex items-center gap-3 pl-2">
              <div className="flex items-center gap-3 py-1.5 px-2 rounded-2xl">
                <Avatar className="h-8 w-8 border-2 border-white dark:border-slate-700 shadow-xs shrink-0">
                  <AvatarFallback className="text-[10px] font-bold bg-linear-to-br from-blue-500 to-indigo-600 text-white">
                    {user?.name?.split(' ').map(n => n[0]).join('').toUpperCase() || "-"}
                  </AvatarFallback>
                </Avatar>
                <div className="flex flex-col">
                  <p className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate leading-tight">
                    {user?.name || "-"}
                  </p>
                  <p className="text-[10px] font-medium text-slate-400 truncate">
                    {user?.email || "-"}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </header>
        
        <main className="flex-1 p-6 overflow-auto">
          {children}
        </main>
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
