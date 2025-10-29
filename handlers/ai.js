const { generate } = require("../services/gemini");
const { routeAIRequest } = require("../services/smart-router");
const { extractWebText } = require("../utils/helpers");
const { addToHistory, buildContextPrompt } = require("../services/conversation-memory");

async function handleAI(sock, msg, sender, text, replyMessage = null) {
  try {
    const prompt = text.replace(/^\/ai\s+/, "").trim();
    if (!prompt)
      return "⚡ *Max siap membantu*\n\nSaya butuh pertanyaan untuk diproses.\n\nFormat: /ai <pertanyaan Anda>\nContoh: /ai Apa itu machine learning?";

    // Build context with conversation history and reply
    const contextPrompt = buildContextPrompt(sender, prompt, replyMessage);
    
    // Add user message to history
    addToHistory(sender, 'user', prompt);
    
    // Use smart router to select best AI provider
    const response = await routeAIRequest(contextPrompt);
    
    // Add assistant response to history
    addToHistory(sender, 'assistant', response);
    
    return response;
  } catch (err) {
    console.error("Error in handleAI:", err.message);
    return "❌ Maaf, ada gangguan teknis. Coba lagi dalam 1-2 menit ya!";
  }
}

async function handleTranslate(sock, msg, sender, text) {
  try {
    const match = text.match(/^\/translate\s+([a-zA-Z-]+)\s+"([^"]+)"/);
    if (!match)
      return '⚡ *Layanan Terjemahan*\n\nFormat: /translate <bahasa> "teks"\n\nContoh: /translate english "Halo dunia"\n\nSiap membantu!';

    const [_, lang, content] = match;
    const prompt = `Translate this text to ${lang}:\n${content}`;

    return await generate(prompt);
  } catch (err) {
    console.error("Error in handleTranslate:", err.message);
    return "❌ Maaf, terjemahan gagal. Coba lagi ya!";
  }
}

async function handleSummarize(sock, msg, sender, text) {
  try {
    const input = text.replace(/^\/summarize\s+/, "").trim();
    if (!input)
      return '⚡ *Ringkasan Konten*\n\nFormat: /summarize <teks|url>\n\nContoh: /summarize "Teks panjang..."\nContoh: /summarize https://example.com\n\nSiap memproses!';

    let content = input;
    if (input.startsWith("http")) {
      content = await extractWebText(input);
      if (!content)
        return "⚠️ Tidak bisa mengambil konten URL. Mohon periksa URL dan coba lagi.";
    }

    const prompt = `Summarize this text concisely:\n${content}`;

    // Use smart router (heavy task - Gemini)
    return await routeAIRequest(prompt);
  } catch (err) {
    console.error("Error in handleSummarize:", err.message);
    return "❌ Maaf, ringkasan gagal. Coba lagi ya!";
  }
}

async function handleRewrite(sock, msg, sender, text) {
  try {
    const match = text.match(
      /^\/rewrite(?:\s+(formal|casual|brief|long))?\s+"([^"]+)"/,
    );
    if (!match)
      return '⚡ *Layanan Penulisan Ulang*\n\nFormat: /rewrite [style] "teks"\n\nStyle: formal, casual, brief, long\n\nContoh: /rewrite casual "Ini teks formal"\n\nSiap membantu!';

    const [_, style = "casual", content] = match;
    const prompt = `Rewrite this text in a ${style} style:\n${content}`;

    return await generate(prompt);
  } catch (err) {
    console.error("Error in handleRewrite:", err.message);
    return "❌ Maaf, tulis ulang gagal. Coba lagi ya!";
  }
}

async function handleCaption(sock, msg, sender, text) {
  try {
    const topic = text.replace(/^\/caption\s+/, "").trim();
    if (!topic)
      return '⚡ *Generator Caption*\n\nFormat: /caption <topik>\n\nContoh: /caption "sunset di pantai"\n\nSiap membuat caption menarik!';

    const prompt = `Generate a creative and engaging social media caption about: ${topic}`;

    // Use smart router (light task - Groq)
    return await routeAIRequest(prompt);
  } catch (err) {
    console.error("Error in handleCaption:", err.message);
    return "❌ Maaf, buat caption gagal. Coba lagi ya!";
  }
}

async function handleIdea(sock, msg, sender, text) {
  try {
    const topic = text.replace(/^\/idea\s+/, "").trim();
    if (!topic)
      return '💡 *Generator Ide*\n\nFormat: /idea <topik>\n\nContoh: /idea "content marketing"\n\nSiap brainstorming!';

    const prompt = `Generate 3-5 creative content ideas about: ${topic}`;

    // Use smart router (light task - Groq)
    return await routeAIRequest(prompt);
  } catch (err) {
    console.error("Error in handleIdea:", err.message);
    return "❌ Maaf, buat ide gagal. Coba lagi ya!";
  }
}

async function handleCode(sock, msg, sender, text) {
  try {
    const match = text.match(/^\/code\s+"([^"]+)"/);
    if (!match)
      return '⚡ *Generator Kode*\n\nFormat: /code "tugas dalam <bahasa>"\n\nContoh: /code "fibonacci function in javascript"\n\nSiap memproses!';

    const prompt = `Generate code for this task:\n${match[1]}\nProvide a brief explanation.`;

    return await generate(prompt);
  } catch (err) {
    console.error("Error in handleCode:", err.message);
    return "❌ Maaf, buat kode gagal. Coba lagi ya!";
  }
}

module.exports = {
  handleAI,
  handleTranslate,
  handleSummarize,
  handleRewrite,
  handleCaption,
  handleIdea,
  handleCode,
};
