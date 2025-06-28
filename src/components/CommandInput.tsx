import { useRef } from "react";

interface CommandInputProps {
  input: string;
  historyIndex: number;
  commandHistoryLength: number;
  isLoading: boolean;
  onInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSendMessage: () => void;
}

export function CommandInput({
  input,
  historyIndex,
  commandHistoryLength,
  isLoading,
  onInputChange,
  onSendMessage,
}: CommandInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="flex items-center border border-cyan-400 bg-gray-900">
      <span className="text-cyan-300 px-3 py-2 flex-shrink-0">
        jarvis@terminal:~$
      </span>
      <input
        ref={inputRef}
        type="text"
        value={input}
        onChange={onInputChange}
        onKeyPress={(e) => e.key === "Enter" && onSendMessage()}
        placeholder="Type command or hold SPACEBAR for voice input..."
        className="flex-1 px-2 py-2 bg-gray-900 text-cyan-400 placeholder-gray-500 border-none outline-none font-mono"
        disabled={isLoading}
      />
      {historyIndex >= 0 && (
        <span className="text-yellow-400 text-xs px-2">
          [{historyIndex + 1}/{commandHistoryLength}]
        </span>
      )}
    </div>
  );
}
