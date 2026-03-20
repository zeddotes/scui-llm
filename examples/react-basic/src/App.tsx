import * as React from "react";
import type { SCUIAdapter, SCUIModelRequest, SCUIModelResponse, SCUIResponse } from "@scui-llm/core";
import { executeSCUIRequest } from "@scui-llm/core";
import { createOpenAICompatibleAdapter } from "@scui-llm/adapters";
import { renderBlocks } from "@scui-llm/react";
import { validateBlockProps } from "@scui-llm/zod";
import { catalog } from "./catalog";
import styles from "./styles";

const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY as string | undefined;
if (!OPENAI_API_KEY) throw new Error("VITE_OPENAI_API_KEY is not set");

function truncate(text: string, maxLen: number) {
  if (text.length <= maxLen) return text;
  return `${text.slice(0, maxLen)}\n…(truncated)…`;
}

function pretty(value: unknown, maxLen = 7000) {
  try {
    return truncate(JSON.stringify(value, null, 2), maxLen);
  } catch {
    return String(value);
  }
}

export function App() {
  const [topic, setTopic] = React.useState("activation regression");
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const [eligible, setEligible] = React.useState<{ total: number; eligible: number }>({ total: 0, eligible: 0 });
  const [response, setResponse] = React.useState<SCUIResponse | null>(null);
  const [rawData, setRawData] = React.useState<unknown>(null);
  const [rawProvider, setRawProvider] = React.useState<unknown>(null);

  const baseAdapter = React.useMemo<SCUIAdapter>(() => {
    return createOpenAICompatibleAdapter({
      baseUrl: "https://api.openai.com",
      model: "gpt-5.4",
      headers: { Authorization: `Bearer ${OPENAI_API_KEY}` },
    });
  }, []);

  const onRun = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    setResponse(null);
    setRawData(null);
    setRawProvider(null);

    try {
      let capturedData: unknown = null;
      let capturedRaw: unknown = null;

      const captureAdapter: SCUIAdapter = {
        generate: async <T = unknown>(req: SCUIModelRequest): Promise<SCUIModelResponse<T>> => {
          const res = await baseAdapter.generate<T>(req);
          capturedData = res.data;
          capturedRaw = res.raw;
          return res;
        },
      };

      const request: SCUIModelRequest = {
        prompt: `Topic: "${topic}". Return a KPI and 3 bullet insights for a product analytics dashboard.`,
        systemPrompt:
          "Return JSON only. Output must match {\"blocks\":[{\"component\":string,\"props\":object}]}. Use only catalog components. No extra keys.\nAllowed components: MetricCard, BulletList.",
        catalog: Object.entries(catalog).map(([name, entry]) => ({
          name,
          description: entry.description,
          propsSchema: entry.schema,
        })),
        context: { demo: "core-showcase" },
      };

      const resp = await executeSCUIRequest(request, { adapter: captureAdapter });

      // Eligibility count: renderBlock() skips unknown components and schema-invalid props.
      const catalogAny = catalog as unknown as Record<string, { schema: any }>;
      let ok = 0;
      for (const b of resp.blocks) {
        const entry = catalogAny[b.component];
        if (!entry) continue;
        const parsed = validateBlockProps<any>(entry as never, b.props);
        if (parsed.success) ok++;
      }

      setEligible({ total: resp.blocks.length, eligible: ok });
      setResponse(resp);
      setRawData(capturedData);
      setRawProvider(capturedRaw);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }, [baseAdapter, topic]);

  return (
    <div style={styles.page}>
      <div style={styles.content}>
        <div>
          <div style={{ fontSize: 18, fontWeight: 950 }}>SCUI Core Showcase (minimal)</div>
          <div style={{ marginTop: 6, fontSize: 13, color: "rgba(255,255,255,0.7)", lineHeight: 1.35 }}>
            Request → `executeSCUIRequest` → Zod eligibility → `renderBlocks`.
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 12, alignItems: "end" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <div style={{ fontSize: 12, fontWeight: 800, color: "rgba(255,255,255,0.72)" }}>Topic</div>
            <input value={topic} onChange={(e) => setTopic(e.target.value)} style={styles.input} placeholder="e.g. activation regression" />
          </div>

          <button
            onClick={() => void onRun()}
            disabled={loading}
            style={{
              ...styles.buttonBase,
              cursor: loading ? "not-allowed" : "pointer",
              opacity: loading ? 0.7 : 1,
              background: loading ? "rgba(255,255,255,0.07)" : styles.buttonBase.background,
            }}
          >
            {loading ? "Running…" : "Run"}
          </button>
        </div>

        {error ? (
          <div style={styles.errorBox}>
            <div style={{ fontWeight: 950 }}>Error</div>
            <pre style={{ margin: "8px 0 0 0", whiteSpace: "pre-wrap", fontSize: 12, color: "rgba(255,255,255,0.85)" }}>{error}</pre>
          </div>
        ) : null}

        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <span style={{ fontSize: 12, color: "rgba(255,255,255,0.72)" }}>
            eligible {eligible.eligible} / {eligible.total}
          </span>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 12 }}>
          <div>
            <div style={styles.sectionTitle}>Rendered blocks</div>
            {loading || !response ? (
              <div style={{ color: "rgba(255,255,255,0.6)", fontSize: 12 }}>Run to generate blocks.</div>
            ) : (
              renderBlocks(response.blocks, catalog)
            )}
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, alignItems: "start" }}>
            <div>
              <div style={{ fontSize: 12, color: "rgba(255,255,255,0.7)", fontWeight: 850, marginBottom: 10 }}>
                adapter.generate().data
              </div>
              <pre style={styles.pre}>{response ? pretty(rawData) : "—"}</pre>
            </div>
            <div>
              <div style={{ fontSize: 12, color: "rgba(255,255,255,0.7)", fontWeight: 850, marginBottom: 10 }}>
                adapter.generate().raw
              </div>
              <pre style={styles.pre}>{response ? pretty(rawProvider) : "—"}</pre>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
