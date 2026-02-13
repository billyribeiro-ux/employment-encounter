"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  MessageSquare,
  Send,
  Paperclip,
  Search,
  Check,
  CheckCheck,
  Lock,
  Trash2,
  Download,
  X,
} from "lucide-react";
import { useClients } from "@/lib/hooks/use-clients";
import {
  useMessages,
  useCreateMessage,
  useDeleteMessage,
  useMarkConversationRead,
  useUnreadCounts,
} from "@/lib/hooks/use-messages";
import { useAuthStore } from "@/stores/auth-store";
import { useCreateDocument, type CreateDocumentPayload } from "@/lib/hooks/use-documents";
import { toast } from "sonner";
import { exportToCSV } from "@/lib/utils";
import { ConfirmDialog } from "@/components/dashboard/confirm-dialog";

const WS_URL = process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:8080";

export default function MessagesPage() {
  const { user } = useAuthStore();
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [newMessage, setNewMessage] = useState("");
  const [clientSearch, setClientSearch] = useState("");
  const [messageSearch, setMessageSearch] = useState("");
  const [showMessageSearch, setShowMessageSearch] = useState(false);
  const [isInternal, setIsInternal] = useState(false);
  const [typingUsers, setTypingUsers] = useState<Record<string, string>>({});
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastTypingSentRef = useRef(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const wsRef = useRef<WebSocket | null>(null);

  const { data: clientsData, isLoading: clientsLoading } = useClients({
    per_page: 100,
    search: clientSearch || undefined,
  });
  const { data: messagesData, isLoading: messagesLoading } = useMessages(
    selectedClientId || "",
    {
      per_page: 100,
      search: messageSearch || undefined,
    }
  );
  const createMessage = useCreateMessage();
  const deleteMessage = useDeleteMessage();
  const markConversationRead = useMarkConversationRead();
  const { data: unreadCounts } = useUnreadCounts();
  const createDocument = useCreateDocument();

  // Connect to WebSocket for real-time typing indicators
  useEffect(() => {
    const token = localStorage.getItem("access_token");
    if (!token) return;

    const ws = new WebSocket(`${WS_URL}/api/v1/ws?token=${token}`);
    wsRef.current = ws;

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === "typing" && data.data) {
          const { client_id, user_id, user_name } = data.data;
          if (user_id !== user?.id) {
            setTypingUsers((prev) => ({ ...prev, [`${client_id}:${user_id}`]: user_name }));
            setTimeout(() => {
              setTypingUsers((prev) => {
                const next = { ...prev };
                delete next[`${client_id}:${user_id}`];
                return next;
              });
            }, 4000);
          }
        }
        if (data.type === "stop_typing" && data.data) {
          const { client_id, user_id } = data.data;
          setTypingUsers((prev) => {
            const next = { ...prev };
            delete next[`${client_id}:${user_id}`];
            return next;
          });
        }
      } catch {
        // ignore
      }
    };

    return () => {
      ws.close();
      wsRef.current = null;
    };
  }, [user?.id]);

  // Mark conversation read when selecting a client
  useEffect(() => {
    if (selectedClientId) {
      markConversationRead.mutate(selectedClientId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedClientId]);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messagesData]);

  // Focus input when client selected
  useEffect(() => {
    if (selectedClientId) {
      inputRef.current?.focus();
    }
  }, [selectedClientId]);

  const sendTypingIndicator = useCallback(() => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN || !selectedClientId || !user) return;
    const now = Date.now();
    if (now - lastTypingSentRef.current < 2000) return;
    lastTypingSentRef.current = now;

    wsRef.current.send(
      JSON.stringify({
        type: "typing",
        data: {
          client_id: selectedClientId,
          user_id: user.id,
          user_name: `${user.first_name} ${user.last_name}`,
        },
      })
    );

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      if (wsRef.current?.readyState === WebSocket.OPEN && selectedClientId) {
        wsRef.current.send(
          JSON.stringify({
            type: "stop_typing",
            data: { client_id: selectedClientId, user_id: user.id },
          })
        );
      }
    }, 3000);
  }, [selectedClientId, user]);

  const handleSend = () => {
    if (!newMessage.trim() || !selectedClientId) return;

    // Stop typing indicator
    if (wsRef.current?.readyState === WebSocket.OPEN && user) {
      wsRef.current.send(
        JSON.stringify({
          type: "stop_typing",
          data: { client_id: selectedClientId, user_id: user.id },
        })
      );
    }

    createMessage.mutate(
      {
        client_id: selectedClientId,
        content: newMessage.trim(),
        is_internal: isInternal,
      },
      {
        onSuccess: () => {
          setNewMessage("");
        },
        onError: () => {
          toast.error("Failed to send message");
        },
      }
    );
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedClientId) return;

    try {
      const payload: CreateDocumentPayload = {
        filename: file.name,
        mime_type: file.type || "application/octet-stream",
        size_bytes: file.size,
        client_id: selectedClientId,
        category: "attachment",
      };
      const result = await createDocument.mutateAsync(payload);

      // Send a message referencing the attachment
      createMessage.mutate(
        {
          client_id: selectedClientId,
          content: `Attached file: ${file.name}`,
          attachment_ids: [result.document.id],
          is_internal: isInternal,
        },
        {
          onSuccess: () => {
            toast.success(`File "${file.name}" attached`);
          },
          onError: () => {
            toast.error("Failed to attach file");
          },
        }
      );
    } catch {
      toast.error("Failed to upload file");
    }
    // Reset file input
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  async function handleDelete(id: string) {
    try {
      await deleteMessage.mutateAsync(id);
      toast.success("Message deleted");
    } catch {
      toast.error("Failed to delete message");
    }
  }

  const messages = messagesData?.data ?? [];
  const sortedMessages = [...messages].reverse();
  const selectedClient = clientsData?.data.find((c) => c.id === selectedClientId);

  // Typing users for the current conversation
  const currentTypingUsers = selectedClientId
    ? Object.entries(typingUsers)
        .filter(([key]) => key.startsWith(selectedClientId))
        .map(([, name]) => name)
    : [];

  const totalUnread = unreadCounts
    ? Object.values(unreadCounts).reduce((sum, c) => sum + c, 0)
    : 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Messages
            {totalUnread > 0 && (
              <Badge variant="destructive" className="ml-2 text-xs">
                {totalUnread}
              </Badge>
            )}
          </h1>
          <p className="text-muted-foreground">Secure messaging with clients</p>
        </div>
        {selectedClientId && messages.length > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              exportToCSV(
                sortedMessages.map((m) => ({
                  date: m.created_at,
                  sender: m.sender_name || m.sender_id,
                  content: m.content,
                  internal: m.is_internal,
                  read: m.is_read,
                })),
                `messages-${selectedClient?.name || "export"}`
              )
            }
          >
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
        )}
      </div>

      <div className="grid grid-cols-12 gap-4 h-[calc(100vh-220px)]">
        {/* Client list sidebar */}
        <Card className="col-span-12 md:col-span-4 flex flex-col">
          <CardHeader className="pb-3">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search clients..."
                className="pl-8"
                value={clientSearch}
                onChange={(e) => setClientSearch(e.target.value)}
              />
            </div>
          </CardHeader>
          <CardContent className="flex-1 overflow-hidden p-0">
            <ScrollArea className="h-full">
              {clientsLoading ? (
                <div className="space-y-2 p-4">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Skeleton key={i} className="h-14" />
                  ))}
                </div>
              ) : clientsData?.data.length === 0 ? (
                <div className="p-4 text-center text-sm text-muted-foreground">
                  No clients found
                </div>
              ) : (
                <div className="space-y-1 p-2">
                  {clientsData?.data.map((client) => {
                    const unread = unreadCounts?.[client.id] || 0;
                    return (
                      <button
                        key={client.id}
                        onClick={() => setSelectedClientId(client.id)}
                        className={`w-full flex items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors hover:bg-accent ${
                          selectedClientId === client.id
                            ? "bg-accent ring-1 ring-primary/20"
                            : ""
                        }`}
                      >
                        <div className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary text-sm font-semibold">
                          {client.name.charAt(0).toUpperCase()}
                          {/* Online indicator dot */}
                          <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-emerald-500 ring-2 ring-background" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5">
                            <p className="text-sm font-medium truncate">{client.name}</p>
                            {unread > 0 && (
                              <Badge variant="destructive" className="h-5 min-w-5 px-1 text-[10px] font-bold">
                                {unread > 99 ? "99+" : unread}
                              </Badge>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground truncate">
                            {client.business_type}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Message thread */}
        <Card className="col-span-12 md:col-span-8 flex flex-col">
          {selectedClientId ? (
            <>
              <CardHeader className="border-b pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary text-sm font-semibold">
                      {selectedClient?.name.charAt(0).toUpperCase() || "?"}
                      <span className="absolute bottom-0 right-0 h-2 w-2 rounded-full bg-emerald-500 ring-2 ring-background" />
                    </div>
                    <div>
                      <CardTitle className="text-base">
                        {selectedClient?.name || "Client"}
                      </CardTitle>
                      {currentTypingUsers.length > 0 && (
                        <p className="text-xs text-muted-foreground animate-pulse">
                          {currentTypingUsers.join(", ")}{" "}
                          {currentTypingUsers.length === 1 ? "is" : "are"} typing...
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant={showMessageSearch ? "secondary" : "ghost"}
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => {
                              setShowMessageSearch(!showMessageSearch);
                              if (showMessageSearch) setMessageSearch("");
                            }}
                          >
                            <Search className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Search messages</TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                </div>
                {showMessageSearch && (
                  <div className="relative mt-2">
                    <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
                    <Input
                      placeholder="Search in conversation..."
                      className="pl-8 h-8 text-xs"
                      value={messageSearch}
                      onChange={(e) => setMessageSearch(e.target.value)}
                      autoFocus
                    />
                    {messageSearch && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="absolute right-0.5 top-0.5 h-7 w-7"
                        onClick={() => setMessageSearch("")}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                )}
              </CardHeader>
              <CardContent className="flex-1 overflow-hidden p-0">
                <ScrollArea className="h-full p-4">
                  {messagesLoading ? (
                    <div className="space-y-3">
                      {Array.from({ length: 4 }).map((_, i) => (
                        <div key={i} className={`flex ${i % 2 === 0 ? "justify-start" : "justify-end"}`}>
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
                        {messageSearch ? "No messages match your search" : "No messages yet"}
                      </h3>
                      <p className="text-sm text-muted-foreground max-w-xs">
                        {messageSearch
                          ? `No results for "${messageSearch}". Try different keywords.`
                          : "Start the conversation by sending a message below."}
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-1">
                      {sortedMessages.map((msg, idx) => {
                        const isOwn = msg.sender_id === user?.id;
                        const prevMsg = idx > 0 ? sortedMessages[idx - 1] : null;
                        const showSender =
                          !isOwn && (!prevMsg || prevMsg.sender_id !== msg.sender_id);
                        const showDate =
                          !prevMsg ||
                          new Date(msg.created_at).toDateString() !==
                            new Date(prevMsg.created_at).toDateString();

                        return (
                          <div key={msg.id}>
                            {showDate && (
                              <div className="flex items-center justify-center my-3">
                                <div className="text-[10px] font-medium text-muted-foreground bg-muted px-3 py-0.5 rounded-full">
                                  {new Date(msg.created_at).toLocaleDateString(undefined, {
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
                                  {(msg.sender_name || "?").charAt(0).toUpperCase()}
                                </div>
                              )}
                              <div className={`max-w-[70%] ${isOwn ? "items-end" : "items-start"} flex flex-col`}>
                                {showSender && msg.sender_name && (
                                  <span className="text-[10px] font-medium text-muted-foreground ml-1 mb-0.5">
                                    {msg.sender_name}
                                  </span>
                                )}
                                <div
                                  className={`relative rounded-2xl px-3.5 py-2 text-sm leading-relaxed ${
                                    msg.is_internal
                                      ? "bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800"
                                      : isOwn
                                      ? "bg-primary text-primary-foreground"
                                      : "bg-muted"
                                  }`}
                                >
                                  {msg.is_internal && (
                                    <div className="flex items-center gap-1 mb-1">
                                      <Lock className="h-2.5 w-2.5 text-amber-600 dark:text-amber-400" />
                                      <span className="text-[10px] font-medium text-amber-600 dark:text-amber-400">
                                        Internal Note
                                      </span>
                                    </div>
                                  )}
                                  <p className="whitespace-pre-wrap break-words">{msg.content}</p>
                                  <div
                                    className={`flex items-center gap-1.5 mt-1 ${
                                      isOwn ? "justify-end" : "justify-start"
                                    }`}
                                  >
                                    <span
                                      className={`text-[10px] ${
                                        isOwn && !msg.is_internal
                                          ? "text-primary-foreground/60"
                                          : "text-muted-foreground"
                                      }`}
                                    >
                                      {new Date(msg.created_at).toLocaleTimeString(undefined, {
                                        hour: "2-digit",
                                        minute: "2-digit",
                                      })}
                                    </span>
                                    {isOwn && (
                                      <span
                                        className={`${
                                          msg.is_internal
                                            ? "text-amber-600 dark:text-amber-400"
                                            : "text-primary-foreground/60"
                                        }`}
                                      >
                                        {msg.is_read ? (
                                          <CheckCheck className="h-3 w-3" />
                                        ) : (
                                          <Check className="h-3 w-3" />
                                        )}
                                      </span>
                                    )}
                                  </div>
                                </div>
                                {/* Delete action (own messages only) */}
                                {isOwn && (
                                  <div className="opacity-0 group-hover:opacity-100 transition-opacity mt-0.5 flex justify-end">
                                    <ConfirmDialog
                                      title="Delete message?"
                                      description="This will permanently remove this message."
                                      actionLabel="Delete"
                                      onConfirm={() => handleDelete(msg.id)}
                                    >
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-6 w-6 text-muted-foreground hover:text-destructive"
                                      >
                                        <Trash2 className="h-3 w-3" />
                                      </Button>
                                    </ConfirmDialog>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                      {/* Typing indicator */}
                      {currentTypingUsers.length > 0 && (
                        <div className="flex gap-2 items-end">
                          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-medium">
                            {currentTypingUsers[0].charAt(0).toUpperCase()}
                          </div>
                          <div className="bg-muted rounded-2xl px-4 py-2.5">
                            <div className="flex gap-1">
                              <span className="h-2 w-2 rounded-full bg-muted-foreground/40 animate-bounce [animation-delay:0ms]" />
                              <span className="h-2 w-2 rounded-full bg-muted-foreground/40 animate-bounce [animation-delay:150ms]" />
                              <span className="h-2 w-2 rounded-full bg-muted-foreground/40 animate-bounce [animation-delay:300ms]" />
                            </div>
                          </div>
                        </div>
                      )}
                      <div ref={messagesEndRef} />
                    </div>
                  )}
                </ScrollArea>
              </CardContent>
              <div className="border-t p-3 space-y-2">
                {/* Internal note toggle */}
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant={isInternal ? "default" : "outline"}
                    size="sm"
                    className={`h-7 text-xs gap-1 ${
                      isInternal
                        ? "bg-amber-500 hover:bg-amber-600 text-white"
                        : ""
                    }`}
                    onClick={() => setIsInternal(!isInternal)}
                  >
                    <Lock className="h-3 w-3" />
                    {isInternal ? "Internal Note" : "Client Message"}
                  </Button>
                  {isInternal && (
                    <span className="text-[10px] text-amber-600 dark:text-amber-400">
                      Only visible to your team
                    </span>
                  )}
                </div>
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleSend();
                  }}
                  className="flex items-center gap-2"
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    className="hidden"
                    onChange={handleFileSelect}
                    accept=".pdf,.doc,.docx,.xls,.xlsx,.csv,.png,.jpg,.jpeg,.gif,.txt,.zip"
                  />
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="shrink-0 h-9 w-9"
                          onClick={() => fileInputRef.current?.click()}
                          disabled={createDocument.isPending}
                        >
                          <Paperclip className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Attach file</TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                  <Input
                    ref={inputRef}
                    placeholder={
                      isInternal
                        ? "Type an internal note..."
                        : "Type a message..."
                    }
                    value={newMessage}
                    onChange={(e) => {
                      setNewMessage(e.target.value);
                      sendTypingIndicator();
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                        e.preventDefault();
                        handleSend();
                      }
                    }}
                    className={`flex-1 ${
                      isInternal
                        ? "border-amber-300 dark:border-amber-700 focus-visible:ring-amber-400"
                        : ""
                    }`}
                  />
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          type="submit"
                          size="icon"
                          className="shrink-0 h-9 w-9"
                          disabled={
                            !newMessage.trim() || createMessage.isPending
                          }
                        >
                          <Send className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Send message (Cmd+Enter)</TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </form>
              </div>
            </>
          ) : (
            <CardContent className="flex flex-col items-center justify-center h-full text-center">
              <div className="rounded-full bg-muted p-6 mb-4">
                <MessageSquare className="h-12 w-12 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold mb-1">Select a conversation</h3>
              <p className="text-sm text-muted-foreground max-w-xs">
                Choose a client from the list to view and send messages.
                All conversations are encrypted and secure.
              </p>
            </CardContent>
          )}
        </Card>
      </div>
    </div>
  );
}
