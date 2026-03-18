import type { MLCEngine, InitProgressReport } from '@mlc-ai/web-llm'

export type EngineStatus =
  | { state: 'idle' }
  | { state: 'loading'; progress: number; text: string }
  | { state: 'ready' }
  | { state: 'generating'; text: string }
  | { state: 'error'; error: string }

export interface ModelOption {
  id: string
  label: string
  size: string
  vram: string
  contextWindow: number
  description: string
  recommended?: boolean
}

export const MODEL_OPTIONS: ModelOption[] = [
  {
    id: 'Qwen2.5-1.5B-Instruct-q4f16_1-MLC',
    label: 'Qwen 2.5 1.5B',
    size: '~700MB',
    vram: '~1GB',
    contextWindow: 4096,
    description: 'Fastest download. Adequate for basic audits.',
  },
  {
    id: 'gemma-2-2b-it-q4f16_1-MLC',
    label: 'Gemma 2 2B',
    size: '~1.3GB',
    vram: '~1.5GB',
    contextWindow: 4096,
    description: 'Good balance of speed and quality.',
  },
  {
    id: 'Qwen2.5-3B-Instruct-q4f16_1-MLC',
    label: 'Qwen 2.5 3B',
    size: '~2GB',
    vram: '~2.5GB',
    contextWindow: 4096,
    description: 'Best structured output and rubric reasoning.',
    recommended: true,
  },
  {
    id: 'Phi-3.5-mini-instruct-q4f16_1-MLC',
    label: 'Phi 3.5 Mini',
    size: '~2.3GB',
    vram: '~3.7GB',
    contextWindow: 8192,
    description: 'Highest quality. Larger context window.',
  },
]

let engine: MLCEngine | null = null
let currentModelId: string | null = null

export async function loadModel(
  modelId: string,
  onProgress: (status: EngineStatus) => void
): Promise<MLCEngine> {
  if (engine && currentModelId === modelId) return engine

  if (engine && currentModelId !== modelId) {
    engine = null
    currentModelId = null
  }

  const { CreateMLCEngine } = await import('@mlc-ai/web-llm')

  onProgress({ state: 'loading', progress: 0, text: 'Initializing...' })

  try {
    engine = await CreateMLCEngine(modelId, {
      initProgressCallback: (report: InitProgressReport) => {
        onProgress({
          state: 'loading',
          progress: report.progress,
          text: report.text,
        })
      },
    })
    currentModelId = modelId
    onProgress({ state: 'ready' })
    return engine
  } catch (err) {
    onProgress({ state: 'error', error: String(err) })
    throw err
  }
}

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

export interface InferenceOptions {
  messages: ChatMessage[]
  jsonSchema?: object
  temperature?: number
  maxTokens?: number
  onToken?: (partial: string) => void
}

export async function runInference(
  modelId: string,
  options: InferenceOptions,
  onStatus: (status: EngineStatus) => void
): Promise<string> {
  const eng = await loadModel(modelId, onStatus)
  onStatus({ state: 'generating', text: 'Generating...' })

  try {
    const response = await eng.chat.completions.create({
      messages: options.messages,
      response_format: options.jsonSchema
        ? {
            type: 'json_object' as const,
            schema: JSON.stringify(options.jsonSchema),
          }
        : undefined,
      stream: true,
      temperature: options.temperature ?? 0.7,
      max_tokens: options.maxTokens ?? 2048,
    })

    let fullText = ''
    for await (const chunk of response) {
      const delta = chunk.choices[0]?.delta?.content ?? ''
      fullText += delta
      options.onToken?.(fullText)
    }

    onStatus({ state: 'ready' })
    return fullText
  } catch (err) {
    onStatus({ state: 'ready' })
    throw err
  }
}

export function isWebGPUAvailable(): boolean {
  return 'gpu' in navigator
}

export async function isModelCached(modelId: string): Promise<boolean> {
  const { hasModelInCache } = await import('@mlc-ai/web-llm')
  return hasModelInCache(modelId)
}

export async function removeModelFromCache(modelId: string): Promise<void> {
  const { deleteModelAllInfoInCache } = await import('@mlc-ai/web-llm')
  await deleteModelAllInfoInCache(modelId)
  if (currentModelId === modelId) {
    engine = null
    currentModelId = null
  }
}
