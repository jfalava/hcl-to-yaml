import { type Token, tokenize } from "./lexer";

/**
 * Represents a parsed HCL value which can be a string, number, boolean, array, or object.
 */
export type HCLValue = 
  | string 
  | number 
  | boolean 
  | HCLValue[] 
  | Record<string, unknown>;

/**
 * Parses HCL input string into a JavaScript object.
 *
 * @param input - The HCL string to parse
 * @returns Parsed HCL structure as a JavaScript object
 *
 * @example
 * ```typescript
 * const result = parseHCL('resource "aws_instance" "web" { ami = "ami-123" }');
 * // Returns: { resource: { aws_instance: { web: { ami: "ami-123" } } } }
 * ```
 */
export function parseHCL(input: string): Record<string, HCLValue> {
  const tokens = tokenize(input);
  let pos = 0;

  /**
   * Returns the current token without consuming it.
   * @returns Current token or undefined if at end
   */
  function peek(): Token | undefined {
    return tokens[pos];
  }

  /**
   * Consumes and returns the current token, optionally validating its type and value.
   * @param expectedType - Expected token type (optional)
   * @param expectedValue - Expected token value (optional)
   * @returns The consumed token
   * @throws Error if token doesn't match expectations or input ends unexpectedly
   */
  function consume(expectedType?: string, expectedValue?: string): Token {
    const token = tokens[pos++];
    if (!token) throw new Error("Unexpected end of input");
    if (expectedType && token.type !== expectedType)
      throw new Error(`Expected ${expectedType}, got ${token.type}`);
    if (expectedValue && token.value !== expectedValue)
      throw new Error(`Expected '${expectedValue}', got '${token.value}'`);
    return token;
  }

  /**
   * Parses a value (string, number, object, or array).
   * @returns Parsed value
   */
  function parseValue(): HCLValue {
    const token = peek();
    if (!token) throw new Error("Unexpected end of input");

    if (token.type === "string" || token.type === "number") {
      consume();
      return token.value;
    }

    if (token.type === "symbol" && token.value === "{") {
      return parseObject();
    }

    if (token.type === "symbol" && token.value === "[") {
      return parseArray();
    }

    throw new Error(`Unexpected token: ${token.value}`);
  }

  /**
   * Parses an array of values.
   * @returns Array of parsed values
   */
  function parseArray(): HCLValue[] {
    const arr: HCLValue[] = [];
    consume("symbol", "[");
    while (peek() && peek()!.value !== "]") {
      arr.push(parseValue());
      if (peek() && peek()!.value === ",") consume("symbol", ",");
    }
    consume("symbol", "]");
    return arr;
  }

  /**
   * Parses an object with key-value pairs.
   * @returns Object with parsed key-value pairs
   */
  function parseObject(): Record<string, HCLValue> {
    const obj: Record<string, HCLValue> = {};
    consume("symbol", "{");
    while (peek() && peek()!.value !== "}") {
      const key = consume("identifier").value;
      consume("symbol", "=");
      obj[key] = parseValue();
    }
    consume("symbol", "}");
    return obj;
  }

  /**
   * Parses top-level HCL structure with nested names.
   * @returns Parsed top-level structure
   */
  function parseTopLevel(): Record<string, HCLValue> {
    const result: Record<string, HCLValue> = {};
    while (peek()) {
      const key = consume("identifier").value;
      const names: string[] = [];
      while (peek() && peek()!.type === "string") {
        const token = consume("string");
        names.push(token.value as string);
      }
      const value = parseValue();

      // Nest structure based on names
      let curr = (result[key] as Record<string, HCLValue>) || {};
      let ref = curr as Record<string, HCLValue>;
      for (let i = 0; i < names.length - 1; i++) {
        const n = names[i];
        if (n) {
          ref[n] = (ref[n] as Record<string, HCLValue>) || {};
          ref = ref[n] as Record<string, HCLValue>;
        }
      }
      if (names.length > 0) {
        const lastName = names[names.length - 1];
        if (lastName) ref[lastName] = value;
      } else {
        Object.assign(ref, value);
      }
      result[key] = curr;
    }
    return result;
  }

  return parseTopLevel();
}
