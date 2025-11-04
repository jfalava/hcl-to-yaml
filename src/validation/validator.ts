import { ZodError } from "zod";
import { hclSchema } from "./schema";
import type { HCLValue } from "../parser/parser";

/**
 * Validates HCL data against the generic HCL schema using Zod.
 *
 * @param data - The parsed HCL data to validate
 * @throws Error if validation fails with detailed error messages
 *
 * @example
 * ```typescript
 * try {
 *   validateHCL(parsedData);
 *   console.log("Validation passed");
 * } catch (error) {
 *   console.error("Validation failed:", error.message);
 * }
 * ```
 */
export function validateHCL(data: Record<string, HCLValue>): void {
  const result = hclSchema.safeParse(data);
  if (!result.success) {
    const errors = (result.error as ZodError).issues
      .map((e) => `${e.path.join('.')}: ${e.message}`)
      .join("\n");
    throw new Error(`Schema validation failed:\n${errors}`);
  }
}
