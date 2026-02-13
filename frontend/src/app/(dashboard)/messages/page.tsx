"use client";

import { useState } from "react";
import { motion } from "framer-motion";
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

const stagger = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.06 } },
};

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] as const } },
};

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
    <motion.div variants={stagger} initial="hidden" animate="visible" className="space-y-6">
      <motion.div variants={fadeUp}>
        <h1 className="text-2xl font-bold tracking-tight">Messages</h1>
        <p className="text-muted-foreground">Secure messaging with clients</p>
      </motion.div>

      <motion.div variants={fadeUp} className="grid grid-cols-12 gap-4 h-[calc(100vh-220px)]">
        {/* Client list sidebar */}
        <Card className="col-span-4 flex flex-col border-0 shadow-sm">
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
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="p-4 text-center text-sm text-muted-foreground"
                >
                  No clients found
                </motion.div>
              ) : (
                <motion.div variants={stagger} initial="hidden" animate="visible" className="space-y-1 p-2">
                  {clientsData?.data.map((client) => (
                    <motion.div key={client.id} variants={fadeUp}>
                      <button
                        onClick={() => setSelectedClientId(client.id)}
                        className={`w-full flex items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors hover:bg-accent relative ${
                          selectedClientId === client.id ? "bg-accent" : ""
                        }`}
                      >
                        {selectedClientId === client.id && (
                          <motion.div
                            layoutId="selected-client"
                            className="absolute inset-0 rounded-lg bg-accent"
                            transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                          />
                        )}
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary text-sm font-medium relative z-10">
                          {client.name.charAt(0)}
                        </div>
                        <div className="min-w-0 flex-1 relative z-10">
                          <p className="text-sm font-medium truncate">{client.name}</p>
                          <p className="text-xs text-muted-foreground truncate">{client.business_type}</p>
                        </div>
                        <Badge variant="outline" className="shrink-0 text-xs relative z-10">
                          {client.status}
                        </Badge>
                      </button>
                    </motion.div>
                  ))}
                </motion.div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Message thread */}
        <Card className="col-span-8 flex flex-col border-0 shadow-sm">
          {selectedClientId ? (
            <>
              <CardHeader className="border-b pb-3">
                <CardTitle className="text-base font-semibold">
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
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="flex flex-col items-center justify-center h-full text-center py-12"
                    >
                      <MessageSquare className="h-8 w-8 text-muted-foreground mb-2" />
                      <p className="text-sm text-muted-foreground">No messages yet. Start the conversation!</p>
                    </motion.div>
                  ) : (
                    <div className="space-y-3">
                      {[...(messagesData?.data || [])].reverse().map((msg, i) => (
                        <motion.div
                          key={msg.id}
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: i * 0.04, duration: 0.4, ease: [0.16, 1, 0.3, 1] as const }}
                          className="flex flex-col gap-1"
                        >
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
                        </motion.div>
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
                  <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    <Button type="submit" size="icon" disabled={!newMessage.trim() || createMessage.isPending}>
                      <Send className="h-4 w-4" />
                    </Button>
                  </motion.div>
                </form>
              </div>
            </>
          ) : (
            <CardContent className="flex flex-col items-center justify-center h-full text-center">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] as const }}
                className="flex flex-col items-center"
              >
                <MessageSquare className="h-12 w-12 text-muted-foreground mb-3" />
                <p className="text-base font-semibold">Select a client</p>
                <p className="text-sm text-muted-foreground">Choose a client from the list to start messaging</p>
              </motion.div>
            </CardContent>
          )}
        </Card>
      </motion.div>
    </motion.div>
  );
}
