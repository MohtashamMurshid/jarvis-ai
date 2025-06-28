import { useState } from "react";
import { MAX_HISTORY_LENGTH } from "../lib/constants";

interface UseCommandHistoryProps {
  onInputChange: (value: string) => void;
}

export function useCommandHistory({ onInputChange }: UseCommandHistoryProps) {
  const [commandHistory, setCommandHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  const addToHistory = (command: string) => {
    if (command.trim() && !commandHistory.includes(command.trim())) {
      setCommandHistory((prev) =>
        [...prev, command.trim()].slice(-MAX_HISTORY_LENGTH)
      );
    }
    setHistoryIndex(-1);
  };

  const navigateHistory = (direction: "up" | "down") => {
    if (commandHistory.length === 0) return;

    if (direction === "up") {
      const newIndex =
        historyIndex === -1
          ? commandHistory.length - 1
          : Math.max(0, historyIndex - 1);
      setHistoryIndex(newIndex);
      onInputChange(commandHistory[newIndex]);
    } else {
      if (historyIndex === -1) return;
      const newIndex = historyIndex + 1;
      if (newIndex >= commandHistory.length) {
        setHistoryIndex(-1);
        onInputChange("");
      } else {
        setHistoryIndex(newIndex);
        onInputChange(commandHistory[newIndex]);
      }
    }
  };

  return {
    commandHistory,
    historyIndex,
    addToHistory,
    navigateHistory,
  };
}
