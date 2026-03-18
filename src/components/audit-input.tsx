import { useState } from 'react'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Play, Loader2, AlertTriangle, ChevronDown, ChevronRight } from 'lucide-react'
import { AUDIT_EXAMPLES } from '@/lib/examples'

interface AuditInputProps {
  onSubmit: (text: string) => void
  isLoading: boolean
  isModelReady: boolean
  error?: string | null
  systemPrompt: string
}

function parseError(error: string): { message: string; hint?: string } {
  if (error.includes('ContextWindowSizeExceeded') || error.includes('context window size')) {
    const match = error.match(/number of prompt tokens: (\d+).*context window size: (\d+)/)
    const tokens = match ? `${match[1]} tokens — limit is ${match[2]}` : ''
    return {
      message: `Text too long for this model${tokens ? ` (${tokens})` : ''}.`,
      hint: 'The context window is shared between input and output — the audit prompt itself uses ~2k tokens, leaving limited space for your text. Try a shorter excerpt, or switch to Phi 3.5 Mini (8k total).',
    }
  }
  return { message: error }
}

export function AuditInput({ onSubmit, isLoading, isModelReady, error, systemPrompt }: AuditInputProps) {
  const [text, setText] = useState('')
  const [showPrompt, setShowPrompt] = useState(false)

  const handleSubmit = () => {
    if (text.trim() && !isLoading) {
      onSubmit(text.trim())
    }
  }

  const parsedError = error ? parseError(error) : null

  return (
    <Card>
      <CardHeader>
        <CardTitle>What would you like to examine?</CardTitle>
        <CardDescription>
          Paste any text involving AI — a product spec, a policy, a description
          of how you used AI, a reflection on an AI interaction, or even this
          tool's own description.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs text-muted-foreground">Try an example:</span>
          {AUDIT_EXAMPLES.map((ex) => (
            <button
              key={ex.id}
              onClick={() => setText(ex.text)}
              disabled={isLoading}
              className="text-xs px-2 py-1 rounded-md border border-dashed border-muted-foreground/40 text-muted-foreground hover:text-foreground hover:border-foreground transition-colors disabled:opacity-40"
              title={ex.hint}
            >
              {ex.label}
            </button>
          ))}
        </div>

        <Textarea
          placeholder="Paste your text here...

Examples:
• A description of how you used AI on a project
• A product spec for an AI-powered feature
• A policy about how your organization uses AI
• A reflection on an AI interaction you had
• Even this tool's own description!"
          value={text}
          onChange={(e) => setText(e.target.value)}
          className="min-h-[200px] font-mono text-sm"
          disabled={isLoading}
        />
        <div className="flex items-center justify-between gap-4">
          <p className="text-xs text-muted-foreground">
            {text.length > 0 ? `${text.length} characters` : ''}
          </p>
          <Button
            onClick={handleSubmit}
            disabled={!text.trim() || isLoading || !isModelReady}
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Running...
              </>
            ) : (
              <>
                <Play className="h-4 w-4 mr-2" />
                Run
              </>
            )}
          </Button>
        </div>

        {parsedError && (
          <div className="flex items-start gap-2 p-3 rounded-md bg-destructive/10 text-destructive text-sm">
            <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
            <div className="space-y-1">
              <p className="font-medium">{parsedError.message}</p>
              {parsedError.hint && (
                <p className="text-xs opacity-80">{parsedError.hint}</p>
              )}
            </div>
          </div>
        )}

        <div className="border-t pt-3">
          <button
            onClick={() => setShowPrompt(!showPrompt)}
            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            {showPrompt ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
            View system prompt
          </button>
          {showPrompt && (
            <pre className="mt-2 text-xs text-muted-foreground whitespace-pre-wrap bg-muted/40 rounded-md p-3 max-h-72 overflow-y-auto leading-relaxed">
              {systemPrompt}
            </pre>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
