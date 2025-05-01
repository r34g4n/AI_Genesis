# Configuration - these can be edited directly in this file
$serviceName = "ai-genesis-backend"
$region = "us-east5"  # Ohio region
$memory = "512Mi"
$cpu = "1"
$port = "2024"
$allowUnauthenticated = $true

# Check if gcloud is installed
if (!(Get-Command gcloud -ErrorAction SilentlyContinue)) {
    Write-Host "Error: gcloud CLI is not installed. Please install it first."
    Write-Host "Visit: https://cloud.google.com/sdk/docs/install"
    exit 1
}

# Check if user is logged in
$activeAccount = gcloud auth list --filter=status:ACTIVE --format="value(account)" 2>$null
if ([string]::IsNullOrEmpty($activeAccount)) {
    Write-Host "Error: You are not logged in to Google Cloud. Please run 'gcloud auth login' first."
    exit 1
}

Write-Host "Your active configuration is: [$activeAccount]"

# Get the project ID
$projectId = gcloud config get-value project
if ([string]::IsNullOrEmpty($projectId)) {
    Write-Host "Error: No Google Cloud project is set. Please run 'gcloud config set project YOUR_PROJECT_ID' first."
    exit 1
}

# Load environment variables from .env file
if (Test-Path .env) {
    Write-Host "Using environment variables from .env file"
    Get-Content .env | ForEach-Object {
        if (!$_.StartsWith('#') -and $_.Length -gt 0) {
            $key, $value = $_ -split '=', 2
            Set-Item -Path "Env:$key" -Value $value
        }
    }
} else {
    Write-Host "Error: .env file not found. Please create one with the required environment variables."
    exit 1
}

# Enable required APIs
Write-Host "Enabling required APIs..."
gcloud services enable artifactregistry.googleapis.com
gcloud services enable run.googleapis.com

# Create a unique image tag based on timestamp
$timestamp = Get-Date -Format "yyyyMMddHHmmss"

# Use Artifact Registry instead of Container Registry
$regionSuffix = "us-east5-docker.pkg.dev"
$repoName = "ai-genesis-images"
$imageName = "$regionSuffix/$projectId/$repoName/$serviceName`:$timestamp"

# Ensure the repository exists
Write-Host "Ensuring Artifact Registry repository exists..."
$repoExists = $null
try {
    $repoExists = gcloud artifacts repositories describe $repoName --location=$region 2>$null
} catch {}

if (-not $repoExists) {
    gcloud artifacts repositories create $repoName `
        --repository-format=docker `
        --location=$region `
        --description="AI Genesis Docker images"
}

# Configure Docker to use gcloud as a credential helper
Write-Host "Configuring Docker authentication..."
gcloud auth configure-docker $regionSuffix --quiet

# Build the container image locally
Write-Host "Building container image locally..."
docker build -t $imageName .

# Push the image to Google Artifact Registry
Write-Host "Pushing image to Google Artifact Registry..."
docker push $imageName

# Deploy the container image to Cloud Run
Write-Host "Deploying to Cloud Run..."
$deployCommand = @"
gcloud run deploy $serviceName `
    --image $imageName `
    --region $region `
    --memory $memory `
    --cpu $cpu `
    --port $port `
    --min-instances=1 `
    --max-instances=1 `
    --set-env-vars="DATABASE_URI=$DATABASE_URI" `
    --set-env-vars="GOOGLE_API_KEY=$GOOGLE_API_KEY" `
    --set-env-vars="LANGSMITH_API_KEY=$LANGSMITH_API_KEY" `
    --set-env-vars="LANGSMITH_TRACING=$LANGSMITH_TRACING" `
    --set-env-vars="LANGCHAIN_PROJECT=$LANGCHAIN_PROJECT" `
    --set-env-vars="TAVILY_API_KEY=$TAVILY_API_KEY" `
    --allow-unauthenticated
"@

# Execute the deployment command
Invoke-Expression $deployCommand

# Get the service URL
$serviceUrl = gcloud run services describe $serviceName --region $region --format="value(status.url)"
Write-Host "Deployment complete! Your service is available at: $serviceUrl"
