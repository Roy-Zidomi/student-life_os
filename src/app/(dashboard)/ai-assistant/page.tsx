"use client";

import { useState, useRef, useEffect } from "react";
import { useChat } from "@ai-sdk/react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Bot, Send, User, Sparkles, AlertTriangle } from "lucide-react";

const SUGGESTED_PROMPTS = [
  "Apa tugas paling mendesak minggu ini?",
  "Buatkan jadwal belajar untuk UAS",
  "Kenapa pengeluaranku tinggi bulan ini?",
  "Mata kuliah mana yang paling sedikit aku pelajari?",
  "Berikan tips meningkatkan produktivitas",
  "Bagaimana cara meningkatkan IPK?",
];

const getMessageText = (message: any) => {
  if (message.content) return message.content;
  if (!message.parts) return "";
  return message.parts
    .filter((part: any) => part.type === "text")
    .map((part: any) => part.text)
    .join("\n");
};

export default function AIAssistantPage() {
  const { messages, sendMessage, status, error } = useChat();
  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const isLoading = status === "streaming" || status === "submitted";

  // Auto scroll to bottom when messages, status, or error changes
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, status, error]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInput(e.target.value);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
    sendMessage({ text: input });
    setInput("");
  };

  const handleSuggestClick = (prompt: string) => {
    sendMessage({ text: prompt });
  };

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)]">
      <div className="mb-4">
        <h1 className="text-3xl font-bold tracking-tight">AI Assistant</h1>
        <p className="text-muted-foreground mt-1">Asisten AI yang memahami data akademikmu secara langsung.</p>
      </div>

      <Card className="flex-1 border-border/50 bg-card/50 flex flex-col overflow-hidden">
        <ScrollArea className="flex-1 p-4">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center min-h-[400px] py-12">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 mb-4">
                <Sparkles className="h-8 w-8 text-white animate-pulse" />
              </div>
              <h2 className="text-xl font-semibold mb-2">Halo! Ada yang bisa dibantu?</h2>
              <p className="text-sm text-muted-foreground mb-6 text-center max-w-md">
                Aku bisa membantu menganalisis tugas, jadwal belajar, keuangan, dan produktivitasmu.
              </p>
              <div className="grid gap-2 sm:grid-cols-2 max-w-lg w-full">
                {SUGGESTED_PROMPTS.map((prompt) => (
                  <button
                    key={prompt}
                    onClick={() => handleSuggestClick(prompt)}
                    className="text-left rounded-lg border border-border/50 bg-accent/30 p-3 text-sm hover:bg-indigo-500/10 hover:border-indigo-500/30 transition-all hover:-translate-y-0.5 whitespace-normal break-words"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-4 pb-4">
              {messages.map((m) => (
                <div key={m.id} className={`flex gap-3 ${m.role === "user" ? "justify-end" : ""}`}>
                  {m.role === "assistant" && (
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600">
                      <Bot className="h-4 w-4 text-white" />
                    </div>
                  )}
                  <div className={`rounded-xl px-4 py-3 max-w-[80%] text-sm leading-relaxed break-words ${
                    m.role === "user"
                      ? "bg-indigo-500 text-white shadow-md shadow-indigo-500/10"
                      : "bg-accent/50 border border-border/20"
                  }`}>
                    <p className="whitespace-pre-wrap">{getMessageText(m)}</p>
                  </div>
                  {m.role === "user" && (
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-accent border border-border/20">
                      <User className="h-4 w-4" />
                    </div>
                  )}
                </div>
              ))}

              {isLoading && (
                <div className="flex gap-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600">
                    <Bot className="h-4 w-4 text-white" />
                  </div>
                  <div className="rounded-xl bg-accent/50 px-4 py-3 border border-border/20">
                    <div className="flex gap-1 items-center h-4">
                      <span className="h-2 w-2 rounded-full bg-indigo-500 animate-bounce" />
                      <span className="h-2 w-2 rounded-full bg-indigo-500 animate-bounce [animation-delay:150ms]" />
                      <span className="h-2 w-2 rounded-full bg-indigo-500 animate-bounce [animation-delay:300ms]" />
                    </div>
                  </div>
                </div>
              )}

              {error && (
                <div className="flex gap-3 justify-center my-4">
                  <div className="rounded-xl bg-destructive/10 text-destructive border border-destructive/20 p-4 text-sm max-w-[90%] flex gap-3 items-start">
                    <AlertTriangle className="h-5 w-5 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold mb-1">Gagal Mendapatkan Respon AI</p>
                      <p className="text-xs opacity-90 leading-relaxed font-medium">
                        {error.message && error.message !== "An error occurred."
                          ? error.message
                          : "Batas kuota gratis (Free Tier) dari Gemini API Key Anda telah habis atau API Key tidak valid. Silakan periksa limit/kuota API Key Anda di Google AI Studio atau perbarui GOOGLE_GENERATIVE_AI_API_KEY Anda di file .env."}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>
          )}
        </ScrollArea>

        <CardContent className="border-t border-border p-4">
          <form onSubmit={handleFormSubmit} className="flex gap-2">
            <Input
              value={input}
              onChange={handleInputChange}
              placeholder="Tanya sesuatu tentang akademikmu..."
              className="flex-1"
              disabled={isLoading}
            />
            <Button type="submit" disabled={isLoading || !input.trim()} className="bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm">
              <Send className="h-4 w-4" />
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
