/**
 * Ensures the LLM addresses the human user correctly (vs confusing user vs assistant).
 */
export function firstNameForGreeting(fullName: string | undefined): string {
  if (!fullName?.trim()) return "there";
  return fullName.trim().split(/\s+/)[0] ?? "there";
}

/** Appended to system prompts so the model greets the signed-in human by name. */
export function humanAddressingInstructions(userContextName: string | undefined): string {
  if (!userContextName?.trim()) {
    return `\n\nYou are the Valura AI assistant speaking to a human user. Never confuse your identity with the user's — you are not the portfolio owner.`;
  }
  const first = firstNameForGreeting(userContextName);
  return `\n\nThe human user's name is "${userContextName}". Greet and refer to them as "${first}" when natural. You are the Valura AI assistant — you are not this person. Do not write as if you were the user.`;
}
