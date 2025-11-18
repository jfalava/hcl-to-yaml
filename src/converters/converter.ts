import yaml from "js-yaml";
import type { HCLValue } from "../parser/parser";

/**
 * Converts JavaScript object to YAML format and writes to file.
 *
 * @param data - The data object to convert to YAML
 * @param outPath - The file path where the YAML will be written
 *
 * @example
 * ```typescript
 * await writeYAML({ key: "value" }, "output.yaml");
 * ```
 */
export async function writeYAML(
  data: Record<string, HCLValue>,
  outPath: string,
): Promise<void> {
  const yamlStr = yaml.dump(data, { noRefs: true, sortKeys: false });
  await Bun.write(outPath, yamlStr);
}
