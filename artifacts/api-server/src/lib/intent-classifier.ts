import type OpenAI from "openai";
import { logger } from "./logger";
import { getOpenAI } from "./openai-client";
import { z } from "zod";

export const AGENTS = [
  "portfolio_health",
  "market_research",
  "investment_strategy",
  "financial_calculator",
  "risk_assessment",
  "portfolio_builder",
  "general_support",
] as const;

export type AgentName = (typeof AGENTS)[number];

const ClassificationSchema = z.object({
  intent: z.string(),
  agent: z.enum(AGENTS),
  entities: z.object({
    tickers: z.array(z.string()).optional(),
    amounts: z.array(z.number()).optional(),
    sectors: z.array(z.string()).optional(),
    timePeriod: z.string().optional(),
    topics: z.array(z.string()).optional(),
  }),
  safetyVerdict: z.enum(["safe", "caution", "unsafe"]),
  safetyNote: z.string().optional(),
  confidence: z.number().min(0).max(1),
});

export type Classification = z.infer<typeof ClassificationSchema>;

const FALLBACK_CLASSIFICATION: Classification = {
  intent: "general_inquiry",
  agent: "general_support",
  entities: {},
  safetyVerdict: "safe",
  confidence: 0.5,
};

interface PriorTurn {
  role: "user" | "assistant";
  content: string;
}

export async function classifyIntent(
  query: string,
  priorTurns: PriorTurn[] = []
): Promise<Classification> {
  const client = getOpenAI();
  if (!client) return FALLBACK_CLASSIFICATION;

  const systemPrompt = `You are an intent classifier for AENS X VALURA, a wealth management AI platform.

Classify the user's query and return a JSON object with:
- intent: brief snake_case description (e.g. "portfolio_health_check", "stock_research", "rebalancing_advice")
- agent: one of [${AGENTS.join(", ")}]:
  * portfolio_health — portfolio health checks, diversification questions, "how is my portfolio doing"
  * market_research — stock/ETF research, company analysis, sector analysis, price queries
  * investment_strategy — buy/sell recommendations, rebalancing, allocation strategy
  * financial_calculator — tax calculations, compound interest, return calculations, position sizing
  * risk_assessment — risk profile analysis, volatility, drawdown, correlation questions
  * portfolio_builder — starting a portfolio from scratch, first allocation, goal-based investing
  * general_support — greetings, app help, off-topic questions
- entities: extracted { tickers, amounts, sectors, timePeriod, topics }
- safetyVerdict: "safe" | "caution" | "unsafe" (informational only, does not block)
- safetyNote: optional note if caution/unsafe
- confidence: 0–1

For follow-up queries referencing prior turns (e.g. "what about Apple?" after discussing Microsoft), resolve the reference from context.`;

  const contextMessages: OpenAI.ChatCompletionMessageParam[] = priorTurns
    .slice(-6)
    .map((t) => ({ role: t.role, content: t.content }));

  try {
    const response = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        ...contextMessages,
        { role: "user", content: query },
      ],
      response_format: { type: "json_object" },
      max_tokens: 300,
      temperature: 0,
    });

    const raw = response.choices[0]?.message?.content;
    if (!raw) return FALLBACK_CLASSIFICATION;

    const parsed = JSON.parse(raw);
    const result = ClassificationSchema.safeParse(parsed);
    if (!result.success) {
      logger.warn({ error: result.error, raw }, "Classification parse failed, using fallback");
      return FALLBACK_CLASSIFICATION;
    }
    return result.data;
  } catch (err) {
    logger.error({ err }, "Intent classification failed, using fallback");
    return FALLBACK_CLASSIFICATION;
  }
}
