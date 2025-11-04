import yaml from "js-yaml";
import { writeFileSync } from "node:fs";
import type { HCLValue } from "../parser/parser";

/**
 * Converts JavaScript object to YAML format and writes to file.
 *
 * @param data - The data object to convert to YAML
 * @param outPath - The file path where the YAML will be written
 *
 * @example
 * ```typescript
 * writeYAML({ key: "value" }, "output.yaml");
 * ```
 */
export function writeYAML(data: Record<string, HCLValue>, outPath: string): void {
  const yamlStr = yaml.dump(data, { noRefs: true, sortKeys: false });
  writeFileSync(outPath, yamlStr, "utf8");
}
