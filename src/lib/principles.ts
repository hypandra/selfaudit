export interface Checkpoint {
  id: string
  label: string
  description: string
}

export interface Dimension {
  id: string
  name: string
  question: string
  checkpoints: Checkpoint[]
}

export const dimensions: Dimension[] = [
  {
    id: 'seamfulness',
    name: 'Seamfulness',
    question: 'Can you see how it works and where it breaks?',
    checkpoints: [
      { id: 'S1', label: 'Mechanism transparency', description: 'User understands what the AI was asked to do, what model/approach is used, what data informs it' },
      { id: 'S2', label: 'Limitation flagging', description: 'Where the AI is unreliable, what it tends to get wrong, known failure modes surfaced to user' },
      { id: 'S3', label: 'AI vs. human attribution', description: 'Clear which parts are AI-generated vs. human-curated' },
      { id: 'S4', label: 'Construction visibility', description: 'Output is visibly a draft from a system, not an oracle pronouncement' },
      { id: 'S5', label: 'Provenance', description: 'Where material comes from, what permissions apply, consent status' },
    ],
  },
  {
    id: 'contestability',
    name: 'Contestability',
    question: 'Can you push back, challenge, and repair?',
    checkpoints: [
      { id: 'C1', label: 'Feedback mechanism', description: 'Users can rate, flag, or comment on AI output' },
      { id: 'C2', label: 'Disagreement is easy', description: '"This is wrong" is accessible, not buried' },
      { id: 'C3', label: 'Decisions documented', description: 'Design decisions visible so others can question them' },
      { id: 'C4', label: 'Repair is visible', description: 'Changes and improvements documented publicly' },
      { id: 'C5', label: 'Output as draft', description: 'Language frames AI output as something to remix, not accept' },
      { id: 'C6', label: 'Others can build on it', description: 'Decisions, tradeoffs, uncertainties documented so others can contest and extend' },
    ],
  },
  {
    id: 'productive-difficulty',
    name: 'Productive Difficulty',
    question: 'Does it make you think?',
    checkpoints: [
      { id: 'D1', label: 'Articulate intent', description: 'User must articulate intent before AI generates (not one-click)' },
      { id: 'D2', label: 'Notice and wonder', description: '"What do you actually want to understand?" moment' },
      { id: 'D3', label: 'Active engagement', description: 'Output requires engagement, not passive consumption' },
      { id: 'D4', label: 'Ability to redirect', description: 'Can stop, redirect, not locked into flow' },
      { id: 'D5', label: 'Reflection prompt', description: '"What did you learn? What surprised you?"' },
      { id: 'D6', label: 'Revisit and revise', description: 'Ability to revisit, revise, build on past interactions' },
      { id: 'D7', label: 'Strategic refusal', description: 'Option to try without AI first is surfaced' },
      { id: 'D8', label: 'Verification built in', description: 'Helps users practice checking, not just consuming' },
      { id: 'D9', label: 'Learning scaffolded', description: 'Builds understanding rather than skipping the work' },
      { id: 'D10', label: 'No premature closure', description: 'Doesn\'t collapse curiosity into a single answer' },
    ],
  },
]

export type Severity = 'critical' | 'significant' | 'moderate' | 'note' | 'strength'

export interface Finding {
  checkpointId: string
  severity: Severity
  observation: string
  recommendation: string
}

export interface AuditResult {
  summary: string
  findings: Finding[]
  selfReflection: string
  metaNote: string
}

export const severityColors: Record<Severity, string> = {
  critical: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
  significant: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300',
  moderate: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
  note: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
  strength: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
}
