## AI Principles Audit: Self-Audit

**Scope:** The Self-Audit web application — all 5 audit types, compare mode, manual checklist, model management, annotations, export. Audited as experienced by a user.
**Date:** 2026-03-17
**Auditor:** Claude Code (ai-principles-audit skill)

### Summary

Self-Audit is unusually strong on seamfulness — the system prompt is visible, the model runs locally, limitations are stated explicitly, and the tool acknowledges its own shortcomings. Contestability is structurally present (annotations, compare mode, editable prompts) but the annotation affordance is too subtle for most users to discover. The biggest gap is in productive difficulty: the tool makes it easy to paste text and get findings, but never asks users what they're actually looking for or what they learned after seeing results. The tool demonstrates principles more than it cultivates them in its users.

### Handoff Analysis

**Handoff 1: Evaluating text against AI principles**

- **What function moved?** *Up:* reflective evaluation of whether a product design aligns with AI principles. *Down:* a 1.5–3.8B parameter LM reads user-supplied text, matches it against checkpoint descriptions in a system prompt, and outputs JSON findings with severity/observation/recommendation.
- **What was the human really doing?** Deliberation, interpretation, contextual judgment — reading a document, understanding organizational context, recognizing unstated assumptions, applying nuanced ethical reasoning. Mode: **affordance** — the checkpoints afford structured thinking that the evaluator processes strategically, bringing their own judgment to each one.
- **What norms surround this function?** Academic and professional evaluation norms: evaluators understand context, can ask clarifying questions, bring domain expertise, weigh tradeoffs, know when a concern is theoretical vs. real.
- **Does the embedding transfer?** Partially. The checkpoints transfer (the rubric is in the prompt). But the contextual judgment does not — the model cannot ask follow-up questions, doesn't know the organization, can't distinguish a deliberate design choice from an oversight, and may produce generic observations that sound specific. The tool acknowledges this explicitly.
- **Values at stake:** *Dissipated accountability* — when someone uses Self-Audit findings in a real decision, who's accountable for a shallow or misleading audit? The tool says "question this," but a user under time pressure may not. *Displaced autonomy* — low risk, since the tool preserves user agency well. *What gets normalized* — the idea that a small browser-side LM can meaningfully evaluate AI ethics, which could lower the bar for what counts as "auditing."
- **Relationship type:** **Augmentation** — the model supports the human evaluator but doesn't replace their judgment. The manual checklist tab makes this explicit: you can do this yourself. The annotations make it bidirectional.
- **Jaggedness:** High. The model's ability to produce specific, contextual findings (vs. generic ones) is jagged across text types, audit types, and models. The meta-audit feature is an attempt to let users see the edge — but the meta-audit uses the same model, so it may be blind to its own generic-ness.
- **Dimensions implicated:** All three.

**Handoff 2: Meta-audit (auditing the audit)**

- **What function moved?** *Up:* quality assurance of an evaluation. *Down:* the same small LM evaluates whether its own output was specific and honest.
- **What was the human really doing?** Critical reading — checking whether findings are genuinely grounded in the text or just boilerplate. Mode: **affordance** — the reader uses their judgment to assess quality.
- **Does the embedding transfer?** Weakly. The same model that may produce generic findings is asked to evaluate whether its findings are generic. This is inherently limited — but the tool frames it honestly ("This is recursive self-examination — the HAIPness loop") and doesn't present the meta-audit as authoritative.
- **Values at stake:** *False confidence* — a "strong" or "adequate" quality rating from the meta-audit could create unwarranted trust. The meta-meta-note field partially addresses this.

**Handoff 3: Compare mode diff summary**

- **What function moved?** *Up:* comparative analysis of two evaluation results. *Down:* model reads two JSON result sets and describes what changed.
- **This is the best-designed handoff in the tool.** The structured diff (by checkpoint ID) is computed deterministically — the model only supplements it with a plain-language summary. The user sees the raw diff cards regardless, so the model summary is additive, not authoritative. And it's optional (user clicks "What changed?" — not automatic).

### Seamfulness

**Rating:** Strong

| Checkpoint | Status | Evidence |
|-----------|--------|----------|
| S1: Mechanism transparency | **Present** | System prompt viewable before running (audit-input.tsx disclosure). Model name, size, context window, and VRAM shown. "Runs locally via WebGPU" stated. All 5 audit types described. |
| S2: Limitation flagging | **Present** | Footer: "1.5–3.8B parameters. It will miss nuance, produce generic observations, and sometimes misunderstand context." Self-reflection required in every audit output. Meta-audit exists. Context window error gives specific hint about token budgets. |
| S3: AI vs. human attribution | **Present** | Findings are clearly labeled as model output (tabs: Findings, Reflection, Meta, Prompt). User annotations visually distinct (colored dots, agree/disagree buttons). |
| S4: Construction visibility | **Present** | Output is structured JSON cards with checkpoint IDs and severity badges — visibly a structured analysis, not a polished essay. Raw streaming visible during generation. |
| S5: Provenance | **Partial** | States where the model runs (locally, browser cache). States no data leaves the device. But doesn't surface what training data the models were built on or what their known biases are — though this is largely beyond the tool's scope. |

**Strengths:**
- The "View system prompt" disclosure below the Run button, visible *before* anything runs, is excellent. The user can read the exact rubric before committing.
- Model removal instructions ("How to remove these models later") with precise DevTools path is honest infrastructure transparency.
- The Prompt tab in results showing the exact instructions used is a seamfulness feature that most AI tools never offer.

**Findings:**
- **Note** S5 — The tool doesn't surface per-model characteristics (what each model is good/bad at, training data origins). The descriptions say "Best structured output" or "Highest quality" without grounding those claims.
  - In plain language: Users pick a model based on labels like "recommended" without knowing what makes it better or worse for their specific text.

### Contestability

**Rating:** Adequate

| Checkpoint | Status | Evidence |
|-----------|--------|----------|
| C1: Feedback mechanism | **Present** | Annotations on every finding/handoff/flag: agree, disagree, note. |
| C2: Disagreement is easy | **Partial** | The annotation trigger exists but is a 24×24px icon in the card header — nearly invisible at rest (opacity 30%). Users who don't know to look for it won't find it. |
| C3: Decisions documented | **Partial** | The system prompt (which defines the rubric) is visible. But *why* these specific checkpoints were chosen, what alternatives were considered, why these severity definitions — none of that is in the tool. |
| C4: Repair is visible | **Absent** | No changelog, no repair log, no version history within the tool. |
| C5: Output as draft | **Partial** | Language uses "findings" and "observation" (not verdicts). Summary says the model "will miss nuance." But the structured cards with severity badges can feel authoritative — a "moderate" badge implies a settled judgment. |
| C6: Others can build on it | **Present** | Export to markdown and JSON. Compare mode lets users experiment with prompt variations. Editable Prompt B in compare mode. |

**Strengths:**
- Compare mode is genuinely strong contestability infrastructure — it lets users see how the rubric shapes findings by modifying the prompt and observing what changes. This makes the evaluation method itself contestable.
- Annotations that export with results mean contestation is preserved, not ephemeral.

**Findings:**
- **Significant** C2 — The annotation trigger is too subtle. A first-time user scanning findings cards will see checkpoint ID, severity badge, observation, recommendation — and no visible affordance for disagreement. The 30%-opacity icon reads as decoration, not interaction.
  - What if the annotation trigger were more visible — a text link ("Agree or disagree?") at the bottom of each card, rather than an icon that has to be discovered?
  - In plain language: Users can disagree with findings, but most won't realize they can.
- **Moderate** C3 — The system prompt is visible, but the reasoning behind the checkpoint definitions isn't. Why S1–S5 and not other decompositions of seamfulness? Why these severity levels?
  - What if each audit type had a brief "Why this rubric?" section — 2-3 sentences on the intellectual lineage (Mulligan & Nissenbaum for handoffs, etc.)?
  - In plain language: Users can see *what* the rubric says but not *why* it was designed this way.
- **Note** C4 — No repair visibility. If the tool's prompts or checkpoints are updated, users won't know what changed or why.

### Productive Difficulty

**Rating:** Needs Work

| Checkpoint | Status | Evidence |
|-----------|--------|----------|
| D1: Articulate intent | **Partial** | User must paste text and choose an audit type — this is articulation of *what to audit* but not *what to look for*. The example chips can bypass even this. |
| D2: Notice and wonder | **Absent** | No "What concerns you about this text?" or "What are you hoping to learn?" moment before the audit runs. |
| D3: Active engagement | **Present** | Annotations, compare mode prompt editing, manual checklist all require active engagement. |
| D4: Ability to redirect | **Present** | Can switch audit types, re-run, change models, edit prompts in compare mode. |
| D5: Reflection prompt | **Absent** | No "What did you learn?" or "What surprised you?" after results appear. The findings just land. |
| D6: Revisit and revise | **Absent** | No audit history. Each run is ephemeral — you can export, but the tool doesn't know about past audits or support comparison over time. |
| D7: Strategic refusal | **Present** | Manual checklist tab is explicitly framed as "arguably a more reflective practice anyway." |
| D8: Verification built in | **Partial** | Meta-audit prompts quality checking. But there's no prompt to verify specific findings against the source text ("Does this observation match what the text actually says?"). |
| D9: Learning scaffolded | **Partial** | The three-dimensions overview at the top teaches by display. Checkpoints in the manual checklist scaffold structured thinking. But the AI-assisted path doesn't build progressive understanding. |
| D10: No premature closure | **Partial** | Multiple findings per audit avoid single-answer closure. But the summary sentence at the top of results could read as "here's the verdict." |

**Strengths:**
- The manual checklist tab is genuine productive difficulty — 25 checkpoints to walk through yourself, with your own severity ratings and notes. This is the most pedagogically honest part of the tool.
- Compare mode requires editing a prompt — which means understanding what the prompt does — which is real cognitive work.

**Findings:**
- **Significant** D2/D5 — No before-or-after reflection. The flow is: paste text → pick audit type → click Run → see findings. There's no moment where the user articulates what they're concerned about, and no moment where they synthesize what they learned. The tool does the thinking *for* you unless you actively resist.
  - What if, before running, the tool asked: "What's one thing you're uncertain about in this text?" And after results: "Which finding surprised you most?"
  - In plain language: Users get an answer without being asked to think first, and findings land without being asked to reflect.
- **Moderate** D1 — Example chips pre-fill the textarea, which can bypass even the minimal intent-articulation of choosing what to paste. Clicking "ClearPath (pretrial AI)" → "Run Audit" requires zero thought from the user.
  - What if examples filled the textarea but also surfaced a prompt: "Before running — what do you think the main ethical tension is?"
  - In plain language: The fastest path through the tool requires no thinking at all.

### Competency Cultivation

**Rating:** Adequate

| Competency | Status | Evidence |
|-----------|--------|----------|
| CC1: Generative Curiosity | **Partial** | The recursive example ("audit this tool") invites curiosity. Compare mode invites "what if I change the rubric?" questions. But the default single-audit flow is input→output with no curiosity prompt. |
| CC2: Question Craft | **Absent** | Any text input produces findings. The tool doesn't reward better-framed inputs or help users learn what makes a good text to audit. All inputs are treated equally. |
| CC3: Epistemic Self-Defense | **Present** | Self-reflection section, meta-audit, explicit limitation acknowledgment, and severity badges that can be contested all help users see the gap between "this sounds right" and "I verified this." |
| CC4: Testing AI Limits | **Present** | Compare mode directly builds this habit — change the prompt, see what changes. Meta-audit invites quality scrutiny. The multiple audit types on the same text surface different readings. |
| CC5: Strategic Application | **Present** | Manual checklist tab preserves space for human-only reasoning. The framing "arguably a more reflective practice anyway" models when NOT using AI serves learning better. |

**Strengths:**
- CC3 (Epistemic Self-Defense) is the tool's strongest competency cultivation point. The self-reflection section, the meta-audit, and the explicit "this model is small and limited" messaging all build the habit of questioning AI output.
- CC4 (Testing AI Limits) through compare mode is genuinely novel — most audit tools don't let you experiment with the evaluation rubric itself.

**Findings:**
- **Moderate** CC2 — The tool never helps users get better at *framing* what to audit. A student who pastes a full product spec and a student who pastes one ambiguous sentence get the same treatment. What would it look like to surface: "Shorter, more specific texts tend to produce more useful findings"?
  - In plain language: The tool doesn't teach users what makes a good input — any text gets the same response.
- **Note** CC1 — The default flow doesn't invite curiosity. Compare mode and the recursive example do, but they're secondary paths. The primary flow (paste → run → read) is consumptive.

### Developmental Safeguards

**Rating:** N/A — Self-Audit runs locally with no data collection and no accounts. No minors-specific concerns apply. The speculative example texts (ClearPath, MindBridge) involve sensitive topics (pretrial risk, mental health) but are presented as audit targets, not as advice.

### Value Concerns

| Concern | Status | Notes |
|---------|--------|-------|
| Dissipated accountability | ⚠ | When someone uses Self-Audit findings in a real decision — e.g., "we audited with Self-Audit and it found no critical issues" — who's accountable for a shallow or misleading audit? The tool says to question it, but doesn't prevent misuse as a rubber stamp. |
| Diminished responsibility | ✓ | The tool explicitly places responsibility with the user. "Your text never leaves your browser" and "this tool is an experiment" frame it as a practice tool, not an authority. |
| Displaced autonomy | ✓ | Strong. Annotations, manual mode, editable prompts, visible rubric — the user retains agency throughout. |
| Curtailed agency | ✓ | No lock-in. Export works. No accounts. Models removable. |
| Expanded system boundaries | ✓ | Narrow system — the user's browser and nothing else. No server, no analytics, no third parties. |
| Privacy threats | ✓ | Exemplary. Local execution, no data collection, explicit "no analytics, no server." |
| Who wins / who pays | ✓ | The user wins (free tool, private evaluation). No one pays except in download bandwidth and GPU compute. The model creators' training data labor is unacknowledged (see S5). |
| What gets normalized | ⚠ | Normalizes the idea that a small in-browser LM can evaluate AI ethics — which is both empowering (anyone can do this) and risky (a 3B model doing ethics evaluation may be taken more seriously than it deserves). The tool's honesty about this tension is its best defense. |

### Repair Priorities (top 3)

1. **Significant** (C2) — Make the annotation trigger discoverable. The contestability infrastructure exists but users won't find it. What if each finding card had a visible "Agree or disagree?" text link?

2. **Significant** (D2/D5) — Add before-and-after reflection moments. Before: "What's one thing you want to understand about this text?" After: "Which finding surprised you?" Even optional, these would transform the flow from consumptive to reflective.

3. **Moderate** (CC2/D1) — Surface that input quality matters. A one-line hint: "Tip: shorter, specific texts produce more useful findings than full documents" — or even better, a prompt that asks the user what they're looking for.

### What's Working Well

- **Seamfulness is genuinely strong.** Visible prompts, stated limitations, local execution, model details, raw streaming — the tool makes its construction visible at every level. This should be preserved and highlighted.
- **Compare mode is the most interesting feature.** It makes the evaluation rubric itself contestable and invites users to test AI limits. This is not something other audit tools do.
- **Manual checklist as "arguably more reflective."** Framing the AI-free option as potentially *better* — not just a fallback — is a real productive difficulty strength.
- **Privacy by architecture.** No server is not a policy choice — it's an architectural one. This is the strongest possible privacy guarantee and should be celebrated.
- **Meta-audit as honest recursion.** The tool auditing itself, acknowledging its own limits in that audit, and inviting the user to audit the audit — this is the HAIPness loop working as intended.

### Comparison to Previous Audit

First audit — establishes baseline.
