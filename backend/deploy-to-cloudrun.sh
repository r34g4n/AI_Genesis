#!/bin/bash

# Configuration - these can be edited directly in this file
SERVICE_NAME="ai-genesis-backend"
REGION="us-east5"  # Ohio region
MEMORY="512Mi"
CPU="1"
PORT="2024"
ALLOW_UNAUTHENTICATED=true

# Check if gcloud is installed
if ! command -v gcloud &> /dev/null; then
    echo "Error: gcloud CLI is not installed. Please install it first."
    echo "Visit: https://cloud.google.com/sdk/docs/install"
    exit 1
fi

# Check if user is logged in
if ! gcloud auth list --filter=status:ACTIVE --format="value(account)" &> /dev/null; then
    echo "Error: You are not logged in to Google Cloud. Please run 'gcloud auth login' first."
    exit 1
fi

# Get the project ID
PROJECT_ID=$(gcloud config get-value project)
if [ -z "$PROJECT_ID" ]; then
    echo "Error: No Google Cloud project is set. Please run 'gcloud config set project YOUR_PROJECT_ID' first."
    exit 1
fi

# Load environment variables from .env file
if [ -f .env ]; then
    echo "Using environment variables from .env file"
    export $(grep -v '^#' .env | xargs)
else
    echo "Error: .env file not found. Please create one with the required environment variables."
    exit 1
fi

# Enable required APIs
echo "Enabling required APIs..."
gcloud services enable artifactregistry.googleapis.com
gcloud services enable run.googleapis.com

# Create a unique image tag based on timestamp
TIMESTAMP=$(date +%Y%m%d%H%M%S)

# Use Artifact Registry instead of Container Registry
REGION_SUFFIX="us-east5-docker.pkg.dev"
REPO_NAME="ai-genesis-images"
IMAGE_NAME="$REGION_SUFFIX/$PROJECT_ID/$REPO_NAME/$SERVICE_NAME:$TIMESTAMP"

# Ensure the repository exists
echo "Ensuring Artifact Registry repository exists..."
gcloud artifacts repositories describe $REPO_NAME --location=$REGION 2>/dev/null || \
gcloud artifacts repositories create $REPO_NAME \
    --repository-format=docker \
    --location=$REGION \
    --description="AI Genesis Docker images"

# Configure Docker to use gcloud as a credential helper
echo "Configuring Docker authentication..."
gcloud auth configure-docker $REGION_SUFFIX --quiet

# Build the container image locally
echo "Building container image locally..."
docker build -t $IMAGE_NAME .

# Push the image to Google Artifact Registry
echo "Pushing image to Google Artifact Registry..."
docker push $IMAGE_NAME

# Deploy the container image to Cloud Run
echo "Deploying to Cloud Run..."
gcloud run deploy $SERVICE_NAME \
    --image $IMAGE_NAME \
    --region $REGION \
    --memory $MEMORY \
    --cpu $CPU \
    --port $PORT \
    --min-instances=1 \
    --max-instances=1 \
    --set-env-vars="DATABASE_URI=$DATABASE_URI" \
    --set-env-vars="GOOGLE_API_KEY=$GOOGLE_API_KEY" \
    --set-env-vars="LANGSMITH_API_KEY=$LANGSMITH_API_KEY" \
    --set-env-vars="LANGSMITH_TRACING=$LANGSMITH_TRACING" \
    --set-env-vars="LANGCHAIN_PROJECT=$LANGCHAIN_PROJECT" \
    --set-env-vars="TAVILY_API_KEY=$TAVILY_API_KEY" \
    --allow-unauthenticated

# Get the service URL
SERVICE_URL=$(gcloud run services describe $SERVICE_NAME --region $REGION --format="value(status.url)")
echo "Deployment complete! Your service is available at: $SERVICE_URL"
