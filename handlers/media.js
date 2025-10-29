
const { checkRateLimit, downloadMedia } = require('../utils/helpers')
const { HfInference } = require('@huggingface/inference')
const { createSticker } = require('../services/sticker-maker')
const { generateMeme, generateMemeFromTemplate } = require('../services/meme-generator')
const { analyzeImage, extractTextFromImage, answerImageQuestion, analyzeVideo } = require('../services/vision-ai')
const { textToSpeech, textToSpeechBanana } = require('../services/text-to-speech')

const hf = new HfInference(process.env.HF_TOKEN);
const HF_ASR_MODEL = process.env.HF_ASR_MODEL || 'openai/whisper-base';
const HF_IMAGE_MODEL = process.env.HF_IMAGE_MODEL || 'stabilityai/stable-diffusion-2';

async function handleImage(sock, msg, sender, text) {
    try {
        const prompt = text.replace(/^\/img\s+/, '').trim();
        if (!prompt) return '❌ Format: /img <prompt>\n\nExample: /img "a beautiful sunset"';

        if (!process.env.HF_TOKEN) {
            return '❌ Image generation is not configured. Please set HF_TOKEN in .env';
        }

        const rateLimit = checkRateLimit(sender, 'image');
        if (rateLimit) return rateLimit;

        try {
            const response = await hf.textToImage({
                model: HF_IMAGE_MODEL,
                inputs: prompt,
                parameters: {
                    negative_prompt: 'nsfw, nude, explicit content'
                }
            })

            const buffer = Buffer.from(await response.arrayBuffer())
            await sock.sendMessage(msg.key.remoteJid, { 
                image: buffer, 
                caption: `🎨 ${prompt}\n\n✨ Powered by MaxImage AI` 
            })
            return null
        } catch (apiErr) {
            console.error('HF API error:', apiErr.message);
            return '❌ Generate gambar gagal. Coba lagi dalam 1-2 menit ya!';
        }
    } catch (err) {
        console.error('Error in handleImage:', err.message);
        return '❌ Maaf, ada gangguan saat generate gambar. Coba lagi nanti!';
    }
}

async function handleVoiceNote(sock, msg, sender) {
    try {
        if (!process.env.HF_TOKEN) {
            return '❌ Voice transcription is not configured. Please set HF_TOKEN in .env';
        }

        const buffer = await downloadMedia(msg, 'audioMessage')
        if (!buffer) return '❌ Error downloading audio. Please try again.';

        try {
            const response = await hf.automaticSpeechRecognition({
                model: HF_ASR_MODEL,
                data: buffer
            })

            return `🎙️ Transcription:\n${response.text}`;
        } catch (apiErr) {
            console.error('HF ASR error:', apiErr.message);
            return '❌ Transcribe audio gagal. Coba lagi atau kirim audio yang lebih pendek!';
        }
    } catch (err) {
        console.error('Error in handleVoiceNote:', err.message);
        return '❌ Maaf, ada gangguan saat proses voice note. Coba lagi!';
    }
}

async function handleSticker(sock, msg, sender) {
    try {
        // Check if message has image
        if (!msg.message?.imageMessage) {
            return '❌ Kirim gambar dengan caption /sticker untuk membuat sticker!\n\nContoh: Kirim gambar + caption "/sticker"';
        }

        const imageBuffer = await downloadMedia(msg, 'imageMessage');
        if (!imageBuffer) {
            return '❌ Error downloading image. Please try again.';
        }

        // Create sticker
        const stickerBuffer = await createSticker(imageBuffer);
        
        // Send as sticker
        await sock.sendMessage(msg.key.remoteJid, {
            sticker: stickerBuffer
        });
        
        return null; // Already sent
    } catch (err) {
        console.error('Error in handleSticker:', err.message);
        return '❌ Error membuat sticker. Coba lagi!';
    }
}

async function handleMeme(sock, msg, sender, text) {
    try {
        // Parse command: /meme "top text" "bottom text"
        const match = text.match(/^\/meme\s+"([^"]+)"\s+"([^"]+)"/);
        
        if (!match) {
            return `⚡ *Meme Generator*

Format: /meme "text atas" "text bawah"

Contoh: /meme "When you code" "And it works first try"

Kirim gambar dengan caption untuk membuat meme dari gambar!`;
        }

        const [_, topText, bottomText] = match;

        // Check if message has image
        if (!msg.message?.imageMessage) {
            return '❌ Kirim gambar dengan caption /meme "text atas" "text bawah"';
        }

        const imageBuffer = await downloadMedia(msg, 'imageMessage');
        if (!imageBuffer) {
            return '❌ Error downloading image. Please try again.';
        }

        // Generate meme
        const memeBuffer = await generateMeme(imageBuffer, topText, bottomText);
        
        // Send meme
        await sock.sendMessage(msg.key.remoteJid, {
            image: memeBuffer,
            caption: `🎭 Meme by Maxvy\n\nTop: ${topText}\nBottom: ${bottomText}`
        });
        
        return null; // Already sent
    } catch (err) {
        console.error('Error in handleMeme:', err.message);
        return '❌ Error membuat meme. Coba lagi!';
    }
}

async function handleVisionAnalysis(sock, msg, sender, text) {
    try {
        // Check if message has image or video
        const hasImage = msg.message?.imageMessage;
        const hasVideo = msg.message?.videoMessage;

        if (!hasImage && !hasVideo) {
            return `👁️ *Max Vision AI*

Kirim gambar atau video dengan caption untuk analyze!

📸 *Contoh untuk Gambar:*
• Kirim foto + "apa ini?"
• Kirim foto + "baca text di gambar"
• Kirim foto + "jelaskan gambar ini"

🎥 *Contoh untuk Video:*
• Kirim video + "apa yang terjadi di video ini?"

Siap membantu!`;
        }

        if (hasImage) {
            const imageBuffer = await downloadMedia(msg, 'imageMessage');
            if (!imageBuffer) {
                return '❌ Error downloading image. Please try again.';
            }

            // Determine what to do based on text
            let result;
            const lowerText = text.toLowerCase();

            if (lowerText.includes('baca') || lowerText.includes('text') || lowerText.includes('ocr')) {
                // OCR - Extract text
                result = await extractTextFromImage(imageBuffer);
                return `📝 *Text dari gambar:*\n\n${result}`;
            } else if (text && text.trim().length > 0) {
                // Answer specific question
                result = await answerImageQuestion(imageBuffer, text);
                return `👁️ *Max Vision:*\n\n${result}`;
            } else {
                // General analysis
                result = await analyzeImage(imageBuffer);
                return `👁️ *Analisis Gambar:*\n\n${result}`;
            }
        }

        if (hasVideo) {
            const videoBuffer = await downloadMedia(msg, 'videoMessage');
            if (!videoBuffer) {
                return '❌ Error downloading video. Please try again.';
            }

            const question = text || "Describe what happens in this video";
            const result = await analyzeVideo(videoBuffer, question);
            return `🎥 *Analisis Video:*\n\n${result}`;
        }

    } catch (err) {
        console.error('Error in handleVisionAnalysis:', err.message);
        return `❌ Error analyzing media: ${err.message}`;
    }
}

async function handleTextToSpeech(sock, msg, sender, text) {
    try {
        // Parse command: /tts "text to speak"
        const match = text.match(/^\/tts\s+"([^"]+)"/);
        
        if (!match) {
            return `🎤 *Text-to-Speech*

Format: /tts "text yang mau diucapkan"

Contoh: 
/tts "Hello, how are you?"
/tts "Halo, apa kabar?"

Siap mengubah text jadi suara!`;
        }

        const textToSpeak = match[1];

        // Check text length
        if (textToSpeak.length > 500) {
            return '❌ Text terlalu panjang! Maksimal 500 karakter.\n\nCoba text yang lebih pendek ya!';
        }

        // Generate speech
        await sock.sendMessage(msg.key.remoteJid, {
            text: `🎤 Sedang membuat audio...\n\n📝 "${textToSpeak}"\n\n⏳ Mohon tunggu...`
        });

        const audioBuffer = await textToSpeech(textToSpeak);
        
        // Send as voice note
        await sock.sendMessage(msg.key.remoteJid, {
            audio: audioBuffer,
            mimetype: 'audio/mp4',
            ptt: true,  // Send as voice note
        });

        return null; // Already sent
    } catch (err) {
        console.error('Error in handleTextToSpeech:', err.message);
        return '❌ Maaf, text-to-speech gagal. Coba lagi ya!';
    }
}

module.exports = {
    handleImage,
    handleVoiceNote,
    handleSticker,
    handleMeme,
    handleVisionAnalysis,
    handleTextToSpeech
}
