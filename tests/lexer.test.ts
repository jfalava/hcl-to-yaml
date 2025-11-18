import { test, expect, describe } from "bun:test";
import { tokenize } from "../src/parser/lexer";

describe("Lexer", () => {
  describe("Basic tokens", () => {
    test("tokenizes identifiers", () => {
      const tokens = tokenize("resource variable");
      expect(tokens).toEqual([
        { type: "identifier", value: "resource" },
        { type: "identifier", value: "variable" },
      ]);
    });

    test("tokenizes strings", () => {
      const tokens = tokenize('"hello" "world"');
      expect(tokens).toEqual([
        { type: "string", value: "hello" },
        { type: "string", value: "world" },
      ]);
    });

    test("tokenizes numbers", () => {
      const tokens = tokenize("42 3.14");
      expect(tokens).toEqual([
        { type: "number", value: 42 },
        { type: "number", value: 3.14 },
      ]);
    });

    test("tokenizes negative numbers", () => {
      const tokens = tokenize("-42 -3.14");
      expect(tokens).toEqual([
        { type: "number", value: -42 },
        { type: "number", value: -3.14 },
      ]);
    });

    test("tokenizes scientific notation", () => {
      const tokens = tokenize("1e5 2.5e-3");
      expect(tokens).toEqual([
        { type: "number", value: 1e5 },
        { type: "number", value: 2.5e-3 },
      ]);
    });

    test("tokenizes booleans", () => {
      const tokens = tokenize("true false");
      expect(tokens).toEqual([
        { type: "boolean", value: true },
        { type: "boolean", value: false },
      ]);
    });

    test("tokenizes symbols", () => {
      const tokens = tokenize("{ } = [ ] ,");
      expect(tokens).toEqual([
        { type: "symbol", value: "{" },
        { type: "symbol", value: "}" },
        { type: "symbol", value: "=" },
        { type: "symbol", value: "[" },
        { type: "symbol", value: "]" },
        { type: "symbol", value: "," },
      ]);
    });
  });

  describe("Comments", () => {
    test("removes single-line comments with #", () => {
      const tokens = tokenize(`
        resource # This is a comment
        variable
      `);
      expect(tokens).toEqual([
        { type: "identifier", value: "resource" },
        { type: "identifier", value: "variable" },
      ]);
    });

    test("removes single-line comments with //", () => {
      const tokens = tokenize(`
        resource // This is a comment
        variable
      `);
      expect(tokens).toEqual([
        { type: "identifier", value: "resource" },
        { type: "identifier", value: "variable" },
      ]);
    });

    test("removes multi-line comments", () => {
      const tokens = tokenize(`
        resource /* This is a
        multi-line
        comment */ variable
      `);
      expect(tokens).toEqual([
        { type: "identifier", value: "resource" },
        { type: "identifier", value: "variable" },
      ]);
    });
  });

  describe("Complex expressions", () => {
    test("tokenizes HCL resource block", () => {
      const tokens = tokenize(
        'resource "aws_instance" "web" { ami = "ami-123" }',
      );
      expect(tokens).toEqual([
        { type: "identifier", value: "resource" },
        { type: "string", value: "aws_instance" },
        { type: "string", value: "web" },
        { type: "symbol", value: "{" },
        { type: "identifier", value: "ami" },
        { type: "symbol", value: "=" },
        { type: "string", value: "ami-123" },
        { type: "symbol", value: "}" },
      ]);
    });

    test("tokenizes HCL with nested objects", () => {
      const tokens = tokenize(`
        config {
          enabled = true
          count = 5
        }
      `);
      expect(tokens).toEqual([
        { type: "identifier", value: "config" },
        { type: "symbol", value: "{" },
        { type: "identifier", value: "enabled" },
        { type: "symbol", value: "=" },
        { type: "boolean", value: true },
        { type: "identifier", value: "count" },
        { type: "symbol", value: "=" },
        { type: "number", value: 5 },
        { type: "symbol", value: "}" },
      ]);
    });

    test("tokenizes HCL with arrays", () => {
      const tokens = tokenize(`
        ports = [80, 443, 8080]
      `);
      expect(tokens).toEqual([
        { type: "identifier", value: "ports" },
        { type: "symbol", value: "=" },
        { type: "symbol", value: "[" },
        { type: "number", value: 80 },
        { type: "symbol", value: "," },
        { type: "number", value: 443 },
        { type: "symbol", value: "," },
        { type: "number", value: 8080 },
        { type: "symbol", value: "]" },
      ]);
    });
  });

  describe("Edge cases", () => {
    test("handles empty input", () => {
      const tokens = tokenize("");
      expect(tokens).toEqual([]);
    });

    test("handles whitespace-only input", () => {
      const tokens = tokenize("   \n\t  ");
      expect(tokens).toEqual([]);
    });

    test("handles identifiers with hyphens", () => {
      const tokens = tokenize("aws-instance my-variable");
      expect(tokens).toEqual([
        { type: "identifier", value: "aws-instance" },
        { type: "identifier", value: "my-variable" },
      ]);
    });

    test("handles identifiers with underscores", () => {
      const tokens = tokenize("aws_instance my_variable");
      expect(tokens).toEqual([
        { type: "identifier", value: "aws_instance" },
        { type: "identifier", value: "my_variable" },
      ]);
    });
  });
});
