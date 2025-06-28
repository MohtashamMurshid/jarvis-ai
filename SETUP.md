# 🤖 JARVIS AI Assistant - Setup Guide

A Next.js-powered AI assistant with premium voice recognition, premium text-to-speech, neural web search, and advanced AI chat capabilities.

## Quick Start

1. **Install dependencies:**

   ```bash
   npm install
   ```

2. **Start the development server:**

   ```bash
   npm run dev
   ```

3. **Open your browser:**
   Navigate to `http://localhost:3000`

## Features

- 🎤 **Whisper STT + Browser Fallback** - Premium AI speech recognition
- 🔊 **ElevenLabs TTS** - High-quality AI voice synthesis
- 🌤️ **WeatherAPI Integration** - Real-time weather and forecasts
- 🔍 **Exa Neural Search** - Advanced AI-powered web search
- 🤖 **GPT-4 Integration** - Powered by Vercel AI SDK
- 💬 **Modern UI** - Cinematic design with animations

## Voice Commands

- **"weather in [city]"** - Get current weather conditions
- **"forecast for [city]"** - Get 3-day weather forecast
- **"search for [topic]"** - Neural web search
- **"tell me about [topic]"** - Get AI explanation
- **"what is [question]"** - Ask AI questions
- **"stop talking"** - Stop speech output

## API Setup (Required for Full Functionality)

Create a `.env.local` file in your project root with the following:

### OpenAI API (for AI responses)

1. Get API key from [OpenAI Platform](https://platform.openai.com/api-keys)
2. Add to `.env.local`:
   ```
   OPENAI_API_KEY=your_openai_api_key_here
   ```

### ElevenLabs API (for premium voice synthesis)

1. Get API key from [ElevenLabs](https://elevenlabs.io/)
2. Add to `.env.local`:
   ```
   ELEVENLABS_API_KEY=your_elevenlabs_api_key_here
   ```

### Exa API (for neural search)

1. Get API key from [Exa.ai](https://exa.ai/)
2. Add to `.env.local`:
   ```
   EXA_API_KEY=your_exa_api_key_here
   ```

### WeatherAPI (for weather data)

1. Get API key from [WeatherAPI.com](https://www.weatherapi.com/docs/)
2. Add to `.env.local`:
   ```
   WEATHERAPI_KEY=your_weatherapi_key_here
   ```

## Browser Compatibility

- **Chrome/Edge**: Full support (recommended)
- **Firefox**: Full support
- **Safari**: Limited speech recognition

## Technology Stack

- **Frontend**: Next.js 15 with App Router, TypeScript, Tailwind CSS
- **AI**: Vercel AI SDK with GPT-4o-mini
- **Voice Input**: OpenAI Whisper + Web Speech API fallback
- **Voice Output**: ElevenLabs premium text-to-speech
- **Search**: Exa neural search with AI-powered results
- **Deployment**: Optimized for Vercel

## Complete .env.local Template

```bash
# OpenAI API Key (required for AI responses)
OPENAI_API_KEY=your_openai_api_key_here

# ElevenLabs API Key (required for premium voice)
ELEVENLABS_API_KEY=your_elevenlabs_api_key_here

# Exa API Key (required for neural search)
EXA_API_KEY=your_exa_api_key_here
```

## Development

```bash
npm run dev    # Start development server
npm run build  # Build for production
npm start      # Start production server
```

## Getting API Keys

1. **OpenAI**: Visit [platform.openai.com](https://platform.openai.com/api-keys)
2. **ElevenLabs**: Visit [elevenlabs.io](https://elevenlabs.io/) and sign up
3. **Exa**: Visit [exa.ai](https://exa.ai/) for neural search API

Experience the future of AI assistance with JARVIS! 🚀
