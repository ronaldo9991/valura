import OpenAI from "openai";
import { logger } from "./logger";
import { runSafetyGuard } from "./safety-guard";
import { classifyIntent, type AgentName } from "./intent-classifier";
import { runPortfolioHealthAgent, type HoldingInput, type UserContext } from "./portfolio-health-agent";

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export type AgentMode = "normal" | "coach" | "analyst" | "risk_officer" | "strategist";

export interface PipelineInput {
  userId: string;
  message: string;
  conversationId?: string;
  priorMessages?: Array<{ role: "user" | "assistant"; content: string }>;
  userContext?: UserContext;
  holdings?: HoldingInput[];
  cashBalance?: number;
  agentMode?: AgentMode;
}

const MODE_PROMPTS: Record<AgentMode, { label: string; persona: string }> = {
  normal: {
    label: "Co-Investor",
    persona: `You are the AENS X VALURA AI co-investor — balanced, professional, and clear. You blend market knowledge with practical guidance. Default tone for general questions.`,
  },
  coach: {
    label: "Coach",
    persona: `You are the VALURA Beginner Coach. Speak like a patient mentor talking to a curious novice. Use simple analogies (e.g. "owning Apple is like owning a tiny slice of the iPhone factory"). Avoid jargon — when you must use a term, define it inline. Be encouraging. Keep paragraphs short.`,
  },
  analyst: {
    label: "Analyst",
    persona: `You are the VALURA Senior Analyst. Provide deep, data-driven analysis: P/E ratios, free cash flow, margins, growth rates, valuation models, sector dynamics. Use precise financial vocabulary. Cite numbers when available. Conclude with a balanced bull/bear case.`,
  },
  risk_officer: {
    label: "Risk Officer",
    persona: `You are the VALURA Chief Risk Officer. Lead with risks: drawdowns, volatility, concentration, correlation, liquidity, geopolitical/regulatory exposure. Always quantify worst-case scenarios. Recommend hedges and position sizing. Conservative-leaning. Never minimize downside.`,
  },
  strategist: {
    label: "Strategist",
    persona: `You are the VALURA Long-Term Strategist. Focus on multi-year asset allocation, rebalancing cadence, tax efficiency, factor tilts (value/growth/quality/momentum), and lifecycle planning. Think in 5-10 year horizons. Tie advice back to the user's stated goal and risk profile.`,
  },
};

export interface SSEEvent {
  type: "metadata" | "content" | "done" | "error";
  content?: string;
  metadata?: {
    intent?: string;
    agent?: string;
    safetyVerdict?: string;
    entities?: Record<string, unknown>;
  };
  error?: string;
}

export function formatSSE(event: SSEEvent): string {
  return `data: ${JSON.stringify(event)}\n\n`;
}

const PIPELINE_TIMEOUT_MS = 25000;

export async function runPipeline(
  input: PipelineInput,
  write: (chunk: string) => void
): Promise<void> {
  const timeoutId = setTimeout(() => {
    write(formatSSE({ type: "error", error: "Request timed out after 25 seconds." }));
    write(formatSSE({ type: "done" }));
  }, PIPELINE_TIMEOUT_MS);

  try {
    const safetyResult = runSafetyGuard(input.message);
    if (safetyResult.blocked) {
      write(formatSSE({ type: "metadata", metadata: { agent: "safety_guard", intent: safetyResult.category } }));
      write(formatSSE({ type: "content", content: safetyResult.response }));
      write(formatSSE({ type: "done" }));
      return;
    }

    // If user explicitly picked a mode (other than normal), bypass the intent classifier entirely.
    const explicitMode = input.agentMode && input.agentMode !== "normal" ? input.agentMode : null;

    if (explicitMode) {
      write(
        formatSSE({
          type: "metadata",
          metadata: {
            intent: explicitMode,
            agent: MODE_PROMPTS[explicitMode].label,
            safetyVerdict: "pass",
            entities: {},
          },
        })
      );
      await handlePersonaChat(explicitMode, input, write);
    } else {
      const classification = await classifyIntent(input.message, input.priorMessages ?? []);
      write(
        formatSSE({
          type: "metadata",
          metadata: {
            intent: classification.intent,
            agent: classification.agent,
            safetyVerdict: classification.safetyVerdict,
            entities: classification.entities as Record<string, unknown>,
          },
        })
      );
      await routeToAgent(classification.agent, input, write);
    }
    write(formatSSE({ type: "done" }));
  } catch (err) {
    logger.error({ err }, "Pipeline error");
    write(formatSSE({ type: "error", error: "An error occurred while processing your request." }));
    write(formatSSE({ type: "done" }));
  } finally {
    clearTimeout(timeoutId);
  }
}

async function routeToAgent(
  agent: AgentName,
  input: PipelineInput,
  write: (chunk: string) => void
): Promise<void> {
  switch (agent) {
    case "portfolio_health":
      await handlePortfolioHealth(input, write);
      break;

    case "market_research":
    case "investment_strategy":
    case "financial_calculator":
    case "risk_assessment":
    case "portfolio_builder":
    case "general_support":
    default:
      await handleGeneralChat(agent, input, write);
      break;
  }
}

async function handlePortfolioHealth(
  input: PipelineInput,
  write: (chunk: string) => void
): Promise<void> {
  if (!input.userContext || !input.holdings) {
    await handleGeneralChat("portfolio_health", input, write);
    return;
  }

  await runPortfolioHealthAgent(
    input.userContext,
    input.holdings,
    input.cashBalance ?? 0,
    (chunk) => write(formatSSE({ type: "content", content: chunk }))
  );
}

async function handlePersonaChat(
  mode: AgentMode,
  input: PipelineInput,
  write: (chunk: string) => void
): Promise<void> {
  const persona = MODE_PROMPTS[mode].persona;
  const contextInfo = input.userContext
    ? `\n\nUser context: ${input.userContext.name}, Risk profile: ${input.userContext.riskProfile}, Goal: ${input.userContext.investmentGoal}, Currency: ${input.userContext.currency}`
    : "";
  const holdingsInfo = input.holdings && input.holdings.length > 0
    ? `\nCurrent holdings: ${input.holdings.map((h) => `${h.ticker} (${h.shares} shares @ $${h.avgCostBasis})`).join(", ")}.`
    : "";
  const messages: OpenAI.ChatCompletionMessageParam[] = [
    { role: "system", content: persona + contextInfo + holdingsInfo },
    ...(input.priorMessages ?? []).slice(-8).map((m) => ({
      role: m.role as "user" | "assistant",
      content: m.content,
    })),
    { role: "user", content: input.message },
  ];

  try {
    const stream = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages,
      stream: true,
      max_tokens: 800,
      temperature: mode === "coach" ? 0.7 : mode === "risk_officer" ? 0.4 : 0.6,
    });
    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content ?? "";
      if (content) write(formatSSE({ type: "content", content }));
    }
  } catch (err) {
    logger.error({ err, mode }, "Persona stream failed");
    write(formatSSE({ type: "error", error: `The ${MODE_PROMPTS[mode].label} agent encountered an error.` }));
  }
}

async function handleGeneralChat(
  agent: AgentName,
  input: PipelineInput,
  write: (chunk: string) => void
): Promise<void> {
  const systemPrompts: Record<string, string> = {
    market_research: `You are the AENS X VALURA Market Research Agent. Provide thorough, data-grounded market analysis. Use real company names, industries, and financial concepts. Be specific. End with a brief note that this is for informational purposes only.`,
    investment_strategy: `You are the AENS X VALURA Investment Strategy Agent. Provide thoughtful, risk-aware investment strategy guidance tailored to the user's profile. Always consider diversification, time horizon, and risk tolerance. Be concrete but careful — recommend consulting a financial advisor for major decisions.`,
    financial_calculator: `You are the AENS X VALURA Financial Calculator Agent. Help users with financial math: compound interest, return calculations, position sizing, tax-loss harvesting math, etc. Show your work clearly.`,
    risk_assessment: `You are the AENS X VALURA Risk Assessment Agent. Analyze portfolio and market risks clearly. Explain volatility, correlation, drawdown, and concentration risks in plain language.`,
    portfolio_builder: `You are the AENS X VALURA Portfolio Builder Agent. Help new investors build their first portfolio. Be encouraging, practical, and simple. Focus on low-cost index funds for beginners, then build complexity as needed. Consider the user's risk profile and goals.`,
    general_support: `You are the AENS X VALURA AI co-investor assistant. You help users with financial questions, portfolio management, and market insights. Be helpful, clear, and professional.`,
    portfolio_health: `You are the AENS X VALURA Portfolio Health Agent. Analyze portfolio health with a focus on concentration risk, performance, and diversification.`,
  };

  const sysPrompt = systemPrompts[agent] ?? systemPrompts["general_support"];

  const contextInfo = input.userContext
    ? `\nUser context: ${input.userContext.name}, Risk: ${input.userContext.riskProfile}, Goal: ${input.userContext.investmentGoal}, Currency: ${input.userContext.currency}`
    : "";

  const messages: OpenAI.ChatCompletionMessageParam[] = [
    { role: "system", content: sysPrompt + contextInfo },
    ...(input.priorMessages ?? []).slice(-8).map((m) => ({
      role: m.role as "user" | "assistant",
      content: m.content,
    })),
    { role: "user", content: input.message },
  ];

  try {
    const stream = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages,
      stream: true,
      max_tokens: 800,
      temperature: 0.6,
    });

    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content ?? "";
      if (content) {
        write(formatSSE({ type: "content", content }));
      }
    }
  } catch (err) {
    logger.error({ err, agent }, "Agent stream failed");
    write(formatSSE({ type: "error", error: `The ${agent} agent encountered an error. Please try again.` }));
  }
}
