import { z } from "zod";

/**
 * Grafana dashboard schema for validating HCL structures.
 *
 * This schema validates Grafana dashboards written in HCL format,
 * ensuring they conform to Grafana's dashboard JSON schema.
 */

// Generic value for nested structures
const grafanaValue: z.ZodType<unknown> = z.union([
  z.string(),
  z.number(),
  z.boolean(),
  z.null(),
  z.array(z.lazy(() => grafanaValue)),
  z.record(z.string(), z.lazy(() => grafanaValue)),
]);

// Grid position schema
const gridPosSchema = z.object({
  x: z.number(),
  y: z.number(),
  w: z.number(),
  h: z.number(),
});

// Target/query schema
const targetSchema = z.object({
  refId: z.string().optional(),
  expr: z.string().optional(),
  datasource: z.union([z.string(), z.record(z.string(), z.unknown())]).optional(),
  format: z.string().optional(),
  legendFormat: z.string().optional(),
  instant: z.boolean().optional(),
  intervalFactor: z.number().optional(),
});

// Panel schema
const panelSchema = z.object({
  id: z.number().optional(),
  type: z.string(),
  title: z.string(),
  gridPos: gridPosSchema.optional(),
  targets: z.array(z.union([targetSchema, grafanaValue])).optional(),
  datasource: z.union([z.string(), z.record(z.string(), z.unknown())]).optional(),
  description: z.string().optional(),
  transparent: z.boolean().optional(),
  options: z.record(z.string(), grafanaValue).optional(),
  fieldConfig: z.record(z.string(), grafanaValue).optional(),
  links: z.array(grafanaValue).optional(),
  repeat: z.string().optional(),
  repeatDirection: z.enum(["h", "v"]).optional(),
});

// Template variable schema
const templateVarSchema = z.object({
  name: z.string(),
  type: z.string(),
  label: z.string().optional(),
  query: z.union([z.string(), grafanaValue]).optional(),
  datasource: z.union([z.string(), z.record(z.string(), z.unknown())]).optional(),
  current: z.record(z.string(), grafanaValue).optional(),
  options: z.array(grafanaValue).optional(),
  includeAll: z.boolean().optional(),
  multi: z.boolean().optional(),
  refresh: z.union([z.number(), z.string()]).optional(),
  regex: z.string().optional(),
  sort: z.number().optional(),
});

// Annotation schema
const annotationSchema = z.object({
  name: z.string(),
  datasource: z.union([z.string(), z.record(z.string(), z.unknown())]),
  enable: z.boolean().optional(),
  expr: z.string().optional(),
  iconColor: z.string().optional(),
  tags: z.array(z.string()).optional(),
});

// Time range schema
const timeSchema = z.object({
  from: z.string(),
  to: z.string(),
});

// Templating schema
const templatingSchema = z.object({
  list: z.array(templateVarSchema).optional(),
});

// Main dashboard schema
export const grafanaDashboardSchema = z.object({
  dashboard: z
    .object({
      id: z.number().optional(),
      uid: z.string().optional(),
      title: z.string(),
      description: z.string().optional(),
      tags: z.array(z.string()).optional(),
      timezone: z.string().optional(),
      editable: z.boolean().optional(),
      schemaVersion: z.number().optional(),
      version: z.number().optional(),
      refresh: z.union([z.string(), z.boolean()]).optional(),
      time: timeSchema.optional(),
      timepicker: z.record(z.string(), grafanaValue).optional(),
      panels: z
        .union([
          z.array(panelSchema),
          z.record(z.string(), panelSchema),
        ])
        .optional(),
      templating: templatingSchema.optional(),
      annotations: z
        .object({
          list: z.array(annotationSchema).optional(),
        })
        .optional(),
      links: z.array(grafanaValue).optional(),
      graphTooltip: z.number().optional(),
      style: z.string().optional(),
    })
    .passthrough(), // Allow additional fields for flexibility
});

export type GrafanaDashboard = z.infer<typeof grafanaDashboardSchema>;

/**
 * Validates Grafana dashboard HCL data against the Grafana schema.
 *
 * @param data - Parsed HCL data to validate
 * @throws Error with detailed validation messages if validation fails
 *
 * @example
 * ```typescript
 * const data = {
 *   dashboard: {
 *     title: "My Dashboard",
 *     panels: [{
 *       type: "graph",
 *       title: "CPU Usage"
 *     }]
 *   }
 * };
 * validateGrafana(data);
 * ```
 */
export function validateGrafana(data: unknown): void {
  const result = grafanaDashboardSchema.safeParse(data);
  if (!result.success) {
    const errors = result.error.issues
      .map((e) => `${e.path.join(".")}: ${e.message}`)
      .join("\n");
    throw new Error(`Grafana dashboard validation failed:\n${errors}`);
  }
}

/**
 * Common Grafana panel types
 */
export const COMMON_PANEL_TYPES = [
  "graph",
  "singlestat",
  "table",
  "text",
  "heatmap",
  "bargauge",
  "gauge",
  "stat",
  "piechart",
  "timeseries",
  "barchart",
  "logs",
  "nodeGraph",
] as const;

/**
 * Common Grafana datasource types
 */
export const COMMON_DATASOURCE_TYPES = [
  "prometheus",
  "graphite",
  "influxdb",
  "elasticsearch",
  "cloudwatch",
  "mysql",
  "postgres",
  "loki",
  "jaeger",
  "zipkin",
  "tempo",
] as const;
