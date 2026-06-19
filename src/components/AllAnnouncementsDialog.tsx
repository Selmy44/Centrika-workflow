import { useState } from "react";
import { format } from "date-fns";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { trpc } from "@/lib/trpc";
import { Loader2, Megaphone, Clock, Building2, Globe, MessageCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";

interface AllAnnouncementsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectAnnouncement: (id: number) => void;
}

const ROLE_COLORS: Record<string, string> = {
  admin: "from-violet-500 to-purple-600",
  hr: "from-emerald-500 to-teal-600",
  head_of_department: "from-amber-500 to-orange-600",
  ceo_md: "from-rose-500 to-red-600",
  user: "from-slate-400 to-slate-500",
};

const ROLE_LABELS: Record<string, string> = {
  admin: "Admin",
  hr: "HR",
  head_of_department: "Head of Department",
  head_of_finance: "Head of Finance",
  ceo_md: "CEO/MD",
  user: "Employee",
};

export function AllAnnouncementsDialog({ isOpen, onClose, onSelectAnnouncement }: AllAnnouncementsDialogProps) {
  const { data: announcements, isLoading } = trpc.announcements.list.useQuery(undefined, {
    enabled: isOpen,
  });
  const [searchQuery, setSearchQuery] = useState("");

  const filteredAnnouncements = announcements?.filter((a: any) => 
    a.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    a.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
    a.author.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-2xl bg-slate-50 dark:bg-slate-950 border-none rounded-3xl p-0 overflow-hidden shadow-2xl flex flex-col max-h-[85vh]">
        
        {/* Header */}
        <DialogHeader className="bg-white dark:bg-slate-900 border-b border-border/50 p-6 pb-5 shrink-0 z-10 relative">
          <DialogTitle className="flex items-center gap-2 text-xl font-black text-[#3b6dae] dark:text-blue-400">
            <Megaphone className="w-5 h-5 text-[#c79d2d]" />
            All Communications
          </DialogTitle>
          <div className="mt-4 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input 
              placeholder="Search announcements..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-800 focus-visible:ring-[#3b6dae] rounded-xl text-sm h-10"
            />
          </div>
        </DialogHeader>

        {/* Content */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center p-20 gap-4 flex-1">
            <Loader2 className="w-8 h-8 animate-spin text-[#3b6dae]/40" />
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Loading communications...</p>
          </div>
        ) : !filteredAnnouncements || filteredAnnouncements.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-20 gap-3 flex-1">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-2">
              <Search className="w-6 h-6 text-slate-300" />
            </div>
            <p className="text-sm font-bold text-slate-500">No announcements found</p>
            <p className="text-xs text-slate-400">Try adjusting your search terms</p>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto p-6 bg-slate-50/50 dark:bg-slate-950/50 custom-scrollbar">
            <div className="space-y-3 pb-6">
              {filteredAnnouncements.map((announcement: any) => {
                const roleGradient = ROLE_COLORS[announcement.author.role] || ROLE_COLORS.user;
                
                return (
                  <div 
                    key={announcement.id}
                    onClick={() => {
                      onClose();
                      onSelectAnnouncement(announcement.id);
                    }}
                    className="group bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-[#3b6dae] rounded-2xl p-4 shadow-sm hover:shadow-md transition-all cursor-pointer relative overflow-hidden"
                  >
                    <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b opacity-0 group-hover:opacity-100 transition-opacity from-[#3b6dae] to-[#c79d2d]" />
                    
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex items-center gap-2">
                        <div className={`w-6 h-6 rounded-lg bg-gradient-to-br ${roleGradient} flex items-center justify-center text-white text-[10px] font-black shadow-sm`}>
                          {announcement.author.name.charAt(0)}
                        </div>
                        <div>
                          <p className="text-xs font-bold text-slate-800 dark:text-slate-200 leading-none flex items-center">
                            {announcement.author.name}
                            {announcement.author.position && (
                              <span className="text-[9px] font-medium text-slate-500 dark:text-slate-400 ml-1.5 opacity-80 border-l border-slate-300 dark:border-slate-700 pl-1.5">
                                {announcement.author.position}
                              </span>
                            )}
                          </p>
                          <p className="text-[9px] text-slate-400 mt-1 uppercase tracking-wider font-semibold">
                            {ROLE_LABELS[announcement.author.role] || announcement.author.role}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-medium">
                        <Clock className="w-3 h-3" />
                        {format(new Date(announcement.createdAt), "MMM d, yyyy")}
                      </div>
                    </div>
                    
                    <h3 className="text-sm font-bold text-[#3b6dae] dark:text-blue-300 mt-3 mb-2 group-hover:text-[#2d5385] transition-colors line-clamp-1">
                      {announcement.title}
                    </h3>
                    
                    <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed mb-3">
                      {announcement.content}
                    </p>
                    
                    <div className="flex items-center justify-between mt-auto pt-3 border-t border-slate-100 dark:border-slate-800">
                      <div className="flex items-center gap-2 text-[10px] font-semibold">
                        {announcement.department ? (
                          <span className="flex items-center gap-1 text-teal-600 dark:text-teal-400 bg-teal-50 dark:bg-teal-900/30 px-2 py-1 rounded-md">
                            <Building2 size={10} />
                            {announcement.department.name}
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-[#3b6dae] dark:text-blue-300 bg-blue-50 dark:bg-blue-900/30 px-2 py-1 rounded-md">
                            <Globe size={10} />
                            Company Wide
                          </span>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-1 text-[10px] font-bold text-slate-400 group-hover:text-[#c79d2d] transition-colors">
                        <MessageCircle className="w-3 h-3" />
                        {announcement._count?.comments || 0} {announcement._count?.comments === 1 ? 'comment' : 'comments'}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
