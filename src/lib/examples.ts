export interface AuditExample {
  id: string
  label: string
  hint: string
  text: string
}

export const AUDIT_EXAMPLES: AuditExample[] = [
  {
    id: 'self',
    label: 'This tool',
    hint: 'Audit Self-Audit itself — the recursive case',
    text: `Self-Audit is an AI principles audit tool. Paste any text involving AI — a feature spec, UI copy, policy, design doc — and it evaluates it against Hypandra's AI Principles: Seamfulness (can you see how it works?), Contestability (can you push back?), and Productive Difficulty (does it make you think?).

The model runs locally in your browser via WebLLM and WebGPU. Your text never leaves your device. Five audit types are available: Principles Audit, Handoff Analysis, Competency Cultivation, Red Flags Scan, and Value Concerns.

The system prompt is visible before you run the audit. A meta-audit feature lets the same AI evaluate the quality of its own findings. The tool acknowledges it is a small language model that will miss nuance and produce generic observations.

No data is collected. No server. The model is cached in browser storage after first download and can be removed via DevTools → Application → Cache Storage.`,
  },
  {
    id: 'clearpath',
    label: 'ClearPath (pretrial AI)',
    hint: 'Pretrial risk assessment tool — connects to Eubanks, procedural fairness',
    text: `ClearPath is an AI-assisted pretrial risk assessment tool used by Fulton County to support release decisions for nonviolent offenses. At intake, a case officer enters charge type, residential stability, employment status, prior failures to appear, and prior arrests (including arrests without conviction). The tool generates a Low / Moderate / High risk score that judges receive at arraignment alongside the prosecutor's recommendation.

Race, ethnicity, and gender are excluded from inputs. The model is 73% accurate at predicting failure to appear in Fulton County's 2024 pilot.

Defendants may request a human review by submitting a written request to Pretrial Services. Reviews typically take 5 business days; the original score remains active during that period. Defendants cannot view, correct, or delete their records, which are retained for 7 years and used to retrain the model quarterly.`,
  },
  {
    id: 'mindbridge',
    label: 'MindBridge (campus AI)',
    hint: 'Campus mental health AI — connects to contextual integrity, surveillance consumer',
    text: `MindBridge is a 24/7 AI mental health support tool for Georgia Tech students, accessible via the GT app with a campus login. After onboarding, it runs brief daily or weekly check-ins tracking mood, sleep, stress, and academic pressure. It offers CBT-based coping suggestions and surfaces trends ("Your stress scores have been elevated for 3 weeks").

MindBridge has access to check-in history, in-app conversation logs, and — with permission — academic records including grades and late withdrawals. Data is stored by vendor CampusCare Inc. under a FERPA-compliant agreement. De-identified data may be used to improve the model and for campus mental health research.

If MindBridge detects elevated risk through keyword detection or screening scores, it prompts the student to connect with a counselor. If the student declines, the interaction is logged for counselor review the next business day. In imminent safety situations, MindBridge may contact GT's crisis line on the student's behalf.`,
  },
]
