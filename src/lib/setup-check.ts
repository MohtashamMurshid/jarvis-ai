// Setup check utility to help diagnose speech-to-text issues

export interface SetupStatus {
  openai: boolean;
  elevenlabs: boolean;
  exa: boolean;
  weather: boolean;
  speechRecognition: boolean;
  mediaRecorder: boolean;
  https: boolean;
}

export function checkSetup(): SetupStatus {
  const status: SetupStatus = {
    openai: false,
    elevenlabs: false,
    exa: false,
    weather: false,
    speechRecognition: false,
    mediaRecorder: false,
    https: false,
  };

  // Check browser capabilities
  if (typeof window !== "undefined") {
    // Check if we're on HTTPS (required for microphone access)
    status.https =
      window.location.protocol === "https:" ||
      window.location.hostname === "localhost";

    // Check speech recognition support
    status.speechRecognition =
      "webkitSpeechRecognition" in window || "SpeechRecognition" in window;

    // Check MediaRecorder support
    status.mediaRecorder = typeof MediaRecorder !== "undefined";
  }

  return status;
}

export function getSetupReport(): string[] {
  const status = checkSetup();
  const report: string[] = [];

  report.push("🔧 JARVIS Setup Status Report");
  report.push("================================");

  // Browser capabilities
  report.push("\n📱 Browser Capabilities:");
  report.push(
    `  HTTPS/Localhost: ${status.https ? "✅" : "❌"} ${
      !status.https ? "(Required for microphone access)" : ""
    }`
  );
  report.push(
    `  Speech Recognition: ${status.speechRecognition ? "✅" : "❌"} ${
      !status.speechRecognition ? "(Browser fallback unavailable)" : ""
    }`
  );
  report.push(
    `  MediaRecorder: ${status.mediaRecorder ? "✅" : "❌"} ${
      !status.mediaRecorder ? "(Voice recording unavailable)" : ""
    }`
  );

  // API Keys (we can't check these from client side for security)
  report.push("\n🔑 API Configuration:");
  report.push("  OpenAI API Key: Check server logs for status");
  report.push("  ElevenLabs API Key: Optional for premium TTS");
  report.push("  Exa API Key: Optional for neural search");
  report.push("  Weather API Key: Optional for weather commands");

  // Setup instructions
  report.push("\n🚀 Setup Instructions:");
  if (!status.https) {
    report.push("  ⚠️ Use HTTPS or localhost for microphone access");
  }
  if (!status.speechRecognition) {
    report.push(
      "  ⚠️ Browser doesn't support speech recognition - use Chrome/Edge"
    );
  }
  if (!status.mediaRecorder) {
    report.push(
      "  ⚠️ Browser doesn't support MediaRecorder - update your browser"
    );
  }

  report.push("  📝 Create .env.local file with your API keys");
  report.push("  🔄 Restart development server after adding API keys");
  report.push("  🎤 Allow microphone permissions when prompted");

  return report;
}

export function getQuickSetupInstructions(): string {
  return `To enable speech-to-text functionality:

1. Create a .env.local file in your project root
2. Add your OpenAI API key:
   OPENAI_API_KEY=your_key_here
3. Restart the development server
4. Allow microphone permissions when prompted

For help getting API keys, check SETUP.md`;
}
