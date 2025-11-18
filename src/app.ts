#!/usr/bin/env bun
import { Command } from "commander";
import { z } from "zod";
import { parseHCL } from "./parser/parser";
import { validateHCL } from "./validation/validator";
import { writeYAML } from "./converters/converter";
import { parseDirective } from "./directives/parser";
import { validateCloudFormation } from "./validation/services/cloudformation";
import { validateGrafana } from "./validation/services/grafana";
import { validateKubernetes } from "./validation/services/kubernetes";

// Read version from package.json
const packageJsonPath = new URL("../package.json", import.meta.url).pathname;
const packageJson = JSON.parse(await Bun.file(packageJsonPath).text());
const version = packageJson.version;

// Helper to check if file exists
async function fileExists(path: string): Promise<boolean> {
  const file = Bun.file(path);
  return await file.exists();
}

// Zod schema for CLI arguments validation
const cliArgsSchema = z.object({
  input: z
    .string()
    .min(1, "Input file path is required")
    .refine(
      (path) => path.endsWith(".hcl") || path.endsWith(".tf"),
      "Input file must be a .hcl or .tf file",
    ),
  output: z
    .string()
    .min(1, "Output file path is required")
    .refine(
      (path) => path.endsWith(".yaml") || path.endsWith(".yml"),
      "Output file must be a .yaml or .yml file",
    ),
});

/**
 * CLI application for converting HCL files to YAML with schema validation.
 *
 * This tool parses HCL (HashiCorp Configuration Language) files,
 * validates them against a generic schema, and converts them to YAML format.
 *
 * @example
 * ```bash
 * hcl2yaml config.hcl output.yaml
 * ```
 */
const program = new Command();

program
  .name("hcl2yaml")
  .description("Convert HCL to YAML with built-in schema validation")
  .version(version)
  .argument("<input>", "Path to HCL file")
  .argument("<output>", "Path to output YAML file")
  .action(async (input, output) => {
    try {
      // Validate CLI arguments using Zod
      const args = cliArgsSchema.parse({ input, output });

      // Check if input file exists
      if (!(await fileExists(args.input))) {
        throw new Error("Input file does not exist");
      }

      const hclContent = await Bun.file(args.input).text();

      // Parse directives to determine service type
      const { serviceType, cleanedInput } = parseDirective(hclContent);

      // Parse HCL
      const data = parseHCL(cleanedInput);

      // Validate using appropriate validator
      if (serviceType) {
        console.log(`Using ${serviceType} validator...`);
        switch (serviceType) {
          case "cloudformation":
            validateCloudFormation(data);
            break;
          case "grafana":
            validateGrafana(data);
            break;
          case "kubernetes":
            validateKubernetes(data);
            break;
        }
      } else {
        // Use generic HCL validator
        validateHCL(data);
      }

      // Write YAML output
      await writeYAML(data, args.output);

      const serviceMsg = serviceType ? ` (${serviceType})` : "";
      console.log(
        `Successfully converted and validated${serviceMsg}: ${args.output}`,
      );
    } catch (err) {
      if (err instanceof z.ZodError) {
        const errors = err.issues
          .map((e) => `${e.path.join(".")}: ${e.message}`)
          .join("\n");
        console.error(`Invalid arguments:\n${errors}`);
      } else {
        console.error(`${(err as Error).message}`);
      }
      process.exit(1);
    }
  });

program.parse();
