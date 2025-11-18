import { z } from "zod";

/**
 * CloudFormation-specific schema for validating HCL structures.
 *
 * This schema validates CloudFormation templates written in HCL format,
 * ensuring they conform to AWS CloudFormation specifications.
 *
 * Supported sections:
 * - AWSTemplateFormatVersion (optional)
 * - Description (optional)
 * - Parameters (optional)
 * - Resources (required)
 * - Outputs (optional)
 * - Mappings (optional)
 * - Conditions (optional)
 */

// Generic value schema for CloudFormation properties
const cfnValue: z.ZodType<unknown> = z.union([
  z.string(),
  z.number(),
  z.boolean(),
  z.array(z.lazy(() => cfnValue)),
  z.record(z.string(), z.lazy(() => cfnValue)),
]);

// Parameter schema
const cfnParameterSchema = z.object({
  Type: z.string(),
  Default: z.unknown().optional(),
  Description: z.string().optional(),
  AllowedValues: z.array(z.unknown()).optional(),
  AllowedPattern: z.string().optional(),
  MinLength: z.number().optional(),
  MaxLength: z.number().optional(),
  MinValue: z.number().optional(),
  MaxValue: z.number().optional(),
  NoEcho: z.boolean().optional(),
  ConstraintDescription: z.string().optional(),
});

// Resource schema
const cfnResourceSchema = z.object({
  Type: z.string(),
  Properties: z.record(z.string(), cfnValue).optional(),
  DependsOn: z.union([z.string(), z.array(z.string())]).optional(),
  Metadata: z.record(z.string(), z.unknown()).optional(),
  Condition: z.string().optional(),
  DeletionPolicy: z
    .enum(["Delete", "Retain", "Snapshot", "RetainExceptOnCreate"])
    .optional(),
  UpdatePolicy: z.record(z.string(), z.unknown()).optional(),
  UpdateReplacePolicy: z.enum(["Delete", "Retain", "Snapshot"]).optional(),
  CreationPolicy: z.record(z.string(), z.unknown()).optional(),
});

// Output schema
const cfnOutputSchema = z.object({
  Description: z.string().optional(),
  Value: cfnValue,
  Export: z
    .object({
      Name: z.union([z.string(), cfnValue]),
    })
    .optional(),
  Condition: z.string().optional(),
});

// Mapping schema
const cfnMappingSchema = z.record(z.string(), z.record(z.string(), cfnValue));

// Condition schema
const cfnConditionSchema = cfnValue;

// Main CloudFormation schema
export const cloudFormationSchema = z.object({
  AWSTemplateFormatVersion: z.string().optional(),
  Description: z.string().optional(),
  Parameters: z.record(z.string(), cfnParameterSchema).optional(),
  Resources: z.record(z.string(), cfnResourceSchema),
  Outputs: z.record(z.string(), cfnOutputSchema).optional(),
  Mappings: z.record(z.string(), cfnMappingSchema).optional(),
  Conditions: z.record(z.string(), cfnConditionSchema).optional(),
  Metadata: z.record(z.string(), z.unknown()).optional(),
  Transform: z.union([z.string(), z.array(z.string())]).optional(),
});

export type CloudFormationTemplate = z.infer<typeof cloudFormationSchema>;

/**
 * Validates CloudFormation HCL data against the CloudFormation schema.
 *
 * @param data - Parsed HCL data to validate
 * @throws Error with detailed validation messages if validation fails
 *
 * @example
 * ```typescript
 * const data = {
 *   Resources: {
 *     MyBucket: {
 *       Type: "AWS::S3::Bucket",
 *       Properties: {
 *         BucketName: "my-bucket"
 *       }
 *     }
 *   }
 * };
 * validateCloudFormation(data);
 * ```
 */
export function validateCloudFormation(data: unknown): void {
  const result = cloudFormationSchema.safeParse(data);
  if (!result.success) {
    const errors = result.error.issues
      .map((e) => `${e.path.join(".")}: ${e.message}`)
      .join("\n");
    throw new Error(`CloudFormation validation failed:\n${errors}`);
  }
}

/**
 * Common CloudFormation resource types for validation hints
 */
export const COMMON_CFN_RESOURCE_TYPES = [
  "AWS::S3::Bucket",
  "AWS::EC2::Instance",
  "AWS::EC2::SecurityGroup",
  "AWS::EC2::VPC",
  "AWS::Lambda::Function",
  "AWS::RDS::DBInstance",
  "AWS::DynamoDB::Table",
  "AWS::IAM::Role",
  "AWS::IAM::Policy",
  "AWS::CloudFormation::Stack",
  "AWS::SNS::Topic",
  "AWS::SQS::Queue",
  "AWS::ECS::Cluster",
  "AWS::ECS::Service",
  "AWS::ECS::TaskDefinition",
  "AWS::ElasticLoadBalancingV2::LoadBalancer",
  "AWS::ElasticLoadBalancingV2::TargetGroup",
  "AWS::Route53::RecordSet",
  "AWS::CloudFront::Distribution",
  "AWS::API Gateway::RestApi",
  "AWS::StepFunctions::StateMachine",
  "AWS::Events::Rule",
] as const;
