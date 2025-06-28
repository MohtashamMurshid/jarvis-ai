import Exa from "exa-js";
import { openai } from "@ai-sdk/openai";
import { generateText } from "ai";
import { z } from "zod";
import { tool } from "ai";

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
    return "Weather service is not configured. Please add WEATHERAPI_KEY to your .env.local file for weather data.";
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
    return "Weather service is temporarily unavailable. Please try again later.";
  }

  const weatherData = await response.json();
  const formattedResponse = formatWeatherResponse(weatherData, type);

  return formattedResponse;
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
  description: "Get the weather for the given location.",
  parameters: z.object({
    query: z.string().describe("The location to get the weather for."),
    type: z
      .enum(["current", "forecast", "astronomy"])
      .describe("The type of weather report to get."),
  }),
  execute: async ({ query, type }) => {
    return await getWeather(query, type);
  },
});

export const getCreatorInfo = tool({
  description: "Get information about the creator of the assistant.",
  parameters: z.object({}),
  execute: async () => {
    return `The creator of the Jarvis Assistant is Mohtasham Murshid Madani. He is a Computer Science Engineer and founder of Smarttex.ai, a startup building AI-powered writing assistants with docx and tex support. Originally from Srinagar, Kashmir, he's currently based in Malaysia (Selangor) studying computer science.

Key Background:
- Email: mohtashammurshid@gmail.com
- Education: Computer science student ( final year)
- Personality: Practical, avoids buzzwords, direct and thoughtful

Notable Projects:
1. Smarttex.ai - Document generation and writing assistant for academic papers
2. Bounty - Smart job-matching app using location and past orders (built with Expo + Clerk)
3. Checkmate - AI misinformation detection platform (ImagineHack 2025 First Runner-Up)
4. Bone fracture image classification using VGG16, ResNet-50, and custom CNN
5. Markdown to DOCX converter

Technical Stack:
- Languages: Python, Java, JavaScript, Kotlin, Swift, SQL
- Frontend: React, Next.js, TailwindCSS, NextUI, Framer Motion
- Backend: Flask, Convex, Clerk
- Mobile: Expo (React Native), Android Studio, SwiftUI
- ML/AI: CNNs, PyTorch, Keras, Scikit-learn
- Design: Figma, LottieFiles, AfterEffects, Blender

Web Dev Preferences:
- Dark mode UIs with clean, modern design
- Bento-style layouts with 70vw container width
- Futuristic buttons and professional fonts (ShadCN inspired)
- Framer Motion animations

Current Focus:
- Academic work: Writing structured reports, preparing to publish "Privacy-Aware LLMs: A Scalable Open-Source Framework"
- Learning about tools like Cursor and LLMs for local code changes
- Preparing for software engineering internship interviews
- Building useful, practical technology that saves time

Mohtasham values smart, clean technology and prefers practical solutions over buzzwords.`;
  },
});
