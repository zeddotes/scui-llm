# SCUI AGENTS ENTRYPOINT

This repository is built using an agent-first architecture.

## Core Principles

- Schema-driven UI rendering
- Strict component catalog validation
- Adapter-based model execution
- No uncontrolled generation

## Packages

- @scui-llm/core → runtime + contracts
- @scui-llm/react → rendering layer
- @scui-llm/adapters → model integrations

## Rules

- Never generate JSX from models
- Always validate against schema
- Never bypass catalog
- Keep adapters transport-only
- Run `nvm use` before any node-based tooling (including `bun run build`, `bun run test`, and `bun run lint`).

## Implementation Order

1. core types
2. adapter interface
3. catalog system
4. renderer
5. react hooks
6. adapters

