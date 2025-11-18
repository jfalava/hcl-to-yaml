import { test, expect, describe } from "bun:test";
import { validateHCL } from "../src/validation/validator";

describe("Validator", () => {
  describe("Valid schemas", () => {
    test("validates simple object", () => {
      const data = {
        config: {
          name: "test",
          count: 5,
        },
      };
      expect(() => validateHCL(data)).not.toThrow();
    });

    test("validates nested objects", () => {
      const data = {
        server: {
          database: {
            host: "localhost",
            port: 5432,
          },
        },
      };
      expect(() => validateHCL(data)).not.toThrow();
    });

    test("validates arrays", () => {
      const data = {
        config: {
          ports: [80, 443, 8080],
          names: ["alice", "bob"],
        },
      };
      expect(() => validateHCL(data)).not.toThrow();
    });

    test("validates booleans", () => {
      const data = {
        config: {
          enabled: true,
          disabled: false,
        },
      };
      expect(() => validateHCL(data)).not.toThrow();
    });

    test("validates terraform-style resources", () => {
      const data = {
        resource: {
          aws_instance: {
            web: {
              ami: "ami-123456",
              instance_type: "t2.micro",
            },
          },
        },
      };
      expect(() => validateHCL(data)).not.toThrow();
    });

    test("validates complex nested structure", () => {
      const data = {
        resource: {
          aws_instance: {
            web: {
              ami: "ami-123456",
              tags: {
                Name: "WebServer",
                Environment: "production",
              },
              security_groups: ["sg-123", "sg-456"],
              monitoring: true,
              count: 2,
            },
          },
        },
      };
      expect(() => validateHCL(data)).not.toThrow();
    });
  });

  describe("Invalid schemas", () => {
    test("throws on invalid identifier in root key", () => {
      const data = {
        "invalid-key!": {
          value: "test",
        },
      };
      expect(() => validateHCL(data)).toThrow("Schema validation failed");
    });

    test("throws on numeric root keys", () => {
      const data = {
        "123": {
          value: "test",
        },
      };
      expect(() => validateHCL(data)).toThrow("Schema validation failed");
    });
  });

  describe("Edge cases", () => {
    test("validates empty object", () => {
      const data = {};
      expect(() => validateHCL(data)).not.toThrow();
    });

    test("validates deeply nested structure", () => {
      const data = {
        level1: {
          level2: {
            level3: {
              level4: {
                value: "deep",
              },
            },
          },
        },
      };
      expect(() => validateHCL(data)).not.toThrow();
    });
  });
});
