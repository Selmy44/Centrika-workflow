import { useAuth } from "@/_core/hooks/useAuth";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { APP_LOGO, APP_TITLE, getLoginUrl } from "@/const";
import { CSSProperties, useEffect, useRef, useState } from "react";
import { DashboardLayoutSkeleton } from "../DashboardLayoutSkeleton";
import { Button } from "../ui/button";
import { CreateRequestDialog } from "@/components/CreateRequestDialog";
import { AppSidebar } from "./AppSidebar";
import { AppHeader } from "./AppHeader";
import { useNavigation } from "@/_core/hooks/useNavigation";

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

function DashboardLayoutContent({
  children,
  setSidebarWidth,
}: {
  children: React.ReactNode;
  setSidebarWidth: (width: number) => void;
}) {
  const [isResizing, setIsResizing] = useState(false);
  const sidebarRef = useRef<HTMLDivElement>(null);
  const [showRequestDialog, setShowRequestDialog] = useState(false);
  const [requestType, setRequestType] = useState<"leave" | "car" | "expenditure" | "asset">("leave");
  const { activeMenuItem } = useNavigation();

  const handleRequestItemClick = (action: string) => {
    setRequestType(action as "leave" | "car" | "expenditure" | "asset");
    setShowRequestDialog(true);
  };

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
      <AppSidebar 
        isResizing={isResizing} 
        setIsResizing={setIsResizing} 
        onActionClick={handleRequestItemClick}
        sidebarRef={sidebarRef}
      />
      <SidebarInset className="bg-[#FFFAE8] dark:bg-slate-950/50">
        <AppHeader activeMenuLabel={activeMenuItem?.label} />
        <main className="flex-1 overflow-auto custom-scrollbar">
          {children}
        </main>
      </SidebarInset>

      <CreateRequestDialog
        open={showRequestDialog}
        onOpenChange={setShowRequestDialog}
        initialRequestType={requestType}
      />
    </>
  );
}
