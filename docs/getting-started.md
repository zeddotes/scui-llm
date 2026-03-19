# Getting Started

Install:

```bash
bun add @scui-llm/react @scui-llm/core @scui-llm/adapters @scui-llm/zod
```

Define a catalog:

```ts
import { z } from "zod";
import { defineCatalog } from "@scui-llm/zod";

function MetricCard(props: { label: string; value: number }) {
  return <div>{props.label}: {props.value}</div>;
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

Wire up provider + renderer:

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
        loading={({ status }) => <div>Loading ({status})...</div>}
        error={(err) => <div>SCUI failed: {err.message}</div>}
        skipped={() => <div>No eligible blocks to render.</div>}
      />
    </SCUIProvider>
  );
}
```

`/api/scui` is not required, but it is the recommended production pattern so model/API keys stay server-side.

Your endpoint should return:

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

Why this shape: SCUI runtime expects a top-level `blocks` array and performs component lookup + props validation against your catalog before rendering.

## Development workflow

Before running any node-based tooling (including `bun run build/test/lint`), run:

```bash
nvm use
```

