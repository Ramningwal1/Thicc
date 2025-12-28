import { Ollama } from 'ollama';
import { ShimmerStatus } from '../Cli/ShimmerStatus.js';

const SHIMMER_TEXTS = [
  'Cooking...',
  'Juicing...',
  'Pumping...',
  'Stretching...',
  'Stuffing...',
  'Grinding...',
  'Filling...',
  'Thrusting...',
  'Baking...',
  'Sniffing...'
];

const COLOR_PAIRS = [
  { base: '#ff9800', shimmer: '#ffeb3b' },
  { base: '#e91e63', shimmer: '#f48fb1' },
  { base: '#9c27b0', shimmer: '#ce93d8' },
  { base: '#673ab7', shimmer: '#b39ddb' },
  { base: '#3f51b5', shimmer: '#9fa8da' },
  { base: '#2196f3', shimmer: '#90caf9' },
  { base: '#03a9f4', shimmer: '#81d4fa' },
  { base: '#00bcd4', shimmer: '#80deea' },
  { base: '#009688', shimmer: '#80cbc4' },
  { base: '#4caf50', shimmer: '#a5d6a7' },
  { base: '#8bc34a', shimmer: '#c5e1a5' },
  { base: '#cddc39', shimmer: '#e6ee9c' },
  { base: '#ffeb3b', shimmer: '#fff59d' },
  { base: '#ffc107', shimmer: '#ffe082' },
  { base: '#ff9800', shimmer: '#ffcc80' },
  { base: '#ff5722', shimmer: '#ff8a65' },
  { base: '#f44336', shimmer: '#ef5350' },
  { base: '#e91e63', shimmer: '#ec407a' },
  { base: '#9c27b0', shimmer: '#ab47bc' },
  { base: '#673ab7', shimmer: '#7e57c2' }
];

function getRandomShimmerConfig() {
  const text = SHIMMER_TEXTS[Math.floor(Math.random() * SHIMMER_TEXTS.length)];
  const colors = COLOR_PAIRS[Math.floor(Math.random() * COLOR_PAIRS.length)];
  return {
    text: `   ${text}`,
    color: colors.base,
    shimmerColor: colors.shimmer
  };
}

async function CheckOllamaAvailability() {
  try {
    const ollama = new Ollama();
    await ollama.list();
    return { available: true };
  } catch (error) {
    return { available: false, error: error.message };
  }
}

async function CheckModelAvailability(modelName) {
  try {
    const ollama = new Ollama();
    const models = await ollama.list();
    const modelExists = models.models.some(m => m.name.includes(modelName));
    return { available: modelExists };
  } catch (error) {
    return { available: false, error: error.message };
  }
}

async function GenerateCompletion(modelName, prompt, temperature = 0.7, useStreaming = true) {
  try {
    const startTime = Date.now();
    const ollama = new Ollama();
    
    if (useStreaming) {
      const config = getRandomShimmerConfig();
      const shimmer = new ShimmerStatus({
        text: config.text,
        color: config.color,
        shimmerColor: config.shimmerColor,
        duration: 2000,
        interval: 50
      });
      
      shimmer.start();
      
      const response = await ollama.generate({
        model: modelName,
        prompt: prompt,
        stream: true,
        system: 'You are a comprehensive summarizer. Output ONLY a comprehensive reference summary in 250-500 characters. Comprehensive explanations. No formatting.',
        options: {
          temperature: temperature,
          num_predict: 300,
          top_k: 10,
          top_p: 0.9
        }
      });
      
      let fullText = '';
      
      for await (const chunk of response) {
        fullText += chunk.response;
        
        if (fullText.length > 500) break;
      }
      
      shimmer.stop();
      
      const elapsed = Date.now() - startTime;
      console.warn(`   > ${elapsed}ms`);
      
      return { success: true, text: fullText.substring(0, 500) };
    } else {
      const response = await ollama.generate({
        model: modelName,
        prompt: prompt,
        stream: false,
        system: 'You are a comprehensive summarizer. Output ONLY a comprehensive reference summary in 250-500 characters. Comprehensive explanations. No formatting.',
        options: {
          temperature: temperature,
          num_predict: 300
        }
      });
      
      const elapsed = Date.now() - startTime;
      console.warn(`   > ${elapsed}ms`);
      
      return { success: true, text: response.response.substring(0, 500) };
    }
  } catch (error) {
    console.error(`     Oops > ${error.message}`);
    return { success: false, error: error.message };
  }
}

export { CheckOllamaAvailability, CheckModelAvailability, GenerateCompletion };
