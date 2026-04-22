import { useState } from "react";
import { format } from "date-fns";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { trpc } from "@/lib/trpc";
import { Loader2, Inbox, Send, ShieldCheck, User } from "lucide-react";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface FeedbackInboxDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

function timeAgo(date: string | Date | undefined) {
  if (!date) return "";
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

export function FeedbackInboxDialog({ isOpen, onClose }: FeedbackInboxDialogProps) {
  const [selectedSuggestionId, setSelectedSuggestionId] = useState<number | null>(null);
  const [replyText, setReplyText] = useState("");
  const utils = trpc.useContext();

  const { data: inboxSuggestions, isLoading } = trpc.suggestions.listInbox.useQuery(undefined, {
    enabled: isOpen,
  });

  const replyMutation = trpc.suggestions.reply.useMutation({
    onSuccess: () => {
      setReplyText("");
      utils.suggestions.listInbox.invalidate();
      toast.success("Reply Sent", { description: "Your response has been sent to the sender." });
    },
    onError: (err) => {
      toast.error("Reply Failed", { description: err.message });
    }
  });

  const handleReply = (e: React.FormEvent, suggestionId: number) => {
    e.preventDefault();
    if (!replyText.trim()) return;
    replyMutation.mutate({ suggestionId, content: replyText });
  };

  const selectedSuggestion = inboxSuggestions?.find(s => s.id === selectedSuggestionId);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
        if (!open) {
            onClose();
            setTimeout(() => setSelectedSuggestionId(null), 300);
        }
    }}>
      <DialogContent className="sm:max-w-2xl bg-slate-50 dark:bg-slate-950 border-none rounded-3xl p-0 overflow-hidden shadow-2xl flex flex-col max-h-[85vh]">
        <DialogHeader className="bg-white dark:bg-slate-900 border-b border-border/50 p-6 pb-5 shrink-0 z-10 relative">
          <DialogTitle className="flex items-center gap-2 text-xl font-black text-[#c79d2d]">
            <Inbox className="w-5 h-5" />
            {selectedSuggestion ? (
              <div className="flex items-center gap-3">
                 <button onClick={() => setSelectedSuggestionId(null)} className="text-sm font-bold text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors uppercase tracking-widest bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-lg">← Back</button>
                 Communication Thread
              </div>
            ) : "Centrika Connect Inbox"}
          </DialogTitle>
          {!selectedSuggestion && (
              <p className="text-xs text-slate-500 mt-2 font-medium">Direct communications and support requests addressed to you.</p>
          )}
        </DialogHeader>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center p-20 gap-4 flex-1">
            <Loader2 className="w-8 h-8 animate-spin text-[#c79d2d]/40" />
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Loading inbox...</p>
          </div>
        ) : !selectedSuggestion ? (
          <ScrollArea className="flex-1 p-6 bg-slate-50/50 dark:bg-slate-950/50">
            {!inboxSuggestions || inboxSuggestions.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-10 mt-10 gap-3 opacity-60">
                 <Inbox className="w-12 h-12 text-slate-300" />
                 <p className="text-sm font-bold text-slate-500">Your inbox is clear!</p>
              </div>
            ) : (
              <div className="space-y-3 pb-6">
                {inboxSuggestions.map((suggestion: any) => (
                  <div 
                    key={suggestion.id}
                    onClick={() => setSelectedSuggestionId(suggestion.id)}
                    className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl cursor-pointer hover:border-[#c79d2d]/50 hover:shadow-md transition-all group relative overflow-hidden"
                  >
                    <div className="flex justify-between items-start mb-2 relative z-10">
                       <div className="flex items-center gap-2">
                           <div className="w-8 h-8 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center text-slate-400">
                                <User size={14} />
                           </div>
                           <div>
                               <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                                   {suggestion.user?.name || "Staff Member"}
                               </p>
                               {suggestion.user?.position && (
                                   <p className="text-[9px] uppercase tracking-wider text-slate-400 mt-0.5">
                                       {suggestion.user.position} 
                                       {suggestion.user.department?.name && <span className="ml-1 opacity-60">• {suggestion.user.department.name}</span>}
                                   </p>
                               )}
                           </div>
                       </div>
                       <span className="text-[10px] font-medium text-slate-400">{timeAgo(suggestion.createdAt)}</span>
                    </div>

                    <p className="text-sm text-slate-600 dark:text-slate-300 line-clamp-2 leading-relaxed relative z-10">
                      {suggestion.content}
                    </p>

                    {suggestion.replies && suggestion.replies.length > 0 && (
                        <div className="mt-3 flex items-center gap-1.5 text-[10px] font-bold text-blue-500 bg-blue-50 dark:bg-blue-900/20 px-2.5 py-1 rounded-md w-max relative z-10">
                            {suggestion.replies.length} {suggestion.replies.length === 1 ? 'Reply' : 'Replies'}
                        </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        ) : (
          <div className="flex flex-col h-full flex-1 overflow-hidden">
            <ScrollArea className="flex-1 px-6">
                <div className="py-6 space-y-6">
                    <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm relative">
                        <div className="flex items-center gap-3 mb-4 border-b border-slate-100 dark:border-slate-800 pb-4">
                           <div className="w-10 h-10 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center text-slate-400">
                                <User size={18} />
                           </div>
                           <div>
                               <p className="text-sm font-bold text-slate-800 dark:text-slate-200">
                                   {selectedSuggestion.user?.name || "Staff Member"}
                               </p>
                               <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mt-0.5">
                                   {selectedSuggestion.user?.position && <p className="text-[10px] uppercase tracking-wider text-slate-500 font-bold">{selectedSuggestion.user.position}</p>}
                                   {selectedSuggestion.user?.department?.name && <p className="text-[10px] uppercase tracking-wider text-slate-400 font-medium whitespace-nowrap bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">DEPT: {selectedSuggestion.user.department.name}</p>}
                                   <p className="text-[10px] font-medium text-slate-400 ml-auto sm:ml-0 italic">Submitted {format(new Date(selectedSuggestion.createdAt), "PPp")}</p>
                               </div>
                           </div>
                        </div>
                        <p className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap leading-relaxed">
                            {selectedSuggestion.content}
                        </p>
                    </div>

                    {selectedSuggestion.replies && selectedSuggestion.replies.length > 0 && (
                        <div className="space-y-4">
                            <h4 className="text-xs font-black uppercase tracking-widest text-[#3b6dae] ml-1">Thread History</h4>
                            {selectedSuggestion.replies.map((reply: any) => (
                                <div key={reply.id} className="flex gap-3 pl-4 border-l-2 border-[#3b6dae]/20">
                                    <Avatar className="w-8 h-8 rounded-full shadow-sm shrink-0">
                                        {reply.user?.profileImage && <AvatarImage src={reply.user.profileImage} />}
                                        <AvatarFallback className="bg-[#3b6dae]/10 text-[#3b6dae] text-xs font-bold">{reply.user?.name?.charAt(0) || "U"}</AvatarFallback>
                                    </Avatar>
                                    <div className="flex-1 bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl rounded-tl-sm p-3">
                                        <div className="flex justify-between items-center mb-1.5">
                                            <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                                                {reply.user?.name}
                                                {reply.user?.position && <span className="ml-1.5 pl-1.5 border-l text-[10px] font-normal text-slate-500">{reply.user.position}</span>}
                                            </p>
                                            <span className="text-[9px] font-medium text-slate-400">{timeAgo(reply.createdAt)}</span>
                                        </div>
                                        <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">{reply.content}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </ScrollArea>
            
            <div className="p-4 bg-white dark:bg-slate-900 border-t border-border shrink-0">
                <form onSubmit={(e) => handleReply(e, selectedSuggestion.id)} className="flex gap-2">
                    <Input
                        value={replyText}
                        onChange={(e) => setReplyText(e.target.value)}
                        placeholder="Write a reply..."
                        disabled={replyMutation.isPending}
                        className="bg-slate-50 dark:bg-slate-950/50 rounded-xl"
                    />
                    <Button disabled={!replyText.trim() || replyMutation.isPending} type="submit" className="bg-[#c79d2d] hover:bg-[#a67c00] text-white rounded-xl shadow-md px-4 shrink-0">
                        {replyMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                    </Button>
                </form>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
