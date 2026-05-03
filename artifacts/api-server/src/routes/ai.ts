import { Router } from "express";
import { db } from "@workspace/db";
import { usersTable, holdingsTable, cashBalancesTable, conversationsTable, messagesTable } from "@workspace/db/schema";
import { eq } from "drizzle-orm";
import { AiChatBody } from "@workspace/api-zod";
import { runPipeline } from "../lib/ai-pipeline";
import { randomUUID } from "crypto";

const router = Router();

router.post("/ai/chat", async (req, res) => {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Accel-Buffering", "no");
  res.flushHeaders();

  const write = (chunk: string) => {
    res.write(chunk);
  };

  try {
    const parsed = AiChatBody.safeParse(req.body);
    if (!parsed.success) {
      write(`data: ${JSON.stringify({ type: "error", error: "Invalid request body" })}\n\n`);
      write(`data: ${JSON.stringify({ type: "done" })}\n\n`);
      res.end();
      return;
    }

    const { userId, message, conversationId, portfolioContext, agentMode } = parsed.data;

    const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId));
    if (!user) {
      write(`data: ${JSON.stringify({ type: "error", error: "User not found" })}\n\n`);
      write(`data: ${JSON.stringify({ type: "done" })}\n\n`);
      res.end();
      return;
    }

    let convId = conversationId;
    if (!convId) {
      convId = randomUUID();
      const title = message.length > 50 ? message.substring(0, 47) + "..." : message;
      await db.insert(conversationsTable).values({ id: convId, userId, title }).onConflictDoNothing();
    }

    const priorMessages = convId
      ? await db.select().from(messagesTable).where(eq(messagesTable.conversationId, convId)).orderBy(messagesTable.createdAt)
      : [];

    const [holdings, cashRow] = portfolioContext !== false
      ? await Promise.all([
          db.select().from(holdingsTable).where(eq(holdingsTable.userId, userId)),
          db.select().from(cashBalancesTable).where(eq(cashBalancesTable.userId, userId)),
        ])
      : [[], []];

    await db.insert(messagesTable).values({
      id: randomUUID(),
      conversationId: convId,
      role: "user",
      content: message,
    });

    const responseChunks: string[] = [];
    let intent: string | undefined;
    let agent: string | undefined;

    await runPipeline(
      {
        userId,
        message,
        conversationId: convId,
        priorMessages: priorMessages.map((m) => ({ role: m.role as "user" | "assistant", content: m.content })),
        userContext: {
          id: user.id,
          name: user.name,
          riskProfile: user.riskProfile,
          currency: user.currency,
          investmentGoal: user.investmentGoal,
        },
        holdings: holdings.map((h) => ({
          ticker: h.ticker,
          name: h.name,
          shares: Number(h.shares),
          avgCostBasis: Number(h.avgCostBasis),
          sector: h.sector,
          currency: h.currency,
        })),
        cashBalance: cashRow[0] ? Number(cashRow[0].balance) : 0,
        agentMode: agentMode ?? undefined,
      },
      (chunk) => {
        write(chunk);
        try {
          const parsed = JSON.parse(chunk.replace(/^data: /, "").trim());
          if (parsed.type === "content" && parsed.content) {
            responseChunks.push(parsed.content);
          }
          if (parsed.type === "metadata" && parsed.metadata) {
            intent = parsed.metadata.intent;
            agent = parsed.metadata.agent;
          }
        } catch {}
      }
    );

    const fullResponse = responseChunks.join("");
    if (fullResponse) {
      await db.insert(messagesTable).values({
        id: randomUUID(),
        conversationId: convId,
        role: "assistant",
        content: fullResponse,
        intent: intent ?? null,
        agent: agent ?? null,
      });

      await db
        .update(conversationsTable)
        .set({ messageCount: priorMessages.length + 2, updatedAt: new Date() })
        .where(eq(conversationsTable.id, convId));
    }
  } catch (err) {
    req.log.error({ err }, "AI chat error");
    write(`data: ${JSON.stringify({ type: "error", error: "An unexpected error occurred" })}\n\n`);
    write(`data: ${JSON.stringify({ type: "done" })}\n\n`);
  } finally {
    res.end();
  }
});

export default router;
