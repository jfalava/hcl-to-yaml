# HCL to YAML Converter

A powerful CLI tool that converts HCL (HashiCorp Configuration Language) files to YAML format with built-in schema validation and service-specific support for CloudFormation, Grafana, and Kubernetes.

## Features

- ✅ Full HCL syntax support (strings, numbers, booleans, arrays, nested objects)
- ✅ Comment handling (single-line `#` and `//`, multi-line `/* */`)
- ✅ Schema validation using Zod
- ✅ Service-specific validators (CloudFormation, Grafana, Kubernetes)
- ✅ Type directives for enhanced validation (`use cloudformation`, `use grafana`, `use kubernetes`)
- ✅ Cross-platform binaries (Windows, Linux, macOS)
- ✅ Built with Bun for maximum performance

## Installation

### From Pre-built Binaries

Download the latest release for your platform from the [Releases](https://github.com/jfalava/hcl-to-yaml/releases) page.

**Linux:**
```bash
wget https://github.com/jfalava/hcl-to-yaml/releases/latest/download/hcl-to-yaml-linux-x64.zip
unzip hcl-to-yaml-linux-x64.zip
chmod +x hcl-to-yaml
sudo mv hcl-to-yaml /usr/local/bin/
```

**macOS:**
```bash
wget https://github.com/jfalava/hcl-to-yaml/releases/latest/download/hcl-to-yaml-macos-arm.zip
unzip hcl-to-yaml-macos-arm.zip
chmod +x hcl-to-yaml.app
sudo mv hcl-to-yaml.app /usr/local/bin/hcl-to-yaml
```

**Windows:**
```powershell
# Download and extract hcl-to-yaml-windows-x64.zip
# Add the directory to your PATH
```

### From Source

```bash
# Clone the repository
git clone https://github.com/jfalava/hcl-to-yaml.git
cd hcl-to-yaml

# Install dependencies
bun install

# Run directly
bun src/app.ts input.hcl output.yaml

# Or build binaries
bun run build:all
```

## Usage

### Basic Conversion

```bash
hcl2yaml input.hcl output.yaml
```

### Examples

**Simple HCL:**
```hcl
# config.hcl
config {
  name = "production"
  enabled = true
  port = 8080
  tags = ["web", "api", "production"]
}
```

**Convert to YAML:**
```bash
hcl2yaml config.hcl config.yaml
```

**Output:**
```yaml
config:
  name: production
  enabled: true
  port: 8080
  tags:
    - web
    - api
    - production
```

## Service-Specific Usage

### CloudFormation

Use the `use cloudformation` directive for CloudFormation-specific validation:

```hcl
# cloudformation.hcl
use cloudformation

Resources {
  MyBucket {
    Type = "AWS::S3::Bucket"
    Properties {
      BucketName = "my-app-bucket"
      VersioningConfiguration {
        Status = "Enabled"
      }
    }
  }

  MyFunction {
    Type = "AWS::Lambda::Function"
    Properties {
      FunctionName = "my-function"
      Runtime = "nodejs18.x"
      Handler = "index.handler"
      Role = "arn:aws:iam::123456789012:role/lambda-role"
      Code {
        S3Bucket = "my-code-bucket"
        S3Key = "function.zip"
      }
    }
  }
}

Parameters {
  Environment {
    Type = "String"
    Default = "production"
    AllowedValues = ["development", "staging", "production"]
  }
}

Outputs {
  BucketName {
    Value = "my-app-bucket"
    Export {
      Name = "MyAppBucket"
    }
  }
}
```

See [docs/cloudformation.md](docs/cloudformation.md) for detailed CloudFormation HCL documentation.

### Grafana

Use the `use grafana` directive for Grafana dashboard validation:

```hcl
# grafana-dashboard.hcl
use grafana

dashboard {
  title = "System Metrics"
  tags = ["system", "monitoring"]
  timezone = "UTC"
  refresh = "30s"

  panels {
    cpu_usage {
      type = "graph"
      title = "CPU Usage"
      gridPos {
        x = 0
        y = 0
        w = 12
        h = 8
      }
      targets {
        prometheus {
          expr = "rate(cpu_usage[5m])"
          legendFormat = "CPU {{instance}}"
        }
      }
    }

    memory_usage {
      type = "graph"
      title = "Memory Usage"
      gridPos {
        x = 12
        y = 0
        w = 12
        h = 8
      }
      targets {
        prometheus {
          expr = "node_memory_usage_bytes"
          legendFormat = "Memory {{instance}}"
        }
      }
    }
  }
}
```

See [docs/grafana.md](docs/grafana.md) for detailed Grafana HCL documentation.

### Kubernetes

Use the `use kubernetes` directive for Kubernetes manifest validation:

```hcl
# kubernetes.hcl
use kubernetes

Deployment {
  apiVersion = "apps/v1"
  kind = "Deployment"
  metadata {
    name = "nginx-deployment"
    labels {
      app = "nginx"
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
        }
      }
      spec {
        containers = [
          {
            name = "nginx"
            image = "nginx:1.25"
            ports = [
              {
                containerPort = 80
              }
            ]
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
  }
  spec {
    selector {
      app = "nginx"
    }
    ports = [
      {
        protocol = "TCP"
        port = 80
        targetPort = 9376
      }
    ]
    type = "LoadBalancer"
  }
}
```

See [docs/kubernetes.md](docs/kubernetes.md) for detailed Kubernetes HCL documentation.

## HCL Syntax Reference

### Supported Types

```hcl
config {
  # Strings
  string_value = "hello world"

  # Numbers (integers, floats, negative, scientific notation)
  integer = 42
  float = 3.14
  negative = -10
  scientific = 1.5e-3

  # Booleans
  enabled = true
  disabled = false

  # Arrays
  numbers = [1, 2, 3]
  strings = ["a", "b", "c"]
  mixed = [1, "two", 3.0, true]

  # Nested objects
  database {
    host = "localhost"
    port = 5432
    credentials {
      username = "admin"
      password = "secret"
    }
  }
}
```

### Comments

```hcl
# Single-line comment with hash

// Single-line comment with slashes

/* Multi-line
   comment
   here */

config {
  name = "test" # Inline comment
}
```

### Terraform-style Named Blocks

```hcl
resource "aws_instance" "web" {
  ami = "ami-123456"
  instance_type = "t2.micro"
}

variable "region" {
  default = "us-west-2"
  type = "string"
}
```

## Development

### Prerequisites

- [Bun](https://bun.sh) >= 1.0.0
- TypeScript >= 5.0.0

### Setup

```bash
# Install dependencies
bun install

# Run type checking
bun run typecheck

# Run tests
bun test

# Format code
bun run format

# Build for all platforms
bun run build:all
```

### Project Structure

```
hcl-to-yaml/
├── src/
│   ├── app.ts                 # CLI entry point
│   ├── parser/
│   │   ├── lexer.ts          # Tokenizer
│   │   └── parser.ts         # HCL parser
│   ├── validation/
│   │   ├── schema.ts         # Generic HCL schema
│   │   ├── validator.ts      # Validation logic
│   │   └── services/         # Service-specific schemas
│   │       ├── cloudformation.ts
│   │       ├── grafana.ts
│   │       └── kubernetes.ts
│   ├── converters/
│   │   ├── converter.ts      # Generic YAML converter
│   │   └── services/         # Service-specific converters
│   │       ├── cloudformation.ts
│   │       ├── grafana.ts
│   │       └── kubernetes.ts
│   └── directives/
│       └── parser.ts         # 'use' directive parser
├── tests/
│   ├── lexer.test.ts
│   ├── parser.test.ts
│   ├── validator.test.ts
│   └── integration.test.ts
├── docs/
│   ├── cloudformation.md
│   ├── grafana.md
│   └── kubernetes.md
├── examples/
│   ├── cloudformation/
│   ├── grafana/
│   └── kubernetes/
└── package.json
```

### Running Tests

```bash
# Run all tests
bun test

# Run specific test file
bun test tests/lexer.test.ts

# Run tests with coverage
bun test --coverage
```

## CLI Options

```
hcl2yaml <input> <output>

Arguments:
  input          Path to HCL file (.hcl or .tf)
  output         Path to output YAML file (.yaml or .yml)

Options:
  -V, --version  Output the version number
  -h, --help     Display help for command
```

## Error Handling

The tool provides detailed error messages for:

- **Syntax errors**: Invalid HCL syntax with line/column information
- **Validation errors**: Schema validation failures with field paths
- **File errors**: Missing input files or invalid file extensions

Example error output:
```
Schema validation failed:
resource.aws_instance.web.ami: Required field missing
resource.aws_instance.web.instance_type: Expected string, got number
```

## Type Directives & LSP Integration

Type directives (like `use cloudformation`) enable:

1. **Service-specific validation**: Validates against service schemas
2. **LSP hints**: When using an HCL LSP, provides auto-completion and validation
3. **Better error messages**: Service-specific error messages and suggestions

## Contributing

Contributions are welcome! Please:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines

- Write tests for new features
- Run `bun run typecheck` before committing
- Format code with `bun run format`
- Follow existing code style and patterns
- Update documentation for new features

## License

MIT License - see [LICENSE](LICENSE) file for details

## Acknowledgments

- Built with [Bun](https://bun.sh)
- Uses [Commander.js](https://github.com/tj/commander.js) for CLI
- Uses [js-yaml](https://github.com/nodeca/js-yaml) for YAML generation
- Uses [Zod](https://github.com/colinhacks/zod) for schema validation

## Roadmap

- [ ] LSP server implementation
- [ ] More service-specific validators (Ansible, Docker Compose, etc.)
- [ ] HCL interpolation support
- [ ] HCL function support
- [ ] Watch mode for file changes
- [ ] Batch conversion support

## Support

- **Issues**: [GitHub Issues](https://github.com/jfalava/hcl-to-yaml/issues)
- **Discussions**: [GitHub Discussions](https://github.com/jfalava/hcl-to-yaml/discussions)

---

Made with ❤️ using Bun
