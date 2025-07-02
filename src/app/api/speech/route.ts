import OpenAI from "openai";
import { verifyAuth, createAuthResponse } from "../../../lib/auth";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: Request) {
  // Check authentication
  if (!verifyAuth(request)) {
    return createAuthResponse();
  }
  try {
    const { text } = await request.json();

    if (!text || typeof text !== "string" || text.trim().length === 0) {
      console.log("Invalid or empty text provided to speech API:", text);
      return Response.json(
        { error: "Valid text is required" },
        { status: 400 }
      );
    }

    const elevenlabsApiKey = process.env.ELEVENLABS_API_KEY;

    // Try ElevenLabs first if configured
    if (elevenlabsApiKey) {
      try {
        // Using Rachel voice - a reliable ElevenLabs pre-made voice
        const voiceId = "AeRdCCKzvd23BpJoofzx";

        console.log(
          `Attempting ElevenLabs TTS for text: "${text.slice(0, 50)}..."`
        );

        const response = await fetch(
          `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
          {
            method: "POST",
            headers: {
              Accept: "audio/mpeg",
              "Content-Type": "application/json",
              "xi-api-key": elevenlabsApiKey,
            },
            body: JSON.stringify({
              text: text,
              model_id: "eleven_monolingual_v1",
              voice_settings: {
                stability: 0.5,
                similarity_boost: 0.5,
              },
            }),
          }
        );

        if (response.ok) {
          const audioBuffer = await response.arrayBuffer();
          console.log(
            `ElevenLabs TTS successful, audio size: ${audioBuffer.byteLength} bytes`
          );

          return new Response(audioBuffer, {
            headers: {
              "Content-Type": "audio/mpeg",
              "Content-Length": audioBuffer.byteLength.toString(),
            },
          });
        }

        const errorText = await response.text();
        console.error(
          `ElevenLabs API error: ${response.status} - ${errorText}`
        );
        // Fall through to OpenAI TTS
      } catch (error) {
        console.error("ElevenLabs error:", error);
        // Fall through to OpenAI TTS
      }
    }

    // Try OpenAI TTS if ElevenLabs failed or not configured
    try {
      const openaiApiKey = process.env.OPENAI_API_KEY;

      if (!openaiApiKey) {
        return Response.json(
          {
            error: "No TTS services configured",
            fallback: true,
            message:
              "Please add ELEVENLABS_API_KEY or OPENAI_API_KEY to your .env.local file",
          },
          { status: 200 }
        );
      }

      console.log(`Attempting OpenAI TTS for text: "${text.slice(0, 50)}..."`);

      const mp3 = await openai.audio.speech.create({
        model: "gpt-4o-mini-tts",
        voice: "onyx", // Using 'onyx' for a deeper, Jarvis-like voice. Can be: alloy, echo, fable, onyx, nova, or shimmer
        input: text.slice(0, 4096), // OpenAI TTS has a 4096 character limit
        speed: 1.1,
      });

      const buffer = Buffer.from(await mp3.arrayBuffer());
      console.log(
        `OpenAI TTS successful, audio size: ${buffer.byteLength} bytes`
      );

      return new Response(buffer, {
        headers: {
          "Content-Type": "audio/mpeg",
          "Content-Length": buffer.byteLength.toString(),
        },
      });
    } catch (error: unknown) {
      console.error("OpenAI TTS error:", error);

      // Provide specific error messages for common issues
      let errorMessage =
        "Speech synthesis failed, falling back to browser speech";
      if (typeof error === "object" && error !== null && "status" in error) {
        const status = (error as { status: number }).status;
        if (status === 400) {
          errorMessage =
            "Invalid request to OpenAI TTS API, falling back to browser speech";
        } else if (status === 401) {
          errorMessage =
            "Invalid OpenAI API key, falling back to browser speech";
        } else if (status === 429) {
          errorMessage =
            "OpenAI API rate limit exceeded, falling back to browser speech";
        }
      }

      return Response.json(
        {
          error: "All TTS services failed",
          fallback: true,
          message: errorMessage,
        },
        { status: 200 }
      );
    }
  } catch (error) {
    console.error("Speech synthesis error:", error);
    return Response.json(
      {
        error: "Failed to generate speech",
        fallback: true,
        message: "Speech synthesis failed, falling back to browser speech",
      },
      { status: 200 }
    );
  }
}
