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
npm run test       # vitest (unit/component)
npm run test:e2e   # playwright (chromium, API mocked)
npm run typecheck
npm run lint
```

### Demo

`npm run dev` serves a demo page (`index.html`): paste an embed key created in the
jac-rag CMS and the API URL, then click **Avvia widget**. You can also prefill them
via query string:

```
http://localhost:5173/?key=pk_...&api=http://localhost:8000
```

## Usage

The customer pastes one `<script>` into their site. The API URL is baked into
the bundle at build time (`VITE_WIDGET_API_URL`), so only the embed key is
per-tenant:

```html
<script
  src="https://widget.example.com/embed-rag-chatbot.js"
  data-embed-key="pk_..."
  defer
></script>
```

### Data attributes

| Attribute            | Required | Description                                                     |
| -------------------- | -------- | --------------------------------------------------------------- |
| `data-embed-key`     | yes      | Publishable tenant embed key (`X-Embed-Key`).                   |
| `data-api-url`       | no       | Overrides the baked API URL (rarely needed).                    |
| `data-locale`        | no       | Force UI language (`it` / `en`); else browser, then tenant.     |
| `data-title`         | no       | Panel title; defaults to the tenant name from `/widget/config`. |
| `data-welcome`       | no       | Welcome message shown before the first turn.                    |
| `data-primary-color` | no       | Accent color (CSS variable `--erc-primary`).                    |
| `data-position`      | no       | `bottom-right` (default) or `bottom-left`.                      |
| `data-auto-open`     | no       | `"true"` to open the panel on load.                             |

## Hosting

`dist/embed-rag-chatbot.js` is a static file: it only needs to be served over
HTTP. The included `Dockerfile` builds it and serves it with nginx.

```sh
cp .env.example .env      # set VITE_WIDGET_API_URL to the public API base URL
docker compose up --build # serves http://localhost:8080/embed-rag-chatbot.js
```

`VITE_WIDGET_API_URL` is **required** for this image (the build fails without it)
because it is the address the widget must call from the customer's browser: it
has to be the public API URL, not an internal Docker service name.

## Roadmap

- **P0** scaffold (toolchain, CI, smoke test) — done
- **P1** API client + SSE parser + visitor state — done
- **P2** Shadow DOM UI, i18n (IT/EN), theming — done
- **P3** demo page, size budget, e2e — done
- **P4** static hosting (nginx image + baked API URL) — done
