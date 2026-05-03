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
    async (userId: string, content: string, conversationId?: string) => {
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
          }),
          signal: abortControllerRef.current.signal,
        });

        if (!response.body) {
          throw new Error("No response body");
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split("\n");

          for (const line of lines) {
            if (line.startsWith("data: ")) {
              const dataStr = line.replace("data: ", "").trim();
              if (!dataStr) continue;

              try {
                const data = JSON.parse(dataStr);

                if (data.type === "content" && data.content) {
                  assistantContent += data.content;
                } else if (data.type === "metadata" && data.metadata) {
                  metadata = { ...metadata, ...data.metadata };
                }

                setMessages((prev) =>
                  prev.map((msg) =>
                    msg.id === assistantMessageId
                      ? {
                          ...msg,
                          content: assistantContent,
                          ...metadata,
                        }
                      : msg
                  )
                );
              } catch (e) {
                console.error("Failed to parse SSE message:", dataStr);
              }
            }
          }
        }
      } catch (error) {
        if ((error as Error).name !== "AbortError") {
          console.error("Stream error:", error);
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
