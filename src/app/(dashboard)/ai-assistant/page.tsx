"use client";

import { useState } from "react";
import { useChat } from "@ai-sdk/react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Bot, Send, User, Sparkles } from "lucide-react";

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
  const { messages, sendMessage, status } = useChat();
  const [input, setInput] = useState("");
  const isLoading = status === "streaming" || status === "submitted";

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
    setInput(prompt);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)]">
      <div className="mb-4">
        <h1 className="text-3xl font-bold tracking-tight">AI Assistant</h1>
        <p className="text-muted-foreground mt-1">Asisten AI yang memahami data akademikmu.</p>
      </div>

      <Card className="flex-1 border-border/50 bg-card/50 flex flex-col overflow-hidden">
        <ScrollArea className="flex-1 p-4">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full py-12">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 mb-4">
                <Sparkles className="h-8 w-8 text-white" />
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
                    className="text-left rounded-lg border border-border/50 bg-accent/30 p-3 text-sm hover:bg-accent/60 transition-colors"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {messages.map((m) => (
                <div key={m.id} className={`flex gap-3 ${m.role === "user" ? "justify-end" : ""}`}>
                  {m.role === "assistant" && (
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600">
                      <Bot className="h-4 w-4 text-white" />
                    </div>
                  )}
                  <div className={`rounded-xl px-4 py-3 max-w-[80%] text-sm leading-relaxed ${
                    m.role === "user"
                      ? "bg-indigo-500 text-white"
                      : "bg-accent/50"
                  }`}>
                    <p className="whitespace-pre-wrap">{getMessageText(m)}</p>
                  </div>
                  {m.role === "user" && (
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-accent">
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
                  <div className="rounded-xl bg-accent/50 px-4 py-3">
                    <div className="flex gap-1">
                      <span className="h-2 w-2 rounded-full bg-muted-foreground/50 animate-bounce" />
                      <span className="h-2 w-2 rounded-full bg-muted-foreground/50 animate-bounce [animation-delay:150ms]" />
                      <span className="h-2 w-2 rounded-full bg-muted-foreground/50 animate-bounce [animation-delay:300ms]" />
                    </div>
                  </div>
                </div>
              )}
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
            <Button type="submit" disabled={isLoading || !input.trim()} className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white">
              <Send className="h-4 w-4" />
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
