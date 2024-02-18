#!/bin/bash

REGION="us-east-1"

show_help() {
    echo "Usage: deploy.sh [OPTIONS]"
    echo "Deploy application to specified environment."
    echo ""
    echo "Options:"
    echo "  -e, --env <environment>   Environment to deploy (dev or prod)"
    echo "  -p, --profile <profile>   AWS profile"
    echo "  -r, --region <region>     AWS region"
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

if [ "$ENV" != "dev" ] && [ "$ENV" != "prod" ]; then
    echo "Error: Invalid environment. Allowed values are dev and prod."
    exit 1
fi

if [ "$ENV" == "prod" ]; then
    read -p "Are you sure you want to deploy to prod environment? (y/N) " confirm
    if [ "$confirm" != "y" ]; then
        echo "Deployment to prod environment aborted."
        exit 1
    fi
fi

echo "Compiling lambdas"
cd ./tag-processor
npm install
npm run compile
cp ./package.json ./build
cd ./build
npm install --production
cd ../..

cd ./tag-notification-sender
npm install
npm run compile
cp ./package.json ./build
cd ./build
npm install --production
cd ../..

echo "Deploying to $ENV environment in region $REGION using profile $PROFILE..."


BUCKET_NAME="tag-processor-artifacts-$ENV"
if awsv2 s3api head-bucket --bucket "$BUCKET_NAME" 2>/dev/null; then
    echo "Bucket $BUCKET_NAME already exists."
else
    echo "Bucket $BUCKET_NAME does not exist. Creating..."
    awsv2 s3api create-bucket --bucket "$BUCKET_NAME" --region "$REGION" --profile "$PROFILE"
    echo "Bucket $BUCKET_NAME created."
fi

sam package --output-template-file ./output.yaml \
    --s3-bucket "$BUCKET_NAME" \
    --profile "$PROFILE" \
    --region "$REGION" \
    --template ./cloudformation/template.yaml

STACK_NAME="tag-processor-stack-$ENV"
sam deploy --capabilities CAPABILITY_IAM CAPABILITY_NAMED_IAM \
    --no-confirm-changeset \
    --parameter-overrides ENV=dev \
    --profile "$PROFILE" \
    --region "$REGION" \
    --s3-bucket "$BUCKET_NAME" \
    --stack-name "$STACK_NAME" \
    --template ./output.yaml


echo "Cleaning build files"
rm -rf ./tag-processor/build
rm -rf ./tag-notification-sender/buid
rm output.yaml

