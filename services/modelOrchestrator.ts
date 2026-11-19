/**
 * Model Orchestration Layer
 * Provides capability tiers and automatic multi-tier failover for Gemini models.
 * Ensures future-proof resilience against model deprecations, sunsets, and regional restrictions.
 */

import { callServerGenerateContent, GenerateContentResponse } from './geminiService';

export const IMAGE_GENERATION_TIER: readonly string[] = [
  'gemini-3-pro-image',          // Nano Banana Pro / Gemini Pro Image
  'gemini-nano-banana-2.1',      // Nano Banana 2.1 (High-Quality 1K-4K)
  'gemini-3.1-flash-lite-image', // Nano Banana Lite (Fast & Reliable)
];

export const TTS_AUDIO_TIER: readonly string[] = [
  'gemini-3.8-flash-lite-tts',   // High-efficiency, low-latency, cost-optimized TTS
  'gemini-3.8-flash-tts',        // Flagship audio & voice design model
];

export const TEXT_GENERATION_TIER: readonly string[] = [
  'gemini-4-hydrogen',           // Fast, intelligent Gemini 4 Flash
  'gemini-4-argon',              // Complex reasoning & multi-step tasks
  'gemini-4-carbon',             // Deep reasoning
  'gemini-3.8-flash',            // Fallback Flash
];

export interface TierExecutionResult<T> {
  result: T;
  modelUsed: string;
}

/**
 * Checks if an error is a candidate for model failover (e.g. model deprecated, sunset, unsupported, or region-blocked).
 */
export const isFailoverCandidateError = (error: any): boolean => {
  if (!error) return false;
  const status = error.status || error.statusCode;
  const msg = (error.message || '').toLowerCase();

  // 404: Not Found (model does not exist or deprecated/sunset)
  // 400: Bad Request (unsupported modality, invalid model configuration)
  // 403: Forbidden (region restriction, model access restricted)
  // 429: Quota/Rate Limit
  // 502/503: Service Unavailable / Temporary backend failure
  return (
    status === 404 ||
    status === 400 ||
    status === 403 ||
    status === 429 ||
    status === 502 ||
    status === 503 ||
    msg.includes('not found') ||
    msg.includes('deprecated') ||
    msg.includes('unsupported') ||
    msg.includes('forbidden') ||
    msg.includes('access forbidden') ||
    msg.includes('quota') ||
    msg.includes('resource_exhausted') ||
    msg.includes('unavailable')
  );
};

/**
 * Executes a call across an ordered tier of models.
 * If the primary model fails or is deprecated, automatically falls back to subsequent models in the tier.
 */
export async function executeTierWithFailover<T>(
  tierName: string,
  models: readonly string[],
  fn: (model: string) => Promise<T>,
  preferredModel?: string
): Promise<TierExecutionResult<T>> {
  // If preferred model is specified, move it to the front of the candidate list
  const orderedModels = preferredModel && models.includes(preferredModel)
    ? [preferredModel, ...models.filter(m => m !== preferredModel)]
    : [...models];

  const errors: { model: string; error: string; status?: number }[] = [];

  for (let i = 0; i < orderedModels.length; i++) {
    const model = orderedModels[i];
    try {
      console.log(`[ModelOrchestrator] Trying ${tierName} model (${i + 1}/${orderedModels.length}): ${model}`);
      const result = await fn(model);
      return { result, modelUsed: model };
    } catch (err: any) {
      console.warn(`[ModelOrchestrator] Model ${model} in ${tierName} failed:`, err.message || err);
      errors.push({
        model,
        error: err.message || String(err),
        status: err.status || err.statusCode,
      });

      // If this is the last model in the tier, throw comprehensive error
      if (i === orderedModels.length - 1) {
        break;
      }

      // Check if we should fail over
      if (isFailoverCandidateError(err)) {
        console.info(`[ModelOrchestrator] Cascading to next ${tierName} candidate: ${orderedModels[i + 1]}`);
        continue;
      }

      // If unexpected non-retryable error, still attempt next tier model to ensure maximum resilience
      console.info(`[ModelOrchestrator] Attempting fallback to ${orderedModels[i + 1]} for resilience`);
    }
  }

  const errorSummary = errors.map(e => `[${e.model}: ${e.error}]`).join(', ');
  throw new Error(`All models in ${tierName} tier failed. Details: ${errorSummary}`);
}
