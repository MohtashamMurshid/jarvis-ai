import { COMMAND_ALIASES, HELP_TEXT } from "./constants";
import { getSetupReport, getQuickSetupInstructions } from "./setup-check";
import { TerminalStatus } from "../types/terminal";

interface CommandProcessorDependencies {
  addMessage: (
    content: string,
    sender: "user" | "assistant",
    toolUsed?: string
  ) => void;
  clearTerminal: () => void;
  setStatus: (status: string | TerminalStatus) => void;
  stopAllActivity: () => void;
  setIsTTSEnabled: (enabled: boolean) => void;
  append?: (message: {
    role: "user" | "assistant";
    content: string;
    toolUsed?: string;
  }) => void;
}

export class CommandProcessor {
  private deps: CommandProcessorDependencies;

  constructor(dependencies: CommandProcessorDependencies) {
    this.deps = dependencies;
  }

  private setProcessingState(
    type: TerminalStatus["type"],
    text: string,
    toolName?: string
  ) {
    this.deps.setStatus({ type, text, toolName });
  }

  async process(message: string): Promise<void> {
    const { addMessage, clearTerminal, stopAllActivity, append } = this.deps;
    const lowerMessage = message.toLowerCase();

    // Check for aliases
    const firstWord = lowerMessage.split(" ")[0];
    if (COMMAND_ALIASES[firstWord]) {
      const aliasedCommand = lowerMessage.replace(
        firstWord,
        COMMAND_ALIASES[firstWord]
      );
      return this.process(aliasedCommand);
    }

    // Built-in commands
    switch (lowerMessage) {
      case "clear":
        addMessage("🧹 Terminal cleared", "assistant", "clear");
        setTimeout(clearTerminal, 500);
        return;

      case "help":
        this.setProcessingState(
          "writing",
          "Generating help information",
          "help"
        );
        addMessage(HELP_TEXT, "assistant", "help");
        this.setProcessingState("ready", "READY");
        return;

      case "setup":
        this.setProcessingState(
          "using_tools",
          "Checking system configuration",
          "setup-check"
        );
        const setupReport = getSetupReport();
        const reportText = setupReport.join("\n");
        addMessage(reportText, "assistant", "setup-check");

        if (
          !window.location.protocol.includes("https") &&
          window.location.hostname !== "localhost"
        ) {
          addMessage(
            "\n❌ CRITICAL: You need HTTPS or localhost for microphone access!",
            "assistant",
            "setup-check"
          );
        }

        addMessage(
          "\n" + getQuickSetupInstructions(),
          "assistant",
          "setup-check"
        );
        this.setProcessingState("ready", "READY");
        return;

      case "stop talking":
        stopAllActivity();
        addMessage(
          "🔇 Speech synthesis stopped.",
          "assistant",
          "text-to-speech"
        );
        return;
    }

    // General AI responses
    if (append) {
      this.setProcessingState("thinking", "Processing your request", "chat");
      append({
        role: "user",
        content: message,
        toolUsed: "chat",
      });
    }

    this.setProcessingState("ready", "READY");
  }
}
