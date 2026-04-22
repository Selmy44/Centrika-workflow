import { useEffect, useState, useRef } from "react";
import { Bell, Check, X, AlertCircle, Megaphone, MessageCircle, Inbox, MessageSquare } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useAuth } from "@/_core/hooks/useAuth";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useLocation } from "wouter";

export default function NotificationIcon() {
  const { isAuthenticated, user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [, setLocation] = useLocation();
  const notificationRef = useRef<HTMLDivElement>(null);

  const { data: unreadCount = 0, refetch: refetchCount } = trpc.notifications.getUnreadCount.useQuery(undefined, {
    enabled: isAuthenticated,
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  const { data: notificationsData = [], refetch: refetchNotifications } = trpc.notifications.getNotifications.useQuery(
    { limit: 10, onlyUnread: false },
    { enabled: isAuthenticated && isOpen }
  );

  // Mark as read mutation
  const markAsRead = trpc.notifications.markAsRead.useMutation({
    onSuccess: () => {
      refetchCount();
      refetchNotifications();
    },
  });

  const markAllAsRead = trpc.notifications.markAllAsRead.useMutation({
    onSuccess: () => {
      refetchCount();
      refetchNotifications();
    },
  });

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "approval_needed":
        return <AlertCircle className="text-amber-500" size={16} />;
      case "request_approved":
        return <Check className="text-green-500" size={16} />;
      case "request_rejected":
        return <X className="text-red-500" size={16} />;
      case "request_submitted":
        return <Bell className="text-blue-500" size={16} />;
      case "announcement_posted":
        return <Megaphone className="text-indigo-500" size={16} />;
      case "new_comment":
        return <MessageCircle className="text-amber-500" size={16} />;
      case "new_suggestion":
        return <Inbox className="text-emerald-500" size={16} />;
      case "feedback_reply":
        return <MessageSquare className="text-blue-500" size={16} />;
      default:
        return <Bell className="text-gray-500" size={16} />;
    }
  };

  const formatDate = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - new Date(date).getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return "just now";
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return new Date(date).toLocaleDateString();
  };

  // Handle click outside to close notification
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="relative" ref={notificationRef}>
      {/* Notification Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 hover:bg-muted rounded-lg transition-colors"
        aria-label="Notifications"
      >
        <Bell size={20} className="text-foreground" />
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {/* Notification Dropdown */}
      {isOpen && (
        <div className="fixed inset-x-2 sm:absolute sm:inset-x-auto sm:right-0 sm:top-12 top-16 max-w-xs sm:max-w-sm md:w-96 max-h-[calc(100vh-6rem)] z-[9999] animate-in fade-in slide-in-from-top-2">
          <Card className="bg-card border border-border shadow-2xl rounded-lg overflow-hidden">
            {/* Header */}
            <div className="px-3 sm:px-4 py-2 sm:py-3 border-b border-border flex items-center justify-between bg-card gap-2">
              <h3 className="font-semibold text-foreground text-sm sm:text-base">Notifications</h3>
              {unreadCount > 0 && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    markAllAsRead.mutate();
                  }}
                  className="text-xs text-accent hover:text-accent/80 font-medium whitespace-nowrap"
                >
                  Mark all as read
                </button>
              )}
            </div>

            {/* Notifications List */}
            {notificationsData.length === 0 ? (
              <div className="px-3 sm:px-4 py-6 sm:py-8 text-center bg-white dark:bg-slate-950">
                <Bell className="mx-auto mb-2 text-muted-foreground opacity-50" size={20} />
                <p className="text-xs sm:text-sm text-muted-foreground">No notifications yet</p>
              </div>
            ) : (
              <ScrollArea className="h-64 sm:h-80 md:h-96 bg-white dark:bg-slate-950">
                <div className="divide-y divide-gray-200 dark:divide-slate-800">
                  {notificationsData.map((notif: any) => (
                    <div
                      key={notif.id}
                      className={`px-3 sm:px-4 py-2 sm:py-3 hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors cursor-pointer ${
                        !notif.isRead ? "bg-blue-50 dark:bg-slate-800/40" : "bg-white dark:bg-slate-950"
                      }`}
                      onClick={() => {
                        // Mark as read
                        if (!notif.isRead) {
                          markAsRead.mutate({ notificationId: notif.id });
                        }
                        
                        // Close notification dropdown
                        setIsOpen(false);

                        // Handle different notification types
                        switch (notif.type) {
                          // Request-related notifications
                          case "approval_needed":
                            if (notif.requestId) {
                              setLocation(`/approvals?requestId=${notif.requestId}`);
                            }
                            break;
                          
                          case "request_approved":
                          case "request_rejected":
                          case "request_submitted":
                            if (notif.requestId) {
                              // Navigate to requests and open the form as modal
                              setLocation(`/requests/${notif.requestId}`);
                            }
                            break;

                          // Announcement notifications
                          case "announcement_posted":
                          case "new_comment":
                            const announcementId = notif.announcementId;
                            if (window.location.pathname === "/") {
                              // If already on dashboard, trigger modal via custom event
                              window.dispatchEvent(new CustomEvent('open-announcement-detail', { detail: { id: announcementId } }));
                            } else {
                              // Navigate to dashboard and open announcement modal
                              if (announcementId) {
                                setLocation(`/?announcementId=${announcementId}`);
                              } else {
                                setLocation("/");
                              }
                            }
                            break;

                          // Centrika Connect notifications
                          case "new_suggestion":
                          case "feedback_reply":
                            const suggestionId = notif.suggestionId || notif.requestId;
                            if (suggestionId) {
                              window.dispatchEvent(new CustomEvent('open-centrika-connect', { 
                                detail: { mode: 'thread', suggestionId } 
                              }));
                            }
                            break;

                          default:
                            // For any other type, navigate to dashboard
                            setLocation("/");
                            break;
                        }
                      }}
                    >
                      <div className="flex gap-2 sm:gap-3">
                        {/* Icon */}
                        <div className="shrink-0 mt-0.5 sm:mt-1">{getNotificationIcon(notif.type)}</div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <p className="text-xs sm:text-sm font-medium text-foreground line-clamp-1">{notif.title}</p>
                            {!notif.isRead && <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-blue-500 rounded-full shrink-0 mt-1 sm:mt-1.5" />}
                          </div>
                          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{notif.message}</p>
                          <div className="flex items-center gap-1 sm:gap-2 mt-1 sm:mt-2">
                            <p className="text-xs text-muted-foreground">{formatDate(notif.createdAt)}</p>
                            {notif.triggeredByUser?.name && (
                              <p className="text-xs text-muted-foreground hidden sm:inline">• {notif.triggeredByUser.name}</p>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            )}

            {/* Footer */}
            {notificationsData.length > 0 && (
              <div className="px-3 sm:px-4 py-2 sm:py-3 border-t border-border bg-card text-center">
                <button
                  onClick={() => {
                    setIsOpen(false);
                    // TODO: Navigate to notifications page if needed
                  }}
                  className="text-xs text-accent hover:text-accent/80 font-medium"
                >
                  View all notifications
                </button>
              </div>
            )}
          </Card>
        </div>
      )}

      {/* Click outside to close */}
      {isOpen && <div className="fixed inset-0 z-[9998]" onClick={() => setIsOpen(false)} />}
    </div>
  );
}
