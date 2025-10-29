// === FILE PROCESSOR SERVICE ===
// Process PDFs, images, and perform OCR with enhanced capabilities

const pdfParse = require("pdf-parse");
const Tesseract = require("tesseract.js");
const sharp = require("sharp");
const axios = require("axios");
const fs = require("fs").promises;
const path = require("path");
const { generateAI } = require("./multi-ai");

/**
 * Process PDF file
 * @param {Buffer} pdfBuffer - PDF file buffer
 * @param {Object} options - Processing options
 * @returns {Promise<Object>} Extracted data
 */
async function processPDF(pdfBuffer, options = {}) {
  try {
    console.log("📄 Processing PDF...");

    // Validate PDF buffer
    if (!pdfBuffer || pdfBuffer.length === 0) {
      throw new Error("Invalid or empty PDF buffer");
    }

    // Check file size
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (pdfBuffer.length > maxSize) {
      throw new Error(
        `PDF too large (${Math.round(pdfBuffer.length / 1024 / 1024)}MB). Max: 10MB`,
      );
    }

    const data = await pdfParse(pdfBuffer, {
      max: options.maxPages || 0, // 0 = all pages
      version: "v1.10.100",
    });

    const result = {
      pages: data.numpages,
      text: data.text || "",
      info: data.info || {},
      metadata: data.metadata || {},
      version: data.version || "unknown",
      wordCount: data.text ? data.text.split(/\s+/).length : 0,
      summary: data.text ? await generatePDFSummary(data.text) : "",
    };

    console.log(
      `✅ PDF processed: ${result.pages} pages, ${result.wordCount} words`,
    );
    return result;
  } catch (error) {
    console.error("❌ Error processing PDF:", error.message);

    // Provide helpful error messages
    if (error.message.includes("encrypted")) {
      throw new Error(
        "PDF is encrypted/password protected. Please unlock it first.",
      );
    } else if (error.message.includes("Invalid")) {
      throw new Error(
        "Invalid PDF file. Please check if the file is corrupted.",
      );
    } else {
      throw new Error(`PDF processing failed: ${error.message}`);
    }
  }
}

/**
 * Extract text from specific PDF pages
 * @param {Buffer} pdfBuffer - PDF buffer
 * @param {Array<number>} pageNumbers - Pages to extract (1-indexed)
 * @returns {Promise<Object>} Extracted pages
 */
async function extractPDFPages(pdfBuffer, pageNumbers) {
  try {
    const data = await pdfParse(pdfBuffer);
    const allText = data.text;

    // Simple page splitting (not perfect but works for most PDFs)
    const pages = allText.split("\f"); // Form feed character

    const extracted = {};
    for (const pageNum of pageNumbers) {
      if (pageNum > 0 && pageNum <= pages.length) {
        extracted[pageNum] = pages[pageNum - 1];
      }
    }

    return {
      totalPages: pages.length,
      extractedPages: extracted,
    };
  } catch (error) {
    console.error("❌ Error extracting PDF pages:", error.message);
    throw error;
  }
}

/**
 * Search text in PDF with enhanced context
 * @param {Buffer} pdfBuffer - PDF buffer
 * @param {string} searchTerm - Term to search
 * @returns {Promise<Object>} Search results
 */
async function searchInPDF(pdfBuffer, searchTerm) {
  try {
    if (!searchTerm || searchTerm.trim().length === 0) {
      throw new Error("Search term cannot be empty");
    }

    const data = await pdfParse(pdfBuffer);
    const text = data.text.toLowerCase();
    const search = searchTerm.toLowerCase().trim();

    const matches = [];
    const lines = text.split("\n");

    // Search line by line for better context
    lines.forEach((line, lineIndex) => {
      if (line.includes(search)) {
        // Get surrounding lines for context
        const contextStart = Math.max(0, lineIndex - 2);
        const contextEnd = Math.min(lines.length, lineIndex + 3);
        const contextLines = lines.slice(contextStart, contextEnd);

        matches.push({
          lineNumber: lineIndex + 1,
          line: lines[lineIndex].trim(),
          context: contextLines.join("\n").trim(),
          page: Math.ceil((lineIndex + 1) / 30), // Estimate page number
        });
      }
    });

    return {
      found: matches.length > 0,
      searchTerm: searchTerm,
      totalMatches: matches.length,
      matches: matches.slice(0, 15), // Return max 15 matches
      totalPages: data.numpages,
      suggestion:
        matches.length === 0
          ? `Try searching for related terms or check spelling`
          : null,
    };
  } catch (error) {
    console.error("❌ Error searching in PDF:", error.message);
    throw new Error(`Search failed: ${error.message}`);
  }
}

/**
 * Perform OCR on image
 * @param {Buffer} imageBuffer - Image buffer
 * @param {Object} options - OCR options
 * @returns {Promise<Object>} OCR result
 */
async function performOCR(imageBuffer, options = {}) {
  try {
    const { lang = "eng+ind", confidence = 60 } = options;

    console.log("🔍 Performing OCR...");

    // Optimize image for OCR
    const optimizedBuffer = await optimizeImageForOCR(imageBuffer);

    const result = await Tesseract.recognize(optimizedBuffer, lang, {
      logger: (m) => {
        if (m.status === "recognizing text") {
          console.log(`OCR Progress: ${Math.round(m.progress * 100)}%`);
        }
      },
      tessedit_pageseg_mode: 1, // Automatic page segmentation with OSD
      preserve_interword_spaces: "1",
    });

    // Filter by confidence
    const words = result.data.words.filter(
      (word) => word.confidence >= confidence,
    );

    const text = result.data.text;
    const avgConfidence =
      words.reduce((sum, word) => sum + word.confidence, 0) / words.length || 0;

    console.log(
      `✅ OCR completed: ${words.length} words, ${avgConfidence.toFixed(1)}% confidence`,
    );

    // Clean and format text
    const cleanedText = cleanOCRText(text);

    return {
      text: cleanedText,
      originalText: text,
      confidence: avgConfidence,
      words: words.length,
      lines: result.data.lines.length,
      language: result.data.language,
      rawData: result.data,
    };
  } catch (error) {
    console.error("❌ Error performing OCR:", error.message);
    throw error;
  }
}

/**
 * Analyze image content
 * @param {Buffer} imageBuffer - Image buffer
 * @returns {Promise<Object>} Image analysis
 */
async function analyzeImage(imageBuffer) {
  try {
    console.log("🖼️ Analyzing image...");

    const metadata = await sharp(imageBuffer).metadata();

    // Get image stats
    const stats = await sharp(imageBuffer).stats();

    // Dominant colors
    const dominantColors = stats.channels.map((channel, i) => ({
      channel: ["red", "green", "blue"][i],
      mean: Math.round(channel.mean),
      min: channel.min,
      max: channel.max,
    }));

    const analysis = {
      format: metadata.format,
      width: metadata.width,
      height: metadata.height,
      space: metadata.space,
      channels: metadata.channels,
      hasAlpha: metadata.hasAlpha,
      orientation: metadata.orientation,
      size: imageBuffer.length,
      dominantColors: dominantColors,
    };

    console.log(
      `✅ Image analyzed: ${analysis.width}x${analysis.height} ${analysis.format}`,
    );

    return analysis;
  } catch (error) {
    console.error("❌ Error analyzing image:", error.message);
    throw error;
  }
}

/**
 * Extract text from image (with preprocessing)
 * @param {Buffer} imageBuffer - Image buffer
 * @param {Object} options - Options
 * @returns {Promise<string>} Extracted text
 */
async function extractTextFromImage(imageBuffer, options = {}) {
  try {
    // Preprocess image for better OCR
    const preprocessed = await sharp(imageBuffer)
      .greyscale()
      .normalize()
      .sharpen()
      .toBuffer();

    const result = await performOCR(preprocessed, options);
    return result.text;
  } catch (error) {
    console.error("❌ Error extracting text from image:", error.message);
    throw error;
  }
}

/**
 * Process sticker (extract text if any)
 * @param {Buffer} stickerBuffer - Sticker buffer
 * @returns {Promise<Object>} Processed sticker data
 */
async function processSticker(stickerBuffer) {
  try {
    console.log("🎨 Processing sticker...");

    // Analyze image
    const analysis = await analyzeImage(stickerBuffer);

    // Try OCR if image seems to have text
    let text = null;
    let hasText = false;

    try {
      const ocrResult = await performOCR(stickerBuffer, { confidence: 70 });
      if (ocrResult.text.trim().length > 0) {
        text = ocrResult.text;
        hasText = true;
      }
    } catch (ocrError) {
      console.log("No text detected in sticker");
    }

    return {
      format: analysis.format,
      dimensions: {
        width: analysis.width,
        height: analysis.height,
      },
      hasText: hasText,
      text: text,
      size: analysis.size,
    };
  } catch (error) {
    console.error("❌ Error processing sticker:", error.message);
    throw error;
  }
}

/**
 * Download and process file from URL
 * @param {string} url - File URL
 * @param {string} type - File type (pdf, image)
 * @returns {Promise<Object>} Processed data
 */
async function processFileFromURL(url, type) {
  try {
    console.log(`📥 Downloading ${type} from URL...`);

    const response = await axios.get(url, {
      responseType: "arraybuffer",
      timeout: 60000,
      maxContentLength: 50 * 1024 * 1024, // 50MB max
    });

    const buffer = Buffer.from(response.data);

    if (type === "pdf") {
      return await processPDF(buffer);
    } else if (type === "image") {
      const analysis = await analyzeImage(buffer);
      const text = await extractTextFromImage(buffer);
      return {
        ...analysis,
        extractedText: text,
      };
    } else {
      throw new Error(`Unsupported file type: ${type}`);
    }
  } catch (error) {
    console.error("❌ Error processing file from URL:", error.message);
    throw error;
  }
}

/**
 * Convert image format
 * @param {Buffer} imageBuffer - Input image
 * @param {string} format - Target format (jpeg, png, webp)
 * @param {Object} options - Conversion options
 * @returns {Promise<Buffer>} Converted image
 */
async function convertImageFormat(imageBuffer, format, options = {}) {
  try {
    const { quality = 90 } = options;

    let converter = sharp(imageBuffer);

    switch (format.toLowerCase()) {
      case "jpeg":
      case "jpg":
        converter = converter.jpeg({ quality });
        break;
      case "png":
        converter = converter.png({ quality });
        break;
      case "webp":
        converter = converter.webp({ quality });
        break;
      default:
        throw new Error(`Unsupported format: ${format}`);
    }

    return await converter.toBuffer();
  } catch (error) {
    console.error("❌ Error converting image:", error.message);
    throw error;
  }
}

/**
 * Optimize image size
 * @param {Buffer} imageBuffer - Image buffer
 * @param {Object} options - Optimization options
 * @returns {Promise<Buffer>} Optimized image
 */
async function optimizeImage(imageBuffer, options = {}) {
  try {
    const { maxWidth = 1920, maxHeight = 1920, quality = 80 } = options;

    const image = sharp(imageBuffer);
    const metadata = await image.metadata();

    // Resize if needed
    if (metadata.width > maxWidth || metadata.height > maxHeight) {
      image.resize(maxWidth, maxHeight, {
        fit: "inside",
        withoutEnlargement: true,
      });
    }

    // Compress
    const optimized = await image.jpeg({ quality, mozjpeg: true }).toBuffer();

    const reduction = (
      (1 - optimized.length / imageBuffer.length) *
      100
    ).toFixed(1);
    console.log(
      `✅ Image optimized: ${imageBuffer.length} → ${optimized.length} bytes (${reduction}% reduction)`,
    );

    return optimized;
  } catch (error) {
    console.error("❌ Error optimizing image:", error.message);
    throw error;
  }
}

/**
 * Detect if image contains faces (basic detection)
 * @param {Buffer} imageBuffer - Image buffer
 * @returns {Promise<boolean>} Has faces
 */
async function detectFaces(imageBuffer) {
  try {
    // This is a placeholder - real face detection would use
    // a proper ML model or service like Google Vision API
    const stats = await sharp(imageBuffer).stats();

    // Simple heuristic: images with faces usually have
    // skin-tone colors in certain ranges
    const avgRed = stats.channels[0].mean;
    const avgGreen = stats.channels[1].mean;
    const avgBlue = stats.channels[2].mean;

    // Very basic skin tone detection
    const hasSkinTone =
      avgRed > 150 &&
      avgRed < 220 &&
      avgGreen > 100 &&
      avgGreen < 180 &&
      avgBlue > 80 &&
      avgBlue < 150;

    return hasSkinTone;
  } catch (error) {
    console.error("❌ Error detecting faces:", error.message);
    return false;
  }
}

/**
 * Generate AI summary of PDF content
 * @param {string} text - PDF text content
 * @returns {Promise<string>} Summary
 */
async function generatePDFSummary(text) {
  try {
    if (!text || text.trim().length < 100) {
      return "Document too short to summarize";
    }

    // Take first 5000 characters for summary
    const excerpt = text.substring(0, 5000);

    const prompt = `Summarize this document in 2-3 sentences:\n\n${excerpt}`;

    // Use generateAI if available, otherwise return basic summary
    try {
      const { generateAI } = require("./multi-ai");
      return await generateAI(prompt, {
        useMaxvyPersona: false,
        temperature: 0.5,
      });
    } catch (error) {
      // Fallback to basic summary
      const words = text.split(/\s+/);
      const sentences = text.match(/[^.!?]+[.!?]+/g) || [];
      return `Document contains ${words.length} words and ${sentences.length} sentences.`;
    }
  } catch (error) {
    console.error("Error generating PDF summary:", error);
    return "Unable to generate summary";
  }
}

/**
 * Optimize image for better OCR results
 * @param {Buffer} imageBuffer - Original image
 * @returns {Promise<Buffer>} Optimized image
 */
async function optimizeImageForOCR(imageBuffer) {
  try {
    const optimized = await sharp(imageBuffer)
      .grayscale() // Convert to grayscale
      .normalize() // Improve contrast
      .sharpen() // Sharpen text
      .resize(2400, null, {
        withoutEnlargement: false,
        kernel: sharp.kernel.lanczos3,
      }) // Upscale for better OCR
      .toBuffer();

    console.log("✅ Image optimized for OCR");
    return optimized;
  } catch (error) {
    console.warn("⚠️ Could not optimize image for OCR, using original");
    return imageBuffer;
  }
}

/**
 * Clean and format OCR text
 * @param {string} text - Raw OCR text
 * @returns {string} Cleaned text
 */
function cleanOCRText(text) {
  if (!text) return "";

  // Remove excessive whitespace
  let cleaned = text.replace(/\s+/g, " ");

  // Fix common OCR errors
  cleaned = cleaned
    .replace(/\bl\b/g, "I") // Common l vs I confusion
    .replace(/0(?=[a-zA-Z])/g, "O") // 0 vs O confusion
    .replace(/(?<=[a-zA-Z])0/g, "O")
    .replace(/\s+([.,!?;:])/g, "$1") // Fix punctuation spacing
    .replace(/([.,!?;:])\s*/g, "$1 ") // Add space after punctuation
    .replace(/\s+/g, " ") // Clean up multiple spaces
    .trim();

  // Remove broken unicode characters
  cleaned = cleaned.replace(/[^\x00-\x7F\u0080-\uFFFF]/g, "");

  // Fix line breaks
  cleaned = cleaned.replace(/\n\s*\n/g, "\n\n");

  return cleaned;
}

module.exports = {
  processPDF,
  extractPDFPages,
  searchInPDF,
  performOCR,
  analyzeImage,
  extractTextFromImage,
  processSticker,
  processFileFromURL,
  convertImageFormat,
  optimizeImage,
  detectFaces,
};
