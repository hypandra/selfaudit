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
  contextWindow: number
  description: string
  recommended?: boolean
  type: 'local' | 'openrouter'
}

export const LOCAL_MODELS: ModelOption[] = [
  {
    id: 'Qwen2.5-1.5B-Instruct-q4f16_1-MLC',
    label: 'Qwen 2.5 1.5B',
    size: '~700MB',
    contextWindow: 4096,
    description: 'Fastest download. Adequate for basic audits.',
    type: 'local',
  },
  {
    id: 'gemma-2-2b-it-q4f16_1-MLC',
    label: 'Gemma 2 2B',
    size: '~1.3GB',
    contextWindow: 4096,
    description: 'Good balance of speed and quality.',
    type: 'local',
  },
  {
    id: 'Qwen2.5-3B-Instruct-q4f16_1-MLC',
    label: 'Qwen 2.5 3B',
    size: '~2GB',
    contextWindow: 4096,
    description: 'Best local structured output and rubric reasoning.',
    type: 'local',
    recommended: true,
  },
  {
    id: 'Phi-3.5-mini-instruct-q4f16_1-MLC',
    label: 'Phi 3.5 Mini',
    size: '~2.3GB',
    contextWindow: 8192,
    description: 'Highest local quality. Larger context window.',
    type: 'local',
  },
]

export const OPENROUTER_MODELS: ModelOption[] = [
  {
    id: 'anthropic/claude-sonnet-4.6',
    label: 'Claude Sonnet 4.6',
    size: 'API',
    contextWindow: 200000,
    description: 'Anthropic. Strong reasoning, excellent structured output.',
    type: 'openrouter',
  },
  {
    id: 'google/gemini-2.5-flash',
    label: 'Gemini 2.5 Flash',
    size: 'API',
    contextWindow: 1000000,
    description: 'Google. Fast, large context window.',
    type: 'openrouter',
  },
]

export const MODEL_OPTIONS: ModelOption[] = [...LOCAL_MODELS, ...OPENROUTER_MODELS]

// ─── OpenRouter API key ────────────────────────────────────────────────────────

const OPENROUTER_KEY_STORAGE = 'selfaudit-openrouter-key'

export function getOpenRouterKey(): string {
  return localStorage.getItem(OPENROUTER_KEY_STORAGE) ?? ''
}

export function setOpenRouterKey(key: string): void {
  if (key.trim()) {
    localStorage.setItem(OPENROUTER_KEY_STORAGE, key.trim())
  } else {
    localStorage.removeItem(OPENROUTER_KEY_STORAGE)
  }
}

// ─── Local model engine ────────────────────────────────────────────────────────

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

// ─── Inference ─────────────────────────────────────────────────────────────────

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

function getModelOption(modelId: string): ModelOption | undefined {
  return MODEL_OPTIONS.find((m) => m.id === modelId)
}

async function runLocalInference(
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

async function runOpenRouterInference(
  modelId: string,
  options: InferenceOptions,
  onStatus: (status: EngineStatus) => void
): Promise<string> {
  const key = getOpenRouterKey()
  if (!key) throw new Error('OpenRouter API key not set')

  onStatus({ state: 'generating', text: 'Sending to OpenRouter...' })

  try {
    const body: Record<string, unknown> = {
      model: modelId,
      messages: options.messages,
      temperature: options.temperature ?? 0.7,
      max_tokens: options.maxTokens ?? 2048,
      stream: true,
    }

    if (options.jsonSchema) {
      body.response_format = {
        type: 'json_schema',
        json_schema: { name: 'audit_result', schema: options.jsonSchema, strict: false },
      }
    }

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${key}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://self-audit.hypandra.com',
        'X-Title': 'Self-Audit',
      },
      body: JSON.stringify(body),
    })

    if (!response.ok) {
      const err = await response.text()
      if (response.status === 401) throw new Error('Invalid OpenRouter API key')
      throw new Error(`OpenRouter error (${response.status}): ${err}`)
    }

    const reader = response.body?.getReader()
    if (!reader) throw new Error('No response body')

    const decoder = new TextDecoder()
    let fullText = ''
    let buffer = ''

    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      buffer += decoder.decode(value, { stream: true })
      const lines = buffer.split('\n')
      buffer = lines.pop() ?? ''

      for (const line of lines) {
        if (!line.startsWith('data: ')) continue
        const data = line.slice(6).trim()
        if (data === '[DONE]') continue

        try {
          const parsed = JSON.parse(data)
          const delta = parsed.choices?.[0]?.delta?.content ?? ''
          if (delta) {
            fullText += delta
            options.onToken?.(fullText)
          }
        } catch {
          // skip malformed SSE lines
        }
      }
    }

    onStatus({ state: 'ready' })
    return fullText
  } catch (err) {
    onStatus({ state: 'ready' })
    throw err
  }
}

export async function runInference(
  modelId: string,
  options: InferenceOptions,
  onStatus: (status: EngineStatus) => void
): Promise<string> {
  const model = getModelOption(modelId)
  if (model?.type === 'openrouter') {
    return runOpenRouterInference(modelId, options, onStatus)
  }
  return runLocalInference(modelId, options, onStatus)
}

// ─── Utilities ─────────────────────────────────────────────────────────────────

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
