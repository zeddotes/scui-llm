# SCUI powered by LLMs

Schema-driven UI runtime powered by LLMs.

SCUI is a small runtime for turning model output into UI **without allowing the model to generate JSX**. Models return structured “blocks”; SCUI validates them against a component catalog (schemas), then renders only what’s allowed.

## Why SCUI

- **No uncontrolled generation**: the model can only select from your catalog.
- **Schema-first**: every block’s props are validated before rendering.
- **Transport-only adapters**: model integrations don’t know about React or your components.
- **Predictable rendering**: invalid props or unknown components are skipped.

## Packages

- **`@scui-llm/core`**: contracts + adapter interface + basic execution helpers
- **`@scui-llm/react`**: React renderer package — components and hooks (`SCUIProvider`, `SCUIRender`, `useSCUIBlocks`, etc.)
- **`@scui-llm/adapters`**: transport-only adapters (`fetch`, OpenAI-compatible)
- **`@scui-llm/zod`**: catalog helpers and Zod validation utilities (no React dependency)

SCUI ships a React rendering layer today; PRs for additional framework renderers (Vue/Svelte/Solid/etc.) are welcome.

## Installation (consumer)

```bash
bun add @scui-llm/react @scui-llm/core @scui-llm/adapters @scui-llm/zod
```

## Quick start (React)

Define a catalog:

```ts
import { z } from "zod";
import { defineCatalog } from "@scui-llm/zod";

function MetricCard(props: { label: string; value: number }) {
  return (
    <div>
      <div>{props.label}</div>
      <div>{props.value}</div>
    </div>
  );
}

export const catalog = defineCatalog({
  MetricCard: {
    component: MetricCard,
    schema: z.object({
      label: z.string(),
      value: z.number(),
    }),
    description: "Displays a metric",
  },
});
```

Wire it up:

```tsx
import { SCUIProvider, SCUIRender } from "@scui-llm/react";
import { createFetchAdapter } from "@scui-llm/adapters";
import { catalog } from "./catalog";

const adapter = createFetchAdapter({ url: "/api/scui" });

export function App() {
  return (
    <SCUIProvider adapter={adapter} catalog={catalog}>
      <SCUIRender
        prompt="Show active users metric"
        loading={({ status }) => <div>Loading ({status})…</div>}
        error={(err) => <div>SCUI failed: {err.message}</div>}
        skipped={() => <div>No eligible blocks to render.</div>}
      />
    </SCUIProvider>
  );
}
```

`/api/scui` is not required — it’s an example **recommended** server-side endpoint used to keep LLM/API keys off the client and centralize auth, rate-limiting, logging, and retries. In production, model calls should typically happen server-side.

If you use a fetch adapter like above, your server endpoint should return:

```json
{
  "blocks": [
    {
      "component": "MetricCard",
      "props": { "label": "Active users", "value": 123 }
    }
  ]
}
```

## Core concepts

### Blocks

A block is the unit of rendering:

- `component`: catalog key (string)
- `props`: JSON object validated by the catalog entry schema

### Catalog

The catalog is the only mapping from model output to renderable UI. If a block component is missing from the catalog, it is not rendered.

### Validation behavior

- Unknown `component` → skipped
- Schema validation failure → skipped
- Valid entry + valid props → rendered

### Debug mode (React)

In React, you can enable debug logging to see state transitions and why blocks were skipped:

- Pass `debug` to `SCUIProvider` to log `SCUIState` transitions, adapter results, and block skip reasons.

## Adapters

Adapters are transport-only and return structured data. They should not:

- generate JSX
- know about your catalog/components
- assume auth; only accept optional headers

Provided adapters:

- **Fetch adapter**: call your own API endpoint
- **OpenAI-compatible adapter**: targets OpenAI Responses API (`/v1/responses`) by default; expects JSON output matching SCUI blocks

## Constraints (v1)

- Flat `blocks` only (no nested layouts)
- No action execution
- No orchestration/memory layer

## Repository development

Tooling:

- Node pinned by `.nvmrc` (use `nvm use`)
- Bun as package manager and script runner
- Turbo for task orchestration
- tsup for builds (ESM + CJS + DTS)

Commands:

```bash
nvm use
bun install

bun run build
bun run test
bun run lint
```

Docs live in `docs/`. A runnable example lives in `examples/react-basic/`.

## Versioning & publishing

This repo is set up for Changesets.

```bash
nvm use
bun run build
bunx changeset version
bunx changeset publish
```

## Contributing

Issues and pull requests are welcome.
Framework renderers beyond React are explicitly in-scope.

### Reporting issues

- Include a minimal reproduction (code snippet or repo link).
- Include environment details: OS, `node -v`, `bun --version`, and the SCUI package versions.
- If the issue is rendering-related, include the generated `{ blocks: [...] }` payload and the relevant catalog entry schema.

### Submitting pull requests

- Keep changes focused and small.
- Follow the repository rules in `AGENTS.md` (schema-driven rendering, catalog validation, adapters are transport-only).
- Run the full checks before opening the PR:

```bash
nvm use
bun install
bun run build
bun run test
bun run lint
```

### Changesets

If your change affects published behavior (APIs, adapter behavior, renderer semantics), add a changeset:

```bash
bunx changeset
```
