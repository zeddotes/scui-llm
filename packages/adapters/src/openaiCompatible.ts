import type { SCUIAdapter, SCUIModelRequest, SCUIModelResponse, SCUIResponse } from "@scui-llm/core";
import type { FetchLike, ResponseMapper } from "./types";
import { zodToJsonschema } from "@scui-llm/zod";
import type { ZodTypeAny } from "zod";

export type CreateOpenAICompatibleAdapterOptions<T = SCUIResponse> = {
  baseUrl: string;
  model: string;
  headers?: Record<string, string>;
  fetchImpl?: FetchLike;
  mapResponse?: ResponseMapper<T>;
  endpoint?: "responses";
};

function getNestedString(obj: unknown, path: string[]): string | null {
  let cur: unknown = obj;
  for (const key of path) {
    if (!cur || typeof cur !== "object") return null;
    cur = (cur as Record<string, unknown>)[key];
  }
  return typeof cur === "string" ? cur : null;
}

function extractFirstJsonObject(text: string): unknown | null {
  const stripped = stripCodeFences(text).trim();
  const direct = tryParseJson(stripped);
  if (direct !== null) return direct;
  const balanced = extractBalancedJsonObject(stripped);
  return balanced ? tryParseJson(balanced) : null;
}

function stripCodeFences(text: string): string {
  const trimmed = text.trim();
  const fenceStart = trimmed.indexOf("```");
  if (fenceStart !== 0) return text;
  const fenceEnd = trimmed.lastIndexOf("```");
  if (fenceEnd <= 0 || fenceEnd === fenceStart) return text;
  const inner = trimmed.slice(3, fenceEnd);
  // allow ```json\n...\n```
  const firstNewline = inner.indexOf("\n");
  if (firstNewline === -1) return inner;
  const maybeLang = inner.slice(0, firstNewline).trim().toLowerCase();
  if (maybeLang === "json" || maybeLang === "javascript" || maybeLang === "js") {
    return inner.slice(firstNewline + 1);
  }
  return inner;
}

function tryParseJson(text: string): unknown | null {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

function extractBalancedJsonObject(text: string): string | null {
  let start = -1;
  let depth = 0;
  let inString = false;
  let escape = false;

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];

    if (inString) {
      if (escape) {
        escape = false;
      } else if (ch === "\\") {
        escape = true;
      } else if (ch === "\"") {
        inString = false;
      }
      continue;
    }

    if (ch === "\"") {
      inString = true;
      continue;
    }

    if (ch === "{") {
      if (depth === 0) start = i;
      depth++;
      continue;
    }

    if (ch === "}") {
      if (depth === 0) continue;
      depth--;
      if (depth === 0 && start !== -1) {
        return text.slice(start, i + 1);
      }
    }
  }

  return null;
}

function extractTextFromOpenAIResponse(rawJson: unknown): string {
  if (!rawJson || typeof rawJson !== "object") return "";
  const obj = rawJson as Record<string, unknown>;

  // Common convenience field
  if (typeof obj.output_text === "string") return obj.output_text;

  // Responses API shape: output[0].content[0].text
  const output0 = Array.isArray(obj.output) ? obj.output[0] : undefined;
  const output0Text = getNestedString(output0, ["content", "0", "text"]);
  if (output0Text) return output0Text;

  // Chat Completions shape: choices[0].message.content
  const choices0 = Array.isArray(obj.choices) ? obj.choices[0] : undefined;
  const choices0Text = getNestedString(choices0, ["message", "content"]);
  if (choices0Text) return choices0Text;

  return "";
}

export function createOpenAICompatibleAdapter<T = SCUIResponse>({
  baseUrl,
  model,
  headers,
  fetchImpl,
  mapResponse,
  endpoint = "responses",
}: CreateOpenAICompatibleAdapterOptions<T>): SCUIAdapter {
  const f: FetchLike = fetchImpl ?? fetch;
  const url = `${baseUrl.replace(/\/+$/, "")}/v1/${endpoint}`;

  return {
    async generate<U = T>(input: SCUIModelRequest): Promise<SCUIModelResponse<U>> {
      const system = input.systemPrompt
        ? `System:\n${input.systemPrompt}\n`
        : "System:\nReturn JSON only.\n";
      const user = `User:\n${input.prompt}\n`;
      const catalogHint =
        input.catalog?.length
          ? `Catalog:\n${JSON.stringify(
              input.catalog.map((c: SCUIModelRequest["catalog"][number]) => ({
                name: c.name,
                description: c.description,
                ...(c.propsSchema ? { schema: zodToJsonschema(c.propsSchema as ZodTypeAny) } : {}),
              })),
            )}\n`
          : "";

      const instruction =
        "Respond with JSON matching {\"blocks\":[{\"component\":string,\"props\":object}]}";

      const body = {
        model,
        input: [
          { role: "system", content: `${system}${catalogHint}${instruction}` },
          { role: "user", content: user },
        ],
        temperature: 0,
      };

      const res = await f(url, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          ...(headers ?? {}),
        },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        throw new Error(`OpenAI API error: ${res.statusText}`);
      }

      const rawJson = await res.json().catch(() => null);
      if (mapResponse) return (await mapResponse(res, rawJson)) as unknown as SCUIModelResponse<U>;

      const content = extractTextFromOpenAIResponse(rawJson);
      const extracted = typeof content === "string" ? extractFirstJsonObject(content) : null;
      const data = (extracted ?? rawJson) as U;

      return { data, raw: rawJson };
    },
  };
}

