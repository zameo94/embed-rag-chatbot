# embed-rag-chatbot

Embeddable chat widget for [jac-rag](../jac-rag) tenants. A single static
bundle (Preact + Shadow DOM) that a customer pastes into their site and that
talks directly to the tenant's widget API with a publishable embed key.

## Stack

- **Preact** + **Vite** (library mode) → one IIFE bundle, no server runtime.
- **Shadow DOM** custom element `<embed-rag-chatbot>` for full CSS isolation.
- **SSE** via `fetch` + `ReadableStream` (POST + custom headers; `EventSource`
  cannot send headers).

## Development

```sh
npm install
npm run dev        # dev page at http://localhost:5173
npm run build      # dist/embed-rag-chatbot.js
npm run test       # vitest
npm run typecheck
npm run lint
```

## Usage (planned)

```html
<script
  src="https://cdn.example.com/embed-rag-chatbot.js"
  data-embed-key="pk_..."
  data-api-url="https://api.example.com"
  defer
></script>
```

## Roadmap

- **P0** scaffold (toolchain, CI, smoke test) — done
- **P1** API client + SSE parser + visitor state — done
- **P2** Shadow DOM UI, i18n (IT/EN), theming
- **P3** demo page, size budget, e2e
