import { streamText } from "ai";
import { openai } from "@ai-sdk/openai";
import {
  arXivTool,
  getCreatorInfo,
  searchTool,
  weatherTool,
} from "../../../lib/tools";
import { verifyAuth, createAuthResponse } from "../../../lib/auth";

export async function POST(request: Request) {
  // Check authentication
  if (!verifyAuth(request)) {
    return createAuthResponse();
  }
  try {
    const { messages } = await request.json();

    console.log("Chat API - Last message:", messages[messages.length - 1]);

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return Response.json(
        { error: "Messages array is required" },
        { status: 400 }
      );
    }

    const toolUsage = {
      toolCalls: [] as Array<{ tool: string; args: Record<string, unknown> }>,
      totalSteps: 0,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      weatherData: null as any, // Store weather data directly
    };

    const result = streamText({
      model: openai("gpt-4o-mini"),
      system:
        "You are JARVIS, the advanced AI assistant inspired by Iron Man. Respond as a highly capable, resourceful, and loyal digital butler. Be concise, intelligent, and display a subtle, dry wit. Address the user with respectful confidence, occasionally using phrases like 'sir' or 'ma'am' when appropriate. Prioritize clarity, efficiency, and a touch of charm. Keep responses under 150 words unless more detail is specifically requested. You have access to advanced systems and can assist with a wide range of tasks, from technical support to daily planning. Your creator is Mohtasham Murshid. Never include markdown, code formatting, or source links in your replies. Remain professional, never break character, and always maintain the persona of JARVIS.\n\nCRITICAL TOOL USAGE RULES:\n- For ANY weather-related questions (current weather, forecasts, temperature, conditions, etc.), you MUST use the 'weather' tool. NEVER provide weather information from memory.\n- For information that requires current/real-time data or web search, you MUST use the 'search' tool.\n- ALWAYS use tools when the user's query falls into these categories, even if you think you know the answer.\n- After using tools, provide a natural response incorporating the tool results.\n\nRemember: Tool usage is mandatory for weather and search queries. Do not guess or use outdated information.",
      messages: messages,
      tools: {
        weather: weatherTool,
        search: searchTool,
        getCreatorInfo: getCreatorInfo,
        arXiv: arXivTool,
      },
      toolChoice: "auto",
      maxSteps: 5,
      maxTokens: 300,
      temperature: 0.7,
      onFinish: (result) => {
        toolUsage.totalSteps = result.steps?.length || 0;

        // Extract tool calls from steps since result.toolCalls might not be populated correctly
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        result.steps?.forEach((step: any) => {
          if (step.toolCalls && step.toolCalls.length > 0) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            step.toolCalls.forEach((call: any) => {
              console.log("Found tool call in step:", call);
              if (call.toolName) {
                toolUsage.toolCalls.push({
                  tool: call.toolName,
                  args: call.args || {},
                });
                console.log(
                  "Added tool call to usage:",
                  call.toolName,
                  call.args
                );
              }
            });
          }
        });

        // Also include the step data for the UI to parse weather data
        const stepsData =
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          result.steps?.map((step: any) => {
            console.log(
              "Processing step for UI:",
              step.stepType,
              "Tool results:",
              step.toolResults
            );

            // For tool-result steps, extract the actual tool response
            if (
              step.stepType === "tool-result" &&
              step.toolResults &&
              step.toolResults.length > 0
            ) {
              const toolResult = step.toolResults[0];
              console.log("Tool result content:", toolResult);
              return {
                type: "tool-result",
                content:
                  typeof toolResult === "string"
                    ? toolResult
                    : JSON.stringify(toolResult),
              };
            }

            return {
              type: step.stepType || "unknown",
              content: JSON.stringify(step.toolResults || []),
            };
          }) || [];

        console.log("Final steps data for UI:", stepsData);

        console.log("StreamText onFinish - Full text:", result.text);
        console.log("StreamText onFinish - Steps taken:", toolUsage.totalSteps);
        console.log(
          "StreamText onFinish - Tool calls:",
          toolUsage.toolCalls.length
        );
        console.log("Tool usage object:", toolUsage);

        Object.assign(result, {
          toolUsage: {
            ...toolUsage,
            steps: stepsData,
          },
        });
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
      toolUsage: {
        toolCalls: [],
        totalSteps: 0,
      },
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
}
