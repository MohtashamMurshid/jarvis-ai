import { useRef, useEffect } from "react";
import { Message, SpeechState, TerminalStatus } from "../types/terminal";
import { Ear, Loader2, Mic, Pencil, Speaker, Wrench } from "lucide-react";

interface AIMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt?: Date;
  toolUsed?: string;
}

interface TerminalOutputProps {
  messages: Message[];
  aiMessages: AIMessage[];
  isLoading: boolean;
  speechState: SpeechState;
  status: TerminalStatus;
}

const ProcessingIndicator = ({ status }: { status: TerminalStatus }) => {
  const getIcon = () => {
    switch (status.type) {
      case "thinking":
        return <Loader2 className="animate-spin" />;
      case "using_tools":
        return <Wrench className="animate-spin" />;
      case "writing":
        return <Pencil className="animate-spin" />;
      case "processing":
        return <Loader2 className="animate-spin" />;
      case "speaking":
        return <Speaker className="animate-spin" />;
      case "listening":
        return <Ear className="animate-spin" />;
      case "recording":
        return <Mic className="animate-spin" />;
      default:
        return <Loader2 className="animate-spin" />;
    }
  };

  const getColor = () => {
    switch (status.type) {
      case "thinking":
        return "text-purple-400";
      case "using_tools":
        return "text-yellow-400";
      case "writing":
        return "text-green-400";
      case "processing":
        return "text-blue-400";
      case "speaking":
        return "text-cyan-400";
      case "listening":
      case "recording":
        return "text-red-400";
      default:
        return "text-gray-400";
    }
  };

  return (
    <div className="flex items-start mb-2">
      <div className="w-8 h-8 flex-shrink-0 mr-2 flex items-center justify-center">
        <span className={`text-2xl ${getColor()}`}>
          {status.icon || getIcon()}
        </span>
      </div>
      <div>
        <div className="text-sm text-green-300">
          <span className="font-bold">JARVIS</span>
        </div>
        <div className={`whitespace-pre-wrap ${getColor()} animate-pulse mt-1`}>
          {status.text}...
        </div>
      </div>
    </div>
  );
};

export function TerminalOutput({
  messages,
  aiMessages,
  isLoading,
  speechState,
  status,
}: TerminalOutputProps) {
  const chatContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (chatContainerRef.current) {
      const scrollContainer = chatContainerRef.current;
      const isAtBottom =
        scrollContainer.scrollHeight - scrollContainer.scrollTop <=
        scrollContainer.clientHeight + 100;

      if (isAtBottom) {
        setTimeout(() => {
          scrollContainer.scrollTo({
            top: scrollContainer.scrollHeight,
            behavior: "smooth",
          });
        }, 100);
      }
    }
  }, [messages, aiMessages, speechState, status]);

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
        toolUsed: m.toolUsed,
      })),
  ].sort((a, b) => {
    const aDate = new Date(a.timestamp || 0).getTime();
    const bDate = new Date(b.timestamp || 0).getTime();
    if (!a.timestamp) return 1;
    if (!b.timestamp) return -1;
    return aDate - bDate;
  });

  return (
    <div ref={chatContainerRef} className="h-full overflow-y-auto pr-2 pb-4">
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
      {isLoading && <ProcessingIndicator status={status} />}
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
