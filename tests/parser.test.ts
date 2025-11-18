import { test, expect, describe } from "bun:test";
import { parseHCL } from "../src/parser/parser";

describe("Parser", () => {
  describe("Simple values", () => {
    test("parses simple key-value", () => {
      const result = parseHCL('config { name = "test" }');
      expect(result).toEqual({
        config: {
          name: "test",
        },
      });
    });

    test("parses numbers", () => {
      const result = parseHCL("config { count = 5 }");
      expect(result).toEqual({
        config: {
          count: 5,
        },
      });
    });

    test("parses booleans", () => {
      const result = parseHCL("config { enabled = true disabled = false }");
      expect(result).toEqual({
        config: {
          enabled: true,
          disabled: false,
        },
      });
    });

    test("parses negative numbers", () => {
      const result = parseHCL("config { temperature = -5 }");
      expect(result).toEqual({
        config: {
          temperature: -5,
        },
      });
    });
  });

  describe("Arrays", () => {
    test("parses number arrays", () => {
      const result = parseHCL("config { ports = [80, 443, 8080] }");
      expect(result).toEqual({
        config: {
          ports: [80, 443, 8080],
        },
      });
    });

    test("parses string arrays", () => {
      const result = parseHCL(
        'config { names = ["alice", "bob", "charlie"] }',
      );
      expect(result).toEqual({
        config: {
          names: ["alice", "bob", "charlie"],
        },
      });
    });

    test("parses mixed arrays", () => {
      const result = parseHCL('config { mixed = [1, "two", 3.0, true] }');
      expect(result).toEqual({
        config: {
          mixed: [1, "two", 3.0, true],
        },
      });
    });

    test("parses empty arrays", () => {
      const result = parseHCL("config { empty = [] }");
      expect(result).toEqual({
        config: {
          empty: [],
        },
      });
    });
  });

  describe("Nested objects", () => {
    test("parses nested objects", () => {
      const result = parseHCL(`
        config {
          database {
            host = "localhost"
            port = 5432
          }
        }
      `);
      expect(result).toEqual({
        config: {
          database: {
            host: "localhost",
            port: 5432,
          },
        },
      });
    });

    test("parses multiple nested objects", () => {
      const result = parseHCL(`
        server {
          web {
            port = 80
          }
          api {
            port = 8080
          }
        }
      `);
      expect(result).toEqual({
        server: {
          web: {
            port: 80,
          },
          api: {
            port: 8080,
          },
        },
      });
    });
  });

  describe("Terraform/HCL-style named blocks", () => {
    test("parses resource blocks", () => {
      const result = parseHCL(`
        resource "aws_instance" "web" {
          ami = "ami-123456"
          instance_type = "t2.micro"
        }
      `);
      expect(result).toEqual({
        resource: {
          aws_instance: {
            web: {
              ami: "ami-123456",
              instance_type: "t2.micro",
            },
          },
        },
      });
    });

    test("parses variable blocks", () => {
      const result = parseHCL(`
        variable "region" {
          default = "us-west-2"
          type = "string"
        }
      `);
      expect(result).toEqual({
        variable: {
          region: {
            default: "us-west-2",
            type: "string",
          },
        },
      });
    });

    test("parses multiple resources", () => {
      const result = parseHCL(`
        resource "aws_instance" "web" {
          ami = "ami-123"
        }
        resource "aws_instance" "db" {
          ami = "ami-456"
        }
      `);
      expect(result).toEqual({
        resource: {
          aws_instance: {
            web: {
              ami: "ami-123",
            },
            db: {
              ami: "ami-456",
            },
          },
        },
      });
    });
  });

  describe("Comments", () => {
    test("ignores single-line comments", () => {
      const result = parseHCL(`
        # This is a comment
        config {
          # Another comment
          name = "test" // Inline comment
        }
      `);
      expect(result).toEqual({
        config: {
          name: "test",
        },
      });
    });

    test("ignores multi-line comments", () => {
      const result = parseHCL(`
        /* This is a
           multi-line
           comment */
        config {
          name = "test"
        }
      `);
      expect(result).toEqual({
        config: {
          name: "test",
        },
      });
    });
  });

  describe("Complex structures", () => {
    test("parses complex nested structure", () => {
      const result = parseHCL(`
        resource "aws_instance" "web" {
          ami = "ami-123456"
          instance_type = "t2.micro"
          tags {
            Name = "WebServer"
            Environment = "production"
          }
          security_groups = ["sg-123", "sg-456"]
          monitoring = true
        }
      `);
      expect(result).toEqual({
        resource: {
          aws_instance: {
            web: {
              ami: "ami-123456",
              instance_type: "t2.micro",
              tags: {
                Name: "WebServer",
                Environment: "production",
              },
              security_groups: ["sg-123", "sg-456"],
              monitoring: true,
            },
          },
        },
      });
    });
  });

  describe("Error handling", () => {
    test("throws on unexpected end of input", () => {
      expect(() => parseHCL("config {")).toThrow("Unexpected end of input");
    });

    test("throws on invalid syntax", () => {
      expect(() => parseHCL("config = = 123")).toThrow();
    });

    test("throws on mismatched braces", () => {
      expect(() => parseHCL("config { name = ")).toThrow();
    });
  });
});
