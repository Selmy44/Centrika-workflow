import { useState, useEffect } from "react";
import { useSearch } from "wouter";
import { Megaphone, Loader2, Quote, Clock, Globe, Building2, MessageCircle, ArrowRight } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { AnnouncementFormDialog } from "./AnnouncementFormDialog";
import { AllAnnouncementsDialog } from "./AllAnnouncementsDialog";
import { AnnouncementDetailDialog } from "./AnnouncementDetailDialog";

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
  head_of_department: "HOD",
  ceo_md: "CEO / MD",
  user: "Staff",
};

function timeAgo(date: string | Date) {
  const now = new Date();
  const d = new Date(date);
  const diff = now.getTime() - d.getTime();
  const mins = Math.floor(diff / 60000);
  const hrs = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  if (hrs < 24) return `${hrs}h ago`;
  if (days < 7) return `${days}d ago`;
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

export function NoticeBoard() {
  const { user } = useAuth();
  const searchString = useSearch();
  const { data: announcements, isLoading } = trpc.announcements.list.useQuery();
  
  // Dialog state
  const [isAllModalOpen, setIsAllModalOpen] = useState(false);
  const [selectedDetailId, setSelectedDetailId] = useState<number | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(searchString);
    const annId = params.get("announcementId");
    if (annId) {
      setSelectedDetailId(parseInt(annId, 10));
    }
  }, [searchString]);

  useEffect(() => {
    const handleOpenDetail = (e: any) => {
      if (e.detail?.id) {
        setSelectedDetailId(e.detail.id);
      }
    };
    window.addEventListener('open-announcement-detail', handleOpenDetail);
    return () => window.removeEventListener('open-announcement-detail', handleOpenDetail);
  }, []);

  const allowedPostRoles = ["admin", "hr", "head_of_department", "ceo_md"];
  const userAdditionalRoles: string[] = user?.additionalRoles
    ? (typeof user.additionalRoles === "string" ? JSON.parse(user.additionalRoles) : user.additionalRoles)
    : [];
  
  const canPostAnnouncement = user && (
    allowedPostRoles.includes(user.role) ||
    userAdditionalRoles.some((r: string) => allowedPostRoles.includes(r))
  );

  const total = announcements?.length || 0;
  const currentAnnouncement = announcements?.[0]; // Show the absolute latest

  const roleGradient = currentAnnouncement
    ? ROLE_COLORS[currentAnnouncement.author.role] || ROLE_COLORS.user
    : ROLE_COLORS.user;

  return (
    <div className="space-y-4 m-4">
      {/* Header */}
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#3b6dae] to-[#2d5385] flex items-center justify-center shadow-lg shadow-blue-900/20">
            <Megaphone size={14} className="text-white" />
          </div>
          <div>
            <h2 className="text-sm font-black text-[#3b6dae] dark:text-blue-100 uppercase tracking-widest">
              Internal Communications
            </h2>
            <p className="text-[9px] font-semibold text-slate-400 uppercase tracking-wider">
              {total > 0 ? `Latest of ${total} announcement${total > 1 ? "s" : ""}` : "Stay updated with Centrika news"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {canPostAnnouncement && <AnnouncementFormDialog />}
        </div>
      </div>

      {/* Main Latest Card */}
      <div className="relative rounded-2xl overflow-hidden bg-white dark:bg-slate-900/80 border border-border/30 dark:border-white/5 shadow-sm group">
        {/* Top Accent line */}
        <div className="h-1 w-full bg-gradient-to-r from-[#c79d2d] via-[#e8c547] to-[#c79d2d]" />

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <Loader2 className="animate-spin text-[#3b6dae]/30" size={24} />
            <p className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">Loading communications...</p>
          </div>
        ) : !announcements || announcements.length === 0 ? (
          <div className="text-center py-16 px-6">
            <div className="w-12 h-12 mx-auto mb-4 rounded-2xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center">
              <Megaphone size={20} className="text-slate-300" />
            </div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
              No announcements yet
            </p>
            <p className="text-[10px] text-slate-300 mt-1">Communications will appear here</p>
          </div>
        ) : currentAnnouncement ? (
          <div className="p-5 flex flex-col relative z-10 transition-all duration-300">
            {/* Top row: Author + Date */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${roleGradient} flex items-center justify-center text-white text-xs font-black shadow-md`}>
                  {currentAnnouncement.author.name.charAt(0)}
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-800 dark:text-slate-100 leading-tight flex items-center">
                    {currentAnnouncement.author.name}
                    {currentAnnouncement.author.position && (
                      <span className="text-[10px] font-medium text-slate-500 dark:text-slate-400 ml-1.5 opacity-80 border-l border-slate-300 dark:border-slate-700 pl-1.5">
                        {currentAnnouncement.author.position}
                      </span>
                    )}
                  </p>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className={`inline-flex items-center px-1.5 py-0.5 rounded-md text-[8px] font-black text-white bg-gradient-to-r ${roleGradient} uppercase tracking-wider`}>
                      {ROLE_LABELS[currentAnnouncement.author.role] || currentAnnouncement.author.role}
                    </span>
                    {currentAnnouncement.department ? (
                      <span className="inline-flex items-center gap-0.5 text-[9px] font-semibold text-teal-600 dark:text-teal-400">
                        <Building2 size={8} />
                        {currentAnnouncement.department.name}
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-0.5 text-[9px] font-semibold text-[#3b6dae]/70 dark:text-blue-300">
                        <Globe size={8} />
                        Company Wide
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-1 text-[9px] font-semibold text-slate-400 bg-slate-50 dark:bg-slate-800 px-2 py-1 rounded-lg">
                <Clock size={9} />
                {timeAgo(currentAnnouncement.createdAt)}
              </div>
            </div>

            {/* Title */}
            <div className="mb-3">
              <h3 className="text-base font-black text-[#3b6dae] dark:text-blue-200 leading-snug">
                {currentAnnouncement.title}
              </h3>
            </div>

            {/* Content Preview */}
            <div className="relative mb-4">
              <Quote size={14} className="absolute -top-1 -left-0.5 text-[#c79d2d]/20" />
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed pl-4 line-clamp-3">
                {currentAnnouncement.content}
              </p>
            </div>

            {/* Action Bar */}
            <div className="flex items-center justify-between mt-auto pt-3 border-t border-slate-100 dark:border-slate-800">
              <button 
                onClick={() => setSelectedDetailId(currentAnnouncement.id)}
                className="flex items-center gap-1.5 text-[10px] font-bold text-[#c79d2d] hover:text-[#3b6dae] transition-colors bg-[#c79d2d]/5 hover:bg-[#3b6dae]/5 px-3 py-1.5 rounded-lg"
              >
                <MessageCircle size={12} />
                {currentAnnouncement._count?.comments || 0} {currentAnnouncement._count?.comments === 1 ? 'Comment' : 'Comments'}
              </button>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => setSelectedDetailId(currentAnnouncement.id)}
                  className="text-[10px] font-bold text-slate-500 hover:text-[#3b6dae] transition-colors underline decoration-slate-200 underline-offset-4 hover:decoration-[#3b6dae]/50"
                >
                  Read full message
                </button>
                {total > 1 && (
                  <button
                    onClick={() => setIsAllModalOpen(true)}
                    className="flex items-center gap-1 text-[10px] font-black text-white bg-[#3b6dae] hover:bg-[#2d5385] px-3 py-1.5 rounded-lg transition-colors shadow-sm"
                  >
                    View All {total}
                    <ArrowRight size={10} strokeWidth={3} />
                  </button>
                )}
              </div>
            </div>
          </div>
        ) : null}
      </div>

      {/* Render Dialog components */}
      <AllAnnouncementsDialog 
        isOpen={isAllModalOpen} 
        onClose={() => setIsAllModalOpen(false)} 
        onSelectAnnouncement={(id) => setSelectedDetailId(id)}
      />

      {/* Renders whenever an ID is selected */}
      <AnnouncementDetailDialog 
        isOpen={selectedDetailId !== null} 
        onClose={() => setSelectedDetailId(null)} 
        announcementId={selectedDetailId}
      />
    </div>
  );
}
