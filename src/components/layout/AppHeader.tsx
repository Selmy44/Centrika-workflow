import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import NotificationIcon from "@/components/NotificationIcon";
import ThemeToggleIcon from "@/components/ui/ThemeToggleIcon";
import { useTheme } from "@/contexts/ThemeContext";
import { useAuth } from "@/_core/hooks/useAuth";

interface AppHeaderProps {
  activeMenuLabel?: string;
}

export function AppHeader({ activeMenuLabel }: AppHeaderProps) {
  const { user } = useAuth();
  const { theme, toggleTheme, switchable } = useTheme();

  return (
    <header className="sticky top-0 z-40 w-full bg-slate-50/80 dark:bg-slate-900/70 backdrop-blur-md h-16 border-b border-[#3b6dae]/5 no-print">
      <div className="flex h-full w-full">
        {/* Left Header Area */}
        <div className="flex-1 flex items-center justify-between px-4 lg:px-8 overflow-hidden">
          <div className="flex items-center gap-2 md:gap-4">
            <SidebarTrigger className="md:hidden h-8 w-8 border shadow-xs shrink-0" />
            <div className="flex items-center gap-2 min-w-0">
              <span className="h-5 w-1 bg-[#3b6dae] dark:bg-[#c79d2d] rounded-full shrink-0" />
              <h2 className="text-xs md:text-sm font-black text-[#3b6dae] dark:text-[#c79d2d] uppercase tracking-[0.2em] opacity-80 truncate">
                {activeMenuLabel || "Workspace"}
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
  );
}
