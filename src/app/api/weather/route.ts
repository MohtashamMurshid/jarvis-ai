export async function POST(request: Request) {
  try {
    const { query, type = "current" } = await request.json();

    if (!query) {
      return Response.json(
        { error: "Location query is required" },
        { status: 400 }
      );
    }

    const weatherApiKey = process.env.WEATHERAPI_KEY;

    if (!weatherApiKey) {
      console.log("WeatherAPI key not configured, returning fallback response");
      return Response.json(
        {
          error: "WeatherAPI key not configured",
          fallback: true,
          message:
            "Please add WEATHERAPI_KEY to your .env.local file for weather data",
        },
        { status: 200 }
      );
    }

    console.log(`Fetching ${type} weather for: "${query}"`);

    let endpoint = "";
    const params = new URLSearchParams({
      key: weatherApiKey,
      q: query,
      aqi: "yes", // Include air quality data
    });

    // Determine API endpoint based on request type
    switch (type) {
      case "current":
        endpoint = "current.json";
        break;
      case "forecast":
        endpoint = "forecast.json";
        params.append("days", "3"); // 3-day forecast
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

      return Response.json(
        {
          error: `Weather service error: ${response.status}`,
          fallback: true,
          message: "Weather service temporarily unavailable",
        },
        { status: 200 }
      );
    }

    const weatherData = await response.json();
    console.log(
      `Weather data retrieved successfully for ${weatherData.location?.name}`
    );

    // Format the response for JARVIS
    const formattedResponse = formatWeatherResponse(weatherData, type);

    return Response.json({
      success: true,
      data: weatherData,
      formatted: formattedResponse,
      type: type,
    });
  } catch (error) {
    console.error("Weather API error:", error);
    return Response.json(
      {
        error: "Failed to fetch weather data",
        fallback: true,
        message: "Weather service encountered an error",
      },
      { status: 200 }
    );
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
