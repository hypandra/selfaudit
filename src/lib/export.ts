import type { AnyAuditResult } from './audit'

export interface Annotation {
  stance: 'agree' | 'disagree' | null
  note: string
}

export interface ExportContext {
  inputText: string
  prediction: string
  postReflection: string
  modelId: string
}

function severityLine(severity: string) {
  return `**Severity:** ${severity}`
}

function annotationLines(ann: Annotation | undefined): string[] {
  if (!ann) return []
  const lines: string[] = []
  if (ann.stance) lines.push(`**Your stance:** ${ann.stance}`)
  if (ann.note.trim()) lines.push(`**Your note:** ${ann.note}`)
  return lines
}

function contextSection(ctx: ExportContext): string[] {
  const lines: string[] = []

  lines.push('## Text audited', '', '```', ctx.inputText, '```', '')

  if (ctx.prediction.trim()) {
    lines.push('## Your prediction (before seeing results)', '', ctx.prediction, '')
  }

  lines.push(`**Model:** ${ctx.modelId}`, '')

  return lines
}

function reflectionSection(ctx: ExportContext): string[] {
  if (!ctx.postReflection.trim()) return []
  return ['## Your reflection (after seeing results)', '', ctx.postReflection, '']
}

export function toMarkdown(
  result: AnyAuditResult,
  annotations: Record<number, Annotation> = {},
  ctx?: ExportContext
): string {
  const lines: string[] = []

  switch (result.type) {
    case 'principles': {
      const d = result.data
      lines.push('# Self-Audit: Principles Audit', '')
      if (ctx) lines.push(...contextSection(ctx))
      lines.push('## Summary', d.summary, '')
      lines.push('## Findings', '')
      d.findings.forEach((f, i) => {
        lines.push(`### ${f.checkpointId}`)
        lines.push(severityLine(f.severity), '')
        lines.push(f.observation, '')
        lines.push(`*${f.recommendation}*`, '')
        lines.push(...annotationLines(annotations[i]))
        if (annotationLines(annotations[i]).length) lines.push('')
      })
      lines.push('## Self-Reflection', d.selfReflection, '')
      lines.push('## How Self-Audit performs', d.metaNote, '')
      if (ctx) lines.push(...reflectionSection(ctx))
      break
    }

    case 'handoff': {
      const d = result.data
      lines.push('# Self-Audit: Handoff Analysis', '')
      if (ctx) lines.push(...contextSection(ctx))
      lines.push('## Summary', d.summary, '')
      lines.push('## Handoffs', '')
      d.handoffs.forEach((h, i) => {
        lines.push(`### ${h.function}`)
        lines.push(`- **From human:** ${h.fromHuman}`)
        lines.push(`- **To machine:** ${h.toMachine}`)
        lines.push(`- **Cost bearer:** ${h.costBearer}`)
        lines.push(`- **Reversible:** ${h.reversible}`)
        lines.push(`- **Evidence:** *${h.observation}*`, '')
        lines.push(...annotationLines(annotations[i]))
        if (annotationLines(annotations[i]).length) lines.push('')
      })
      lines.push('## Self-Reflection', d.selfReflection, '')
      if (ctx) lines.push(...reflectionSection(ctx))
      break
    }

    case 'competency': {
      const d = result.data
      lines.push('# Self-Audit: Competency Cultivation', '')
      if (ctx) lines.push(...contextSection(ctx))
      lines.push('## Summary', d.summary, '')
      lines.push('## Findings', '')
      d.findings.forEach((f, i) => {
        lines.push(`### ${f.checkpointId}`)
        lines.push(severityLine(f.severity), '')
        lines.push(f.observation, '')
        lines.push(`*${f.recommendation}*`, '')
        lines.push(...annotationLines(annotations[i]))
        if (annotationLines(annotations[i]).length) lines.push('')
      })
      lines.push('## Self-Reflection', d.selfReflection, '')
      if (ctx) lines.push(...reflectionSection(ctx))
      break
    }

    case 'redflags': {
      const d = result.data
      lines.push('# Self-Audit: Red Flags Scan', '')
      if (ctx) lines.push(...contextSection(ctx))
      lines.push('## Summary', d.summary, '')
      lines.push(`**Overall concern:** ${d.overallConcern}`, '')
      lines.push('## Flags', '')
      d.flags.forEach((f, i) => {
        lines.push(`### ${f.id}: ${f.label}`)
        lines.push(`- **Present:** ${f.present}`)
        lines.push(`- **Severity:** ${f.severity}`)
        lines.push(`- **Evidence:** *${f.evidence}*`, '')
        lines.push(...annotationLines(annotations[i]))
        if (annotationLines(annotations[i]).length) lines.push('')
      })
      lines.push('## Self-Reflection', d.selfReflection, '')
      if (ctx) lines.push(...reflectionSection(ctx))
      break
    }

    case 'values': {
      const d = result.data
      lines.push('# Self-Audit: Value Concerns', '')
      if (ctx) lines.push(...contextSection(ctx))
      lines.push('## Summary', d.summary, '')
      const dims = [
        { label: 'Accountability', dim: d.accountability },
        { label: 'Autonomy', dim: d.autonomy },
        { label: 'Distribution', dim: d.distribution },
        { label: 'Power', dim: d.power },
      ]
      dims.forEach(({ label, dim }) => {
        lines.push(`## ${label}`)
        lines.push(`**Assessment:** ${dim.assessment}`, '')
        lines.push(dim.observation, '')
        lines.push(`*${dim.recommendation}*`, '')
      })
      lines.push('## Self-Reflection', d.selfReflection, '')
      if (ctx) lines.push(...reflectionSection(ctx))
      break
    }
  }

  return lines.join('\n')
}

export function downloadJSON(
  result: AnyAuditResult,
  annotations: Record<number, Annotation> = {},
  ctx?: ExportContext
) {
  const payload = {
    auditType: result.type,
    ...(ctx ? { inputText: ctx.inputText, model: ctx.modelId, prediction: ctx.prediction, postReflection: ctx.postReflection } : {}),
    result: result.data,
    annotations,
  }
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `self-audit-${result.type}-${Date.now()}.json`
  a.click()
  URL.revokeObjectURL(url)
}

export async function copyMarkdown(
  result: AnyAuditResult,
  annotations: Record<number, Annotation> = {},
  ctx?: ExportContext
): Promise<void> {
  await navigator.clipboard.writeText(toMarkdown(result, annotations, ctx))
}
