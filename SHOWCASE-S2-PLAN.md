# S2 implementation plan

Scope: Q5 classroom only; retain SessionWorkspace routes and production DTOs. S1 fixture/calculations remain frozen.

1. Add tests for a Zod-validated, Mock-only showcase read endpoint: A/B/C results, event counts, scope and role rejection. Add integration red tests for classroom charts, selection URL, Evidence and no handwriting.
2. Add a Demo read contract/API adapter and handler, derived only from S1. Keep process/replay on existing student APIs; label synthetic ANSWER_SUBMIT separately from observable event types.
3. Add lightweight distribution/ratio/divergence charts, comparison cards and event playback. Integrate only when runtime is Mock with a demo scenario; preserve normal workspace.
4. Link node/statistic/event Evidence and expose actual event window/IDs/source/quality. URL stores selected question/student across tabs and reload. Demo shell closes empty activity by default.
5. Test playback with controlled time, invalid/missing data, role/exception behavior and all existing tests. Run typecheck, lint, production and demo builds, diff check.
6. Browser QA at requested desktop dimensions and narrow width; record actual viewport, screenshots and interaction results. Independent review, fix findings, save report, commit S2 and stop pending review.
