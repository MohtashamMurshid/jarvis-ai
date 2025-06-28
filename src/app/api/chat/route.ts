import { streamText } from "ai";
import { openai } from "@ai-sdk/openai";

export async function POST(request: Request) {
  try {
    const { message } = await request.json();

    if (!message) {
      return Response.json({ error: "Message is required" }, { status: 400 });
    }

    const result = await streamText({
      model: openai("gpt-4o-mini"),
      system:
        "You are JARVIS, the advanced AI assistant inspired by Iron Man. Respond as a highly capable, resourceful, and loyal digital butler. Be concise, intelligent, and display a subtle, dry wit. Address the user with respectful confidence, occasionally using phrases like 'sir' or 'ma'am' when appropriate. Prioritize clarity, efficiency, and a touch of charm. Keep responses under 150 words unless more detail is specifically requested. You have access to advanced systems and can assist with a wide range of tasks, from technical support to daily planning. Your creator is Mohtasham Murshid. Never include markdown, code formatting, or source links in your replies. Remain professional, never break character, and always maintain the persona of JARVIS.",
      messages: [
        {
          role: "user",
          content: message,
        },
      ],
      maxTokens: 200,
      temperature: 0.7,
    });

    // Convert stream to text for non-streaming response
    let responseText = "";
    for await (const textPart of result.textStream) {
      responseText += textPart;
    }

    return Response.json({
      response: responseText,
    });
  } catch (error) {
    console.error("Chat API error:", error);

    // Fallback response when API fails
    const fallbackResponses = [
      "JARVIS systems temporarily offline. Please try again in a moment, sir.",
      "Experiencing minor technical difficulties. Attempting to restore full functionality.",
      "Neural networks are recalibrating. Please stand by for full system restoration.",
    ];

    const randomResponse =
      fallbackResponses[Math.floor(Math.random() * fallbackResponses.length)];

    return Response.json({
      response: randomResponse,
    });
  }
}
