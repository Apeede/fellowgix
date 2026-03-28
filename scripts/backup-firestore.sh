#!/usr/bin/env bash
set -euo pipefail

PROJECT_ID="${1:-fellowgix}"
BUCKET_NAME="${2:-${PROJECT_ID}-firestore-backups}"
TIMESTAMP="$(date +%Y-%m-%d-%H%M%S)"
OUTPUT_PATH="gs://${BUCKET_NAME}/daily/${TIMESTAMP}"

echo "Starting Firestore export for project ${PROJECT_ID} to ${OUTPUT_PATH}"
gcloud firestore export "${OUTPUT_PATH}" --project "${PROJECT_ID}" --async

echo "Export started. Use: gcloud firestore operations list --project ${PROJECT_ID}"
