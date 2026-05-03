import { useState, useCallback, useRef } from "react";

export type AiMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  intent?: string;
  agent?: string;
  createdAt: string;
};

export function useAiStream() {
  const [messages, setMessages] = useState<AiMessage[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  const sendMessage = useCallback(
    async (userId: string, content: string, conversationId?: string, agentMode?: string) => {
      if (!content.trim()) return;

      const userMessage: AiMessage = {
        id: crypto.randomUUID(),
        role: "user",
        content,
        createdAt: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, userMessage]);
      setIsStreaming(true);

      const assistantMessageId = crypto.randomUUID();
      let assistantContent = "";
      let metadata: { intent?: string; agent?: string } = {};

      setMessages((prev) => [
        ...prev,
        {
          id: assistantMessageId,
          role: "assistant",
          content: "",
          createdAt: new Date().toISOString(),
        },
      ]);

      abortControllerRef.current = new AbortController();

      try {
        const response = await fetch("/api/ai/chat", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            userId,
            message: content,
            conversationId,
            portfolioContext: true,
            agentMode: agentMode ?? "normal",
          }),
          signal: abortControllerRef.current.signal,
        });

        if (!response.ok || !response.body) {
          throw new Error(`Stream failed: ${response.status} ${response.statusText}`);
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";

        const flushUpdate = () => {
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === assistantMessageId
                ? { ...msg, content: assistantContent, ...metadata }
                : msg
            )
          );
        };

        const processEvent = (rawEvent: string) => {
          // An SSE event can have multiple `data:` lines that concatenate with newlines.
          const dataLines: string[] = [];
          for (const line of rawEvent.split("\n")) {
            if (line.startsWith("data:")) {
              dataLines.push(line.slice(5).replace(/^ /, ""));
            }
          }
          if (dataLines.length === 0) return;
          const dataStr = dataLines.join("\n").trim();
          if (!dataStr) return;
          try {
            const data = JSON.parse(dataStr);
            if (data.type === "content" && data.content) {
              assistantContent += data.content;
            } else if (data.type === "metadata" && data.metadata) {
              metadata = { ...metadata, ...data.metadata };
            } else if (data.type === "error") {
              assistantContent += `\n\n_Error: ${data.error || data.message || "stream failed"}_`;
            }
            flushUpdate();
          } catch (e) {
            console.error("Failed to parse SSE event:", dataStr, e);
          }
        };

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });

          // Process complete SSE events (delimited by blank line)
          let sepIdx: number;
          while ((sepIdx = buffer.indexOf("\n\n")) !== -1) {
            const rawEvent = buffer.slice(0, sepIdx);
            buffer = buffer.slice(sepIdx + 2);
            if (rawEvent.trim()) processEvent(rawEvent);
          }
        }
        // Flush any trailing event without a final blank line
        if (buffer.trim()) processEvent(buffer);
      } catch (error) {
        if ((error as Error).name !== "AbortError") {
          console.error("Stream error:", error);
          assistantContent += assistantContent
            ? `\n\n_Connection interrupted. Please retry._`
            : `_Sorry — the AI desk is unreachable. Please try again._`;
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === assistantMessageId
                ? { ...msg, content: assistantContent, ...metadata }
                : msg
            )
          );
        }
      } finally {
        setIsStreaming(false);
        abortControllerRef.current = null;
      }
    },
    []
  );

  const stopStream = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
  }, []);

  return {
    messages,
    isStreaming,
    sendMessage,
    stopStream,
    setMessages,
  };
}
