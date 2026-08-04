/**
 * Centralized Cost Calculator (Dashboard fallback / recompute path).
 * Prefer rates from RPG /api/admin/ai-config catalog when available.
 */

export type CatalogRateEntry = {
  id: string;
  inputUsdPer1M: number;
  outputUsdPer1M: number;
};

/** Offline defaults aligned with game app catalog (cache miss). */
const FALLBACK_CATALOG_RATES: Record<string, { input: number; output: number }> = {
  'gemini-3.1-flash-lite': { input: 0.25, output: 1.5 },
  'deepseek-v4-flash': { input: 0.14, output: 0.28 },
  'deepseek-v4-pro': { input: 0.435, output: 0.87 },
};

let catalogRates: Record<string, { input: number; output: number }> = {
  ...FALLBACK_CATALOG_RATES,
};

/** Call after loading GET /api/admin/ai-config so dashboard rates match the game app. */
export function setCatalogRatesFromApi(catalog: CatalogRateEntry[] | null | undefined): void {
  if (!catalog?.length) return;
  const next = { ...FALLBACK_CATALOG_RATES };
  for (const entry of catalog) {
    if (!entry?.id) continue;
    next[entry.id.toLowerCase()] = {
      input: Number(entry.inputUsdPer1M) || 0,
      output: Number(entry.outputUsdPer1M) || 0,
    };
  }
  catalogRates = next;
}

function resolveRates(modelLower: string): { input: number; output: number } | null {
  const normalized = modelLower.replace(/^models\//, '');
  if (catalogRates[normalized]) return catalogRates[normalized];
  for (const [id, rates] of Object.entries(catalogRates)) {
    if (normalized.includes(id)) return rates;
  }
  return null;
}

export function calculateFallbackCost(log: any): number {
  let cost = Number(log.costUsd) || 0;
  if (cost > 0) return cost;

  const inT = Number(log.inputTokens) || 0;
  const outT = Number(log.outputTokens) || 0;
  const totalT = Number(log.tokens) || inT + outT || 0;
  const model = log.model || '';
  const modelLower = String(model).toLowerCase();

  const isImageModel =
    modelLower.includes('image')
    || modelLower.includes('vision')
    || modelLower.includes('imagen');

  if (isImageModel) {
    if (modelLower.includes('flash-lite-image')) return 0.0336;
    if (modelLower.includes('ultra')) return 0.06;
    if (modelLower.includes('fast')) return 0.02;
    return 0.04;
  }

  if (modelLower.includes('embedding')) {
    return (inT * 0.1) / 1_000_000;
  }

  const known = resolveRates(modelLower);
  if (known) {
    return (inT * known.input) / 1_000_000 + (outT * known.output) / 1_000_000;
  }

  // Legacy heuristics when model is not in catalog
  if (
    (modelLower.includes('3.5') || modelLower.includes('3.1') || modelLower.includes('gemini-3'))
    && modelLower.includes('pro')
  ) {
    return (inT * 2.0) / 1_000_000 + (outT * 12.0) / 1_000_000;
  }
  if (modelLower.includes('3.5-flash') || (modelLower.includes('3.5') && modelLower.includes('flash'))) {
    return (inT * 1.5) / 1_000_000 + (outT * 9.0) / 1_000_000;
  }
  if (modelLower.includes('3-flash') || modelLower.includes('gemini-3-flash')) {
    return (inT * 0.5) / 1_000_000 + (outT * 3.0) / 1_000_000;
  }
  if (modelLower.includes('lite') || modelLower.includes('flash-lite')) {
    return (inT * 0.25) / 1_000_000 + (outT * 1.5) / 1_000_000;
  }
  if (modelLower.includes('deepseek-v4-pro')) {
    return (inT * 0.435) / 1_000_000 + (outT * 0.87) / 1_000_000;
  }
  if (modelLower.includes('deepseek')) {
    return (inT * 0.14) / 1_000_000 + (outT * 0.28) / 1_000_000;
  }
  if (modelLower.includes('8b')) {
    return (inT * 0.0375) / 1_000_000 + (outT * 0.15) / 1_000_000;
  }
  if (
    modelLower.includes('flash')
    && (modelLower.includes('2.5') || modelLower.includes('2.0') || modelLower.includes('1.5'))
  ) {
    return (inT * 0.075) / 1_000_000 + (outT * 0.3) / 1_000_000;
  }
  if (modelLower.includes('pro')) {
    return (inT * 1.25) / 1_000_000 + (outT * 5.0) / 1_000_000;
  }

  const estimatedCost = (inT * 0.25) / 1_000_000 + (outT * 1.5) / 1_000_000;
  if (estimatedCost === 0 && totalT > 0) {
    return totalT * 0.0000005;
  }
  return estimatedCost;
}
