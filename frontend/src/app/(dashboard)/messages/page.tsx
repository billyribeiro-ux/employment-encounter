"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MessageSquare, Send, Paperclip, Search } from "lucide-react";
import { useClients } from "@/lib/hooks/use-clients";
import { useMessages, useCreateMessage } from "@/lib/hooks/use-messages";
import { toast } from "sonner";

export default function MessagesPage() {
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [newMessage, setNewMessage] = useState("");
  const [clientSearch, setClientSearch] = useState("");

  const { data: clientsData, isLoading: clientsLoading } = useClients({
    per_page: 100,
    search: clientSearch || undefined,
  });
  const { data: messagesData, isLoading: messagesLoading } = useMessages(selectedClientId || "", {
    per_page: 50,
  });
  const createMessage = useCreateMessage();

  const handleSend = () => {
    if (!newMessage.trim() || !selectedClientId) return;
    createMessage.mutate(
      { client_id: selectedClientId, content: newMessage.trim() },
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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Messages</h1>
        <p className="text-muted-foreground">Secure messaging with clients</p>
      </div>

      <div className="grid grid-cols-12 gap-4 h-[calc(100vh-220px)]">
        {/* Client list sidebar */}
        <Card className="col-span-4 flex flex-col">
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
                <div className="p-4 text-center text-sm text-muted-foreground">No clients found</div>
              ) : (
                <div className="space-y-1 p-2">
                  {clientsData?.data.map((client) => (
                    <button
                      key={client.id}
                      onClick={() => setSelectedClientId(client.id)}
                      className={`w-full flex items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors hover:bg-accent ${
                        selectedClientId === client.id ? "bg-accent" : ""
                      }`}
                    >
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary text-sm font-medium">
                        {client.name.charAt(0)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium truncate">{client.name}</p>
                        <p className="text-xs text-muted-foreground truncate">{client.business_type}</p>
                      </div>
                      <Badge variant="outline" className="shrink-0 text-xs">
                        {client.status}
                      </Badge>
                    </button>
                  ))}
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Message thread */}
        <Card className="col-span-8 flex flex-col">
          {selectedClientId ? (
            <>
              <CardHeader className="border-b pb-3">
                <CardTitle className="text-base">
                  {clientsData?.data.find((c) => c.id === selectedClientId)?.name || "Client"}
                </CardTitle>
              </CardHeader>
              <CardContent className="flex-1 overflow-hidden p-0">
                <ScrollArea className="h-full p-4">
                  {messagesLoading ? (
                    <div className="space-y-3">
                      {Array.from({ length: 3 }).map((_, i) => (
                        <Skeleton key={i} className="h-16" />
                      ))}
                    </div>
                  ) : messagesData?.data.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-center py-12">
                      <MessageSquare className="h-8 w-8 text-muted-foreground mb-2" />
                      <p className="text-sm text-muted-foreground">No messages yet. Start the conversation!</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {[...(messagesData?.data || [])].reverse().map((msg) => (
                        <div key={msg.id} className="flex flex-col gap-1">
                          <div className={`max-w-[75%] rounded-lg px-3 py-2 ${
                            msg.is_internal
                              ? "bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 self-end ml-auto"
                              : "bg-muted self-start"
                          }`}>
                            <p className="text-sm">{msg.content}</p>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-[10px] text-muted-foreground">
                                {new Date(msg.created_at).toLocaleString()}
                              </span>
                              {msg.is_internal && (
                                <Badge variant="outline" className="text-[10px] h-4">Internal</Badge>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
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
                  <Button type="button" variant="ghost" size="icon" className="shrink-0">
                    <Paperclip className="h-4 w-4" />
                  </Button>
                  <Input
                    placeholder="Type a message..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    className="flex-1"
                  />
                  <Button type="submit" size="icon" disabled={!newMessage.trim() || createMessage.isPending}>
                    <Send className="h-4 w-4" />
                  </Button>
                </form>
              </div>
            </>
          ) : (
            <CardContent className="flex flex-col items-center justify-center h-full text-center">
              <MessageSquare className="h-12 w-12 text-muted-foreground mb-3" />
              <p className="text-lg font-medium">Select a client</p>
              <p className="text-sm text-muted-foreground">Choose a client from the list to start messaging</p>
            </CardContent>
          )}
        </Card>
      </div>
    </div>
  );
}
