"use client";

import { useState } from "react";
import {
  Bell,
  Check,
  CheckCheck,
  Trash2,
  Briefcase,
  UserPlus,
  Calendar,
  MessageSquare,
  Star,
  FileSignature,
  Filter,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  useNotifications,
  useMarkNotificationRead,
  useMarkAllNotificationsRead,
  useDeleteNotification,
  type Notification as AppNotification,
} from "@/lib/hooks/use-notifications";
import { toast } from "sonner";

function notificationIcon(type: string) {
  switch (type) {
    case "application":
      return <UserPlus className="h-4 w-4 text-blue-500" />;
    case "interview":
      return <Calendar className="h-4 w-4 text-emerald-500" />;
    case "message":
      return <MessageSquare className="h-4 w-4 text-violet-500" />;
    case "offer":
      return <FileSignature className="h-4 w-4 text-amber-500" />;
    case "scorecard":
      return <Star className="h-4 w-4 text-orange-500" />;
    case "job":
      return <Briefcase className="h-4 w-4 text-cyan-500" />;
    default:
      return <Bell className="h-4 w-4 text-muted-foreground" />;
  }
}

function timeAgo(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (seconds < 60) return "just now";
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
  return date.toLocaleDateString();
}

export default function NotificationsPage() {
  const [tab, setTab] = useState("all");
  const { data: notifications, isLoading } = useNotifications();
  const markRead = useMarkNotificationRead();
  const markAllRead = useMarkAllNotificationsRead();
  const deleteNotification = useDeleteNotification();

  const items = notifications?.data ?? [];
  const unreadItems = items.filter((n: { read_at: string | null }) => !n.read_at);
  const readItems = items.filter((n: { read_at: string | null }) => n.read_at);

  function handleMarkRead(id: string) {
    markRead.mutate(id, {
      onError: () => toast.error("Failed to mark as read"),
    });
  }

  function handleMarkAllRead() {
    markAllRead.mutate(undefined, {
      onSuccess: () => toast.success("All notifications marked as read"),
      onError: () => toast.error("Failed to mark all as read"),
    });
  }

  function handleDelete(id: string) {
    deleteNotification.mutate(id, {
      onError: () => toast.error("Failed to delete notification"),
    });
  }

  const displayItems = tab === "unread" ? unreadItems : tab === "read" ? readItems : items;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Notifications</h1>
          <p className="text-muted-foreground">
            Stay updated on applications, interviews, and team activity
          </p>
        </div>
        {unreadItems.length > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleMarkAllRead}
            disabled={markAllRead.isPending}
          >
            <CheckCheck className="mr-2 h-4 w-4" />
            Mark all read
          </Button>
        )}
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="all">
            All
            {items.length > 0 && (
              <Badge variant="secondary" className="ml-2 text-[10px] h-5">
                {items.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="unread">
            Unread
            {unreadItems.length > 0 && (
              <Badge variant="default" className="ml-2 text-[10px] h-5">
                {unreadItems.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="read">Read</TabsTrigger>
        </TabsList>

        <TabsContent value={tab} className="mt-4">
          {isLoading ? (
            <Card>
              <CardContent className="p-0">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="flex items-start gap-4 p-4 border-b last:border-0">
                    <Skeleton className="h-8 w-8 rounded-full" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-3/4" />
                      <Skeleton className="h-3 w-1/2" />
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          ) : displayItems.length === 0 ? (
            <Card>
              <CardContent className="py-12">
                <div className="flex flex-col items-center text-center">
                  <div className="rounded-full bg-muted p-4 mb-4">
                    <Bell className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <h3 className="text-lg font-semibold mb-1">
                    {tab === "unread" ? "All caught up!" : "No notifications"}
                  </h3>
                  <p className="text-sm text-muted-foreground max-w-sm">
                    {tab === "unread"
                      ? "You have no unread notifications."
                      : "Notifications will appear here as events occur."}
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="p-0">
                <ScrollArea className="max-h-[70vh]">
                  {displayItems.map((notification: AppNotification) => (
                    <div
                      key={notification.id}
                      className={`flex items-start gap-4 p-4 border-b last:border-0 transition-colors ${!notification.read_at ? "bg-primary/5" : ""
                        }`}
                    >
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted shrink-0">
                        {notificationIcon(notification.notification_type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm leading-tight ${!notification.read_at ? "font-semibold" : ""}`}>
                          {notification.title}
                        </p>
                        {notification.body && (
                          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                            {notification.body}
                          </p>
                        )}
                        <p className="text-[10px] text-muted-foreground mt-1">
                          {timeAgo(notification.created_at)}
                        </p>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        {!notification.read_at && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => handleMarkRead(notification.id)}
                          >
                            <Check className="h-3.5 w-3.5" />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-muted-foreground hover:text-destructive"
                          onClick={() => handleDelete(notification.id)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </ScrollArea>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
