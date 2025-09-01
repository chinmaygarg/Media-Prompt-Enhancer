// Test complete user flow: input -> analysis -> questions -> enhancement
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

const BASE_URL = 'http://localhost:3000';

async function testCompleteFlow() {
  console.log('🚀 Testing Complete User Flow\n');

  try {
    // Step 1: Test Analysis API
    console.log('1️⃣ Testing Analysis API...');
    const analysisPayload = {
      original_prompt: 'New eco-friendly water bottle for fitness enthusiasts',
      content_type: 'product_ad',
      platform: 'instagram'
    };

    const analysisResponse = await fetch(`${BASE_URL}/api/analyze`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(analysisPayload)
    });

    if (!analysisResponse.ok) {
      throw new Error(`Analysis failed: ${analysisResponse.status} ${analysisResponse.statusText}`);
    }

    const analysisData = await analysisResponse.json();
    console.log('✅ Analysis successful');
    console.log(`   Processing time: ${analysisData.data.metadata.processing_time_ms}ms`);
    console.log(`   Product type: ${analysisData.data.analysis.product_type}`);
    console.log(`   Target audience: ${analysisData.data.analysis.target_audience}\n`);

    // Step 2: Test Questions API
    console.log('2️⃣ Testing Questions API...');
    const questionsPayload = {
      analysis: JSON.stringify(analysisData.data.analysis)
    };

    const questionsResponse = await fetch(`${BASE_URL}/api/questions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(questionsPayload)
    });

    if (!questionsResponse.ok) {
      throw new Error(`Questions failed: ${questionsResponse.status} ${questionsResponse.statusText}`);
    }

    const questionsData = await questionsResponse.json();
    console.log('✅ Questions generation successful');
    console.log(`   Processing time: ${questionsData.data.metadata.processing_time_ms}ms`);
    console.log(`   Generated ${questionsData.data.questions.length} questions`);
    
    // Log first question
    if (questionsData.data.questions.length > 0) {
      const firstQuestion = questionsData.data.questions[0];
      console.log(`   Sample question: "${firstQuestion.question_text}"`);
      console.log(`   Options: ${firstQuestion.options.join(', ')}\n`);
    }

    // Step 3: Simulate user answers and test Enhancement API
    console.log('3️⃣ Testing Enhancement API...');
    
    // Simulate some user answers
    const userAnswers = {};
    questionsData.data.questions.forEach((q, index) => {
      if (index < 2) { // Answer first 2 questions
        userAnswers[q.question_id] = q.options[0]; // Pick first option
      }
    });

    const enhancePayload = {
      original_prompt: analysisPayload.original_prompt,
      content_type: analysisPayload.content_type,
      platform: analysisPayload.platform,
      analysis: JSON.stringify(analysisData.data.analysis),
      user_answers: userAnswers
    };

    const enhanceResponse = await fetch(`${BASE_URL}/api/enhance`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(enhancePayload)
    });

    if (!enhanceResponse.ok) {
      throw new Error(`Enhancement failed: ${enhanceResponse.status} ${enhanceResponse.statusText}`);
    }

    const enhanceData = await enhanceResponse.json();
    console.log('✅ Enhancement successful');
    console.log(`   Processing time: ${enhanceData.data.metadata.processing_time_ms}ms\n`);

    // Show results
    console.log('📋 RESULTS:');
    console.log('='.repeat(80));
    console.log('📝 Original Prompt:');
    console.log(`   "${analysisPayload.original_prompt}"\n`);
    
    console.log('✨ Enhanced Prompt:');
    console.log(`   "${enhanceData.data.enhanced_prompt}"\n`);

    console.log('🎯 User Answers:');
    Object.entries(userAnswers).forEach(([questionId, answer]) => {
      const question = questionsData.data.questions.find(q => q.question_id === questionId);
      console.log(`   ${question?.question_text}: ${answer}`);
    });

    console.log('\n🎉 Complete flow test successful!');
    console.log('='.repeat(80));

    return true;

  } catch (error) {
    console.error('❌ Flow test failed:', error.message);
    
    // Try to get more error details
    if (error.response) {
      const errorText = await error.response.text();
      console.error('Error details:', errorText);
    }
    
    return false;
  }
}

// Run the test
testCompleteFlow()
  .then(success => {
    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    console.error('Unexpected error:', error);
    process.exit(1);
  });