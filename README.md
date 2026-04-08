# OpenComet

Open-source agentic browser with AI control.

## Quick Start

### 1. Install Node dependencies
```bash
npm install
```

### 2. Install Python dependencies
```bash
cd agent
pip install -r requirements.txt
playwright install chromium
```

### 3. Set your OpenAI API key
```bash
export OPENAI_API_KEY=your_api_key_here
```

Or add it in the app settings.

### 4. Run the app
```bash
npm run dev
```

The agent server starts automatically with the app.

## Development

```bash
# Run in development mode
npm run dev

# Build for production
npm run build:mac   # macOS
npm run build:win   # Windows  
npm run build:linux # Linux
```

## Manual Agent Server

If you need to run the agent server separately:

```bash
cd agent
python3 server.py
```

The server runs on `http://localhost:8765`

## Architecture

```
┌─────────────────────────────────────┐
│        Electron Desktop App         │
│   React UI + Chromium Browser       │
└─────────────────────────────────────┘
              ↕ IPC
┌─────────────────────────────────────┐
│       Python Agent Server           │
│   LangChain + LiteLLM + Playwright  │
└─────────────────────────────────────┘
```

## Project Structure

```
├── electron/         # Electron main process
├── src/              # React frontend
├── agent/            # Python agent server
│   ├── tools/        # Browser tools (Playwright)
│   └── agents/       # Agent logic (LangChain)
├── public/           # Static assets
└── release/          # Built executables
```

## License

MIT