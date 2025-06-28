import { SpeechState } from "../types/terminal";

interface TerminalFooterProps {
  speechState: SpeechState;
}

export function TerminalFooter({ speechState }: TerminalFooterProps) {
  return (
    <div className="mt-4 text-center text-xs">
      <p className="text-gray-400">
        <span className="text-purple-400">SPACEBAR</span>: voice |
        <span className="text-cyan-400"> ↑↓</span>: history |
        <span className="text-red-400"> ESC</span>: stop |
        <span className="text-yellow-400"> Ctrl+L</span>: clear |
        <span
          className={
            speechState.isTTSEnabled ? "text-green-400" : "text-red-400"
          }
        >
          {" "}
          🔊TTS
        </span>
        : {speechState.isTTSEnabled ? "ON" : "OFF"} |
        <span className="text-green-400"> &quot;help&quot;</span>: commands
      </p>
      <p
        className={`mt-1 ${
          speechState.isSpacebarPressed
            ? "text-purple-300 animate-pulse"
            : "text-gray-500"
        }`}
      >
        {speechState.isSpacebarPressed
          ? "🎤 Voice input active - release spacebar to stop"
          : "Press and hold SPACEBAR to activate voice input"}
      </p>
    </div>
  );
}
