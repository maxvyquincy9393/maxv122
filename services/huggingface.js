
const { HfInference } = require('@huggingface/inference')
const axios = require('axios')
const fs = require('fs')

const hf = new HfInference(process.env.HF_TOKEN)

async function generateImage(prompt) {
    try {
        const res = await axios.post(
            'https://api-inference.huggingface.co/models/stabilityai/stable-diffusion-2',
            { inputs: prompt },
            { headers: { Authorization: `Bearer ${process.env.HF_TOKEN}`, 'Content-Type': 'application/json' }, responseType: 'arraybuffer' }
        )
        const filename = `./img_${Date.now()}.png`
        fs.writeFileSync(filename, res.data)
        return filename
    } catch (e) {
        console.error('Error HF:', e.message)
        return null
    }
}

module.exports = { hf, generateImage }
