"use client";

import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import {
  MessageSquare,
  Send,
  Search,
  CheckCheck,
  Check,
  Clock,
  Building2,
  ArrowLeft,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { useAuthStore } from "@/stores/auth-store";
import {
  useConversations,
  useConversationMessages,
  useSendChatMessage,
  useMarkConversationRead,
  type Conversation,
} from "@/lib/hooks/use-conversations";
import { cn } from "@/lib/utils";

function timeAgo(dateStr: string | null): string {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m`;
  if (diffHours < 24) return `${diffHours}h`;
  if (diffDays < 7) return `${diffDays}d`;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function formatMessageTime(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const isToday = date.toDateString() === now.toDateString();
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  const isYesterday = date.toDateString() === yesterday.toDateString();

  if (isToday) {
    return date.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  }
  if (isYesterday) {
    return `Yesterday ${date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true })}`;
  }
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

function ConversationListSkeleton() {
  return (
    <div className="space-y-1 p-2">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 rounded-lg p-3">
          <Skeleton className="h-10 w-10 shrink-0 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-3 w-48" />
          </div>
        </div>
      ))}
    </div>
  );
}

function MessageThreadSkeleton() {
  return (
    <div className="space-y-4 p-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <div
          key={i}
          className={cn("flex gap-3", i % 2 === 0 ? "justify-start" : "justify-end")}
        >
          {i % 2 === 0 && <Skeleton className="h-8 w-8 shrink-0 rounded-full" />}
          <div className="space-y-1">
            <Skeleton className={cn("h-16 rounded-2xl", i % 2 === 0 ? "w-64" : "w-48")} />
            <Skeleton className="h-3 w-16" />
          </div>
        </div>
      ))}
    </div>
  );
}

function ConversationItem({
  conversation,
  isActive,
  onClick,
}: {
  conversation: Conversation;
  isActive: boolean;
  onClick: () => void;
}) {
  const initials = (conversation.title || "C")
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <button
      onClick={onClick}
      className={cn(
        "flex w-full items-center gap-3 rounded-lg p-3 text-left transition-colors",
        isActive
          ? "bg-primary/10 text-primary"
          : "hover:bg-muted/50"
      )}
    >
      <Avatar className="h-10 w-10 shrink-0">
        <AvatarFallback className="text-xs">{initials}</AvatarFallback>
      </Avatar>
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <p className="truncate text-sm font-medium">
            {conversation.title || "Conversation"}
          </p>
          <span className="shrink-0 text-[10px] text-muted-foreground">
            {timeAgo(conversation.last_message_at)}
          </span>
        </div>
        <div className="flex items-center justify-between gap-2">
          <p className="truncate text-xs text-muted-foreground">
            {conversation.last_message_preview || "No messages yet"}
          </p>
          {conversation.unread_count > 0 && (
            <Badge className="h-5 min-w-[20px] shrink-0 rounded-full px-1.5 text-[10px]">
              {conversation.unread_count > 99 ? "99+" : conversation.unread_count}
            </Badge>
          )}
        </div>
      </div>
    </button>
  );
}

export default function CandidateMessagesPage() {
  const { user } = useAuthStore();
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
  const [messageInput, setMessageInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [showMobileThread, setShowMobileThread] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { data: conversationsData, isLoading: conversationsLoading } = useConversations({
    per_page: 50,
    sort: "last_message_at",
    order: "desc",
    search: searchQuery || undefined,
  });

  const conversations = conversationsData?.data ?? [];

  const {
    data: messagesData,
    isLoading: messagesLoading,
  } = useConversationMessages(selectedConversationId || "", {
    per_page: 100,
  });

  const messages = messagesData?.data ?? [];

  const sendMessage = useSendChatMessage(selectedConversationId || "");
  const markRead = useMarkConversationRead(selectedConversationId || "");

  const selectedConversation = conversations.find(
    (c) => c.id === selectedConversationId
  );

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  // Mark conversation as read when selected
  useEffect(() => {
    if (selectedConversationId && selectedConversation?.unread_count) {
      markRead.mutate();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedConversationId]);

  function handleSendMessage(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = messageInput.trim();
    if (!trimmed || !selectedConversationId) return;

    sendMessage.mutate(
      { content: trimmed },
      {
        onSuccess: () => {
          setMessageInput("");
        },
      }
    );
  }

  function handleSelectConversation(id: string) {
    setSelectedConversationId(id);
    setShowMobileThread(true);
  }

  function handleBackToList() {
    setShowMobileThread(false);
  }

  return (
    <div className="flex h-[calc(100vh-7.5rem)] flex-col">
      <div className="mb-4">
        <h1 className="text-2xl font-bold tracking-tight">Messages</h1>
        <p className="text-sm text-muted-foreground">
          Communicate with employers about your applications
        </p>
      </div>

      <Card className="flex flex-1 overflow-hidden">
        {/* Conversation List - hidden on mobile when thread is shown */}
        <div
          className={cn(
            "flex w-full flex-col border-r md:w-80 lg:w-96",
            showMobileThread ? "hidden md:flex" : "flex"
          )}
        >
          {/* Search */}
          <div className="border-b p-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search conversations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>

          {/* Conversation List */}
          <ScrollArea className="flex-1">
            {conversationsLoading ? (
              <ConversationListSkeleton />
            ) : conversations.length === 0 ? (
              <div className="flex flex-col items-center justify-center px-4 py-16 text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                  <MessageSquare className="h-6 w-6 text-muted-foreground" />
                </div>
                <p className="mt-3 text-sm font-medium">No conversations yet</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  When employers reach out about your applications, conversations will appear here.
                </p>
              </div>
            ) : (
              <div className="space-y-0.5 p-2">
                {conversations.map((conversation) => (
                  <ConversationItem
                    key={conversation.id}
                    conversation={conversation}
                    isActive={conversation.id === selectedConversationId}
                    onClick={() => handleSelectConversation(conversation.id)}
                  />
                ))}
              </div>
            )}
          </ScrollArea>
        </div>

        {/* Message Thread */}
        <div
          className={cn(
            "flex flex-1 flex-col",
            showMobileThread ? "flex" : "hidden md:flex"
          )}
        >
          {selectedConversationId && selectedConversation ? (
            <>
              {/* Thread Header */}
              <div className="flex items-center gap-3 border-b px-4 py-3">
                <Button
                  variant="ghost"
                  size="icon"
                  className="shrink-0 md:hidden"
                  onClick={handleBackToList}
                >
                  <ArrowLeft className="h-4 w-4" />
                </Button>
                <Avatar className="h-9 w-9 shrink-0">
                  <AvatarFallback className="text-xs">
                    {(selectedConversation.title || "C")
                      .split(" ")
                      .map((w) => w[0])
                      .join("")
                      .slice(0, 2)
                      .toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">
                    {selectedConversation.title || "Conversation"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {selectedConversation.participant_count} participant
                    {selectedConversation.participant_count !== 1 ? "s" : ""}
                  </p>
                </div>
              </div>

              {/* Messages */}
              <ScrollArea className="flex-1 p-4">
                {messagesLoading ? (
                  <MessageThreadSkeleton />
                ) : messages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16 text-center">
                    <MessageSquare className="mb-3 h-8 w-8 text-muted-foreground" />
                    <p className="text-sm font-medium">No messages yet</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Send a message to start the conversation
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {messages.map((message) => {
                      const isOwn = message.sender_id === user?.id;
                      const senderInitials = (message.sender_name || "U")
                        .split(" ")
                        .map((w) => w[0])
                        .join("")
                        .slice(0, 2)
                        .toUpperCase();

                      return (
                        <motion.div
                          key={message.id}
                          initial={{ opacity: 0, y: 4 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.15 }}
                          className={cn(
                            "flex gap-2.5",
                            isOwn ? "justify-end" : "justify-start"
                          )}
                        >
                          {!isOwn && (
                            <Avatar className="h-8 w-8 shrink-0">
                              <AvatarFallback className="text-[10px]">
                                {senderInitials}
                              </AvatarFallback>
                            </Avatar>
                          )}
                          <div
                            className={cn(
                              "max-w-[70%] space-y-1",
                              isOwn ? "items-end" : "items-start"
                            )}
                          >
                            {!isOwn && message.sender_name && (
                              <p className="text-[10px] font-medium text-muted-foreground">
                                {message.sender_name}
                              </p>
                            )}
                            <div
                              className={cn(
                                "rounded-2xl px-4 py-2.5 text-sm leading-relaxed",
                                isOwn
                                  ? "bg-primary text-primary-foreground rounded-br-md"
                                  : "bg-muted rounded-bl-md"
                              )}
                            >
                              {message.content}
                            </div>
                            <div
                              className={cn(
                                "flex items-center gap-1",
                                isOwn ? "justify-end" : "justify-start"
                              )}
                            >
                              <span className="text-[10px] text-muted-foreground">
                                {formatMessageTime(message.created_at)}
                              </span>
                              {isOwn && (
                                <CheckCheck className="h-3 w-3 text-muted-foreground" />
                              )}
                            </div>
                          </div>
                        </motion.div>
                      );
                    })}
                    <div ref={messagesEndRef} />
                  </div>
                )}
              </ScrollArea>

              {/* Message Input */}
              <div className="border-t p-3">
                <form onSubmit={handleSendMessage} className="flex items-center gap-2">
                  <Input
                    placeholder="Type a message..."
                    value={messageInput}
                    onChange={(e) => setMessageInput(e.target.value)}
                    className="flex-1"
                    disabled={sendMessage.isPending}
                  />
                  <Button
                    type="submit"
                    size="icon"
                    disabled={!messageInput.trim() || sendMessage.isPending}
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </form>
              </div>
            </>
          ) : (
            /* No conversation selected */
            <div className="flex flex-1 flex-col items-center justify-center p-8 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
                <MessageSquare className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="mt-4 text-lg font-medium">Your Messages</h3>
              <p className="mt-2 max-w-sm text-sm text-muted-foreground">
                Select a conversation from the list to view messages. Employers may reach
                out to you about your applications here.
              </p>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
