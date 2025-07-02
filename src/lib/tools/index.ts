import Exa from "exa-js";
import { openai } from "@ai-sdk/openai";
import { generateText } from "ai";
import { z } from "zod";
import { tool } from "ai";
import { XMLParser } from "fast-xml-parser";
import creatorInfo from "../../../creator.json";

interface SearchResult {
  title: string;
  link: string;
  snippet: string;
}

async function search(query: string) {
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

      if (item.highlights && item.highlights.length > 0) {
        content = item.highlights.join(" ... ");
      } else if (item.text) {
        content = item.text.slice(0, 500);
      } else {
        content = "No content available";
      }

      return {
        title: item.title || "Untitled",
        link: item.url,
        snippet: content + (content.length >= 500 ? "..." : ""),
      };
    });

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

    return aiResponse.text;
  } else {
    return `I'm unable to search the web for "${query}" because the EXA API key is not configured. To enable neural web search functionality, please add your EXA API key to the .env.local file. You can get your API key from https://exa.ai`;
  }
}

function formatWeatherResponse(
  data: Record<string, unknown>,
  type: string
): string {
  const location = data.location as {
    name: string;
    region: string;
    country: string;
  };

  if (type === "current") {
    const current = data.current as {
      condition: { text: string };
      temp_c: number;
      feelslike_c: number;
      humidity: number;
      wind_kph: number;
      wind_dir: string;
    };
    const condition = current.condition.text;
    const temp = Math.round(current.temp_c);
    const feelsLike = Math.round(current.feelslike_c);
    const humidity = current.humidity;
    const wind = Math.round(current.wind_kph);

    return `Current weather in ${location.name}, ${location.region}: ${condition}. Temperature ${temp}°C, feels like ${feelsLike}°C. Humidity ${humidity}%, wind speed ${wind} km/h from the ${current.wind_dir}.`;
  }

  if (type === "forecast" && data.forecast) {
    const forecast = data.forecast as {
      forecastday: Array<{
        day: {
          condition: { text: string };
          maxtemp_c: number;
          mintemp_c: number;
        };
      }>;
    };

    const today = forecast.forecastday[0].day;
    const tomorrow = forecast.forecastday[1]?.day;

    let response = `Weather forecast for ${location.name}, ${
      location.region
    }: Today will be ${today.condition.text.toLowerCase()} with highs of ${Math.round(
      today.maxtemp_c
    )}°C and lows of ${Math.round(today.mintemp_c)}°C.`;

    if (tomorrow) {
      response += ` Tomorrow expects ${tomorrow.condition.text.toLowerCase()} with temperatures between ${Math.round(
        tomorrow.mintemp_c
      )}°C and ${Math.round(tomorrow.maxtemp_c)}°C.`;
    }

    return response;
  }

  if (type === "astronomy") {
    const astronomy = data.astronomy as {
      astro: {
        sunrise: string;
        sunset: string;
        moon_phase: string;
        moon_illumination: string;
      };
    };
    const astro = astronomy.astro;
    return `Astronomy data for ${location.name}: Sunrise at ${astro.sunrise}, sunset at ${astro.sunset}. Moon phase: ${astro.moon_phase} with ${astro.moon_illumination}% illumination.`;
  }

  return `Weather data retrieved for ${location.name}, ${location.region}.`;
}

async function getWeather(
  query: string,
  type: "current" | "forecast" | "astronomy"
) {
  const weatherApiKey = process.env.WEATHERAPI_KEY;

  if (!weatherApiKey) {
    return {
      error:
        "Weather service is not configured. Please add WEATHERAPI_KEY to your .env.local file for weather data.",
    };
  }

  let endpoint = "";
  const params = new URLSearchParams({
    key: weatherApiKey,
    q: query,
    aqi: "yes",
  });

  switch (type) {
    case "current":
      endpoint = "current.json";
      break;
    case "forecast":
      endpoint = "forecast.json";
      params.append("days", "3");
      params.append("alerts", "yes");
      break;
    case "astronomy":
      endpoint = "astronomy.json";
      break;
    default:
      endpoint = "current.json";
  }

  const response = await fetch(
    `http://api.weatherapi.com/v1/${endpoint}?${params.toString()}`
  );

  if (!response.ok) {
    const errorText = await response.text();
    console.error(`WeatherAPI error: ${response.status} - ${errorText}`);
    return {
      error:
        "Weather service is temporarily unavailable. Please try again later.",
    };
  }

  const weatherData = await response.json();

  // Return both raw data and formatted response for flexibility
  return {
    data: weatherData,
    formatted: formatWeatherResponse(weatherData, type),
    type,
  };
}

export const searchTool = tool({
  description: "Search the web for the given query.",
  parameters: z.object({
    query: z.string().describe("The query to search for."),
  }),
  execute: async ({ query }) => {
    return await search(query);
  },
});

export const weatherTool = tool({
  description:
    "Get current weather conditions, forecasts, or weather information for any location. Use this tool for ALL weather-related queries including temperature, conditions, forecasts, and climate data.",
  parameters: z.object({
    query: z
      .string()
      .describe(
        "The location to get the weather for (city, region, country, or coordinates)."
      ),
    type: z
      .enum(["current", "forecast", "astronomy"])
      .describe("The type of weather report to get.")
      .default("current"),
  }),
  execute: async ({ query, type }) => {
    console.log("=== WEATHER TOOL EXECUTION ===");
    console.log("Query:", query);
    console.log("Type:", type);

    const result = await getWeather(query, type);
    console.log("Weather result:", result);

    // If there's an error, return the formatted text
    if (result.error) {
      console.log("Weather error:", result.error);
      return result.error;
    }

    // Return both the data and formatted text for flexibility
    const response = {
      data: result.data,
      formatted: result.formatted,
      type: result.type,
    };

    console.log("Weather tool response:", response);
    return response;
  },
});

export const getCreatorInfo = tool({
  description: "Get information about the creator of the assistant.",
  parameters: z.object({}),
  execute: async () => {
    return creatorInfo;
  },
});

interface ArXivAuthor {
  name?: string;
}

interface ArXivLink {
  "@_title"?: string;
  "@_href"?: string;
}

interface ArXivEntry {
  title?: string;
  author?: ArXivAuthor | ArXivAuthor[];
  summary?: string;
  published?: string;
  link?: ArXivLink | ArXivLink[];
}

interface ArXivFeed {
  entry?: ArXivEntry | ArXivEntry[];
  "opensearch:totalResults"?: string;
  "opensearch:startIndex"?: string;
  "opensearch:itemsPerPage"?: string;
}

interface ArXivResponse {
  feed: ArXivFeed;
}

export const arXivTool = tool({
  description:
    "Search and retrieve papers from arXiv. Use this tool for finding academic papers, research articles, and preprints from arXiv.org.",
  parameters: z.object({
    query: z
      .string()
      .describe(
        "The search query. Can include author names, titles, abstracts, etc."
      ),
    type: z
      .enum(["search", "id"])
      .describe("Whether to search papers or get a specific paper by ID")
      .default("search"),
    id: z
      .string()
      .optional()
      .describe("The arXiv ID when retrieving a specific paper"),
    start: z
      .number()
      .optional()
      .describe("Starting index for search results")
      .default(0),
    maxResults: z
      .number()
      .optional()
      .describe("Maximum number of results to return")
      .default(10),
  }),
  execute: async ({ query, type, id, start, maxResults }) => {
    try {
      const baseUrl = "http://export.arxiv.org/api/query";
      let url = baseUrl;

      if (type === "search") {
        const params = new URLSearchParams({
          search_query: query,
          start: start.toString(),
          max_results: maxResults.toString(),
        });
        url += "?" + params.toString();
      } else if (type === "id" && id) {
        const params = new URLSearchParams({
          id_list: id,
        });
        url += "?" + params.toString();
      }

      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(
          `arXiv API error: ${response.status} ${response.statusText}`
        );
      }

      const data = await response.text();

      // Parse the XML response using fast-xml-parser
      const parser = new XMLParser({
        ignoreAttributes: false,
        attributeNamePrefix: "@_",
      });
      const result = parser.parse(data) as ArXivResponse;

      const feed = result.feed;
      const entries = (
        Array.isArray(feed.entry) ? feed.entry : [feed.entry]
      ).filter(
        (entry): entry is ArXivEntry => entry !== undefined && entry !== null
      );

      const results = entries.map((entry: ArXivEntry) => ({
        title: entry.title?.trim() || "",
        authors: Array.isArray(entry.author)
          ? entry.author.map((a: ArXivAuthor) => a.name || "")
          : entry.author?.name
          ? [entry.author.name]
          : [],
        summary: entry.summary?.trim() || "",
        published: entry.published || "",
        pdfLink: Array.isArray(entry.link)
          ? entry.link.find((l: ArXivLink) => l["@_title"] === "pdf")?.[
              "@_href"
            ] || ""
          : entry.link?.["@_title"] === "pdf"
          ? entry.link["@_href"]
          : "",
      }));

      return {
        totalResults: feed["opensearch:totalResults"] || "0",
        startIndex: feed["opensearch:startIndex"] || "0",
        itemsPerPage: feed["opensearch:itemsPerPage"] || "0",
        results,
      };
    } catch (error: unknown) {
      console.error("arXiv API error:", error);
      if (error instanceof Error) {
        throw new Error(`Failed to fetch from arXiv: ${error.message}`);
      }
      throw new Error("Failed to fetch from arXiv: An unknown error occurred");
    }
  },
});
