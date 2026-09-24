# embed-rag-chatbot

Embeddable chat widget for [jac-rag](https://github.com/zameo94/jac-rag)
workspaces. A single static bundle (Preact + Shadow DOM) that a customer pastes
into their site and that talks directly to the workspace's widget API with a
publishable embed key.

The code in this repo was entirely written by a coding agent (mostly DeepSeek
V4.1 Flash). The idea, the architecture and the system design were under human
control.

---

## Table of contents

- [Overview](#overview)
- [First run](#first-run)
- [Usage](#usage)
- [Data attributes](#data-attributes)
- [How it works](#how-it-works)
- [Hosting](#hosting)
- [Configuration](#configuration)
- [Development](#development)
- [Tests](#tests)
- [Limitations](#limitations)
- [License](#license)

---

## Overview

This is the **widget** half of jac-rag: the piece that runs on the customer's
site. It is a **separate repo** from the platform (the CMS and the API live in
[jac-rag](https://github.com/zameo94/jac-rag)).

- One static **IIFE** bundle (`dist/embed-rag-chatbot.js`), no server runtime.
- A **custom element** `<embed-rag-chatbot>` rendered in the **Shadow DOM** for
  full CSS isolation from the host page.
- Talks to the API under `/api/v1/widget/*` using a **publishable embed key**
  (`X-Embed-Key`) and an opaque **visitor token** (`X-Visitor-Token`).
- Streaming answers over **SSE** via `fetch` + `ReadableStream` (`EventSource`
  cannot POST or send headers).

---

## First run

The fastest way to see it working is the bundled **demo server** (nginx serving
the built bundle + a demo page):

```sh
cp .env.example .env      # set VITE_WIDGET_API_URL (and optionally WIDGET_EMBED_KEY)
docker compose up --build
```

Then open **http://localhost:8080/**. If `WIDGET_EMBED_KEY` is set (an embed key
created in the jac-rag CMS), the widget mounts on load; otherwise the page shows
a hint telling you to set it.

> `VITE_WIDGET_API_URL` is **required** for this image: it is the public API URL
> the widget calls from the customer's browser, so the build **fails without it**.
> It must be a reachable public URL, not an internal Docker service name.

For local development without Docker:

```sh
npm install
npm run dev        # demo page at http://localhost:5173
```

---

## Usage

The customer pastes one `<script>` into their site. The API URL is baked into
the bundle at build time (`VITE_WIDGET_API_URL`), so only the embed key is
per-workspace:

```html
<script
  src="https://widget.example.com/embed-rag-chatbot.js"
  data-embed-key="pk_..."
  data-locale="en"
  defer
></script>
```

---

## Data attributes

| Attribute            | Required | Description                                                            |
| -------------------- | -------- | ---------------------------------------------------------------------- |
| `data-embed-key`     | yes      | Publishable workspace embed key (`X-Embed-Key`).                       |
| `data-api-url`       | no       | Overrides the baked API URL (rarely needed).                           |
| `data-locale`        | no       | UI language (`it` / `en`); else the workspace language (default `en`). |
| `data-title`         | no       | Panel title; defaults to the workspace name from `/widget/config`.     |
| `data-welcome`       | no       | Welcome message shown before the first turn.                           |
| `data-primary-color` | no       | Accent color (CSS variable `--erc-primary`).                           |
| `data-position`      | no       | `bottom-right` (default) or `bottom-left`.                             |
| `data-auto-open`     | no       | `"true"` to open the panel on load.                                    |

---

## How it works

1. **Config** — on load (and again at the start of every new conversation) the
   widget calls `GET /api/v1/widget/config` to read the workspace name, the
   default locale and whether the workspace is active.
2. **Language** — the UI language is `data-locale` → workspace `default_locale`
   → `en`. The browser language is intentionally ignored; the workspace decides.
3. **Session** — the first API call mints a visitor session
   (`POST /api/v1/widget/session`) and stores the opaque visitor token in
   `localStorage`, so the same visitor keeps the same conversations.
4. **Chat** — messages are sent to `POST /api/v1/widget/chat` (JSON) or
   `POST /api/v1/widget/chat/stream` (SSE: `sources` → `token`* → `done`, or
   `error`). The conversation id is kept across turns.
5. **History** — `GET /api/v1/widget/conversations` and
   `/conversations/{id}` are read-only and scoped to the visitor token.

The widget only ever needs the **embed key** (publishable, shown once in the
CMS); the platform derives the workspace server-side.

---

## Hosting

`dist/embed-rag-chatbot.js` is a static file: it only needs to be served over
HTTP. The included `Dockerfile` builds it and serves it with **nginx**:

```sh
cp .env.example .env
docker compose up --build   # serves http://localhost:8080/embed-rag-chatbot.js
```

Serve the same file from any static host (CDN, S3, nginx); no runtime is needed.

---

## Configuration

The `.env` (copied from `.env.example`):

| Variable               | Required | Description                                                                 |
| ---------------------- | -------- | --------------------------------------------------------------------------- |
| `VITE_WIDGET_API_URL`  | yes      | Public API base URL the widget calls. Baked into the bundle at build time.  |
| `WIDGET_EMBED_KEY`     | no       | Embed key used by the demo page at `/`. If unset, the page shows a hint.    |
| `WIDGET_PORT`          | no       | Host port for the demo nginx server (default `8080`).                       |

`VITE_*` variables are exposed by Vite to the app and inlined at build time, so
changing `VITE_WIDGET_API_URL` requires a rebuild.

---

## Development

```sh
npm install
npm run dev        # demo page at http://localhost:5173
npm run build      # dist/embed-rag-chatbot.js
npm run test       # vitest (unit/component)
npm run test:e2e   # playwright (chromium, API mocked)
npm run typecheck
npm run lint
```

### Demo

`npm run dev` serves a demo page (`index.html`): paste an embed key created in
the jac-rag CMS and the API URL, then click **Avvia widget**. You can also
prefill them via query string:

```
http://localhost:5173/?key=pk_...&api=http://localhost:8000
```

---

## Tests

```sh
npm test           # Vitest: API client, SSE parser, visitor state, UI, i18n
npm run test:e2e   # Playwright (chromium) against a mocked widget API
```

The bundle has a **size budget** enforced in CI (< 15 kB gzip); CI also runs
lint, format check, typecheck, unit tests, e2e and the build.

---

## Limitations

- No browser-language detection: the language comes from `data-locale` and the
  workspace `default_locale` (fallback `en`).
- The API URL is fixed at build time (per deployment), not per embed.
- Conversations history is read-only in the widget (no delete).
- The widget is anonymous: identity is the visitor token, not a logged-in user.

---

## License

Released under the [MIT License](LICENSE).
