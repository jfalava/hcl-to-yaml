# Kubernetes Example: Complete Web Application Stack
use kubernetes

Namespace {
  apiVersion = "v1"
  kind = "Namespace"
  metadata {
    name = "webapp"
    labels {
      name = "webapp"
      environment = "production"
    }
  }
}

Deployment {
  apiVersion = "apps/v1"
  kind = "Deployment"
  metadata {
    name = "webapp-deployment"
    namespace = "webapp"
    labels {
      app = "webapp"
      tier = "frontend"
    }
  }
  spec {
    replicas = 3
    selector {
      matchLabels {
        app = "webapp"
      }
    }
    template {
      metadata {
        labels {
          app = "webapp"
          tier = "frontend"
        }
      }
      spec {
        containers = [
          {
            name = "webapp"
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
                name = "ENVIRONMENT"
                value = "production"
              },
              {
                name = "DATABASE_URL"
                valueFrom {
                  secretKeyRef {
                    name = "webapp-secrets"
                    key = "database-url"
                  }
                }
              }
            ]
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
            livenessProbe {
              httpGet {
                path = "/health"
                port = 80
              }
              initialDelaySeconds = 30
              periodSeconds = 10
            }
            readinessProbe {
              httpGet {
                path = "/ready"
                port = 80
              }
              initialDelaySeconds = 5
              periodSeconds = 5
            }
            volumeMounts = [
              {
                name = "config"
                mountPath = "/etc/webapp/config"
                readOnly = true
              }
            ]
          }
        ]
        volumes = [
          {
            name = "config"
            configMap {
              name = "webapp-config"
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
    name = "webapp-service"
    namespace = "webapp"
    labels {
      app = "webapp"
    }
  }
  spec {
    type = "ClusterIP"
    selector {
      app = "webapp"
    }
    ports = [
      {
        name = "http"
        protocol = "TCP"
        port = 80
        targetPort = 80
      }
    ]
  }
}

ConfigMap {
  apiVersion = "v1"
  kind = "ConfigMap"
  metadata {
    name = "webapp-config"
    namespace = "webapp"
  }
  data {
    "app.conf" = "log_level=info\nmax_connections=100"
    "nginx.conf" = "worker_processes auto;\nevents { worker_connections 1024; }"
  }
}

Secret {
  apiVersion = "v1"
  kind = "Secret"
  metadata {
    name = "webapp-secrets"
    namespace = "webapp"
  }
  type = "Opaque"
  stringData {
    "database-url" = "postgresql://user:pass@db:5432/webapp"
    "api-key" = "super-secret-api-key"
  }
}

Ingress {
  apiVersion = "networking.k8s.io/v1"
  kind = "Ingress"
  metadata {
    name = "webapp-ingress"
    namespace = "webapp"
    annotations {
      "kubernetes.io/ingress.class" = "nginx"
      "cert-manager.io/cluster-issuer" = "letsencrypt-prod"
    }
  }
  spec {
    tls = [
      {
        hosts = ["webapp.example.com"]
        secretName = "webapp-tls"
      }
    ]
    rules = [
      {
        host = "webapp.example.com"
        http {
          paths = [
            {
              path = "/"
              pathType = "Prefix"
              backend {
                service {
                  name = "webapp-service"
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
