import { useState } from "react";
import { format } from "date-fns";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { trpc } from "@/lib/trpc";
import { Loader2, MessageSquare, Tag, ShieldCheck } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface MyFeedbackDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

const ROLE_LABELS: Record<string, string> = {
  admin: "Admin",
  hr: "HR",
  head_of_department: "HOD",
  head_of_finance: "Finance",
  ceo_md: "CEO/MD",
};

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

export function MyFeedbackDialog({ isOpen, onClose }: MyFeedbackDialogProps) {
  const [selectedSuggestionId, setSelectedSuggestionId] = useState<number | null>(null);

  const { data: myFeedback, isLoading } = trpc.suggestions.listMyFeedback.useQuery(undefined, {
    enabled: isOpen,
  });

  const selectedSuggestion = myFeedback?.find(s => s.id === selectedSuggestionId);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
        if (!open) {
            onClose();
            setTimeout(() => setSelectedSuggestionId(null), 300);
        }
    }}>
      <DialogContent className="sm:max-w-2xl bg-slate-50 dark:bg-slate-950 border-none rounded-3xl p-0 overflow-hidden shadow-2xl flex flex-col max-h-[85vh]">
        <DialogHeader className="bg-white dark:bg-slate-900 border-b border-border/50 p-6 pb-5 shrink-0 z-10 relative">
          <DialogTitle className="flex items-center gap-2 text-xl font-black text-[#3b6dae]">
            <MessageSquare className="w-5 h-5 text-[#c79d2d]" />
            {selectedSuggestion ? (
              <div className="flex items-center gap-3">
                 <button onClick={() => setSelectedSuggestionId(null)} className="text-sm font-bold text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors uppercase tracking-widest bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-lg">← Back</button>
                 Thread Activity
              </div>
            ) : "My Connect History"}
          </DialogTitle>
          {!selectedSuggestion && (
              <p className="text-xs text-slate-500 mt-2 font-medium">Track your sent messages and support requests.</p>
          )}
        </DialogHeader>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center p-20 gap-4 flex-1">
            <Loader2 className="w-8 h-8 animate-spin text-[#3b6dae]/40" />
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Loading history...</p>
          </div>
        ) : !selectedSuggestion ? (
          <ScrollArea className="flex-1 p-6 bg-slate-50/50 dark:bg-slate-950/50">
            {!myFeedback || myFeedback.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-10 mt-10 gap-3 opacity-60">
                 <MessageSquare className="w-12 h-12 text-slate-300" />
                 <p className="text-sm font-bold text-slate-500">You haven't sent any messages or requests yet.</p>
              </div>
            ) : (
              <div className="space-y-3 pb-6">
                {myFeedback.map((suggestion: any) => (
                  <div 
                    key={suggestion.id}
                    onClick={() => setSelectedSuggestionId(suggestion.id)}
                    className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl cursor-pointer hover:border-[#3b6dae]/50 hover:shadow-md transition-all group"
                  >
                    <div className="flex justify-between items-start mb-2">
                       <div className="flex flex-wrap gap-1.5">
                           <span className="text-[9px] font-black uppercase text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded flex items-center gap-1">
                               <Tag size={10} /> TAGGED:
                           </span>
                           {suggestion.targetRoles.map((r: string) => (
                               <span key={r} className="text-[9px] font-bold uppercase text-[#3b6dae] bg-[#3b6dae]/10 px-2 py-0.5 rounded">
                                   {ROLE_LABELS[r] || r}
                               </span>
                           ))}
                       </div>
                       <span className="text-[10px] font-medium text-slate-400">{timeAgo(suggestion.createdAt)}</span>
                    </div>

                    <p className="text-sm text-slate-600 dark:text-slate-300 line-clamp-2 mt-2 leading-relaxed">
                      {suggestion.content}
                    </p>

                        <div className="flex items-center justify-between mt-3">
                            {suggestion.replies && suggestion.replies.length > 0 ? (
                                <div className="flex items-center gap-1 text-[10px] font-bold text-[#c79d2d] bg-[#c79d2d]/10 px-2.5 py-1 rounded max-w-max">
                                    {suggestion.replies.length} {suggestion.replies.length === 1 ? 'Response' : 'Responses'}
                                </div>
                            ) : (
                                <span className="text-[10px] font-medium text-slate-400 italic">Awaiting response...</span>
                            )}
                        </div>
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
                        <div className="flex justify-between items-center mb-3">
                            <span className="text-[10px] font-medium text-slate-400">Submitted {format(new Date(selectedSuggestion.createdAt), "PPp")}</span>
                        </div>
                        <p className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap leading-relaxed">
                            {selectedSuggestion.content}
                        </p>
                    </div>

                    <div className="space-y-4">
                        <h4 className="text-xs font-black uppercase tracking-widest text-[#c79d2d] ml-1">Official Responses</h4>
                        
                        {!selectedSuggestion.replies || selectedSuggestion.replies.length === 0 ? (
                            <p className="text-xs text-slate-400 pl-1 italic">No responses from the tagged heads yet.</p>
                        ) : (
                            selectedSuggestion.replies.map((reply: any) => (
                                <div key={reply.id} className="flex gap-3 pl-4 border-l-2 border-[#c79d2d]/20">
                                    <Avatar className="w-8 h-8 rounded-full shadow-sm shrink-0">
                                        {reply.user?.profileImage && <AvatarImage src={reply.user.profileImage} />}
                                        <AvatarFallback className="bg-[#c79d2d]/10 text-[#c79d2d] text-xs font-bold">{reply.user?.name?.charAt(0) || "U"}</AvatarFallback>
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
                            ))
                        )}
                    </div>
                </div>
            </ScrollArea>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
