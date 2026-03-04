import { useEffect, useState } from "react";
import { Bell, Check, X, AlertCircle } from "lucide-react";
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

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="relative">
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
        <div className="absolute right-0 top-12 w-96 z-50 animate-in fade-in slide-in-from-top-2">
          <Card className="bg-card border border-border shadow-2xl rounded-lg overflow-hidden">
            {/* Header */}
            <div className="px-4 py-3 border-b border-border flex items-center justify-between bg-card">
              <h3 className="font-semibold text-foreground">Notifications</h3>
              {unreadCount > 0 && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    markAllAsRead.mutate();
                  }}
                  className="text-xs text-accent hover:text-accent/80 font-medium"
                >
                  Mark all as read
                </button>
              )}
            </div>

            {/* Notifications List */}
            {notificationsData.length === 0 ? (
              <div className="px-4 py-8 text-center bg-white dark:bg-slate-950">
                <Bell className="mx-auto mb-2 text-muted-foreground opacity-50" size={24} />
                <p className="text-sm text-muted-foreground">No notifications yet</p>
              </div>
            ) : (
              <ScrollArea className="h-96 bg-white dark:bg-slate-950">
                <div className="divide-y divide-gray-200 dark:divide-slate-800">
                  {notificationsData.map((notif: any) => (
                    <div
                      key={notif.id}
                      className={`px-4 py-3 hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors cursor-pointer ${
                        !notif.isRead ? "bg-blue-50 dark:bg-slate-800/40" : "bg-white dark:bg-slate-950"
                      }`}
                      onClick={() => {
                        // Mark as read
                        if (!notif.isRead) {
                          markAsRead.mutate({ notificationId: notif.id });
                        }
                        // Navigate to approval if it's an approval_needed notification
                        if (notif.type === "approval_needed" && notif.requestId) {
                          setIsOpen(false);
                          setLocation(`/approvals?requestId=${notif.requestId}`);
                        }
                      }}
                    >
                      <div className="flex gap-3">
                        {/* Icon */}
                        <div className="flex-shrink-0 mt-1">{getNotificationIcon(notif.type)}</div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <p className="text-sm font-medium text-foreground line-clamp-1">{notif.title}</p>
                            {!notif.isRead && <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 mt-1.5" />}
                          </div>
                          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{notif.message}</p>
                          <div className="flex items-center gap-2 mt-2">
                            <p className="text-xs text-muted-foreground">{formatDate(notif.createdAt)}</p>
                            {notif.triggeredByUser?.name && (
                              <p className="text-xs text-muted-foreground">• {notif.triggeredByUser.name}</p>
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
              <div className="px-4 py-3 border-t border-border bg-card text-center">
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
      {isOpen && <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />}
    </div>
  );
}
