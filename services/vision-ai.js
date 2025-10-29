// === VISION AI SERVICE ===
// Analyze images and videos using Gemini Vision

const { GoogleGenerativeAI } = require("@google/generative-ai");
const { OpenAI } = require("openai");

const gemini = process.env.GEMINI_API_KEY
  ? new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
  : null;

const openrouterVision = process.env.OPENROUTER_API_KEY
  ? new OpenAI({
      apiKey: process.env.OPENROUTER_API_KEY,
      baseURL: "https://openrouter.ai/api/v1",
      defaultHeaders: {
        "HTTP-Referer": "https://github.com/maxvy",
        "X-Title": "Max Bot",
      },
    })
  : null;

const VISION_MODELS = {
  openrouter: "qwen/qwen2.5-vl-32b-instruct:free",
  gemini: "gemini-1.5-flash",
};

/**
 * Analyze image with Gemini Vision
 * @param {Buffer} imageBuffer - Image data
 * @param {string} prompt - Optional prompt/question about image
 * @returns {Promise<string>} Analysis result
 */
async function analyzeImage(imageBuffer, prompt = "Describe this image in detail") {
  try {
    const base64Image = imageBuffer.toString("base64");

    // Prefer OpenRouter Qwen Vision if available
    if (openrouterVision) {
      console.log("👁️ Analyzing image with Qwen VL via OpenRouter...");

      const completion = await openrouterVision.chat.completions.create({
        model: VISION_MODELS.openrouter,
        messages: [
          {
            role: "system",
            content:
              "You are Max, an AI assistant from maxvy.ai. Provide detailed, structured descriptions for images.",
          },
          {
            role: "user",
            content: [
              {
                type: "input_text",
                text: prompt,
              },
              {
                type: "input_image",
                image_url: {
                  url: `data:image/jpeg;base64,${base64Image}`,
                },
              },
            ],
          },
        ],
        max_tokens: 800,
      });

      const text = completion.choices[0]?.message?.content;

      if (text) {
        console.log("✅ Image analysis complete (Qwen)");
        return text;
      }

      console.log("⚠️ Qwen VL returned empty response, falling back to Gemini...");
    }

    if (!gemini) {
      throw new Error(
        "❌ Tidak ada penyedia Vision yang tersedia. Set OPENROUTER_API_KEY atau GEMINI_API_KEY di .env",
      );
    }

    console.log("👁️ Analyzing image with Gemini Vision...");

    const model = gemini.getGenerativeModel({ model: VISION_MODELS.gemini });

    const result = await model.generateContent([
      prompt,
      {
        inlineData: {
          data: base64Image,
          mimeType: "image/jpeg",
        },
      },
    ]);

    const response = await result.response;
    const text = response.text();

    console.log("✅ Image analysis complete (Gemini)");
    return text;
  } catch (error) {
    console.error("❌ Vision AI error:", error.message);
    throw new Error(`Gagal analyze gambar: ${error.message}`);
  }
}

/**
 * Extract text from image (OCR)
 * @param {Buffer} imageBuffer - Image data
 * @returns {Promise<string>} Extracted text
 */
async function extractTextFromImage(imageBuffer) {
  return await analyzeImage(
    imageBuffer,
    "Extract all text from this image. Return only the text content, nothing else."
  );
}

/**
 * Answer question about image
 * @param {Buffer} imageBuffer - Image data
 * @param {string} question - Question about the image
 * @returns {Promise<string>} Answer
 */
async function answerImageQuestion(imageBuffer, question) {
  return await analyzeImage(imageBuffer, question);
}

/**
 * Analyze video (extract frames and analyze)
 * @param {Buffer} videoBuffer - Video data
 * @param {string} prompt - Optional prompt about video
 * @returns {Promise<string>} Analysis result
 */
async function analyzeVideo(videoBuffer, prompt = "Describe what happens in this video") {
  if (!gemini) {
    throw new Error("❌ Gemini API key tidak dikonfigurasi. Set GEMINI_API_KEY di .env");
  }

  try {
    console.log("🎥 Analyzing video with Gemini Vision...");

    const model = gemini.getGenerativeModel({ model: "gemini-1.5-flash" });

    // Convert buffer to base64
    const base64Video = videoBuffer.toString("base64");

    const result = await model.generateContent([
      prompt,
      {
        inlineData: {
          data: base64Video,
          mimeType: "video/mp4",
        },
      },
    ]);

    const response = await result.response;
    const text = response.text();

    console.log("✅ Video analysis complete");
    return text;
  } catch (error) {
    console.error("❌ Video analysis error:", error.message);
    throw new Error(`Gagal analyze video: ${error.message}`);
  }
}

/**
 * Identify objects in image
 * @param {Buffer} imageBuffer - Image data
 * @returns {Promise<string>} List of identified objects
 */
async function identifyObjects(imageBuffer) {
  return await analyzeImage(
    imageBuffer,
    "List all objects, people, and things you can see in this image. Be specific and detailed."
  );
}

/**
 * Describe scene in image
 * @param {Buffer} imageBuffer - Image data
 * @returns {Promise<string>} Scene description
 */
async function describeScene(imageBuffer) {
  return await analyzeImage(
    imageBuffer,
    "Describe the scene, setting, mood, and atmosphere of this image in detail."
  );
}

module.exports = {
  analyzeImage,
  extractTextFromImage,
  answerImageQuestion,
  analyzeVideo,
  identifyObjects,
  describeScene,
};
