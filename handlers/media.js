
const { checkRateLimit, downloadMedia } = require('../utils/helpers')
const { HfInference } = require('@huggingface/inference')

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
            await sock.sendMessage(msg.key.remoteJid, { image: buffer, caption: prompt })
            return null
        } catch (apiErr) {
            console.error('HF API error:', apiErr.message);
            return '❌ Image generation failed. Please try again later or check your HF_TOKEN.';
        }
    } catch (err) {
        console.error('Error in handleImage:', err.message);
        return '❌ Error generating image. Please try again.';
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
            return '❌ Transcription failed. Please try again or send a shorter audio.';
        }
    } catch (err) {
        console.error('Error in handleVoiceNote:', err.message);
        return '❌ Error processing voice note. Please try again.';
    }
}

module.exports = {
    handleImage,
    handleVoiceNote
}
