// === AUDIO PROCESSOR SERVICE ===
// Transcribe audio/voice using Whisper AI

const { HfInference } = require("@huggingface/inference");
const Groq = require("groq-sdk");
const axios = require("axios");
const fs = require("fs").promises;
const path = require("path");

// Initialize providers
const hf = process.env.HF_TOKEN ? new HfInference(process.env.HF_TOKEN) : null;

const groq = process.env.GROQ_API_KEY
  ? new Groq({ apiKey: process.env.GROQ_API_KEY })
  : null;

// Whisper models
const WHISPER_MODELS = {
  hf: "openai/whisper-large-v3",
  groq: "whisper-large-v3",
};

/**
 * Transcribe audio with automatic fallback
 * @param {Buffer} audioBuffer - Audio file buffer
 * @param {Object} options - Transcription options
 * @returns {Promise<Object>} Transcription result
 */
async function transcribeAudio(audioBuffer, options = {}) {
  const { language = "auto", translate = false } = options;

  const errors = [];

  // Check file size
  const sizeMB = audioBuffer.length / (1024 * 1024);
  console.log(`📊 Audio size: ${sizeMB.toFixed(2)} MB`);

  // If file too large (>20MB), skip Groq
  const skipGroq = sizeMB > 20;
  if (skipGroq) {
    console.log("⚠️ File too large for Groq (>20MB), using HF only");
  }

  // Try Groq first (faster and more reliable) - if file not too large
  if (groq && !skipGroq) {
    try {
      console.log("🎤 Trying Groq Whisper (fast)...");
      const result = await transcribeWithGroq(audioBuffer, {
        language,
        translate,
      });
      console.log("✅ Groq transcription success");
      return result;
    } catch (error) {
      console.log("❌ Groq failed:", error.message);
      errors.push(`Groq: ${error.message}`);
    }
  }

  // Fallback to Hugging Face
  if (hf) {
    try {
      console.log("🎤 Trying Hugging Face Whisper...");
      const result = await transcribeWithHF(audioBuffer, { language });
      console.log("✅ HF transcription success");
      return result;
    } catch (error) {
      console.log("❌ HF failed:", error.message);
      errors.push(`HF: ${error.message}`);
    }
  }

  // All failed
  throw new Error(
    `❌ Transcription gagal. Audio terlalu besar atau format tidak didukung.\n\n💡 Coba kirim audio yang lebih pendek (<2 menit).`,
  );
}

/**
 * Transcribe with Groq Whisper (Fast & Accurate)
 */
async function transcribeWithGroq(audioBuffer, options = {}) {
  const { language = "en", translate = false } = options;

  // Groq requires file path, so save temporarily
  const tempPath = path.join(__dirname, "../temp", `audio_${Date.now()}.mp3`);

  try {
    // Create temp directory if not exists
    await fs.mkdir(path.dirname(tempPath), { recursive: true });

    // Save buffer to file
    await fs.writeFile(tempPath, audioBuffer);

    // Create file stream
    const file = await fs.readFile(tempPath);

    // Transcribe
    const transcription = await groq.audio.transcriptions.create({
      file: file,
      model: WHISPER_MODELS.groq,
      language: language === "auto" ? undefined : language,
      response_format: "verbose_json",
      temperature: 0.0,
    });

    // Clean up temp file
    await fs.unlink(tempPath);

    return {
      text: transcription.text,
      language: transcription.language || language,
      duration: transcription.duration,
      segments: transcription.segments || [],
      provider: "groq",
    };
  } catch (error) {
    // Clean up on error
    try {
      await fs.unlink(tempPath);
    } catch (e) {
      // Ignore cleanup errors
    }
    throw error;
  }
}

/**
 * Transcribe with Hugging Face Whisper
 */
async function transcribeWithHF(audioBuffer, options = {}) {
  const { language = "en" } = options;

  try {
    // Convert buffer to Blob for HF
    const blob = new Blob([audioBuffer], { type: "audio/mpeg" });

    const result = await hf.automaticSpeechRecognition({
      model: WHISPER_MODELS.hf,
      data: blob,
    });

    return {
      text: result.text,
      language: language,
      duration: null,
      segments: [],
      provider: "huggingface",
    };
  } catch (error) {
    throw new Error(`HF transcription failed: ${error.message}`);
  }
}

/**
 * Transcribe voice note from WhatsApp
 * @param {Buffer} voiceBuffer - Voice note buffer
 * @returns {Promise<Object>} Transcription
 */
async function transcribeVoiceNote(voiceBuffer) {
  try {
    console.log("🎙️ Transcribing voice note...");

    const result = await transcribeAudio(voiceBuffer, {
      language: "auto",
    });

    console.log(`✅ Voice transcribed: "${result.text.substring(0, 50)}..."`);

    return result;
  } catch (error) {
    console.error("❌ Voice transcription failed:", error.message);
    throw error;
  }
}

/**
 * Transcribe audio from URL
 * @param {string} url - Audio URL
 * @returns {Promise<Object>} Transcription
 */
async function transcribeFromURL(url) {
  try {
    console.log("📥 Downloading audio from URL...");

    const response = await axios.get(url, {
      responseType: "arraybuffer",
      timeout: 60000,
      maxContentLength: 25 * 1024 * 1024, // 25MB max
    });

    const audioBuffer = Buffer.from(response.data);

    return await transcribeAudio(audioBuffer);
  } catch (error) {
    console.error("❌ Error transcribing from URL:", error.message);
    throw error;
  }
}

/**
 * Batch transcribe multiple audio files
 * @param {Array<Buffer>} audioBuffers - Array of audio buffers
 * @returns {Promise<Array>} Transcriptions
 */
async function batchTranscribe(audioBuffers) {
  try {
    console.log(`🎤 Batch transcribing ${audioBuffers.length} audio files...`);

    const results = [];

    for (let i = 0; i < audioBuffers.length; i++) {
      console.log(`Processing ${i + 1}/${audioBuffers.length}...`);
      try {
        const result = await transcribeAudio(audioBuffers[i]);
        results.push({
          index: i,
          success: true,
          ...result,
        });
      } catch (error) {
        results.push({
          index: i,
          success: false,
          error: error.message,
        });
      }
    }

    console.log(
      `✅ Batch completed: ${results.filter((r) => r.success).length}/${audioBuffers.length} succeeded`,
    );

    return results;
  } catch (error) {
    console.error("❌ Batch transcription error:", error.message);
    throw error;
  }
}

/**
 * Detect audio language
 * @param {Buffer} audioBuffer - Audio buffer
 * @returns {Promise<string>} Detected language code
 */
async function detectAudioLanguage(audioBuffer) {
  try {
    // Use Groq for language detection
    if (groq) {
      const result = await transcribeWithGroq(audioBuffer, {
        language: "auto",
      });
      return result.language;
    }

    // Default to Indonesian if no detection available
    return "id";
  } catch (error) {
    console.error("❌ Language detection failed:", error.message);
    return "auto";
  }
}

/**
 * Get audio duration and metadata
 * @param {Buffer} audioBuffer - Audio buffer
 * @returns {Promise<Object>} Audio metadata
 */
async function getAudioMetadata(audioBuffer) {
  try {
    // Basic metadata extraction
    const size = audioBuffer.length;
    const format = detectAudioFormat(audioBuffer);

    return {
      size,
      format,
      sizeKB: (size / 1024).toFixed(2),
      sizeMB: (size / (1024 * 1024)).toFixed(2),
    };
  } catch (error) {
    console.error("❌ Error getting audio metadata:", error.message);
    return null;
  }
}

/**
 * Detect audio format from buffer
 * @param {Buffer} buffer - Audio buffer
 * @returns {string} Format name
 */
function detectAudioFormat(buffer) {
  // Check magic numbers
  const header = buffer.slice(0, 12).toString("hex");

  if (header.startsWith("494433")) return "mp3"; // ID3
  if (header.startsWith("fff")) return "mp3"; // MPEG
  if (header.startsWith("52494646")) return "wav"; // RIFF
  if (header.startsWith("4f676753")) return "ogg"; // OggS
  if (header.startsWith("664c6143")) return "flac"; // fLaC
  if (header.startsWith("000000")) return "m4a"; // M4A

  return "unknown";
}

/**
 * Convert audio format (if needed in future)
 * @param {Buffer} audioBuffer - Input audio
 * @param {string} targetFormat - Target format
 * @returns {Promise<Buffer>} Converted audio
 */
async function convertAudioFormat(audioBuffer, targetFormat) {
  // Placeholder for audio conversion
  // Would use ffmpeg or similar library
  console.warn("⚠️ Audio conversion not implemented yet");
  return audioBuffer;
}

/**
 * Check if providers are available
 * @returns {Object} Provider availability
 */
function getAvailableProviders() {
  return {
    groq: !!groq,
    huggingface: !!hf,
  };
}

/**
 * Test transcription providers
 * @returns {Promise<Object>} Test results
 */
async function testProviders() {
  const results = {
    groq: "⚠️ Not configured",
    huggingface: "⚠️ Not configured",
  };

  // Create silent audio buffer for testing (1 second of silence)
  const silentAudio = Buffer.alloc(16000); // 1 sec at 16kHz

  if (groq) {
    try {
      await transcribeWithGroq(silentAudio, { language: "en" });
      results.groq = "✅ Working";
    } catch (error) {
      results.groq = `❌ Error: ${error.message}`;
    }
  }

  if (hf) {
    try {
      // HF test would require valid audio
      results.huggingface = "✅ Configured (untested)";
    } catch (error) {
      results.huggingface = `❌ Error: ${error.message}`;
    }
  }

  return results;
}

module.exports = {
  transcribeAudio,
  transcribeVoiceNote,
  transcribeFromURL,
  batchTranscribe,
  detectAudioLanguage,
  getAudioMetadata,
  getAvailableProviders,
  testProviders,
};
