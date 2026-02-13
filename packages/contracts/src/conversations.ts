import { z } from "zod";
import { UUID } from "./common";

// ---------------------------------------------------------------------------
// Enums
// ---------------------------------------------------------------------------

export const ConversationType = z.enum(["direct", "group", "channel"]);
export type ConversationType = z.infer<typeof ConversationType>;

export const MessageType = z.enum(["text", "file", "system"]);
export type MessageType = z.infer<typeof MessageType>;

// ---------------------------------------------------------------------------
// Conversation
// ---------------------------------------------------------------------------

export const ConversationSchema = z.object({
  id: UUID,
  type: ConversationType,
  title: z.string().max(255).optional(),
  created_by: UUID,
  participant_ids: z.array(UUID).min(1),
});
export type Conversation = z.infer<typeof ConversationSchema>;

// ---------------------------------------------------------------------------
// Message
// ---------------------------------------------------------------------------

export const MessageSchema = z.object({
  id: UUID,
  conversation_id: UUID,
  sender_id: UUID,
  content: z.string().min(1).max(50000),
  message_type: MessageType.default("text"),
  is_edited: z.boolean().default(false),
  parent_id: UUID.optional(),
  created_at: z.coerce.date(),
});
export type Message = z.infer<typeof MessageSchema>;

// ---------------------------------------------------------------------------
// Message Receipt
// ---------------------------------------------------------------------------

export const MessageReceiptSchema = z.object({
  message_id: UUID,
  user_id: UUID,
  read_at: z.coerce.date(),
});
export type MessageReceipt = z.infer<typeof MessageReceiptSchema>;

// ---------------------------------------------------------------------------
// Create / Send
// ---------------------------------------------------------------------------

export const CreateConversationSchema = z.object({
  type: ConversationType,
  title: z.string().max(255).optional(),
  participant_ids: z.array(UUID).min(1),
});
export type CreateConversationInput = z.infer<typeof CreateConversationSchema>;

export const SendMessageSchema = z.object({
  conversation_id: UUID,
  content: z.string().min(1).max(50000),
  message_type: MessageType.default("text"),
  parent_id: UUID.optional(),
});
export type SendMessageInput = z.infer<typeof SendMessageSchema>;
