import { useState, useEffect, useRef, useCallback } from "react";
import { Send, Loader2, Trash2, MoreVertical, Paperclip, FileText, Play, CheckCircle2, Users } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/_core/hooks/useAuth";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

function formatTime(date: string | Date | undefined) {
  if (!date) return "";
  const d = new Date(date);
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - d.getTime()) / 86400000);

  const time = d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true });

  if (diffDays === 0) return time;
  if (diffDays === 1) return `Yesterday ${time}`;
  if (diffDays < 7) return `${d.toLocaleDateString("en-US", { weekday: "short" })} ${time}`;
  return `${d.toLocaleDateString("en-US", { month: "short", day: "numeric" })} ${time}`;
}

export function ThreadView({ suggestionId }: { suggestionId: number }) {
  const { user } = useAuth();
  const [replyText, setReplyText] = useState("");
  const [attachments, setAttachments] = useState<{ fileName: string, fileUrl: string, fileKey: string, mimeType?: string, fileSize?: number }[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const utils = trpc.useContext();

  const commonEmojis = ["😊", "👍", "🔥", "❤️", "📍", "📅", "✅", "💡", "🚀", "📢", "🤝", "🙏"];

  const { data: suggestion, isLoading, isError, error } = trpc.suggestions.getById.useQuery(
    { id: suggestionId },
    { enabled: !!suggestionId, refetchInterval: 5000 }
  );

  const markAsReadMutation = trpc.suggestions.markThreadAsRead.useMutation({
    onSuccess: () => {
      utils.suggestions.getUnreadCount.invalidate();
      utils.suggestions.listInbox.invalidate();
      utils.suggestions.listMyFeedback.invalidate();
    },
  });

  const hasMarkedRead = useRef<number | null>(null);
  const markAsRead = useCallback(() => {
    if (suggestionId && hasMarkedRead.current !== suggestionId) {
      hasMarkedRead.current = suggestionId;
      markAsReadMutation.mutate({ suggestionId });
    }
  }, [suggestionId]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    markAsRead();
  }, [suggestionId]); // eslint-disable-line react-hooks/exhaustive-deps

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [suggestion?.replies]);

  const replyMutation = trpc.suggestions.reply.useMutation({
    onSuccess: () => {
      setReplyText("");
      utils.suggestions.getById.invalidate({ id: suggestionId });
      utils.suggestions.listInbox.invalidate();
      utils.suggestions.listMyFeedback.invalidate();
    },
    onError: (err) => {
      toast.error("Failed to send", { description: err.message });
    },
  });

  const deleteMutation = trpc.suggestions.delete.useMutation({
    onSuccess: () => {
      toast.success("Chat deleted successfully");
      utils.suggestions.listInbox.invalidate();
      utils.suggestions.listMyFeedback.invalidate();
      window.dispatchEvent(new CustomEvent('open-centrika-connect', { detail: { mode: 'chats' } }));
    },
    onError: (err) => {
      toast.error("Failed to delete", { description: err.message });
    }
  });

  const handleDelete = () => {
    deleteMutation.mutate({ id: suggestionId });
  };

  const handleReply = (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim() && attachments.length === 0) return;
    replyMutation.mutate({
      suggestionId,
      content: replyText,
      attachments: attachments.length > 0 ? attachments : undefined
    });
    setAttachments([]);
  };

  const uploadMutation = trpc.requests.uploadAttachment.useMutation();

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    for (const file of Array.from(files)) {
      try {
        const reader = new FileReader();
        const base64Promise = new Promise<string>((resolve) => {
          reader.onload = () => resolve(reader.result as string);
          reader.readAsDataURL(file);
        });

        const base64 = await base64Promise;
        const result = await uploadMutation.mutateAsync({
          fileName: file.name,
          fileData: base64.split(',')[1],
          mimeType: file.type
        });

        setAttachments(prev => [...prev, {
          fileName: file.name,
          fileUrl: result.url,
          fileKey: result.key,
          mimeType: file.type,
          fileSize: file.size
        }]);
      } catch (err) {
        toast.error(`Failed to upload ${file.name}`);
      }
    }
    setIsUploading(false);
  };

  // Only show spinner on the very first load when there is no cached data yet.
  // Do NOT block on subsequent background refetches (e.g. after invalidations from markAsRead).
  if (isLoading && !suggestion && !isError)
    return (
      <div className="flex h-full items-center justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-[#3b6dae]/30" />
      </div>
    );

  if (isError || (!isLoading && !suggestion))
    return (
      <div className="flex flex-col h-full items-center justify-center py-20 px-6 text-center gap-4">
        <div className="w-16 h-16 rounded-full bg-red-50/50 flex items-center justify-center">
          <Trash2 className="w-8 h-8 text-red-400" />
        </div>
        <div className="space-y-1">
          <p className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-wider">Communication Lost</p>
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 max-w-[200px]">
            {error?.message || "This conversation could not be loaded or no longer exists."}
          </p>
        </div>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => window.dispatchEvent(new CustomEvent('open-centrika-connect', { detail: { mode: 'chats' } }))}
          className="rounded-xl font-bold text-[10px] uppercase tracking-widest border-slate-200"
        >
          Back to Messages
        </Button>
      </div>
    );

  // Build a flat list of all messages (original + replies)
  const allMessages = [
    {
      id: suggestion.id,
      content: suggestion.content,
      createdAt: suggestion.createdAt,
      userId: suggestion.userId,
      user: suggestion.user,
      attachments: (suggestion as any).attachments || []
    },
    ...(suggestion.replies || []).map((r: any) => ({
      id: r.id,
      content: r.content,
      createdAt: r.createdAt,
      userId: r.userId,
      user: r.user,
      attachments: r.attachments || []
    })),
  ];

  const readStatuses = (suggestion as any).readStatuses || [];
  const seenBy = readStatuses
    .filter((rs: any) => rs.userId !== user?.id)
    .map((rs: any) => rs.user?.name || "Staff Member");

  // The other person in the chat
  const isOwner = suggestion.userId === user?.id;
  const otherUser = isOwner
    ? (suggestion as any).targetUsers?.[0] || allMessages.find((m) => m.userId !== user?.id)?.user
    : suggestion.user;

  return (
    <div className="flex flex-col flex-1 min-h-0 overflow-hidden">
      {/* Chat Header - other person's info */}
      <div className="px-4 py-2.5 border-b border-slate-100 dark:border-slate-800 flex items-center gap-3 shrink-0 bg-white/80 dark:bg-slate-900/80">
        <Avatar className="w-8 h-8 rounded-full border border-slate-200 dark:border-slate-700">
          {otherUser?.profileImage && <AvatarImage src={otherUser.profileImage} />}
          <AvatarFallback className="text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-500">
            {otherUser?.name?.charAt(0)?.toUpperCase() || "U"}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <p className="text-[13px] font-bold text-slate-800 dark:text-white truncate leading-tight">
            {suggestion.title || otherUser?.name || "Group Chat"}
          </p>
          <p className="text-[10px] text-slate-400 font-medium truncate">
            {suggestion.title ? `${suggestion.targetUserIds.length + 1} Participants` : otherUser?.position || "Member"}
          </p>
        </div>

        {/* Dropdown Menu for Actions */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-transparent focus:bg-transparent rounded-lg shrink-0">
              <MoreVertical size={16} />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-40 rounded-xl border-slate-200/60 dark:border-slate-800 shadow-xl overflow-hidden p-1.5 flex flex-col gap-1">
            {(user?.id === suggestion.userId || suggestion.targetUserIds?.includes(user?.id) || ["admin", "hr", "ceo_md"].includes(user?.role || "")) && (
              <DropdownMenuItem
                onSelect={() => setIsDeleteDialogOpen(true)}
                className="text-[#eb2027] dark:text-[#eb2027] text-[12px] font-bold cursor-pointer rounded-lg p-2 hover:bg-transparent focus:bg-transparent focus:text-[#eb2027]"
              >
                <Trash2 size={13} className="mr-2" />
                Delete Chat
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Messages Area */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto custom-scrollbar px-3 py-4 space-y-1.5 bg-slate-50/50 dark:bg-slate-950/30">
        {allMessages.map((msg, idx) => {
          const isMe = msg.userId === user?.id;
          const showAvatar =
            !isMe && (idx === 0 || allMessages[idx - 1]?.userId === user?.id);

          return (
            <div
              key={msg.id}
              className={`flex items-end gap-2 ${isMe ? "justify-end" : "justify-start"}`}
            >
              {/* Other person's avatar */}
              {!isMe && (
                <div className="w-7 shrink-0">
                  {showAvatar ? (
                    <Avatar className="w-7 h-7 rounded-full">
                      {msg.user?.profileImage && <AvatarImage src={msg.user.profileImage} />}
                      <AvatarFallback className="text-[9px] font-bold bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-300">
                        {msg.user?.name?.charAt(0)?.toUpperCase() || "U"}
                      </AvatarFallback>
                    </Avatar>
                  ) : null}
                </div>
              )}

              {/* Bubble */}
              <div
                className={`max-w-[75%] space-y-1.5 ${isMe ? "items-end" : "items-start"}`}
              >
                {/* Visual Media Attachments */}
                {msg.attachments?.length > 0 && (
                  <div className={`flex flex-wrap gap-1.5 ${isMe ? "justify-end" : "justify-start"}`}>
                    {msg.attachments.map((file: any) => {
                      const isImage = file.mimeType?.startsWith('image/');
                      const isVideo = file.mimeType?.startsWith('video/');
                      if (isImage) {
                        return (
                          <div key={file.id} className="relative group/media rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700 shadow-sm">
                            <img src={file.fileUrl} alt={file.fileName} className="max-w-[200px] max-h-[200px] object-cover" />
                            <a href={file.fileUrl} target="_blank" rel="noreferrer" className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover/media:opacity-100 transition-opacity">
                              <Paperclip size={16} className="text-white" />
                            </a>
                          </div>
                        );
                      }
                      if (isVideo) {
                        return (
                          <div key={file.id} className="relative group/media rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700 shadow-sm bg-black">
                            <video src={file.fileUrl} className="max-w-[200px] max-h-[200px]" />
                            <a href={file.fileUrl} target="_blank" rel="noreferrer" className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover/media:bg-black/40 transition-all">
                              <Play size={24} className="text-white fill-white" />
                            </a>
                          </div>
                        );
                      }
                      return (
                        <a key={file.id} href={file.fileUrl} target="_blank" rel="noreferrer" className="flex items-center gap-2 bg-white dark:bg-slate-800 px-3 py-2 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm hover:scale-[1.02] transition-transform">
                          <FileText size={14} className="text-[#3b6dae]" />
                          <span className="text-[10px] font-bold text-slate-700 dark:text-slate-300 truncate max-w-[120px]">{file.fileName}</span>
                        </a>
                      );
                    })}
                  </div>
                )}

                {/* Bubble */}
                <div
                  className={`px-3.5 py-2.5 text-[13px] leading-relaxed shadow-sm ${isMe
                      ? "bg-[#3b6dae] text-white rounded-2xl rounded-br-md"
                      : "bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 rounded-2xl rounded-bl-md border border-slate-200/60 dark:border-slate-700/50"
                    }`}
                >
                  <p className="whitespace-pre-wrap break-words">{msg.content}</p>
                  <div className="flex items-center justify-end gap-1.5 mt-1">
                    <p className={`text-[9px] ${isMe ? "text-white/50" : "text-slate-400"}`}>
                      {formatTime(msg.createdAt)}
                    </p>
                    {isMe && idx === allMessages.length - 1 && seenBy.length > 0 && (
                      <div className="flex items-center gap-1 group/seen">
                        <CheckCircle2 size={10} className="text-white/70" />
                        <span className="absolute bottom-full right-0 mb-2 invisible group-hover/seen:visible bg-slate-800 text-white text-[9px] px-2 py-1 rounded-lg whitespace-nowrap z-50">
                          Seen by {seenBy.join(", ")}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Input Area */}
      <div className="shrink-0 px-3 py-2.5 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800">
        <form onSubmit={handleReply} className="flex flex-col gap-2">
          {/* Attachment Preview in Reply */}
          {attachments.length > 0 && (
            <div className="flex flex-wrap gap-2 p-2 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700 animate-in fade-in slide-in-from-bottom-2">
              {attachments.map((file, idx) => (
                <div key={idx} className="flex items-center gap-2 bg-white dark:bg-slate-900 px-3 py-1.5 rounded-xl border border-slate-100 dark:border-slate-800 shadow-sm">
                  <FileText size={12} className="text-[#3b6dae]" />
                  <span className="text-[10px] font-bold truncate max-w-[100px]">{file.fileName}</span>
                  <button type="button" onClick={() => setAttachments(p => p.filter((_, i) => i !== idx))} className="text-slate-400 hover:text-red-500"><Trash2 size={10} /></button>
                </div>
              ))}
            </div>
          )}

          <div className="flex items-center gap-2">
            <div className="relative flex items-center bg-slate-100 dark:bg-slate-800 rounded-full flex-1 px-1">
              {/* Emoji Button */}
              <button
                type="button"
                onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-[#3b6dae] transition-colors"
              >
                😊
              </button>
              {showEmojiPicker && (
                <div className="absolute bottom-12 left-0 p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl rounded-2xl flex flex-wrap gap-1 w-[200px] z-50 animate-in zoom-in-95">
                  {commonEmojis.map(emoji => (
                    <button key={emoji} type="button" onClick={() => { setReplyText(p => p + emoji); setShowEmojiPicker(false); }} className="w-8 h-8 flex items-center justify-center hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg">{emoji}</button>
                  ))}
                </div>
              )}

              <input
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                placeholder="Message..."
                disabled={replyMutation.isPending || isUploading}
                className="flex-1 h-10 px-2 text-[13px] font-medium bg-transparent border-none focus:outline-none placeholder:text-slate-400"
              />

              {/* Attachment Button */}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-[#3b6dae] transition-colors"
              >
                {isUploading ? <Loader2 size={14} className="animate-spin" /> : <Paperclip size={16} />}
              </button>
              <input type="file" multiple hidden ref={fileInputRef} onChange={handleFileUpload} />
            </div>

            <Button
              disabled={(!replyText.trim() && attachments.length === 0) || replyMutation.isPending || isUploading}
              type="submit"
              size="icon"
              className="bg-[#3b6dae] hover:bg-[#2d5385] text-white rounded-full h-10 w-10 shrink-0 shadow-sm transition-all active:scale-95"
            >
              {replyMutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send size={16} className="-ml-0.5" />
              )}
            </Button>
          </div>
        </form>
      </div>

      {/* Modern Confirmation Modal */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xl p-6 sm:p-8 max-w-[360px]">
          <AlertDialogHeader className="space-y-3">
            <div className="w-12 h-12 rounded-full bg-[#eb2027]/5 dark:bg-[#eb2027]/10 flex items-center justify-center mx-auto mb-2">
              <Trash2 className="w-6 h-6 text-[#eb2027]" />
            </div>
            <AlertDialogTitle className="text-center text-lg font-black text-slate-800 dark:text-slate-100">
              Delete Chat
            </AlertDialogTitle>
            <AlertDialogDescription className="text-center text-xs font-semibold text-slate-500 dark:text-slate-400 leading-relaxed max-w-[280px] mx-auto">
              Are you sure you want to permanently delete this conversation?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-8 flex-col space-y-2 sm:space-y-0 sm:flex-row sm:space-x-3 w-full">
            <AlertDialogCancel className="w-full sm:w-1/2 h-11 rounded-xl text-xs font-bold border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/50 m-0">
              Nevermind
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                handleDelete();
              }}
              disabled={deleteMutation.isPending}
              className="w-full sm:w-1/2 h-11 rounded-xl text-xs font-bold bg-[#eb2027] hover:bg-[#d91d24] text-white shadow-[0_4px_14px_rgba(235,32,39,0.3)] m-0 transition-opacity"
            >
              {deleteMutation.isPending ? <Loader2 size={16} className="animate-spin" /> : "Delete It"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
