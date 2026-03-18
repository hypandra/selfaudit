import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Separator } from '@/components/ui/separator'
import { Play, Loader2, Sparkles, ChevronDown, ChevronRight } from 'lucide-react'
import { runComparison, runDiffSummary, type AnyAuditResult, type AuditType } from '@/lib/audit'
import { diffResults, getSummaries, type FindingDiff } from '@/lib/diff'
import { getPromptConfig } from '@/lib/prompts'
import { severityColors, type Severity } from '@/lib/principles'
import type { EngineStatus } from '@/lib/engine'

interface ComparePaneProps {
  auditType: AuditType
  modelId: string
  isModelReady: boolean
  onStatus: (status: EngineStatus) => void
}

// ─── Diff status styles ────────────────────────────────────────────────────────

const statusStyles: Record<string, { border: string; label: string; labelColor: string }> = {
  'changed': {
    border: 'border-l-4 border-l-amber-400',
    label: 'severity changed',
    labelColor: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300',
  },
  'only-a': {
    border: 'border-l-4 border-l-blue-400',
    label: 'only in A',
    labelColor: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
  },
  'only-b': {
    border: 'border-l-4 border-l-purple-400',
    label: 'only in B',
    labelColor: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300',
  },
  same: {
    border: 'border-l-4 border-l-border',
    label: 'same',
    labelColor: 'bg-muted text-muted-foreground',
  },
}

function SeverityBadge({ severity }: { severity: string }) {
  return (
    <Badge variant="secondary" className={severityColors[severity as Severity] ?? ''}>
      {severity}
    </Badge>
  )
}

function DiffCard({ diff }: { diff: FindingDiff }) {
  const style = statusStyles[diff.status]
  return (
    <div className={`rounded-lg border p-4 space-y-3 ${style.border}`}>
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="font-mono text-xs text-muted-foreground">{diff.id}</span>
          <Badge variant="secondary" className={`text-xs ${style.labelColor}`}>
            {style.label}
          </Badge>
        </div>
        <div className="flex gap-1.5 items-center">
          {diff.a && <SeverityBadge severity={diff.a.severity} />}
          {diff.status === 'changed' && diff.b && (
            <>
              <span className="text-muted-foreground text-xs">→</span>
              <SeverityBadge severity={diff.b.severity} />
            </>
          )}
        </div>
      </div>

      {diff.status === 'changed' && diff.a && diff.b ? (
        <div className="grid grid-cols-2 gap-3 text-xs">
          <div className="space-y-1">
            <p className="font-medium text-blue-600 dark:text-blue-400">A</p>
            <p className="text-muted-foreground">{diff.a.observation}</p>
          </div>
          <div className="space-y-1">
            <p className="font-medium text-purple-600 dark:text-purple-400">B</p>
            <p className="text-muted-foreground">{diff.b.observation}</p>
          </div>
        </div>
      ) : diff.a ? (
        <p className="text-sm text-muted-foreground">{diff.a.observation}</p>
      ) : diff.b ? (
        <p className="text-sm text-muted-foreground">{diff.b.observation}</p>
      ) : null}
    </div>
  )
}

// ─── Main component ────────────────────────────────────────────────────────────

export function ComparePane({ auditType, modelId, isModelReady, onStatus }: ComparePaneProps) {
  const basePrompt = getPromptConfig(auditType).systemPrompt

  const [text, setText] = useState('')
  const [promptA, setPromptA] = useState(basePrompt)
  const [promptB, setPromptB] = useState(basePrompt)
  const [showPromptA, setShowPromptA] = useState(false)
  const [running, setRunning] = useState<false | 'a' | 'b' | 'diff'>(false)
  const [streamingText, setStreamingText] = useState<string | null>(null)
  const [results, setResults] = useState<{ a: AnyAuditResult; b: AnyAuditResult } | null>(null)
  const [diffSummary, setDiffSummary] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Reset when audit type changes
  useEffect(() => {
    const prompt = getPromptConfig(auditType).systemPrompt
    setPromptA(prompt)
    setPromptB(prompt)
    setResults(null)
    setDiffSummary(null)
    setError(null)
  }, [auditType])

  const handleRun = async () => {
    if (!text.trim()) return
    setResults(null)
    setDiffSummary(null)
    setError(null)
    setStreamingText(null)

    try {
      setRunning('a')
      const { a, b } = await runComparison(
        text.trim(),
        promptA,
        promptB,
        auditType,
        modelId,
        onStatus,
        (t) => { setRunning('a'); setStreamingText(t) },
        (t) => { setRunning('b'); setStreamingText(t) },
      )
      setStreamingText(null)
      setResults({ a, b })
    } catch (err) {
      setError(String(err))
    } finally {
      setRunning(false)
      setStreamingText(null)
    }
  }

  const handleDiffSummary = async () => {
    if (!results) return
    setRunning('diff')
    setDiffSummary(null)
    try {
      const summary = await runDiffSummary(results.a, results.b, modelId, onStatus)
      setDiffSummary(summary)
    } catch (err) {
      setError(String(err))
    } finally {
      setRunning(false)
    }
  }

  const diffs = results ? diffResults(results.a, results.b) : null
  const summaries = results ? getSummaries(results.a, results.b) : null
  const changedCount = diffs?.filter((d) => d.status !== 'same').length ?? 0
  const isRunning = running !== false

  return (
    <div className="space-y-4">
      {/* Prompt editors */}
      <div className="space-y-3">
        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium text-blue-600 dark:text-blue-400">Prompt A — original</p>
            <button
              onClick={() => setShowPromptA(!showPromptA)}
              className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              {showPromptA ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
              {showPromptA ? 'hide' : 'view'}
            </button>
          </div>
          {showPromptA && (
            <pre className="text-xs text-muted-foreground whitespace-pre-wrap bg-muted/40 rounded-md p-3 max-h-48 overflow-y-auto leading-relaxed">
              {promptA}
            </pre>
          )}
        </div>

        <div className="space-y-1">
          <p className="text-xs font-medium text-purple-600 dark:text-purple-400">Prompt B — modify this</p>
          <Textarea
            value={promptB}
            onChange={(e) => setPromptB(e.target.value)}
            disabled={isRunning}
            className="font-mono text-xs min-h-[140px] leading-relaxed"
          />
        </div>
      </div>

      <Separator />

      {/* Text input */}
      <div className="space-y-2">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Text to audit</p>
        <Textarea
          placeholder="Paste your text here..."
          value={text}
          onChange={(e) => setText(e.target.value)}
          className="min-h-[140px] font-mono text-sm"
          disabled={isRunning}
        />
        <div className="flex items-center justify-between">
          <p className="text-xs text-muted-foreground">{text.length > 0 ? `${text.length} characters` : ''}</p>
          <Button
            onClick={handleRun}
            disabled={!text.trim() || isRunning || !isModelReady}
            variant="outline"
          >
            {isRunning && running !== 'diff' ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Running {running === 'a' ? 'A' : 'B'}…
              </>
            ) : (
              <>
                <Play className="h-4 w-4 mr-2" />
                Run A then B
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Streaming */}
      {isRunning && running !== 'diff' && streamingText && (
        <div className="rounded-md border bg-muted/40 p-3 space-y-1">
          <p className="text-xs text-muted-foreground font-medium animate-pulse">
            Run {running === 'a' ? 'A' : 'B'} generating…
          </p>
          <pre className="text-xs text-muted-foreground whitespace-pre-wrap break-all max-h-32 overflow-y-auto">
            {streamingText}
          </pre>
        </div>
      )}

      {error && (
        <p className="text-xs text-destructive">{error}</p>
      )}

      {/* Results */}
      {results && diffs && summaries && (
        <div className="space-y-4">
          {/* Summary row */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between text-sm">
                <span>Comparison Results</span>
                <div className="flex gap-2">
                  {changedCount > 0 && (
                    <Badge variant="outline">{changedCount} difference{changedCount !== 1 ? 's' : ''}</Badge>
                  )}
                  {diffs.filter((d) => d.status === 'same').length > 0 && (
                    <Badge variant="outline" className="text-muted-foreground">
                      {diffs.filter((d) => d.status === 'same').length} same
                    </Badge>
                  )}
                </div>
              </CardTitle>
              <div className="grid grid-cols-2 gap-3 mt-1">
                <div className="space-y-0.5">
                  <p className="text-xs font-medium text-blue-600 dark:text-blue-400">A</p>
                  <p className="text-xs text-muted-foreground">{summaries.a}</p>
                </div>
                <div className="space-y-0.5">
                  <p className="text-xs font-medium text-purple-600 dark:text-purple-400">B</p>
                  <p className="text-xs text-muted-foreground">{summaries.b}</p>
                </div>
              </div>
            </CardHeader>
          </Card>

          {/* Diff cards */}
          {diffs.length > 0 ? (
            <div className="space-y-2">
              {diffs.filter((d) => d.status !== 'same').map((diff) => (
                <DiffCard key={diff.id} diff={diff} />
              ))}
              {diffs.filter((d) => d.status === 'same').length > 0 && (
                <p className="text-xs text-muted-foreground text-center pt-1">
                  + {diffs.filter((d) => d.status === 'same').length} unchanged checkpoint{diffs.filter((d) => d.status === 'same').length !== 1 ? 's' : ''}
                </p>
              )}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-4">No structured diff available for this audit type — see summaries above.</p>
          )}

          {/* Diff summary */}
          <div className="pt-1">
            {diffSummary ? (
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Sparkles className="h-4 w-4" />
                    What changed
                  </CardTitle>
                  <CardDescription>Model-generated summary of the differences</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm leading-relaxed">{diffSummary}</p>
                  <Button
                    onClick={handleDiffSummary}
                    variant="outline"
                    size="sm"
                    disabled={running === 'diff'}
                    className="mt-3"
                  >
                    {running === 'diff' ? (
                      <><Loader2 className="h-3 w-3 mr-1 animate-spin" />Running…</>
                    ) : (
                      'Re-run'
                    )}
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <Button
                onClick={handleDiffSummary}
                variant="outline"
                disabled={running === 'diff'}
                className="w-full"
              >
                {running === 'diff' ? (
                  <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Summarizing differences…</>
                ) : (
                  <><Sparkles className="h-4 w-4 mr-2" />What changed?</>
                )}
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
