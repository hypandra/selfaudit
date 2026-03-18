import { useState, useEffect, useCallback } from 'react'
import { Progress } from '@/components/ui/progress'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Download, AlertTriangle, CheckCircle2, Loader2, Star, ChevronRight, ChevronDown, Trash2 } from 'lucide-react'
import { isWebGPUAvailable, MODEL_OPTIONS, isModelCached, removeModelFromCache, type EngineStatus } from '@/lib/engine'

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
        How to remove these models later
      </button>
      {open && (
        <div className="mt-2 text-xs text-muted-foreground space-y-2 leading-relaxed">
          <p>
            Models are stored in your browser's <strong className="text-foreground">Cache Storage</strong> — not your Downloads folder.
            They persist until you clear them manually.
          </p>
          <div className="space-y-1">
            <p className="font-medium text-foreground">To remove (precise):</p>
            <p>Open DevTools (F12 / ⌥⌘I) → Application → Cache Storage → find entries starting with <code className="bg-muted px-1 rounded">webllm</code> → right-click → Delete.</p>
          </div>
          <div className="space-y-1">
            <p className="font-medium text-foreground">To remove (nuclear):</p>
            <p>Browser Settings → Privacy → Clear browsing data → Cached images and files. This removes all cached data for all sites.</p>
          </div>
          <p className="text-muted-foreground/70">Model sizes: Qwen 1.5B ≈ 1 GB · Gemma 2B ≈ 1.6 GB · Qwen 3B ≈ 2 GB · Phi 3.5 Mini ≈ 2.4 GB</p>
        </div>
      )}
    </div>
  )
}

export function ModelLoader({
  status,
  selectedModel,
  onModelChange,
  onLoad,
}: ModelLoaderProps) {
  const hasWebGPU = isWebGPUAvailable()
  const [cachedModels, setCachedModels] = useState<Record<string, boolean>>({})

  const refreshCacheState = useCallback(async () => {
    try {
      const results = await Promise.all(
        MODEL_OPTIONS.map(async (m) => [m.id, await isModelCached(m.id)] as const)
      )
      setCachedModels(Object.fromEntries(results))
    } catch {
      // Cache API unavailable or denied — leave badges empty
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
      // Removal failed — refresh to show true state
      await refreshCacheState()
    }
  }

  if (!hasWebGPU) {
    return (
      <Card className="border-amber-500/50">
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-amber-500" />
            WebGPU Not Available
          </CardTitle>
          <CardDescription>
            Self-Audit needs WebGPU to run language models in your browser.
            Your browser doesn't support it yet.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <p>You can still use the <strong>manual checklist</strong> below to walk through the principles yourself — arguably a more reflective practice anyway.</p>
          <div className="text-xs text-muted-foreground space-y-1">
            <p className="font-medium">To enable AI-assisted audit:</p>
            <ul className="list-disc list-inside space-y-0.5">
              <li>Chrome/Edge 113+ (desktop)</li>
              <li>Firefox 141+ (Windows) or 145+ (macOS Apple Silicon)</li>
              <li>Safari 26+ (macOS/iOS)</li>
            </ul>
          </div>
          <div className="text-xs text-muted-foreground border-t pt-2">
            <p>
              Want to run models locally outside the browser?
              Check out <a href="https://www.reddit.com/r/LocalLLaMA/" target="_blank" rel="noopener noreferrer" className="underline hover:text-foreground">r/LocalLLaMA</a> for
              getting started with local AI.
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium">Choose a Model</CardTitle>
        <CardDescription className="text-xs">
          Everything runs in your browser via WebGPU. Your text never leaves your device.
          Models are cached after first download.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Model options */}
        <div className="grid gap-2">
          {MODEL_OPTIONS.map((model) => {
            const isDisabled = status.state === 'loading' || status.state === 'generating'
            return (
              <div key={model.id} className="space-y-0">
                <button
                  onClick={() => onModelChange(model.id)}
                  disabled={isDisabled}
                  className={`w-full text-left p-3 rounded-md border transition-colors ${
                    selectedModel === model.id
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:border-primary/50'
                  } ${isDisabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'} ${
                    cachedModels[model.id] ? 'rounded-b-none' : ''
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">{model.label}</span>
                      {model.recommended && (
                        <Badge variant="secondary" className="text-xs px-1.5 py-0">
                          <Star className="h-2.5 w-2.5 mr-0.5" />
                          recommended
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span title="Total token budget shared between input and output">{(model.contextWindow / 1000).toFixed(0)}k ctx (in+out)</span>
                      <span>·</span>
                      <span>{model.size}</span>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">{model.description}</p>
                </button>
                {cachedModels[model.id] && (
                  <button
                    onClick={() => handleRemove(model.id)}
                    className="w-full flex items-center justify-end gap-1 px-3 py-1.5 rounded-b-md border border-t-0 text-xs text-muted-foreground/60 hover:text-destructive transition-colors"
                    title="Remove from browser cache"
                  >
                    <Trash2 className="h-3 w-3" />
                    remove from cache
                  </button>
                )}
              </div>
            )
          })}
        </div>

        {/* Status / action */}
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
            Model loaded — ready to audit
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

        <RemovalInstructions />
      </CardContent>
    </Card>
  )
}
