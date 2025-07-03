import { useRef, useEffect } from "react";
import type { Message as AIMessage } from "@ai-sdk/react";
import { MarkdownRenderer } from "./MarkdownRenderer";

interface Message {
  id: string;
  text: string;
  sender: "user" | "jarvis";
  timestamp: Date;
  command?: string;
}

interface MessageListProps {
  messages: Message[];
  aiMessages: AIMessage[];
  isLoading: boolean;
}

export function MessageList({
  messages,
  aiMessages,
  isLoading,
}: MessageListProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, aiMessages]);

  return (
    <div
      className="flex-1 p-4 overflow-y-auto bg-black/90"
      style={{ fontFamily: "Courier New, monospace" }}
    >
      <div className="space-y-2">
        {messages.map((message) => (
          <div key={`local-${message.id}`} className="group">
            {message.sender === "user" ? (
              <div className="flex items-start space-x-2">
                <span className="text-cyan-400 font-bold">
                  jarvis@mohtasham:~$
                </span>
                <span className="text-white">{message.text}</span>
              </div>
            ) : (
              <div className="text-green-400 whitespace-pre-line leading-relaxed">
                <MarkdownRenderer content={message.text} />
              </div>
            )}
            <div className="text-green-600/40 text-xs mt-1">
              [{message.timestamp.toLocaleTimeString()}]
            </div>
          </div>
        ))}
        {aiMessages.map((message) => (
          <div key={`ai-${message.id}`} className="group">
            {message.role === "user" ? (
              <div className="flex items-start space-x-2">
                <span className="text-cyan-400 font-bold">
                  jarvis@mohtasham:~$
                </span>
                <span className="text-white">{message.content}</span>
              </div>
            ) : (
              <div className="text-green-400 whitespace-pre-line leading-relaxed">
                <MarkdownRenderer content={message.content as string} />
              </div>
            )}
            <div className="text-green-600/40 text-xs mt-1">
              [{message.createdAt?.toLocaleTimeString()}]
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex items-center space-x-2 text-green-400">
            <span>JARVIS:</span>
            <div className="flex space-x-1">
              <span className="animate-pulse">█</span>
              <span
                className="animate-pulse"
                style={{ animationDelay: "0.2s" }}
              >
                █
              </span>
              <span
                className="animate-pulse"
                style={{ animationDelay: "0.4s" }}
              >
                █
              </span>
            </div>
            <span className="text-green-300/60">Processing...</span>
          </div>
        )}
      </div>
      <div ref={messagesEndRef} />
    </div>
  );
}
