import { useState } from "react";
import { Message } from "../types/terminal";
import { INITIAL_MESSAGE } from "../lib/constants";

interface UseMessagesProps {
  append?: (message: { role: "user" | "assistant"; content: string }) => void;
}

export function useMessages({ append }: UseMessagesProps) {
  const [messages, setMessages] = useState<Message[]>([INITIAL_MESSAGE]);

  const addMessage = (content: string, sender: "user" | "assistant") => {
    if (sender === "assistant" || content.startsWith(">")) {
      setMessages((prev) => [
        ...prev,
        {
          id: `local-${Date.now()}`,
          content,
          sender,
          timestamp: new Date().toLocaleTimeString(),
          isHTML: false,
        },
      ]);
    } else {
      if (append) {
        append({
          role: "user",
          content: content,
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
