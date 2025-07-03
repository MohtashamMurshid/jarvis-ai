import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send, Mic, MicOff, Volume2, VolumeX } from "lucide-react";

interface InputAreaProps {
  input: string;
  isRecording: boolean;
  isTTSEnabled: boolean;
  onInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onKeyPress: (e: React.KeyboardEvent) => void;
  onSendMessage: () => void;
  onToggleListening: () => void;
  onToggleTTS: () => void;
  placeholder?: string;
}

export function InputArea({
  input,
  isRecording,
  isTTSEnabled,
  onInputChange,
  onKeyPress,
  onSendMessage,
  onToggleListening,
  onToggleTTS,
  placeholder = "Enter command...",
}: InputAreaProps) {
  return (
    <div className="border-t border-green-500/30 p-4 bg-green-500/5">
      <div className="flex items-center space-x-2">
        <span className="text-cyan-400 font-bold">jarvis@mohtasham:~$</span>
        <Input
          value={input}
          onChange={onInputChange}
          onKeyDown={onKeyPress}
          placeholder={placeholder}
          className="flex-1 bg-transparent border-none text-white placeholder-green-300/50 focus:ring-0 focus:outline-none font-mono"
          style={{ fontFamily: "Courier New, monospace" }}
        />
        <Button
          onClick={onToggleListening}
          variant="ghost"
          size="sm"
          className={`text-green-400 hover:bg-green-500/20 ${
            isRecording ? "bg-green-500/30" : ""
          }`}
        >
          {isRecording ? (
            <MicOff className="h-4 w-4" />
          ) : (
            <Mic className="h-4 w-4" />
          )}
        </Button>
        <Button
          onClick={onToggleTTS}
          variant="ghost"
          size="sm"
          className={`text-green-400 hover:bg-green-500/20 ${
            isTTSEnabled ? "bg-green-500/30" : ""
          }`}
        >
          {isTTSEnabled ? (
            <Volume2 className="h-4 w-4" />
          ) : (
            <VolumeX className="h-4 w-4" />
          )}
        </Button>
        <Button
          onClick={onSendMessage}
          disabled={!input.trim()}
          variant="ghost"
          size="sm"
          className="text-green-400 hover:bg-green-500/20"
        >
          <Send className="h-4 w-4" />
        </Button>
      </div>
      <div className="text-green-600/60 text-xs mt-2">
        Use ↑↓ for command history | Type &apos;help&apos; for available
        commands
      </div>
    </div>
  );
}
