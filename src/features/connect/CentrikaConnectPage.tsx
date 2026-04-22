import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { format } from "date-fns";
import { trpc } from "@/lib/trpc";
import { 
  MessageSquare, 
  Inbox, 
  Tag, 
  User, 
  Loader2, 
  Send, 
  ChevronRight, 
  ArrowLeft,
  Mail,
  ShieldCheck,
  Search,
  Filter
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger, 
  DialogDescription 
} from "@/components/ui/dialog";
import { SuggestionBoxForm } from "@/components/SuggestionBoxForm";
import { toast } from "sonner";
import { useAuth } from "@/_core/hooks/useAuth";
import DashboardLayout from "@/components/DashboardLayout";

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

export default function CentrikaConnectPage() {
  const { user } = useAuth();
  const [location] = useLocation();
  const [selectedSuggestionId, setSelectedSuggestionId] = useState<number | null>(null);
  const [replyText, setReplyText] = useState("");
  const isHead = ["admin", "head_of_department", "hr", "head_of_finance", "ceo_md"].includes(user?.role || "") || !!user?.additionalRoles;
  const [activeTab, setActiveTab] = useState(isHead ? "inbox" : "sent");
  const [isComposeOpen, setIsComposeOpen] = useState(false);
  const utils = trpc.useContext();

  const { data: myFeedback, isLoading: myLoading } = trpc.suggestions.listMyFeedback.useQuery(undefined, {
    refetchInterval: 10000
  });
  const { data: inboxSuggestions, isLoading: inboxLoading } = trpc.suggestions.listInbox.useQuery(undefined, {
    enabled: isHead,
    refetchInterval: 10000
  });

  // Extract messageId from URL and find which tab it belongs to
  useEffect(() => {
    const searchParams = new URLSearchParams(location.split('?')[1]);
    const msgId = searchParams.get('messageId');
    if (msgId && (myFeedback || inboxSuggestions)) {
      const id = parseInt(msgId, 10);
      
      // Smart tab switching: Check if message is in inbox or sent
      const inSent = myFeedback?.some(s => s.id === id);
      const inInbox = inboxSuggestions?.some(s => s.id === id);
      
      if (inInbox) setActiveTab("inbox");
      else if (inSent) setActiveTab("sent");
      
      // Open the floating chat natively
      window.dispatchEvent(new CustomEvent('open-centrika-connect', { detail: { mode: 'thread', suggestionId: id } }));
    }
  }, [location, myFeedback, inboxSuggestions]);

  const openThread = (id: number) => {
    window.dispatchEvent(new CustomEvent('open-centrika-connect', { detail: { mode: 'thread', suggestionId: id } }));
  };

  return (
    <DashboardLayout>
      <div className="flex flex-col flex-1 min-h-0 p-4 md:p-8 space-y-6 animate-in fade-in duration-500">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-3xl font-black text-[#3b6dae] tracking-tight flex items-center gap-3">
              <div className="p-2 bg-[#3b6dae] text-white rounded-xl shadow-lg shadow-[#3b6dae]/20">
                <MessageSquare size={24} />
              </div>
              CENTRIKA CONNECT
            </h1>
            <p className="text-sm text-slate-500 font-medium pl-1">
              Communication history and direct support requests.
            </p>
          </div>
          
          <div className="flex items-center gap-3">
              <Button 
                  onClick={() => window.dispatchEvent(new CustomEvent("open-centrika-connect", { detail: { mode: 'compose' } }))}
                  size="icon"
                  className="w-12 h-12 bg-[#3b6dae] hover:bg-[#2d5385] text-white rounded-full shadow-lg shadow-blue-500/20 transition-all hover:scale-110 active:scale-95 border-2 border-white/20"
                  title="New Message"
              >
                  <Send size={20} />
              </Button>
          </div>
        </div>

        {/* Main Content Card */}
        <Card className="flex-1 min-h-0 border-none shadow-2xl shadow-blue-500/5 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-[2.5rem] flex flex-col border border-white/20">
          
          <div className="px-8 pt-8 pb-2 border-b border-slate-100 dark:border-slate-800 shrink-0">
                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                  <TabsList className="bg-slate-100/50 dark:bg-slate-800/50 p-1 rounded-2xl border border-slate-200/50 dark:border-slate-700/30">
                    {isHead && (
                      <TabsTrigger value="inbox" className="rounded-xl px-6 py-2.5 text-xs font-black uppercase tracking-widest data-[state=active]:bg-white data-[state=active]:text-[#c79d2d] data-[state=active]:shadow-sm">
                        <Inbox size={14} className="mr-2" /> My Inbox
                      </TabsTrigger>
                    )}
                    <TabsTrigger value="sent" className="rounded-xl px-6 py-2.5 text-xs font-black uppercase tracking-widest data-[state=active]:bg-white data-[state=active]:text-[#3b6dae] data-[state=active]:shadow-sm">
                      <Send size={14} className="mr-2" /> Sent Messages
                    </TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>

              <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
                {activeTab === "inbox" && (
                  <div className="space-y-4 pb-10">
                    {inboxLoading ? (
                      <LoadingState label="Loading inbox..." />
                    ) : !inboxSuggestions || inboxSuggestions.length === 0 ? (
                      <EmptyState icon={Inbox} label="Your inbox is clear!" />
                    ) : (
                      <div className="grid grid-cols-1 gap-4">
                        {inboxSuggestions.map((suggestion: any) => (
                          <MessageCard 
                            key={suggestion.id} 
                            suggestion={suggestion} 
                            onClick={() => openThread(suggestion.id)} 
                            type="inbox"
                          />
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {activeTab === "sent" && (
                  <div className="space-y-4 pb-10">
                    {myLoading ? (
                      <LoadingState label="Loading history..." />
                    ) : !myFeedback || myFeedback.length === 0 ? (
                      <EmptyState icon={MessageSquare} label="You haven't sent any messages yet." />
                    ) : (
                      <div className="grid grid-cols-1 gap-4">
                        {myFeedback.map((suggestion: any) => (
                          <MessageCard 
                            key={suggestion.id} 
                            suggestion={suggestion} 
                            onClick={() => openThread(suggestion.id)} 
                            type="sent"
                          />
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
        </Card>
      </div>
    </DashboardLayout>
  );
}

/* --------- Sub-Components --------- */

function LoadingState({ label }: { label: string }) {
  return (
    <div className="flex flex-col items-center justify-center p-20 gap-4">
      <Loader2 className="w-10 h-10 animate-spin text-[#3b6dae]/20" />
      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{label}</p>
    </div>
  );
}

function EmptyState({ icon: Icon, label }: { icon: any, label: string }) {
  return (
    <div className="flex flex-col items-center justify-center p-20 gap-4 opacity-40">
      <div className="p-6 bg-slate-100 rounded-full">
        <Icon size={40} className="text-slate-300" />
      </div>
      <p className="text-sm font-bold text-slate-500">{label}</p>
    </div>
  );
}

function MessageCard({ suggestion, onClick, type }: { suggestion: any, onClick: () => void, type: "sent" | "inbox" }) {
  const isTargeted = suggestion.targetUserIds && suggestion.targetUserIds.length > 0;
  const isUnread = suggestion.notifications?.some((n: any) => !n.isRead);
  
  // The user requested only the new message should appear, not the first message
  const latestMessage = suggestion.replies && suggestion.replies.length > 0
    ? suggestion.replies[suggestion.replies.length - 1]
    : suggestion;

  return (
    <div 
      onClick={onClick}
      className={`p-6 bg-white dark:bg-slate-900 border rounded-3xl cursor-pointer transition-all group overflow-hidden relative ${
        isUnread 
          ? "border-slate-500 dark:border-slate-400 shadow-xl shadow-slate-500/10 hover:shadow-slate-500/20" 
          : "border-slate-100 dark:border-slate-800 hover:border-[#3b6dae]/30 hover:shadow-2xl hover:shadow-blue-500/10 opacity-60 hover:opacity-100"
      }`}
    >
        {/* Glow effect */}
        {isUnread && (
            <div className="absolute right-4 top-4 w-3 h-3 bg-red-600 rounded-full shadow-[0_0_10px_rgba(220,38,38,0.5)] animate-pulse" />
        )}
        <div className={`absolute -right-10 -top-10 w-32 h-32 blur-3xl transition-colors ${isUnread ? 'bg-red-500/5 group-hover:bg-red-500/10' : 'bg-blue-500/5 group-hover:bg-blue-500/10'}`} />

        <div className="flex justify-between items-start mb-4 relative z-10">
            {type === "inbox" ? (
                <div className="flex items-center gap-3">
                    <Avatar className={`w-10 h-10 rounded-2xl border-2 ${isUnread ? 'border-red-100 shadow-red-200' : 'border-white shadow-sm'} shrink-0`}>
                        {latestMessage.user?.profileImage && <AvatarImage src={latestMessage.user.profileImage} />}
                        <AvatarFallback className="bg-[#c79d2d] text-white text-xs font-black">{latestMessage.user?.name?.charAt(0) || "U"}</AvatarFallback>
                    </Avatar>
                    <div className="pr-6">
                        <p className={`text-sm tracking-tight ${isUnread ? 'font-black text-slate-900 dark:text-white text-base' : 'font-bold text-slate-800 dark:text-slate-100'}`}>
                          {latestMessage.user?.name || "Staff Member"}
                        </p>
                        <div className="flex items-center gap-2">
                             <p className={`text-[10px] font-bold uppercase tracking-widest ${isUnread ? "text-[#b28a25]" : "text-[#c79d2d]"}`}>{latestMessage.user?.position || "Staff"}</p>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="flex flex-wrap gap-2">
                    <span className="text-[9px] font-black uppercase text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-lg flex items-center gap-1.5 border border-slate-200/50">
                        <Tag size={10} /> {isTargeted ? 'TO RECIPIENTS:' : 'TAGGED:'}
                    </span>
                    {!isTargeted && suggestion.targetRoles.map((r: string) => (
                        <span key={r} className="text-[9px] font-black uppercase text-[#3b6dae] bg-[#3b6dae]/5 border border-[#3b6dae]/10 px-2 py-1 rounded-lg shadow-sm">
                            {ROLE_LABELS[r] || r}
                        </span>
                    ))}
                    {isTargeted && (
                        <div className="flex flex-wrap gap-1.5">
                            {(suggestion.targetUsers || []).map((u: any) => (
                                <span key={u.id} className="text-[9px] font-black uppercase text-[#3b6dae] bg-[#3b6dae]/5 border border-[#3b6dae]/10 px-2 py-1 rounded-lg shadow-sm">
                                    {u.name}
                                </span>
                            ))}
                            {(!suggestion.targetUsers || suggestion.targetUsers.length === 0) && (
                                <span className="text-[9px] font-black uppercase text-[#3b6dae] bg-[#3b6dae]/5 border border-[#3b6dae]/10 px-2 py-1 rounded-lg shadow-sm">
                                    {suggestion.targetUserIds.length} SPECIFIC STAFF
                                </span>
                            )}
                        </div>
                    )}
                </div>
            )}
            {isUnread ? (
                <span className="text-[10px] font-black tracking-widest text-white bg-slate-900 px-2.5 py-1 rounded-full shadow-sm">{timeAgo(latestMessage.createdAt)}</span>
            ) : (
                <span className="text-[10px] font-bold text-slate-400 bg-slate-50 dark:bg-slate-800/50 px-2.5 py-1 rounded-full shadow-sm">{timeAgo(latestMessage.createdAt)}</span>
            )}
        </div>

        <p className={`text-sm line-clamp-2 leading-relaxed mb-4 relative z-10 ${isUnread ? 'text-black dark:text-white font-black text-[15px]' : 'text-slate-600 dark:text-slate-300 font-medium'}`}>
          {latestMessage.id !== suggestion.id && (
            <span className="font-bold text-[#c79d2d] mr-2">Reply:</span>
          )}{latestMessage.content}
        </p>

        <div className="flex items-center justify-between mt-auto pt-4 border-t border-slate-100 dark:border-slate-800 relative z-10">
            <div className="flex items-center gap-3">
                {suggestion.replies && suggestion.replies.length > 0 ? (
                    <div className="flex items-center gap-2 text-[10px] font-black text-[#c79d2d] bg-[#c79d2d]/10 px-3 py-1.5 rounded-xl border border-[#c79d2d]/20 transition-all hover:scale-105">
                        <MessageSquare size={12} />
                        {suggestion.replies.length} {suggestion.replies.length === 1 ? 'RESPONSE' : 'RESPONSES'}
                    </div>
                ) : (
                    <span className="text-[10px] font-bold text-slate-400 italic bg-slate-50 px-3 py-1.5 rounded-xl">AWAITING RESPONSE...</span>
                )}
            </div>
            <button className="text-[10px] font-black text-[#3b6dae] uppercase tracking-[0.2em] flex items-center gap-1 group-hover:gap-2 transition-all opacity-0 group-hover:opacity-100">
                View Thread <ChevronRight size={14} />
            </button>
        </div>
    </div>
  );
}


