# Rendering

SCUI renders a flat list of validated blocks.

## Renderer behavior

- If a block's `component` is not in the catalog: it is skipped.
- If props fail schema validation: it is skipped.
- Otherwise the catalog component is rendered with parsed props.

## Skipped UI (React)

If the request succeeds but all returned blocks are ineligible (unknown component or props validation failure), `SCUIRender` can render `skipped` (default `null`).

Rationale: this separates non-fatal ineligibility from runtime failures (`error`).

## Enforcement source of truth

The enforcement mechanism is the catalog entry's Zod schema.

## Loading state

The React layer exposes a simple state machine:

```ts
type SCUIState = {
  status: "idle" | "loading" | "streaming" | "validating" | "ready" | "error";
  partial?: { blocks: { component: string; props: Record<string, unknown> }[] };
  error?: Error;
};
```

In `SCUIRender`:

- `loading` handles in-flight states
- `error` handles adapter/runtime failures
- `skipped` handles successful responses where no block is eligible

## v1 constraints

- Flat blocks only (no nested layouts)
- No actions execution

## Common failure mode

If your model returns a value with a different type than your schema expects, validation fails and the block is skipped.

Use schema coercion when you intentionally accept multiple encodings.

