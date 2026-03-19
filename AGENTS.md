# SCUI AGENTS ENTRYPOINT

This repository implements a schema-driven UI runtime powered by LLMs.

## Core Principles

- Schema-driven UI rendering from structured blocks
- Catalog entry Zod schemas are the enforcement source of truth
- Adapter-based model execution with transport-only integrations
- No uncontrolled generation (models must not emit JSX)

## Packages

- `@scui-llm/core` → runtime contracts + execution helpers
- `@scui-llm/zod` → catalog helpers + validation utilities
- `@scui-llm/react` → React provider, hook, and renderer
- `@scui-llm/adapters` → fetch/OpenAI-compatible transport adapters

## Rules

- Never generate JSX from models
- Always validate block props against catalog entry schemas
- Never bypass catalog
- Keep adapters transport-only
- `SCUIModelRequest` should be catalog-driven; do not add back a request-level `schema` field
- In React:
  - `loading` is for in-flight states
  - `error` is for adapter/runtime failures
  - `skipped` is for successful responses where all blocks are ineligible
  - `fallback` prop is removed from `SCUIRender`
- Keep debug logging opt-in via `SCUIProvider debug`
- Prefer server-side LLM calls (e.g. `/api/scui`) to protect API keys
- Run `nvm use` before any node-based tooling (including `bun run build`, `bun run test`, and `bun run lint`).

## Current Runtime Behavior

- OpenAI-compatible adapter currently uses prompted JSON output and robust parsing (code-fence stripping + balanced JSON extraction), then normalizes to SCUI response shape.
- Render path skips unknown components and schema-invalid props.
- `SCUIRender` fetches via `useSCUIBlocks` and supports `loading`, `error`, and `skipped` render paths.

