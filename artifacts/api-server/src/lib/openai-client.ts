import OpenAI from "openai";

let cache: OpenAI | null | undefined;

/** Shared client when `OPENAI_API_KEY` is set; otherwise `null` so the process can start without AI. */
export function getOpenAI(): OpenAI | null {
  if (cache !== undefined) return cache;
  const key = process.env.OPENAI_API_KEY;
  cache = key ? new OpenAI({ apiKey: key }) : null;
  return cache;
}
