import { jsonrepair } from 'jsonrepair'
import { runInference, type EngineStatus } from './engine'
import type { AuditResult } from './principles'
import {
  META_AUDIT_SYSTEM_PROMPT,
  META_AUDIT_USER_PROMPT,
  META_AUDIT_JSON_SCHEMA,
  DIFF_SUMMARY_SYSTEM_PROMPT,
  DIFF_SUMMARY_USER_PROMPT,
  getPromptConfig,
  type AuditType,
} from './prompts'
import { diffResults, getSummaries } from './diff'

export type { AuditType }

export interface MetaAuditResult {
  overallQuality: 'strong' | 'adequate' | 'weak' | 'generic'
  specificity: string
  missedIssues: string
  selfReflectionQuality: string
  recommendation: string
  metaMetaNote: string
}

// ─── Handoff ─────────────────────────────────────────────────────────────────

export interface HandoffItem {
  function: string
  fromHuman: string
  toMachine: string
  costBearer: string
  reversible: string
  observation: string
}

export interface HandoffAuditResult {
  handoffs: HandoffItem[]
  summary: string
  selfReflection: string
}

// ─── Competency Cultivation ───────────────────────────────────────────────────

export interface CompetencyFinding {
  checkpointId: string
  severity: 'critical' | 'significant' | 'moderate' | 'note' | 'strength'
  observation: string
  recommendation: string
}

export interface CompetencyAuditResult {
  summary: string
  findings: CompetencyFinding[]
  selfReflection: string
}

// ─── Red Flags ────────────────────────────────────────────────────────────────

export interface RedFlag {
  id: string
  label: string
  present: 'yes' | 'no' | 'maybe'
  evidence: string
  severity: 'critical' | 'significant' | 'moderate' | 'none'
}

export interface RedFlagsAuditResult {
  flags: RedFlag[]
  overallConcern: 'yes' | 'no' | 'maybe'
  summary: string
  selfReflection: string
}

// ─── Value Concerns ────────────────────────────────────────────────────────────

export interface ValueDimension {
  assessment: 'concern' | 'minor' | 'none'
  observation: string
  recommendation: string
}

export interface ValueConcernsResult {
  accountability: ValueDimension
  autonomy: ValueDimension
  distribution: ValueDimension
  power: ValueDimension
  summary: string
  selfReflection: string
}

// ─── Tagged Union ──────────────────────────────────────────────────────────────

export type AnyAuditResult =
  | { type: 'principles'; data: AuditResult }
  | { type: 'handoff'; data: HandoffAuditResult }
  | { type: 'competency'; data: CompetencyAuditResult }
  | { type: 'redflags'; data: RedFlagsAuditResult }
  | { type: 'values'; data: ValueConcernsResult }

// ─── Run Audit ────────────────────────────────────────────────────────────────

export async function runAudit(
  text: string,
  auditType: AuditType,
  modelId: string,
  onStatus: (status: EngineStatus) => void,
  onToken?: (partial: string) => void
): Promise<AnyAuditResult> {
  const { systemPrompt, userPrompt, schema } = getPromptConfig(auditType)

  const result = await runInference(
    modelId,
    {
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt(text) },
      ],
      jsonSchema: schema,
      temperature: 0.7,
      maxTokens: 2048,
      onToken,
    },
    onStatus
  )

  const data = JSON.parse(jsonrepair(result))
  if (!data || typeof data !== 'object') {
    throw new Error('Model returned invalid JSON — try again or switch to a larger model')
  }
  return { type: auditType, data } as AnyAuditResult
}

// ─── Comparison ───────────────────────────────────────────────────────────────

export async function runComparison(
  text: string,
  promptA: string,
  promptB: string,
  auditType: AuditType,
  modelId: string,
  onStatus: (status: EngineStatus) => void,
  onTokenA?: (t: string) => void,
  onTokenB?: (t: string) => void,
): Promise<{ a: AnyAuditResult; b: AnyAuditResult }> {
  const { userPrompt, schema } = getPromptConfig(auditType)

  const runWith = async (systemPrompt: string, onToken?: (t: string) => void): Promise<AnyAuditResult> => {
    const raw = await runInference(
      modelId,
      {
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt(text) },
        ],
        jsonSchema: schema,
        temperature: 0.7,
        maxTokens: 2048,
        onToken,
      },
      onStatus
    )
    const data = JSON.parse(jsonrepair(raw))
    if (!data || typeof data !== 'object') {
      throw new Error('Model returned invalid JSON — try again or switch to a larger model')
    }
    return { type: auditType, data } as AnyAuditResult
  }

  const a = await runWith(promptA, onTokenA)
  const b = await runWith(promptB, onTokenB)
  return { a, b }
}

export async function runDiffSummary(
  a: AnyAuditResult,
  b: AnyAuditResult,
  modelId: string,
  onStatus: (status: EngineStatus) => void,
): Promise<string> {
  const diffs = diffResults(a, b)
  const summaries = getSummaries(a, b)

  const result = await runInference(
    modelId,
    {
      messages: [
        { role: 'system', content: DIFF_SUMMARY_SYSTEM_PROMPT },
        {
          role: 'user',
          content: DIFF_SUMMARY_USER_PROMPT(
            summaries.a,
            summaries.b,
            JSON.stringify(diffs ?? [], null, 2)
          ),
        },
      ],
      temperature: 0.5,
      maxTokens: 400,
    },
    onStatus
  )
  return result.trim()
}

// ─── Meta Audit (principles only) ─────────────────────────────────────────────

export async function runMetaAudit(
  originalText: string,
  auditResult: AuditResult,
  modelId: string,
  onStatus: (status: EngineStatus) => void,
  onToken?: (partial: string) => void
): Promise<MetaAuditResult> {
  const result = await runInference(
    modelId,
    {
      messages: [
        { role: 'system', content: META_AUDIT_SYSTEM_PROMPT },
        {
          role: 'user',
          content: META_AUDIT_USER_PROMPT(
            originalText,
            JSON.stringify(auditResult, null, 2)
          ),
        },
      ],
      jsonSchema: META_AUDIT_JSON_SCHEMA,
      temperature: 0.7,
      maxTokens: 1024,
      onToken,
    },
    onStatus
  )

  const data = JSON.parse(jsonrepair(result))
  if (!data || typeof data !== 'object') {
    throw new Error('Model returned invalid JSON for meta-audit')
  }
  return data as MetaAuditResult
}
