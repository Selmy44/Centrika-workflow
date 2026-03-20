import { Megaphone, ExternalLink, Loader2, Calendar } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent } from "@/components/ui/card";
import { formatDateTime } from "@/lib/dateFormatter";
import { useAuth } from "@/_core/hooks/useAuth";
import { AnnouncementFormDialog } from "./AnnouncementFormDialog";

export function NoticeBoard() {
  const { user } = useAuth();
  const { data: announcements, isLoading } = trpc.announcements.list.useQuery();

  const canPostAnnouncement = user && ["admin", "hr", "head_of_department", "ceo_md"].includes(user.role);

  return (
    <div className="space-y-4 m-4">
      <div className="flex items-center justify-between px-2">
        <div>
          <h2 className="text-sm font-bold text-[#3b6dae] dark:text-blue-100 uppercase tracking-widest opacity-80">
            Internal Communications
          </h2>
          <p className="text-[10px] font-medium text-slate-400 uppercase tracking-tight">Stay updated with Centrika news</p>
        </div>
        <div className="flex items-center gap-2">
          {canPostAnnouncement && <AnnouncementFormDialog />}
          <div className="p-2 bg-[#3b6dae]/5 rounded-xl">
            <Megaphone size={16} className="text-[#3b6dae] dark:text-blue-400" />
          </div>
        </div>
      </div>

      <Card className="bg-white/50 dark:bg-slate-900/60 border-border/40 dark:border-white/10 backdrop-blur-sm rounded-3xl overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-500">
        <CardContent className="p-0">
          <div className="max-h-100 overflow-y-auto custom-scrollbar">
            {isLoading ? (
              <div className="flex justify-center py-16">
                <Loader2 className="animate-spin text-[#3b6dae]/20" />
              </div>
            ) : !announcements || announcements.length === 0 ? (
              <div className="text-center py-16 px-6">
                <p className="text-xs font-medium text-slate-400 uppercase tracking-widest italic">
                  Clear skies. No new announcements.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-border/30">
                {announcements.map((announcement: any) => (
                  <div key={announcement.id} className="p-5 hover:bg-[#3b6dae]/5 transition-colors group cursor-default">
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex items-center gap-2">
                        <div className="w-1 h-3 rounded-full bg-[#c79d2d]" />
                        <h4 className="text-sm font-bold text-[#3b6dae] dark:text-blue-50 group-hover:text-[#3b6dae] transition-colors leading-tight">
                          {announcement.title}
                        </h4>
                      </div>
                      <div className="flex items-center gap-1.5 px-2 py-0.5 bg-slate-100 dark:bg-slate-800 rounded-full text-[9px] font-bold text-slate-400">
                        <Calendar size={10} />
                        {formatDateTime(announcement.createdAt)}
                      </div>
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2 mb-3 leading-relaxed">
                      {announcement.content}
                    </p>
                    <div className="flex items-center justify-between mt-3 pt-3 border-t border-border/10">
                      <div className="flex items-center gap-2">
                        <div className="w-5 h-5 rounded-full bg-[#3b6dae] flex items-center justify-center text-[8px] font-black text-white">
                          {announcement.author.name.charAt(0)}
                        </div>
                        {announcement.department ? (
                          <span className="text-[10px] font-bold text-teal-600 dark:text-teal-400 uppercase tracking-tight">
                            {announcement.department.name} Notice
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold text-[#3b6dae]/80 dark:text-blue-200 uppercase tracking-tight">
                            Company Wide
                          </span>
                        )}
                      </div>
                      <button className="text-[10px] font-bold text-[#c79d2d] flex items-center gap-1 hover:text-[#3b6dae] transition-all" aria-label="Expand announcement">
                        EXPAND <ExternalLink size={10} strokeWidth={3} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
