"use client";

import { useEffect, useState } from "react";
import { Terminal } from "lucide-react";
import { useChat } from "@ai-sdk/react";
import { useSpeechRecognition } from "@/hooks/useSpeechRecognition";
import { useTextToSpeech } from "@/hooks/useTextToSpeech";
import { useTerminalState } from "@/hooks/useTerminalState";
import { CommandProcessor } from "@/lib/commandProcessor";
import { MessageList } from "@/components/MessageList";
import { InputArea } from "@/components/InputArea";
import { StatusOrb } from "@/components/StatusOrb";

export default function JarvisTerminal() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState("");

  const {
    status,
    messages,
    currentTime,
    setCurrentTime,
    addMessage,
    clearMessages,
    updateStatus,
    addToHistory,
    navigateHistory,
  } = useTerminalState();

  const {
    messages: aiMessages,
    input,
    handleInputChange,
    isLoading,
    append,
    setMessages: setAiMessages,
  } = useChat({
    api: "/api/chat",
    headers: password
      ? {
          "X-Password": password,
        }
      : {},
    onFinish: (message) => {
      if (
        isTTSEnabled &&
        message &&
        message.content &&
        typeof message.content === "string" &&
        message.content.trim().length > 0
      ) {
        speak(message.content);
      }
      updateStatus({ type: "ready", text: "READY" });
    },
  });

  const { isSpeaking, isTTSEnabled, speak, stopSpeaking, toggleTTS } =
    useTextToSpeech({
      onStatusChange: (text) =>
        updateStatus({
          text,
          type: text.toLowerCase().includes("error") ? "error" : "speaking",
        }),
      password: password,
    });

  const stopAllActivity = () => {
    stopSpeaking();
    updateStatus({ text: "READY", type: "ready" });
  };

  const commandProcessor = new CommandProcessor({
    addMessage: (content, sender) =>
      addMessage(content, sender === "user" ? "user" : "jarvis"),
    clearTerminal: () => {
      clearMessages();
      setAiMessages([]);
    },
    setStatus: updateStatus,
    stopAllActivity,
    setIsTTSEnabled: () => {
      const newState = toggleTTS();
      addMessage(
        `🔊 Text-to-Speech ${newState ? "enabled" : "disabled"}`,
        "jarvis"
      );
    },
    append: (message) => {
      updateStatus({
        type: "thinking",
        text: "Processing your request",
        toolName: "chat",
      });
      append({
        ...message,
        id: `local-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      });
    },
  });

  const { isRecording, startWhisperRecording, stopWhisperRecording } =
    useSpeechRecognition({
      onTranscript: (transcript) => {
        handleInputChange({
          target: { value: "" },
        } as React.ChangeEvent<HTMLInputElement>);
        updateStatus({ text: `VOICE: ${transcript}`, type: "processing" });
        addMessage(`> ${transcript}`, "user");
        addToHistory(transcript);
        commandProcessor.process(transcript);
      },
      onError: (error) => updateStatus({ text: error, type: "error" }),
      onStatusChange: (text) =>
        updateStatus({
          text,
          type: text.toLowerCase().includes("error") ? "error" : "processing",
        }),
      password: password,
    });

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, [setCurrentTime]);

  useEffect(() => {
    addMessage("🔓 Welcome to JARVIS Terminal.", "jarvis");
    updateStatus({ type: "ready", text: "READY" });
  }, []);

  const checkPassword = (inputPassword: string) => {
    // Simple password check - you can change this to your desired password
    const correctPassword = "Mohtasham@11"; // Using the password from your env
    return inputPassword === correctPassword;
  };

  const handleSendMessage = async () => {
    const message = input.trim();
    if (!message) return;

    // If not authenticated, check if this is the password
    if (!isAuthenticated) {
      if (checkPassword(message)) {
        setPassword(message);
        setIsAuthenticated(true);
        addMessage(`> ${message.replace(/./g, "*")}`, "user"); // Show asterisks
        addMessage(
          "🔓 Authentication successful. JARVIS is now active.",
          "jarvis"
        );
        updateStatus({ type: "ready", text: "AUTHENTICATED" });
        handleInputChange({
          target: { value: "" },
        } as React.ChangeEvent<HTMLInputElement>);
        return;
      } else {
        addMessage(`> ${message.replace(/./g, "*")}`, "user"); // Show asterisks
        addMessage(
          "❌ Access denied. Please enter the correct password.",
          "jarvis"
        );
        handleInputChange({
          target: { value: "" },
        } as React.ChangeEvent<HTMLInputElement>);
        return;
      }
    }

    // Normal message processing if authenticated
    addToHistory(message);
    await commandProcessor.process(message);
    handleInputChange({
      target: { value: "" },
    } as React.ChangeEvent<HTMLInputElement>);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSendMessage();
    } else if (e.key === "ArrowUp" && isAuthenticated) {
      e.preventDefault();
      const historyValue = navigateHistory("up");
      if (historyValue !== null) {
        handleInputChange({
          target: { value: historyValue },
        } as React.ChangeEvent<HTMLInputElement>);
      }
    } else if (e.key === "ArrowDown" && isAuthenticated) {
      e.preventDefault();
      const historyValue = navigateHistory("down");
      if (historyValue !== null) {
        handleInputChange({
          target: { value: historyValue },
        } as React.ChangeEvent<HTMLInputElement>);
      }
    }
  };

  const toggleListening = () => {
    if (!isAuthenticated) {
      addMessage(
        "❌ Please authenticate first before using voice commands.",
        "jarvis"
      );
      return;
    }

    if (isRecording) {
      stopWhisperRecording();
    } else {
      startWhisperRecording();
    }
  };

  return (
    <div className="max-h-screen bg-black text-green-400 flex flex-col items-center justify-center p-14 relative overflow-hidden font-mono">
      {/* Terminal Scanlines Effect */}
      <div className="absolute inset-0 bg-[linear-gradient(transparent_50%,rgba(0,255,0,0.03)_50%)] bg-[length:100%_4px] pointer-events-none"></div>

      {/* CRT Glow Effect */}
      <div className="absolute inset-0 bg-gradient-radial from-transparent via-transparent to-black/20 pointer-events-none"></div>

      {/* Main Container */}
      <div className="w-full max-w-6xl mx-auto flex flex-col h-screen relative z-10 border border-green-500/30 bg-black/80 backdrop-blur-sm">
        {/* Terminal Header */}
        <div className="border-b border-green-500/30 p-4 flex items-center justify-between bg-green-500/5">
          <div className="flex items-center space-x-3">
            <Terminal className="h-5 w-5 text-green-400" />
            <span className="text-green-400 font-bold">JARVIS TERMINAL</span>
            <span className="text-green-300/60 text-sm">v1.1.2</span>
            <span className="text-green-300/60 text-sm hidden md:block">
              | {status.text}
            </span>
          </div>
          <div className="flex items-center space-x-4 text-sm">
            <span className="text-green-300/60">
              {currentTime.toLocaleTimeString()}
            </span>
            <div className="flex items-center space-x-1">
              <div
                className={`w-2 h-2 ${
                  isAuthenticated ? "bg-green-400" : "bg-yellow-400"
                } rounded-full animate-pulse`}
              ></div>
              <span
                className={`${
                  isAuthenticated ? "text-green-400" : "text-yellow-400"
                } text-xs`}
              >
                {isAuthenticated ? "ONLINE" : "LOCKED"}
              </span>
            </div>
          </div>
        </div>

        <div className="flex flex-1 overflow-hidden">
          {/* Left Panel - Terminal */}
          <div className="flex-1 flex flex-col">
            <MessageList
              messages={messages}
              aiMessages={aiMessages}
              isLoading={isLoading}
            />
            <InputArea
              input={input}
              isRecording={isRecording}
              isTTSEnabled={isTTSEnabled}
              onInputChange={handleInputChange}
              onKeyPress={handleKeyPress}
              onSendMessage={handleSendMessage}
              onToggleListening={toggleListening}
              onToggleTTS={toggleTTS}
              placeholder={
                isAuthenticated
                  ? "Type your message..."
                  : "Enter password to access JARVIS..."
              }
            />
          </div>

          {/* Right Panel - Orb Display */}
          <StatusOrb
            status={status}
            isLoading={isLoading}
            isRecording={isRecording}
            isSpeaking={isSpeaking}
            aiMessages={aiMessages}
          />
        </div>
      </div>
    </div>
  );
}
