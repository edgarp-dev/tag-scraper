#!/bin/bash

REGION="us-east-1"
BRANCH=main

show_help() {
    echo "Usage: deploy.sh [OPTIONS]"
    echo "Deploy pipeline to specified environment."
    echo ""
    echo "Options:"
    echo "  -e, --env <environment>   Environment to deploy (dev or prod)"
    echo "  -p, --profile <profile>   AWS profile"
    echo "  -r, --region <region>     AWS region"
    echo "  -c, --current-branch      Use the current git branch"
    echo "  -h, --help                Show this help message"
}

while [[ $# -gt 0 ]]; do
    key="$1"
    case $key in
        -e|--env)
            ENV="$2"
            shift
            shift
            ;;
        -p|--profile)
            PROFILE="$2"
            shift
            shift
            ;;
        -r|--region)
            REGION="$2"
            shift
            shift
            ;;
        -c|--current-branch)
            BRANCH=$(git rev-parse --abbrev-ref HEAD)
            shift
            ;;
        -h|--help)
            show_help
            exit 0
            ;;
        *)
            echo "Unknown option: $1"
            show_help
            exit 1
            ;;
    esac
done

if [ -z "$ENV" ] || [ -z "$PROFILE" ]; then
    echo "Error: -e and -p parameters are mandatory."
    show_help
    exit 1
fi

if [[ "$ENV" != "prod" && "$ENV" != "dev" ]]; then
    echo "Error: Invalid environment. Allowed values are prod and dev"
    exit 1
fi

BUCKET_NAME="tag-processor-pipeline-artifacts-$ENV"
if awsv2 s3api head-bucket --bucket "$BUCKET_NAME" 2>/dev/null; then
    echo "Bucket $BUCKET_NAME already exists."
else
    echo "Bucket $BUCKET_NAME does not exist. Creating..."
    awsv2 s3api create-bucket --bucket "$BUCKET_NAME" --region "$REGION" --profile "$PROFILE"
    echo "Bucket $BUCKET_NAME created."
fi


echo "Syncing pipeline artifacts"
awsv2 s3 sync ./cloudformation s3://$BUCKET_NAME/cloudformation

echo "Deploying pipeline"
STACK_NAME="tag-processor-pipeline-$ENV"
awsv2 cloudformation deploy \
    --template-file ./cloudformation/pipeline.yaml \
    --stack-name $STACK_NAME \
    --capabilities CAPABILITY_IAM CAPABILITY_NAMED_IAM \
    --parameter-overrides Env=$ENV GitHubOwner=edgarp-dev GitHubRepo=tag-scraper GitHubBranch=$BRANCH ArtifactsBucket=$BUCKET_NAME \
    --profile $PROFILE \
    --region $REGION
