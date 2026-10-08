# TASK-ZC-SHOWCASE-REFACTOR-01: S0 / S1

Date: 2026-10-08 (Asia/Shanghai)

## Scope and stage

- STAGE_REACHED: S1_ACCEPTED. S2 has not started.
- Repository: https://github.com/chanceNB/qianduan.git
- Starting commit: ab63c08. Initial checkout was clean on main.
- Branch: codex/zhicha-showcase-v0.1. main was not changed; no push or merge performed.
- Implementation stays in the existing React / TypeScript / Vite application. No backend, database, training or new dependencies.

## Reusable implementation

- API client, interchangeable Mock transport, Zod DTOs and existing API modules.
- AuthProvider, route permissions, role checks, classroom selection and asynchronous stale-response handling.
- EvidenceProvider / EvidenceLinks / EvidenceDrawer / TraceView, including focus handling and auth reset cleanup.
- ReplayCanvas for actual normalized trajectories; Students already renders an event timeline when no trajectory exists.
- Classroom list, overview, class state, key nodes and question drilldown routes.
- AI structured question/scope requests, teacher accept/edit/reject actions and reviewDisplayState.
- Research list/detail/filter/trace views, AppShell navigation, UI components and white/green design tokens.
- All existing API, UI, scenario, error, flow and review regression tests.

## Preview comparison

Compared the locally available historical compare-classroom.jpg and compare-students.jpg (source crop on left, previous implementation on right). No new competition preview image was supplied with this task.

- Both retain white surfaces, green selection, subtle borders and broad whitespace.
- The implementation uses materially smaller typography and controls relative to the reference crops. The reference is a composite of different page dimensions, so this is a relative observation, not a valid pixel-error measurement.
- Classroom uses class/date filters where the reference shows semester/course/class filters; current choices follow the available API.
- Students uses four filters (including class/session) where the source crop shows three. Its detail placeholder and list are proportionally narrower.
- The right activity panel remains mostly empty and consumes competition display space; no guided Q5 navigation exists.
- The reference and current classroom list emphasize empty states; neither comparison image specifies the requested Q5 charts or A/B/C comparison. These require S2 functional design, not pixel matching.
- Historical screenshot findings are not fresh browser or mobile QA of this change.

## S1 implementation and definitions

- Twelve anonymized participants, six questions, seventy-two synthetic results; A/B/C keep IDs anon_p017 / anon_p018 / anon_p019.
- A has a correct Q5 result with no return. B has a correct result with two returns in the key window. C has an incorrect result with a return and revision candidate.
- Results have matching submit events, and the participant is on that question when submitting. Timeline IDs are unique and relative to the lesson start.
- Q5 window is [840000, 900000) ms, or 14:00 to 15:00 relative to lesson start.
- Denominator: unique participants with a recognized QUESTION_VISIT or RETURN before the window end. Here: 12.
- RETURN and REVISION_CANDIDATE ratios count unique participants with that event on that question inside the window. Q5: 4/12 = 33.3%; 3/12 = 25%.
- Distribution uses each participant's latest visit/return before the window end. Q4: 2; Q5: 8; Q6: 2. Q1-Q3: 0.
- Progress variance uses question ordinal positions; entropy is normalized by log(question count). Empty denominator returns null ratios and no divergence.
- Overview, class state, question distribution and key-node count use the same event calculation; filters match question and event on the same event record.
- Completion remains null: synthetic answer submission is not a trusted production completion marker.
- Evidence references existing Q5 event IDs and synthetic result records. Stroke refs are empty; video evidence and actual sensor trace refs are null. DEMO and SYNTHETIC labels both state is_research_evidence=false.
- Replay returns no strokes and all process event IDs with UNAVAILABLE trajectory quality. Existing Students timeline remains usable.
- Q5 review includes its Evidence ID and avoids causal certainty. Non-Q5/unknown scopes and insufficient-evidence scenario return 422. Confidence is null.
- Teacher feedback is stored in localStorage (not sessionStorage), keyed by showcase version, scenario, teacher, session and review. EDIT_AND_ACCEPT restores its text through a new transport. ACCEPT and REJECT are saved as actions. Storage failure returns an error rather than claiming a successful save.

## Files

Modified: src/mocks/fixtures/demo.ts, src/mocks/handlers/index.ts, tests/scenarios.test.ts.

Added: src/mocks/calculations.ts, tests/showcase-data.test.ts, tests/showcase-calculations.test.ts, this report.

Next stages modify src/pages/Classroom.tsx, src/components/ReplayCanvas.tsx, src/components/EvidenceDrawer.tsx, src/pages/AI.tsx, src/pages/Students.tsx, src/pages/Research.tsx, src/layouts/AppShell.tsx and styles, followed by package.json static Demo build script. No page redesign or permission override was made during S1.

## Verification

- S0 baseline: 8 files / 44 tests passed; typecheck, lint and production build passed.
- S1 first test run: six new behavior tests failed against the original implementation, then passed after implementation.
- An additional result/submit consistency test exposed missing submit events; fixture was repaired and the test passed.
- Final S1: npm test: 10 files / 54 tests passed, exit 0.
- npm run typecheck: exit 0.
- npm run lint: exit 0.
- npm run build: exit 0 (2052 modules).
- npx vite build --mode demo: exit 0 (2052 modules), using the existing .env.demo; this verifies the mode but does not yet provide the requested independent build script or protection against environment overrides.
- Demo dev server: http://127.0.0.1:4184, HTTP 200. This is a startup check, not a browser interaction or screenshot acceptance check.
- Build warns twice about Zod PURE annotation positioning; warnings also existed in S0 and do not prevent output.
- git diff --check: passed; Git reports LF-to-CRLF normalization notices on this Windows checkout.

## Risks and compatibility

- Existing teacher/research permissions differ: the frontend permits a teacher to navigate Research but Mock returns 403. Preserve enforcement; future guided demonstration must explicitly use a research demo view.
- Formal student role has no personal-feedback endpoint and is denied teacher/evidence access. A future demo student view must remain distinct from production authorization.
- participantSchema retains only participant_id. A/B/C display names are fixture metadata until a demo-only view adapter is introduced; do not change the frozen DTO casually.
- Question/class/list/trace schemas already document CONTRACT_GAPs. No production contract was expanded.
- Synthetic data is useful for showing observable differences, but cannot substantiate research outcomes, emotion, concentration or causes of a wrong answer.
- Local feedback storage has no production security guarantees, cross-device sync or audit service. Later student feedback must show only adopted teacher content, not rejected output.
- The default build still uses the original environment defaults; the independent forced-Mock build script is pending. Static hosting also needs SPA fallback for direct route loads.
- Real pen paths and verified research artifacts were not provided. They must stay unavailable/unverified until actual sources are supplied.

## Next phase

S2: preserve existing Classroom routes and query behavior; promote Q5 to the main workspace, show event-derived distribution/return/revision charts, add A/B/C results and process comparison, then test evidence links and timeline selection. Validate desktop/mobile layouts in the browser and run tests, typecheck, lint and production build before continuing to Evidence/AI/teacher/student/Research modules.
