import { Router } from "express";
import { PathfinderScenarioInsightBody, PathfinderScenarioInsightResponse } from "@workspace/api-zod";
import { getOpenAI } from "../lib/openai-client";
import { logger } from "../lib/logger";
import { aiLimiter } from "../middlewares/rate-limit";
import { firstNameForGreeting } from "../lib/user-addressing";

const router = Router();

const SCENARIO_SYSTEM = `You are the VALURA Pathfinder scenario narrator for new investors.

Rules:
- You interpret hypothetical savings scenarios using ONLY the numbers the user supplied. Those numbers are illustrative compound-growth math, not predictions of real market returns.
- Write 2–4 short paragraphs in plain English. Address the user by their first name when provided.
- Explain what the scenario illustrates (habits, time horizon, sensitivity to return assumptions) and what it does NOT guarantee.
- Never claim to predict the future, pick stocks, or promise outcomes. No specific buy/sell instructions.
- End with one sentence that this is educational, not personalized financial advice.`;

router.post("/pathfinder/scenario-insight", aiLimiter, async (req, res) => {
  const parsed = PathfinderScenarioInsightBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "invalid_body", message: parsed.error.flatten().toString() });
    return;
  }

  const {
    monthly,
    years,
    annualReturnPct,
    hypotheticalEndingBalance,
    currency,
    displayName,
  } = parsed.data;

  const client = getOpenAI();
  if (!client) {
    res.status(503).json({
      error: "openai_unconfigured",
      message: "OPENAI_API_KEY is not set on the API server. Add it and restart.",
    });
    return;
  }

  const first = firstNameForGreeting(displayName);
  const cur = currency ?? "USD";

  const userContent = `Write the scenario narrative.

User first name for greetings: ${first}
Monthly contribution: ${monthly} ${cur}
Years: ${years}
Assumed annual return (illustrative only): ${annualReturnPct}%
Hypothetical ending balance from that assumption: ${hypotheticalEndingBalance.toLocaleString(undefined, { maximumFractionDigits: 0 })} ${cur}

Remind them these sliders are a teaching tool, not a forecast.`;

  try {
    const completion = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: SCENARIO_SYSTEM },
        { role: "user", content: userContent },
      ],
      max_tokens: 650,
      temperature: 0.45,
    });

    const narrative = completion.choices[0]?.message?.content?.trim() ?? "";
    const validated = PathfinderScenarioInsightResponse.parse({ narrative });
    res.json(validated);
  } catch (err) {
    logger.error({ err }, "pathfinder scenario-insight failed");
    res.status(500).json({
      error: "scenario_insight_failed",
      message: "Could not generate scenario narrative. Try again.",
    });
  }
});

export default router;
