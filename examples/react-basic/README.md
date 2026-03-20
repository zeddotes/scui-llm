# SCUI Core Showcase (minimal)

This example focuses on the Core runtime path:

1. Build a `SCUIModelRequest` (prompt + `catalog` + optional `systemPrompt`)
2. Call `executeSCUIRequest(request, { adapter })`
3. Render only catalog-eligible blocks via `renderBlocks(blocks, catalog)`

Where to look:
- `src/App.tsx`: request construction, `executeSCUIRequest` call, eligibility counting, raw adapter outputs
- `src/catalog.tsx`: Zod schemas are the enforcement source of truth (blocks failing schema are skipped)

