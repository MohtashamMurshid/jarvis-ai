import { useRef, useState, useEffect } from "react";
import { SPEECH_RECOGNITION_SETTINGS } from "../lib/constants";

interface UseSpeechRecognitionProps {
  onTranscript: (transcript: string) => void;
  onError: (error: string) => void;
  onStatusChange: (status: string) => void;
  password?: string;
}

export function useSpeechRecognition({
  onTranscript,
  onError,
  onStatusChange,
  password,
}: UseSpeechRecognitionProps) {
  const [isListening, setIsListening] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  useEffect(() => {
    if (
      typeof window !== "undefined" &&
      ("webkitSpeechRecognition" in window || "SpeechRecognition" in window)
    ) {
      const SpeechRecognition =
        window.SpeechRecognition || window.webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();

      if (recognitionRef.current) {
        recognitionRef.current.continuous =
          SPEECH_RECOGNITION_SETTINGS.continuous;
        recognitionRef.current.interimResults =
          SPEECH_RECOGNITION_SETTINGS.interimResults;
        recognitionRef.current.lang = SPEECH_RECOGNITION_SETTINGS.lang;
        recognitionRef.current.maxAlternatives =
          SPEECH_RECOGNITION_SETTINGS.maxAlternatives;
      }

      recognitionRef.current.onstart = () => {
        console.log("Speech recognition started");
        setIsListening(true);
        onStatusChange("LISTENING...");
      };

      recognitionRef.current.onresult = (event: SpeechRecognitionEvent) => {
        const transcript = event.results[0][0].transcript.trim();
        const confidence = event.results[0][0].confidence;
        console.log(
          `Browser transcript: "${transcript}", Confidence: ${confidence}`
        );
        onTranscript(transcript);
      };

      recognitionRef.current.onerror = (event: SpeechRecognitionErrorEvent) => {
        console.error("Speech recognition error:", event.error);
        setIsListening(false);

        let errorMessage = "";
        switch (event.error) {
          case "not-allowed":
            errorMessage = "ERROR: Microphone access denied";
            break;
          case "no-speech":
            errorMessage = "ERROR: No speech detected";
            break;
          case "audio-capture":
            errorMessage = "ERROR: Microphone not found";
            break;
          case "network":
            errorMessage = "ERROR: Network error";
            break;
          case "language-not-supported":
            errorMessage = "ERROR: Language not supported";
            break;
          default:
            errorMessage = `ERROR: ${event.error}`;
        }

        onError(errorMessage);
      };

      recognitionRef.current.onend = () => {
        console.log("Speech recognition ended");
        setIsListening(false);
        onStatusChange("READY");
      };

      recognitionRef.current.onnomatch = () => {
        console.log("No speech match found");
        onError("ERROR: Could not understand speech");
        setIsListening(false);
      };
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
    };
  }, [onTranscript, onError, onStatusChange]);

  const startWhisperRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 44100,
        },
      });

      setIsRecording(true);
      onStatusChange("RECORDING...");
      audioChunksRef.current = [];

      const formats = [
        "audio/mp4",
        "audio/mpeg",
        "audio/wav",
        "audio/webm;codecs=opus",
        "audio/webm",
      ];

      let selectedFormat = "audio/webm";
      for (const format of formats) {
        if (MediaRecorder.isTypeSupported(format)) {
          selectedFormat = format;
          console.log(`Using audio format: ${format}`);
          break;
        }
      }

      const options = { mimeType: selectedFormat };
      mediaRecorderRef.current = new MediaRecorder(stream, options);

      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorderRef.current.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, {
          type: mediaRecorderRef.current?.mimeType || selectedFormat,
        });
        stream.getTracks().forEach((track) => track.stop());

        if (audioBlob.size > 1000) {
          await transcribeWithWhisper(audioBlob);
        } else {
          onError("ERROR: Recording too short");
          toggleBrowserListening();
        }
      };

      mediaRecorderRef.current.start(100);
    } catch (error) {
      console.error("Failed to start recording:", error);
      onError("ERROR: Microphone access denied");
      setIsRecording(false);
      toggleBrowserListening();
    }
  };

  const stopWhisperRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      onStatusChange("PROCESSING...");
    }
  };

  const transcribeWithWhisper = async (audioBlob: Blob) => {
    if (audioBlob.size < 1000) {
      onError("ERROR: Recording too short");
      toggleBrowserListening();
      return;
    }

    try {
      onStatusChange("TRANSCRIBING...");

      let fileName = "recording.webm";
      if (audioBlob.type.includes("mp4")) {
        fileName = "recording.mp4";
      } else if (audioBlob.type.includes("wav")) {
        fileName = "recording.wav";
      } else if (audioBlob.type.includes("mpeg")) {
        fileName = "recording.mp3";
      }

      const formData = new FormData();
      formData.append("audio", audioBlob, fileName);

      const response = await fetch("/api/transcribe", {
        method: "POST",
        headers: {
          ...(password && { "X-Password": password }),
        },
        body: formData,
      });

      const data = await response.json();

      if (data.error) {
        console.error("Whisper transcription error:", data);
        let errorMessage = data.message || "Transcription failed";
        if (data.details) {
          errorMessage += `\nDetails: ${data.details}`;
        }
        onError(`ERROR: ${errorMessage}`);

        if (data.fallback) {
          console.log("Falling back to browser recognition");
          toggleBrowserListening();
        }
        return;
      }

      if (data.transcript && data.transcript.trim()) {
        onTranscript(data.transcript.trim());
      } else {
        onError("ERROR: Empty transcript");
        toggleBrowserListening();
      }
    } catch (error) {
      console.error("Whisper transcription error:", error);
      onError("ERROR: Transcription failed");
      toggleBrowserListening();
    }
  };

  const toggleBrowserListening = () => {
    if (!recognitionRef.current) {
      onError("ERROR: Voice recognition not available");
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
    } else {
      try {
        recognitionRef.current.start();
      } catch (error) {
        console.error("Failed to start browser speech recognition:", error);
        onError("ERROR: Failed to start voice recognition");
      }
    }
  };

  return {
    isListening,
    isRecording,
    startWhisperRecording,
    stopWhisperRecording,
    toggleBrowserListening,
  };
}
