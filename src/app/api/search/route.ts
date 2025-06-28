import Exa from "exa-js";
import { openai } from "@ai-sdk/openai";
import { generateText } from "ai";

interface SearchResult {
  title: string;
  link: string;
  snippet: string;
}

export async function POST(request: Request) {
  try {
    const { query } = await request.json();

    if (!query) {
      return Response.json({ error: "Query is required" }, { status: 400 });
    }

    const exaApiKey = process.env.EXA_API_KEY;

    if (exaApiKey) {
      const exa = new Exa(exaApiKey);

      const results = await exa.searchAndContents(query, {
        type: "neural",
        useAutoprompt: true,
        numResults: 5,
        text: {
          maxCharacters: 1000,
          includeHtmlTags: false,
        },
        highlights: {
          numSentences: 3,
          highlightsPerUrl: 3,
        },
      });

      const formattedResults: SearchResult[] = results.results.map((item) => {
        let content = "";

        // Try to get content from highlights first (more relevant)
        if (item.highlights && item.highlights.length > 0) {
          content = item.highlights.join(" ... ");
        }
        // Fallback to full text if highlights not available
        else if (item.text) {
          content = item.text.slice(0, 500);
        }
        // Final fallback
        else {
          content = "No content available";
        }

        return {
          title: item.title || "Untitled",
          link: item.url,
          snippet: content + (content.length >= 500 ? "..." : ""),
        };
      });

      // Feed search results to OpenAI for synthesis
      const searchContext = formattedResults
        .map(
          (result, index) =>
            `Source ${index + 1}: ${result.title}\n${result.snippet}\nURL: ${
              result.link
            }\n---`
        )
        .join("\n\n");

      const aiResponse = await generateText({
        model: openai("gpt-4o-mini"),
        prompt: `Based on the following search results, provide a clear, comprehensive answer to the user's query: "${query}"

        Search Results:
        ${searchContext}

        Please synthesize this information into a coherent, helpful response. Include relevant details . Be factual and concise. You will be used to narate the search results to the user. So talk like a assistant. Do not include any other text in your response not even a source link.`,
        maxTokens: 100,
        temperature: 0.3,
      });

      return Response.json({
        response: aiResponse.text,
        sources: formattedResults.map((r) => ({ title: r.title, url: r.link })),
      });
    } else {
      // Fallback response when no Exa API key is provided
      return Response.json({
        response: `I'm unable to search the web for "${query}" because the EXA API key is not configured. To enable neural web search functionality, please add your EXA API key to the .env.local file. You can get your API key from https://exa.ai`,
        sources: [],
      });
    }
  } catch (error) {
    console.error("Search API error:", error);
    return Response.json(
      {
        response:
          "I apologize, but I'm experiencing technical difficulties with the search functionality. Please try again in a moment.",
        sources: [],
        error: "Neural search request failed",
      },
      { status: 500 }
    );
  }
}
