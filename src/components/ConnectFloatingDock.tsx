import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageSquare, X, Minus, Maximize2, Send, Search, ArrowLeft, Loader2, ChevronDown, Users } from "lucide-react";
import { SuggestionBoxForm } from "./SuggestionBoxForm";
import { ThreadView } from "@/features/connect/ThreadView";
import { Button } from "./ui/button";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";

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

export function ConnectFloatingDock() {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [activeMode, setActiveMode] = useState<"chats" | "compose" | "thread">("chats");
  const [activeSuggestionId, setActiveSuggestionId] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const isHead = ["admin", "head_of_department", "hr", "head_of_finance", "ceo_md"].includes(user?.role || "") || !!user?.additionalRoles;

  const { data: unreadCount } = trpc.suggestions.getUnreadCount.useQuery(undefined, {
    refetchInterval: 10000,
  });

  const { data: myFeedback, isLoading: myLoading } = trpc.suggestions.listMyFeedback.useQuery(undefined, {
    refetchInterval: 10000,
    enabled: isOpen,
  });

  const { data: inboxSuggestions, isLoading: inboxLoading } = trpc.suggestions.listInbox.useQuery(undefined, {
    enabled: isOpen,
    refetchInterval: 10000,
  });

  // Merge and deduplicate conversations
  const allChats = useMemo(() => {
    const map = new Map<number, any>();
    (inboxSuggestions || []).forEach((s: any) => map.set(s.id, { ...s, chatType: "inbox" }));
    (myFeedback || []).forEach((s: any) => {
      if (!map.has(s.id)) map.set(s.id, { ...s, chatType: "sent" });
    });
    return Array.from(map.values()).sort((a, b) => {
      const aDate = a.replies?.length ? a.replies[a.replies.length - 1].createdAt : a.createdAt;
      const bDate = b.replies?.length ? b.replies[b.replies.length - 1].createdAt : b.createdAt;
      return new Date(bDate).getTime() - new Date(aDate).getTime();
    });
  }, [myFeedback, inboxSuggestions]);

  // Filter by search
  const filteredChats = useMemo(() => {
    if (!searchQuery.trim()) return allChats;
    const q = searchQuery.toLowerCase();
    return allChats.filter((chat: any) =>
      chat.title?.toLowerCase().includes(q) ||
      chat.user?.name?.toLowerCase().includes(q) ||
      chat.content?.toLowerCase().includes(q)
    );
  }, [allChats, searchQuery]);

  const openThread = (id: number) => {
    setActiveMode("thread");
    setActiveSuggestionId(id);
  };

  const goBack = () => {
    setActiveMode("chats");
    setActiveSuggestionId(null);
    setSearchQuery("");
  };

  // Custom event listener to open from other components
  useEffect(() => {
    const handleOpenConnect = (e: any) => {
      setIsOpen(true);
      setIsMinimized(false);

      const payload = e.detail || {};
      if (payload.mode === "thread" && payload.suggestionId) {
        setActiveMode("thread");
        setActiveSuggestionId(payload.suggestionId);
      } else if (payload.mode === "compose") {
        setActiveMode("compose");
        setActiveSuggestionId(null);
      } else {
        setActiveMode("chats");
        setActiveSuggestionId(null);
      }
    };
    window.addEventListener("open-centrika-connect", handleOpenConnect);
    return () => window.removeEventListener("open-centrika-connect", handleOpenConnect);
  }, []);

  const isLoading = myLoading || inboxLoading;
  const headerTitle = activeMode === "thread" ? "Thread" : activeMode === "compose" ? "New Message" : "Messages";

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end pointer-events-none">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{
              opacity: 1,
            }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="w-[92vw] md:w-[380px] bg-white dark:bg-slate-900 shadow-[0_25px_60px_-10px_rgba(0,0,0,0.25)] rounded-2xl border border-slate-200/80 dark:border-slate-800 overflow-hidden flex flex-col pointer-events-auto mb-4"
            style={{ maxHeight: "75vh", height: "520px" }}
          >
            {/* Header */}
            <div
              className="bg-gradient-to-r from-[#3b6dae] to-[#2d5a94] px-4 py-3 flex items-center justify-between shrink-0"
              onClick={() => isMinimized && setIsMinimized(false)}
            >
              <div className="flex items-center gap-2.5">
                {activeMode !== "chats" && (
                  <button
                    onClick={(e) => { e.stopPropagation(); goBack(); }}
                    className="h-7 w-7 flex items-center justify-center text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-all"
                  >
                    <ArrowLeft size={16} />
                  </button>
                )}
                <div className="p-1.5 bg-white/15 rounded-lg text-white">
                  <MessageSquare size={14} />
                </div>
                <span className="text-[13px] font-bold text-white tracking-wide">
                  {headerTitle}
                </span>
              </div>
              <div className="flex items-center gap-0.5">
                {activeMode === "chats" && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-white/80 hover:text-white hover:bg-white/10 rounded-lg"
                    onClick={(e) => { e.stopPropagation(); setActiveMode("compose"); }}
                    title="New Message"
                  >
                    <Send size={13} />
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-white/80 hover:text-white hover:bg-white/10 rounded-lg"
                  onClick={(e) => { e.stopPropagation(); setIsMinimized(!isMinimized); }}
                >
                  {isMinimized ? <Maximize2 size={13} /> : <Minus size={13} />}
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-white/80 hover:text-white hover:bg-white/10 rounded-lg"
                  onClick={(e) => { e.stopPropagation(); setIsOpen(false); }}
                >
                  <X size={13} />
                </Button>
              </div>
            </div>

            {/* Content Area */}
            {!isMinimized && (
              <div className="flex-1 min-h-0 overflow-hidden flex flex-col">

                {/* ===== CHATS LIST VIEW ===== */}
                {activeMode === "chats" && (
                  <>
                    {/* Search Bar */}
                    <div className="px-3 pt-3 pb-2 shrink-0">
                      <div className="relative">
                        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                          type="text"
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          placeholder="Search messages..."
                          className="w-full h-9 pl-9 pr-3 text-xs font-medium bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#3b6dae]/20 focus:border-[#3b6dae]/30 placeholder:text-slate-400 transition-all"
                        />
                      </div>
                    </div>

                    {/* Chat List */}
                    <div className="flex-1 overflow-y-auto custom-scrollbar">
                      {isLoading ? (
                        <div className="flex flex-col items-center justify-center h-full gap-3">
                          <Loader2 className="w-6 h-6 animate-spin text-[#3b6dae]/30" />
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Loading chats...</p>
                        </div>
                      ) : filteredChats.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full gap-3 px-6">
                          <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                            <MessageSquare size={20} className="text-slate-300" />
                          </div>
                          <p className="text-xs font-bold text-slate-400 text-center">
                            {searchQuery ? "No messages found" : "No conversations yet"}
                          </p>
                          {!searchQuery && (
                            <button
                              onClick={() => setActiveMode("compose")}
                              className="text-[11px] font-bold text-[#3b6dae] hover:underline"
                            >
                              Start a new message
                            </button>
                          )}
                        </div>
                      ) : (
                        <div className="pb-2">
                          {filteredChats.map((chat: any) => {
                            const isUnread = chat.notifications?.some((n: any) => !n.isRead);
                            const latestMessage = chat.replies?.length
                              ? chat.replies[chat.replies.length - 1]
                              : chat;
                            const isFromMe = latestMessage.userId === user?.id;

                            // Find the OTHER person in the conversation
                            let otherUser = null;
                            if (chat.userId !== user?.id) {
                              // I received this — other person is the sender
                              otherUser = chat.user;
                            } else {
                              // I sent this — use the first target user, or fallback to first reply
                              otherUser = (chat as any).targetUsers?.[0] || (chat.replies || []).find((r: any) => r.userId !== user?.id)?.user;
                            }

                            const displayName = chat.title || otherUser?.name || "Group Chat";
                            const displayImage = chat.title ? null : otherUser?.profileImage || null;
                            const initials = displayName.charAt(0).toUpperCase();

                            return (
                              <button
                                key={chat.id}
                                onClick={() => openThread(chat.id)}
                                className={`w-full flex items-center gap-3 px-3 py-3 text-left transition-all duration-200 hover:bg-slate-50 dark:hover:bg-slate-800/60 border-b border-slate-100/80 dark:border-slate-800/50 last:border-b-0 group ${isUnread ? "bg-blue-50/40 dark:bg-blue-950/20" : ""
                                  }`}
                              >
                                {/* Avatar */}
                                <div className="relative shrink-0">
                                  <Avatar className="w-10 h-10 rounded-full border-2 border-white dark:border-slate-900 shadow-sm">
                                    {displayImage && <AvatarImage src={displayImage} />}
                                    <AvatarFallback className={`text-xs font-black ${isUnread ? "bg-[#3b6dae] text-white" : "bg-slate-100 dark:bg-slate-800 text-slate-500"}`}>
                                      {chat.title ? <Users size={16} /> : initials}
                                    </AvatarFallback>
                                  </Avatar>
                                  {isUnread && (
                                    <div className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-[#3b6dae] rounded-full border-2 border-white dark:border-slate-900" />
                                  )}
                                </div>

                                {/* Content */}
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center justify-between gap-2 mb-0.5">
                                    <p className={`text-[13px] truncate ${isUnread ? "font-black text-slate-900 dark:text-white" : "font-semibold text-slate-700 dark:text-slate-200"}`}>
                                      {displayName}
                                    </p>
                                    <span className={`text-[10px] shrink-0 ${isUnread ? "font-bold text-[#3b6dae]" : "font-medium text-slate-400"}`}>
                                      {timeAgo(latestMessage.createdAt)}
                                    </span>
                                  </div>
                                  <p className={`text-[11px] truncate leading-snug ${isUnread ? "font-semibold text-slate-600 dark:text-slate-300" : "font-normal text-slate-400 dark:text-slate-500"}`}>
                                    {isFromMe && <span className="text-slate-400 mr-1">You:</span>}
                                    {latestMessage.content}
                                  </p>
                                </div>

                                {/* Unread indicator dot */}
                                {isUnread && (
                                  <div className="w-2.5 h-2.5 rounded-full bg-[#3b6dae] shrink-0 shadow-sm shadow-blue-500/30" />
                                )}
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </>
                )}

                {/* ===== COMPOSE VIEW ===== */}
                {activeMode === "compose" && (
                  <div className="flex-1 overflow-y-auto custom-scrollbar p-5">
                    <SuggestionBoxForm onSuccess={() => { setActiveMode("chats"); }} />
                  </div>
                )}

                {/* ===== THREAD VIEW ===== */}
                {activeMode === "thread" && activeSuggestionId && (
                  <ThreadView suggestionId={activeSuggestionId} />
                )}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Trigger Button */}
      {!isOpen && (
        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => { setIsOpen(true); setActiveMode("chats"); }}
          className="px-5 py-3.5 bg-gradient-to-br from-[#3b6dae] to-[#2d5a94] text-white rounded-full shadow-[0_8px_25px_rgba(59,109,174,0.4)] flex items-center justify-center gap-2.5 pointer-events-auto relative group overflow-visible border-2 border-white/20 transition-all duration-300 hover:shadow-[0_12px_35px_rgba(59,109,174,0.5)] hover:-translate-y-1"
        >
          <MessageSquare size={20} className="relative z-10 shrink-0" />
          <span className="text-sm font-bold tracking-wide relative z-10 whitespace-nowrap hidden sm:block">Centrika Connect</span>

          {unreadCount && unreadCount > 0 ? (
            <div className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-[9px] font-black min-w-5 h-5 px-1 rounded-full flex items-center justify-center border-2 border-white shadow-lg animate-pulse">
              {unreadCount > 9 ? "9+" : unreadCount}
            </div>
          ) : null}
        </motion.button>
      )}
    </div>
  );
}
