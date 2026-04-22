import { useState } from "react";
import { format } from "date-fns";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { trpc } from "@/lib/trpc";
import { Loader2, MessageCircle, Send, Building2, Globe, Clock, Quote } from "lucide-react";
import { useAuth } from "@/_core/hooks/useAuth";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface AnnouncementDetailDialogProps {
  announcementId: number | null;
  isOpen: boolean;
  onClose: () => void;
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

export function AnnouncementDetailDialog({ announcementId, isOpen, onClose }: AnnouncementDetailDialogProps) {
  const { user } = useAuth();
  const [commentText, setCommentText] = useState("");
  const utils = trpc.useContext();

  const { data: announcement, isLoading: isAnnouncementLoading } = trpc.announcements.getById.useQuery(
    { id: announcementId as number },
    { enabled: !!announcementId && isOpen }
  );

  const { data: comments, isLoading: isCommentsLoading } = trpc.announcements.getComments.useQuery(
    { announcementId: announcementId as number },
    { enabled: !!announcementId && isOpen }
  );

  const addCommentMutation = trpc.announcements.addComment.useMutation({
    onSuccess: () => {
      setCommentText("");
      utils.announcements.getComments.invalidate({ announcementId: announcementId as number });
      utils.announcements.list.invalidate(); // To update the comment count on the main dashboard
    },
  });

  const handleAddComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim() || !announcementId) return;
    addCommentMutation.mutate({
      announcementId,
      content: commentText.trim(),
    });
  };

  const isLoading = isAnnouncementLoading || !announcement;
  const roleGradient = announcement 
    ? ROLE_COLORS[announcement.author.role] || ROLE_COLORS.user 
    : ROLE_COLORS.user;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-2xl bg-slate-50 dark:bg-slate-950 border-none rounded-3xl p-0 overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-48 h-48 bg-[#3b6dae]/10 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-[#c79d2d]/10 rounded-full blur-2xl -ml-16 -mb-16 pointer-events-none" />
        
        {/* Header - Fixed */}
        <DialogHeader className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border-b border-border/50 p-6 pb-5 relative z-10 shrink-0">
          <DialogTitle className="flex items-center gap-2 text-xl font-black text-[#3b6dae] dark:text-blue-400">
            <MessageCircle className="w-5 h-5 text-[#c79d2d]" />
            Communication Details
          </DialogTitle>
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#c79d2d] via-[#e8c547] to-[#c79d2d]" />
        </DialogHeader>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center p-20 gap-4">
            <Loader2 className="w-8 h-8 animate-spin text-[#3b6dae]/40" />
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Loading details...</p>
          </div>
        ) : (
          <>
            {/* Scrollable Content */}
            <ScrollArea className="flex-1 overflow-hidden">
              <div className="py-6 space-y-6 px-6">
                
                {/* Announcement Content */}
                <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 shadow-sm border border-slate-100 dark:border-slate-800">
                  {/* Author Row */}
                  <div className="flex items-start justify-between mb-5">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${roleGradient} flex items-center justify-center text-white text-sm font-black shadow-md`}>
                        {announcement.author.name.charAt(0)}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-800 dark:text-slate-100 flex items-center">
                          {announcement.author.name}
                          {announcement.author.position && (
                            <span className="text-xs font-medium text-slate-500 dark:text-slate-400 ml-2 opacity-80 border-l border-slate-300 dark:border-slate-700 pl-2">
                              {announcement.author.position}
                            </span>
                          )}
                        </p>
                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[9px] font-black text-white bg-gradient-to-r ${roleGradient} uppercase tracking-wider`}>
                            {ROLE_LABELS[announcement.author.role] || announcement.author.role}
                          </span>
                          {announcement.department ? (
                            <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-teal-600 dark:text-teal-400">
                              <Building2 size={10} />
                              {announcement.department.name}
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-[#3b6dae]/70 dark:text-blue-300">
                              <Globe size={10} />
                              Company Wide
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 text-[10px] font-semibold text-slate-400 bg-slate-50 dark:bg-slate-800 px-2.5 py-1.5 rounded-lg whitespace-nowrap">
                      <Clock size={10} />
                      {format(new Date(announcement.createdAt), "MMM d, h:mm a")}
                    </div>
                  </div>

                  {/* Title & Body */}
                  <div className="mt-2">
                    <h3 className="text-lg font-black text-[#3b6dae] dark:text-blue-200 mb-4 leading-snug">
                      {announcement.title}
                    </h3>
                    <div className="relative pl-5 py-1">
                      <Quote size={20} className="absolute top-0 left-0 text-[#c79d2d]/20" />
                      <div className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">
                        {announcement.content}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Comments Section */}
                <div className="pt-2">
                  <div className="flex items-center gap-2 mb-4">
                    <h4 className="text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest pl-1">
                      Comments & Replies
                    </h4>
                    <span className="bg-slate-200 dark:bg-slate-800 text-slate-500 text-[10px] font-bold px-2 py-0.5 rounded-full">
                      {isCommentsLoading ? "..." : comments?.length || 0}
                    </span>
                  </div>

                  {isCommentsLoading ? (
                    <div className="flex justify-center p-8">
                       <Loader2 className="w-5 h-5 animate-spin text-slate-300" />
                    </div>
                  ) : !comments || comments.length === 0 ? (
                    <div className="text-center p-8 bg-white/50 dark:bg-slate-900/50 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800">
                      <MessageCircle className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto mb-2 opacity-50" />
                      <p className="text-xs font-semibold text-slate-400">No comments yet</p>
                      <p className="text-[10px] text-slate-400 mt-1">Be the first to share your thoughts.</p>
                    </div>
                  ) : (
                    <div className="space-y-4 pb-4">
                      {comments.map((comment: any) => (
                        <div key={comment.id} className="flex gap-3">
                          <Avatar className="w-8 h-8 border border-slate-200 dark:border-slate-800 shrink-0">
                            {comment.user.profileImage && <AvatarImage src={comment.user.profileImage} />}
                            <AvatarFallback className="bg-slate-100 dark:bg-slate-800 text-[#3b6dae] text-xs font-bold">
                              {comment.user.name.charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 bg-white dark:bg-slate-900 rounded-2xl rounded-tl-sm p-3 shadow-sm border border-slate-100 dark:border-slate-800 text-sm">
                            <div className="flex items-center justify-between mb-1">
                              <span className="font-bold text-slate-800 dark:text-slate-200 text-xs flex items-center">
                                {comment.user.name}
                                {comment.user.position && (
                                  <span className="font-medium text-slate-500 dark:text-slate-400 ml-1.5 opacity-80 border-l border-slate-300 dark:border-slate-700 pl-1.5 text-[10px]">
                                    {comment.user.position}
                                  </span>
                                )}
                              </span>
                              <span className="text-[10px] font-medium text-slate-400">
                                {timeAgo(comment.createdAt)}
                              </span>
                            </div>
                            <p className="text-slate-600 dark:text-slate-400 text-xs leading-relaxed whitespace-pre-wrap">
                              {comment.content}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </ScrollArea>

            {/* Comment Input - Fixed at bottom */}
            <div className="p-4 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 shrink-0 z-10 relative">
              <form onSubmit={handleAddComment} className="flex gap-2">
                <Input
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  placeholder="Write a comment..."
                  className="flex-1 bg-slate-50 dark:bg-slate-950/50 border-slate-200 dark:border-slate-800 focus-visible:ring-[#3b6dae] rounded-xl text-sm"
                  disabled={addCommentMutation.isPending}
                />
                <Button 
                  type="submit" 
                  disabled={!commentText.trim() || addCommentMutation.isPending}
                  className="bg-[#3b6dae] hover:bg-[#2d5385] text-white rounded-xl shadow-md w-10 p-0 flex items-center justify-center shrink-0"
                >
                  {addCommentMutation.isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4 ml-0.5" />
                  )}
                </Button>
              </form>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
