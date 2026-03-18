import { useState, useCallback } from 'react'
import { ModelLoader } from '@/components/model-loader'
import { AuditInput } from '@/components/audit-input'
import { AuditResults } from '@/components/audit-results'
import { AuditTypeSelector } from '@/components/audit-type-selector'
import { ComparePane } from '@/components/compare-pane'
import { ManualChecklist } from '@/components/manual-checklist'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { runAudit, runMetaAudit, type MetaAuditResult, type AnyAuditResult, type AuditType } from '@/lib/audit'
import { loadModel, isWebGPUAvailable, MODEL_OPTIONS, type EngineStatus } from '@/lib/engine'
import { getPromptConfig } from '@/lib/prompts'
import type { AuditResult } from '@/lib/principles'
import { Eye, Shield, Brain, ExternalLink, Bot, ClipboardList, GitCompare } from 'lucide-react'

function App() {
  const hasWebGPU = isWebGPUAvailable()
  const defaultModel = MODEL_OPTIONS.find((m) => m.recommended)?.id ?? MODEL_OPTIONS[0].id

  const [selectedModel, setSelectedModel] = useState(defaultModel)
  const [status, setStatus] = useState<EngineStatus>({ state: 'idle' })
  const [isAuditing, setIsAuditing] = useState(false)
  const [isMetaAuditing, setIsMetaAuditing] = useState(false)
  const [inputText, setInputText] = useState('')
  const [auditType, setAuditType] = useState<AuditType>('principles')
  const [auditResult, setAuditResult] = useState<AnyAuditResult | null>(null)
  const [metaResult, setMetaResult] = useState<MetaAuditResult | null>(null)
  const [auditError, setAuditError] = useState<string | null>(null)
  const [streamingText, setStreamingText] = useState<string | null>(null)
  const [prediction, setPrediction] = useState('')
  const [predictionLocked, setPredictionLocked] = useState(false)
  const [postReflection, setPostReflection] = useState('')

  const isReady = status.state === 'ready'

  const handleLoadLocal = useCallback(() => {
    loadModel(selectedModel, setStatus).catch((err) => {
      setStatus({ state: 'error', error: String(err) })
    })
  }, [selectedModel])

  const handleAuditTypeChange = useCallback((type: AuditType) => {
    setAuditType(type)
    setAuditResult(null)
    setMetaResult(null)
    setAuditError(null)
    setPrediction('')
    setPredictionLocked(false)
    setPostReflection('')
  }, [])

  const handleAudit = useCallback(
    async (text: string) => {
      setInputText(text)
      setAuditResult(null)
      setMetaResult(null)
      setAuditError(null)
      setStreamingText(null)
      setPrediction('')
      setPredictionLocked(false)
      setPostReflection('')
      setIsAuditing(true)

      try {
        const result = await runAudit(text, auditType, selectedModel, setStatus, (t) => setStreamingText(t))
        setStreamingText(null)
        setAuditResult(result)
      } catch (err) {
        setAuditError(String(err))
        setStreamingText(null)
        setStatus({ state: 'ready' })
      } finally {
        setIsAuditing(false)
      }
    },
    [selectedModel, auditType]
  )

  const handleMetaAudit = useCallback(async () => {
    if (!auditResult || auditResult.type !== 'principles') return
    setIsMetaAuditing(true)

    try {
      const result = await runMetaAudit(
        inputText,
        auditResult.data as AuditResult,
        selectedModel,
        setStatus
      )
      setMetaResult(result)
    } catch (err) {
      setStatus({ state: 'error', error: String(err) })
    } finally {
      setIsMetaAuditing(false)
    }
  }, [inputText, auditResult, selectedModel])

  const currentSystemPrompt = getPromptConfig(auditType).systemPrompt

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="max-w-3xl mx-auto px-4 py-6">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Self-Audit</h1>
              <p className="text-sm text-muted-foreground mt-1">
                AI principles audit that practices what it preaches
              </p>
            </div>
            <a
              href="https://hypandra.com/ai-principles"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 mt-1"
            >
              Hypandra AI Principles
              <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-8 space-y-6">
        {/* Three dimensions */}
        <div className="grid grid-cols-3 gap-4 text-center">
          <div className="space-y-2">
            <div className="mx-auto w-10 h-10 rounded-full bg-muted flex items-center justify-center">
              <Eye className="h-5 w-5 text-muted-foreground" />
            </div>
            <h3 className="text-sm font-medium">Seamfulness</h3>
            <p className="text-xs text-muted-foreground">
              Can you see how it works and where it breaks?
            </p>
          </div>
          <div className="space-y-2">
            <div className="mx-auto w-10 h-10 rounded-full bg-muted flex items-center justify-center">
              <Shield className="h-5 w-5 text-muted-foreground" />
            </div>
            <h3 className="text-sm font-medium">Contestability</h3>
            <p className="text-xs text-muted-foreground">
              Can you push back, challenge, and repair?
            </p>
          </div>
          <div className="space-y-2">
            <div className="mx-auto w-10 h-10 rounded-full bg-muted flex items-center justify-center">
              <Brain className="h-5 w-5 text-muted-foreground" />
            </div>
            <h3 className="text-sm font-medium">Productive Difficulty</h3>
            <p className="text-xs text-muted-foreground">
              Does it make you think?
            </p>
          </div>
        </div>

        <Separator />

        {/* Mode selection: AI-assisted or Manual */}
        {hasWebGPU ? (
          <Tabs defaultValue="ai">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="ai" className="flex items-center gap-1">
                <Bot className="h-3 w-3" />
                AI Audit
              </TabsTrigger>
              <TabsTrigger value="compare" className="flex items-center gap-1">
                <GitCompare className="h-3 w-3" />
                Compare
              </TabsTrigger>
              <TabsTrigger value="manual" className="flex items-center gap-1">
                <ClipboardList className="h-3 w-3" />
                Manual
              </TabsTrigger>
            </TabsList>

            <TabsContent value="compare" className="mt-4 space-y-6">
              <ModelLoader
                status={status}
                selectedModel={selectedModel}
                onModelChange={setSelectedModel}
                onLoad={handleLoadLocal}
              />
              <AuditTypeSelector
                selected={auditType}
                onChange={handleAuditTypeChange}
                disabled={false}
              />
              <ComparePane
                auditType={auditType}
                modelId={selectedModel}
                isModelReady={isReady}
                onStatus={setStatus}
              />
            </TabsContent>

            <TabsContent value="ai" className="mt-4 space-y-6">
              <ModelLoader
                status={status}
                selectedModel={selectedModel}
                onModelChange={setSelectedModel}
                onLoad={handleLoadLocal}
              />

              <AuditTypeSelector
                selected={auditType}
                onChange={handleAuditTypeChange}
                disabled={isAuditing}
              />

              <AuditInput
                onSubmit={handleAudit}
                isLoading={isAuditing}
                isModelReady={isReady}
                error={auditError}
                systemPrompt={currentSystemPrompt}
              />

              {/* Reflection + streaming + results */}
              {(isAuditing || auditResult) && (
                <div className="space-y-4">
                  {/* Pre-reflection — shown while auditing, persists into results */}
                  {(isAuditing || auditResult) && !predictionLocked && (
                    <div className="rounded-lg border border-primary/30 bg-primary/5 p-4 space-y-3">
                      <div className="space-y-1">
                        <p className="text-sm font-medium">
                          {isAuditing ? 'Running the audit.' : 'Audit complete.'}
                          {' '}First — what do you expect?
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Before seeing the results, take a moment: what do you think the audit will find? What's the main tension in this text?
                        </p>
                      </div>
                      <textarea
                        value={prediction}
                        onChange={(e) => setPrediction(e.target.value)}
                        placeholder="I think it will flag..."
                        className="w-full text-sm rounded-md border border-input bg-background px-3 py-2 leading-relaxed resize-none focus:outline-none focus:ring-1 focus:ring-ring"
                        rows={3}
                      />
                      <div className="flex items-center justify-between">
                        <p className="text-xs text-muted-foreground">
                          {isAuditing && !auditResult ? 'The model is still running — take your time.' : 'Results are ready.'}
                        </p>
                        <button
                          onClick={() => setPredictionLocked(true)}
                          disabled={!prediction.trim() && !auditResult}
                          className="text-sm font-medium px-3 py-1.5 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-40 transition-colors"
                        >
                          {prediction.trim() ? 'Lock in and see results' : 'Skip and see results'}
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Streaming indicator (visible while reflection is open too) */}
                  {isAuditing && streamingText && (
                    <div className="rounded-md border bg-muted/40 p-3 space-y-1">
                      <p className="text-xs text-muted-foreground font-medium animate-pulse">Generating…</p>
                      <pre className="text-xs text-muted-foreground whitespace-pre-wrap break-all max-h-40 overflow-y-auto">
                        {streamingText}
                      </pre>
                    </div>
                  )}
                  {isAuditing && !streamingText && status.state === 'generating' && (
                    <div className="text-sm text-muted-foreground animate-pulse text-center">
                      {status.text}
                    </div>
                  )}

                  {/* Results — only shown after prediction is locked */}
                  {auditResult && predictionLocked && (
                    <>
                      {/* Show prediction if they wrote one */}
                      {prediction.trim() && (
                        <div className="rounded-lg border bg-muted/30 p-4 space-y-1">
                          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Your prediction</p>
                          <p className="text-sm">{prediction}</p>
                        </div>
                      )}

                      <AuditResults
                        result={auditResult}
                        systemPrompt={currentSystemPrompt}
                        metaResult={metaResult}
                        onMetaAudit={handleMetaAudit}
                        isMetaAuditing={isMetaAuditing}
                      />

                      {/* Post-reflection */}
                      <div className="rounded-lg border border-primary/20 bg-primary/5 p-4 space-y-3">
                        <div className="space-y-1">
                          <p className="text-sm font-medium">Now that you've seen the results</p>
                          <p className="text-xs text-muted-foreground">
                            What surprised you? What did you expect that didn't appear? Where do you disagree?
                          </p>
                        </div>
                        <textarea
                          value={postReflection}
                          onChange={(e) => setPostReflection(e.target.value)}
                          placeholder="I was surprised that..."
                          className="w-full text-sm rounded-md border border-input bg-background px-3 py-2 leading-relaxed resize-none focus:outline-none focus:ring-1 focus:ring-ring"
                          rows={3}
                        />
                      </div>
                    </>
                  )}
                </div>
              )}
            </TabsContent>

            <TabsContent value="manual" className="mt-4">
              <ManualChecklist />
            </TabsContent>
          </Tabs>
        ) : (
          <>
            <ModelLoader
              status={status}
              selectedModel={selectedModel}
              onModelChange={setSelectedModel}
              onLoad={handleLoadLocal}
            />
            <ManualChecklist />
          </>
        )}

        {/* Transparency footer */}
        <Separator />
        <footer className="text-xs text-muted-foreground pb-8 space-y-3">
          <p className="font-medium">About this tool</p>
          <div className="space-y-2 leading-relaxed">
            <p>
              {hasWebGPU
                ? 'AI audit runs locally via WebLLM + WebGPU — your text never leaves your browser.'
                : 'AI audit requires WebGPU (not available in your browser) — manual checklist mode is active.'}
            </p>
            <p>
              The model running the audit is small (1.5–3.8B parameters). It will miss nuance,
              produce generic observations, and sometimes misunderstand context.
            </p>
            <p>
              This tool is itself subject to the principles it evaluates. After running a
              Principles Audit, use the Meta tab to examine the audit's own quality.
            </p>
            <p>No data collected. No analytics. No server.</p>
          </div>
          <p className="pt-2">
            Built by{' '}
            <a
              href="https://hypandra.com"
              target="_blank"
              rel="noopener noreferrer"
              className="underline hover:text-foreground"
            >
              Hypandra
            </a>
            . An experiment in reflective AI practice.
          </p>
        </footer>
      </main>
    </div>
  )
}

export default App
