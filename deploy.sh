#!/bin/bash

# Set your Google Cloud project ID
PROJECT_ID="your-project-id"

# Build the Docker image
echo "Building Docker image..."
docker build -t gcr.io/$PROJECT_ID/news-video-bot .

# Push the Docker image to Google Container Registry
echo "Pushing image to GCR..."
docker push gcr.io/$PROJECT_ID/news-video-bot

# Deploy to Cloud Run
echo "Deploying to Cloud Run..."
gcloud run deploy news-video-bot \
  --image gcr.io/$PROJECT_ID/news-video-bot \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --cpu=2 \
  --memory=2Gi \
  --timeout=600 \
  --set-env-vars="NODE_ENV=production"

# Get the service URL
SERVICE_URL=$(gcloud run services describe news-video-bot \
  --platform managed \
  --region us-central1 \
  --format 'value(status.url)')
  
echo ""
echo "Service deployed successfully!"
echo "URL: $SERVICE_URL"
