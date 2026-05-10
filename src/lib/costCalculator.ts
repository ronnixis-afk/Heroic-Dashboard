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

  // Gemini 3 / 3.1 Pro
  if ((modelLower.includes('3.1') || modelLower.includes('gemini-3')) && modelLower.includes('pro')) {
    return (inT * 2.00 / 1000000) + (outT * 12.00 / 1000000);
  }
  
  // Gemini 3 / 3.1 Flash Lite (Primary Model)
  if (modelLower.includes('lite') || modelLower.includes('flash-lite')) {
    return (inT * 0.25 / 1000000) + (outT * 1.50 / 1000000);
  }
  
  // Legacy Pro fallback
  if (modelLower.includes('pro')) {
    return (inT * 1.25 / 1000000) + (outT * 5.00 / 1000000);
  }

  // Flash 1.5 default / Generic fallback
  // Since the user says Gemini 3 Flash Lite is the ONLY model, we use its rates as the ultimate fallback
  const estimatedCost = (inT * 0.25 / 1000000) + (outT * 1.50 / 1000000);
  
  if (estimatedCost === 0 && totalT > 0) {
    // If no input/output breakdown but tokens exist, use an average rate (approx $0.50 per 1M)
    return totalT * 0.0000005;
  }
  
  return estimatedCost;
}

