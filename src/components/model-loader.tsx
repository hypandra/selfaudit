import { useState, useEffect, useCallback } from 'react'
import { Progress } from '@/components/ui/progress'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Download, AlertTriangle, CheckCircle2, Loader2, Star, ChevronRight, ChevronDown, Trash2, Key } from 'lucide-react'
import {
  isWebGPUAvailable,
  LOCAL_MODELS,
  OPENROUTER_MODELS,
  isModelCached,
  removeModelFromCache,
  getOpenRouterKey,
  setOpenRouterKey,
  type EngineStatus,
  type ModelOption,
} from '@/lib/engine'

interface ModelLoaderProps {
  status: EngineStatus
  selectedModel: string
  onModelChange: (modelId: string) => void
  onLoad: () => void
}

function RemovalInstructions() {
  const [open, setOpen] = useState(false)
  return (
    <div className="border-t pt-3">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
      >
        {open ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
        How to remove local models
      </button>
      {open && (
        <div className="mt-2 text-xs text-muted-foreground space-y-2 leading-relaxed">
          <p>
            Models are stored in your browser's <strong className="text-foreground">Cache Storage</strong> — not your Downloads folder.
          </p>
          <p>
            DevTools (F12 / ⌥⌘I) → Application → Cache Storage → delete <code className="bg-muted px-1 rounded">webllm</code> entries.
            Or use the "remove from cache" link below each downloaded model.
          </p>
        </div>
      )}
    </div>
  )
}

function ModelRow({
  model,
  selected,
  disabled,
  cached,
  onSelect,
  onRemove,
}: {
  model: ModelOption
  selected: boolean
  disabled: boolean
  cached?: boolean
  onSelect: () => void
  onRemove?: () => void
}) {
  return (
    <div className="space-y-0">
      <button
        onClick={onSelect}
        disabled={disabled}
        className={`w-full text-left p-3 rounded-md border transition-colors ${
          selected ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'
        } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'} ${
          cached ? 'rounded-b-none' : ''
        }`}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium font-sans">{model.label}</span>
            {model.recommended && (
              <Badge variant="secondary" className="text-xs px-1.5 py-0">
                <Star className="h-2.5 w-2.5 mr-0.5" />
                recommended
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground font-sans">
            {model.contextWindow >= 100000
              ? `${(model.contextWindow / 1000).toFixed(0)}k ctx`
              : `${(model.contextWindow / 1000).toFixed(0)}k ctx (in+out)`}
            <span>·</span>
            <span>{model.size}</span>
          </div>
        </div>
        <p className="text-xs text-muted-foreground mt-0.5">{model.description}</p>
      </button>
      {cached && onRemove && (
        <button
          onClick={onRemove}
          className="w-full flex items-center justify-end gap-1 px-3 py-1.5 rounded-b-md border border-t-0 text-xs text-muted-foreground/60 hover:text-destructive transition-colors"
          title="Remove from browser cache"
        >
          <Trash2 className="h-3 w-3" />
          remove from cache
        </button>
      )}
    </div>
  )
}

export function ModelLoader({ status, selectedModel, onModelChange, onLoad }: ModelLoaderProps) {
  const hasWebGPU = isWebGPUAvailable()
  const [cachedModels, setCachedModels] = useState<Record<string, boolean>>({})
  const [apiKey, setApiKey] = useState(getOpenRouterKey)
  const [showKeyInput, setShowKeyInput] = useState(!apiKey)

  const selectedIsCloud = OPENROUTER_MODELS.some((m) => m.id === selectedModel)
  const isDisabled = status.state === 'loading' || status.state === 'generating'

  const refreshCacheState = useCallback(async () => {
    try {
      const results = await Promise.all(
        LOCAL_MODELS.map(async (m) => [m.id, await isModelCached(m.id)] as const)
      )
      setCachedModels(Object.fromEntries(results))
    } catch {
      // Cache API unavailable
    }
  }, [])

  useEffect(() => {
    refreshCacheState()
  }, [refreshCacheState])

  const handleRemove = async (modelId: string) => {
    try {
      await removeModelFromCache(modelId)
      await refreshCacheState()
    } catch {
      await refreshCacheState()
    }
  }

  const handleSaveKey = () => {
    setOpenRouterKey(apiKey)
    setShowKeyInput(false)
  }

  const handleClearKey = () => {
    setApiKey('')
    setOpenRouterKey('')
    setShowKeyInput(true)
    // If current selection is cloud, switch to recommended local
    if (selectedIsCloud) {
      const rec = LOCAL_MODELS.find((m) => m.recommended) ?? LOCAL_MODELS[0]
      onModelChange(rec.id)
    }
  }

  if (!hasWebGPU && !apiKey) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-amber-500" />
            WebGPU Not Available
          </CardTitle>
          <CardDescription>
            Your browser doesn't support WebGPU for local models.
            You can use the manual checklist, or connect an OpenRouter API key to use cloud models.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <OpenRouterKeyInput
            apiKey={apiKey}
            onChange={setApiKey}
            onSave={handleSaveKey}
          />
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium font-sans">Choose a model</CardTitle>
        <CardDescription>
          Local models run in your browser — your text never leaves your device.
          Cloud models use your OpenRouter API key.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Cloud models */}
        <div className="space-y-2">
          <p className="text-xs font-medium font-sans text-muted-foreground uppercase tracking-wide">Cloud (via OpenRouter)</p>
          {apiKey && !showKeyInput ? (
            <>
              <div className="grid gap-2">
                {OPENROUTER_MODELS.map((model) => (
                  <ModelRow
                    key={model.id}
                    model={model}
                    selected={selectedModel === model.id}
                    disabled={isDisabled}
                    onSelect={() => onModelChange(model.id)}
                  />
                ))}
              </div>
              <div className="flex items-center gap-2">
                <Key className="h-3 w-3 text-muted-foreground/50" />
                <span className="text-xs text-muted-foreground">Key set · </span>
                <button onClick={() => setShowKeyInput(true)} className="text-xs text-muted-foreground underline hover:text-foreground">change</button>
                <span className="text-xs text-muted-foreground">· </span>
                <button onClick={handleClearKey} className="text-xs text-muted-foreground underline hover:text-destructive">remove</button>
              </div>
            </>
          ) : (
            <OpenRouterKeyInput
              apiKey={apiKey}
              onChange={setApiKey}
              onSave={handleSaveKey}
            />
          )}
        </div>

        {/* Local models */}
        {hasWebGPU && (
          <div className="space-y-2">
            <p className="text-xs font-medium font-sans text-muted-foreground uppercase tracking-wide">Local (WebGPU)</p>
            <div className="grid gap-2">
              {LOCAL_MODELS.map((model) => (
                <ModelRow
                  key={model.id}
                  model={model}
                  selected={selectedModel === model.id}
                  disabled={isDisabled}
                  cached={cachedModels[model.id]}
                  onSelect={() => onModelChange(model.id)}
                  onRemove={() => handleRemove(model.id)}
                />
              ))}
            </div>
          </div>
        )}

        {/* Status / action — only for local models */}
        {!selectedIsCloud && (
          <>
            {status.state === 'loading' ? (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  <span className="text-xs truncate">{status.text}</span>
                </div>
                <Progress value={status.progress * 100} className="h-2" />
              </div>
            ) : status.state === 'ready' ? (
              <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400">
                <CheckCircle2 className="h-4 w-4" />
                Model loaded — ready
              </div>
            ) : status.state === 'error' ? (
              <div className="space-y-2">
                <p className="text-xs text-destructive">{status.error}</p>
                <Button onClick={onLoad} variant="outline" size="sm">
                  Retry
                </Button>
              </div>
            ) : (
              <Button onClick={onLoad} className="w-full" variant="outline">
                <Download className="h-4 w-4 mr-2" />
                Load Model
              </Button>
            )}
          </>
        )}

        {/* Cloud model ready state */}
        {selectedIsCloud && apiKey && (
          <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400">
            <CheckCircle2 className="h-4 w-4" />
            Ready — using {OPENROUTER_MODELS.find((m) => m.id === selectedModel)?.label}
          </div>
        )}

        {hasWebGPU && <RemovalInstructions />}
      </CardContent>
    </Card>
  )
}

function OpenRouterKeyInput({
  apiKey,
  onChange,
  onSave,
}: {
  apiKey: string
  onChange: (key: string) => void
  onSave: () => void
}) {
  return (
    <div className="space-y-2">
      <p className="text-xs text-muted-foreground leading-relaxed">
        Bring your own key from{' '}
        <a href="https://openrouter.ai/keys" target="_blank" rel="noopener noreferrer" className="underline hover:text-foreground">
          openrouter.ai
        </a>
        . Your key stays in your browser (localStorage) and is sent directly to OpenRouter — never to us.
      </p>
      <div className="flex gap-2">
        <input
          type="password"
          value={apiKey}
          onChange={(e) => onChange(e.target.value)}
          placeholder="sk-or-..."
          className="flex-1 text-sm font-mono rounded-md border border-input bg-background px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-ring"
          onKeyDown={(e) => e.key === 'Enter' && apiKey.trim() && onSave()}
        />
        <Button
          onClick={onSave}
          disabled={!apiKey.trim()}
          variant="outline"
          size="sm"
        >
          Save
        </Button>
      </div>
    </div>
  )
}
