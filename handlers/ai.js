
const { generate } = require('../services/gemini');
const { extractWebText } = require('../utils/helpers');

async function handleAI(sock, msg, sender, text) {
    try {
        const prompt = text.replace(/^\/ai\s+/, '').trim();
        if (!prompt) return '❌ Format: /ai <prompt>\n\nExample: /ai Apa itu machine learning?';

        return await generate(prompt);
    } catch (err) {
        console.error('Error in handleAI:', err.message);
        return '❌ Error processing AI request. Please try again.';
    }
}

async function handleTranslate(sock, msg, sender, text) {
    try {
        const match = text.match(/^\/translate\s+([a-zA-Z-]+)\s+"([^"]+)"/);
        if (!match) return '❌ Format: /translate <lang> "text"\n\nExample: /translate english "Halo dunia"';

        const [_, lang, content] = match;
        const prompt = `Translate this text to ${lang}:\n${content}`;

        return await generate(prompt);
    } catch (err) {
        console.error('Error in handleTranslate:', err.message);
        return '❌ Error translating text. Please try again.';
    }
}

async function handleSummarize(sock, msg, sender, text) {
    try {
        const input = text.replace(/^\/summarize\s+/, '').trim();
        if (!input) return '❌ Format: /summarize <text|url>\n\nExample: /summarize "Long text here..."';

        let content = input;
        if (input.startsWith('http')) {
            content = await extractWebText(input);
            if (!content) return '❌ Error fetching URL. Please check the URL and try again.';
        }

        const prompt = `Summarize this text concisely:\n${content}`;

        return await generate(prompt);
    } catch (err) {
        console.error('Error in handleSummarize:', err.message);
        return '❌ Error summarizing text. Please try again.';
    }
}

async function handleRewrite(sock, msg, sender, text) {
    try {
        const match = text.match(/^\/rewrite(?:\s+(formal|casual|brief|long))?\s+"([^"]+)"/);
        if (!match) return '❌ Format: /rewrite [formal|casual|brief|long] "text"\n\nExample: /rewrite casual "This is a formal text"';

        const [_, style = 'casual', content] = match;
        const prompt = `Rewrite this text in a ${style} style:\n${content}`;

        return await generate(prompt);
    } catch (err) {
        console.error('Error in handleRewrite:', err.message);
        return '❌ Error rewriting text. Please try again.';
    }
}

async function handleCaption(sock, msg, sender, text) {
    try {
        const topic = text.replace(/^\/caption\s+/, '').trim();
        if (!topic) return '❌ Format: /caption <topic>\n\nExample: /caption "sunset at beach"';

        const prompt = `Generate a creative and engaging social media caption about: ${topic}`;

        return await generate(prompt);
    } catch (err) {
        console.error('Error in handleCaption:', err.message);
        return '❌ Error generating caption. Please try again.';
    }
}

async function handleIdea(sock, msg, sender, text) {
    try {
        const topic = text.replace(/^\/idea\s+/, '').trim();
        if (!topic) return '❌ Format: /idea <topic>\n\nExample: /idea "content marketing"';

        const prompt = `Generate 3-5 creative content ideas about: ${topic}`;

        return await generate(prompt);
    } catch (err) {
        console.error('Error in handleIdea:', err.message);
        return '❌ Error generating ideas. Please try again.';
    }
}

async function handleCode(sock, msg, sender, text) {
    try {
        const match = text.match(/^\/code\s+"([^"]+)"/);
        if (!match) return '❌ Format: /code "task in <language>"\n\nExample: /code "fibonacci function in javascript"';

        const prompt = `Generate code for this task:\n${match[1]}\nProvide a brief explanation.`;

        return await generate(prompt);
    } catch (err) {
        console.error('Error in handleCode:', err.message);
        return '❌ Error generating code. Please try again.';
    }
}

module.exports = {
    handleAI,
    handleTranslate,
    handleSummarize,
    handleRewrite,
    handleCaption,
    handleIdea,
    handleCode
};
