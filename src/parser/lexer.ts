/**
 * Represents a token in the HCL language.
 */
export type Token =
  | { type: "identifier"; value: string }
  | { type: "string"; value: string }
  | { type: "number"; value: number }
  | { type: "symbol"; value: string };

/**
 * Tokenizes HCL input string into an array of tokens.
 *
 * @param input - The HCL string to tokenize
 * @returns Array of tokens representing the HCL structure
 *
 * @example
 * ```typescript
 * const tokens = tokenize('resource "aws_instance" "web" { ami = "ami-123" }');
 * // Returns: [{ type: "identifier", value: "resource" }, { type: "string", value: "aws_instance" }, ...]
 * ```
 */
export function tokenize(input: string): Token[] {
  const tokens: Token[] = [];
  const re =
    /\s*(?:(\"[^\"]*\")|([A-Za-z_][A-Za-z0-9_-]*)|([0-9]+(?:\.[0-9]+)?)|(\{|\}|\=|\[|\]|,))\s*/g;
  let match;

  while ((match = re.exec(input)) !== null) {
    if (match[1]) tokens.push({ type: "string", value: match[1].slice(1, -1) });
    else if (match[2]) tokens.push({ type: "identifier", value: match[2] });
    else if (match[3])
      tokens.push({ type: "number", value: parseFloat(match[3]) });
    else if (match[4]) tokens.push({ type: "symbol", value: match[4] });
  }

  return tokens;
}
