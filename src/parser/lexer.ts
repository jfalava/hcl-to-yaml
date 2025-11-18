/**
 * Represents a token in the HCL language.
 */
export type Token =
  | { type: "identifier"; value: string }
  | { type: "string"; value: string }
  | { type: "number"; value: number }
  | { type: "boolean"; value: boolean }
  | { type: "symbol"; value: string };

/**
 * Tokenizes HCL input string into an array of tokens.
 *
 * Supports:
 * - Comments (# and // for single-line, /* ... *\/ for multi-line)
 * - Strings (double-quoted)
 * - Numbers (integers, floats, negative numbers, scientific notation)
 * - Booleans (true, false)
 * - Identifiers
 * - Symbols ({, }, =, [, ], ,)
 *
 * @param input - The HCL string to tokenize
 * @returns Array of tokens representing the HCL structure
 *
 * @example
 * ```typescript
 * const tokens = tokenize('resource "aws_instance" "web" { ami = "ami-123" enabled = true }');
 * // Returns: [{ type: "identifier", value: "resource" }, { type: "string", value: "aws_instance" }, ...]
 * ```
 */
export function tokenize(input: string): Token[] {
  // First, remove comments
  let cleanedInput = input;

  // Remove single-line comments (# and //)
  cleanedInput = cleanedInput.replace(/(?:^|\s)(#|\/\/).*$/gm, "");

  // Remove multi-line comments (/* ... */)
  cleanedInput = cleanedInput.replace(/\/\*[\s\S]*?\*\//g, "");

  const tokens: Token[] = [];

  // Updated regex to support:
  // 1. Strings (double-quoted)
  // 2. Booleans (true/false)
  // 3. Identifiers
  // 4. Numbers (including negative, floats, scientific notation)
  // 5. Symbols
  const re =
    /\s*(?:(\"[^\"]*\")|(\btrue\b|\bfalse\b)|([A-Za-z_][A-Za-z0-9_-]*)|(-?[0-9]+(?:\.[0-9]+)?(?:[eE][+-]?[0-9]+)?)|(\{|\}|\=|\[|\]|,))\s*/g;
  let match;

  while ((match = re.exec(cleanedInput)) !== null) {
    if (match[1]) {
      // String
      tokens.push({ type: "string", value: match[1].slice(1, -1) });
    } else if (match[2]) {
      // Boolean
      tokens.push({ type: "boolean", value: match[2] === "true" });
    } else if (match[3]) {
      // Identifier
      tokens.push({ type: "identifier", value: match[3] });
    } else if (match[4]) {
      // Number
      tokens.push({ type: "number", value: parseFloat(match[4]) });
    } else if (match[5]) {
      // Symbol
      tokens.push({ type: "symbol", value: match[5] });
    }
  }

  return tokens;
}
