import { setDemoScenario } from "../api/runtime";
export const guideKey = "zhicha-showcase-guide-v1";
export type GuideState = {
  step: number;
  paused: boolean;
  student: string;
  time: string;
  full: string;
};
export const defaultGuide: GuideState = {
  step: 0,
  paused: false,
  student: "anon_p017",
  time: "600000",
  full: "0",
};
export function readGuide(): GuideState | null {
  try {
    const g = JSON.parse(sessionStorage.getItem(guideKey) ?? "null");
    return g && Number.isInteger(g.step) && g.step >= 0 && g.step < 6
      ? { ...defaultGuide, ...g }
      : null;
  } catch {
    return null;
  }
}
export function saveGuide(g: GuideState | null) {
  if (g) sessionStorage.setItem(guideKey, JSON.stringify(g));
  else sessionStorage.removeItem(guideKey);
  window.dispatchEvent(new Event("showcase-guide-change"));
}
export function resetShowcase() {
  const keys = Object.keys(localStorage).filter((k) =>
    /^zhicha-showcase-v0\.1:demo_[a-z_]+:teacher_001:demo_session_001:review_0001$/.test(
      k,
    ),
  );
  for (const key of keys) localStorage.removeItem(key);
  setDemoScenario("demo_happy_path");
  saveGuide({ ...defaultGuide });
}
export function guideUrl(g: GuideState) {
  const session = "demo_session_001",
    q = new URLSearchParams({
      question: "Q05",
      student: g.student,
      time: g.time,
      full: g.full,
    });
  const classroom = `/classroom/${session}/overview?${q}`;
  if (g.step <= 2) return classroom;
  if (g.step === 3)
    return `/ai?${new URLSearchParams({ session, question: "Q05", node: "node_0003", evidence: "ev_sess001_q05_0003", return: classroom })}`;
  if (g.step === 4)
    return `/demo/student?${new URLSearchParams({ session, question: "Q05", student: g.student, return: classroom })}`;
  return `/demo/research/datasets?${new URLSearchParams({ session, return: classroom })}`;
}
