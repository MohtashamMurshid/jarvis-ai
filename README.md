# JARVIS AI Terminal

A modern, interactive AI assistant interface built with Next.js that combines voice commands, text-to-speech, and natural language processing capabilities.

![JARVIS Terminal Interface](public/terminal.png)

## Features

- 🎤 **Voice Commands**: Hold spacebar to speak commands naturally
- 🔊 **Text-to-Speech**: AI responses with high-quality voice synthesis
- 🌐 **Web Search**: Instant access to web information
- 🌤️ **Weather Updates**: Real-time weather information for any location
- 💬 **Context-Aware AI**: Maintains conversation history for better responses
- ⌨️ **Command History**: Navigate through previous commands with arrow keys
- 🎨 **Beautiful Terminal UI**: Modern, responsive design with color-coded outputs

## Commands

- `help` (aliases: `h`, `?`) - Show help information
- `clear` (aliases: `cls`, `exit`, `quit`) - Clear terminal
- `weather [location]` (alias: `w`) - Get weather information
- `search [query]` (alias: `s`) - Search the web
- Any other input will be treated as a question for the AI

## Keyboard Shortcuts

- `SPACEBAR` (hold) - Activate voice input
- `ESC` - Emergency stop all activity
- `↑/↓` arrows - Navigate command history
- `Ctrl+L` - Clear terminal
- `Enter` - Execute command

## Getting Started

### Prerequisites

- Node.js 18.x or higher
- npm or yarn package manager

### Installation

1. Clone the repository:

```bash
git clone https://github.com/yourusername/jarvis-ai.git
cd jarvis-ai
```

2. Install dependencies:

```bash
npm install
# or
yarn install
```

3. Create a `.env` file in the root directory with your API keys:

```env
OPENAI_API_KEY=your_openai_api_key
ELEVENLABS_API_KEY=your_elevenlabs_api_key
WEATHERAPI_KEY=your_weatherapi_key
SERP_API_KEY=your_serpapi_key
```

4. Start the development server:

```bash
npm run dev
# or
yarn dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser

## Technology Stack

- **Frontend**: Next.js, React, TailwindCSS
- **Speech Recognition**: Web Speech API
- **Text-to-Speech**: ElevenLabs API (with browser TTS fallback)
- **AI Processing**: OpenAI API
- **Weather Data**: WeatherAPI
- **Web Search**: SerpAPI

## Color Coding

- 🔵 **Cyan** - User input and system prompts
- 🟢 **Green** - AI responses and help text
- 🟡 **Yellow** - Search results and processing
- 🔷 **Blue** - Weather data and speech activity
- 🟣 **Purple** - Voice recognition and shortcuts
- 🔴 **Red** - Errors and emergency stops

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- OpenAI for the AI capabilities
- ElevenLabs for the voice synthesis
- WeatherAPI for weather data
- SerpAPI for web search functionality

---

Built with ❤️ using Next.js and AI technologies
