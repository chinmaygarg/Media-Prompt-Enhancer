#!/bin/bash

echo "🚀 Testing Complete User Flow with Real LLM Services"
echo "=================================================="

BASE_URL="http://localhost:3000"

# Step 1: Test Analysis API
echo ""
echo "1️⃣ Testing Analysis API..."
ANALYSIS_RESPONSE=$(curl -s -X POST -H "Content-Type: application/json" \
  -d '{"original_prompt": "New eco-friendly water bottle for fitness enthusiasts", "content_type": "product_ad", "platform": "instagram"}' \
  "$BASE_URL/api/analyze")

echo "Analysis Response:"
echo "$ANALYSIS_RESPONSE" | jq .

if [[ $(echo "$ANALYSIS_RESPONSE" | jq -r '.success') == "true" ]]; then
  echo "✅ Analysis API working!"
  ANALYSIS_DATA=$(echo "$ANALYSIS_RESPONSE" | jq -r '.data.analysis' | jq -c .)
else
  echo "❌ Analysis API failed"
  exit 1
fi

# Step 2: Test Questions API
echo ""
echo "2️⃣ Testing Questions API..."
QUESTIONS_RESPONSE=$(curl -s -X POST -H "Content-Type: application/json" \
  -d "{\"analysis\": $(echo "$ANALYSIS_DATA" | jq -c . | sed 's/"/\\"/g' | sed 's/^/\"/' | sed 's/$/\"/')}" \
  "$BASE_URL/api/questions")

echo "Questions Response:"
echo "$QUESTIONS_RESPONSE" | jq .

if [[ $(echo "$QUESTIONS_RESPONSE" | jq -r '.success') == "true" ]]; then
  echo "✅ Questions API working!"
  QUESTIONS_DATA=$(echo "$QUESTIONS_RESPONSE" | jq -r '.data.questions')
  FIRST_QUESTION_ID=$(echo "$QUESTIONS_DATA" | jq -r '.[0].question_id')
  FIRST_OPTION=$(echo "$QUESTIONS_DATA" | jq -r '.[0].options[0]')
else
  echo "❌ Questions API failed"
  exit 1
fi

# Step 3: Test Enhancement API
echo ""
echo "3️⃣ Testing Enhancement API..."
USER_ANSWERS="{\"$FIRST_QUESTION_ID\": \"$FIRST_OPTION\"}"

ENHANCE_RESPONSE=$(curl -s -X POST -H "Content-Type: application/json" \
  -d "{\"original_prompt\": \"New eco-friendly water bottle for fitness enthusiasts\", \"content_type\": \"product_ad\", \"platform\": \"instagram\", \"analysis\": $(echo "$ANALYSIS_DATA" | jq -c . | sed 's/"/\\"/g' | sed 's/^/\"/' | sed 's/$/\"'/), \"user_answers\": $USER_ANSWERS}" \
  "$BASE_URL/api/enhance")

echo "Enhancement Response:"
echo "$ENHANCE_RESPONSE" | jq .

if [[ $(echo "$ENHANCE_RESPONSE" | jq -r '.success') == "true" ]]; then
  echo "✅ Enhancement API working!"
  ENHANCED_PROMPT=$(echo "$ENHANCE_RESPONSE" | jq -r '.data.enhanced_prompt')
else
  echo "❌ Enhancement API failed"
  exit 1
fi

# Results Summary
echo ""
echo "🎉 COMPLETE FLOW TEST SUCCESSFUL!"
echo "================================="
echo ""
echo "📝 Original Prompt:"
echo "   'New eco-friendly water bottle for fitness enthusiasts'"
echo ""
echo "✨ Enhanced Prompt:"
echo "   '$ENHANCED_PROMPT'"
echo ""
echo "🎯 Sample Question Asked:"
echo "   '$(echo "$QUESTIONS_DATA" | jq -r '.[0].question_text')'"
echo "   Answer: '$FIRST_OPTION'"
echo ""
echo "📊 Performance:"
echo "   Analysis time: $(echo "$ANALYSIS_RESPONSE" | jq -r '.data.metadata.processing_time_ms')ms"
echo "   Questions time: $(echo "$QUESTIONS_RESPONSE" | jq -r '.data.metadata.processing_time_ms')ms"
echo "   Enhancement time: $(echo "$ENHANCE_RESPONSE" | jq -r '.data.metadata.processing_time_ms')ms"
echo ""
echo "🎊 ALL APIs WORKING WITH REAL LLM SERVICES!"