export function calculateFallbackCost(log: any): number {
  let cost = Number(log.costUsd) || 0;
  if (cost > 0) return cost;

  const inT = Number(log.inputTokens) || 0;
  const outT = Number(log.outputTokens) || 0;
  const totalT = Number(log.tokens) || (inT + outT) || 0;
  const model = log.model || '';
  const modelLower = model.toLowerCase();

  const isImageModel = modelLower.includes('image') || modelLower.includes('vision') || modelLower.includes('imagen');

  if (isImageModel) {
    if (modelLower.includes('ultra')) return 0.06;
    if (modelLower.includes('fast')) return 0.02;
    return 0.04;
  }

  // 1. Embeddings
  if (modelLower.includes('embedding')) {
    return (inT * 0.10 / 1000000);
  }

  // 2. Gemini 3.5 Pro / Gemini 3.1 Pro / Gemini 3 Pro
  if ((modelLower.includes('3.5') || modelLower.includes('3.1') || modelLower.includes('gemini-3')) && modelLower.includes('pro')) {
    return (inT * 2.00 / 1000000) + (outT * 12.00 / 1000000);
  }

  // 3. Gemini 3.5 Flash
  if (modelLower.includes('3.5-flash') || (modelLower.includes('3.5') && modelLower.includes('flash'))) {
    return (inT * 1.50 / 1000000) + (outT * 9.00 / 1000000);
  }

  // 4. Gemini 3 Flash
  if (modelLower.includes('3-flash') || modelLower.includes('gemini-3-flash')) {
    return (inT * 0.50 / 1000000) + (outT * 3.00 / 1000000);
  }

  // 5. Gemini 3.1 Flash Lite / Gemini 3 Flash Lite (Primary Model)
  if (modelLower.includes('lite') || modelLower.includes('flash-lite')) {
    return (inT * 0.25 / 1000000) + (outT * 1.50 / 1000000);
  }

  // 6. Gemini 1.5 Flash 8b
  if (modelLower.includes('8b')) {
    return (inT * 0.0375 / 1000000) + (outT * 0.15 / 1000000);
  }

  // 7. Gemini 2.5 Flash / Gemini 2.0 Flash / Gemini 1.5 Flash
  if (modelLower.includes('flash') && (modelLower.includes('2.5') || modelLower.includes('2.0') || modelLower.includes('1.5'))) {
    return (inT * 0.075 / 1000000) + (outT * 0.30 / 1000000);
  }

  // 8. Gemini 2.5 Pro / Gemini 1.5 Pro (Legacy Pro fallback)
  if (modelLower.includes('pro')) {
    return (inT * 1.25 / 1000000) + (outT * 5.00 / 1000000);
  }

  // Default: Use Gemini 3.1 Flash Lite rates as fallback
  const estimatedCost = (inT * 0.25 / 1000000) + (outT * 1.50 / 1000000);
  
  if (estimatedCost === 0 && totalT > 0) {
    // If no input/output breakdown but tokens exist, use an average rate (approx $0.50 per 1M)
    return totalT * 0.0000005;
  }
  
  return estimatedCost;
}


