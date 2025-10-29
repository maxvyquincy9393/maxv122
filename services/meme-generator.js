// === MEME GENERATOR SERVICE ===
// Generate memes with top and bottom text

const Jimp = require("jimp");
const sharp = require("sharp");
const axios = require("axios");

/**
 * Generate meme from image with top and bottom text
 * @param {Buffer} imageBuffer - Image data
 * @param {string} topText - Text for top of meme
 * @param {string} bottomText - Text for bottom of meme
 * @returns {Promise<Buffer>} Meme image buffer
 */
async function generateMeme(imageBuffer, topText = "", bottomText = "") {
  try {
    // Load image
    const image = await Jimp.read(imageBuffer);
    
    // Resize to standard meme size (keep aspect ratio)
    const maxWidth = 800;
    if (image.bitmap.width > maxWidth) {
      image.resize(maxWidth, Jimp.AUTO);
    }

    // Load font (large white with black outline)
    const font = await Jimp.loadFont(Jimp.FONT_SANS_64_WHITE);

    // Add top text
    if (topText) {
      const topTextUpper = topText.toUpperCase();
      const topX = image.bitmap.width / 2;
      const topY = 20;
      
      image.print(
        font,
        0,
        topY,
        {
          text: topTextUpper,
          alignmentX: Jimp.HORIZONTAL_ALIGN_CENTER,
        },
        image.bitmap.width
      );
    }

    // Add bottom text
    if (bottomText) {
      const bottomTextUpper = bottomText.toUpperCase();
      const bottomY = image.bitmap.height - 80;
      
      image.print(
        font,
        0,
        bottomY,
        {
          text: bottomTextUpper,
          alignmentX: Jimp.HORIZONTAL_ALIGN_CENTER,
        },
        image.bitmap.width
      );
    }

    // Convert to buffer
    const memeBuffer = await image.getBufferAsync(Jimp.MIME_JPEG);
    
    console.log("✅ Meme generated successfully");
    return memeBuffer;
  } catch (error) {
    console.error("❌ Error generating meme:", error.message);
    throw error;
  }
}

/**
 * Generate meme from URL
 * @param {string} imageUrl - URL of image
 * @param {string} topText - Text for top
 * @param {string} bottomText - Text for bottom
 * @returns {Promise<Buffer>} Meme image buffer
 */
async function generateMemeFromUrl(imageUrl, topText, bottomText) {
  try {
    // Download image
    const response = await axios.get(imageUrl, {
      responseType: "arraybuffer",
      timeout: 10000,
    });

    const imageBuffer = Buffer.from(response.data);
    return await generateMeme(imageBuffer, topText, bottomText);
  } catch (error) {
    console.error("❌ Error downloading image for meme:", error.message);
    throw error;
  }
}

/**
 * Generate meme from template
 * @param {string} template - Meme template name
 * @param {string} topText - Text for top
 * @param {string} bottomText - Text for bottom
 * @returns {Promise<Buffer>} Meme image buffer
 */
async function generateMemeFromTemplate(template, topText, bottomText) {
  // Popular meme templates
  const templates = {
    drake: "https://i.imgflip.com/30b1gx.jpg",
    distracted: "https://i.imgflip.com/1ur9b0.jpg",
    brain: "https://i.imgflip.com/2h7982.jpg",
    pikachu: "https://i.imgflip.com/1c1uej.jpg",
    stonks: "https://i.imgflip.com/3qqcim.jpg",
    doge: "https://i.imgflip.com/4t0m5.jpg",
    success: "https://i.imgflip.com/1bhk.jpg",
    disaster: "https://i.imgflip.com/30b1gx.jpg",
  };

  const templateUrl = templates[template.toLowerCase()];
  
  if (!templateUrl) {
    throw new Error(`Template "${template}" not found. Available: ${Object.keys(templates).join(", ")}`);
  }

  return await generateMemeFromUrl(templateUrl, topText, bottomText);
}

module.exports = {
  generateMeme,
  generateMemeFromUrl,
  generateMemeFromTemplate,
};
