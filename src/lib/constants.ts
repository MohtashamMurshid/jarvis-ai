export const COMMAND_ALIASES: { [key: string]: string } = {
  cls: "clear",
  exit: "clear",
  quit: "clear",
  h: "help",
  "?": "help",
  w: "weather",
  s: "search",
  config: "setup",
  check: "setup",
};

export const HELP_TEXT = `JARVIS Terminal Help
===================

📋 COMMANDS:
• help, h, ? - Show this help
• setup - Check speech-to-text configuration
• clear, cls - Clear terminal  
• weather [location], w [location] - Get weather info
• search [query], s [query] - Search the web
• [any question] - Ask AI anything

⌨️  KEYBOARD SHORTCUTS:
• SPACEBAR (hold) - Voice input
• ESC - Emergency stop all activity
• ↑/↓ arrows - Navigate command history
• Ctrl+L - Clear terminal (standard)
• Enter - Execute command

🎤 VOICE COMMANDS:
• Hold SPACEBAR and speak any command
• "stop talking" - Interrupt speech synthesis

🔊 TEXT-TO-SPEECH:
• Click TTS toggle button in header to enable/disable
• When disabled, responses appear as text only
• Voice commands still work normally

🔧 TROUBLESHOOTING:
• Type "setup" to check voice configuration
• Ensure microphone permissions are granted
• Use HTTPS or localhost for voice features
• Check browser console for detailed errors

💡 TIPS:
• Commands are case-insensitive
• History stores your last 50 unique commands
• Use aliases: h=help, w=weather, s=search, cls=clear
• Type partial commands then use ↑ for completion
• AI has conversation context (remembers previous messages)
• Long conversations are automatically optimized for performance

🎨 COLOR CODING:
• Cyan - User input and system prompts
• Green - AI responses and help text
• Yellow - Search results and processing
• Blue - Weather data and speech activity
• Purple - Voice recognition and shortcuts
• Red - Errors and emergency stops`;

export const MAX_HISTORY_LENGTH = 50;

export const SPEECH_RECOGNITION_SETTINGS = {
  continuous: false,
  interimResults: false,
  lang: "en-US",
  maxAlternatives: 1,
} as const;

export const INITIAL_MESSAGE = {
  id: "init",
  content: `JARVIS Terminal v1.0.0 - AI Assistant Interface
=====================================
System Status: ONLINE
Voice Recognition: READY
Text Processing: READY


Ready for input...`,
  sender: "assistant" as const,
  timestamp: new Date().toLocaleTimeString(),
};
