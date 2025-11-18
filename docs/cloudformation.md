# CloudFormation HCL Guide

This guide shows you how to write AWS CloudFormation templates using HCL syntax and convert them to YAML.

## Table of Contents

- [Getting Started](#getting-started)
- [Directive Usage](#directive-usage)
- [Template Structure](#template-structure)
- [Resources](#resources)
- [Parameters](#parameters)
- [Outputs](#outputs)
- [Complete Examples](#complete-examples)
- [Best Practices](#best-practices)

## Getting Started

To use CloudFormation-specific validation, add the `use cloudformation` directive at the top of your HCL file:

```hcl
use cloudformation

Resources {
  # Your resources here
}
```

## Directive Usage

The `use cloudformation` directive enables:

- **CloudFormation-specific validation**: Ensures your template conforms to AWS CloudFormation specifications
- **Required fields checking**: Validates that Resources section exists and is properly structured
- **Type checking**: Validates resource Types, parameter Types, and other CloudFormation-specific fields

##  Template Structure

A CloudFormation template in HCL follows this structure:

```hcl
use cloudformation

# Optional: Template format version
AWSTemplateFormatVersion = "2010-09-09"

# Optional: Template description
Description = "My CloudFormation Stack"

# Optional: Parameters
Parameters {
  # Parameter definitions
}

# Required: Resources
Resources {
  # Resource definitions
}

# Optional: Outputs
Outputs {
  # Output definitions
}

# Optional: Mappings
Mappings {
  # Mapping definitions
}

# Optional: Conditions
Conditions {
  # Condition definitions
}
```

## Resources

Resources are the core of your CloudFormation template. Each resource must have a `Type` and optionally `Properties`.

### Basic Resource

```hcl
Resources {
  MyBucket {
    Type = "AWS::S3::Bucket"
    Properties {
      BucketName = "my-unique-bucket-name"
      VersioningConfiguration {
        Status = "Enabled"
      }
    }
  }
}
```

### Resource with DependsOn

```hcl
Resources {
  MyQueue {
    Type = "AWS::SQS::Queue"
    Properties {
      QueueName = "my-queue"
    }
  }

  MyTopic {
    Type = "AWS::SNS::Topic"
    DependsOn = "MyQueue"
    Properties {
      DisplayName = "My Topic"
    }
  }
}
```

### Resource with Deletion Policy

```hcl
Resources {
  MyDatabase {
    Type = "AWS::RDS::DBInstance"
    DeletionPolicy = "Snapshot"
    Properties {
      DBInstanceClass = "db.t3.micro"
      Engine = "postgres"
      MasterUsername = "admin"
      MasterUserPassword = "MySecretPassword123"
      AllocatedStorage = 20
    }
  }
}
```

## Parameters

Parameters allow you to customize your templates at stack creation time.

### String Parameter

```hcl
Parameters {
  EnvironmentName {
    Type = "String"
    Default = "development"
    Description = "Environment name (development, staging, production)"
    AllowedValues = ["development", "staging", "production"]
  }
}
```

### Number Parameter

```hcl
Parameters {
  InstanceCount {
    Type = "Number"
    Default = 2
    MinValue = 1
    MaxValue = 10
    Description = "Number of EC2 instances to launch"
  }
}
```

### List Parameter

```hcl
Parameters {
  SubnetIds {
    Type = "List<AWS::EC2::Subnet::Id>"
    Description = "List of subnet IDs for the application"
  }
}
```

### Parameter with No Echo (Secrets)

```hcl
Parameters {
  DatabasePassword {
    Type = "String"
    NoEcho = true
    Description = "Database master password"
    MinLength = 8
    MaxLength = 41
    AllowedPattern = "[a-zA-Z0-9]*"
    ConstraintDescription = "Must contain only alphanumeric characters"
  }
}
```

## Outputs

Outputs allow you to export values from your stack.

### Simple Output

```hcl
Outputs {
  BucketName {
    Description = "Name of the S3 bucket"
    Value = "my-bucket-name"
  }
}
```

### Output with Export

```hcl
Outputs {
  VPCId {
    Description = "VPC ID"
    Value = "vpc-12345678"
    Export {
      Name = "MyVPCId"
    }
  }
}
```

## Complete Examples

### Example 1: Simple S3 Bucket with SNS Topic

```hcl
use cloudformation

AWSTemplateFormatVersion = "2010-09-09"
Description = "S3 Bucket with SNS Notification"

Parameters {
  BucketPrefix {
    Type = "String"
    Default = "my-app"
    Description = "Prefix for bucket name"
  }

  Environment {
    Type = "String"
    Default = "production"
    AllowedValues = ["development", "staging", "production"]
  }
}

Resources {
  AppBucket {
    Type = "AWS::S3::Bucket"
    Properties {
      BucketName = "my-app-bucket-production"
      VersioningConfiguration {
        Status = "Enabled"
      }
      PublicAccessBlockConfiguration {
        BlockPublicAcls = true
        BlockPublicPolicy = true
        IgnorePublicAcls = true
        RestrictPublicBuckets = true
      }
      Tags = [
        {
          Key = "Environment"
          Value = "production"
        },
        {
          Key = "ManagedBy"
          Value = "CloudFormation"
        }
      ]
    }
  }

  NotificationTopic {
    Type = "AWS::SNS::Topic"
    Properties {
      DisplayName = "S3 Bucket Notifications"
      Subscription = [
        {
          Endpoint = "admin@example.com"
          Protocol = "email"
        }
      ]
    }
  }
}

Outputs {
  BucketName {
    Description = "Name of the S3 bucket"
    Value = "my-app-bucket-production"
    Export {
      Name = "AppBucketName"
    }
  }

  TopicArn {
    Description = "ARN of the SNS topic"
    Value = "arn:aws:sns:us-east-1:123456789012:notification-topic"
    Export {
      Name = "NotificationTopicArn"
    }
  }
}
```

### Example 2: Lambda Function with API Gateway

```hcl
use cloudformation

AWSTemplateFormatVersion = "2010-09-09"
Description = "Serverless API with Lambda and API Gateway"

Parameters {
  FunctionName {
    Type = "String"
    Default = "my-api-function"
    Description = "Name of the Lambda function"
  }

  Runtime {
    Type = "String"
    Default = "nodejs18.x"
    AllowedValues = ["nodejs18.x", "nodejs20.x", "python3.11", "python3.12"]
    Description = "Lambda runtime"
  }
}

Resources {
  LambdaExecutionRole {
    Type = "AWS::IAM::Role"
    Properties {
      AssumeRolePolicyDocument {
        Version = "2012-10-17"
        Statement = [
          {
            Effect = "Allow"
            Principal {
              Service = "lambda.amazonaws.com"
            }
            Action = "sts:AssumeRole"
          }
        ]
      }
      ManagedPolicyArns = [
        "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
      ]
    }
  }

  ApiFunction {
    Type = "AWS::Lambda::Function"
    Properties {
      FunctionName = "my-api-function"
      Runtime = "nodejs18.x"
      Handler = "index.handler"
      Role = "arn:aws:iam::123456789012:role/lambda-execution-role"
      Code {
        S3Bucket = "my-lambda-code-bucket"
        S3Key = "function.zip"
      }
      Environment {
        Variables {
          ENVIRONMENT = "production"
          LOG_LEVEL = "info"
        }
      }
      Timeout = 30
      MemorySize = 512
    }
    DependsOn = "LambdaExecutionRole"
  }

  ApiGateway {
    Type = "AWS::ApiGateway::RestApi"
    Properties {
      Name = "MyAPI"
      Description = "API Gateway for Lambda function"
      EndpointConfiguration {
        Types = ["REGIONAL"]
      }
    }
  }

  ApiResource {
    Type = "AWS::ApiGateway::Resource"
    Properties {
      RestApiId = "api-12345"
      ParentId = "resource-root"
      PathPart = "items"
    }
    DependsOn = "ApiGateway"
  }
}

Outputs {
  FunctionArn {
    Description = "ARN of the Lambda function"
    Value = "arn:aws:lambda:us-east-1:123456789012:function:my-api-function"
  }

  ApiEndpoint {
    Description = "API Gateway endpoint URL"
    Value = "https://api-12345.execute-api.us-east-1.amazonaws.com/prod"
  }
}
```

### Example 3: VPC with Public and Private Subnets

```hcl
use cloudformation

AWSTemplateFormatVersion = "2010-09-09"
Description = "VPC with public and private subnets"

Parameters {
  VpcCidr {
    Type = "String"
    Default = "10.0.0.0/16"
    Description = "CIDR block for VPC"
  }

  PublicSubnetCidr {
    Type = "String"
    Default = "10.0.1.0/24"
    Description = "CIDR block for public subnet"
  }

  PrivateSubnetCidr {
    Type = "String"
    Default = "10.0.2.0/24"
    Description = "CIDR block for private subnet"
  }
}

Resources {
  VPC {
    Type = "AWS::EC2::VPC"
    Properties {
      CidrBlock = "10.0.0.0/16"
      EnableDnsHostnames = true
      EnableDnsSupport = true
      Tags = [
        {
          Key = "Name"
          Value = "MyVPC"
        }
      ]
    }
  }

  InternetGateway {
    Type = "AWS::EC2::InternetGateway"
    Properties {
      Tags = [
        {
          Key = "Name"
          Value = "MyIGW"
        }
      ]
    }
  }

  AttachGateway {
    Type = "AWS::EC2::VPCGatewayAttachment"
    Properties {
      VpcId = "vpc-12345678"
      InternetGatewayId = "igw-12345678"
    }
    DependsOn = ["VPC", "InternetGateway"]
  }

  PublicSubnet {
    Type = "AWS::EC2::Subnet"
    Properties {
      VpcId = "vpc-12345678"
      CidrBlock = "10.0.1.0/24"
      AvailabilityZone = "us-east-1a"
      MapPublicIpOnLaunch = true
      Tags = [
        {
          Key = "Name"
          Value = "PublicSubnet"
        }
      ]
    }
    DependsOn = "VPC"
  }

  PrivateSubnet {
    Type = "AWS::EC2::Subnet"
    Properties {
      VpcId = "vpc-12345678"
      CidrBlock = "10.0.2.0/24"
      AvailabilityZone = "us-east-1a"
      Tags = [
        {
          Key = "Name"
          Value = "PrivateSubnet"
        }
      ]
    }
    DependsOn = "VPC"
  }

  PublicRouteTable {
    Type = "AWS::EC2::RouteTable"
    Properties {
      VpcId = "vpc-12345678"
      Tags = [
        {
          Key = "Name"
          Value = "PublicRouteTable"
        }
      ]
    }
    DependsOn = "VPC"
  }

  PublicRoute {
    Type = "AWS::EC2::Route"
    Properties {
      RouteTableId = "rtb-12345678"
      DestinationCidrBlock = "0.0.0.0/0"
      GatewayId = "igw-12345678"
    }
    DependsOn = ["PublicRouteTable", "AttachGateway"]
  }

  PublicSubnetRouteTableAssociation {
    Type = "AWS::EC2::SubnetRouteTableAssociation"
    Properties {
      SubnetId = "subnet-12345678"
      RouteTableId = "rtb-12345678"
    }
    DependsOn = ["PublicSubnet", "PublicRouteTable"]
  }
}

Outputs {
  VPCId {
    Description = "VPC ID"
    Value = "vpc-12345678"
    Export {
      Name = "VPCId"
    }
  }

  PublicSubnetId {
    Description = "Public Subnet ID"
    Value = "subnet-12345678"
    Export {
      Name = "PublicSubnetId"
    }
  }

  PrivateSubnetId {
    Description = "Private Subnet ID"
    Value = "subnet-87654321"
    Export {
      Name = "PrivateSubnetId"
    }
  }
}
```

## Best Practices

### 1. Use Parameters for Reusability

Make your templates reusable by parameterizing values that might change:

```hcl
Parameters {
  EnvironmentName {
    Type = "String"
    AllowedValues = ["dev", "staging", "prod"]
  }
}
```

### 2. Use DependsOn for Explicit Dependencies

When resources have dependencies, make them explicit:

```hcl
Resources {
  MyFunction {
    Type = "AWS::Lambda::Function"
    DependsOn = "LambdaRole"
    # ...
  }
}
```

### 3. Use Deletion Policies for Data Protection

Protect important data with appropriate deletion policies:

```hcl
Resources {
  Database {
    Type = "AWS::RDS::DBInstance"
    DeletionPolicy = "Snapshot"  # or "Retain"
    # ...
  }
}
```

### 4. Tag Your Resources

Always tag resources for better organization:

```hcl
Resources {
  MyBucket {
    Type = "AWS::S3::Bucket"
    Properties {
      Tags = [
        {Key = "Environment", Value = "production"},
        {Key = "Project", Value = "MyApp"},
        {Key = "ManagedBy", Value = "CloudFormation"}
      ]
    }
  }
}
```

### 5. Export Important Values

Export values that other stacks might need:

```hcl
Outputs {
  VPCId {
    Value = "vpc-12345"
    Export {
      Name = "MyVPCId"
    }
  }
}
```

## Conversion Command

To convert your CloudFormation HCL file to YAML:

```bash
hcl2yaml template.hcl template.yaml
```

The tool will automatically detect the `use cloudformation` directive and apply CloudFormation-specific validation.

## Common Resource Types

Here are some commonly used CloudFormation resource types:

- `AWS::S3::Bucket` - S3 bucket
- `AWS::Lambda::Function` - Lambda function
- `AWS::IAM::Role` - IAM role
- `AWS::EC2::Instance` - EC2 instance
- `AWS::EC2::VPC` - VPC
- `AWS::EC2::Subnet` - Subnet
- `AWS::EC2::SecurityGroup` - Security group
- `AWS::RDS::DBInstance` - RDS database instance
- `AWS::DynamoDB::Table` - DynamoDB table
- `AWS::SNS::Topic` - SNS topic
- `AWS::SQS::Queue` - SQS queue
- `AWS::ApiGateway::RestApi` - API Gateway REST API
- `AWS::ECS::Cluster` - ECS cluster
- `AWS::ElasticLoadBalancingV2::LoadBalancer` - Application/Network Load Balancer

## Further Resources

- [AWS CloudFormation Documentation](https://docs.aws.amazon.com/cloudformation/)
- [AWS Resource Types Reference](https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-template-resource-type-ref.html)
- [CloudFormation Best Practices](https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/best-practices.html)
