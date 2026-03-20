import { defineCatalog } from "@scui-llm/zod";
import { z } from "zod";
import styles from "./styles";

function MetricCard(props: { label: string; value: string; delta?: string }) {
  return (
    <div style={styles.card}>
      <div style={styles.label}>{props.label}</div>
      <div style={{ marginTop: 6, fontSize: 26, fontWeight: 950, letterSpacing: 0.1 }}>{props.value}</div>
      {props.delta ? <div style={{ marginTop: 6, fontSize: 12, color: "rgba(255,255,255,0.8)" }}>{props.delta}</div> : null}
    </div>
  );
}

function BulletList(props: { title: string; bullets: string[] }) {
  return (
    <div style={styles.card}>
      <div style={styles.label}>{props.title}</div>
      <ul style={{ margin: "10px 0 0 18px", padding: 0, lineHeight: 1.45, color: "rgba(255,255,255,0.88)" }}>
        {props.bullets.map((b, i) => (
          <li key={i}>{b}</li>
        ))}
      </ul>
    </div>
  );
}

const zMetricCardIn = z
  .object({
    label: z.string().optional(),
    title: z.string().optional(),
    value: z.union([z.string(), z.number()]),
    delta: z.union([z.string(), z.number()]).optional(),
  })
  .transform((p) => ({
    label: (p.label ?? p.title ?? "Metric").trim(),
    value: String(p.value),
    delta: p.delta == null ? undefined : String(p.delta),
  }));

const zBulletListIn = z
  .object({
    title: z.string().optional(),
    bullets: z.array(z.string()).optional(),
    items: z.array(z.string()).optional(),
  })
  .transform((p) => ({
    title: (p.title ?? "Insights").trim(),
    bullets: (p.bullets ?? p.items ?? []).slice(0, 10),
  }))
  .refine((p) => p.bullets.length > 0, { message: "bullets/items must contain at least one string" });

export const catalog = defineCatalog({
  MetricCard: {
    component: MetricCard,
    schema: zMetricCardIn,
    description: "A single metric value. Props: label/title + value (+ optional delta).",
  },
  BulletList: {
    component: BulletList,
    schema: zBulletListIn,
    description: "A list of insight bullets. Props: title + bullets (or items).",
  },
});
