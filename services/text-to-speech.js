// === TEXT-TO-SPEECH SERVICE ===
// Convert text to audio using multiple providers

const { HfInference } = require("@huggingface/inference");
const axios = require("axios");

const hf = process.env.HF_TOKEN ? new HfInference(process.env.HF_TOKEN) : null;

// TTS Models
const TTS_MODELS = [
  'facebook/fastspeech2-en-ljspeech',  // Fast & good quality
  'facebook/mms-tts-eng',  // Multilingual
  'espnet/kan-bayashi_ljspeech_vits',  // High quality
];

/**
 * Generate speech from text with fallback
 * @param {string} text - Text to convert to speech
 * @param {Object} options - Generation options
 * @returns {Promise<Buffer>} Audio buffer
 */
async function textToSpeech(text, options = {}) {
  const {
    language = 'en',
    voice = 'default',
  } = options;

  const errors = [];

  // Check if HF token is configured
  if (!hf || !process.env.HF_TOKEN) {
    throw new Error(`❌ HuggingFace token tidak dikonfigurasi!

📝 Cara setup:
1. Buka: https://huggingface.co/settings/tokens
2. Create token baru (read access)
3. Copy token
4. Tambahkan ke file .env:
   HF_TOKEN=hf_xxxxxxxxxx

Setelah itu restart bot!`);
  }

  // Try multiple TTS models with fallback
  for (let i = 0; i < TTS_MODELS.length; i++) {
    const model = TTS_MODELS[i];
    try {
      console.log(`🎤 Trying TTS model ${i + 1}/${TTS_MODELS.length}: ${model}`);
      const result = await generateWithHF(text, model);
      console.log(`✅ Success with model: ${model}`);
      return result;
    } catch (error) {
      console.log(`❌ Model ${model} failed:`, error.message);
      errors.push(`${model}: ${error.message}`);
      
      // Continue to next model
      if (i < TTS_MODELS.length - 1) {
        console.log(`⏭️ Trying next model...`);
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
    }
  }

  // All models failed
  console.error("❌ All TTS models failed:", errors);
  
  throw new Error(`❌ Maaf, text-to-speech sedang bermasalah.

💡 Kemungkinan:
• Server sedang sibuk (coba lagi 1-2 menit)
• Model sedang loading
• Text terlalu panjang

🔧 Solusi:
• Tunggu 1-2 menit lalu coba lagi
• Coba text yang lebih pendek
• Pastikan HF token valid`);
}

/**
 * Generate speech with HuggingFace
 */
async function generateWithHF(text, model) {
  try {
    console.log(`🎤 Generating speech for: "${text.substring(0, 50)}..."`);

    const response = await hf.textToSpeech({
      model: model,
      inputs: text,
    });

    // Convert response to buffer
    let buffer;
    if (response instanceof Blob) {
      const arrayBuffer = await response.arrayBuffer();
      buffer = Buffer.from(arrayBuffer);
    } else if (Buffer.isBuffer(response)) {
      buffer = response;
    } else if (response && typeof response === 'object' && response.data) {
      buffer = Buffer.from(response.data);
    } else {
      throw new Error("Invalid response format from HuggingFace");
    }

    console.log(`✅ Generated audio: ${buffer.length} bytes`);
    return buffer;
  } catch (error) {
    console.error("❌ HF TTS error:", error.message);
    throw error;
  }
}

/**
 * Text-to-Speech with Banana.dev (alternative)
 * Requires BANANA_API_KEY in .env
 */
async function textToSpeechBanana(text, options = {}) {
  const apiKey = process.env.BANANA_API_KEY;
  
  if (!apiKey) {
    throw new Error("Banana API key not configured");
  }

  try {
    console.log(`🍌 Generating speech with Banana.dev...`);

    const response = await axios.post(
      'https://api.banana.dev/start/v4',
      {
        apiKey: apiKey,
        modelKey: 'bark',  // Bark TTS model
        modelInputs: {
          text: text,
          voice_preset: options.voice || 'v2/en_speaker_6',
        },
      },
      {
        timeout: 60000,
      }
    );

    if (response.data && response.data.modelOutputs) {
      const audioBase64 = response.data.modelOutputs[0].audio;
      const buffer = Buffer.from(audioBase64, 'base64');
      
      console.log(`✅ Banana TTS success: ${buffer.length} bytes`);
      return buffer;
    }

    throw new Error("Invalid response from Banana.dev");
  } catch (error) {
    console.error("❌ Banana TTS error:", error.message);
    throw error;
  }
}

/**
 * Get available voices/languages
 */
function getAvailableVoices() {
  return {
    english: ['default', 'male', 'female'],
    indonesian: ['default'],
    multilingual: ['default'],
  };
}

module.exports = {
  textToSpeech,
  textToSpeechBanana,
  getAvailableVoices,
};
