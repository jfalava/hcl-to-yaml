import { test, expect, describe, beforeAll, afterAll } from "bun:test";
import { parseHCL } from "../src/parser/parser";
import { validateHCL } from "../src/validation/validator";
import { writeYAML } from "../src/converters/converter";
import yaml from "js-yaml";

describe("Integration tests", () => {
  const testOutputPath = "/tmp/test-output.yaml";

  afterAll(async () => {
    // Clean up test files
    try {
      await Bun.file(testOutputPath).writer().end();
    } catch {}
  });

  describe("End-to-end conversion", () => {
    test("converts simple HCL to YAML", async () => {
      const hcl = `
        config {
          name = "test"
          enabled = true
        }
      `;

      const parsed = parseHCL(hcl);
      validateHCL(parsed);
      await writeYAML(parsed, testOutputPath);

      const yamlContent = await Bun.file(testOutputPath).text();
      const loaded = yaml.load(yamlContent);

      expect(loaded).toEqual({
        config: {
          name: "test",
          enabled: true,
        },
      });
    });

    test("converts Terraform-style resources to YAML", async () => {
      const hcl = `
        resource "aws_instance" "web" {
          ami = "ami-123456"
          instance_type = "t2.micro"
          tags {
            Name = "WebServer"
            Environment = "production"
          }
        }
      `;

      const parsed = parseHCL(hcl);
      validateHCL(parsed);
      await writeYAML(parsed, testOutputPath);

      const yamlContent = await Bun.file(testOutputPath).text();
      const loaded = yaml.load(yamlContent);

      expect(loaded).toEqual({
        resource: {
          aws_instance: {
            web: {
              ami: "ami-123456",
              instance_type: "t2.micro",
              tags: {
                Name: "WebServer",
                Environment: "production",
              },
            },
          },
        },
      });
    });

    test("preserves array order", async () => {
      const hcl = `
        config {
          ports = [80, 443, 8080, 3000]
        }
      `;

      const parsed = parseHCL(hcl);
      validateHCL(parsed);
      await writeYAML(parsed, testOutputPath);

      const yamlContent = await Bun.file(testOutputPath).text();
      const loaded = yaml.load(yamlContent);

      expect(loaded).toEqual({
        config: {
          ports: [80, 443, 8080, 3000],
        },
      });
    });

    test("handles comments correctly", async () => {
      const hcl = `
        # This is a configuration
        config {
          # Server name
          name = "production" // Important!
          /* Multi-line
             comment here */
          enabled = true
        }
      `;

      const parsed = parseHCL(hcl);
      validateHCL(parsed);
      await writeYAML(parsed, testOutputPath);

      const yamlContent = await Bun.file(testOutputPath).text();
      const loaded = yaml.load(yamlContent);

      expect(loaded).toEqual({
        config: {
          name: "production",
          enabled: true,
        },
      });
    });

    test("handles complex nested structures", async () => {
      const hcl = `
        variable "region" {
          default = "us-west-2"
          type = "string"
        }

        resource "aws_instance" "web" {
          ami = "ami-123456"
          instance_type = "t2.micro"
          count = 2
          monitoring = true
          tags {
            Name = "WebServer"
            Environment = "production"
            Terraform = true
          }
          security_groups = ["sg-123", "sg-456"]
        }
      `;

      const parsed = parseHCL(hcl);
      validateHCL(parsed);
      await writeYAML(parsed, testOutputPath);

      const yamlContent = await Bun.file(testOutputPath).text();
      const loaded = yaml.load(yamlContent);

      expect(loaded).toHaveProperty("variable.region");
      expect(loaded).toHaveProperty("resource.aws_instance.web");
      expect(loaded).toMatchObject({
        variable: {
          region: {
            default: "us-west-2",
            type: "string",
          },
        },
        resource: {
          aws_instance: {
            web: {
              ami: "ami-123456",
              instance_type: "t2.micro",
              count: 2,
              monitoring: true,
              tags: {
                Name: "WebServer",
                Environment: "production",
                Terraform: true,
              },
              security_groups: ["sg-123", "sg-456"],
            },
          },
        },
      });
    });
  });

  describe("Data type preservation", () => {
    test("preserves data types correctly", async () => {
      const hcl = `
        config {
          string_val = "text"
          int_val = 42
          float_val = 3.14
          negative_val = -10
          bool_true = true
          bool_false = false
          array_val = [1, 2, 3]
        }
      `;

      const parsed = parseHCL(hcl);
      validateHCL(parsed);
      await writeYAML(parsed, testOutputPath);

      const yamlContent = await Bun.file(testOutputPath).text();
      const loaded = yaml.load(yamlContent) as any;

      expect(typeof loaded.config.string_val).toBe("string");
      expect(typeof loaded.config.int_val).toBe("number");
      expect(typeof loaded.config.float_val).toBe("number");
      expect(typeof loaded.config.negative_val).toBe("number");
      expect(typeof loaded.config.bool_true).toBe("boolean");
      expect(typeof loaded.config.bool_false).toBe("boolean");
      expect(Array.isArray(loaded.config.array_val)).toBe(true);

      expect(loaded.config.int_val).toBe(42);
      expect(loaded.config.float_val).toBe(3.14);
      expect(loaded.config.negative_val).toBe(-10);
      expect(loaded.config.bool_true).toBe(true);
      expect(loaded.config.bool_false).toBe(false);
    });
  });
});
