import { useState, useRef } from "react";
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
import { Loader2, MessageCircle, Send, Building2, Globe, Clock, X, Heart, Smile } from "lucide-react";
import { useAuth } from "@/_core/hooks/useAuth";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import EmojiPicker, { Theme } from "emoji-picker-react";

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
  head_of_department: "Head of Department",
  head_of_finance: "Head of Finance",
  ceo_md: "CEO/MD",
  user: "Employee",
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
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
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
      utils.announcements.list.invalidate();
    },
  });

  const toggleLikeMutation = trpc.announcements.toggleLike.useMutation({
    onSuccess: () => {
      utils.announcements.getById.invalidate({ id: announcementId as number });
      utils.announcements.list.invalidate();
    },
  });

  const toggleCommentLikeMutation = trpc.announcements.toggleCommentLike.useMutation({
    onSuccess: () => {
      utils.announcements.getComments.invalidate({ announcementId: announcementId as number });
    },
  });

  const handleAddComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim() || !announcementId) return;
    addCommentMutation.mutate({
      announcementId,
      content: commentText.trim(),
    });
    setShowEmojiPicker(false);
  };

  const handleEmojiClick = (emojiData: any) => {
    setCommentText((prev) => prev + emojiData.emoji);
    inputRef.current?.focus();
  };

  const isLoading = isAnnouncementLoading || !announcement;
  const roleGradient = announcement 
    ? ROLE_COLORS[announcement.author.role] || ROLE_COLORS.user 
    : ROLE_COLORS.user;

  const isAnnouncementLiked = announcement?.likes && announcement.likes.length > 0;
  const announcementLikeCount = announcement?._count?.likes || 0;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent showCloseButton={false} className="w-[95vw] sm:max-w-2xl h-[90vh] md:h-[85vh] md:max-h-[800px] bg-white dark:bg-slate-950 border-none rounded-3xl p-0 overflow-hidden shadow-2xl flex flex-col">
        {/* Decorative ambient light */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-[#3b6dae]/10 to-[#c79d2d]/10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />
        
        {/* Header - Fixed */}
        <DialogHeader className="bg-white/95 dark:bg-slate-950/95 backdrop-blur-xl border-b border-slate-100 dark:border-slate-800/50 p-5 pb-4 relative z-20 shrink-0 flex flex-row items-center justify-between space-y-0">
          <DialogTitle className="flex items-center gap-2.5 text-lg font-black text-slate-800 dark:text-slate-100 tracking-tight">
            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-tr from-[#3b6dae] to-blue-400 text-white shadow-sm">
              <MessageCircle size={16} />
            </div>
            Communication Details
          </DialogTitle>
          <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8 rounded-full bg-slate-50 hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-all dark:bg-slate-900 dark:hover:bg-slate-800">
            <X size={16} />
          </Button>
        </DialogHeader>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center flex-1 p-20 gap-4">
            <Loader2 className="w-8 h-8 animate-spin text-[#3b6dae]/40" />
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Loading details...</p>
          </div>
        ) : (
          <div className="flex flex-col flex-1 min-h-0 w-full bg-slate-50/30 dark:bg-slate-900/10">
            
            {/* Top: Fixed Announcement Hero */}
            <div className="shrink-0 flex flex-col border-b border-[#3b6dae]/20 dark:border-[#3b6dae]/30 bg-gradient-to-br from-[#3b6dae]/10 via-[#3b6dae]/5 to-transparent dark:from-[#3b6dae]/20 dark:to-slate-950 relative z-10 max-h-[40vh]">
              <ScrollArea className="w-full overflow-y-auto">
                <div className="px-6 py-6 sm:px-8">
                  {/* Author Row */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3.5">
                      <Avatar className="w-11 h-11 border-2 border-white dark:border-slate-800 shadow-sm">
                        {announcement.author.profileImage && <AvatarImage src={announcement.author.profileImage} />}
                        <AvatarFallback className={`bg-gradient-to-br ${roleGradient} text-white text-sm font-black`}>
                          {(announcement.author.name ?? "A").charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-sm font-bold text-slate-900 dark:text-slate-50 flex items-center gap-2">
                          {announcement.author.name}
                          {announcement.author.position && (
                            <span className="hidden sm:inline text-xs font-semibold text-slate-500 dark:text-slate-400">
                              • {announcement.author.position}
                            </span>
                          )}
                        </p>
                        <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[9px] font-black ${announcement.author.role === 'admin' ? 'bg-[#3b6dae]/10 text-[#3b6dae]' : 'bg-slate-100 text-slate-600'} uppercase tracking-wider`}>
                            {ROLE_LABELS[announcement.author.role] || announcement.author.role}
                          </span>
                          {announcement.department ? (
                            <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-slate-500">
                              <Building2 size={10} />
                              {announcement.department.name}
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-slate-500">
                              <Globe size={10} />
                              Company Wide
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1">
                        <Clock size={10} />
                        {format(new Date(announcement.createdAt), "MMM d")}
                      </span>
                      <span className="text-[10px] font-medium text-slate-400">
                        {format(new Date(announcement.createdAt), "h:mm a")}
                      </span>
                    </div>
                  </div>

                  {/* Title & Body */}
                  <div className="mt-1">
                    <h3 className="text-xl sm:text-2xl font-black text-slate-800 dark:text-slate-100 mb-3 leading-tight tracking-tight">
                      {announcement.title}
                    </h3>
                    <div className="text-sm sm:text-base text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-wrap font-medium">
                      {announcement.content}
                    </div>
                  </div>

                  {/* Like Button for Announcement */}
                  <div className="flex items-center gap-3 mt-5 pt-4 border-t border-[#3b6dae]/10 dark:border-slate-800">
                    <button
                      onClick={() => announcementId && toggleLikeMutation.mutate({ announcementId })}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all duration-200 ${
                        isAnnouncementLiked
                          ? "bg-red-50 dark:bg-red-900/20 text-red-500 border border-red-200/60 dark:border-red-800/40"
                          : "bg-slate-50 dark:bg-slate-800 text-slate-400 border border-slate-200 dark:border-slate-700 hover:text-red-400 hover:border-red-200 hover:bg-red-50"
                      }`}
                    >
                      <Heart size={14} className={isAnnouncementLiked ? "fill-red-500" : ""} />
                      {announcementLikeCount > 0 && <span>{announcementLikeCount}</span>}
                      {!isAnnouncementLiked && announcementLikeCount === 0 && <span>Like</span>}
                    </button>
                  </div>
                </div>
              </ScrollArea>
            </div>

            {/* Bottom: Scrollable Comments Area */}
            <div className="flex-1 flex flex-col min-h-0 bg-slate-50/80 dark:bg-slate-900/40 relative">
              
              <div className="px-6 sm:px-8 py-3.5 border-b border-[#3b6dae]/10 dark:border-slate-800/50 flex items-center justify-between bg-white/60 dark:bg-slate-900/60 sticky top-0 z-10 backdrop-blur-xl">
                <h4 className="text-[11px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest flex items-center gap-2">
                  Comments & Replies
                </h4>
                <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm">
                  <span className="text-[10px] font-bold text-slate-600 dark:text-slate-300">
                    {isCommentsLoading ? "..." : comments?.length || 0} Responses
                  </span>
                </div>
              </div>

              <ScrollArea className="flex-1 overflow-y-auto px-4 sm:px-6 py-4">
                {isCommentsLoading ? (
                  <div className="flex justify-center p-8">
                     <Loader2 className="w-5 h-5 animate-spin text-[#3b6dae]/40" />
                  </div>
                ) : !comments || comments.length === 0 ? (
                  <div className="flex flex-col items-center justify-center text-center p-10 h-full">
                    <div className="w-12 h-12 bg-slate-100 dark:bg-slate-800 rounded-2xl flex items-center justify-center mb-3">
                      <MessageCircle className="w-6 h-6 text-slate-300 dark:text-slate-600" />
                    </div>
                    <p className="text-sm font-bold text-slate-600 dark:text-slate-300">No responses yet</p>
                    <p className="text-xs text-slate-400 mt-1 max-w-[200px]">Be the first to share your thoughts on this announcement.</p>
                  </div>
                ) : (
                  <div className="space-y-5 pb-6 max-w-3xl mx-auto w-full">
                    {comments.map((comment: any) => {
                      const isCommentLiked = comment.likes && comment.likes.length > 0;
                      const commentLikeCount = comment._count?.likes || 0;
                      return (
                        <div key={comment.id} className="flex gap-3.5 group">
                          <Avatar className="w-9 h-9 border border-slate-200 dark:border-slate-700 shrink-0 shadow-sm mt-0.5">
                            {comment.user.profileImage && <AvatarImage src={comment.user.profileImage} />}
                            <AvatarFallback className="bg-gradient-to-br from-[#3b6dae]/20 to-[#3b6dae]/10 text-[#3b6dae] text-xs font-black">
                              {comment.user.name.charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <div className="flex items-baseline gap-2 mb-1">
                              <span className="font-bold text-slate-800 dark:text-slate-200 text-[13px]">
                                {comment.user.name}
                              </span>
                              <span className="text-[10px] font-medium text-slate-400">
                                {timeAgo(comment.createdAt)}
                              </span>
                            </div>
                            <div className="inline-block bg-[#3b6dae]/5 dark:bg-[#3b6dae]/10 rounded-2xl rounded-tl-sm px-4 py-2.5 shadow-sm border border-[#3b6dae]/10 dark:border-[#3b6dae]/20 text-[13px] text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">
                              {comment.content}
                            </div>
                            {/* Comment Like Button */}
                            <div className="flex items-center gap-2 mt-1.5 ml-1">
                              <button
                                onClick={() => toggleCommentLikeMutation.mutate({ commentId: comment.id })}
                                className={`flex items-center gap-1 text-[11px] font-semibold transition-all duration-200 ${
                                  isCommentLiked
                                    ? "text-red-500"
                                    : "text-slate-400 hover:text-red-400"
                                }`}
                              >
                                <Heart size={12} className={isCommentLiked ? "fill-red-500" : ""} />
                                {commentLikeCount > 0 && <span>{commentLikeCount}</span>}
                                {!isCommentLiked && commentLikeCount === 0 && <span>Like</span>}
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </ScrollArea>

              {/* Emoji Picker Popover */}
              {showEmojiPicker && (
                <div className="absolute bottom-20 left-4 right-4 sm:left-6 sm:right-auto z-30">
                  <EmojiPicker
                    onEmojiClick={handleEmojiClick}
                    theme={Theme.LIGHT}
                    width="100%"
                    height={350}
                    searchPlaceholder="Search emojis..."
                    previewConfig={{ showPreview: false }}
                  />
                </div>
              )}

              {/* Fixed Bottom Input */}
              <div className="p-4 sm:px-6 sm:py-5 bg-white dark:bg-slate-950 border-t border-slate-100 dark:border-slate-800 shrink-0 z-20 relative shadow-[0_-10px_30px_-15px_rgba(0,0,0,0.1)]">
                <form onSubmit={handleAddComment} className="flex gap-2 max-w-3xl mx-auto w-full relative items-center">
                  <button
                    type="button"
                    onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                    className={`shrink-0 w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                      showEmojiPicker
                        ? "bg-[#3b6dae]/10 text-[#3b6dae]"
                        : "bg-slate-50 dark:bg-slate-900 text-slate-400 hover:text-[#3b6dae] hover:bg-[#3b6dae]/10"
                    }`}
                  >
                    <Smile size={20} />
                  </button>
                  <div className="flex-1 relative">
                    <Input
                      ref={inputRef}
                      value={commentText}
                      onChange={(e) => setCommentText(e.target.value)}
                      placeholder="Write your response..."
                      className="w-full bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800 focus-visible:ring-[#3b6dae] focus-visible:border-[#3b6dae] rounded-full text-sm h-12 pl-5 pr-14 shadow-inner"
                      disabled={addCommentMutation.isPending}
                      onFocus={() => setShowEmojiPicker(false)}
                    />
                    <Button 
                      type="submit" 
                      disabled={!commentText.trim() || addCommentMutation.isPending}
                      className="absolute right-1 top-1 bottom-1 bg-[#3b6dae] hover:bg-[#2d5385] text-white rounded-full shadow-md w-10 h-10 p-0 flex items-center justify-center shrink-0 transition-all hover:scale-105 active:scale-95"
                    >
                      {addCommentMutation.isPending ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Send className="w-4 h-4 ml-0.5" />
                      )}
                    </Button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
