#!/usr/bin/env bun
import { Command } from "commander";
import { readFileSync, existsSync } from "node:fs";
import { z } from "zod";
import { parseHCL } from "./parser/parser";
import { validateHCL } from "./validation/validator";
import { writeYAML } from "./converters/converter";

// Read version from package.json
const packageJson = JSON.parse(
  readFileSync(new URL("../package.json", import.meta.url), "utf8"),
);
const version = packageJson.version;

// Zod schema for CLI arguments validation
const cliArgsSchema = z.object({
  input: z
    .string()
    .min(1, "Input file path is required")
    .refine(
      (path) => path.endsWith(".hcl") || path.endsWith(".tf"),
      "Input file must be a .hcl or .tf file",
    )
    .refine((path) => existsSync(path), "Input file does not exist"),
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
  .action((input, output) => {
    try {
      // Validate CLI arguments using Zod
      const args = cliArgsSchema.parse({ input, output });

      const hcl = readFileSync(args.input, "utf8");
      const data = parseHCL(hcl);
      validateHCL(data);
      writeYAML(data, args.output);
      console.log(`Successfully converted and validated: ${args.output}`);
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
