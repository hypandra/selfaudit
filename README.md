# Self-Audit

An AI principles reflection tool that runs entirely in your browser. Paste any text involving AI — a product spec, a policy, a description of how you used AI, a reflection on an AI interaction — and examine it through multiple lenses.

**https://self-audit.hypandra.com**

## What it does

Five reflection types, each with its own prompt and results view:

- **Principles** — Seamfulness, Contestability, and Productive Difficulty
- **Handoff Analysis** — What moved from human to machine, who bears the cost
- **Competency Cultivation** — Does it build or erode AI literacy? (CC1–CC5)
- **Red Flags Scan** — Deception, dependency traps, accountability gaps (RF1–RF4)
- **Value Concerns** — Accountability, autonomy, distribution, power

### Compare mode

Modify the system prompt and run both versions against the same text. See a structured diff by checkpoint — what changed, what stayed the same. Optional model-generated summary of the differences.

### Reflection flow

Before seeing results, you're asked: *What do you expect the audit will find?* Results are held until you lock in your prediction. After results, a second prompt: *What surprised you?*

### Annotations

Agree or disagree with any finding. Add notes. Annotations are included in exports.

### Export

Copy as Markdown or download as JSON. Exports include the input text, your prediction, your post-reflection, annotations, and the model's findings.

## Privacy

The model runs locally via [WebLLM](https://webllm.mlc.ai/) + WebGPU. Your text never leaves your browser. No server. No analytics. No data collection.

Models are cached in your browser's Cache Storage after first download (1–2.4 GB depending on model). You can remove them from within the app or via DevTools → Application → Cache Storage.

## Running locally

```bash
bun install
bun dev
```

Requires a browser with WebGPU support (Chrome/Edge 113+, Firefox 141+, Safari 26+). Without WebGPU, the manual checklist is still available.

## Built by

[Hypandra](https://hypandra.com). A curiosity build — learning by building with AI.

Based on Hypandra's [AI Principles](https://hypandra.com/ai-principles) and the handoff analysis framework from Mulligan & Nissenbaum (2020).
