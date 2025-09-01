// Quick test script to validate API keys
const OpenAI = require('openai');
const { GoogleGenerativeAI } = require('@google/generative-ai');

async function testKeys() {
  console.log('Testing API keys...\n');
  
  // Test OpenAI
  console.log('Testing OpenAI...');
  try {
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });
    
    const response = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [{ role: 'user', content: 'Say "API key works"' }],
      max_tokens: 10
    });
    
    console.log('✅ OpenAI API key is valid');
    console.log('Response:', response.choices[0]?.message?.content);
  } catch (error) {
    console.log('❌ OpenAI API key failed:', error.message);
  }
  
  console.log('\n');
  
  // Test Gemini
  console.log('Testing Google Gemini...');
  try {
    const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    
    const result = await model.generateContent('Say "API key works"');
    const response = result.response;
    
    console.log('✅ Gemini API key is valid');
    console.log('Response:', response.text());
  } catch (error) {
    console.log('❌ Gemini API key failed:', error.message);
  }
}

testKeys().catch(console.error);