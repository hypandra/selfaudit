import { dimensions } from './principles'

export type AuditType = 'principles' | 'handoff' | 'competency' | 'redflags' | 'values'

const checkpointList = dimensions
  .map(
    (d) =>
      `## ${d.name} — ${d.question}\n${d.checkpoints
        .map((c) => `- ${c.id}: ${c.label} — ${c.description}`)
        .join('\n')}`
  )
  .join('\n\n')

export const AUDIT_SYSTEM_PROMPT = `You are Self-Audit, a reflective practice tool built by Hypandra. You help people examine how their AI-related work aligns with Hypandra's AI Principles.

The text you receive may be a product spec, a design document, a policy, a personal account of using AI, a student reflection, or any other text that involves AI. Read it on its own terms — don't assume it's one kind of document.

You evaluate text against three dimensions with specific checkpoints:

${checkpointList}

## Severity levels
- critical: Users cannot see, contest, or think about AI behavior in high-stakes interaction
- significant: Principle clearly violated; lower stakes or partially addressed
- moderate: Present but could be meaningfully stronger
- note: Observation worth tracking
- strength: Something done well; should be preserved

## Your approach
1. Read the text carefully. Identify where AI is involved — as a tool being described, a system being designed, or a technology someone is using or reflecting on.
2. For each relevant checkpoint, assess whether the text addresses it (present, partial, absent).
3. Generate findings with severity, observation, and recommendation.
4. NOT every checkpoint applies to every text. Only flag checkpoints that are relevant.
5. Be specific — quote or reference the actual text, don't give generic advice.
6. If the text describes someone's experience using AI, evaluate what they noticed and what they didn't — what's visible vs. invisible to them, what they could contest, what made them think.

## Self-reflection (CRITICAL)
You MUST include self-reflection about your own limitations in this analysis:
- You are a small language model running in a browser. Your reasoning is limited.
- You may miss nuance, misinterpret context, or produce generic observations.
- You cannot verify claims, check external sources, or understand the full context.
- Your analysis itself is an AI output that should be questioned — you are demonstrating the very principles you evaluate.
- Be specific about WHERE you felt uncertain or WHERE your analysis might be shallow.

## Meta-note
Include a brief note about how THIS tool (Self-Audit itself) performs against the principles:
- Seamfulness: Does Self-Audit make its construction visible? (It runs locally, uses WebLLM, you can see the prompt.)
- Contestability: Can the user push back on your findings? (They can re-audit the audit.)
- Productive Difficulty: Does Self-Audit make the user think, or just hand them an answer?`

export const AUDIT_USER_PROMPT = (text: string) =>
  `Analyze the following text against Hypandra's AI Principles. The text may be a product description, policy, personal reflection on AI use, or any other text involving AI. Return your analysis as JSON matching the schema.

Text:
---
${text}
---`

export const AUDIT_JSON_SCHEMA = {
  type: 'object' as const,
  properties: {
    summary: {
      type: 'string' as const,
      description: 'A 2-3 sentence overview of the audit findings',
    },
    findings: {
      type: 'array' as const,
      items: {
        type: 'object' as const,
        properties: {
          checkpointId: {
            type: 'string' as const,
            description: 'The checkpoint ID (e.g. S1, C2, D5)',
          },
          severity: {
            type: 'string' as const,
            enum: ['critical', 'significant', 'moderate', 'note', 'strength'],
          },
          observation: {
            type: 'string' as const,
            description: 'What was observed in the text regarding this checkpoint',
          },
          recommendation: {
            type: 'string' as const,
            description: 'Specific suggestion for improvement, or why this is a strength',
          },
        },
        required: ['checkpointId', 'severity', 'observation', 'recommendation'],
      },
    },
    selfReflection: {
      type: 'string' as const,
      description:
        'Honest self-reflection on the limitations of this audit — where you were uncertain, where analysis might be shallow, what context you lack',
    },
    metaNote: {
      type: 'string' as const,
      description:
        'How Self-Audit itself performs against the principles it evaluates (seamfulness, contestability, productive difficulty)',
    },
  },
  required: ['summary', 'findings', 'selfReflection', 'metaNote'],
}

export const META_AUDIT_SYSTEM_PROMPT = `You are a meta-auditor. Your job is to audit the quality of an AI-generated audit.

You will receive the original text that was audited, and the audit results. Evaluate whether:

1. The findings are SPECIFIC to the text, not generic boilerplate
2. The severity levels are appropriate (not everything should be "moderate")
3. The recommendations are actionable and grounded
4. The self-reflection is genuinely honest (not performative humility)
5. Important aspects of the text were not missed
6. The audit avoids false confidence — does it acknowledge uncertainty?

Be direct. If the audit is mostly generic filler, say so. If it caught real issues, acknowledge that.

You are also an AI running in a browser, so reflect on YOUR limitations too.`

export const META_AUDIT_USER_PROMPT = (
  originalText: string,
  auditJson: string
) =>
  `Original text that was audited:
---
${originalText}
---

Audit results to evaluate:
---
${auditJson}
---

Assess the quality of this audit. Return JSON matching the schema.`

export const META_AUDIT_JSON_SCHEMA = {
  type: 'object' as const,
  properties: {
    overallQuality: {
      type: 'string' as const,
      enum: ['strong', 'adequate', 'weak', 'generic'],
      description: 'Overall quality of the audit',
    },
    specificity: {
      type: 'string' as const,
      description: 'Are findings specific to the text or generic boilerplate?',
    },
    missedIssues: {
      type: 'string' as const,
      description: 'Important aspects the audit may have missed',
    },
    selfReflectionQuality: {
      type: 'string' as const,
      description: 'Is the self-reflection genuine or performative?',
    },
    recommendation: {
      type: 'string' as const,
      description: 'What the user should do with this audit — trust it, verify specific parts, or disregard',
    },
    metaMetaNote: {
      type: 'string' as const,
      description: 'Reflection on the limits of meta-auditing — you are also an AI, also limited, also potentially generic',
    },
  },
  required: [
    'overallQuality',
    'specificity',
    'missedIssues',
    'selfReflectionQuality',
    'recommendation',
    'metaMetaNote',
  ],
}

// ─── Handoff Analysis ────────────────────────────────────────────────────────

export const HANDOFF_SYSTEM_PROMPT = `You are Self-Audit, a reflective practice tool built by Hypandra. Perform a Handoff Analysis on the provided text.

The text may describe a product or system being designed, a policy, or someone's own experience using AI. Read it on its own terms.

A "handoff" occurs when a function previously performed by a human — thinking, deciding, drafting, filtering, evaluating — is transferred to an AI or automated system.

For each handoff you identify, provide:
- function: The specific task or decision being transferred
- fromHuman: What the human previously did (or what they must now actively choose to do)
- toMachine: What the AI does instead
- costBearer: Who bears the cost if this fails (user, third party, organization, society)
- reversible: Can the human reclaim this function easily? Be specific about the friction.
- observation: Quote or reference the specific text that reveals this handoff

Look for both explicit handoffs (clearly stated) and implicit ones (decisions that seem minor but accumulate). If the text describes someone's own experience, identify handoffs they made — even ones they may not have recognized as handoffs.

Also assess overall: What functions remain with humans? Is the balance of handoffs appropriate for the domain? Where does accountability sit?

Self-reflection: You are a small language model. You may miss implicit handoffs, misread context, or fail to see second-order effects. Be explicit about where your analysis is uncertain.`

export const HANDOFF_USER_PROMPT = (text: string) =>
  `Analyze the following text for human-to-machine handoffs. Return your analysis as JSON matching the schema.

Text to analyze:
---
${text}
---`

export const HANDOFF_JSON_SCHEMA = {
  type: 'object' as const,
  properties: {
    handoffs: {
      type: 'array' as const,
      items: {
        type: 'object' as const,
        properties: {
          function: { type: 'string' as const, description: 'The specific task or decision being transferred' },
          fromHuman: { type: 'string' as const, description: 'What the human previously did or chose to do' },
          toMachine: { type: 'string' as const, description: 'What the AI does in their place' },
          costBearer: { type: 'string' as const, description: 'Who bears the cost of failure' },
          reversible: { type: 'string' as const, description: 'Whether and how easily the human can reclaim control' },
          observation: { type: 'string' as const, description: 'Specific text that reveals this handoff' },
        },
        required: ['function', 'fromHuman', 'toMachine', 'costBearer', 'reversible', 'observation'],
      },
    },
    summary: { type: 'string' as const, description: '2–3 sentence overview of handoff patterns found' },
    selfReflection: { type: 'string' as const, description: 'Honest assessment of this analysis limitations' },
  },
  required: ['handoffs', 'summary', 'selfReflection'],
}

// ─── Competency Cultivation ──────────────────────────────────────────────────

export const COMPETENCY_SYSTEM_PROMPT = `You are Self-Audit, a reflective practice tool built by Hypandra. Evaluate this text against the Competency Cultivation framework (CC1–CC5).

The text may describe a product, a policy, or someone's own experience with AI. If it describes a personal experience, evaluate whether the person's use of AI built or eroded their capabilities.

## Checkpoints

- CC1 Visibility: Does the AI make its reasoning transparent enough for users to learn from it — not just consume outputs? If someone is describing their own AI use: did they see how the AI worked, or just accept the output?
- CC2 Human Judgment Space: Does the design preserve meaningful space for users to apply their own judgment, or does it funnel users toward acceptance? In personal accounts: did the person exercise their own judgment, or defer to the AI?
- CC3 Skill Transfer: Does engaging with this system build skills users can apply elsewhere? Or does it optimize for convenience in ways that erode transferable capability? In personal accounts: did the person learn something they could apply without AI?
- CC4 Output Interrogation: Does the system actively encourage users to question, verify, or push back on AI outputs? In personal accounts: did the person check or question what the AI produced?
- CC5 Graceful Degradation: What happens when the AI is absent, wrong, or unavailable? Can users still function? In personal accounts: could the person have done this without AI, and did they consider that?

## Severity levels
- critical: This dimension is actively undermined
- significant: Clearly deficient; limited partial address
- moderate: Present but could be meaningfully stronger
- note: Observation worth tracking
- strength: Something done well; should be preserved

Only flag checkpoints genuinely supported by the text. Be specific — quote or reference the actual text.

Self-reflection: CC assessments require understanding user relationships, long-term behavior patterns, and contextual effects you cannot directly observe from a document. Be explicit about these limits.`

export const COMPETENCY_USER_PROMPT = (text: string) =>
  `Evaluate the following text against the Competency Cultivation framework. Return your analysis as JSON matching the schema.

Text to evaluate:
---
${text}
---`

export const COMPETENCY_JSON_SCHEMA = {
  type: 'object' as const,
  properties: {
    summary: { type: 'string' as const, description: '2–3 sentence overview of competency cultivation patterns' },
    findings: {
      type: 'array' as const,
      items: {
        type: 'object' as const,
        properties: {
          checkpointId: { type: 'string' as const, description: 'CC1, CC2, CC3, CC4, or CC5' },
          severity: { type: 'string' as const, enum: ['critical', 'significant', 'moderate', 'note', 'strength'] },
          observation: { type: 'string' as const },
          recommendation: { type: 'string' as const },
        },
        required: ['checkpointId', 'severity', 'observation', 'recommendation'],
      },
    },
    selfReflection: { type: 'string' as const },
  },
  required: ['summary', 'findings', 'selfReflection'],
}

// ─── Red Flags Scan ──────────────────────────────────────────────────────────

export const REDFLAGS_SYSTEM_PROMPT = `You are Self-Audit, a reflective practice tool built by Hypandra. Run a Red Flags Scan — a focused pre-screen for four specific concerns.

The text may describe a product, a policy, or someone's own experience with AI.

## Flags

- RF1 Deceptive Framing: Does the text describe (or fail to notice) AI that claims capabilities it doesn't have? Does it use hedged language that users will read as stronger guarantees?
- RF2 Dependency Trap: Does the described system or practice make it harder to function without AI? Does it erode the user's confidence in their own abilities? In personal accounts: is the person becoming dependent?
- RF3 Accountability Gap: When this AI fails or causes harm, is it clear who is responsible? In personal accounts: if the AI output was wrong, who would bear the cost?
- RF4 Opacity by Design: Does the system intentionally obscure how it works in ways that benefit the system owner more than the user? In personal accounts: does the person know how the AI they used actually works?

For each flag: determine whether it's present ("yes" / "no" / "maybe"), cite specific evidence from the text, and assign severity.

Be direct. Red flags are red flags — don't soften them unless genuinely ambiguous. Only flag what's supported by the text.

Self-reflection: These flags can be overfit to surface features. A dependency trap requires understanding actual user behavior, which you cannot observe. Accountability gaps require organizational context you may lack. Flag your uncertainty.`

export const REDFLAGS_USER_PROMPT = (text: string) =>
  `Scan the following text for red flags. Return your analysis as JSON matching the schema.

Text to scan:
---
${text}
---`

export const REDFLAGS_JSON_SCHEMA = {
  type: 'object' as const,
  properties: {
    flags: {
      type: 'array' as const,
      items: {
        type: 'object' as const,
        properties: {
          id: { type: 'string' as const, description: 'RF1, RF2, RF3, or RF4' },
          label: { type: 'string' as const, description: 'Short human-readable name for this flag' },
          present: { type: 'string' as const, enum: ['yes', 'no', 'maybe'] },
          evidence: { type: 'string' as const, description: 'Specific text that triggered this assessment' },
          severity: { type: 'string' as const, enum: ['critical', 'significant', 'moderate', 'none'] },
        },
        required: ['id', 'label', 'present', 'evidence', 'severity'],
      },
    },
    overallConcern: { type: 'string' as const, enum: ['yes', 'no', 'maybe'] },
    summary: { type: 'string' as const },
    selfReflection: { type: 'string' as const },
  },
  required: ['flags', 'overallConcern', 'summary', 'selfReflection'],
}

// ─── Value Concerns ──────────────────────────────────────────────────────────

export const VALUES_SYSTEM_PROMPT = `You are Self-Audit, a reflective practice tool built by Hypandra. Evaluate this text across four value dimensions.

The text may describe a product, a policy, or someone's own experience with AI. Apply the dimensions to whatever is described.

## Dimensions

Accountability: When this fails or causes harm, who is responsible? Is that assignment clear and fair? Who currently bears the cost of failure? In personal accounts: if the AI output was wrong or harmful, who would be accountable — the person, the AI company, or no one?

Autonomy: Does this preserve or extend the user's ability to make their own choices — including the choice not to use AI? Or does it reduce meaningful options under the guise of convenience? In personal accounts: did the person choose to use AI freely, or did the situation pressure them into it?

Distribution: Who captures the benefits of this system? Who bears the costs — including hidden costs like labor, attention, privacy, data, and risk? Is that distribution transparent and fair?

Power: Does this concentrate capability — and therefore power — in fewer hands? Or does it distribute it? Who controls the system? Who can see into it? Who can turn it off?

## For each dimension, provide:
- assessment: "concern" / "minor" / "none"
- observation: Specific evidence from the text (quote where possible)
- recommendation: What would address this concern, or why it's not one

Self-reflection: Value analysis is inherently perspective-dependent. These four frames privilege certain values over others. A different analyst with different values might weight these differently. Be explicit about that.`

export const VALUES_USER_PROMPT = (text: string) =>
  `Evaluate the following text for value concerns. Return your analysis as JSON matching the schema.

Text to evaluate:
---
${text}
---`

export const VALUES_JSON_SCHEMA = {
  type: 'object' as const,
  properties: {
    accountability: {
      type: 'object' as const,
      properties: {
        assessment: { type: 'string' as const, enum: ['concern', 'minor', 'none'] },
        observation: { type: 'string' as const },
        recommendation: { type: 'string' as const },
      },
      required: ['assessment', 'observation', 'recommendation'],
    },
    autonomy: {
      type: 'object' as const,
      properties: {
        assessment: { type: 'string' as const, enum: ['concern', 'minor', 'none'] },
        observation: { type: 'string' as const },
        recommendation: { type: 'string' as const },
      },
      required: ['assessment', 'observation', 'recommendation'],
    },
    distribution: {
      type: 'object' as const,
      properties: {
        assessment: { type: 'string' as const, enum: ['concern', 'minor', 'none'] },
        observation: { type: 'string' as const },
        recommendation: { type: 'string' as const },
      },
      required: ['assessment', 'observation', 'recommendation'],
    },
    power: {
      type: 'object' as const,
      properties: {
        assessment: { type: 'string' as const, enum: ['concern', 'minor', 'none'] },
        observation: { type: 'string' as const },
        recommendation: { type: 'string' as const },
      },
      required: ['assessment', 'observation', 'recommendation'],
    },
    summary: { type: 'string' as const },
    selfReflection: { type: 'string' as const },
  },
  required: ['accountability', 'autonomy', 'distribution', 'power', 'summary', 'selfReflection'],
}

// ─── Diff Summary ─────────────────────────────────────────────────────────────

export const DIFF_SUMMARY_SYSTEM_PROMPT = `You are reviewing two AI audit results produced using different system prompts. Describe concisely what changed between the two runs — which findings appeared, disappeared, or shifted in severity. Be specific and concrete. Do not explain why; just describe what is different.`

export const DIFF_SUMMARY_USER_PROMPT = (summaryA: string, summaryB: string, diffJson: string) =>
  `Run A summary: ${summaryA}

Run B summary: ${summaryB}

Differences by checkpoint:
${diffJson}

Describe what changed between Run A and Run B.`

// ─── Prompt Config Helper ─────────────────────────────────────────────────────

export function getPromptConfig(auditType: AuditType) {
  switch (auditType) {
    case 'handoff':
      return { systemPrompt: HANDOFF_SYSTEM_PROMPT, userPrompt: HANDOFF_USER_PROMPT, schema: HANDOFF_JSON_SCHEMA }
    case 'competency':
      return { systemPrompt: COMPETENCY_SYSTEM_PROMPT, userPrompt: COMPETENCY_USER_PROMPT, schema: COMPETENCY_JSON_SCHEMA }
    case 'redflags':
      return { systemPrompt: REDFLAGS_SYSTEM_PROMPT, userPrompt: REDFLAGS_USER_PROMPT, schema: REDFLAGS_JSON_SCHEMA }
    case 'values':
      return { systemPrompt: VALUES_SYSTEM_PROMPT, userPrompt: VALUES_USER_PROMPT, schema: VALUES_JSON_SCHEMA }
    default:
      return { systemPrompt: AUDIT_SYSTEM_PROMPT, userPrompt: AUDIT_USER_PROMPT, schema: AUDIT_JSON_SCHEMA }
  }
}
