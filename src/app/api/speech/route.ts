export async function POST(request: Request) {
  try {
    const { text } = await request.json();

    if (!text) {
      return Response.json({ error: "Text is required" }, { status: 400 });
    }

    const elevenlabsApiKey = process.env.ELEVENLABS_API_KEY;

    if (!elevenlabsApiKey) {
      console.log(
        "ElevenLabs API key not configured, returning fallback response"
      );
      return Response.json(
        {
          error: "ElevenLabs API key not configured",
          fallback: true,
          message: "Please add ELEVENLABS_API_KEY to your .env.local file",
        },
        { status: 200 } // Return 200 so frontend can handle gracefully
      );
    }

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

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`ElevenLabs API error: ${response.status} - ${errorText}`);

      return Response.json(
        {
          error: `ElevenLabs API error: ${response.status}`,
          fallback: true,
          message:
            "ElevenLabs service unavailable, falling back to browser speech",
        },
        { status: 200 } // Return 200 so frontend can handle gracefully
      );
    }

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
  } catch (error) {
    console.error("Speech synthesis error:", error);
    return Response.json(
      {
        error: "Failed to generate speech",
        fallback: true,
        message: "Speech synthesis failed, falling back to browser speech",
      },
      { status: 200 } // Return 200 so frontend can handle gracefully
    );
  }
}
