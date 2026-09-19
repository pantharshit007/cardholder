export enum AIModel {
  GeminiFlashLite = 'google/gemini-3.1-flash-lite',
  GlmFlash = 'z-ai/glm-5.3-flash',
  DeepSeekFlash = 'deepseek/deepseek-v4.1-flash',
  MuseSparkContributor = 'meta/muse-spark-1.3-contributor',
}

/** Ordered primary model and up to two fallbacks. */
export type ModelFallbacks =
  | readonly [AIModel]
  | readonly [AIModel, AIModel]
  | readonly [AIModel, AIModel, AIModel]
