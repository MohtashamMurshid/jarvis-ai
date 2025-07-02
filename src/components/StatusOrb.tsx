import type { TerminalStatus } from "@/types/terminal";
import type { Message as AIMessage } from "@ai-sdk/react";

interface StatusOrbProps {
  status: TerminalStatus;
  isLoading: boolean;
  isRecording: boolean;
  isSpeaking: boolean;
  aiMessages: AIMessage[];
}

export function StatusOrb({
  status,
  isLoading,
  isRecording,
  isSpeaking,
  aiMessages,
}: StatusOrbProps) {
  const getStatusText = () => {
    if (isLoading) return "PROCESSING";
    if (isRecording) return "LISTENING";
    if (isSpeaking) return "RESPONDING";
    return "STANDBY";
  };

  const isActive = isSpeaking || isRecording;

  return (
    <div className="w-80 border-l border-green-500/30 bg-black/95 flex flex-col items-center justify-center p-8">
      <div className="text-center mb-8">
        <div className="text-green-400 font-bold text-lg mb-2">
          AI CORE STATUS
        </div>
        <div className="text-green-300/60 text-sm">{getStatusText()}</div>
      </div>

      {/* Central Orb */}
      <div className="relative mb-8">
        {/* Outer Rings */}
        <div
          className={`absolute inset-0 rounded-full border border-green-400/30 ${
            isActive ? "animate-ping" : ""
          }`}
          style={{
            width: "200px",
            height: "200px",
            left: "-25px",
            top: "-25px",
          }}
        />
        <div
          className={`absolute inset-0 rounded-full border border-cyan-400/20 ${
            isActive ? "animate-pulse" : ""
          }`}
          style={{
            width: "180px",
            height: "180px",
            left: "-15px",
            top: "-15px",
          }}
        />

        {/* Main Orb */}
        <div
          className={`relative w-36 h-36 rounded-full bg-gradient-to-br from-green-400/80 via-cyan-500/60 to-green-600/80 shadow-2xl transition-all duration-300 ${
            isActive ? "shadow-green-400/50 scale-110" : "shadow-green-400/30"
          }`}
        >
          {/* Inner Glow */}
          <div
            className={`absolute inset-3 rounded-full bg-gradient-to-br from-white/20 to-transparent ${
              isActive ? "animate-pulse" : ""
            }`}
          />

          {/* Core */}
          <div
            className={`absolute inset-6 rounded-full bg-gradient-to-br from-green-200 to-cyan-400 ${
              isActive ? "animate-bounce" : "animate-pulse"
            }`}
          />

          {/* Center Dot */}
          <div className="absolute inset-1/2 w-3 h-3 -ml-1.5 -mt-1.5 rounded-full bg-white shadow-lg" />

          {/* Terminal-style Data Streams */}
          {isActive && (
            <div className="absolute inset-0 rounded-full overflow-hidden">
              <div className="absolute inset-0 animate-spin">
                <div className="absolute top-1 left-1/2 w-1 h-4 bg-green-300 -ml-0.5 opacity-80" />
                <div className="absolute bottom-1 left-1/2 w-1 h-4 bg-green-300 -ml-0.5 opacity-80" />
                <div className="absolute left-1 top-1/2 w-4 h-1 bg-green-300 -mt-0.5 opacity-80" />
                <div className="absolute right-1 top-1/2 w-4 h-1 bg-green-300 -mt-0.5 opacity-80" />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* System Stats */}
      <div className="w-full space-y-2 text-xs">
        <div className="flex justify-between text-green-400">
          <span>MODEL:</span>
          <span>GPT-4-MINI</span>
        </div>
        <div className="flex justify-between text-green-400">
          <span>TOOLS:</span>
          <span>
            {aiMessages.reduce((count, msg) => {
              // Handle the tool usage counting more safely for AI SDK Message type
              if (msg.role === "assistant" && msg.toolInvocations) {
                return count + msg.toolInvocations.length;
              }
              return count;
            }, 0)}{" "}
            USED
          </span>
        </div>
        <div className="flex justify-between text-green-400">
          <span>VOICE:</span>
          <span>
            {isRecording ? "RECORDING" : isSpeaking ? "SPEAKING" : "READY"}
          </span>
        </div>
        <div className="flex justify-between text-cyan-400">
          <span>STATUS:</span>
          <span>{status.text}</span>
        </div>
      </div>
    </div>
  );
}
