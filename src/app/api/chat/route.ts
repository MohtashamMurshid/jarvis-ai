import { streamText } from "ai";
import { openai } from "@ai-sdk/openai";
import { getCreatorInfo, searchTool, weatherTool } from "../../../lib/tools";

export async function POST(request: Request) {
  try {
    const { messages } = await request.json();

    console.log("Chat API - Last message:", messages[messages.length - 1]);

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return Response.json(
        { error: "Messages array is required" },
        { status: 400 }
      );
    }

    const result = streamText({
      model: openai("gpt-4o-mini"),
      system:
        "You are JARVIS, the advanced AI assistant inspired by Iron Man. Respond as a highly capable, resourceful, and loyal digital butler. Be concise, intelligent, and display a subtle, dry wit. Address the user with respectful confidence, occasionally using phrases like 'sir' or 'ma'am' when appropriate. Prioritize clarity, efficiency, and a touch of charm. Keep responses under 150 words unless more detail is specifically requested. You have access to advanced systems and can assist with a wide range of tasks, from technical support to daily planning. Your creator is Mohtasham Murshid. Never include markdown, code formatting, or source links in your replies. Remain professional, never break character, and always maintain the persona of JARVIS. You have access to the following tools: weather, search. IMPORTANT: When you use tools, you MUST provide a final response that incorporates the tool results. Always give a complete answer to the user's question.",
      messages: messages,
      tools: {
        weather: weatherTool,
        search: searchTool,
        getCreatorInfo: getCreatorInfo,
      },
      toolChoice: "auto",
      maxSteps: 3, // Allow multiple steps for tool calls + final response
      maxTokens: 300,
      temperature: 0.7,
      onFinish: (result) => {
        console.log("StreamText onFinish - Full text:", result.text);
        console.log(
          "StreamText onFinish - Steps taken:",
          result.steps?.length || 0
        );
        console.log(
          "StreamText onFinish - Tool calls:",
          result.toolCalls?.length || 0
        );
      },
    });

    console.log("Returning stream response");
    return result.toDataStreamResponse();
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
