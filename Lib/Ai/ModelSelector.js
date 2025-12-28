import { CheckModelAvailability } from './OllamaClient.js';

async function SelectBestModel() {
  const modelPriority = ['mistral', 'phi3', 'llama2'];
  
  for (const modelName of modelPriority) {
    const result = await CheckModelAvailability(modelName);
    if (result.available) {
      return { model: modelName, fallback: false };
    }
  }
  
  return { model: null, fallback: true };
}

function GetModelFromEnvironment() {
  return process.env.THICC_MODEL || null;
}

function GetTemperatureFromEnvironment() {
  const temp = parseFloat(process.env.THICC_TEMP || '0.7');
  return Math.max(0.1, Math.min(1.0, temp));
}

export { SelectBestModel, GetModelFromEnvironment, GetTemperatureFromEnvironment };
