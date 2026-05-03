import { Router } from "express";
import { db } from "@workspace/db";
import { conversationsTable, messagesTable } from "@workspace/db/schema";
import { eq, and } from "drizzle-orm";

const router = Router();

router.get("/conversations/:userId", async (req, res) => {
  try {
    const conversations = await db
      .select()
      .from(conversationsTable)
      .where(eq(conversationsTable.userId, req.params.userId))
      .orderBy(conversationsTable.updatedAt);

    res.json({
      conversations: conversations.map((c) => ({
        id: c.id,
        userId: c.userId,
        title: c.title,
        messageCount: c.messageCount,
        createdAt: c.createdAt.toISOString(),
        updatedAt: c.updatedAt.toISOString(),
      })),
    });
  } catch (err) {
    req.log.error({ err }, "Failed to get conversations");
    res.status(500).json({ error: "internal_error", message: "Failed to fetch conversations" });
  }
});

router.get("/conversations/:userId/:conversationId/messages", async (req, res) => {
  try {
    const messages = await db
      .select()
      .from(messagesTable)
      .where(eq(messagesTable.conversationId, req.params.conversationId))
      .orderBy(messagesTable.createdAt);

    res.json({
      messages: messages.map((m) => ({
        id: m.id,
        conversationId: m.conversationId,
        role: m.role,
        content: m.content,
        intent: m.intent ?? undefined,
        agent: m.agent ?? undefined,
        createdAt: m.createdAt.toISOString(),
      })),
    });
  } catch (err) {
    req.log.error({ err }, "Failed to get messages");
    res.status(500).json({ error: "internal_error", message: "Failed to fetch messages" });
  }
});

export default router;
