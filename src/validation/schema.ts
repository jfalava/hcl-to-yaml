import { z } from "zod";

/**
 * Zod schema for validating HCL identifier strings.
 * Matches valid HCL identifiers: starts with letter or underscore, followed by letters, numbers, or underscores.
 */
const hclIdentifierSchema = z.string().regex(/^[a-zA-Z_][a-zA-Z0-9_]*$/);

/**
 * Generic Zod schema for validating HCL structures.
 * 
 * This schema is designed to be flexible and accommodate various HCL use cases
 * including Terraform, Kubernetes, Helm, CloudFormation, and custom configurations.
 * 
 * Features:
 * - Accepts any valid HCL identifier as property names
 * - Supports all common HCL value types (objects, strings, numbers, booleans, arrays)
 * - Allows unlimited nesting depth
 * - No required fields for maximum flexibility
 * 
 * @example
 * ```typescript
 * // Validates Terraform resources
 * { resource: { aws_instance: { web: { ami: "ami-123" } } } }
 * 
 * // Validates Kubernetes manifests
 * { apiVersion: "v1", kind: "Pod", metadata: { name: "my-pod" } }
 * 
 * // Validates Helm charts
 * { name: "my-chart", version: "1.0.0", apiVersion: "v2" }
 * ```
 */
export const hclValueSchema: z.ZodType<unknown> = z.union([
  z.string(),
  z.number(),
  z.boolean(),
  z.array(z.lazy(() => hclValueSchema)),
  z.record(hclIdentifierSchema, z.lazy(() => hclValueSchema)),
]);

export const hclSchema = z.record(hclIdentifierSchema, hclValueSchema);

// Export the main schema for backward compatibility
export const HCL_SCHEMA = hclSchema;
