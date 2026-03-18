import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { dimensions, type Severity, severityColors } from '@/lib/principles'
import { ClipboardList, ChevronDown, ChevronRight } from 'lucide-react'

type CheckStatus = 'unchecked' | Severity

interface CheckState {
  [checkpointId: string]: {
    status: CheckStatus
    note: string
  }
}

const statusOptions: { value: CheckStatus; label: string }[] = [
  { value: 'unchecked', label: '—' },
  { value: 'strength', label: 'Strength' },
  { value: 'note', label: 'Note' },
  { value: 'moderate', label: 'Moderate' },
  { value: 'significant', label: 'Significant' },
  { value: 'critical', label: 'Critical' },
]

export function ManualChecklist() {
  const [checks, setChecks] = useState<CheckState>({})
  const [expandedDimensions, setExpandedDimensions] = useState<Set<string>>(
    new Set(dimensions.map((d) => d.id))
  )

  const toggleDimension = (id: string) => {
    setExpandedDimensions((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const updateCheck = (
    checkpointId: string,
    field: 'status' | 'note',
    value: string
  ) => {
    setChecks((prev) => ({
      ...prev,
      [checkpointId]: {
        ...prev[checkpointId],
        status: prev[checkpointId]?.status ?? 'unchecked',
        note: prev[checkpointId]?.note ?? '',
        [field]: value,
      },
    }))
  }

  const checkedCount = Object.values(checks).filter(
    (c) => c.status !== 'unchecked'
  ).length
  const totalCheckpoints = dimensions.reduce(
    (sum, d) => sum + d.checkpoints.length,
    0
  )

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ClipboardList className="h-5 w-5" />
          Manual Principles Checklist
        </CardTitle>
        <CardDescription>
          Walk through each checkpoint yourself. This is the same rubric the AI
          uses — doing it manually builds deeper understanding of the principles.
          <span className="block mt-1 font-medium">
            {checkedCount}/{totalCheckpoints} checkpoints assessed
          </span>
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {dimensions.map((dimension) => {
          const isExpanded = expandedDimensions.has(dimension.id)
          return (
            <div key={dimension.id} className="space-y-2">
              <button
                onClick={() => toggleDimension(dimension.id)}
                className="flex items-center gap-2 w-full text-left hover:text-foreground text-muted-foreground transition-colors"
              >
                {isExpanded ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <ChevronRight className="h-4 w-4" />
                )}
                <span className="text-sm font-medium text-foreground">
                  {dimension.name}
                </span>
                <span className="text-xs">— {dimension.question}</span>
              </button>

              {isExpanded && (
                <div className="ml-6 space-y-3">
                  {dimension.checkpoints.map((checkpoint) => {
                    const check = checks[checkpoint.id]
                    const currentStatus = check?.status ?? 'unchecked'
                    return (
                      <div
                        key={checkpoint.id}
                        className="border rounded-md p-3 space-y-2"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <span className="font-mono text-xs text-muted-foreground">
                              {checkpoint.id}
                            </span>{' '}
                            <span className="text-sm font-medium">
                              {checkpoint.label}
                            </span>
                            <p className="text-xs text-muted-foreground mt-0.5">
                              {checkpoint.description}
                            </p>
                          </div>
                          <select
                            value={currentStatus}
                            onChange={(e) =>
                              updateCheck(
                                checkpoint.id,
                                'status',
                                e.target.value
                              )
                            }
                            className="text-xs border rounded px-2 py-1 bg-background shrink-0"
                          >
                            {statusOptions.map((opt) => (
                              <option key={opt.value} value={opt.value}>
                                {opt.label}
                              </option>
                            ))}
                          </select>
                        </div>
                        {currentStatus !== 'unchecked' && (
                          <div className="flex items-start gap-2">
                            <Badge
                              variant="secondary"
                              className={
                                severityColors[currentStatus as Severity]
                              }
                            >
                              {currentStatus}
                            </Badge>
                            <Textarea
                              placeholder="Your observation..."
                              value={check?.note ?? ''}
                              onChange={(e) =>
                                updateCheck(
                                  checkpoint.id,
                                  'note',
                                  e.target.value
                                )
                              }
                              className="text-xs min-h-[60px]"
                            />
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}

              <Separator />
            </div>
          )
        })}

        <div className="text-xs text-muted-foreground border-t pt-3 space-y-1">
          <p className="font-medium">Why manual?</p>
          <p>
            This checklist is the same rubric the AI model uses.
            Walking through it yourself may surface things a small language model would miss.
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
