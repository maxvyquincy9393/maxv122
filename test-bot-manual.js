// Manual Bot Testing Script
// Run this to test bot functions without WhatsApp

require('dotenv').config();

const { generateAI, testProviders } = require('./services/multi-ai');
const { getCurrentTimeNatural, getCryptoPrice } = require('./services/realtime-api');
const { detectIntent } = require('./utils/intent-detector');

async function testBot() {
  console.log('🧪 MAXVY Bot Manual Testing\n');
  console.log('═══════════════════════════════════════\n');

  // Test 1: AI Providers
  console.log('📋 Test 1: AI Provider Status');
  console.log('─────────────────────────────────────');
  try {
    const providers = await testProviders();
    console.log('Gemini:', providers.gemini);
    console.log('Groq:', providers.groq);
    console.log('OpenRouter:', providers.openrouter);
    console.log('✅ Provider test completed\n');
  } catch (error) {
    console.log('❌ Provider test failed:', error.message, '\n');
  }

  // Test 2: Simple AI Response
  console.log('📋 Test 2: AI Response Test');
  console.log('─────────────────────────────────────');
  try {
    const response = await generateAI('Halo, siapa kamu?');
    console.log('Response:', response);
    console.log('✅ AI response test completed\n');
  } catch (error) {
    console.log('❌ AI response test failed:', error.message, '\n');
  }

  // Test 3: Time Query
  console.log('📋 Test 3: Time Query Test');
  console.log('─────────────────────────────────────');
  try {
    const timeResponse = getCurrentTimeNatural('WIB');
    console.log('Time Response:', timeResponse);
    console.log('✅ Time query test completed\n');
  } catch (error) {
    console.log('❌ Time query test failed:', error.message, '\n');
  }

  // Test 4: Crypto Price
  console.log('📋 Test 4: Crypto Price Test');
  console.log('─────────────────────────────────────');
  try {
    const cryptoResponse = await getCryptoPrice('BTC');
    console.log('Crypto Response:', cryptoResponse);
    console.log('✅ Crypto price test completed\n');
  } catch (error) {
    console.log('❌ Crypto price test failed:', error.message, '\n');
  }

  // Test 5: Intent Detection
  console.log('📋 Test 5: Intent Detection Test');
  console.log('─────────────────────────────────────');
  try {
    const intents = [
      'jam berapa sekarang?',
      'buatkan gambar kucing lucu',
      'ingetin aku jam 2 siang meeting',
      'harga bitcoin berapa?',
      'siapa kamu?'
    ];

    for (const query of intents) {
      const intent = detectIntent(query);
      console.log(`Query: "${query}"`);
      console.log(`Intent: ${intent.type} (confidence: ${intent.confidence})`);
      console.log('');
    }
    console.log('✅ Intent detection test completed\n');
  } catch (error) {
    console.log('❌ Intent detection test failed:', error.message, '\n');
  }

  // Test 6: Conversational AI
  console.log('📋 Test 6: Conversational AI Test');
  console.log('─────────────────────────────────────');
  try {
    const conversations = [
      'Halo!',
      'Apa kabar?',
      'Kamu bisa bantu apa aja?',
      'Siapa yang buat kamu?',
      'Terima kasih!'
    ];

    for (const msg of conversations) {
      console.log(`User: ${msg}`);
      const response = await generateAI(msg);
      console.log(`Max: ${response}\n`);
      // Add small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    console.log('✅ Conversational AI test completed\n');
  } catch (error) {
    console.log('❌ Conversational AI test failed:', error.message, '\n');
  }

  console.log('═══════════════════════════════════════');
  console.log('🎉 All tests completed!');
  console.log('═══════════════════════════════════════\n');
}

// Run tests
testBot().catch(error => {
  console.error('❌ Test suite failed:', error);
  process.exit(1);
});
