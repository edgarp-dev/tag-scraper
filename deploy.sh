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
            ENVIRONMENT="$2"
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

if [ -z "$ENVIRONMENT" ] || [ -z "$PROFILE" ]; then
    echo "Error: -e and -p parameters are mandatory."
    show_help
    exit 1
fi

if [ "$ENVIRONMENT" != "dev" ] && [ "$ENVIRONMENT" != "prod" ]; then
    echo "Error: Invalid environment. Allowed values are dev and prod."
    exit 1
fi

if [ "$ENVIRONMENT" == "prod" ]; then
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
ls

echo "Deploying to $ENVIRONMENT environment in region $REGION using profile $PROFILE..."
