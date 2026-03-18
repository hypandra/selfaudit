import type { AnyAuditResult } from './audit'

export type DiffStatus = 'only-a' | 'only-b' | 'same' | 'changed'

export interface FindingDiff {
  id: string
  label: string
  status: DiffStatus
  a?: { severity: string; observation: string; recommendation: string }
  b?: { severity: string; observation: string; recommendation: string }
}

interface NormalizedFinding {
  id: string
  label: string
  severity: string
  observation: string
  recommendation: string
}

function extractFindings(result: AnyAuditResult): NormalizedFinding[] | null {
  switch (result.type) {
    case 'principles':
      return result.data.findings.map((f) => ({
        id: f.checkpointId,
        label: f.checkpointId,
        severity: f.severity,
        observation: f.observation,
        recommendation: f.recommendation,
      }))
    case 'competency':
      return result.data.findings.map((f) => ({
        id: f.checkpointId,
        label: f.checkpointId,
        severity: f.severity,
        observation: f.observation,
        recommendation: f.recommendation,
      }))
    case 'redflags':
      return result.data.flags.map((f) => ({
        id: f.id,
        label: `${f.id}: ${f.label}`,
        severity: f.severity,
        observation: f.evidence,
        recommendation: f.present,
      }))
    default:
      return null
  }
}

const diffOrder: Record<DiffStatus, number> = {
  'changed': 0,
  'only-a': 1,
  'only-b': 2,
  same: 3,
}

export function diffResults(a: AnyAuditResult, b: AnyAuditResult): FindingDiff[] | null {
  const findingsA = extractFindings(a)
  const findingsB = extractFindings(b)
  if (!findingsA || !findingsB) return null

  const mapA = new Map(findingsA.map((f) => [f.id, f]))
  const mapB = new Map(findingsB.map((f) => [f.id, f]))
  const allIds = new Set([...mapA.keys(), ...mapB.keys()])

  const diffs: FindingDiff[] = []
  for (const id of allIds) {
    const fa = mapA.get(id)
    const fb = mapB.get(id)
    if (fa && fb) {
      const severitySame = fa.severity === fb.severity
      const observationSame = fa.observation === fb.observation
      diffs.push({
        id,
        label: fa.label,
        status: severitySame && observationSame ? 'same' : 'changed',
        a: { severity: fa.severity, observation: fa.observation, recommendation: fa.recommendation },
        b: { severity: fb.severity, observation: fb.observation, recommendation: fb.recommendation },
      })
    } else if (fa) {
      diffs.push({
        id,
        label: fa.label,
        status: 'only-a',
        a: { severity: fa.severity, observation: fa.observation, recommendation: fa.recommendation },
      })
    } else if (fb) {
      diffs.push({
        id,
        label: fb.label,
        status: 'only-b',
        b: { severity: fb.severity, observation: fb.observation, recommendation: fb.recommendation },
      })
    }
  }

  return diffs.sort((x, y) => diffOrder[x.status] - diffOrder[y.status])
}

export function getSummaries(a: AnyAuditResult, b: AnyAuditResult): { a: string; b: string } {
  const getSummary = (r: AnyAuditResult): string => {
    switch (r.type) {
      case 'principles':
      case 'competency':
      case 'redflags':
        return (r.data as { summary: string }).summary
      case 'handoff':
        return r.data.summary
      case 'values':
        return r.data.summary
    }
  }
  return { a: getSummary(a), b: getSummary(b) }
}
