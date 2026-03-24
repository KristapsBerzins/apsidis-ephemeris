# CLAUDE.md

This repository is a **pure astronomical calculation service**.

Never add:
- User authentication or session handling
- Database connections or any persistence layer
- Business logic specific to any application
- AI / LLM calls
- References to specific app features (e.g. "daily visions", "counsel", credits)
- Any code that knows about the application that consumes this service

This service knows only about astronomy. Its inputs are datetimes and geographic coordinates. Its outputs are planetary positions, house cusps, and aspects. Keep it that way.

## Commands

```bash
npm run dev     # Start dev server with ts-node
npm run build   # Compile TypeScript to dist/
npm start       # Run compiled output
npm run lint    # Lint src/
```

## Architecture

- `src/index.ts` — Express server entry point
- All calculation logic should live in `src/calculations/` as pure functions
- No external HTTP calls; only the `swisseph` native module
