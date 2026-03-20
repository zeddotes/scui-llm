import { z } from "zod";

export function defineCatalog<T>(catalog: T): T {
  return catalog;
}

export type CatalogEntry = {
  // React is intentionally not a dependency of @scui-llm/zod.
  // The React renderer layer is responsible for interpreting this value as a component.
  component: unknown;
  schema: z.ZodTypeAny;
  description?: string;
};

export type Catalog = Record<string, CatalogEntry>;

function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === "object" && !Array.isArray(value);
}

export function zodToJsonschema(schema: z.ZodTypeAny) {
  // console.log(">>>> zodToJsonschema", schema, schema.def);
  const jsonSchema = schema.toJSONSchema({
    "io": "input",
  })
  // console.log(">>>> jsonSchema", jsonSchema);
  return jsonSchema;
}


export function isCatalogEntry(value: unknown): value is CatalogEntry {
  if (!isRecord(value)) return false;
  const schema = value.schema;
  return (
    "component" in value &&
    !!schema &&
    typeof schema === "object" &&
    typeof (schema as z.ZodTypeAny).safeParse === "function"
  );
}

export function validateCatalog(catalog: unknown): asserts catalog is Catalog {
  if (!catalog || typeof catalog !== "object") {
    throw new Error("Catalog must be an object");
  }
  for (const [key, entry] of Object.entries(catalog as Record<string, unknown>)) {
    if (!isCatalogEntry(entry)) {
      throw new Error(`Invalid catalog entry for "${key}"`);
    }
  }
}

export function validateBlockProps<T>(
  entry: CatalogEntry,
  props: unknown,
): { success: true; data: T } | { success: false; error: z.ZodError } {
  const parsed = entry.schema.safeParse(props);
  if (!parsed.success) return { success: false, error: parsed.error };
  return { success: true, data: parsed.data as T };
}

