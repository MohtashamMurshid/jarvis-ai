import { useRef, useState } from "react";

interface UseTextToSpeechProps {
  onStatusChange: (status: string) => void;
  password?: string;
}

export function useTextToSpeech({
  onStatusChange,
  password,
}: UseTextToSpeechProps) {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isTTSEnabled, setIsTTSEnabled] = useState(false);
  const synthesisRef = useRef<SpeechSynthesis | null>(null);

  const speak = async (text: string) => {
    if (!isTTSEnabled) {
      console.log("TTS disabled, skipping speech synthesis");
      return;
    }

    if (!text || typeof text !== "string" || text.trim().length === 0) {
      console.log("No valid text content to speak, skipping speech synthesis");
      return;
    }

    const cleanText = text
      .replace(/\*\*/g, "")
      .replace(/\*/g, "")
      .replace(/`[^`]*`/g, "")
      .replace(/```[\s\S]*?```/g, "")
      .replace(/<[^>]*>/g, "")
      .replace(/\n+/g, " ")
      .replace(/\s+/g, " ")
      .trim();

    if (cleanText.length === 0) {
      console.log(
        "No valid text content after cleaning, skipping speech synthesis"
      );
      return;
    }

    try {
      setIsSpeaking(true);
      onStatusChange("SPEAKING...");

      const response = await fetch("/api/speech", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(password && { "X-Password": password }),
        },
        body: JSON.stringify({ text: cleanText }),
      });

      if (response.ok) {
        const contentType = response.headers.get("content-type");

        if (contentType?.includes("application/json")) {
          const data = await response.json();
          if (data.fallback) {
            console.log("ElevenLabs not available:", data.message);
            onStatusChange("FALLBACK: Browser speech");
            fallbackSpeak(text);
            return;
          }
        } else if (contentType?.includes("audio")) {
          const audioBlob = await response.blob();
          const audioUrl = URL.createObjectURL(audioBlob);
          const audio = new Audio(audioUrl);

          audio.onended = () => {
            setIsSpeaking(false);
            onStatusChange("READY");
            URL.revokeObjectURL(audioUrl);
          };

          audio.onerror = () => {
            setIsSpeaking(false);
            onStatusChange("ERROR: Audio playback failed");
            URL.revokeObjectURL(audioUrl);
            fallbackSpeak(text);
          };

          await audio.play();
          return;
        }
      }

      throw new Error("Unexpected response format");
    } catch (error) {
      console.error("Speech synthesis error:", error);
      setIsSpeaking(false);
      onStatusChange("ERROR: Speech synthesis failed");
      fallbackSpeak(text);
    }
  };

  const fallbackSpeak = (text: string) => {
    if (!isTTSEnabled) {
      console.log("TTS disabled, skipping fallback speech synthesis");
      setIsSpeaking(false);
      onStatusChange("READY");
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

      const voices = window.speechSynthesis.getVoices();
      const maleVoice =
        voices.find(
          (voice) =>
            voice.lang.startsWith("en") &&
            voice.name.toLowerCase().includes("male")
        ) ||
        voices.find(
          (voice) =>
            voice.lang.startsWith("en") &&
            (voice.name.toLowerCase().includes("david") ||
              voice.name.toLowerCase().includes("alex") ||
              voice.name.toLowerCase().includes("fred"))
        );

      if (maleVoice) {
        utterance.voice = maleVoice;
      }

      utterance.onstart = () => {
        setIsSpeaking(true);
        onStatusChange("SPEAKING (BROWSER)...");
      };

      utterance.onend = () => {
        setIsSpeaking(false);
        onStatusChange("READY");
      };

      synthesisRef.current.speak(utterance);
    }
  };

  const stopSpeaking = () => {
    if (synthesisRef.current && isSpeaking) {
      synthesisRef.current.cancel();
      setIsSpeaking(false);
      onStatusChange("READY");
    }
  };

  const toggleTTS = () => {
    const newState = !isTTSEnabled;
    setIsTTSEnabled(newState);
    return newState;
  };

  return {
    isSpeaking,
    isTTSEnabled,
    speak,
    stopSpeaking,
    toggleTTS,
  };
}
