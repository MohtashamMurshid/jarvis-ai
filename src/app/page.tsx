"use client";

import { useState, useRef, useEffect } from "react";

interface Message {
  content: string;
  sender: "user" | "assistant";
  isHTML?: boolean;
  timestamp?: string;
}

interface SearchSource {
  title: string;
  url: string;
}

export default function JarvisAssistant() {
  const [messages, setMessages] = useState<Message[]>([
    {
      content: `JARVIS Terminal v1.0.0 - AI Assistant Interface
=====================================
System Status: ONLINE
Voice Recognition: READY
Text Processing: READY

Available Commands:
- Press and hold SPACEBAR for voice input
- Type "help" for command list
- "weather [location]" - Get weather information
- "search [query]" - Search the web
- "clear" - Clear terminal

Ready for input...`,
      sender: "assistant",
      timestamp: new Date().toLocaleTimeString(),
    },
  ]);
  const [inputMessage, setInputMessage] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isSpacebarPressed, setIsSpacebarPressed] = useState(false);
  const [status, setStatus] = useState("READY");
  const [commandHistory, setCommandHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isTTSEnabled, setIsTTSEnabled] = useState(true);

  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const synthesisRef = useRef<SpeechSynthesis | null>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to bottom whenever messages change
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop =
        chatContainerRef.current.scrollHeight;
    }
  }, [messages, isListening, isRecording, isSpeaking]);

  // Auto-focus input field and clear it when not actively using voice
  useEffect(() => {
    if (inputRef.current && !isListening && !isRecording && !isProcessing) {
      inputRef.current.focus();
    }
  }, [isListening, isRecording, isProcessing, messages]);

  useEffect(() => {
    // Initialize speech synthesis
    if (typeof window !== "undefined") {
      synthesisRef.current = window.speechSynthesis;
    }

    // Initialize speech recognition
    if (
      typeof window !== "undefined" &&
      ("webkitSpeechRecognition" in window || "SpeechRecognition" in window)
    ) {
      const SpeechRecognition =
        window.SpeechRecognition || window.webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();

      // Enhanced speech recognition settings
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      recognitionRef.current.lang = "en-US";
      recognitionRef.current.maxAlternatives = 1;

      recognitionRef.current.onstart = () => {
        console.log("Speech recognition started");
        setIsListening(true);
        setStatus("LISTENING...");
      };

      recognitionRef.current.onresult = (event: SpeechRecognitionEvent) => {
        console.log("Browser speech recognition result:", event);
        const transcript = event.results[0][0].transcript.trim();
        const confidence = event.results[0][0].confidence;

        console.log(
          `Browser transcript: "${transcript}", Confidence: ${confidence}`
        );

        setInputMessage("");
        setStatus(`VOICE: ${transcript}`);

        // Add the voice command to the chat and history
        addMessage(`> ${transcript}`, "user");
        addToHistory(transcript);

        // Process the command
        processMessage(transcript);
      };

      recognitionRef.current.onerror = (event: SpeechRecognitionErrorEvent) => {
        console.error("Speech recognition error:", event.error);
        setIsListening(false);

        // Provide specific error messages
        switch (event.error) {
          case "not-allowed":
            setStatus("ERROR: Microphone access denied");
            break;
          case "no-speech":
            setStatus("ERROR: No speech detected");
            break;
          case "audio-capture":
            setStatus("ERROR: Microphone not found");
            break;
          case "network":
            setStatus("ERROR: Network error");
            break;
          case "aborted":
            setStatus("READY");
            break;
          case "language-not-supported":
            setStatus("ERROR: Language not supported");
            break;
          default:
            setStatus(`ERROR: ${event.error}`);
        }
      };

      recognitionRef.current.onend = () => {
        console.log("Speech recognition ended");
        setIsListening(false);
        if (!isSpacebarPressed) {
          setStatus("READY");
        }
      };

      recognitionRef.current.onnomatch = () => {
        console.log("No speech match found");
        setStatus("ERROR: Could not understand speech");
        setIsListening(false);
      };
    } else {
      console.log("Speech recognition not supported in this browser");
      setStatus("ERROR: Voice recognition not supported");
    }

    // Enhanced keyboard event listeners
    const handleKeyDown = (event: KeyboardEvent) => {
      // Spacebar for voice input (only when not typing)
      if (
        event.code === "Space" &&
        !isSpacebarPressed &&
        document.activeElement !== inputRef.current
      ) {
        event.preventDefault();
        setIsSpacebarPressed(true);
        startVoiceInput();
      }

      // Escape to stop everything
      if (event.code === "Escape") {
        event.preventDefault();
        stopAllActivity();
      }

      // Handle command history when input is focused
      if (document.activeElement === inputRef.current) {
        if (event.code === "ArrowUp") {
          event.preventDefault();
          navigateHistory("up");
        } else if (event.code === "ArrowDown") {
          event.preventDefault();
          navigateHistory("down");
        }
      }

      // Ctrl+L to clear terminal
      if (event.ctrlKey && event.code === "KeyL") {
        event.preventDefault();
        clearTerminal();
      }
    };

    const handleKeyUp = (event: KeyboardEvent) => {
      if (event.code === "Space" && isSpacebarPressed) {
        event.preventDefault();
        setIsSpacebarPressed(false);
        stopVoiceInput();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("keyup", handleKeyUp);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("keyup", handleKeyUp);
    };
  }, [isSpacebarPressed, commandHistory, historyIndex]);

  const addToHistory = (command: string) => {
    if (command.trim() && !commandHistory.includes(command.trim())) {
      setCommandHistory((prev) => [...prev, command.trim()].slice(-50)); // Keep last 50 commands
    }
    setHistoryIndex(-1);
  };

  const navigateHistory = (direction: "up" | "down") => {
    if (commandHistory.length === 0) return;

    if (direction === "up") {
      const newIndex =
        historyIndex === -1
          ? commandHistory.length - 1
          : Math.max(0, historyIndex - 1);
      setHistoryIndex(newIndex);
      setInputMessage(commandHistory[newIndex]);
    } else {
      if (historyIndex === -1) return;
      const newIndex = historyIndex + 1;
      if (newIndex >= commandHistory.length) {
        setHistoryIndex(-1);
        setInputMessage("");
      } else {
        setHistoryIndex(newIndex);
        setInputMessage(commandHistory[newIndex]);
      }
    }
  };

  const stopAllActivity = () => {
    // Stop speech recognition
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop();
    }

    // Stop recording
    if (mediaRecorderRef.current && isRecording) {
      stopWhisperRecording();
    }

    // Stop speech synthesis
    if (synthesisRef.current && isSpeaking) {
      synthesisRef.current.cancel();
      setIsSpeaking(false);
    }

    setIsSpacebarPressed(false);
    setStatus("READY");

    // Focus input
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  const clearTerminal = () => {
    setMessages([]);
    setStatus("TERMINAL CLEARED");
    setTimeout(() => setStatus("READY"), 1000);
  };

  const startVoiceInput = () => {
    if (isRecording) {
      stopWhisperRecording();
    } else if (isListening) {
      recognitionRef.current?.stop();
    } else {
      startWhisperRecording();
    }
  };

  const stopVoiceInput = () => {
    if (isRecording) {
      stopWhisperRecording();
    } else if (isListening) {
      recognitionRef.current?.stop();
    }
  };

  const speak = async (text: string) => {
    if (!isTTSEnabled) {
      console.log("TTS disabled, skipping speech synthesis");
      return;
    }

    try {
      setIsSpeaking(true);
      setStatus("SPEAKING...");

      const response = await fetch("/api/speech", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ text }),
      });

      if (response.ok) {
        const contentType = response.headers.get("content-type");

        // Check if response is JSON (fallback case) or audio
        if (contentType?.includes("application/json")) {
          const data = await response.json();
          if (data.fallback) {
            console.log("ElevenLabs not available:", data.message);
            setStatus("FALLBACK: Browser speech");
            fallbackSpeak(text);
            return;
          }
        } else if (contentType?.includes("audio")) {
          // ElevenLabs audio response
          const audioBlob = await response.blob();
          const audioUrl = URL.createObjectURL(audioBlob);
          const audio = new Audio(audioUrl);

          audio.onended = () => {
            setIsSpeaking(false);
            setStatus("READY");
            URL.revokeObjectURL(audioUrl);
          };

          audio.onerror = () => {
            setIsSpeaking(false);
            setStatus("ERROR: Audio playback failed");
            URL.revokeObjectURL(audioUrl);
            fallbackSpeak(text);
          };

          await audio.play();
          return;
        }
      }

      // If we get here, something went wrong
      throw new Error("Unexpected response format");
    } catch (error) {
      console.error("Speech synthesis error:", error);
      setIsSpeaking(false);
      setStatus("ERROR: Speech synthesis failed");
      fallbackSpeak(text);
    }
  };

  const fallbackSpeak = (text: string) => {
    if (!isTTSEnabled) {
      console.log("TTS disabled, skipping fallback speech synthesis");
      setIsSpeaking(false);
      setStatus("READY");
      return;
    }

    if (synthesisRef.current) {
      if (isSpeaking) {
        synthesisRef.current.cancel();
      }

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.8;
      utterance.pitch = 0.8;
      utterance.volume = 1;

      utterance.onstart = () => {
        setIsSpeaking(true);
        setStatus("SPEAKING (BROWSER)...");
      };

      utterance.onend = () => {
        setIsSpeaking(false);
        setStatus("READY");
      };

      synthesisRef.current.speak(utterance);
    }
  };

  const startWhisperRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      setIsRecording(true);
      setStatus("RECORDING...");
      audioChunksRef.current = [];

      mediaRecorderRef.current = new MediaRecorder(stream);

      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorderRef.current.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, {
          type: "audio/webm",
        });
        stream.getTracks().forEach((track) => track.stop());
        await transcribeWithWhisper(audioBlob);
      };

      mediaRecorderRef.current.start();
    } catch (error) {
      console.error("Failed to start recording:", error);
      setStatus("ERROR: Microphone access denied, using browser recognition");
      setIsRecording(false);
      toggleBrowserListening();
    }
  };

  const stopWhisperRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      setStatus("PROCESSING...");
    }
  };

  const transcribeWithWhisper = async (audioBlob: Blob) => {
    try {
      const formData = new FormData();
      formData.append("audio", audioBlob, "recording.webm");

      const response = await fetch("/api/transcribe", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (data.fallback) {
        console.log("Whisper not available:", data.message);
        setStatus("FALLBACK: Browser recognition");
        toggleBrowserListening();
        return;
      }

      if (data.transcript) {
        const transcript = data.transcript.trim();
        console.log(`Whisper transcript: "${transcript}"`);

        setInputMessage("");
        setStatus(`VOICE: ${transcript}`);

        // Add the voice command to the chat and history
        addMessage(`> ${transcript}`, "user");
        addToHistory(transcript);

        // Process the command
        processMessage(transcript);
      } else {
        throw new Error("No transcript received");
      }
    } catch (error) {
      console.error("Whisper transcription error:", error);
      setStatus("ERROR: Transcription failed, using browser recognition");
      toggleBrowserListening();
    }
  };

  const toggleBrowserListening = () => {
    if (!recognitionRef.current) {
      setStatus("ERROR: Voice recognition not available");
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
    } else {
      recognitionRef.current.start();
    }
  };

  const addMessage = (
    content: string,
    sender: "user" | "assistant",
    isHTML = false
  ) => {
    const timestamp = new Date().toLocaleTimeString();
    setMessages((prev) => [...prev, { content, sender, isHTML, timestamp }]);
  };

  const sendMessage = () => {
    const message = inputMessage.trim();
    if (!message) return;

    addMessage(`> ${message}`, "user");
    addToHistory(message);
    setInputMessage("");
    setHistoryIndex(-1);
    processMessage(message);
  };

  const processMessage = async (message: string) => {
    setIsProcessing(true);
    setStatus("PROCESSING...");

    const lowerMessage = message.toLowerCase();

    // Command aliases
    const aliases: { [key: string]: string } = {
      cls: "clear",
      exit: "clear",
      quit: "clear",
      h: "help",
      "?": "help",
      w: "weather",
      s: "search",
    };

    // Check for aliases
    const firstWord = lowerMessage.split(" ")[0];
    if (aliases[firstWord]) {
      const aliasedCommand = lowerMessage.replace(
        firstWord,
        aliases[firstWord]
      );
      return processMessage(aliasedCommand);
    }

    if (lowerMessage === "clear") {
      addMessage("🧹 Terminal cleared", "assistant");
      setTimeout(() => {
        clearTerminal();
        setIsProcessing(false);
      }, 500);
      return;
    }

    if (lowerMessage === "help") {
      const helpText = `JARVIS Terminal Help
===================

📋 COMMANDS:
• help, h, ? - Show this help
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

      addMessage(helpText, "assistant");
      setStatus("READY");
      setIsProcessing(false);
      return;
    }

    if (lowerMessage.includes("stop talking")) {
      stopAllActivity();
      addMessage("🔇 Speech synthesis stopped.", "assistant");
      setIsProcessing(false);
      return;
    }

    // Weather queries
    if (
      lowerMessage.includes("weather") ||
      lowerMessage.includes("forecast") ||
      lowerMessage.includes("temperature") ||
      lowerMessage.includes("rain") ||
      lowerMessage.includes("sunny") ||
      lowerMessage.includes("cloudy")
    ) {
      await handleWeatherQuery(message);
    }
    // Search queries
    else if (
      lowerMessage.startsWith("search for ") ||
      lowerMessage.includes("search for") ||
      lowerMessage.startsWith("search ") ||
      lowerMessage.startsWith("s ")
    ) {
      const query = lowerMessage
        .replace(/^s\s/, "search ")
        .replace(/search (for )?/g, "")
        .trim();
      await performSearch(query);
    }
    // General AI responses
    else {
      await getAIResponse(message);
    }

    setIsProcessing(false);
  };

  const handleWeatherQuery = async (message: string) => {
    try {
      // Extract location from weather query
      const lowerMessage = message.toLowerCase();
      let location = "auto:ip"; // Default to user's location
      let weatherType = "current";

      // Determine weather type
      if (
        lowerMessage.includes("forecast") ||
        lowerMessage.includes("tomorrow")
      ) {
        weatherType = "forecast";
      } else if (
        lowerMessage.includes("sunrise") ||
        lowerMessage.includes("sunset")
      ) {
        weatherType = "astronomy";
      }

      // Extract location if mentioned
      const locationMatches = message.match(
        /(?:in|for|at)\s+([a-zA-Z\s,]+?)(?:\s|$)/i
      );
      if (locationMatches) {
        location = locationMatches[1].trim();
      } else if (
        lowerMessage.includes("here") ||
        lowerMessage.includes("my location")
      ) {
        location = "auto:ip";
      }

      setStatus("FETCHING WEATHER...");

      const response = await fetch("/api/weather", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ query: location, type: weatherType }),
      });

      const data = await response.json();

      if (data.fallback) {
        const fallbackMsg = `❌ Weather services unavailable. ${data.message}`;
        addMessage(fallbackMsg, "assistant");
        speak(fallbackMsg);
      } else if (data.success && data.formatted) {
        const weatherResponse = `🌤️ ${data.formatted}`;
        addMessage(weatherResponse, "assistant");
        speak(data.formatted);
      } else {
        throw new Error("No weather data received");
      }
    } catch (error) {
      console.error("Weather query error:", error);
      const errorMsg = "❌ Weather systems offline.";
      addMessage(errorMsg, "assistant");
      speak(errorMsg);
    }

    setStatus("READY");
  };

  const performSearch = async (query: string) => {
    try {
      setStatus("SEARCHING...");

      const response = await fetch("/api/search", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ query }),
      });

      const data = await response.json();

      if (data.response) {
        // Create simple text response for terminal
        let searchResponse = `🔍 SEARCH RESULTS: "${query}"\n${"=".repeat(
          50
        )}\n\n${data.response}`;

        // Add sources if available
        if (data.sources && data.sources.length > 0) {
          searchResponse += "\n\n🔗 Sources:\n";
          data.sources.forEach((source: SearchSource, index: number) => {
            searchResponse += `  ${index + 1}. ${source.title}\n     🌐 ${
              source.url
            }\n`;
          });
        }

        addMessage(searchResponse, "assistant");
        speak(data.response);
      } else {
        const errorMsg = data.error || `❌ No results found for "${query}".`;
        addMessage(errorMsg, "assistant");
        speak(errorMsg);
      }
    } catch (error) {
      console.error("Search error:", error);
      const errorMsg = "❌ Search systems unavailable.";
      addMessage(errorMsg, "assistant");
      speak(errorMsg);
    }

    setStatus("READY");
  };

  const getAIResponse = async (message: string) => {
    try {
      setStatus("AI THINKING...");

      // Prepare chat history for context (clean content and limit to last 20 messages)
      const cleanContent = (content: string) => {
        return content
          .replace(/^> /, "") // Remove user prompt prefix
          .replace(/^🤖 /, "") // Remove AI emoji
          .replace(/^🔍 SEARCH RESULTS: .*?\n={40,}\n\n/, "") // Remove search headers
          .replace(/^🌤️ /, "") // Remove weather emoji
          .replace(/^❌ /, "") // Remove error emoji
          .replace(/^🧹 /, "") // Remove clear emoji
          .replace(/^🔇 /, "") // Remove mute emoji
          .replace(/^🔊 /, "") // Remove speaker emoji
          .replace(/\n🔗 Sources:\n[\s\S]*$/, "") // Remove source listings
          .replace(
            /JARVIS Terminal Help\n===================[\s\S]*$/,
            "User requested help"
          ) // Simplify help responses
          .trim();
      };

      const chatHistory = messages
        .filter((msg) => {
          const content = cleanContent(msg.content);
          // Filter out system messages and empty content
          return (
            content.length > 0 &&
            !content.includes("Terminal cleared") &&
            !content.includes("Text-to-Speech") &&
            !content.includes("Speech synthesis stopped")
          );
        })
        .slice(-20) // Keep last 20 relevant messages
        .map((msg) => ({
          role: msg.sender === "user" ? "user" : "assistant",
          content: cleanContent(msg.content),
        }));

      // Add current message to history
      chatHistory.push({
        role: "user",
        content: message,
      });

      // Add system context for the LLM
      const contextualHistory = [
        {
          role: "system",
          content:
            "You are JARVIS, an AI assistant operating in a terminal interface. Provide helpful, concise responses. The user can interact via text or voice commands. Keep responses conversational and informative but not overly verbose since this is a terminal environment.",
        },
        ...chatHistory,
      ];

      // Debug: Log conversation context being sent
      console.log(
        `Sending ${contextualHistory.length} messages to AI (including system prompt)`
      );
      console.log("Chat context:", contextualHistory.slice(-5)); // Log last 5 messages

      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message,
          history: contextualHistory,
        }),
      });

      const data = await response.json();

      if (data.response) {
        const aiResponse = `🤖 ${data.response}`;
        addMessage(aiResponse, "assistant");
        speak(data.response);
      } else {
        throw new Error("No response received");
      }
    } catch (error) {
      console.error("AI response error:", error);
      const fallbackResponse = "❌ AI systems offline.";
      addMessage(fallbackResponse, "assistant");
      speak(fallbackResponse);
    }

    setStatus("READY");
  };

  return (
    <div className="min-h-screen bg-black text-green-400 font-mono overflow-hidden">
      <div className="container mx-auto px-4 py-2 max-w-4xl">
        {/* Terminal Header */}
        <div className="border-b border-cyan-400 mb-4 pb-2">
          <div className="flex justify-between items-center">
            <div>
              <span className="text-cyan-300">JARVIS@terminal:~$ </span>
              <span className="text-cyan-400">AI Assistant Interface</span>
            </div>
            <div className="text-right text-sm">
              <div className="text-cyan-300">
                Status:{" "}
                <span
                  className={`${
                    status.includes("ERROR")
                      ? "text-red-400"
                      : status.includes("READY")
                      ? "text-green-400"
                      : status.includes("LISTENING") ||
                        status.includes("RECORDING")
                      ? "text-purple-400"
                      : status.includes("SPEAKING")
                      ? "text-blue-400"
                      : status.includes("SEARCHING") ||
                        status.includes("FETCHING") ||
                        status.includes("AI THINKING")
                      ? "text-yellow-400"
                      : "text-orange-400"
                  }`}
                >
                  {status}
                </span>
                {isProcessing && (
                  <span className="animate-pulse text-yellow-400"> ⏳</span>
                )}
              </div>
              <div className="text-purple-300 text-xs">
                {isSpacebarPressed
                  ? "🎤 SPACEBAR ACTIVE"
                  : "Hold SPACEBAR for voice | ESC to stop"}
              </div>
              <div className="text-blue-400 text-xs">
                History: {commandHistory.length} commands
              </div>
              <div className="text-right mt-1">
                <button
                  onClick={() => {
                    const newState = !isTTSEnabled;
                    setIsTTSEnabled(newState);
                    addMessage(
                      `🔊 Text-to-Speech ${newState ? "enabled" : "disabled"}`,
                      "assistant"
                    );
                  }}
                  className={`text-xs px-2 py-1 rounded border transition-colors ${
                    isTTSEnabled
                      ? "border-green-400 text-green-400 hover:bg-green-400/10"
                      : "border-red-400 text-red-400 hover:bg-red-400/10"
                  }`}
                  title={`Click to ${
                    isTTSEnabled ? "disable" : "enable"
                  } text-to-speech`}
                >
                  🔊 TTS: {isTTSEnabled ? "ON" : "OFF"}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Terminal Output */}
        <div
          ref={chatContainerRef}
          className="h-[60vh] overflow-y-auto mb-4 bg-gray-900 border border-cyan-400 p-4 scroll-smooth"
          style={{ scrollbarWidth: "thin", scrollbarColor: "#22d3ee #1f2937" }}
        >
          {messages.map((message, index) => (
            <div key={index} className="mb-2">
              {message.sender === "user" ? (
                <div className="text-cyan-300">
                  <span className="text-gray-500 text-xs mr-2">
                    [{message.timestamp}]
                  </span>
                  <span className="text-cyan-400">{message.content}</span>
                </div>
              ) : (
                <div className="whitespace-pre-line">
                  <span className="text-gray-500 text-xs mr-2">
                    [{message.timestamp}]
                  </span>
                  <span
                    className={`${
                      message.content.includes("🔍 SEARCH RESULTS")
                        ? "text-yellow-300"
                        : message.content.includes("❌") ||
                          message.content.includes("ERROR")
                        ? "text-red-400"
                        : message.content.includes("JARVIS Terminal Help")
                        ? "text-green-300"
                        : message.content.includes("🌤️") ||
                          message.content.includes("Weather") ||
                          message.content.includes("°")
                        ? "text-blue-300"
                        : message.content.includes("🔗 Sources:")
                        ? "text-purple-300"
                        : message.content.includes("🤖")
                        ? "text-cyan-300"
                        : message.content.includes("🧹") ||
                          message.content.includes("🔇")
                        ? "text-yellow-400"
                        : "text-green-400"
                    }`}
                  >
                    {message.content}
                  </span>
                </div>
              )}
            </div>
          ))}
          {(isListening || isRecording) && (
            <div className="text-purple-400 animate-pulse">
              <span className="text-gray-500 text-xs mr-2">
                [{new Date().toLocaleTimeString()}]
              </span>
              <span className="text-purple-300">
                {isRecording ? "● RECORDING..." : "● LISTENING..."}
              </span>
            </div>
          )}
          {isSpeaking && (
            <div className="text-blue-400 animate-pulse">
              <span className="text-gray-500 text-xs mr-2">
                [{new Date().toLocaleTimeString()}]
              </span>
              <span className="text-blue-300">♪ SPEAKING...</span>
            </div>
          )}
        </div>

        {/* Command Input */}
        <div className="flex items-center border border-cyan-400 bg-gray-900">
          <span className="text-cyan-300 px-3 py-2 flex-shrink-0">
            jarvis@terminal:~$
          </span>
          <input
            ref={inputRef}
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyPress={(e) => e.key === "Enter" && sendMessage()}
            placeholder="Type command or hold SPACEBAR for voice input..."
            className="flex-1 px-2 py-2 bg-gray-900 text-cyan-400 placeholder-gray-500 border-none outline-none font-mono"
            disabled={isProcessing}
          />
          {historyIndex >= 0 && (
            <span className="text-yellow-400 text-xs px-2">
              [{historyIndex + 1}/{commandHistory.length}]
            </span>
          )}
        </div>

        {/* Footer Info */}
        <div className="mt-4 text-center text-xs">
          <p className="text-gray-400">
            <span className="text-purple-400">SPACEBAR</span>: voice |
            <span className="text-cyan-400"> ↑↓</span>: history |
            <span className="text-red-400"> ESC</span>: stop |
            <span className="text-yellow-400"> Ctrl+L</span>: clear |
            <span className={isTTSEnabled ? "text-green-400" : "text-red-400"}>
              {" "}
              🔊TTS
            </span>
            : {isTTSEnabled ? "ON" : "OFF"} |
            <span className="text-green-400"> &quot;help&quot;</span>: commands
          </p>
          <p
            className={`mt-1 ${
              isSpacebarPressed
                ? "text-purple-300 animate-pulse"
                : "text-gray-500"
            }`}
          >
            {isSpacebarPressed
              ? "🎤 Voice input active - release spacebar to stop"
              : "Press and hold SPACEBAR to activate voice input"}
          </p>
        </div>
      </div>

      <style jsx>{`
        /* Custom scrollbar for terminal */
        ::-webkit-scrollbar {
          width: 8px;
        }
        ::-webkit-scrollbar-track {
          background: #1f2937;
        }
        ::-webkit-scrollbar-thumb {
          background: #22d3ee;
          border-radius: 4px;
        }
        ::-webkit-scrollbar-thumb:hover {
          background: #06b6d4;
        }
      `}</style>
    </div>
  );
}
