// === GEMINI IMAGEN SERVICE ===
// High quality image generation using Google Gemini Imagen

const { GoogleGenerativeAI } = require("@google/generative-ai");

const gemini = process.env.GEMINI_API_KEY
  ? new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
  : null;

/**
 * Generate image with Gemini Imagen
 * @param {string} prompt - Image description
 * @param {Object} options - Generation options
 * @returns {Promise<Buffer>} Image buffer
 */
async function generateImageWithGemini(prompt, options = {}) {
  if (!gemini) {
    throw new Error("❌ Gemini API key tidak dikonfigurasi!");
  }

  try {
    console.log("🎨 Generating image with Gemini Imagen...");
    console.log(`📝 Prompt: ${prompt}`);

    // Use Gemini for image generation
    const model = gemini.getGenerativeModel({ model: "gemini-1.5-flash" });
    
    // Generate image description first, then use it
    const enhancedPrompt = `Create a highly detailed, professional quality image of: ${prompt}. 
    Style: photorealistic, high resolution, professional photography, masterpiece quality, 8k, ultra detailed.`;

    const result = await model.generateContent(enhancedPrompt);
    const response = await result.response;
    
    // Note: Gemini doesn't directly generate images yet via API
    // We'll use this as fallback to other services
    throw new Error("Gemini Imagen not available via API yet");
    
  } catch (error) {
    console.error("❌ Gemini Imagen error:", error.message);
    throw error;
  }
}

module.exports = {
  generateImageWithGemini,
};
