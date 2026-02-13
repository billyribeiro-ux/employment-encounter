"use client";

import { useState, useEffect, useRef } from "react";
import {
  MessageSquare,
  Send,
  Search,
  Plus,
  Users,
  X,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  useConversations,
  useConversationMessages,
  useSendChatMessage,
  useCreateConversation,
  useMarkConversationRead,
} from "@/lib/hooks/use-conversations";
import { useAuthStore } from "@/stores/auth-store";
import { toast } from "sonner";

function formatTime(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    return date.toLocaleTimeString(undefined, {
      hour: "2-digit",
      minute: "2-digit",
    });
  }
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) {
    return date.toLocaleDateString(undefined, { weekday: "short" });
  }
  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}

function NewConversationDialog({
  children,
  onCreated,
}: {
  children: React.ReactNode;
  onCreated: (id: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [participantInput, setParticipantInput] = useState("");
  const [initialMessage, setInitialMessage] = useState("");
  const createConversation = useCreateConversation();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const participantIds = participantInput
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    if (participantIds.length === 0) {
      toast.error("Please add at least one participant");
      return;
    }
    createConversation.mutate(
      {
        title: title.trim() || undefined,
        participant_ids: participantIds,
        initial_message: initialMessage.trim() || undefined,
      },
      {
        onSuccess: (data) => {
          toast.success("Conversation created");
          setOpen(false);
          setTitle("");
          setParticipantInput("");
          setInitialMessage("");
          onCreated(data.id);
        },
        onError: () => toast.error("Failed to create conversation"),
      }
    );
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent>
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>New Conversation</DialogTitle>
            <DialogDescription>
              Start a new private conversation with one or more participants.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="conv-title">
                Title <span className="text-muted-foreground">(optional)</span>
              </Label>
              <Input
                id="conv-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Project Discussion"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="participants">Participant IDs</Label>
              <Input
                id="participants"
                value={participantInput}
                onChange={(e) => setParticipantInput(e.target.value)}
                placeholder="Enter user IDs separated by commas"
                required
              />
              <p className="text-xs text-muted-foreground">
                Comma-separated list of user IDs to include
              </p>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="initial-msg">
                Initial Message{" "}
                <span className="text-muted-foreground">(optional)</span>
              </Label>
              <Input
                id="initial-msg"
                value={initialMessage}
                onChange={(e) => setInitialMessage(e.target.value)}
                placeholder="Say hello..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={createConversation.isPending}>
              {createConversation.isPending ? "Creating..." : "Create"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default function ConversationsPage() {
  const { user } = useAuthStore();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [newMessage, setNewMessage] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const { data: conversationsData, isLoading: convsLoading } = useConversations(
    {
      per_page: 100,
      search: searchQuery || undefined,
    }
  );

  const { data: messagesData, isLoading: msgsLoading } =
    useConversationMessages(selectedId || "", { per_page: 100 });

  const sendMessage = useSendChatMessage(selectedId || "");
  const markRead = useMarkConversationRead(selectedId || "");

  const conversations = conversationsData?.data ?? [];
  const messages = messagesData?.data ?? [];
  const sortedMessages = [...messages].reverse();
  const selectedConv = conversations.find((c) => c.id === selectedId);

  // Mark conversation as read when selected
  useEffect(() => {
    if (selectedId) {
      markRead.mutate();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedId]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messagesData]);

  // Focus input
  useEffect(() => {
    if (selectedId) {
      inputRef.current?.focus();
    }
  }, [selectedId]);

  function handleSend() {
    if (!newMessage.trim() || !selectedId) return;
    sendMessage.mutate(
      { content: newMessage.trim() },
      {
        onSuccess: () => setNewMessage(""),
        onError: () => toast.error("Failed to send message"),
      }
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Conversations</h1>
          <p className="text-muted-foreground">
            Private messaging with your team and candidates
          </p>
        </div>
        <NewConversationDialog onCreated={(id) => setSelectedId(id)}>
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            New Conversation
          </Button>
        </NewConversationDialog>
      </div>

      <div className="grid grid-cols-12 gap-4 h-[calc(100vh-220px)]">
        {/* Conversation list sidebar */}
        <Card className="col-span-12 md:col-span-4 flex flex-col">
          <CardHeader className="pb-3">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search conversations..."
                className="pl-8"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </CardHeader>
          <CardContent className="flex-1 overflow-hidden p-0">
            <ScrollArea className="h-full">
              {convsLoading ? (
                <div className="space-y-2 p-4">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <Skeleton key={i} className="h-16" />
                  ))}
                </div>
              ) : conversations.length === 0 ? (
                <div className="p-4 text-center text-sm text-muted-foreground">
                  <MessageSquare className="h-8 w-8 mx-auto mb-2 text-muted-foreground/50" />
                  <p>No conversations yet</p>
                </div>
              ) : (
                <div className="space-y-1 p-2">
                  {conversations.map((conv) => (
                    <button
                      key={conv.id}
                      onClick={() => setSelectedId(conv.id)}
                      className={`w-full flex items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors hover:bg-accent ${
                        selectedId === conv.id
                          ? "bg-accent ring-1 ring-primary/20"
                          : ""
                      }`}
                    >
                      <div className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary text-sm font-semibold">
                        {(conv.title || "C").charAt(0).toUpperCase()}
                        {conv.unread_count > 0 && (
                          <span className="absolute -top-0.5 -right-0.5 h-3 w-3 rounded-full bg-destructive ring-2 ring-background" />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-sm font-medium truncate">
                            {conv.title || `Conversation`}
                          </p>
                          {conv.last_message_at && (
                            <span className="text-[10px] text-muted-foreground shrink-0">
                              {formatTime(conv.last_message_at)}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-xs text-muted-foreground truncate">
                            {conv.last_message_preview || "No messages yet"}
                          </p>
                          {conv.unread_count > 0 && (
                            <Badge
                              variant="destructive"
                              className="h-5 min-w-5 px-1 text-[10px] font-bold shrink-0"
                            >
                              {conv.unread_count > 99
                                ? "99+"
                                : conv.unread_count}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Message thread */}
        <Card className="col-span-12 md:col-span-8 flex flex-col">
          {selectedId ? (
            <>
              <CardHeader className="border-b pb-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary text-sm font-semibold">
                    {(selectedConv?.title || "C").charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <CardTitle className="text-base">
                      {selectedConv?.title || "Conversation"}
                    </CardTitle>
                    <p className="text-xs text-muted-foreground">
                      {selectedConv?.participant_count || 0} participant
                      {(selectedConv?.participant_count || 0) !== 1
                        ? "s"
                        : ""}
                    </p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="flex-1 overflow-hidden p-0">
                <ScrollArea className="h-full p-4">
                  {msgsLoading ? (
                    <div className="space-y-3">
                      {Array.from({ length: 4 }).map((_, i) => (
                        <div
                          key={i}
                          className={`flex ${
                            i % 2 === 0 ? "justify-start" : "justify-end"
                          }`}
                        >
                          <Skeleton className="h-16 w-[60%] rounded-lg" />
                        </div>
                      ))}
                    </div>
                  ) : sortedMessages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-center py-12">
                      <div className="rounded-full bg-muted p-4 mb-3">
                        <MessageSquare className="h-8 w-8 text-muted-foreground" />
                      </div>
                      <h3 className="text-base font-semibold mb-1">
                        No messages yet
                      </h3>
                      <p className="text-sm text-muted-foreground max-w-xs">
                        Start the conversation by sending a message below.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-1">
                      {sortedMessages.map((msg, idx) => {
                        const isOwn = msg.sender_id === user?.id;
                        const prevMsg =
                          idx > 0 ? sortedMessages[idx - 1] : null;
                        const showSender =
                          !isOwn &&
                          (!prevMsg || prevMsg.sender_id !== msg.sender_id);
                        const showDate =
                          !prevMsg ||
                          new Date(msg.created_at).toDateString() !==
                            new Date(prevMsg.created_at).toDateString();

                        return (
                          <div key={msg.id}>
                            {showDate && (
                              <div className="flex items-center justify-center my-3">
                                <div className="text-[10px] font-medium text-muted-foreground bg-muted px-3 py-0.5 rounded-full">
                                  {new Date(
                                    msg.created_at
                                  ).toLocaleDateString(undefined, {
                                    weekday: "short",
                                    month: "short",
                                    day: "numeric",
                                  })}
                                </div>
                              </div>
                            )}
                            <div
                              className={`group flex gap-2 ${
                                isOwn ? "flex-row-reverse" : "flex-row"
                              }`}
                            >
                              {!isOwn && (
                                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-medium mt-auto">
                                  {(msg.sender_name || "?")
                                    .charAt(0)
                                    .toUpperCase()}
                                </div>
                              )}
                              <div
                                className={`max-w-[70%] ${
                                  isOwn ? "items-end" : "items-start"
                                } flex flex-col`}
                              >
                                {showSender && msg.sender_name && (
                                  <span className="text-[10px] font-medium text-muted-foreground ml-1 mb-0.5">
                                    {msg.sender_name}
                                  </span>
                                )}
                                <div
                                  className={`relative rounded-2xl px-3.5 py-2 text-sm leading-relaxed ${
                                    isOwn
                                      ? "bg-primary text-primary-foreground"
                                      : "bg-muted"
                                  }`}
                                >
                                  <p className="whitespace-pre-wrap break-words">
                                    {msg.content}
                                  </p>
                                  <div
                                    className={`flex items-center gap-1.5 mt-1 ${
                                      isOwn
                                        ? "justify-end"
                                        : "justify-start"
                                    }`}
                                  >
                                    <span
                                      className={`text-[10px] ${
                                        isOwn
                                          ? "text-primary-foreground/60"
                                          : "text-muted-foreground"
                                      }`}
                                    >
                                      {new Date(
                                        msg.created_at
                                      ).toLocaleTimeString(undefined, {
                                        hour: "2-digit",
                                        minute: "2-digit",
                                      })}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                      <div ref={messagesEndRef} />
                    </div>
                  )}
                </ScrollArea>
              </CardContent>
              <div className="border-t p-3">
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleSend();
                  }}
                  className="flex items-center gap-2"
                >
                  <Input
                    ref={inputRef}
                    placeholder="Type a message..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                        e.preventDefault();
                        handleSend();
                      }
                    }}
                    className="flex-1"
                  />
                  <Button
                    type="submit"
                    size="icon"
                    className="shrink-0 h-9 w-9"
                    disabled={!newMessage.trim() || sendMessage.isPending}
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </form>
              </div>
            </>
          ) : (
            <CardContent className="flex flex-col items-center justify-center h-full text-center">
              <div className="rounded-full bg-muted p-6 mb-4">
                <MessageSquare className="h-12 w-12 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold mb-1">
                Select a conversation
              </h3>
              <p className="text-sm text-muted-foreground max-w-xs">
                Choose a conversation from the list or start a new one to begin
                messaging.
              </p>
            </CardContent>
          )}
        </Card>
      </div>
    </div>
  );
}
