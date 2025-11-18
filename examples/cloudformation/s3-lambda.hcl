# CloudFormation Example: S3 Bucket with Lambda Trigger
use cloudformation

AWSTemplateFormatVersion = "2010-09-09"
Description = "S3 bucket with Lambda function trigger for image processing"

Parameters {
  BucketName {
    Type = "String"
    Description = "Name of the S3 bucket for image uploads"
  }

  LambdaRuntime {
    Type = "String"
    Default = "python3.12"
    AllowedValues = ["python3.11", "python3.12", "nodejs18.x", "nodejs20.x"]
    Description = "Lambda function runtime"
  }
}

Resources {
  ImageBucket {
    Type = "AWS::S3::Bucket"
    Properties {
      BucketName = "my-image-upload-bucket"
      VersioningConfiguration {
        Status = "Enabled"
      }
      LifecycleConfiguration {
        Rules = [
          {
            Id = "DeleteOldImages"
            Status = "Enabled"
            ExpirationInDays = 90
          }
        ]
      }
    }
  }

  ProcessingFunction {
    Type = "AWS::Lambda::Function"
    Properties {
      FunctionName = "image-processor"
      Runtime = "python3.12"
      Handler = "index.handler"
      Role = "arn:aws:iam::123456789012:role/lambda-execution-role"
      Code {
        ZipFile = "def handler(event, context): print('Processing image')"
      }
      Environment {
        Variables {
          BUCKET_NAME = "my-image-upload-bucket"
        }
      }
      Timeout = 60
      MemorySize = 1024
    }
  }
}

Outputs {
  BucketArn {
    Description = "ARN of the S3 bucket"
    Value = "arn:aws:s3:::my-image-upload-bucket"
    Export {
      Name = "ImageBucketArn"
    }
  }

  FunctionArn {
    Description = "ARN of the Lambda function"
    Value = "arn:aws:lambda:us-east-1:123456789012:function:image-processor"
  }
}
