import { useState } from "react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  useSidebar,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarMenuSub,
  SidebarMenuSubItem,
  SidebarMenuSubButton,
} from "@/components/ui/sidebar";
import { APP_LOGO, APP_TITLE } from "@/const";
import { useAuth } from "@/_core/hooks/useAuth";
import { useNavigation } from "@/_core/hooks/useNavigation";
import { useIsMobile } from "@/hooks/useMobile";
import { PanelLeft, ChevronDown, LogOut } from "lucide-react";

interface AppSidebarProps {
  isResizing: boolean;
  setIsResizing: (val: boolean) => void;
  onActionClick: (action: string) => void;
  sidebarRef: React.RefObject<HTMLDivElement | null>;
}

export function AppSidebar({ isResizing, setIsResizing, onActionClick, sidebarRef }: AppSidebarProps) {
  const { logout } = useAuth();
  const { menuItems, location, setLocation } = useNavigation();
  const { state, toggleSidebar, setOpen } = useSidebar();
  const isCollapsed = state === "collapsed";
  const isMobile = useIsMobile();
  const [expandedItem, setExpandedItem] = useState<string | null>(null);

  const handleToggleSubmenu = (label: string) => {
    setExpandedItem(prev => (prev === label ? null : label));
  };

  return (
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
                    className="h-10 w-auto object-contain cursor-pointer drop-shadow-md brightness-110"
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
                    className="h-8 w-auto object-contain shrink-0 brightness-110"
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
                  title="Toggle Sidebar"
                  aria-label="Toggle Sidebar"
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
            {menuItems.map((item) => {
              const isActive = location === item.path || (item.submenu?.some((sub) => sub.path === location));
              const hasSubmenu = !!item.submenu;
              const shouldExpand = expandedItem === item.label || (hasSubmenu && item.submenu?.some((sub) => sub.path === location));

              return (
                <SidebarMenuItem key={item.label}>
                  <SidebarMenuButton
                    isActive={isActive}
                    onClick={() => hasSubmenu ? handleToggleSubmenu(item.label) : (item.path !== "#" && setLocation(item.path))}
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
                      {item.submenu?.map((subitem) => {
                        const isSubitemActive = subitem.path === location;
                        return (
                          <SidebarMenuSubItem key={subitem.action || subitem.path || subitem.label}>
                            <SidebarMenuSubButton
                              onClick={() => {
                                if (subitem.action) {
                                  onActionClick(subitem.action);
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
        className={`absolute top-0 right-0 w-1 h-full cursor-col-resize hover:bg-blue-500/20 transition-colors z-50 ${isCollapsed ? "hidden" : ""}`}
        onMouseDown={() => {
          if (isCollapsed) return;
          setIsResizing(true);
        }}
      />
    </div>
  );
}
