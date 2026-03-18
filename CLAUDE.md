# Self-Audit

Browser-local AI principles reflection tool for Richmond Wong's LMC 4813 (Values & Ethics in Digital Media) at Georgia Tech.

- **Live:** https://self-audit.hypandra.com
- **Repo:** https://github.com/hypandra/selfaudit
- **Linear:** DEV-2440
- **Vercel project:** selfaudit (archignes org)

## Temporary class key

There is a hardcoded OpenRouter API key in `src/components/model-loader.tsx` (search for `CLASS_KEY`). This is a temporary $10-limit key for class use. **Remove the banner and disable the key on OpenRouter after the class session.**

## Core use case

Students reflecting on their own use of AI — not just evaluating product specs. The prompts are framed to handle both cases ("The text may describe a product, a policy, or someone's own experience with AI").

## Stack

Vite + React + TypeScript + Tailwind + shadcn/ui. WebLLM for local models, OpenRouter for cloud BYOK. No server, no database, no auth.
