# Design QA

## Visual source

- Annotated source: `C:/Users/PC/Documents/Codex/2026-09-18/ai-leaderboard-luna-high-execution-prompt/.codex-remote-attachments/01a0b486-d210-7f91-8a2f-6a245a085d9a/04bb4bba-5059-4d74-89fe-012451baad3d/1-23564.jpg`
- Source dimensions: 632 × 1280 px
- Original request: remove the marked header/status/summary areas, put board tabs and rankings first, and use real provider marks.

## Existing production evidence

- Production URL: `https://ai-readerborde.vercel.app/`
- Existing mobile capture: `artifacts/home-mobile-production.png`
- Existing desktop capture: `artifacts/home-desktop-production.png`
- Existing comparison evidence: `artifacts/design-comparison-full.png`, `artifacts/design-comparison-focus.png`
- The production reference confirmed that the compact dark leaderboard, provider logos, six board tabs, comparison controls and expandable source evidence worked without horizontal overflow.

## V3 implementation evidence

- Mobile implementation capture: `design-qa/implementation-375.png`
- Viewports checked: 375×812, 768×900, 1024×900, 1440×900
- Density: compact data product; typography, separators and spacing carry hierarchy rather than decorative cards.
- State: local production UI with safe fallback data; GPT-6 official comparison chart and GPT-6 Luna verified guide rendered.
- Browser DOM reported no horizontal overflow at all four widths.
- Keyboard link navigation opened `/models/gpt-6-luna`; browser back returned to the leaderboard.
- The guide exposed eight ordered sections with mobile-visible terminology definitions and claim-level source links.
- The existing dark scoreboard identity, provider marks and dense ranking table are preserved. The encyclopedia places beginner answers, access and pricing above benchmark evidence.
- GPT-6 Astra, Sol and Luna are separated in an official-spec chart that is explicitly labeled as price—not performance—comparison.

final result: passed

## V3 readability and glossary-note polish — 2026-09-23

- Source visual truth: `C:/Users/PC/Documents/Codex/2026-09-18/ai-leaderboard-luna-high-execution-prompt/.codex-remote-attachments/01a0b486-d210-7f91-8a2f-6a245a085d9a/1cb1cd6b-5348-4c69-9431-353594f9a4da/1-23612.jpg`
- Source pixels: 592 × 1280, supplied Android screenshot including device chrome.
- Implementation screenshot: `design-qa/implementation-glossary-375.png`
- Implementation pixels and CSS viewport: 375 × 812 at device scale factor 1.
- State: GPT-6 Luna model guide, `[API]` glossary note open.
- Normalization: compared the app-owned modal and dimmed content state rather than device chrome. Exact colors were intentionally not copied because the product requirement preserves AI SCOREBOARD's existing dark theme.
- Full-view evidence: the implementation keeps the underlying article visible but inactive, dims and blurs it, centers one concise definition dialog, prevents body scroll, and avoids horizontal overflow.
- Focused-region evidence: `[API]` opens a dialog with the term, plain Korean definition, icon close control and full-width `닫기` action. The focused region was readable at 375 px without truncation.

### Required fidelity surfaces

- Typography: existing Geist/Pretendard hierarchy is preserved; the term and definition use distinct weights and readable mobile line height.
- Spacing and layout rhythm: the dialog is centered with 12 px viewport safety space, separated header/body/footer, and 48 px close action.
- Colors and tokens: existing surface, border, text-muted and cyan tokens replace the source's light palette intentionally.
- Image and icon fidelity: no raster content was required; the book and close marks use the existing Lucide icon library. The small `N` badge in the local capture is Next.js development chrome and is absent from production.
- Copy: the modal contains only `용어 설명`, the selected term, its direct definition and `닫기`.

### Comparison history

- Earlier P2: the first implementation placed the dialog at the bottom edge, which differed from the centered reference and overlapped local development chrome.
- Fix: removed the mobile bottom alignment and retained a centered dialog at every breakpoint.
- Post-fix evidence: final dialog bounds were top 300 px, bottom 513 px in an 812 px viewport; the center delta was 0.
- Interaction evidence: click opened the dialog, Escape support is registered, the close button removed the dialog, body scrolling was restored, and focus returned to `[API]`.
- Console evidence: no browser error or warning was emitted during open and close.

### Findings

- No remaining P0, P1 or P2 issue.
- Intentional difference: dark product styling is retained instead of cloning the reference site's white theme.

final result: passed
