// === SMART AI ROUTER ===
// Route requests to appropriate AI provider based on task type

const { generateAI } = require('./multi-ai');
const { HfInference } = require('@huggingface/inference');

const hf = process.env.HF_TOKEN ? new HfInference(process.env.HF_TOKEN) : null;

// Task categories
const TASK_CATEGORIES = {
  LIGHT: 'light',      // Groq - Fast tasks
  HEAVY: 'heavy',      // Gemini - Complex reasoning
  NSFW: 'nsfw',        // HF - 18+ content
};

// NSFW-friendly HF models (prioritized)
const NSFW_MODELS = [
  'nothingiisreal/MN-12B-Celeste-V1.9',  // Best for NSFW - specialized model
  'mistralai/Mistral-7B-Instruct-v0.2',
  'meta-llama/Llama-2-7b-chat-hf',
  'HuggingFaceH4/zephyr-7b-beta',
];

/**
 * Detect task category from prompt
 */
function detectTaskCategory(prompt, context = {}) {
  const lowerPrompt = prompt.toLowerCase();
  
  // NSFW detection
  const nsfwKeywords = [
    'sex', 'porn', 'nude', 'naked', 'xxx', 'adult', '18+',
    'nsfw', 'erotic', 'sexual', 'intimate', 'explicit',
    'hot', 'sexy', 'sensual', 'romance', 'dating',
  ];
  
  if (nsfwKeywords.some(keyword => lowerPrompt.includes(keyword))) {
    return TASK_CATEGORIES.NSFW;
  }
  
  // Heavy tasks (complex reasoning, analysis)
  const heavyKeywords = [
    'analisa', 'analyze', 'jelaskan detail', 'explain in detail',
    'bagaimana cara', 'how to', 'mengapa', 'why',
    'bandingkan', 'compare', 'evaluasi', 'evaluate',
    'strategi', 'strategy', 'solusi', 'solution',
    'rencana', 'plan', 'desain', 'design',
    'riset', 'research', 'studi', 'study',
    'kompleks', 'complex', 'mendalam', 'deep',
  ];
  
  const isHeavy = heavyKeywords.some(keyword => lowerPrompt.includes(keyword));
  if (isHeavy || prompt.length > 200) {
    return TASK_CATEGORIES.HEAVY;
  }
  
  // Light tasks (default - chat, ideas, simple questions)
  return TASK_CATEGORIES.LIGHT;
}

/**
 * Route AI request to appropriate provider
 */
async function routeAIRequest(prompt, options = {}) {
  const category = detectTaskCategory(prompt, options);
  
  console.log(`🎯 Task category: ${category}`);
  
  let response;
  
  switch (category) {
    case TASK_CATEGORIES.NSFW:
      response = await handleNSFWRequest(prompt, options);
      break;
      
    case TASK_CATEGORIES.HEAVY:
      response = await handleHeavyRequest(prompt, options);
      break;
      
    case TASK_CATEGORIES.LIGHT:
    default:
      response = await handleLightRequest(prompt, options);
      break;
  }
  
  // Check if response contains rejection keywords (Groq might still respond but reject)
  if (response && typeof response === 'string') {
    const rejectionKeywords = [
      'i cannot', 'i can\'t', 'tidak bisa', 'maaf saya tidak',
      'against my guidelines', 'inappropriate', 'not appropriate',
      'cannot provide', 'unable to assist'
    ];
    
    const isRejection = rejectionKeywords.some(keyword => 
      response.toLowerCase().includes(keyword)
    );
    
    if (isRejection && category === TASK_CATEGORIES.LIGHT) {
      console.log('🔞 Response contains rejection, re-routing to NSFW model');
      return await handleNSFWRequest(prompt, options);
    }
  }
  
  return response;
}

/**
 * Handle light tasks with Groq (fast)
 */
async function handleLightRequest(prompt, options = {}) {
  console.log('⚡ Using Groq for light task (fast)');
  
  try {
    // Use Groq (will be primary in multi-ai)
    const response = await generateAI(prompt, options);
    
    return response;
  } catch (error) {
    console.error('❌ Groq failed:', error.message);
    
    // Check if it's sensitive content rejection
    const sensitiveKeywords = [
      'content policy', 'cannot provide', 'inappropriate',
      'against guidelines', 'not allowed', 'cannot assist',
      'sensitive', 'explicit', 'nsfw'
    ];
    
    const isSensitiveRejection = sensitiveKeywords.some(keyword => 
      error.message.toLowerCase().includes(keyword)
    );
    
    if (isSensitiveRejection) {
      console.log('🔞 Detected sensitive content, routing to NSFW model');
      return await handleNSFWRequest(prompt, options);
    }
    
    // Otherwise fallback to Gemini
    console.log('⚡ Falling back to Gemini');
    return await generateAI(prompt, { ...options, preferredProvider: 'gemini' });
  }
}

/**
 * Handle heavy tasks with Gemini (complex reasoning)
 */
async function handleHeavyRequest(prompt, options = {}) {
  console.log('🧠 Using Gemini for heavy task (complex reasoning)');
  
  try {
    // Force Gemini for complex tasks
    return await generateAI(prompt, {
      ...options,
      preferredProvider: 'gemini',
    });
  } catch (error) {
    console.error('❌ Gemini failed, falling back to Groq');
    return await generateAI(prompt, options);
  }
}

/**
 * Handle NSFW content with HuggingFace models
 */
async function handleNSFWRequest(prompt, options = {}) {
  console.log('🔞 Using HuggingFace for NSFW content');
  
  if (!hf || !process.env.HF_TOKEN) {
    return '❌ HuggingFace token tidak dikonfigurasi.\n\nUntuk content 18+, bot butuh HF_TOKEN.\n\nSetup: https://huggingface.co/settings/tokens';
  }
  
  const errors = [];
  
  // Try NSFW-friendly models
  for (const model of NSFW_MODELS) {
    try {
      console.log(`🔞 Trying model: ${model}`);
      
      const response = await hf.textGeneration({
        model: model,
        inputs: prompt,
        parameters: {
          max_new_tokens: 500,
          temperature: 0.7,
          top_p: 0.95,
          return_full_text: false,
        },
      });
      
      console.log(`✅ NSFW model success: ${model}`);
      return response.generated_text;
    } catch (error) {
      console.log(`❌ Model ${model} failed:`, error.message);
      errors.push(`${model}: ${error.message}`);
    }
  }
  
  // All NSFW models failed, try regular AI with warning
  console.log('⚠️ All NSFW models failed, using regular AI with content filter');
  return await generateAI(prompt, {
    ...options,
    systemPrompt: 'You are a helpful AI assistant. Provide informative responses while being mindful of content guidelines.',
  });
}

/**
 * Get task category for a prompt (for debugging)
 */
function getTaskCategory(prompt) {
  return detectTaskCategory(prompt);
}

module.exports = {
  routeAIRequest,
  getTaskCategory,
  TASK_CATEGORIES,
};
