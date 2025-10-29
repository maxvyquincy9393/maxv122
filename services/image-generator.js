// === IMAGE GENERATOR SERVICE ===
// Generate AI images using multiple providers with fallback

const { HfInference } = require("@huggingface/inference");
const axios = require("axios");
const fs = require("fs").promises;
const path = require("path");

// Initialize providers
const hf = process.env.HF_TOKEN ? new HfInference(process.env.HF_TOKEN) : null;

// Multiple image models for fallback (Best quality first)
const IMAGE_MODELS = [
  'black-forest-labs/FLUX.1-schnell',  // FLUX - Fast & ultra high quality!
  'stabilityai/sdxl-turbo',  // SDXL Turbo - Fast & good quality
  'playgroundai/playground-v2.5-1024px-aesthetic',  // Playground - Aesthetic & high quality
  'SG161222/RealVisXL_V4.0',  // RealVis XL - Ultra realistic
  'prompthero/openjourney-v4',  // OpenJourney - Artistic
  'runwayml/stable-diffusion-v1-5',  // SD 1.5 - Reliable fallback
];

// Image generation models
const IMAGE_GENERATION_MODELS = {
  hf_sd2: "stabilityai/stable-diffusion-2-1",
  hf_sd: "stabilityai/stable-diffusion-xl-base-1.0",
  hf_flux: "black-forest-labs/FLUX.1-schnell",
  hf_anime: "Linaqruf/anything-v3.0",
  openai: "dall-e-3",
};

// Default model
const DEFAULT_MODEL = process.env.HF_IMAGE_MODEL || IMAGE_MODELS.hf_sd2;

/**
 * Generate image from text prompt with automatic fallback
 * @param {string} prompt - Text description of image
 * @param {Object} options - Generation options
 * @returns {Promise<Buffer>} Generated image buffer
 */
async function generateImage(prompt, options = {}) {
  const {
    width = 512,
    height = 512,
    style = "realistic",
    negative_prompt = "",
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

  // Try multiple models with fallback (Meta AI style)
  for (let i = 0; i < IMAGE_MODELS.length; i++) {
    const model = IMAGE_MODELS[i];
    try {
      console.log(`🎨 Trying model ${i + 1}/${IMAGE_MODELS.length}: ${model}`);
      const result = await generateWithHF(prompt, {
        model,
        width,
        height,
        negative_prompt,
      });
      console.log(`✅ Success with model: ${model}`);
      return result;
    } catch (error) {
      console.log(`❌ Model ${model} failed:`, error.message);
      errors.push(`${model}: ${error.message}`);
      
      // Continue to next model
      if (i < IMAGE_MODELS.length - 1) {
        console.log(`⏭️ Trying next model...`);
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
    }
  }

  // All models failed - log errors but show friendly message
  console.error("❌ All image models failed:", errors);
  
  throw new Error(`❌ Maaf, generate gambar sedang bermasalah.

💡 Kemungkinan:
• Server sedang sibuk (coba lagi 1-2 menit)
• Model sedang loading (pertama kali agak lama)
• Sudah mencapai limit harian

🔧 Solusi:
• Tunggu 1-2 menit lalu coba lagi
• Coba prompt yang lebih simple
• Coba lagi besok jika limit tercapai`);
}

/**
 * Generate image with Hugging Face
 */
async function generateWithHF(prompt, options = {}) {
  const {
    model = DEFAULT_MODEL,
    width = 512,
    height = 512,
    negative_prompt = "",
  } = options;

  try {
    // Enhance prompt for better results
    const enhancedPrompt = enhancePrompt(prompt);

    console.log(`📝 Enhanced prompt: ${enhancedPrompt}`);

    // Generate image with timeout
    const timeoutMs = 60000; // 60 seconds timeout

    const generationPromise = hf.textToImage({
      model: model,
      inputs: enhancedPrompt,
      parameters: {
        negative_prompt:
          negative_prompt ||
          "blurry, bad quality, distorted, ugly, low resolution",
        num_inference_steps: 30,
        guidance_scale: 7.5,
        width: width,
        height: height,
      },
    });

    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(
        () => reject(new Error("Generation timeout (60s)")),
        timeoutMs,
      ),
    );

    // Race between generation and timeout
    const result = await Promise.race([generationPromise, timeoutPromise]);

    // Convert result to buffer
    let buffer;
    if (result instanceof Blob) {
      const arrayBuffer = await result.arrayBuffer();
      buffer = Buffer.from(arrayBuffer);
    } else if (Buffer.isBuffer(result)) {
      buffer = result;
    } else if (result && typeof result === 'object' && result.data) {
      // Handle response with data property
      buffer = Buffer.from(result.data);
    } else {
      throw new Error("Invalid response format from HuggingFace");
    }

    console.log(`✅ Generated image: ${buffer.length} bytes`);

    return buffer;
  } catch (error) {
    console.error("❌ HF generation error:", error.message);

    // Provide more specific error messages
    if (error.message.includes("timeout")) {
      throw new Error(
        "Model loading timeout - model mungkin sedang cold start. Coba lagi dalam 1 menit.",
      );
    } else if (
      error.message.includes("503") ||
      error.message.includes("Service Unavailable")
    ) {
      throw new Error(
        "HuggingFace API sedang sibuk. Tunggu 1-2 menit lalu coba lagi.",
      );
    } else if (
      error.message.includes("429") ||
      error.message.includes("rate limit")
    ) {
      throw new Error(
        "Rate limit tercapai. Tunggu beberapa menit sebelum generate lagi.",
      );
    } else if (error.message.includes("blob")) {
      throw new Error(
        "Model sedang loading (cold start). Tunggu 30-60 detik lalu coba lagi.",
      );
    }

    throw new Error(`HF image generation failed: ${error.message}`);
  }
}

/**
 * Enhance prompt for better image quality
 */
function enhancePrompt(prompt) {
  // Add quality enhancers for better results
  const qualityTerms = [
    "high quality",
    "detailed",
    "professional",
    "8k",
    "masterpiece",
    "ultra detailed",
    "photorealistic",
  ];

  // Check if prompt already has quality terms
  const hasQuality = qualityTerms.some((term) =>
    prompt.toLowerCase().includes(term),
  );

  if (hasQuality) {
    return prompt;
  }

  // Add STRONG quality enhancement for better results
  return `${prompt}, masterpiece, best quality, ultra detailed, highly detailed, sharp focus, professional photography, photorealistic, 8k uhd, perfect composition, beautiful lighting`;
}

/**
 * Generate multiple images with variations
 * @param {string} prompt - Base prompt
 * @param {number} count - Number of images to generate
 * @returns {Promise<Array>} Array of image buffers
 */
async function generateMultipleImages(prompt, count = 2) {
  const results = [];
  const errors = [];

  console.log(`🎨 Generating ${count} images...`);

  for (let i = 0; i < count; i++) {
    try {
      // Add variation to each prompt
      const variedPrompt = i === 0 ? prompt : `${prompt}, variation ${i + 1}`;

      const buffer = await generateImage(variedPrompt);
      results.push({
        index: i + 1,
        success: true,
        buffer: buffer,
        size: buffer.length,
      });

      console.log(`✅ Image ${i + 1}/${count} generated`);

      // Wait a bit between generations to avoid rate limits
      if (i < count - 1) {
        await new Promise((resolve) => setTimeout(resolve, 2000));
      }
    } catch (error) {
      console.error(`❌ Image ${i + 1} failed:`, error.message);
      results.push({
        index: i + 1,
        success: false,
        error: error.message,
      });
      errors.push(error.message);
    }
  }

  const successCount = results.filter((r) => r.success).length;
  console.log(`✅ Generated ${successCount}/${count} images successfully`);

  return results;
}

/**
 * Generate image with specific style
 * @param {string} prompt - Base prompt
 * @param {string} style - Style preset
 * @returns {Promise<Buffer>} Generated image
 */
async function generateStyledImage(prompt, style = "realistic") {
  const stylePresets = {
    realistic: {
      model: IMAGE_MODELS.hf_sd2,
      enhancement: "photorealistic, natural lighting, detailed",
      negative: "cartoon, anime, drawing, painting, illustration",
    },
    anime: {
      model: IMAGE_MODELS.hf_anime,
      enhancement: "anime style, manga, vibrant colors, detailed",
      negative: "realistic, photo, 3d render",
    },
    artistic: {
      model: IMAGE_MODELS.hf_sd2,
      enhancement:
        "artistic painting, oil painting, masterpiece, detailed artwork",
      negative: "photo, realistic, 3d",
    },
    digital: {
      model: IMAGE_MODELS.hf_sd2,
      enhancement: "digital art, concept art, detailed, trending on artstation",
      negative: "blurry, low quality, sketch",
    },
    cartoon: {
      model: IMAGE_MODELS.hf_sd2,
      enhancement: "cartoon style, colorful, animated, fun",
      negative: "realistic, dark, horror",
    },
  };

  const preset = stylePresets[style] || stylePresets.realistic;
  const enhancedPrompt = `${prompt}, ${preset.enhancement}`;

  return await generateImage(enhancedPrompt, {
    model: preset.model,
    negative_prompt: preset.negative,
  });
}

/**
 * Upscale or enhance image quality
 * @param {Buffer} imageBuffer - Original image
 * @returns {Promise<Buffer>} Enhanced image
 */
async function enhanceImage(imageBuffer) {
  // Placeholder for image enhancement
  // Could use Real-ESRGAN or similar models
  console.warn("⚠️ Image enhancement not yet implemented");
  return imageBuffer;
}

/**
 * Generate image from existing image (img2img)
 * @param {Buffer} inputImage - Source image
 * @param {string} prompt - Transformation prompt
 * @returns {Promise<Buffer>} Generated image
 */
async function imageToImage(inputImage, prompt) {
  // Placeholder for img2img
  console.warn("⚠️ Image-to-image not yet implemented");
  throw new Error("Image-to-image generation not available yet");
}

/**
 * Validate prompt for safety
 * @param {string} prompt - User prompt
 * @returns {Object} Validation result
 */
function validatePrompt(prompt) {
  const prohibited = [
    "nude",
    "naked",
    "nsfw",
    "explicit",
    "gore",
    "violence",
    "telanjang",
    "bugil",
  ];

  const lowerPrompt = prompt.toLowerCase();
  const violations = prohibited.filter((word) => lowerPrompt.includes(word));

  if (violations.length > 0) {
    return {
      valid: false,
      reason: `Prompt mengandung kata terlarang: ${violations.join(", ")}`,
    };
  }

  if (prompt.length < 3) {
    return {
      valid: false,
      reason: "Prompt terlalu pendek (minimal 3 karakter)",
    };
  }

  if (prompt.length > 1000) {
    return {
      valid: false,
      reason: "Prompt terlalu panjang (maksimal 1000 karakter)",
    };
  }

  return { valid: true };
}

/**
 * Get available image generation providers
 * @returns {Object} Provider availability
 */
function getAvailableProviders() {
  return {
    huggingface: !!hf,
  };
}

/**
 * Test image generation providers
 * @returns {Promise<Object>} Test results
 */
async function testProviders() {
  const results = {
    huggingface: "⚠️ Not configured",
  };

  if (hf) {
    try {
      console.log("🧪 Testing HuggingFace image generation...");
      const testBuffer = await generateImage("a simple red circle", {
        width: 256,
        height: 256,
      });

      if (testBuffer && testBuffer.length > 1000) {
        results.huggingface = "✅ Working";
      } else {
        results.huggingface = "⚠️ Generated invalid image";
      }
    } catch (error) {
      results.huggingface = `❌ Error: ${error.message}`;
    }
  }

  return results;
}

/**
 * Get image generation statistics
 * @returns {Object} Stats
 */
function getStats() {
  return {
    providers: getAvailableProviders(),
    models: IMAGE_MODELS,
    defaultModel: DEFAULT_MODEL,
  };
}

/**
 * Save generated image to file
 * @param {Buffer} imageBuffer - Image buffer
 * @param {string} filename - Output filename
 * @returns {Promise<string>} File path
 */
async function saveImage(imageBuffer, filename) {
  const outputDir = path.join(__dirname, "../output");
  await fs.mkdir(outputDir, { recursive: true });

  const filepath = path.join(outputDir, filename);
  await fs.writeFile(filepath, imageBuffer);

  console.log(`💾 Image saved: ${filepath}`);
  return filepath;
}

module.exports = {
  generateImage,
  generateMultipleImages,
  generateStyledImage,
  enhanceImage,
  imageToImage,
  validatePrompt,
  getAvailableProviders,
  testProviders,
  getStats,
  saveImage,
};
