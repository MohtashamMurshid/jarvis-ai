import { useRef, useEffect } from "react";
import { Message, SpeechState } from "../types/terminal";

interface AIMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt?: Date;
}

interface TerminalOutputProps {
  messages: Message[];
  aiMessages: AIMessage[];
  isLoading: boolean;
  speechState: SpeechState;
}

export function TerminalOutput({
  messages,
  aiMessages,
  isLoading,
  speechState,
}: TerminalOutputProps) {
  const chatContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop =
        chatContainerRef.current.scrollHeight;
    }
  }, [
    messages,
    aiMessages,
    speechState.isListening,
    speechState.isRecording,
    speechState.isSpeaking,
  ]);

  const combinedMessages = [
    ...messages,
    ...aiMessages
      .filter((m) => !messages.some((l) => l.id === m.id))
      .map((m) => ({
        id: m.id,
        content: m.role === "user" ? `> ${m.content}` : m.content,
        sender: m.role,
        timestamp: (m.createdAt || new Date()).toLocaleTimeString(),
        isHTML: false,
      })),
  ].sort((a, b) => {
    const aDate = new Date(a.timestamp || 0).getTime();
    const bDate = new Date(b.timestamp || 0).getTime();
    if (!a.timestamp) return 1;
    if (!b.timestamp) return -1;
    return aDate - bDate;
  });

  return (
    <div
      ref={chatContainerRef}
      className="h-[calc(100vh-180px)] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-gray-800"
    >
      {combinedMessages.map((msg, index) => (
        <div
          key={`${msg.id}-${index}`}
          className={`flex flex-col mb-2 ${
            msg.sender === "user" ? "items-start" : "items-start"
          }`}
        >
          <div
            className={`text-sm ${
              msg.sender === "user" ? "text-cyan-300" : "text-green-300"
            }`}
          >
            <span className="font-bold">
              {msg.sender === "user" ? "You" : "JARVIS"}
            </span>
            <span className="text-gray-500 ml-2">{msg.timestamp}</span>
          </div>
          <div
            className={`whitespace-pre-wrap ${
              msg.sender === "user" ? "text-cyan-400" : "text-green-400"
            }`}
            dangerouslySetInnerHTML={
              msg.isHTML ? { __html: msg.content } : undefined
            }
          >
            {!msg.isHTML && msg.content}
          </div>
        </div>
      ))}
      {isLoading && (
        <div className="flex items-start mb-2">
          <div className="w-8 h-8 flex-shrink-0 mr-2">
            <img
              src="/globe.svg"
              alt="AI Globe"
              className="w-full h-full animate-spin-slow"
            />
          </div>
          <div>
            <div className="text-sm text-green-300">
              <span className="font-bold">JARVIS</span>
            </div>
            <div className="whitespace-pre-wrap text-green-400 animate-pulse">
              Thinking...
            </div>
          </div>
        </div>
      )}
      {(speechState.isListening || speechState.isRecording) && (
        <div className="text-purple-400 animate-pulse">
          <span className="text-gray-500 text-xs mr-2">
            [{new Date().toLocaleTimeString()}]
          </span>
          <span className="text-purple-300">
            {speechState.isRecording ? "● RECORDING..." : "● LISTENING..."}
          </span>
        </div>
      )}
      {speechState.isSpeaking && (
        <div className="text-blue-400 animate-pulse">
          <span className="text-gray-500 text-xs mr-2">
            [{new Date().toLocaleTimeString()}]
          </span>
          <span className="text-blue-300">♪ SPEAKING...</span>
        </div>
      )}
    </div>
  );
}
