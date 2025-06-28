import { TerminalStatus, SpeechState } from "../types/terminal";

interface TerminalHeaderProps {
  status: TerminalStatus;
  speechState: SpeechState;
  commandHistoryLength: number;
  isLoading: boolean;
  onToggleTTS: () => void;
}

export function TerminalHeader({
  status,
  speechState,
  commandHistoryLength,
  isLoading,
  onToggleTTS,
}: TerminalHeaderProps) {
  const getStatusColor = (type: TerminalStatus["type"]) => {
    switch (type) {
      case "error":
        return "text-red-400";
      case "ready":
        return "text-green-400";
      case "listening":
      case "recording":
        return "text-purple-400";
      case "speaking":
        return "text-blue-400";
      case "processing":
        return "text-yellow-400";
      default:
        return "text-orange-400";
    }
  };

  return (
    <div className="border-b border-cyan-400 mb-4 pb-2">
      <div className="flex justify-between items-center">
        <div>
          <span className="text-cyan-300">JARVIS@terminal:~$ </span>
          <span className="text-cyan-400">AI Assistant Interface</span>
        </div>
        <div className="text-right text-sm">
          <div className="text-cyan-300">
            Status:{" "}
            <span className={getStatusColor(status.type)}>{status.text}</span>
            {isLoading && (
              <span className="animate-pulse text-yellow-400"> ⏳</span>
            )}
          </div>
          <div className="text-purple-300 text-xs">
            {speechState.isSpacebarPressed
              ? "🎤 SPACEBAR ACTIVE"
              : "Hold SPACEBAR for voice | ESC to stop"}
          </div>
          <div className="text-blue-400 text-xs">
            History: {commandHistoryLength} commands
          </div>
          <div className="text-right mt-1">
            <button
              onClick={onToggleTTS}
              className={`text-xs px-2 py-1 rounded border transition-colors ${
                speechState.isTTSEnabled
                  ? "border-green-400 text-green-400 hover:bg-green-400/10"
                  : "border-red-400 text-red-400 hover:bg-red-400/10"
              }`}
              title={`Click to ${
                speechState.isTTSEnabled ? "disable" : "enable"
              } text-to-speech`}
            >
              🔊 TTS: {speechState.isTTSEnabled ? "ON" : "OFF"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
