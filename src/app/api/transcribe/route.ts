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
      `Transcribing audio file: ${audioFile.name}, size: ${audioFile.size} bytes`
    );

    // Transcribe the audio using OpenAI Whisper
    const transcription = await openai.audio.transcriptions.create({
      file: audioFile,
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
