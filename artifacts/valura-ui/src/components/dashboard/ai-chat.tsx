import React, { useState, useEffect, useRef } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ArrowUpRight, MessageSquare, Plus, Clock, TerminalSquare } from "lucide-react";
import { useAiStream } from "@/hooks/use-ai-stream";
import { useGetConversations, useGetMessages, getGetConversationsQueryKey, getGetMessagesQueryKey } from "@workspace/api-client-react";
import { Badge } from "@/components/ui/badge";

export function AiChat({ userId }: { userId: string }) {
  const { messages, isStreaming, sendMessage, setMessages } = useAiStream();
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  
  // Chat History
  const [activeConvoId, setActiveConvoId] = useState<string | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  
  const { data: convos } = useGetConversations(userId, { query: { enabled: !!userId, queryKey: getGetConversationsQueryKey(userId) } });
  
  const { data: pastMessages } = useGetMessages(userId, activeConvoId || "", { 
    query: { enabled: !!activeConvoId, queryKey: getGetMessagesQueryKey(userId, activeConvoId || "") }
  });

  useEffect(() => {
    if (pastMessages?.messages) {
      setMessages(pastMessages.messages.map(m => ({
        id: m.id,
        role: m.role,
        content: m.content,
        intent: m.intent,
        agent: m.agent,
        createdAt: m.createdAt
      })));
      setShowHistory(false);
    }
  }, [pastMessages, setMessages]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isStreaming]);

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

  const newChat = () => {
    setActiveConvoId(null);
    setMessages([]);
    setShowHistory(false);
  };

  const chips = [
    "Why is my NVDA down?",
    "Rebalance my tech exposure",
    "What's my biggest risk?",
    "Explain my alpha"
  ];

  return (
    <div className="flex flex-col h-full bg-card relative overflow-hidden">
      {/* Header */}
      <div className="h-16 px-6 border-b border-border flex items-center justify-between bg-card shrink-0 z-10">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-none border border-gold-hairline bg-primary/10 flex items-center justify-center relative">
            <TerminalSquare className="w-4 h-4 text-primary" />
            <div className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-emerald-500 animate-pulse border border-card" />
          </div>
          <div>
            <h2 className="font-mono text-sm font-bold text-foreground">AENS X Terminal</h2>
            <p className="text-[10px] text-primary font-mono uppercase tracking-widest">Co-Investor Online</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" className="w-8 h-8 rounded-none hover:bg-white/5" onClick={() => setShowHistory(!showHistory)}>
            <Clock className="w-4 h-4 text-muted-foreground" />
          </Button>
          <Button variant="ghost" size="icon" className="w-8 h-8 rounded-none hover:bg-white/5 text-primary" onClick={newChat}>
            <Plus className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* History Panel Overlay */}
      {showHistory && (
        <div className="absolute inset-0 top-16 bg-card/95 backdrop-blur-xl z-20 border-b border-border flex flex-col">
          <div className="p-4 border-b border-border">
            <span className="text-xs font-mono uppercase tracking-widest text-muted-foreground">Session History</span>
          </div>
          <ScrollArea className="flex-1">
            <div className="divide-y divide-border">
              {convos?.conversations?.map(c => (
                <button 
                  key={c.id} 
                  className="w-full text-left p-4 hover:bg-white/5 transition-colors flex flex-col gap-1"
                  onClick={() => setActiveConvoId(c.id)}
                >
                  <span className="text-sm font-medium truncate">{c.title}</span>
                  <span className="text-xs font-mono text-muted-foreground">{new Date(c.updatedAt).toLocaleDateString()}</span>
                </button>
              ))}
              {(!convos?.conversations || convos.conversations.length === 0) && (
                <div className="p-8 text-center text-muted-foreground text-sm font-mono">No past sessions found.</div>
              )}
            </div>
          </ScrollArea>
        </div>
      )}

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-6 scroll-smooth" ref={scrollRef}>
        <div className="space-y-6">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center space-y-6 py-20">
              <div className="w-16 h-16 border border-gold-hairline rounded-full flex items-center justify-center bg-primary/5">
                <TerminalSquare className="w-6 h-6 text-primary opacity-50" />
              </div>
              <div className="space-y-2 max-w-[250px]">
                <p className="text-xs font-mono uppercase tracking-widest text-muted-foreground">System Ready</p>
                <p className="text-sm text-foreground/80">Input query to execute commands, analyze risks, or rebalance allocation.</p>
              </div>
            </div>
          ) : (
            messages.map((msg) => (
              <div key={msg.id} className={`flex flex-col gap-1 ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                
                {msg.role === 'assistant' && msg.agent && (
                  <div className="flex items-center gap-2 mb-1 pl-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                    <span className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">Agent: {msg.agent}</span>
                  </div>
                )}

                <div className={`max-w-[85%] p-4 text-[14px] leading-relaxed shadow-sm font-sans ${
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
                  <Badge variant="outline" className="mt-1 border-gold-hairline text-[10px] text-gold font-mono uppercase rounded-none ml-1">
                    Intent: {msg.intent}
                  </Badge>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {/* Input Area */}
      <div className="p-4 bg-background border-t border-border shrink-0 z-10">
        <div className="flex flex-wrap gap-2 mb-4">
          {messages.length === 0 && chips.map(chip => (
            <button
              key={chip}
              onClick={() => handleChip(chip)}
              className="text-[10px] font-mono uppercase tracking-wider px-3 py-1.5 border border-border rounded-none text-muted-foreground hover:border-gold-hairline hover:text-gold transition-colors bg-card"
            >
              {chip}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="relative flex items-center">
          <Input 
            value={input} 
            onChange={(e) => setInput(e.target.value)} 
            placeholder="Command Valura..." 
            className="w-full bg-card border-border font-mono text-sm h-12 pl-4 pr-12 rounded-none focus-visible:ring-1 focus-visible:ring-primary focus-visible:border-primary placeholder:text-muted-foreground/50"
            disabled={isStreaming}
          />
          <Button 
            type="submit" 
            size="icon" 
            className="absolute right-1 top-1 h-10 w-10 rounded-none bg-primary hover:bg-primary/90 text-primary-foreground shadow-none" 
            disabled={isStreaming || !input.trim()}
          >
            <ArrowUpRight className="w-5 h-5" />
          </Button>
        </form>
      </div>
    </div>
  );
}
