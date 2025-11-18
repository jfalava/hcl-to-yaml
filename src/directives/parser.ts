/**
 * Supported service types for directive-based validation and conversion
 */
export type ServiceType = "cloudformation" | "grafana" | "kubernetes" | null;

/**
 * Result of parsing directives from HCL input
 */
export interface DirectiveResult {
  serviceType: ServiceType;
  cleanedInput: string;
}

/**
 * Parses 'use <service>' directives from HCL input.
 *
 * Directive syntax: `use <service>` where service is one of:
 * - cloudformation
 * - grafana
 * - kubernetes
 *
 * The directive must appear at the beginning of the file (before any other HCL content).
 * It will be stripped from the input before parsing.
 *
 * @param input - The HCL string potentially containing a 'use' directive
 * @returns Object containing the detected service type and cleaned input
 *
 * @example
 * ```typescript
 * const { serviceType, cleanedInput } = parseDirective('use cloudformation\n\nResources { }');
 * // serviceType: "cloudformation"
 * // cleanedInput: "\n\nResources { }"
 * ```
 */
export function parseDirective(input: string): DirectiveResult {
  // Regex to match 'use <service>' at the start of the file
  // Allows for leading whitespace and comments
  const directiveRegex =
    /^\s*(?:\/\/.*\n|\/\*[\s\S]*?\*\/|\#.*\n)*\s*use\s+(cloudformation|grafana|kubernetes)\s*/i;

  const match = input.match(directiveRegex);

  if (match) {
    const serviceType = match[1]?.toLowerCase() as ServiceType;
    // Remove the directive from the input
    const cleanedInput = input.slice(match[0].length);

    return {
      serviceType,
      cleanedInput,
    };
  }

  // No directive found, return null service type and original input
  return {
    serviceType: null,
    cleanedInput: input,
  };
}

/**
 * Validates if a service type is supported
 *
 * @param service - Service name to validate
 * @returns true if the service is supported
 */
export function isValidServiceType(
  service: string,
): service is Exclude<ServiceType, null> {
  return ["cloudformation", "grafana", "kubernetes"].includes(
    service.toLowerCase(),
  );
}
