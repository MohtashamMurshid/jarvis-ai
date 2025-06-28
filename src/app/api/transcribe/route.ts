import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const audioFile = formData.get("audio") as File;

    if (!audioFile) {
      return Response.json(
        { error: "Audio file is required" },
        { status: 400 }
      );
    }

    const openaiApiKey = process.env.OPENAI_API_KEY;

    if (!openaiApiKey) {
      console.log("OpenAI API key not configured, returning fallback response");
      return Response.json(
        {
          error: "OpenAI API key not configured",
          fallback: true,
          message:
            "Please add OPENAI_API_KEY to your .env.local file for Whisper transcription",
        },
        { status: 200 }
      );
    }

    console.log(
      `Transcribing audio file: ${audioFile.name}, size: ${audioFile.size} bytes, type: ${audioFile.type}`
    );

    // Check if file size is reasonable (OpenAI has a 25MB limit)
    if (audioFile.size > 25 * 1024 * 1024) {
      console.log("Audio file too large, falling back to browser recognition");
      return Response.json(
        {
          error: "Audio file too large",
          fallback: true,
          message:
            "Audio file exceeds 25MB limit, falling back to browser speech recognition",
        },
        { status: 200 }
      );
    }

    // Check if file size is too small (likely empty or corrupted)
    if (audioFile.size < 1000) {
      console.log("Audio file too small, falling back to browser recognition");
      return Response.json(
        {
          error: "Audio file too small",
          fallback: true,
          message:
            "Audio recording too short, falling back to browser speech recognition",
        },
        { status: 200 }
      );
    }

    try {
      // Create a new File object with a proper name and type for Whisper
      let processedFile = audioFile;

      // If it's webm, try to ensure it has the right mime type
      if (audioFile.type.includes("webm") || audioFile.name.includes(".webm")) {
        console.log("Processing webm file for Whisper compatibility");
        // Create a new file with mp4 extension which Whisper handles better
        const buffer = await audioFile.arrayBuffer();
        processedFile = new File([buffer], "recording.mp4", {
          type: "audio/mp4",
        });
      }

      // Transcribe the audio using OpenAI Whisper
      const transcription = await openai.audio.transcriptions.create({
        file: processedFile,
        model: "whisper-1",
        language: "en", // You can make this dynamic or remove for auto-detection
        response_format: "json",
        temperature: 0.2, // Lower temperature for more consistent results
      });

      console.log(`Whisper transcription successful: "${transcription.text}"`);

      return Response.json({
        transcript: transcription.text,
        confidence: 1.0, // Whisper doesn't provide confidence scores, but it's generally very accurate
      });
    } catch (whisperError: unknown) {
      console.error("Whisper API error:", whisperError);

      // Check if it's a format error
      if (
        whisperError instanceof Error &&
        (whisperError.message?.includes("Invalid file format") ||
          whisperError.message?.includes("file format"))
      ) {
        console.log("File format issue, falling back to browser recognition");
        return Response.json(
          {
            error: "Unsupported audio format",
            fallback: true,
            message:
              "Audio format not supported by Whisper, falling back to browser speech recognition",
          },
          { status: 200 }
        );
      }

      // Check if it's an OpenAI API error with status 400
      if (
        typeof whisperError === "object" &&
        whisperError !== null &&
        "status" in whisperError &&
        whisperError.status === 400
      ) {
        console.log("API error 400, falling back to browser recognition");
        return Response.json(
          {
            error: "Whisper API error",
            fallback: true,
            message:
              "Whisper API returned error 400, falling back to browser speech recognition",
          },
          { status: 200 }
        );
      }

      // For other errors, also fallback
      throw whisperError;
    }
  } catch (error) {
    console.error("Transcription error:", error);
    return Response.json(
      {
        error: "Failed to transcribe audio",
        fallback: true,
        message:
          "Whisper transcription failed, falling back to browser speech recognition",
      },
      { status: 200 }
    );
  }
}
