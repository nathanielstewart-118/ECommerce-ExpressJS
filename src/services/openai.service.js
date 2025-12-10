const OpenAI = require('openai');
const { config, logger } = require('../config');
const { BadRequestError } = require('../utils');

// Initialize OpenAI
const openai = config.openai.apiKey ? new OpenAI({ apiKey: config.openai.apiKey }) : null;

/**
 * Check if OpenAI is configured
 */
const isConfigured = () => {
  return !!openai;
};

/**
 * Generate text completion
 * @param {string} prompt - User prompt
 * @param {Object} options - Generation options
 * @returns {Promise<string>} - Generated text
 */
const generateCompletion = async (prompt, options = {}) => {
  if (!isConfigured()) {
    throw new BadRequestError('AI service not available');
  }

  try {
    const completion = await openai.chat.completions.create({
      model: options.model || config.openai.model,
      messages: [
        {
          role: 'system',
          content: options.systemPrompt || 'You are a helpful assistant.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      max_tokens: options.maxTokens || 1000,
      temperature: options.temperature || 0.7,
    });

    logger.info('OpenAI completion generated');
    return completion.choices[0].message.content;
  } catch (error) {
    logger.error('OpenAI completion error:', error);
    throw new BadRequestError('Failed to generate AI response');
  }
};

/**
 * Generate chat completion with conversation history
 * @param {Array} messages - Array of message objects
 * @param {Object} options - Generation options
 * @returns {Promise<Object>} - Generated response
 */
const generateChatCompletion = async (messages, options = {}) => {
  if (!isConfigured()) {
    throw new BadRequestError('AI service not available');
  }

  try {
    const completion = await openai.chat.completions.create({
      model: options.model || config.openai.model,
      messages,
      max_tokens: options.maxTokens || 1000,
      temperature: options.temperature || 0.7,
    });

    logger.info('OpenAI chat completion generated');
    return {
      content: completion.choices[0].message.content,
      usage: completion.usage,
    };
  } catch (error) {
    logger.error('OpenAI chat error:', error);
    throw new BadRequestError('Failed to generate AI response');
  }
};

/**
 * Generate product description
 * @param {Object} productData - Product information
 * @returns {Promise<string>} - Generated description
 */
const generateProductDescription = async (productData) => {
  const prompt = `Generate a compelling product description for the following product:
    Name: ${productData.name}
    Category: ${productData.category}
    Features: ${productData.features?.join(', ') || 'N/A'}
    Target Audience: ${productData.targetAudience || 'General consumers'}
    
    Please write a professional, engaging product description that highlights the benefits and appeals to the target audience. Keep it under 200 words.`;

  return generateCompletion(prompt, {
    systemPrompt: 'You are an expert copywriter specializing in e-commerce product descriptions.',
    temperature: 0.8,
  });
};

/**
 * Analyze customer sentiment
 * @param {string} text - Customer feedback text
 * @returns {Promise<Object>} - Sentiment analysis result
 */
const analyzeSentiment = async (text) => {
  const prompt = `Analyze the sentiment of the following customer feedback and respond with a JSON object containing:
    - sentiment: "positive", "negative", or "neutral"
    - confidence: a number between 0 and 1
    - summary: a brief summary of the feedback
    
    Feedback: "${text}"`;

  const response = await generateCompletion(prompt, {
    systemPrompt: 'You are a sentiment analysis expert. Always respond with valid JSON only.',
    temperature: 0.3,
  });

  try {
    return JSON.parse(response);
  } catch (error) {
    return {
      sentiment: 'neutral',
      confidence: 0.5,
      summary: 'Unable to analyze sentiment',
    };
  }
};

/**
 * Generate embedding for text
 * @param {string} text - Text to embed
 * @returns {Promise<Array>} - Embedding vector
 */
const generateEmbedding = async (text) => {
  if (!isConfigured()) {
    throw new BadRequestError('AI service not available');
  }

  try {
    const response = await openai.embeddings.create({
      model: 'text-embedding-ada-002',
      input: text,
    });

    return response.data[0].embedding;
  } catch (error) {
    logger.error('OpenAI embedding error:', error);
    throw new BadRequestError('Failed to generate embedding');
  }
};

/**
 * Moderate content
 * @param {string} text - Text to moderate
 * @returns {Promise<Object>} - Moderation result
 */
const moderateContent = async (text) => {
  if (!isConfigured()) {
    throw new BadRequestError('AI service not available');
  }

  try {
    const response = await openai.moderations.create({
      input: text,
    });

    return response.results[0];
  } catch (error) {
    logger.error('OpenAI moderation error:', error);
    throw new BadRequestError('Failed to moderate content');
  }
};

module.exports = {
  isConfigured,
  generateCompletion,
  generateChatCompletion,
  generateProductDescription,
  analyzeSentiment,
  generateEmbedding,
  moderateContent,
  openai,
};
