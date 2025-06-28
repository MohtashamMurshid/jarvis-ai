import { COMMAND_ALIASES, HELP_TEXT } from "./constants";
import { getSetupReport, getQuickSetupInstructions } from "./setup-check";

interface CommandProcessorDependencies {
  addMessage: (content: string, sender: "user" | "assistant") => void;
  clearTerminal: () => void;
  setStatus: (status: string) => void;
  stopAllActivity: () => void;
  setIsTTSEnabled: (enabled: boolean) => void;
  append?: (message: { role: "user" | "assistant"; content: string }) => void;
}

export class CommandProcessor {
  private deps: CommandProcessorDependencies;

  constructor(dependencies: CommandProcessorDependencies) {
    this.deps = dependencies;
  }

  async process(message: string): Promise<void> {
    const { addMessage, clearTerminal, setStatus, stopAllActivity, append } =
      this.deps;
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
        addMessage("🧹 Terminal cleared", "assistant");
        setTimeout(clearTerminal, 500);
        return;

      case "help":
        addMessage(HELP_TEXT, "assistant");
        setStatus("READY");
        return;

      case "setup":
        const setupReport = getSetupReport();
        const reportText = setupReport.join("\n");
        addMessage(reportText, "assistant");

        if (
          !window.location.protocol.includes("https") &&
          window.location.hostname !== "localhost"
        ) {
          addMessage(
            "\n❌ CRITICAL: You need HTTPS or localhost for microphone access!",
            "assistant"
          );
        }

        addMessage("\n" + getQuickSetupInstructions(), "assistant");
        setStatus("READY");
        return;

      case "stop talking":
        stopAllActivity();
        addMessage("🔇 Speech synthesis stopped.", "assistant");
        return;
    }

    // General AI responses
    if (append) {
      append({
        role: "user",
        content: message,
      });
    }

    setStatus("READY");
  }
}
