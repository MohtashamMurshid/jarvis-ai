import { useState } from "react";
import { Message } from "../types/terminal";
import { INITIAL_MESSAGE } from "../lib/constants";

interface UseMessagesProps {
  append?: (message: {
    role: "user" | "assistant";
    content: string;
    toolUsed?: string;
  }) => void;
}

export function useMessages({ append }: UseMessagesProps) {
  const [messages, setMessages] = useState<Message[]>([INITIAL_MESSAGE]);

  const addMessage = (
    content: string,
    sender: "user" | "assistant",
    toolUsed?: string
  ) => {
    if (sender === "assistant" || content.startsWith(">")) {
      setMessages((prev) => [
        ...prev,
        {
          id: `local-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          content,
          sender,
          timestamp: new Date().toLocaleTimeString(),
          isHTML: false,
          toolUsed,
        },
      ]);
    } else {
      if (append) {
        append({
          role: "user",
          content: content,
          toolUsed,
        });
      }
    }
  };

  const clearMessages = () => {
    setMessages([]);
  };

  return {
    messages,
    addMessage,
    clearMessages,
  };
}
