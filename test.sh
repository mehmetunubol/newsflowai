#!/bin/bash

set -e

# Set your API base
API_URL="http://localhost:3000/generate"

echo "📰 Enter the news headline:"
read HEADLINE

echo "🗣 Generating script..."
SCRIPT=$(curl -s -X POST "$API_URL/script" \
  -H "Content-Type: application/json" \
  -d "{\"headline\":\"$HEADLINE\"}" | jq -r '.script')

echo "✅ Script generated:"
echo "$SCRIPT"

echo ""
echo "🔊 Generating voiceover..."
VOICE_PATH=$(curl -s -X POST "$API_URL/voice" \
  -H "Content-Type: application/json" \
  -d "{\"script\":\"$SCRIPT\"}" | jq -r '.voicePath')

echo "✅ Voiceover saved at: $VOICE_PATH"

echo ""
echo "🖼 How many visuals to fetch? (e.g., 3)"
read VISUAL_COUNT

echo "📸 Fetching visuals..."
VISUALS_RESPONSE=$(curl -s -X POST "$API_URL/visuals" \
  -H "Content-Type: application/json" \
  -d "{\"headline\":\"$HEADLINE\", \"count\":$VISUAL_COUNT}")

# Extract image paths into an array
VISUALS_PATHS=$(echo "$VISUALS_RESPONSE" | jq -r '.visualsPaths | @sh')

echo "✅ Visuals downloaded: $VISUALS_PATHS"

echo ""
echo "🎬 Composing final video..."
curl -s -X POST "$API_URL/compose" \
  -H "Content-Type: application/json" \
  -d "{
    \"voicePath\": \"$VOICE_PATH\",
    \"visualsPaths\": $(echo "$VISUALS_RESPONSE" | jq '.visualsPaths'),
    \"script\": \"$SCRIPT\"
  }"

echo ""
echo "✅ All done! Video created successfully."

