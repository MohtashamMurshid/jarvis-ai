export interface Message {
  id: string;
  content: string;
  sender: "user" | "assistant";
  isHTML?: boolean;
  timestamp?: string;
  toolUsed?: string;
}

export interface TerminalStatus {
  text: string;
  type:
    | "error"
    | "ready"
    | "listening"
    | "recording"
    | "speaking"
    | "thinking"
    | "using_tools"
    | "writing"
    | "processing"
    | "other";
  icon?: string;
  toolName?: string;
}

export interface CommandHistoryState {
  history: string[];
  index: number;
}

export interface SpeechState {
  isListening: boolean;
  isRecording: boolean;
  isSpeaking: boolean;
  isTTSEnabled: boolean;
  isSpacebarPressed: boolean;
}

export interface TerminalProps {
  status: TerminalStatus;
  speechState: SpeechState;
  commandHistory: CommandHistoryState;
  messages: Message[];
  isLoading: boolean;
  input: string;
  onInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSendMessage: () => void;
  onToggleTTS: () => void;
  onClearTerminal: () => void;
}
