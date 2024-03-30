#!/bin/bash

REGION="us-east-1"
PIPELINE_MODE=false

show_help() {
    echo "Usage: deploy.sh [OPTIONS]"
    echo "Deploy application to specified environment."
    echo ""
    echo "Options:"
    echo "  -e, --env <environment>   Environment to deploy (dev or prod)"
    echo "  -p, --profile <profile>   AWS profile"
    echo "  -r, --region <region>     AWS region"
    echo "  --pipeline                Activate pipeline mode"
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
        --pipeline)
            PIPELINE_MODE=true
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


if [ -z "$ENV" ]; then
    echo "Error: -e parameter is mandatory."
    show_help
    exit 1
fi

if [ "$PIPELINE_MODE" = false ] && [ -z "$PROFILE" ]; then
    echo "Error: -p parameter is mandatory when not in pipeline mode."
    show_help
    exit 1
fi

if [ "$ENV" != "dev" ] && [ "$ENV" != "prod" ]; then
    echo "Error: Invalid environment. Allowed values are dev and prod."
    exit 1
fi

if [ "$ENV" == "prod" ]; then
    if [ "$PIPELINE_MODE" = false ]; then
        read -p "Are you sure you want to deploy to prod environment? (y/N) " confirm
        if [ "$confirm" != "y" ]; then
            echo "Deployment to prod environment aborted."
            exit 1
        fi
    fi
fi


if [ "$PIPELINE_MODE" = true ]; then
    echo "Pipeline mode activated."
else
    echo "Standard deployment mode."
fi

echo "Compiling lambdas"
cd ./tag-processor
npm install
npm run compile
cp ./package.json ./build
cd ./build
npm install --omit=dev
cd ../..

cd ./tag-notification-sender
npm install
npm run compile
cp ./package.json ./build
cd ./build
npm install --omit=dev
cd ../..

echo "Deploying to $ENV environment in region $REGION..."

BUCKET_NAME="tag-processor-app-artifacts-$ENV"

PROFILE_FLAG=""
if [ "$PIPELINE_MODE" = false ]; then
    PROFILE_FLAG="--profile $PROFILE"
    echo "using profile $PROFILE..."
fi

if aws s3api head-bucket --bucket "$BUCKET_NAME" 2>/dev/null; then
    echo "Bucket $BUCKET_NAME already exists."
else
    echo "Bucket $BUCKET_NAME does not exist. Creating..."
    aws s3api create-bucket --bucket "$BUCKET_NAME" --region "$REGION" $PROFILE_FLAG
    echo "Bucket $BUCKET_NAME created."
fi

sam package --output-template-file ./output.yaml \
    --s3-bucket "$BUCKET_NAME" \
    $PROFILE_FLAG \
    --region "$REGION" \
    --template ./cloudformation/template.yaml || {
  echo "Deployment failed due to a packaging error."
  exit 1
}

STACK_NAME="tag-processor-stack-$ENV"

sam deploy --capabilities CAPABILITY_IAM CAPABILITY_NAMED_IAM \
    --no-confirm-changeset \
    --no-fail-on-empty-changeset \
    --parameter-overrides ENV=dev \
    $PROFILE_FLAG \
    --region "$REGION" \
    --s3-bucket "$BUCKET_NAME" \
    --stack-name "$STACK_NAME" \
    --template ./output.yaml || {
  echo "Deployment failed due to a stack error."
  exit 1
}


echo "Cleaning build files"
rm -rf ./tag-processor/build
rm -rf ./tag-notification-sender/buid
rm output.yaml

