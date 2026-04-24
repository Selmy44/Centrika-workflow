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
import { useIsMobile, useIsTablet } from "@/hooks/useMobile";
import { LayoutDashboard, LogOut, PanelLeft, FileText, CheckCircle, Settings, Users, Bell, TrendingUp, DollarSign, Search, ChevronDown, Car, Calendar, BarChart3, User, Lock, AlertCircle, Building2, Wallet, Receipt, UserPlus, Package, MessageSquare } from "lucide-react";
import { useTheme } from "@/contexts/ThemeContext";
import ThemeToggleIcon from "@/components/ui/ThemeToggleIcon";
import NotificationIcon from "@/components/NotificationIcon";
import React, { CSSProperties, useCallback, useEffect, useRef, useState } from "react";
import { useLocation } from "wouter";
import { DashboardLayoutSkeleton } from './DashboardLayoutSkeleton';
import { Button } from "./ui/button";
import { CreateRequestDialog } from "@/components/CreateRequestDialog";
import { Input } from "./ui/input";
import { ConnectFloatingDock } from "./ConnectFloatingDock";

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
    ],
  },
  { icon: FileText, label: "My Requests", path: "/requests" },
  { icon: Calendar, label: "Leave Balance", path: "/leave-balance" },
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
    ],
  },
  { icon: FileText, label: "My Requests", path: "/requests" },
  { icon: Users, label: "Employee Directory", path: "/employee-directory" },
  { icon: UserPlus, label: "User Management", path: "/admin/users" },
  { icon: Package, label: "Asset Registry", path: "/assets" },
  { icon: Building2, label: "Departments", path: "/departments" },
  { icon: CheckCircle, label: "Approvals", path: "/approvals" },
];

const financeMenuItems = [
  { icon: LayoutDashboard, label: "Dashboard", path: "/" },
  { icon: CheckCircle, label: "Approvals", path: "/approvals" },
  { icon: Package, label: "Asset Registry", path: "/assets" },
  { icon: Receipt, label: "Expenditure History", path: "/finance/history" },
  { icon: Wallet, label: "Budget Management", path: "/finance/budgets" },
  { icon: BarChart3, label: "Finance Reports", path: "/finance/reports" },
  { icon: FileText, label: "My Requests", path: "/requests" },
  {
    icon: FileText,
    label: "New Request",
    path: "#",
    submenu: [
      { label: "Leave Request", action: "leave" },
      { label: "Car Request", action: "car" },
      { label: "Expenditure Request", action: "expenditure" },
      { label: "Asset Request", action: "asset" },
    ],
  },
];

const hrMenuItems = [
  { icon: LayoutDashboard, label: "Dashboard", path: "/" },
  { icon: Users, label: "Employee Directory", path: "/employee-directory" },
  { icon: UserPlus, label: "User Management", path: "/admin/users" },
  { icon: Package, label: "Asset Registry", path: "/assets" },
  { icon: Calendar, label: "Leave Management", path: "/hr/leave" },
  { icon: FileText, label: "Document Center", path: "/hr/documents" },
  { icon: BarChart3, label: "HR Reports", path: "/hr/reports" },
  { icon: Building2, label: "Departments", path: "/departments" },
  { icon: CheckCircle, label: "Approvals", path: "/approvals" },
  { icon: FileText, label: "My Requests", path: "/requests" },
  {
    icon: FileText,
    label: "New Request",
    path: "#",
    submenu: [
      { label: "Leave Request", action: "leave" },
      { label: "Car Request", action: "car" },
      { label: "Expenditure Request", action: "expenditure" },
      { label: "Asset Request", action: "asset" },
    ],
  },
];

const deptHeadMenuItems = [
  { icon: LayoutDashboard, label: "Dashboard", path: "/" },
  { icon: CheckCircle, label: "Approvals", path: "/approvals" },
  { icon: Package, label: "Asset Registry", path: "/assets" },
  { icon: Users, label: "Employee Directory", path: "/employee-directory" },
  { icon: Calendar, label: "Team Status", path: "/team-status" },
  { icon: BarChart3, label: "Team Stats", path: "/team-statistics" },
  {
    icon: FileText,
    label: "New Request",
    path: "#",
    submenu: [
      { label: "Leave Request", action: "leave" },
      { label: "Car Request", action: "car" },
      { label: "Expenditure Request", action: "expenditure" },
      { label: "Asset Request", action: "asset" },
    ],
  },
  { icon: FileText, label: "My Requests", path: "/requests" },
];

const ceoMenuItems = [
  { icon: LayoutDashboard, label: "Dashboard", path: "/" },
  { icon: CheckCircle, label: "Approvals", path: "/approvals" },
  { icon: Package, label: "Asset Registry", path: "/assets" },
  { icon: BarChart3, label: "Reports", path: "/finance/reports" },
  { icon: Users, label: "Organization View", path: "/organization-view" },
  { icon: Building2, label: "Department Management", path: "/departments" },
  { icon: Search, label: "Employee Directory", path: "/employee-directory" },
  { icon: TrendingUp, label: "Strategic Overview", path: "/request-analytics" },
  { icon: FileText, label: "My Requests", path: "/requests" },
  {
    icon: FileText,
    label: "New Request",
    path: "#",
    submenu: [
      { label: "Leave Request", action: "leave" },
      { label: "Car Request", action: "car" },
      { label: "Expenditure Request", action: "expenditure" },
      { label: "Asset Request", action: "asset" },
    ],
  },
];
const SIDEBAR_WIDTH_KEY = "sidebar-width";
const DEFAULT_WIDTH = 240;
const MIN_WIDTH = 180;
const MAX_WIDTH = 480;

export default function DashboardLayout({
  children,
  hideConnectDock = false,
}: {
  children: React.ReactNode;
  hideConnectDock?: boolean;
}) {
  const [sidebarWidth, setSidebarWidth] = useState(() => {
    const saved = localStorage.getItem(SIDEBAR_WIDTH_KEY);
    return saved ? parseInt(saved, 10) : DEFAULT_WIDTH;
  });
  const { loading, user } = useAuth();
  const [currentPath] = useLocation();

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
      {!hideConnectDock && <ConnectFloatingDock />}
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

  const { data: pendingApprovals } = (trpc as any).requests.listPendingApprovals.useQuery(undefined, { enabled: !!user && user.role !== "user" });
  const { data: connectUnreadCount } = (trpc as any).suggestions.getUnreadCount.useQuery(undefined, { enabled: !!user, refetchInterval: 10000 });
  const { theme, toggleTheme, switchable } = useTheme();
  const [location, setLocation] = useLocation();
  const { state, toggleSidebar, setOpen } = useSidebar();
  const isCollapsed = state === "collapsed";
  const [isResizing, setIsResizing] = useState(false);
  const sidebarRef = useRef<HTMLDivElement>(null);
  const isMobile = useIsMobile();
  const isTablet = useIsTablet();
  const isSmallScreen = isMobile || isTablet;
  
  // collapsible mode: "offcanvas" (drawer) for mobile/tablet, "icon" (collapsible) for desktop
  const collapsibleMode: "icon" | "offcanvas" = isSmallScreen ? "offcanvas" : "icon";
  
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
          collapsible={collapsibleMode}
          className="border-r-0 shadow-[2px_0_8px_-3px_rgba(0,0,0,0.1)] dark:shadow-none bg-linear-to-b from-[#3b6dae] via-[#325d96] to-[#264b77] dark:bg-none dark:bg-[#0f172a] text-white overflow-hidden"
          disableTransition={isResizing}
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
            <SidebarMenu className="px-3 py-2 space-y-1 group-data-[collapsible=icon]:px-0 group-data-[collapsible=icon]:items-center">
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
                      className={`relative h-11 md:h-12 transition-all duration-300 rounded-xl group-data-[collapsible=icon]:rounded-2xl group-data-[collapsible=icon]:size-11 group-data-[collapsible=icon]:md:size-12 group-data-[collapsible=icon]:p-0 group-data-[collapsible=icon]:justify-center border ${isActive
                        ? "bg-transparent text-[#c79d2d] font-black uppercase tracking-[0.2em] shadow-none border-transparent"
                        : "font-semibold border-transparent text-white/70 hover:bg-white/10 hover:text-white hover:translate-x-1 group-data-[collapsible=icon]:hover:translate-x-0 group-data-[collapsible=icon]:overflow-hidden"
                        }`}
                    >
                      {isActive && (
                        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-6 bg-[#c79d2d] rounded-r-full shadow-sm shadow-[#c79d2d]/30" />
                      )}
                      <item.icon
                        className={`h-5 w-5 shrink-0 ${isActive ? "text-[#c79d2d]" : ""}`}
                      />
                      <span className="ml-2 group-data-[collapsible=icon]:hidden whitespace-nowrap">{item.label}</span>
                      
                      {/* Notifications Badge Layer */}
                      {item.label === "Centrika Connect" && connectUnreadCount && connectUnreadCount > 0 ? (
                        <span className="ml-auto flex shrink-0 items-center justify-center rounded-full bg-rose-500 text-[10px] font-black text-white h-5 min-w-5 px-1 shadow-md shadow-rose-500/20 animate-in zoom-in group-data-[collapsible=icon]:absolute group-data-[collapsible=icon]:top-1 group-data-[collapsible=icon]:right-1 group-data-[collapsible=icon]:h-4 group-data-[collapsible=icon]:min-w-4 group-data-[collapsible=icon]:text-[8px]">
                          {connectUnreadCount > 99 ? '99+' : connectUnreadCount}
                        </span>
                      ) : null}

                      {hasSubmenu && (
                        <ChevronDown className={`ml-auto h-3.5 w-3.5 transition-transform duration-200 group-data-[collapsible=icon]:hidden ${shouldExpand ? "rotate-180" : ""}`} />
                      )}
                    </SidebarMenuButton>

                    {hasSubmenu && shouldExpand && (
                      <SidebarMenuSub className="ml-6 border-l-2 border-white/20 dark:border-slate-800/80 pl-4 py-2 mt-1 space-y-1 group-data-[collapsible=icon]:hidden">
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
                                className={`h-10 text-[13px] md:text-[14px] font-semibold rounded-lg transition-all duration-300 ${isSubitemActive
                                  ? "text-[#c79d2d] bg-white/10"
                                  : "text-white/60 hover:text-white hover:bg-white/10 hover:translate-x-1"
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

          <SidebarFooter className="p-4 gap-4 mt-auto relative before:absolute before:top-0 before:left-4 before:right-4 before:h-px before:bg-white/20 dark:before:bg-slate-700/50">
            <div className="space-y-3">
              <div className="px-2 text-[10px] font-bold text-white/50 uppercase tracking-widest group-data-[collapsible=icon]:hidden">
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
                      className={`flex items-center gap-3 w-full h-12 px-3 rounded-xl transition-all text-sm font-semibold ${isActive
                        ? "bg-[#c79d2d] text-white shadow-lg shadow-[#c79d2d]/10 hover:bg-[#c79d2d]/90 group-data-[collapsible=icon]:shadow-[#c79d2d]/30"
                        : "text-white/70 hover:bg-white/10 hover:text-white"
                        } group-data-[collapsible=icon]:size-12 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:p-0 group-data-[collapsible=icon]:rounded-2xl group-data-[collapsible=icon]:mx-auto`}
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
                className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-rose-300 hover:bg-rose-500/20 hover:text-rose-200 transition-all w-full group-data-[collapsible=icon]:size-12 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0 group-data-[collapsible=icon]:rounded-2xl group-data-[collapsible=icon]:mx-auto"
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

      <SidebarInset className="bg-[#FFFAE8] dark:bg-slate-950 transition-colors duration-300">
        <header className="sticky top-0 z-40 w-full bg-white/95 dark:bg-slate-900/95 backdrop-blur-md h-14 sm:h-16 border-b border-slate-200/60 dark:border-slate-800/80 shadow-xs dark:shadow-none no-print transition-colors duration-300">
          <div className="flex h-full w-full">
            {/* Left Header Area */}
            <div className="flex-1 flex items-center justify-between px-2 sm:px-4 lg:px-8 gap-2 sm:gap-4">
              <div className="flex items-center gap-1 sm:gap-2 md:gap-4 min-w-0">
                <SidebarTrigger className="h-7 w-7 sm:h-8 sm:w-8 xl:hidden border shadow-xs shrink-0 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 text-xs" />
                <div className="flex items-center gap-1 sm:gap-2 min-w-0">
                  <span className="h-4 sm:h-5 w-0.5 sm:w-1 bg-[#3b6dae] dark:bg-[#c79d2d] rounded-full shrink-0" />
                  <h2 className="text-xs md:text-sm font-black text-[#3b6dae] dark:text-[#c79d2d] uppercase tracking-[0.1em] md:tracking-[0.2em] opacity-80 truncate">
                    {activeMenuItem?.label || "Workspace"}
                  </h2>
                </div>
              </div>



              {/* Utilities */}
              <div className="flex items-center gap-1 sm:gap-2 md:gap-4 ml-auto shrink-0">
                {switchable && (
                  <div className="flex items-center gap-1 sm:gap-2">
                    <NotificationIcon />
                    <button
                      onClick={() => toggleTheme?.()}
                      title={theme === "dark" ? "Light Mode" : "Dark Mode"}
                      className="h-8 sm:h-10 w-8 sm:w-10 flex items-center justify-center rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 transition-colors"
                    >
                      <ThemeToggleIcon theme={theme} className="h-4 w-4 sm:h-5 sm:w-5 text-slate-600 dark:text-slate-300" />
                    </button>
                  </div>
                )}
                
                {/* Vertical Divider */}
                <div className="hidden sm:block h-7 sm:h-8 w-px bg-slate-200 dark:bg-slate-800 mx-1 sm:mx-2" />
                
                {/* Profile Section */}
                <div className="flex items-center gap-2 sm:gap-3 py-1 sm:py-1.5 px-1 sm:px-2 rounded-full cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800/50 transition-colors">
                <Avatar className="h-7 w-7 sm:h-8 sm:w-8 md:h-9 md:w-9 border-2 border-[#3b6dae]/10 dark:border-blue-500/20 shadow-sm shrink-0">
                  <AvatarImage src={user?.profileImage || ""} alt={user?.name || "User"} className="object-cover" />
                  <AvatarFallback className="text-[9px] sm:text-[10px] font-black bg-linear-to-br from-[#3b6dae] to-[#2d5385] text-white">
                    {user?.name?.split(' ').map((n: string) => n[0]).join('').toUpperCase() || "-"}
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
          </div>
        </header>

        <main className="flex-1 overflow-auto custom-scrollbar flex flex-col min-h-0">
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
