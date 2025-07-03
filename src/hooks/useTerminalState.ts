import { useState, useCallback } from "react";
import type { TerminalStatus } from "@/types/terminal";

interface Message {
  id: string;
  text: string;
  sender: "user" | "jarvis";
  timestamp: Date;
  command?: string;
}

export function useTerminalState() {
  const [status, setStatus] = useState<TerminalStatus>({
    text: "READY",
    type: "ready",
  });

  const [messages, setMessages] = useState<Message[]>([
    {
      id: "boot",
      text: "Mohtasham Dev - JARVIS TERMINAL v1.1.2",
      sender: "jarvis",
      timestamp: new Date(),
    },
    {
      id: "init",
      text: "Initializing AI systems... [OK]",
      sender: "jarvis",
      timestamp: new Date(),
    },
    {
      id: "ready",
      text: "JARVIS online. Awaiting commands, Mr. Mohtasham.",
      sender: "jarvis",
      timestamp: new Date(),
    },
  ]);

  const [commandHistory, setCommandHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [currentTime, setCurrentTime] = useState(new Date());

  const addMessage = useCallback((text: string, sender: "user" | "jarvis") => {
    setMessages((prev) => [
      ...prev,
      {
        id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        text,
        sender,
        timestamp: new Date(),
      },
    ]);
  }, []);

  const clearMessages = useCallback(() => {
    setMessages([]);
  }, []);

  const updateStatus = useCallback((newStatus: TerminalStatus | string) => {
    if (typeof newStatus === "string") {
      setStatus({
        text: newStatus,
        type: newStatus.toLowerCase().includes("error") ? "error" : "ready",
      });
    } else {
      setStatus(newStatus);
    }
  }, []);

  const addToHistory = useCallback((command: string) => {
    setCommandHistory((prev) => [...prev, command]);
    setHistoryIndex(-1);
  }, []);

  const navigateHistory = useCallback(
    (direction: "up" | "down") => {
      if (
        direction === "up" &&
        commandHistory.length > 0 &&
        historyIndex < commandHistory.length - 1
      ) {
        const newIndex = historyIndex + 1;
        setHistoryIndex(newIndex);
        return commandHistory[commandHistory.length - 1 - newIndex];
      } else if (direction === "down") {
        if (historyIndex > 0) {
          const newIndex = historyIndex - 1;
          setHistoryIndex(newIndex);
          return commandHistory[commandHistory.length - 1 - newIndex];
        } else if (historyIndex === 0) {
          setHistoryIndex(-1);
          return "";
        }
      }
      return null;
    },
    [commandHistory, historyIndex]
  );

  return {
    status,
    messages,
    commandHistory,
    historyIndex,
    currentTime,
    setCurrentTime,
    addMessage,
    clearMessages,
    updateStatus,
    addToHistory,
    navigateHistory,
  };
}
