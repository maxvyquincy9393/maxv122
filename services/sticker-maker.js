// === STICKER MAKER SERVICE ===
// Create stickers from images, text, or AI-generated content

const Jimp = require("jimp");
const sharp = require("sharp");
const axios = require("axios");
const fs = require("fs").promises;
const path = require("path");

// Sticker dimensions (WhatsApp standard)
const STICKER_SIZE = 512;
const STICKER_MAX_SIZE = 512;
const STICKER_MIN_SIZE = 512;

/**
 * Create sticker from image buffer
 * @param {Buffer} imageBuffer - Image data
 * @param {Object} options - Sticker options
 * @returns {Promise<Buffer>} Sticker buffer
 */
async function createStickerFromImage(imageBuffer, options = {}) {
  try {
    const {
      removeBg = false,
      crop = true,
      quality = 100,
      format = "webp",
    } = options;

    let image = sharp(imageBuffer);

    // Get image metadata
    const metadata = await image.metadata();
    console.log(`📐 Original image: ${metadata.width}x${metadata.height}`);

    // Crop to square if needed
    if (crop) {
      const size = Math.min(metadata.width, metadata.height);
      const left = Math.floor((metadata.width - size) / 2);
      const top = Math.floor((metadata.height - size) / 2);

      image = image.extract({
        left,
        top,
        width: size,
        height: size,
      });
    }

    // Resize to sticker size
    image = image.resize(STICKER_SIZE, STICKER_SIZE, {
      fit: "cover",
      position: "center",
    });

    // Remove background if requested
    if (removeBg) {
      // Note: This is a simple transparency, for advanced bg removal use external API
      image = image.ensureAlpha();
    }

    // Convert to WebP format
    const stickerBuffer = await image.webp({ quality }).toBuffer();

    console.log("✅ Sticker created successfully");
    return stickerBuffer;
  } catch (error) {
    console.error("❌ Error creating sticker from image:", error.message);
    throw error;
  }
}

/**
 * Create sticker from text
 * @param {string} text - Text to display
 * @param {Object} options - Text sticker options
 * @returns {Promise<Buffer>} Sticker buffer
 */
async function createStickerFromText(text, options = {}) {
  try {
    const {
      bgColor = "#FF6B35",
      textColor = "#FFFFFF",
      fontSize = 80,
      fontFamily = Jimp.FONT_SANS_64_WHITE,
      style = "default",
    } = options;

    // Create new image
    const image = new Jimp.Jimp(STICKER_SIZE, STICKER_SIZE, bgColor);

    // Load font
    let font;
    if (style === "dark") {
      font = await Jimp.loadFont(Jimp.FONT_SANS_64_WHITE);
    } else {
      font = await Jimp.loadFont(fontFamily);
    }

    // Calculate text dimensions for centering
    const textWidth = Jimp.measureText(font, text);
    const textHeight = Jimp.measureTextHeight(font, text, STICKER_SIZE);

    // Center text
    const x = (STICKER_SIZE - textWidth) / 2;
    const y = (STICKER_SIZE - textHeight) / 2;

    // Add text
    image.print(font, x, y, {
      text: text,
      alignmentX: Jimp.HORIZONTAL_ALIGN_CENTER,
      alignmentY: Jimp.VERTICAL_ALIGN_MIDDLE,
    });

    // Convert to buffer
    const buffer = await image.getBufferAsync(Jimp.MIME_PNG);

    // Convert to WebP
    const stickerBuffer = await sharp(buffer).webp({ quality: 100 }).toBuffer();

    console.log("✅ Text sticker created successfully");
    return stickerBuffer;
  } catch (error) {
    console.error("❌ Error creating text sticker:", error.message);
    throw error;
  }
}

/**
 * Create sticker with image and text overlay
 * @param {Buffer} imageBuffer - Background image
 * @param {string} text - Text to overlay
 * @param {Object} options - Options
 * @returns {Promise<Buffer>} Sticker buffer
 */
async function createStickerWithText(imageBuffer, text, options = {}) {
  try {
    const {
      textPosition = "bottom",
      textColor = "#FFFFFF",
      bgColor = "rgba(0, 0, 0, 0.6)",
      fontSize = 48,
      padding = 20,
    } = options;

    // First create base sticker from image
    const baseSticker = await createStickerFromImage(imageBuffer, {
      crop: true,
      quality: 100,
    });

    // Load image with Jimp for text overlay
    const image = await Jimp.read(baseSticker);

    // Load font
    const font = await Jimp.loadFont(Jimp.FONT_SANS_32_WHITE);

    // Calculate text position
    let x, y;
    const textWidth = Jimp.measureText(font, text);
    const textHeight = Jimp.measureTextHeight(font, text, STICKER_SIZE);

    switch (textPosition) {
      case "top":
        x = (STICKER_SIZE - textWidth) / 2;
        y = padding;
        break;
      case "bottom":
        x = (STICKER_SIZE - textWidth) / 2;
        y = STICKER_SIZE - textHeight - padding;
        break;
      case "center":
        x = (STICKER_SIZE - textWidth) / 2;
        y = (STICKER_SIZE - textHeight) / 2;
        break;
      default:
        x = (STICKER_SIZE - textWidth) / 2;
        y = STICKER_SIZE - textHeight - padding;
    }

    // Create background rectangle for text
    if (bgColor) {
      const rectHeight = textHeight + padding * 2;
      const rectY = textPosition === "top" ? 0 : STICKER_SIZE - rectHeight;

      // Create semi-transparent background
      const bgImage = new Jimp.Jimp(STICKER_SIZE, rectHeight, 0x000000aa);
      image.composite(bgImage, 0, rectY);
    }

    // Add text
    image.print(font, x, y, {
      text: text,
      alignmentX: Jimp.HORIZONTAL_ALIGN_CENTER,
    });

    // Convert to buffer
    const buffer = await image.getBufferAsync(Jimp.MIME_PNG);

    // Convert to WebP
    const stickerBuffer = await sharp(buffer).webp({ quality: 100 }).toBuffer();

    console.log("✅ Sticker with text created successfully");
    return stickerBuffer;
  } catch (error) {
    console.error("❌ Error creating sticker with text:", error.message);
    throw error;
  }
}

/**
 * Create sticker from URL
 * @param {string} url - Image URL
 * @param {Object} options - Options
 * @returns {Promise<Buffer>} Sticker buffer
 */
async function createStickerFromUrl(url, options = {}) {
  try {
    console.log("📥 Downloading image from URL...");
    const response = await axios.get(url, {
      responseType: "arraybuffer",
      timeout: 30000,
    });

    const imageBuffer = Buffer.from(response.data);
    return await createStickerFromImage(imageBuffer, options);
  } catch (error) {
    console.error("❌ Error creating sticker from URL:", error.message);
    throw error;
  }
}

/**
 * Add metadata to sticker
 * @param {Buffer} stickerBuffer - Sticker buffer
 * @param {Object} metadata - Metadata options
 * @returns {Promise<Buffer>} Sticker with metadata
 */
async function addStickerMetadata(stickerBuffer, metadata = {}) {
  try {
    const {
      packname = "JARVIS",
      author = "maxvy.ai",
      categories = ["😀", "🎉"],
    } = metadata;

    // For now, return as-is
    // Full metadata implementation would require exif manipulation
    // which can be added with sharp-exif or similar
    return stickerBuffer;
  } catch (error) {
    console.error("❌ Error adding metadata:", error.message);
    return stickerBuffer;
  }
}

/**
 * Validate sticker size
 * @param {Buffer} buffer - Image buffer
 * @returns {Promise<boolean>} Is valid
 */
async function validateStickerSize(buffer) {
  try {
    const metadata = await sharp(buffer).metadata();
    const size = buffer.length;

    // WhatsApp sticker limits
    const MAX_FILE_SIZE = 100 * 1024; // 100KB

    if (size > MAX_FILE_SIZE) {
      console.warn(
        `⚠️ Sticker size too large: ${size} bytes (max: ${MAX_FILE_SIZE})`,
      );
      return false;
    }

    if (metadata.width !== STICKER_SIZE || metadata.height !== STICKER_SIZE) {
      console.warn(
        `⚠️ Invalid sticker dimensions: ${metadata.width}x${metadata.height}`,
      );
      return false;
    }

    return true;
  } catch (error) {
    console.error("❌ Error validating sticker:", error.message);
    return false;
  }
}

/**
 * Optimize sticker size
 * @param {Buffer} buffer - Sticker buffer
 * @returns {Promise<Buffer>} Optimized buffer
 */
async function optimizeStickerSize(buffer) {
  try {
    let quality = 100;
    let optimized = buffer;

    // Reduce quality until size is acceptable
    while (optimized.length > 100 * 1024 && quality > 10) {
      quality -= 10;
      optimized = await sharp(buffer).webp({ quality }).toBuffer();
    }

    console.log(
      `✅ Optimized sticker: ${optimized.length} bytes (quality: ${quality}%)`,
    );
    return optimized;
  } catch (error) {
    console.error("❌ Error optimizing sticker:", error.message);
    return buffer;
  }
}

/**
 * Create animated sticker (placeholder for future)
 * @param {Array<Buffer>} frames - Array of image buffers
 * @param {Object} options - Animation options
 * @returns {Promise<Buffer>} Animated sticker
 */
async function createAnimatedSticker(frames, options = {}) {
  // Placeholder for animated sticker support
  // Would require WebP animation support
  throw new Error("Animated stickers not yet implemented");
}

/**
 * Main sticker creation function
 * @param {Object} params - Parameters
 * @returns {Promise<Buffer>} Sticker buffer
 */
async function createSticker(params) {
  try {
    const { type, data, options = {} } = params;

    let stickerBuffer;

    switch (type) {
      case "image":
        stickerBuffer = await createStickerFromImage(data, options);
        break;

      case "text":
        stickerBuffer = await createStickerFromText(data, options);
        break;

      case "image-text":
        stickerBuffer = await createStickerWithText(
          data.image,
          data.text,
          options,
        );
        break;

      case "url":
        stickerBuffer = await createStickerFromUrl(data, options);
        break;

      default:
        throw new Error(`Unknown sticker type: ${type}`);
    }

    // Optimize size
    stickerBuffer = await optimizeStickerSize(stickerBuffer);

    // Validate
    const isValid = await validateStickerSize(stickerBuffer);
    if (!isValid) {
      console.warn("⚠️ Sticker may not meet WhatsApp requirements");
    }

    // Add metadata
    stickerBuffer = await addStickerMetadata(stickerBuffer, options.metadata);

    return stickerBuffer;
  } catch (error) {
    console.error("❌ Error creating sticker:", error.message);
    throw error;
  }
}

module.exports = {
  createSticker,
  createStickerFromImage,
  createStickerFromText,
  createStickerWithText,
  createStickerFromUrl,
  validateStickerSize,
  optimizeStickerSize,
  STICKER_SIZE,
};
