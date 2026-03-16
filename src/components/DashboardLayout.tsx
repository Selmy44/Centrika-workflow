import { useAuth } from "@/_core/hooks/useAuth";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
import { LayoutDashboard, LogOut, PanelLeft, FileText, CheckCircle, Settings, Users, Bell, TrendingUp, DollarSign, Search, ChevronDown, Car, Calendar, BarChart3, User, Lock, AlertCircle, Building2, BookOpen } from "lucide-react";
import { useTheme } from "@/contexts/ThemeContext";
import ThemeToggleIcon from "@/components/ui/ThemeToggleIcon";
import NotificationIcon from "@/components/NotificationIcon";
import { CSSProperties, useCallback, useEffect, useRef, useState } from "react";
import { useLocation } from "wouter";
import { DashboardLayoutSkeleton } from './DashboardLayoutSkeleton';
import { Button } from "./ui/button";
import { CreateRequestDialog } from "@/components/CreateRequestDialog";
import { Input } from "./ui/input";

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
  { icon: BookOpen, label: "Knowledge Base", path: "/policies" },
  { icon: TrendingUp, label: "My Insights", path: "/insights" },
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
  { icon: CheckCircle, label: "Approvals", path: "/approvals" },
  { icon: BookOpen, label: "Knowledge Base", path: "/policies" },
  { icon: Settings, label: "System Settings", path: "/settings" },
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
  { icon: Settings, label: "System Settings", path: "/settings" },
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
  { icon: CheckCircle, label: "Approvals", path: "/approvals" },
  { icon: BookOpen, label: "Knowledge Base", path: "/policies" },
  {
    icon: Calendar,
    label: "Leave Management",
    path: "/leave-balance",
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
  { icon: BarChart3, label: "Employee Directory", path: "/employee-directory" },
];

const deptHeadMenuItems = [
  { icon: LayoutDashboard, label: "Dashboard", path: "/" },
  { icon: CheckCircle, label: "Pending Approvals", path: "/approvals" },
  { icon: Users, label: "Department Team", path: "/employee-directory" },
  { icon: BookOpen, label: "Knowledge Base", path: "/policies" },
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
  { icon: Calendar, label: "Team Status", path: "/employee-directory" },
  { icon: BarChart3, label: "Team Stats", path: "/employee-directory" },
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
  { icon: BookOpen, label: "Knowledge Base", path: "/policies" },
  { icon: BarChart3, label: "Reports", path: "/approvals" },
  { icon: Users, label: "Organization View", path: "/employee-directory" },
  { icon: Building2, label: "Department Management", path: "/admin/departments" },
  { icon: Search, label: "Employee Directory", path: "/employee-directory" },
  { icon: TrendingUp, label: "Strategic Overview", path: "/approvals" },
];
const SIDEBAR_WIDTH_KEY = "sidebar-width";
const DEFAULT_WIDTH = 240;
const MIN_WIDTH = 180;
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
            <div className="h-1 w-full bg-linear-to-r from-[#3b6dae] to-[#c79d2d]" />
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
  const { state, toggleSidebar, setOpen } = useSidebar();
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
          className="border-r border-blue-900/10 dark:border-blue-950/50 bg-[#3b6dae] dark:bg-[#0f172a] text-white"
          disableTransition={isResizing}
          onMouseEnter={() => !isMobile && setOpen(true)}
          onMouseLeave={() => !isMobile && setOpen(false)}
        >
          <SidebarHeader className="h-20 justify-center">
            <div className="flex items-center gap-3 px-3 transition-all w-full">
              {isCollapsed ? (
                <div className="flex flex-col items-center w-full group">
                  <div className="relative h-12 w-12 group transition-transform hover:scale-105">
                    <img
                      src={APP_LOGO}
                      className="h-12 w-12 rounded-xl object-cover shadow-lg dark:shadow-blue-500/20 cursor-pointer border border-white/10"
                      alt="Logo"
                      onClick={toggleSidebar}
                    />
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex items-center gap-3 min-w-0">
                    <img
                      src={APP_LOGO}
                      className="h-10 w-10 rounded-xl object-cover shadow-2xl ring-2 ring-white/10 shrink-0"
                      alt="Logo"
                    />
                    <div className="flex flex-col min-w-0">
                      <span className="font-bold text-white tracking-tight truncate">
                        Centrika
                      </span>
                      <span className="text-[10px] font-bold text-[#c79d2d] uppercase tracking-[0.2em]">
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
                      className={`h-12 transition-all font-semibold rounded-xl group-data-[collapsible=icon]:rounded-2xl group-data-[collapsible=icon]:size-12 group-data-[collapsible=icon]:p-0 group-data-[collapsible=icon]:justify-center overflow-hidden ${isActive 
                        ? "bg-[#c79d2d] text-white shadow-lg shadow-black/10 hover:bg-[#c79d2d]/90 group-data-[collapsible=icon]:shadow-[#c79d2d]/30" 
                        : "text-white/70 hover:bg-white/10 hover:text-white"
                      }`}
                    >
                      <item.icon 
                        className={`h-5 w-5 shrink-0 ${isActive ? "text-white" : ""}`}
                      />
                      <span className="ml-2 group-data-[collapsible=icon]:hidden whitespace-nowrap">{item.label}</span>
                      {hasSubmenu && (
                        <ChevronDown className={`ml-auto h-3.5 w-3.5 transition-transform duration-200 group-data-[collapsible=icon]:hidden ${shouldExpand ? "rotate-180" : ""}`} />
                      )}
                    </SidebarMenuButton>

                    {hasSubmenu && shouldExpand && (
                      <SidebarMenuSub className="ml-5 border-l border-blue-200 dark:border-slate-800 pl-4 py-2 mt-1 space-y-1 group-data-[collapsible=icon]:hidden">
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
                                className={`h-10 text-[14px] font-semibold rounded-lg transition-all duration-200 ${isSubitemActive
                                  ? "text-[#c79d2d] bg-white/10"
                                  : "text-teal-50/60 hover:text-white hover:bg-white/5"
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
                  { icon: Settings, label: "Settings", path: "/settings" }
                ].map((item) => {
                  const isActive = location === item.path;
                  return (
                    <button
                      key={item.path}
                      onClick={() => setLocation(item.path)}
                      className={`flex items-center gap-3 w-full h-12 px-3 rounded-xl transition-all text-sm font-medium ${isActive
                        ? "bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 shadow-sm border border-blue-100 dark:border-blue-900/30"
                        : "text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100"
                        } group-data-[collapsible=icon]:size-12 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:p-0 group-data-[collapsible=icon]:rounded-2xl`}
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
                className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 hover:text-rose-600 transition-all w-full group-data-[collapsible=icon]:size-12 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0 group-data-[collapsible=icon]:rounded-2xl"
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

      <SidebarInset className="bg-[#FFFAE8] dark:bg-slate-950/50">
        <header className="sticky top-0 z-40 w-full bg-slate-50/80 dark:bg-slate-900/70 backdrop-blur-md h-16 border-b border-[#3b6dae]/5 no-print">
          <div className="flex h-full w-full">
            {/* Left Header Area */}
            <div className="flex-1 flex items-center justify-between px-4 lg:px-8 overflow-hidden">
              <div className="flex items-center gap-2 md:gap-4">
                <SidebarTrigger className="md:hidden h-8 w-8 border shadow-xs shrink-0" />
                <div className="flex items-center gap-2 min-w-0">
                  <span className="h-5 w-1 bg-[#3b6dae] dark:bg-[#c79d2d] rounded-full shrink-0" />
                  <h2 className="text-xs md:text-sm font-black text-[#3b6dae] dark:text-[#c79d2d] uppercase tracking-[0.2em] opacity-80 truncate">
                    {activeMenuItem?.label || "Workspace"}
                  </h2>
                </div>
              </div>

              {/* Minimalist Search Bar */}
              <div className="hidden lg:flex items-center flex-1 max-w-sm mx-4">
                <div className="relative w-full group">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#3b6dae]/30 group-focus-within:text-[#3b6dae] transition-colors" />
                  <Input
                    placeholder="Search records, requests..."
                    className="pl-10 h-10 bg-white/40 border-[#3b6dae]/5 focus:border-[#3b6dae]/20 focus:ring-0 rounded-xl text-xs font-medium placeholder:text-[#3b6dae]/20 transition-all w-full"
                  />
                </div>
              </div>

              {/* Utilities */}
              <div className="flex items-center gap-1 md:gap-2 ml-auto shrink-0">
                {switchable && (
                  <>
                    <NotificationIcon />
                    <button
                      onClick={() => toggleTheme?.()}
                      title={theme === "dark" ? "Light Mode" : "Dark Mode"}
                      className="h-9 w-9 md:h-10 md:w-10 flex items-center justify-center rounded-xl bg-transparent hover:bg-white/50 transition-all dark:hover:bg-slate-800"
                    >
                      <ThemeToggleIcon theme={theme} className="h-4 w-4 md:h-5 md:w-5 text-[#3b6dae]/60 dark:text-slate-400" />
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Right Header Area (Profile) */}
            <div className="flex items-center justify-end px-4 lg:px-8 bg-white/40 dark:bg-slate-900/40 border-l border-[#3b6dae]/5 shrink-0">
              <div className="flex items-center gap-2 py-1.5 rounded-2xl cursor-pointer hover:bg-white/50 dark:hover:bg-slate-800/50 transition-colors">
                <Avatar className="h-8 w-8 md:h-9 md:w-9 border-2 border-[#3b6dae]/10 dark:border-blue-500/20 shadow-sm shrink-0">
                  <AvatarImage src={user?.profileImage || ""} alt={user?.name || "User"} className="object-cover" />
                  <AvatarFallback className="text-[10px] font-black bg-linear-to-br from-[#3b6dae] to-[#2d5385] text-white">
                    {user?.name?.split(' ').map(n => n[0]).join('').toUpperCase() || "-"}
                  </AvatarFallback>
                </Avatar>
                <div className="hidden lg:flex flex-col">
                  <p className="text-xs font-black text-slate-900 dark:text-slate-100 truncate leading-tight w-40">
                    {user?.name || "-"}
                  </p>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <p className="text-[10px] font-bold text-[#3b6dae] truncate uppercase tracking-widest leading-none">
                      {user?.position || "Member"}
                    </p>
                    <span className="text-[10px] text-[#3b6dae]/30">•</span>
                    <p className="text-[10px] font-bold text-[#3b6dae]/60 truncate uppercase tracking-widest leading-none">
                      {typeof user?.department === 'object' ? (user?.department?.name || "Corporate") : (user?.department || "Corporate")}
                    </p>
                  </div>
                  <p className="text-[9px] font-medium text-slate-400 truncate lowercase tracking-tighter leading-none mt-0.5">
                    {user?.email || "-"}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-auto custom-scrollbar">
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
