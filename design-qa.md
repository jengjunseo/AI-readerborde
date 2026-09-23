# Design QA

## Visual source

- Annotated source: `C:/Users/PC/Documents/Codex/2026-09-18/ai-leaderboard-luna-high-execution-prompt/.codex-remote-attachments/01a0b486-d210-7f91-8a2f-6a245a085d9a/04bb4bba-5059-4d74-89fe-012451baad3d/1-23564.jpg`
- Source dimensions: 632 × 1280 px
- Requested change: remove the red-marked header, live-status, summary, and snapshot-status areas; put the board tabs and ranking first; replace provider initials with real provider marks.

## Implementation capture

- Production URL: `https://ai-readerborde.vercel.app/`
- Mobile capture: `artifacts/home-mobile-production.png` (360 × 2025 px full-page capture)
- Desktop capture: `artifacts/home-desktop-production.png` (1425 × 891 px viewport capture)
- Browser viewport: 375 × 812 CSS px, device pixel ratio 1
- State: production, 2026-09-23 snapshot, overall board selected, no expanded row

## Comparison evidence

- Full view: `artifacts/design-comparison-full.png`
- Focused top region: `artifacts/design-comparison-focus.png`

## Findings and correction history

1. The marked header/navigation, LIVE line, four summary cells, and secondary snapshot line were removed from the home route. Subpages retain navigation.
2. At 375 px, the board tabs start at y=0 and the leaderboard card starts at y=67; there is no horizontal document overflow.
3. OpenAI, Anthropic, Z AI/GLM, Kimi, StepFun, Meta, Xiaomi, Alibaba, xAI, Google, DeepSeek, and Mistral resolve to image assets. Production checks reported complete images with non-zero natural dimensions for every visible provider mark.
4. The coding and work/agent tabs update the board heading correctly, and a GLM row expands to a source-linked evidence breakdown.
5. Desktop 1440 × 900 and mobile 375 × 812 captures show the same information hierarchy without clipped leaderboard controls.
6. No console errors or warnings were present in either production viewport.

final result: passed
