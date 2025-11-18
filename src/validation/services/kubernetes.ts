import { z } from "zod";

/**
 * Kubernetes manifest schema for validating HCL structures.
 *
 * This schema validates Kubernetes manifests written in HCL format,
 * ensuring they conform to Kubernetes API specifications.
 *
 * Supports common Kubernetes resource types:
 * - Deployment
 * - Service
 * - ConfigMap
 * - Secret
 * - Ingress
 * - Pod
 * - StatefulSet
 * - DaemonSet
 * - Job
 * - CronJob
 * - PersistentVolumeClaim
 * - Namespace
 */

// Generic Kubernetes value
const k8sValue: z.ZodType<unknown> = z.union([
  z.string(),
  z.number(),
  z.boolean(),
  z.null(),
  z.array(z.lazy(() => k8sValue)),
  z.record(z.string(), z.lazy(() => k8sValue)),
]);

// Metadata schema (common across all resources)
const metadataSchema = z.object({
  name: z.string(),
  namespace: z.string().optional(),
  labels: z.record(z.string(), z.string()).optional(),
  annotations: z.record(z.string(), z.string()).optional(),
  uid: z.string().optional(),
  resourceVersion: z.string().optional(),
  generation: z.number().optional(),
  creationTimestamp: z.string().optional(),
});

// Container port schema
const containerPortSchema = z.object({
  name: z.string().optional(),
  containerPort: z.number(),
  protocol: z.enum(["TCP", "UDP", "SCTP"]).optional(),
  hostPort: z.number().optional(),
  hostIP: z.string().optional(),
});

// Environment variable schema
const envVarSchema = z.object({
  name: z.string(),
  value: z.string().optional(),
  valueFrom: z.record(z.string(), k8sValue).optional(),
});

// Volume mount schema
const volumeMountSchema = z.object({
  name: z.string(),
  mountPath: z.string(),
  subPath: z.string().optional(),
  readOnly: z.boolean().optional(),
});

// Container schema
const containerSchema = z.object({
  name: z.string(),
  image: z.string(),
  imagePullPolicy: z.enum(["Always", "IfNotPresent", "Never"]).optional(),
  command: z.array(z.string()).optional(),
  args: z.array(z.string()).optional(),
  ports: z.array(z.union([containerPortSchema, k8sValue])).optional(),
  env: z.array(z.union([envVarSchema, k8sValue])).optional(),
  envFrom: z.array(k8sValue).optional(),
  volumeMounts: z.array(z.union([volumeMountSchema, k8sValue])).optional(),
  resources: z.record(z.string(), k8sValue).optional(),
  livenessProbe: z.record(z.string(), k8sValue).optional(),
  readinessProbe: z.record(z.string(), k8sValue).optional(),
  startupProbe: z.record(z.string(), k8sValue).optional(),
  lifecycle: z.record(z.string(), k8sValue).optional(),
  securityContext: z.record(z.string(), k8sValue).optional(),
  workingDir: z.string().optional(),
});

// Pod spec schema
const podSpecSchema = z.object({
  containers: z.array(z.union([containerSchema, k8sValue])),
  initContainers: z.array(z.union([containerSchema, k8sValue])).optional(),
  volumes: z.array(k8sValue).optional(),
  restartPolicy: z.enum(["Always", "OnFailure", "Never"]).optional(),
  terminationGracePeriodSeconds: z.number().optional(),
  activeDeadlineSeconds: z.number().optional(),
  dnsPolicy: z.string().optional(),
  serviceAccountName: z.string().optional(),
  serviceAccount: z.string().optional(),
  nodeName: z.string().optional(),
  nodeSelector: z.record(z.string(), z.string()).optional(),
  affinity: z.record(z.string(), k8sValue).optional(),
  tolerations: z.array(k8sValue).optional(),
  hostNetwork: z.boolean().optional(),
  hostPID: z.boolean().optional(),
  hostIPC: z.boolean().optional(),
  securityContext: z.record(z.string(), k8sValue).optional(),
  imagePullSecrets: z.array(k8sValue).optional(),
  hostname: z.string().optional(),
  subdomain: z.string().optional(),
  schedulerName: z.string().optional(),
  priorityClassName: z.string().optional(),
  priority: z.number().optional(),
});

// Pod template spec schema
const podTemplateSpecSchema = z.object({
  metadata: metadataSchema.partial().optional(),
  spec: podSpecSchema,
});

// Label selector schema
const labelSelectorSchema = z.object({
  matchLabels: z.record(z.string(), z.string()).optional(),
  matchExpressions: z.array(k8sValue).optional(),
});

// Service port schema
const servicePortSchema = z.object({
  name: z.string().optional(),
  protocol: z.enum(["TCP", "UDP", "SCTP"]).optional(),
  port: z.number(),
  targetPort: z.union([z.number(), z.string()]).optional(),
  nodePort: z.number().optional(),
});

// Generic resource schema
const k8sResourceSchema = z.object({
  apiVersion: z.string(),
  kind: z.string(),
  metadata: metadataSchema.partial(),
  spec: z.record(z.string(), k8sValue).optional(),
  data: z.record(z.string(), z.union([z.string(), k8sValue])).optional(),
  stringData: z.record(z.string(), z.string()).optional(),
  status: z.record(z.string(), k8sValue).optional(),
});

// Deployment-specific schema
const deploymentSchema = z.object({
  apiVersion: z.string(),
  kind: z.literal("Deployment"),
  metadata: metadataSchema.partial(),
  spec: z.object({
    replicas: z.number().optional(),
    selector: labelSelectorSchema,
    template: podTemplateSpecSchema,
    strategy: z.record(z.string(), k8sValue).optional(),
    minReadySeconds: z.number().optional(),
    revisionHistoryLimit: z.number().optional(),
    paused: z.boolean().optional(),
    progressDeadlineSeconds: z.number().optional(),
  }),
});

// Service-specific schema
const serviceSchema = z.object({
  apiVersion: z.string(),
  kind: z.literal("Service"),
  metadata: metadataSchema.partial(),
  spec: z.object({
    selector: z.record(z.string(), z.string()).optional(),
    ports: z.array(z.union([servicePortSchema, k8sValue])).optional(),
    type: z
      .enum(["ClusterIP", "NodePort", "LoadBalancer", "ExternalName"])
      .optional(),
    clusterIP: z.string().optional(),
    externalIPs: z.array(z.string()).optional(),
    sessionAffinity: z.string().optional(),
    loadBalancerIP: z.string().optional(),
    loadBalancerSourceRanges: z.array(z.string()).optional(),
    externalName: z.string().optional(),
    externalTrafficPolicy: z.enum(["Cluster", "Local"]).optional(),
    healthCheckNodePort: z.number().optional(),
  }),
});

// Main Kubernetes schema - accepts any valid resource
export const kubernetesSchema = z.union([
  deploymentSchema,
  serviceSchema,
  k8sResourceSchema,
  z.record(z.string(), z.union([deploymentSchema, serviceSchema, k8sResourceSchema])),
]);

export type KubernetesResource = z.infer<typeof kubernetesSchema>;

/**
 * Validates Kubernetes manifest HCL data against the Kubernetes schema.
 *
 * @param data - Parsed HCL data to validate
 * @throws Error with detailed validation messages if validation fails
 *
 * @example
 * ```typescript
 * const data = {
 *   Deployment: {
 *     apiVersion: "apps/v1",
 *     kind: "Deployment",
 *     metadata: {
 *       name: "nginx"
 *     },
 *     spec: {
 *       replicas: 3,
 *       selector: {
 *         matchLabels: { app: "nginx" }
 *       },
 *       template: {
 *         spec: {
 *           containers: [{
 *             name: "nginx",
 *             image: "nginx:1.25"
 *           }]
 *         }
 *       }
 *     }
 *   }
 * };
 * validateKubernetes(data);
 * ```
 */
export function validateKubernetes(data: unknown): void {
  const result = kubernetesSchema.safeParse(data);
  if (!result.success) {
    const errors = result.error.issues
      .map((e) => `${e.path.join(".")}: ${e.message}`)
      .join("\n");
    throw new Error(`Kubernetes validation failed:\n${errors}`);
  }
}

/**
 * Common Kubernetes resource kinds
 */
export const COMMON_K8S_KINDS = [
  "Deployment",
  "Service",
  "ConfigMap",
  "Secret",
  "Ingress",
  "Pod",
  "StatefulSet",
  "DaemonSet",
  "Job",
  "CronJob",
  "PersistentVolumeClaim",
  "PersistentVolume",
  "Namespace",
  "ServiceAccount",
  "Role",
  "RoleBinding",
  "ClusterRole",
  "ClusterRoleBinding",
  "NetworkPolicy",
  "HorizontalPodAutoscaler",
  "VerticalPodAutoscaler",
] as const;

/**
 * Common API versions
 */
export const COMMON_API_VERSIONS = {
  Deployment: "apps/v1",
  StatefulSet: "apps/v1",
  DaemonSet: "apps/v1",
  Service: "v1",
  ConfigMap: "v1",
  Secret: "v1",
  Pod: "v1",
  Namespace: "v1",
  Ingress: "networking.k8s.io/v1",
  Job: "batch/v1",
  CronJob: "batch/v1",
  PersistentVolumeClaim: "v1",
  ServiceAccount: "v1",
  Role: "rbac.authorization.k8s.io/v1",
  RoleBinding: "rbac.authorization.k8s.io/v1",
  ClusterRole: "rbac.authorization.k8s.io/v1",
  ClusterRoleBinding: "rbac.authorization.k8s.io/v1",
  NetworkPolicy: "networking.k8s.io/v1",
  HorizontalPodAutoscaler: "autoscaling/v2",
} as const;
