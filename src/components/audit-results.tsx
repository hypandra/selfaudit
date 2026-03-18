import { useState, useMemo, useCallback } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import {
  AlertTriangle,
  Eye,
  Brain,
  RotateCcw,
  Loader2,
  Code,
  ArrowLeftRight,
  GraduationCap,
  Flag,
  Scale,
  CheckCircle,
  XCircle,
  HelpCircle,
  ThumbsUp,
  ThumbsDown,
  MessageSquare,
  Copy,
  Download,
  Check,
} from 'lucide-react'
import { dimensions, severityColors, type AuditResult, type Finding, type Severity } from '@/lib/principles'
import type {
  MetaAuditResult,
  AnyAuditResult,
  HandoffAuditResult,
  CompetencyAuditResult,
  RedFlagsAuditResult,
  ValueConcernsResult,
  ValueDimension,
} from '@/lib/audit'
import { type Annotation, type ExportContext, copyMarkdown, downloadJSON } from '@/lib/export'

interface AuditResultsProps {
  result: AnyAuditResult
  systemPrompt: string
  exportContext?: ExportContext
  metaResult: MetaAuditResult | null
  onMetaAudit: () => void
  isMetaAuditing: boolean
}

// ─── Shared ────────────────────────────────────────────────────────────────────

function SeverityBadge({ severity }: { severity: Severity }) {
  return (
    <Badge variant="secondary" className={severityColors[severity]}>
      {severity}
    </Badge>
  )
}

const qualityColors: Record<string, string> = {
  strong: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
  adequate: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
  weak: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300',
  generic: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
}

function SelfReflectionCard({ text }: { text: string }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm flex items-center gap-2">
          <Eye className="h-4 w-4" />
          Self-Reflection
        </CardTitle>
        <CardDescription>The model's stated assessment of its own analysis limitations</CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-sm leading-relaxed">{text}</p>
      </CardContent>
    </Card>
  )
}

function PromptCard({ systemPrompt }: { systemPrompt: string }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm flex items-center gap-2">
          <Code className="h-4 w-4" />
          System Prompt
        </CardTitle>
        <CardDescription>The exact instructions sent to the model for this audit type.</CardDescription>
      </CardHeader>
      <CardContent>
        <pre className="text-xs text-muted-foreground whitespace-pre-wrap bg-muted/40 rounded-md p-3 max-h-96 overflow-y-auto leading-relaxed">
          {systemPrompt}
        </pre>
      </CardContent>
    </Card>
  )
}

function MetaAuditCard({
  metaResult,
  onMetaAudit,
  isMetaAuditing,
}: {
  metaResult: MetaAuditResult | null
  onMetaAudit: () => void
  isMetaAuditing: boolean
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm flex items-center gap-2">
          <Brain className="h-4 w-4" />
          Audit the Audit
        </CardTitle>
        <CardDescription>
          Use the same AI to evaluate the quality of its own audit. This is recursive self-examination — the HAIPness loop.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {metaResult ? (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">Overall Quality:</span>
              <Badge variant="secondary" className={qualityColors[metaResult.overallQuality] ?? ''}>
                {metaResult.overallQuality}
              </Badge>
            </div>
            <div className="space-y-3">
              {[
                { label: 'Specificity', value: metaResult.specificity },
                { label: 'Missed Issues', value: metaResult.missedIssues },
                { label: 'Self-Reflection Quality', value: metaResult.selfReflectionQuality },
                { label: 'Recommendation', value: metaResult.recommendation, bold: true },
              ].map(({ label, value, bold }) => (
                <div key={label}>
                  <h5 className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">{label}</h5>
                  <p className={`text-sm ${bold ? 'font-medium' : ''}`}>{value}</p>
                </div>
              ))}
              <Separator />
              <div>
                <h5 className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">Meta-Meta Note</h5>
                <p className="text-sm text-muted-foreground italic">{metaResult.metaMetaNote}</p>
              </div>
            </div>
            <Button onClick={onMetaAudit} variant="outline" size="sm" disabled={isMetaAuditing}>
              <RotateCcw className="h-3 w-3 mr-1" />
              Re-run meta-audit
            </Button>
          </div>
        ) : (
          <Button onClick={onMetaAudit} variant="outline" disabled={isMetaAuditing}>
            {isMetaAuditing ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Running meta-audit...
              </>
            ) : (
              <>
                <Brain className="h-4 w-4 mr-2" />
                Audit the Audit
              </>
            )}
          </Button>
        )}
      </CardContent>
    </Card>
  )
}

// ─── Annotation ────────────────────────────────────────────────────────────────

function AnnotationTrigger({
  annotation,
  open,
  onToggle,
}: {
  annotation: Annotation
  open: boolean
  onToggle: () => void
}) {
  const dotColor =
    annotation.stance === 'agree'
      ? 'bg-green-500'
      : annotation.stance === 'disagree'
      ? 'bg-red-400'
      : annotation.note.trim()
      ? 'bg-blue-400'
      : null

  return (
    <button
      onClick={onToggle}
      title="Annotate"
      className={`relative flex items-center justify-center h-6 w-6 rounded-md transition-colors ${
        open
          ? 'text-foreground bg-muted'
          : dotColor
          ? 'text-foreground'
          : 'text-muted-foreground/30 hover:text-muted-foreground hover:bg-muted'
      }`}
    >
      <MessageSquare className="h-3.5 w-3.5" />
      {dotColor && (
        <span className={`absolute top-0.5 right-0.5 h-1.5 w-1.5 rounded-full ${dotColor}`} />
      )}
    </button>
  )
}

function AnnotationPanel({
  annotation,
  onChange,
}: {
  annotation: Annotation
  onChange: (ann: Annotation) => void
}) {
  const setStance = (stance: 'agree' | 'disagree') => {
    onChange({ ...annotation, stance: annotation.stance === stance ? null : stance })
  }

  return (
    <div className="mt-2 pt-2 border-t space-y-2">
      <div className="flex items-center gap-2">
        <button
          onClick={() => setStance('agree')}
          className={`flex items-center gap-1 text-xs px-2 py-1 rounded-md border transition-colors ${
            annotation.stance === 'agree'
              ? 'border-green-500 bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400'
              : 'border-border text-muted-foreground hover:text-foreground'
          }`}
        >
          <ThumbsUp className="h-3 w-3" />
          Agree
        </button>
        <button
          onClick={() => setStance('disagree')}
          className={`flex items-center gap-1 text-xs px-2 py-1 rounded-md border transition-colors ${
            annotation.stance === 'disagree'
              ? 'border-red-400 bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400'
              : 'border-border text-muted-foreground hover:text-foreground'
          }`}
        >
          <ThumbsDown className="h-3 w-3" />
          Disagree
        </button>
      </div>
      <textarea
        value={annotation.note}
        onChange={(e) => onChange({ ...annotation, note: e.target.value })}
        placeholder="Your thoughts..."
        className="w-full text-xs rounded-md border border-input bg-background px-3 py-2 leading-relaxed resize-none focus:outline-none focus:ring-1 focus:ring-ring"
        rows={2}
      />
    </div>
  )
}

// ─── Export bar ────────────────────────────────────────────────────────────────

function ExportBar({
  result,
  annotations,
}: {
  result: AnyAuditResult
  annotations: Record<number, Annotation>
}) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    try {
      await copyMarkdown(result, annotations)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Clipboard API unavailable — fall back to download
      downloadJSON(result, annotations)
    }
  }

  const handleDownload = () => {
    downloadJSON(result, annotations)
  }

  return (
    <div className="flex items-center gap-2 pt-1">
      <Button variant="outline" size="sm" onClick={handleCopy}>
        {copied ? (
          <>
            <Check className="h-3 w-3 mr-1 text-green-600" />
            Copied
          </>
        ) : (
          <>
            <Copy className="h-3 w-3 mr-1" />
            Copy as Markdown
          </>
        )}
      </Button>
      <Button variant="outline" size="sm" onClick={handleDownload}>
        <Download className="h-3 w-3 mr-1" />
        Download JSON
      </Button>
    </div>
  )
}

// ─── Principles View ───────────────────────────────────────────────────────────

function FindingCard({
  finding,
  index,
  annotation,
  onAnnotate,
}: {
  finding: Finding
  index: number
  annotation: Annotation
  onAnnotate: (i: number, ann: Annotation) => void
}) {
  const [open, setOpen] = useState(false)
  const checkpoint = dimensions.flatMap((d) => d.checkpoints).find((c) => c.id === finding.checkpointId)
  const dimension = dimensions.find((d) => d.checkpoints.some((c) => c.id === finding.checkpointId))

  return (
    <div className="border rounded-lg p-4 space-y-2">
      <div className="flex items-start justify-between gap-2">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs text-muted-foreground">{finding.checkpointId}</span>
            <span className="text-sm font-medium">{checkpoint?.label ?? finding.checkpointId}</span>
          </div>
          {dimension && <p className="text-xs text-muted-foreground">{dimension.name}</p>}
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <SeverityBadge severity={finding.severity} />
          <AnnotationTrigger annotation={annotation} open={open} onToggle={() => setOpen(!open)} />
        </div>
      </div>
      <p className="text-sm">{finding.observation}</p>
      <p className="text-sm text-muted-foreground italic">{finding.recommendation}</p>
      {!open && !annotation.stance && (
        <button
          onClick={() => setOpen(true)}
          className="text-xs text-muted-foreground/50 hover:text-foreground transition-colors"
        >
          Agree or disagree?
        </button>
      )}
      {open && <AnnotationPanel annotation={annotation} onChange={(ann) => onAnnotate(index, ann)} />}
    </div>
  )
}

function PrinciplesResults({
  result,
  systemPrompt,
  metaResult,
  onMetaAudit,
  isMetaAuditing,
  annotations,
  onAnnotate,
}: {
  result: AuditResult
  systemPrompt: string
  metaResult: MetaAuditResult | null
  onMetaAudit: () => void
  isMetaAuditing: boolean
  annotations: Record<number, Annotation>
  onAnnotate: (i: number, ann: Annotation) => void
}) {
  const criticalCount = result.findings.filter((f) => f.severity === 'critical').length
  const strengthCount = result.findings.filter((f) => f.severity === 'strength').length

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Audit Results</span>
            <div className="flex gap-2 flex-wrap">
              {criticalCount > 0 && <Badge variant="destructive">{criticalCount} critical</Badge>}
              {strengthCount > 0 && (
                <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300">
                  {strengthCount} strength{strengthCount !== 1 ? 's' : ''}
                </Badge>
              )}
              <Badge variant="outline">{result.findings.length} finding{result.findings.length !== 1 ? 's' : ''}</Badge>
            </div>
          </CardTitle>
          <CardDescription>{result.summary}</CardDescription>
        </CardHeader>
      </Card>

      <Tabs defaultValue="findings">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="findings" className="flex items-center gap-1">
            <AlertTriangle className="h-3 w-3" />
            Findings
          </TabsTrigger>
          <TabsTrigger value="reflection" className="flex items-center gap-1">
            <Eye className="h-3 w-3" />
            Reflection
          </TabsTrigger>
          <TabsTrigger value="meta" className="flex items-center gap-1">
            <Brain className="h-3 w-3" />
            Meta
          </TabsTrigger>
          <TabsTrigger value="prompt" className="flex items-center gap-1">
            <Code className="h-3 w-3" />
            Prompt
          </TabsTrigger>
        </TabsList>

        <TabsContent value="findings" className="space-y-3 mt-4">
          {result.findings.map((finding, i) => (
            <FindingCard
              key={i}
              finding={finding}
              index={i}
              annotation={annotations[i] ?? { stance: null, note: '' }}
              onAnnotate={onAnnotate}
            />
          ))}
        </TabsContent>

        <TabsContent value="reflection" className="mt-4 space-y-4">
          <SelfReflectionCard text={result.selfReflection} />
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">How does Self-Audit itself perform?</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground leading-relaxed">{result.metaNote}</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="meta" className="mt-4">
          <MetaAuditCard metaResult={metaResult} onMetaAudit={onMetaAudit} isMetaAuditing={isMetaAuditing} />
        </TabsContent>

        <TabsContent value="prompt" className="mt-4">
          <PromptCard systemPrompt={systemPrompt} />
        </TabsContent>
      </Tabs>
    </div>
  )
}

// ─── Annotatable item cards ────────────────────────────────────────────────────

function HandoffItemCard({
  h,
  index,
  annotation,
  onAnnotate,
}: {
  h: HandoffAuditResult['handoffs'][number]
  index: number
  annotation: Annotation
  onAnnotate: (i: number, ann: Annotation) => void
}) {
  const [open, setOpen] = useState(false)
  return (
    <div className="border rounded-lg p-4 space-y-3">
      <div className="flex items-start justify-between gap-2">
        <div className="font-medium text-sm">{h.function}</div>
        <AnnotationTrigger annotation={annotation} open={open} onToggle={() => setOpen(!open)} />
      </div>
      <div className="grid grid-cols-2 gap-3 text-xs">
        <div>
          <p className="text-muted-foreground font-medium mb-0.5">From human</p>
          <p>{h.fromHuman}</p>
        </div>
        <div>
          <p className="text-muted-foreground font-medium mb-0.5">To machine</p>
          <p>{h.toMachine}</p>
        </div>
        <div>
          <p className="text-muted-foreground font-medium mb-0.5">Cost bearer</p>
          <p>{h.costBearer}</p>
        </div>
        <div>
          <p className="text-muted-foreground font-medium mb-0.5">Reversible?</p>
          <p>{h.reversible}</p>
        </div>
      </div>
      <p className="text-xs text-muted-foreground italic border-t pt-2">{h.observation}</p>
      {open && <AnnotationPanel annotation={annotation} onChange={(ann) => onAnnotate(index, ann)} />}
    </div>
  )
}

function CompetencyFindingCard({
  f,
  index,
  annotation,
  onAnnotate,
}: {
  f: CompetencyAuditResult['findings'][number]
  index: number
  annotation: Annotation
  onAnnotate: (i: number, ann: Annotation) => void
}) {
  const [open, setOpen] = useState(false)
  return (
    <div className="border rounded-lg p-4 space-y-2">
      <div className="flex items-start justify-between gap-2">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs text-muted-foreground">{f.checkpointId}</span>
            <span className="text-sm font-medium">{CC_LABELS[f.checkpointId] ?? f.checkpointId}</span>
          </div>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <SeverityBadge severity={f.severity} />
          <AnnotationTrigger annotation={annotation} open={open} onToggle={() => setOpen(!open)} />
        </div>
      </div>
      <p className="text-sm">{f.observation}</p>
      <p className="text-sm text-muted-foreground italic">{f.recommendation}</p>
      {open && <AnnotationPanel annotation={annotation} onChange={(ann) => onAnnotate(index, ann)} />}
    </div>
  )
}

function RedFlagCard({
  flag,
  index,
  annotation,
  onAnnotate,
}: {
  flag: RedFlagsAuditResult['flags'][number]
  index: number
  annotation: Annotation
  onAnnotate: (i: number, ann: Annotation) => void
}) {
  const [open, setOpen] = useState(false)
  return (
    <div className="border rounded-lg p-4 space-y-2">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <PresentIcon present={flag.present} />
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs text-muted-foreground">{flag.id}</span>
            <span className="text-sm font-medium">{flag.label}</span>
          </div>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <Badge variant="secondary" className={presentColors[flag.present]}>
            {flag.present}
          </Badge>
          {flag.severity !== 'none' && <SeverityBadge severity={flag.severity as Severity} />}
          <AnnotationTrigger annotation={annotation} open={open} onToggle={() => setOpen(!open)} />
        </div>
      </div>
      <p className="text-sm text-muted-foreground italic pl-6">{flag.evidence}</p>
      {open && <AnnotationPanel annotation={annotation} onChange={(ann) => onAnnotate(index, ann)} />}
    </div>
  )
}

// ─── Handoff View ──────────────────────────────────────────────────────────────

function HandoffResults({
  result,
  systemPrompt,
  annotations,
  onAnnotate,
}: {
  result: HandoffAuditResult
  systemPrompt: string
  annotations: Record<number, Annotation>
  onAnnotate: (i: number, ann: Annotation) => void
}) {
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ArrowLeftRight className="h-4 w-4" />
            Handoff Analysis
          </CardTitle>
          <CardDescription>{result.summary}</CardDescription>
        </CardHeader>
      </Card>

      <Tabs defaultValue="handoffs">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="handoffs">Handoffs ({result.handoffs.length})</TabsTrigger>
          <TabsTrigger value="reflection" className="flex items-center gap-1">
            <Eye className="h-3 w-3" />
            Reflection
          </TabsTrigger>
          <TabsTrigger value="prompt" className="flex items-center gap-1">
            <Code className="h-3 w-3" />
            Prompt
          </TabsTrigger>
        </TabsList>

        <TabsContent value="handoffs" className="space-y-3 mt-4">
          {result.handoffs.map((h, i) => {
            const ann = annotations[i] ?? { stance: null, note: '' }
            return <HandoffItemCard key={i} h={h} index={i} annotation={ann} onAnnotate={onAnnotate} />
          })}
        </TabsContent>

        <TabsContent value="reflection" className="mt-4">
          <SelfReflectionCard text={result.selfReflection} />
        </TabsContent>

        <TabsContent value="prompt" className="mt-4">
          <PromptCard systemPrompt={systemPrompt} />
        </TabsContent>
      </Tabs>
    </div>
  )
}

// ─── Competency View ───────────────────────────────────────────────────────────

const CC_LABELS: Record<string, string> = {
  CC1: 'Visibility',
  CC2: 'Human Judgment Space',
  CC3: 'Skill Transfer',
  CC4: 'Output Interrogation',
  CC5: 'Graceful Degradation',
}

function CompetencyResults({
  result,
  systemPrompt,
  annotations,
  onAnnotate,
}: {
  result: CompetencyAuditResult
  systemPrompt: string
  annotations: Record<number, Annotation>
  onAnnotate: (i: number, ann: Annotation) => void
}) {
  const criticalCount = result.findings.filter((f) => f.severity === 'critical').length
  const strengthCount = result.findings.filter((f) => f.severity === 'strength').length

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <GraduationCap className="h-4 w-4" />
              Competency Cultivation
            </div>
            <div className="flex gap-2 flex-wrap">
              {criticalCount > 0 && <Badge variant="destructive">{criticalCount} critical</Badge>}
              {strengthCount > 0 && (
                <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300">
                  {strengthCount} strength{strengthCount !== 1 ? 's' : ''}
                </Badge>
              )}
              <Badge variant="outline">{result.findings.length} finding{result.findings.length !== 1 ? 's' : ''}</Badge>
            </div>
          </CardTitle>
          <CardDescription>{result.summary}</CardDescription>
        </CardHeader>
      </Card>

      <Tabs defaultValue="findings">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="findings">Findings</TabsTrigger>
          <TabsTrigger value="reflection" className="flex items-center gap-1">
            <Eye className="h-3 w-3" />
            Reflection
          </TabsTrigger>
          <TabsTrigger value="prompt" className="flex items-center gap-1">
            <Code className="h-3 w-3" />
            Prompt
          </TabsTrigger>
        </TabsList>

        <TabsContent value="findings" className="space-y-3 mt-4">
          {result.findings.map((f, i) => {
            const ann = annotations[i] ?? { stance: null, note: '' }
            return <CompetencyFindingCard key={i} f={f} index={i} annotation={ann} onAnnotate={onAnnotate} />
          })}
        </TabsContent>

        <TabsContent value="reflection" className="mt-4">
          <SelfReflectionCard text={result.selfReflection} />
        </TabsContent>

        <TabsContent value="prompt" className="mt-4">
          <PromptCard systemPrompt={systemPrompt} />
        </TabsContent>
      </Tabs>
    </div>
  )
}

// ─── Red Flags View ────────────────────────────────────────────────────────────

const presentColors = {
  yes: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
  no: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
  maybe: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
}

const PresentIcon = ({ present }: { present: 'yes' | 'no' | 'maybe' }) => {
  if (present === 'yes') return <XCircle className="h-4 w-4 text-red-500" />
  if (present === 'no') return <CheckCircle className="h-4 w-4 text-green-500" />
  return <HelpCircle className="h-4 w-4 text-yellow-500" />
}

function RedFlagsResults({
  result,
  systemPrompt,
  annotations,
  onAnnotate,
}: {
  result: RedFlagsAuditResult
  systemPrompt: string
  annotations: Record<number, Annotation>
  onAnnotate: (i: number, ann: Annotation) => void
}) {
  const flaggedCount = result.flags.filter((f) => f.present === 'yes').length
  const maybeCount = result.flags.filter((f) => f.present === 'maybe').length

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Flag className="h-4 w-4" />
              Red Flags Scan
            </div>
            <div className="flex gap-2">
              {flaggedCount > 0 && <Badge variant="destructive">{flaggedCount} flagged</Badge>}
              {maybeCount > 0 && (
                <Badge variant="secondary" className={presentColors.maybe}>
                  {maybeCount} maybe
                </Badge>
              )}
              <Badge
                variant="secondary"
                className={
                  result.overallConcern === 'yes'
                    ? presentColors.yes
                    : result.overallConcern === 'maybe'
                    ? presentColors.maybe
                    : presentColors.no
                }
              >
                Overall: {result.overallConcern}
              </Badge>
            </div>
          </CardTitle>
          <CardDescription>{result.summary}</CardDescription>
        </CardHeader>
      </Card>

      <Tabs defaultValue="flags">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="flags">Flags</TabsTrigger>
          <TabsTrigger value="reflection" className="flex items-center gap-1">
            <Eye className="h-3 w-3" />
            Reflection
          </TabsTrigger>
          <TabsTrigger value="prompt" className="flex items-center gap-1">
            <Code className="h-3 w-3" />
            Prompt
          </TabsTrigger>
        </TabsList>

        <TabsContent value="flags" className="space-y-3 mt-4">
          {result.flags.map((flag, i) => {
            const ann = annotations[i] ?? { stance: null, note: '' }
            return <RedFlagCard key={i} flag={flag} index={i} annotation={ann} onAnnotate={onAnnotate} />
          })}
        </TabsContent>

        <TabsContent value="reflection" className="mt-4">
          <SelfReflectionCard text={result.selfReflection} />
        </TabsContent>

        <TabsContent value="prompt" className="mt-4">
          <PromptCard systemPrompt={systemPrompt} />
        </TabsContent>
      </Tabs>
    </div>
  )
}

// ─── Value Concerns View ───────────────────────────────────────────────────────

const assessmentColors = {
  concern: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
  minor: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
  none: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
}

function ValueDimensionCard({ label, dim }: { label: string; dim: ValueDimension }) {
  return (
    <div className="border rounded-lg p-4 space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">{label}</span>
        <Badge variant="secondary" className={assessmentColors[dim.assessment]}>
          {dim.assessment}
        </Badge>
      </div>
      <p className="text-sm">{dim.observation}</p>
      <p className="text-sm text-muted-foreground italic">{dim.recommendation}</p>
    </div>
  )
}

function ValuesResults({ result, systemPrompt }: { result: ValueConcernsResult; systemPrompt: string }) {
  const concernCount = [result.accountability, result.autonomy, result.distribution, result.power].filter(
    (d) => d.assessment === 'concern'
  ).length

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Scale className="h-4 w-4" />
              Value Concerns
            </div>
            {concernCount > 0 && <Badge variant="destructive">{concernCount} concern{concernCount !== 1 ? 's' : ''}</Badge>}
          </CardTitle>
          <CardDescription>{result.summary}</CardDescription>
        </CardHeader>
      </Card>

      <Tabs defaultValue="dimensions">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="dimensions">Dimensions</TabsTrigger>
          <TabsTrigger value="reflection" className="flex items-center gap-1">
            <Eye className="h-3 w-3" />
            Reflection
          </TabsTrigger>
          <TabsTrigger value="prompt" className="flex items-center gap-1">
            <Code className="h-3 w-3" />
            Prompt
          </TabsTrigger>
        </TabsList>

        <TabsContent value="dimensions" className="space-y-3 mt-4">
          <ValueDimensionCard label="Accountability" dim={result.accountability} />
          <ValueDimensionCard label="Autonomy" dim={result.autonomy} />
          <ValueDimensionCard label="Distribution" dim={result.distribution} />
          <ValueDimensionCard label="Power" dim={result.power} />
        </TabsContent>

        <TabsContent value="reflection" className="mt-4">
          <SelfReflectionCard text={result.selfReflection} />
        </TabsContent>

        <TabsContent value="prompt" className="mt-4">
          <PromptCard systemPrompt={systemPrompt} />
        </TabsContent>
      </Tabs>
    </div>
  )
}

// ─── Router ────────────────────────────────────────────────────────────────────

export function AuditResults({ result, systemPrompt, metaResult, onMetaAudit, isMetaAuditing }: AuditResultsProps) {
  // Derive a stable key from the result to reset annotations when result changes
  const resultKey = useMemo(() => JSON.stringify(result.data).slice(0, 100), [result])
  const [annotations, setAnnotations] = useState<Record<number, Annotation>>({})
  const [prevKey, setPrevKey] = useState(resultKey)
  if (prevKey !== resultKey) {
    setPrevKey(resultKey)
    setAnnotations({})
  }

  const handleAnnotate = useCallback((index: number, ann: Annotation) => {
    setAnnotations((prev) => ({ ...prev, [index]: ann }))
  }, [])

  return (
    <div className="space-y-4">
      {result.type === 'principles' && (
        <PrinciplesResults
          result={result.data}
          systemPrompt={systemPrompt}
          metaResult={metaResult}
          onMetaAudit={onMetaAudit}
          isMetaAuditing={isMetaAuditing}
          annotations={annotations}
          onAnnotate={handleAnnotate}
        />
      )}
      {result.type === 'handoff' && (
        <HandoffResults
          result={result.data}
          systemPrompt={systemPrompt}
          annotations={annotations}
          onAnnotate={handleAnnotate}
        />
      )}
      {result.type === 'competency' && (
        <CompetencyResults
          result={result.data}
          systemPrompt={systemPrompt}
          annotations={annotations}
          onAnnotate={handleAnnotate}
        />
      )}
      {result.type === 'redflags' && (
        <RedFlagsResults
          result={result.data}
          systemPrompt={systemPrompt}
          annotations={annotations}
          onAnnotate={handleAnnotate}
        />
      )}
      {result.type === 'values' && (
        <ValuesResults result={result.data} systemPrompt={systemPrompt} />
      )}

      <ExportBar result={result} annotations={annotations} />
    </div>
  )
}
