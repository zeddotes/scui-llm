# Adapters

Adapters are transport-only. They do not know about React, catalogs, or components.

## Fetch adapter

```ts
import { createFetchAdapter } from "@scui-llm/adapters";

const adapter = createFetchAdapter({
  url: "/api/scui",
  headers: { Authorization: "Bearer ..." },
  mapRequest: (req) => req,
});
```

## OpenAI-compatible adapter

```ts
import { createOpenAICompatibleAdapter } from "@scui-llm/adapters";

const adapter = createOpenAICompatibleAdapter({
  baseUrl: "https://api.openai.com",
  model: "gpt-5.4",
  headers: { Authorization: "Bearer ..." },
});
```

## Rules

- No auth assumptions (only optional header injection)
- Allow custom headers
- Allow request/response mapping
- Allow custom fetch implementation

## Notes

- The OpenAI-compatible adapter targets the OpenAI Responses API (`/v1/responses`) by default.
- The adapter asks the model for JSON matching `{"blocks":[{"component":string,"props":object}]}` and parses response text defensively (code-fence stripping + balanced-object extraction).
- Final render eligibility is still decided by catalog validation in the React render layer.
- For the OpenAI-compatible adapter, the prompt includes a catalog hint derived from each entry’s Zod schema (`propsSchema`) to improve model adherence to the expected prop shapes.

## Catalog schema enforcement

The catalog entry’s Zod schema is the source of truth. Rendering validates `block.props` against the entry schema; invalid blocks are skipped.

