"use client";

import { useState, useEffect } from "react";
import { useChat } from "@ai-sdk/react";
import { TerminalHeader } from "../components/TerminalHeader";
import { TerminalOutput } from "../components/TerminalOutput";
import { CommandInput } from "../components/CommandInput";
import { TerminalFooter } from "../components/TerminalFooter";
import { useSpeechRecognition } from "../hooks/useSpeechRecognition";
import { useTextToSpeech } from "../hooks/useTextToSpeech";
import { useCommandHistory } from "../hooks/useCommandHistory";
import { useMessages } from "../hooks/useMessages";
import { CommandProcessor } from "../lib/commandProcessor";
import type { TerminalStatus } from "../types/terminal";

interface AIMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt?: Date;
}

export default function JarvisAssistant() {
  const [status, setStatus] = useState<TerminalStatus>({
    text: "READY",
    type: "ready",
  });
  const [isSpacebarPressed, setIsSpacebarPressed] = useState(false);

  const {
    messages: aiMessages,
    input,
    handleInputChange,
    isLoading,
    append,
  } = useChat({
    api: "/api/chat",
    onFinish: (message) => {
      if (
        isTTSEnabled &&
        message &&
        message.content &&
        typeof message.content === "string" &&
        message.content.trim().length > 0
      ) {
        console.log(
          "AI message finished, attempting to speak:",
          message.content.slice(0, 100) + "..."
        );
        setTimeout(() => {
          if (
            isTTSEnabled &&
            message.content &&
            message.content.trim().length > 0
          ) {
            speak(message.content);
          }
        }, 100);
      } else {
        console.log("No valid message content to speak or TTS disabled");
      }
    },
  });

  const { messages, addMessage, clearMessages } = useMessages({
    append: (message) => append({ ...message, id: `local-${Date.now()}` }),
  });

  const { commandHistory, historyIndex, addToHistory, navigateHistory } =
    useCommandHistory({
      onInputChange: (value) =>
        handleInputChange({
          target: { value },
        } as React.ChangeEvent<HTMLInputElement>),
    });

  const { isSpeaking, isTTSEnabled, speak, stopSpeaking, toggleTTS } =
    useTextToSpeech({
      onStatusChange: (text) =>
        setStatus({
          text,
          type: text.toLowerCase().includes("error") ? "error" : "speaking",
        }),
    });

  const stopAllActivity = () => {
    stopSpeaking();
    setIsSpacebarPressed(false);
    setStatus({ text: "READY", type: "ready" });
  };

  const commandProcessor = new CommandProcessor({
    addMessage,
    clearTerminal: clearMessages,
    setStatus: (text) =>
      setStatus({
        text,
        type: text.toLowerCase().includes("error") ? "error" : "ready",
      }),
    stopAllActivity,
    setIsTTSEnabled: () => {
      const newState = toggleTTS();
      addMessage(
        `🔊 Text-to-Speech ${newState ? "enabled" : "disabled"}`,
        "assistant"
      );
    },
    append: (message) => append({ ...message, id: `local-${Date.now()}` }),
  });

  const {
    isListening,
    isRecording,
    startWhisperRecording,
    stopWhisperRecording,
  } = useSpeechRecognition({
    onTranscript: (transcript) => {
      handleInputChange({
        target: { value: "" },
      } as React.ChangeEvent<HTMLInputElement>);
      setStatus({ text: `VOICE: ${transcript}`, type: "processing" });
      addMessage(`> ${transcript}`, "user");
      addToHistory(transcript);
      commandProcessor.process(transcript);
    },
    onError: (error) => setStatus({ text: error, type: "error" }),
    onStatusChange: (text) =>
      setStatus({
        text,
        type: text.toLowerCase().includes("error") ? "error" : "processing",
      }),
  });

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (
        event.code === "Space" &&
        !isSpacebarPressed &&
        document.activeElement?.tagName !== "INPUT"
      ) {
        event.preventDefault();
        setIsSpacebarPressed(true);
        startWhisperRecording();
      }

      if (event.code === "Escape") {
        event.preventDefault();
        stopAllActivity();
      }

      if (document.activeElement?.tagName === "INPUT") {
        if (event.code === "ArrowUp") {
          event.preventDefault();
          navigateHistory("up");
        } else if (event.code === "ArrowDown") {
          event.preventDefault();
          navigateHistory("down");
        }
      }

      if (event.ctrlKey && event.code === "KeyL") {
        event.preventDefault();
        clearMessages();
      }
    };

    const handleKeyUp = (event: KeyboardEvent) => {
      if (event.code === "Space" && isSpacebarPressed) {
        event.preventDefault();
        setIsSpacebarPressed(false);
        stopWhisperRecording();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("keyup", handleKeyUp);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("keyup", handleKeyUp);
    };
  }, [isSpacebarPressed, commandHistory, historyIndex]);

  const sendMessage = () => {
    const message = input.trim();
    if (!message) return;

    addToHistory(message);
    commandProcessor.process(message);
    handleInputChange({
      target: { value: "" },
    } as React.ChangeEvent<HTMLInputElement>);
  };

  const speechState = {
    isListening,
    isRecording,
    isSpeaking,
    isTTSEnabled,
    isSpacebarPressed,
  };

  return (
    <div className="min-h-screen bg-black text-green-400 font-mono overflow-hidden">
      <div className="container mx-auto px-4 py-2 max-w-4xl">
        <TerminalHeader
          status={status}
          speechState={speechState}
          commandHistoryLength={commandHistory.length}
          isLoading={isLoading}
          onToggleTTS={toggleTTS}
        />

        <TerminalOutput
          messages={messages}
          aiMessages={aiMessages as AIMessage[]}
          isLoading={isLoading}
          speechState={speechState}
        />

        <CommandInput
          input={input}
          historyIndex={historyIndex}
          commandHistoryLength={commandHistory.length}
          isLoading={isLoading}
          onInputChange={handleInputChange}
          onSendMessage={sendMessage}
        />

        <TerminalFooter speechState={speechState} />
      </div>

      <style jsx>{`
        ::-webkit-scrollbar {
          width: 8px;
        }
        ::-webkit-scrollbar-track {
          background: #1f2937;
        }
        ::-webkit-scrollbar-thumb {
          background: #22d3ee;
          border-radius: 4px;
        }
        ::-webkit-scrollbar-thumb:hover {
          background: #06b6d4;
        }
      `}</style>
    </div>
  );
}
