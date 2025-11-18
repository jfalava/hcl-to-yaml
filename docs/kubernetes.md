# Kubernetes Manifest HCL Guide

Write Kubernetes manifests using HCL syntax and convert them to YAML.

## Quick Start

Add `use kubernetes` directive:

```hcl
use kubernetes

Deployment {
  apiVersion = "apps/v1"
  kind = "Deployment"
  # Configuration
}
```

## Complete Example: Web Application Deployment

```hcl
use kubernetes

Deployment {
  apiVersion = "apps/v1"
  kind = "Deployment"
  metadata {
    name = "nginx-deployment"
    namespace = "default"
    labels {
      app = "nginx"
      tier = "frontend"
    }
    annotations {
      "deployment.kubernetes.io/revision" = "1"
    }
  }
  spec {
    replicas = 3
    selector {
      matchLabels {
        app = "nginx"
      }
    }
    template {
      metadata {
        labels {
          app = "nginx"
          tier = "frontend"
        }
      }
      spec {
        containers = [
          {
            name = "nginx"
            image = "nginx:1.25-alpine"
            imagePullPolicy = "IfNotPresent"
            ports = [
              {
                name = "http"
                containerPort = 80
                protocol = "TCP"
              }
            ]
            env = [
              {
                name = "NGINX_PORT"
                value = "80"
              }
            ]
            resources {
              requests {
                cpu = "100m"
                memory = "128Mi"
              }
              limits {
                cpu = "200m"
                memory = "256Mi"
              }
            }
            livenessProbe {
              httpGet {
                path = "/"
                port = 80
              }
              initialDelaySeconds = 30
              periodSeconds = 10
            }
            readinessProbe {
              httpGet {
                path = "/"
                port = 80
              }
              initialDelaySeconds = 5
              periodSeconds = 5
            }
          }
        ]
      }
    }
  }
}

Service {
  apiVersion = "v1"
  kind = "Service"
  metadata {
    name = "nginx-service"
    namespace = "default"
    labels {
      app = "nginx"
    }
  }
  spec {
    type = "LoadBalancer"
    selector {
      app = "nginx"
    }
    ports = [
      {
        name = "http"
        protocol = "TCP"
        port = 80
        targetPort = 80
      }
    ]
    sessionAffinity = "ClientIP"
  }
}

ConfigMap {
  apiVersion = "v1"
  kind = "ConfigMap"
  metadata {
    name = "nginx-config"
    namespace = "default"
  }
  data {
    "nginx.conf" = "events { worker_connections 1024; }\nhttp { server { listen 80; location / { root /usr/share/nginx/html; } } }"
    "app.config" = "log_level=info"
  }
}

Secret {
  apiVersion = "v1"
  kind = "Secret"
  metadata {
    name = "app-secrets"
    namespace = "default"
  }
  type = "Opaque"
  stringData {
    "db-password" = "super-secret-password"
    "api-key" = "abc123def456"
  }
}
```

## StatefulSet Example

```hcl
use kubernetes

StatefulSet {
  apiVersion = "apps/v1"
  kind = "StatefulSet"
  metadata {
    name = "mongodb"
    namespace = "database"
  }
  spec {
    serviceName = "mongodb"
    replicas = 3
    selector {
      matchLabels {
        app = "mongodb"
      }
    }
    template {
      metadata {
        labels {
          app = "mongodb"
        }
      }
      spec {
        containers = [
          {
            name = "mongodb"
            image = "mongo:6.0"
            ports = [
              {
                containerPort = 27017
                name = "mongodb"
              }
            ]
            volumeMounts = [
              {
                name = "data"
                mountPath = "/data/db"
              }
            ]
            env = [
              {
                name = "MONGO_INITDB_ROOT_USERNAME"
                value = "admin"
              },
              {
                name = "MONGO_INITDB_ROOT_PASSWORD"
                valueFrom {
                  secretKeyRef {
                    name = "mongodb-secret"
                    key = "password"
                  }
                }
              }
            ]
          }
        ]
      }
    }
    volumeClaimTemplates = [
      {
        metadata {
          name = "data"
        }
        spec {
          accessModes = ["ReadWriteOnce"]
          resources {
            requests {
              storage = "10Gi"
            }
          }
        }
      }
    ]
  }
}
```

## CronJob Example

```hcl
use kubernetes

CronJob {
  apiVersion = "batch/v1"
  kind = "CronJob"
  metadata {
    name = "backup-job"
    namespace = "default"
  }
  spec {
    schedule = "0 2 * * *"  # Daily at 2 AM
    jobTemplate {
      spec {
        template {
          spec {
            containers = [
              {
                name = "backup"
                image = "backup-tool:latest"
                command = ["backup.sh"]
                env = [
                  {
                    name = "BACKUP_DEST"
                    value = "s3://my-backup-bucket"
                  }
                ]
              }
            ]
            restartPolicy = "OnFailure"
          }
        }
      }
    }
    successfulJobsHistoryLimit = 3
    failedJobsHistoryLimit = 1
  }
}
```

## Ingress Example

```hcl
use kubernetes

Ingress {
  apiVersion = "networking.k8s.io/v1"
  kind = "Ingress"
  metadata {
    name = "app-ingress"
    namespace = "default"
    annotations {
      "kubernetes.io/ingress.class" = "nginx"
      "cert-manager.io/cluster-issuer" = "letsencrypt-prod"
    }
  }
  spec {
    tls = [
      {
        hosts = ["app.example.com"]
        secretName = "app-tls-cert"
      }
    ]
    rules = [
      {
        host = "app.example.com"
        http {
          paths = [
            {
              path = "/"
              pathType = "Prefix"
              backend {
                service {
                  name = "nginx-service"
                  port {
                    number = 80
                  }
                }
              }
            }
          ]
        }
      }
    ]
  }
}
```

## Best Practices

### 1. Resource Limits

Always set resource requests and limits:

```hcl
resources {
  requests {
    cpu = "100m"
    memory = "128Mi"
  }
  limits {
    cpu = "500m"
    memory = "512Mi"
  }
}
```

### 2. Health Checks

Configure liveness and readiness probes:

```hcl
livenessProbe {
  httpGet {
    path = "/healthz"
    port = 8080
  }
  initialDelaySeconds = 30
  periodSeconds = 10
}
```

### 3. Labels and Selectors

Use consistent labeling:

```hcl
metadata {
  labels {
    app = "myapp"
    component = "frontend"
    environment = "production"
  }
}
```

### 4. Namespace Organization

Group related resources in namespaces:

```hcl
metadata {
  namespace = "production"
}
```

### 5. ConfigMaps for Configuration

Externalize configuration:

```hcl
ConfigMap {
  apiVersion = "v1"
  kind = "ConfigMap"
  metadata {
    name = "app-config"
  }
  data {
    "config.yaml" = "..."
  }
}
```

### 6. Secrets for Sensitive Data

Store secrets securely:

```hcl
Secret {
  apiVersion = "v1"
  kind = "Secret"
  type = "Opaque"
  stringData {
    "password" = "..."
  }
}
```

## Common Resource Kinds

- `Deployment` - Stateless application deployment
- `StatefulSet` - Stateful application (databases, etc.)
- `DaemonSet` - One pod per node
- `Service` - Service discovery and load balancing
- `Ingress` - HTTP(S) routing
- `ConfigMap` - Configuration data
- `Secret` - Sensitive data
- `PersistentVolumeClaim` - Storage request
- `Job` - Run-to-completion task
- `CronJob` - Scheduled task
- `Namespace` - Resource isolation
- `ServiceAccount` - Pod identity
- `Role`/`RoleBinding` - RBAC permissions
- `NetworkPolicy` - Network rules
- `HorizontalPodAutoscaler` - Auto-scaling

## API Versions

Common API versions:
- `apps/v1` - Deployments, StatefulSets, DaemonSets
- `v1` - Services, ConfigMaps, Secrets, Pods
- `batch/v1` - Jobs, CronJobs
- `networking.k8s.io/v1` - Ingress, NetworkPolicy
- `rbac.authorization.k8s.io/v1` - Roles, RoleBindings
- `autoscaling/v2` - HorizontalPodAutoscaler

## Conversion

```bash
hcl2yaml deployment.hcl deployment.yaml
```

The tool automatically detects `use kubernetes` and validates against Kubernetes schemas.

## Resources

- [Kubernetes Documentation](https://kubernetes.io/docs/)
- [API Reference](https://kubernetes.io/docs/reference/kubernetes-api/)
- [Best Practices](https://kubernetes.io/docs/concepts/configuration/overview/)
