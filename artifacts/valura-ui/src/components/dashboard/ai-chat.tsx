import React, { useState, useEffect, useRef, forwardRef, useImperativeHandle } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ArrowUpRight, Plus, Clock, TerminalSquare, Sparkles, Square } from "lucide-react";
import { useAiStream } from "@/hooks/use-ai-stream";
import { useGetConversations, useGetMessages, getGetConversationsQueryKey, getGetMessagesQueryKey } from "@workspace/api-client-react";
import { Badge } from "@/components/ui/badge";

export type AiChatHandle = { send: (text: string) => void };

type Props = {
  userId: string;
  novice?: boolean;
  pendingPrompt?: string | null;
  onPendingPromptConsumed?: () => void;
  portfolioContext?: { topHolding?: string | null; holdingsCount?: number; riskFlag?: string };
};

export const AiChat = forwardRef<AiChatHandle, Props>(function AiChat({ userId, novice = false, pendingPrompt, onPendingPromptConsumed, portfolioContext }, ref) {
  const { messages, isStreaming, sendMessage, setMessages, stopStream } = useAiStream();
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  const [activeConvoId, setActiveConvoId] = useState<string | null>(null);
  const [showHistory, setShowHistory] = useState(false);

  const { data: convos } = useGetConversations(userId, { query: { enabled: !!userId, queryKey: getGetConversationsQueryKey(userId) } });
  const { data: pastMessages } = useGetMessages(userId, activeConvoId || "", {
    query: { enabled: !!activeConvoId, queryKey: getGetMessagesQueryKey(userId, activeConvoId || "") }
  });

  useEffect(() => {
    if (pastMessages?.messages) {
      setMessages(pastMessages.messages.map(m => ({
        id: m.id, role: m.role, content: m.content, intent: m.intent, agent: m.agent, createdAt: m.createdAt,
      })));
      setShowHistory(false);
    }
  }, [pastMessages, setMessages]);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, isStreaming]);

  useImperativeHandle(ref, () => ({
    send: (text: string) => {
      if (!text.trim() || isStreaming) return;
      sendMessage(userId, text, activeConvoId || undefined);
    }
  }), [userId, activeConvoId, sendMessage, isStreaming]);

  // Consume external pending prompt deterministically once the chat is mounted and idle.
  useEffect(() => {
    if (!pendingPrompt || isStreaming) return;
    sendMessage(userId, pendingPrompt, activeConvoId || undefined);
    onPendingPromptConsumed?.();
  }, [pendingPrompt, isStreaming, userId, activeConvoId, sendMessage, onPendingPromptConsumed]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isStreaming) return;
    sendMessage(userId, input, activeConvoId || undefined);
    setInput("");
  };

  const handleChip = (text: string) => {
    if (isStreaming) return;
    sendMessage(userId, text, activeConvoId || undefined);
  };

  const newChat = () => { setActiveConvoId(null); setMessages([]); setShowHistory(false); };

  const noviceChips = [
    portfolioContext?.topHolding ? `What is ${portfolioContext.topHolding} and why do I own it?` : "Explain my portfolio in plain English",
    "Am I taking too much risk?",
    "Should a beginner buy more right now?",
    "What's one thing I should learn this week?",
  ];

  const proChips = [
    portfolioContext?.topHolding ? `Why is my ${portfolioContext.topHolding} moving today?` : "Analyze my exposure",
    "Rebalance my tech allocation",
    "Run a concentration risk check",
    "Show alpha attribution by sector",
  ];

  const chips = novice ? noviceChips : proChips;

  return (
    <div className="flex flex-col h-full bg-card relative overflow-hidden">
      {/* Header */}
      <div className="h-16 px-5 border-b border-border flex items-center justify-between bg-card shrink-0 z-10">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-8 h-8 shrink-0 rounded-none border border-gold-hairline bg-primary/10 flex items-center justify-center relative">
            <TerminalSquare className="w-4 h-4 text-primary" />
            <div className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-emerald-500 animate-pulse border border-card" />
          </div>
          <div className="min-w-0">
            <h2 className="font-mono text-sm font-bold truncate">Valura Co-Investor</h2>
            <p className="text-[9px] text-primary font-mono uppercase tracking-widest truncate">{novice ? "Beginner-friendly · Online" : "Co-Investor · Online"}</p>
          </div>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <Button variant="ghost" size="icon" className="w-8 h-8 rounded-none hover:bg-white/5" onClick={() => setShowHistory(!showHistory)} title="History">
            <Clock className="w-4 h-4 text-muted-foreground" />
          </Button>
          <Button variant="ghost" size="icon" className="w-8 h-8 rounded-none hover:bg-white/5 text-primary" onClick={newChat} title="New chat">
            <Plus className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* History Panel */}
      {showHistory && (
        <div className="absolute inset-0 top-16 bg-card/95 backdrop-blur-xl z-20 border-b border-border flex flex-col">
          <div className="p-4 border-b border-border">
            <span className="text-xs font-mono uppercase tracking-widest text-muted-foreground">Past Sessions</span>
          </div>
          <ScrollArea className="flex-1">
            <div className="divide-y divide-border">
              {convos?.conversations?.map(c => (
                <button key={c.id} className="w-full text-left p-4 hover:bg-white/5 transition-colors flex flex-col gap-1" onClick={() => setActiveConvoId(c.id)}>
                  <span className="text-sm font-medium truncate">{c.title}</span>
                  <span className="text-[10px] font-mono text-muted-foreground">{new Date(c.updatedAt).toLocaleDateString()}</span>
                </button>
              ))}
              {(!convos?.conversations || convos.conversations.length === 0) && (
                <div className="p-8 text-center text-muted-foreground text-sm font-mono">No past sessions yet.</div>
              )}
            </div>
          </ScrollArea>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-5 py-5 scroll-smooth" ref={scrollRef}>
        <div className="space-y-5">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center space-y-5 py-12">
              <div className="w-14 h-14 border border-gold-hairline rounded-full flex items-center justify-center bg-primary/5">
                <Sparkles className="w-5 h-5 text-primary" />
              </div>
              <div className="space-y-2 max-w-[260px]">
                <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">{novice ? "Hi, I'm Valura" : "Co-Investor Online"}</p>
                <p className="text-sm text-foreground/85 leading-relaxed">
                  {novice
                    ? "I'm your AI co-investor. Ask me anything about your portfolio — I'll explain it like a friend, not a finance textbook."
                    : "Real-time portfolio intelligence. Ask about positions, risk, alpha, or rebalancing strategies."}
                </p>
              </div>
            </div>
          ) : (
            messages.map((msg) => (
              <div key={msg.id} className={`flex flex-col gap-1 ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                {msg.role === 'assistant' && msg.agent && (
                  <div className="flex items-center gap-2 mb-1 pl-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                    <span className="text-[9px] font-mono uppercase tracking-widest text-muted-foreground">Agent: {msg.agent}</span>
                  </div>
                )}
                <div className={`max-w-[88%] p-3 text-[13px] leading-relaxed shadow-sm ${
                  msg.role === 'user'
                    ? 'bg-primary text-primary-foreground rounded-l-xl rounded-tr-xl'
                    : 'bg-background border border-border rounded-r-xl rounded-bl-xl text-foreground'
                }`}>
                  {msg.role === 'assistant' && !msg.content && isStreaming ? (
                    <span className="flex gap-1 items-center h-4 px-2">
                      <span className="w-1 h-1 rounded-full bg-primary animate-ping" />
                      <span className="w-1 h-1 rounded-full bg-primary animate-ping [animation-delay:0.2s]" />
                      <span className="w-1 h-1 rounded-full bg-primary animate-ping [animation-delay:0.4s]" />
                    </span>
                  ) : (
                    <div className="whitespace-pre-wrap">{msg.content}</div>
                  )}
                </div>
                {msg.role === 'assistant' && msg.intent && (
                  <Badge variant="outline" className="mt-1 border-gold-hairline text-[9px] text-gold font-mono uppercase rounded-none ml-1">
                    {msg.intent}
                  </Badge>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {/* Input */}
      <div className="px-4 pt-3 pb-4 bg-background border-t border-border shrink-0 z-10">
        {messages.length === 0 && (
          <div className="grid grid-cols-1 gap-1.5 mb-3">
            {chips.map(chip => (
              <button
                key={chip}
                onClick={() => handleChip(chip)}
                className="text-[11px] text-left px-3 py-2 border border-border rounded-none text-muted-foreground hover:border-gold-hairline hover:text-foreground hover:bg-primary/5 transition-colors bg-card"
                data-testid={`chip-${chip.slice(0, 20)}`}
              >
                {chip}
              </button>
            ))}
          </div>
        )}

        <form onSubmit={handleSubmit} className="relative flex items-center">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={novice ? "Ask anything…" : "Command Valura…"}
            className="w-full bg-card border-border font-sans text-sm h-11 pl-3 pr-12 rounded-none focus-visible:ring-1 focus-visible:ring-primary focus-visible:border-primary placeholder:text-muted-foreground/50"
            disabled={isStreaming}
            data-testid="input-ai-chat"
          />
          {isStreaming ? (
            <Button type="button" size="icon" onClick={stopStream} className="absolute right-1 top-1 h-9 w-9 rounded-none bg-destructive hover:bg-destructive/90 text-destructive-foreground" title="Stop">
              <Square className="w-4 h-4" />
            </Button>
          ) : (
            <Button type="submit" size="icon" className="absolute right-1 top-1 h-9 w-9 rounded-none bg-primary hover:bg-primary/90 text-primary-foreground" disabled={!input.trim()} data-testid="button-send-ai">
              <ArrowUpRight className="w-4 h-4" />
            </Button>
          )}
        </form>
      </div>
    </div>
  );
});
