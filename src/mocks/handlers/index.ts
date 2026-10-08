import type { Transport } from "../../api/client";
import {
  loginInputSchema,
  reviewInputSchema,
  feedbackSchema,
} from "../../contracts";
import { scenarios } from "../scenarios";
import * as demo from "../fixtures/demo";
export const handlerList = [
  "POST /auth/login",
  "GET /me",
  "POST /auth/logout",
  "GET /app/bootstrap",
  "GET /classes",
  "GET /classes/:class_id/sessions",
  "GET /teacher/sessions/:session_id/overview",
  "GET /teacher/sessions/:session_id/class-state",
  "GET /teacher/sessions/:session_id/key-nodes",
  "GET /teacher/sessions/:session_id/questions/:question_id",
  "GET /teacher/sessions/:session_id/students",
  "GET /teacher/sessions/:session_id/students/:participant_id/process",
  "GET /teacher/sessions/:session_id/students/:participant_id/replay",
  "GET /evidence/:evidence_id",
  "GET /evidence/:evidence_id/trace",
  "POST /teacher/sessions/:session_id/agent/reviews",
  "POST /teacher/agent/reviews/:review_id/feedback",
  "GET /research/datasets",
  "GET /research/models",
  "GET /research/experiments",
  "GET /research/failure-cases",
  "GET /research/evidence-trace/:evidence_id",
];
export function createMockTransport(scenario = "empty"): Transport {
  if (!scenarios.includes(scenario as (typeof scenarios)[number]))
    throw new Error(`Unknown Mock scenario: ${scenario}`);
  const revoked = new Set<string>();
  let request = 0;
  return async (url, init) => {
    const parsed = new URL(url, "http://mock.local");
    const path = parsed.pathname.replace(/^\/(mock-api|api)\/v1/, "");
    const method = init.method ?? "GET";
    const token =
      new Headers(init.headers).get("Authorization")?.replace("Bearer ", "") ??
      "";
    const requestId = `req_mock_${++request}`;
    const respond = (data: unknown) =>
      new Response(
        JSON.stringify({
          success: true,
          request_id: requestId,
          data,
          meta: {
            api_version: "0.1",
            generated_at: "2026-10-07T13:45:00+08:00",
          },
        }),
        { status: 200 },
      );
    const fail = (status: number, code: string, message: string) =>
      new Response(
        JSON.stringify({
          success: false,
          request_id: requestId,
          error: { code, message, details: {}, retryable: status === 500 },
          meta: { api_version: "0.1" },
        }),
        { status },
      );
    const page = (items: unknown[]) => {
      const p = Number(parsed.searchParams.get("page") ?? 1),
        size = Number(parsed.searchParams.get("page_size") ?? 20);
      return {
        items: items.slice((p - 1) * size, p * size),
        page: p,
        page_size: size,
        total: items.length,
        has_next: p * size < items.length,
      };
    };
    const body = () => {
      try {
        return JSON.parse(String(init.body ?? "{}")) as unknown;
      } catch {
        return null;
      }
    };
    const declared = handlerList.some((entry) => {
      const [expectedMethod, pattern] = entry.split(" ");
      const expression = "^" + pattern.replace(/:[a-z_]+/g, "[^/]+") + "$";
      return method === expectedMethod && new RegExp(expression).test(path);
    });
    if (!declared) return fail(404, "NOT_FOUND", "接口路径或方法不存在");
    if (path === "/auth/login" && method === "POST") {
      const login = loginInputSchema.safeParse(body());
      if (!login.success)
        return fail(400, "INVALID_REQUEST", "请输入账号与密码");
      if (
        login.data.password !== "mock-password" ||
        !["teacher_demo", "researcher_demo", "student_demo"].includes(
          login.data.username,
        )
      )
        return fail(401, "UNAUTHENTICATED", "账号或密码不正确");
      const role =
        login.data.username === "researcher_demo"
          ? "RESEARCHER"
          : login.data.username === "student_demo"
            ? "STUDENT"
            : "TEACHER";
      const roleKey = role.toLowerCase();
      const access_token = `mock.${roleKey}.token`;
      revoked.delete(access_token);
      return respond({
        access_token,
        expires_in: 7200,
        user: {
          user_id: `${roleKey}_001`,
          display_name:
            role === "TEACHER"
              ? "李老师"
              : role === "RESEARCHER"
                ? "研究员"
                : "匿名学生",
          role,
        },
      });
    }
    if (
      !/^mock\.(teacher|researcher|student)\.token$/.test(token) ||
      revoked.has(token)
    )
      return fail(401, "UNAUTHENTICATED", "登录已失效，请重新登录");
    const role = token.includes("researcher")
      ? "RESEARCHER"
      : token.includes("student")
        ? "STUDENT"
        : "TEACHER";
    if (path === "/me")
      return respond({
        user_id: `${role.toLowerCase()}_001`,
        display_name:
          role === "TEACHER"
            ? "李老师"
            : role === "RESEARCHER"
              ? "研究员"
              : "匿名学生",
        role,
      });
    if (path === "/auth/logout" && method === "POST") {
      revoked.add(token);
      return respond(null);
    }
    if (path === "/app/bootstrap")
      return respond({
        app_name: "智察课堂 2.0",
        api_version: "0.1",
        features: {
          teacher_agent: true,
          student_feedback: true,
          research_lab: true,
          fusion: false,
        },
        fusion_status: "SKELETON_ONLY",
        truth_labels: [
          "TEAM_COLLECTED_PEN",
          "OPEN_DATA_MODEL",
          "CSTUDENTACT",
          "DEMO",
          "SYNTHETIC",
          "REAL_PAIRED",
        ],
      });
    // CONTRACT_GAP: teacher research permission pending freeze. Mock returns 403;
    // real transport delegates authorization to R3, with no frontend override.
    if (path.startsWith("/research/") && role !== "RESEARCHER")
      return fail(403, "FORBIDDEN", "当前身份没有科研数据访问权限");
    if (
      (path.startsWith("/teacher/") || path.startsWith("/classes")) &&
      role !== "TEACHER"
    )
      return fail(403, "FORBIDDEN", "当前身份无教师工作区权限");
    if (path.startsWith("/evidence/") && role === "STUDENT")
      return fail(403, "FORBIDDEN", "当前身份无教师证据范围权限");
    const p = Number(parsed.searchParams.get("page") ?? 1),
      size = Number(parsed.searchParams.get("page_size") ?? 20);
    if (
      !Number.isInteger(p) ||
      p < 1 ||
      !Number.isInteger(size) ||
      size < 1 ||
      size > 100
    )
      return fail(400, "INVALID_REQUEST", "分页参数无效");
    if (scenario === "demo_version_mismatch")
      return fail(409, "VERSION_MISMATCH", "演示资源与当前 Contract 版本冲突");
    const empty = scenario === "empty";
    const quality = demo.quality;
    if (path === "/classes")
      return respond(
        page(
          empty
            ? []
            : [{ class_id: "class_3a", name: "演示班级 · 三年级 A 班" }],
        ),
      );
    if (/^\/classes\/[^/]+\/sessions$/.test(path)) {
      if (!path.includes("/class_3a/"))
        return fail(404, "NOT_FOUND", "班级不存在");
      const from = parsed.searchParams.get("date_from"),
        to = parsed.searchParams.get("date_to");
      const at = new Date(demo.session.started_at_ms)
        .toISOString()
        .slice(0, 10);
      return respond(
        page(
          empty || (from && at < from) || (to && at > to) ? [] : [demo.session],
        ),
      );
    }
    if (
      path.startsWith("/teacher/sessions/") &&
      !path.includes("/demo_session_001/")
    )
      return fail(404, "NOT_FOUND", "课堂不存在");
    if (path.startsWith("/teacher/") && empty)
      return fail(404, "NOT_FOUND", "暂无课堂数据");
    if (path.endsWith("/overview"))
      return respond({
        session: demo.session,
        metrics: [
          {
            metric_key: "return_ratio_q05",
            label: "Q5 返回率",
            value: 0.2,
            unit: "ratio",
            display_value: "20%",
            quality,
            evidence_refs: [demo.evidenceId],
          },
          {
            metric_key: "completion_ratio",
            label: "题目完成比例",
            value: null,
            unit: "ratio",
            display_value: null,
            quality: {
              ...quality,
              availability: "NOT_COMPUTABLE",
              reason: "No trusted completion marker",
            },
            evidence_refs: [],
          },
        ],
        question_distribution: [{ question_id: "Q05", count: 12, ratio: 0.3 }],
        key_nodes: [demo.node],
        macro_vision:
          scenario === "demo_missing_vision"
            ? {
                quality: {
                  ...quality,
                  availability: "UNAVAILABLE",
                  reason: "缺少视觉输入",
                },
              }
            : null,
        agent_preview: null,
        authenticity: demo.demoTags,
      });
    if (path.endsWith("/class-state"))
      return respond({
        window: { start_ms: 840000, end_ms: 900000 },
        valid_participant_count: 40,
        question_distribution: [{ question_id: "Q05", count: 12, ratio: 0.3 }],
        return_ratio: { Q05: 0.2 },
        revision_candidate_ratio: { Q05: 0.125 },
        completion_ratio: null,
        progress_divergence: { variance: 0.082, entropy_norm: 0.71 },
        quality: {
          ...quality,
          availability:
            scenario === "demo_not_computable" ? "NOT_COMPUTABLE" : "PARTIAL",
          flags: ["COMPLETION_NOT_COMPUTABLE"],
          reason: "No trusted completion marker",
        },
      });
    if (path.endsWith("/key-nodes"))
      return respond(
        page(
          parsed.searchParams.get("question_id") &&
            parsed.searchParams.get("question_id") !== "Q05"
            ? []
            : [demo.node],
        ),
      );
    if (/\/questions\/[^/]+$/.test(path))
      return path.endsWith("/Q05")
        ? respond({
            question_id: "Q05",
            knowledge_point: "分数应用题",
            question_distribution: [
              { question_id: "Q05", count: 12, ratio: 0.3 },
            ],
            key_nodes: [demo.node],
            students: [{ participant_id: "anon_p017" }],
            evidence_refs: [demo.evidenceId],
          })
        : fail(404, "NOT_FOUND", "题目不存在");
    if (path.endsWith("/students")) {
      const question = parsed.searchParams.get("question_id"),
        event = parsed.searchParams.get("event_type");
      return respond(
        page(
          (question && question !== "Q05") ||
            (event &&
              !demo.process.event_timeline.some((e) => e.event_type === event))
            ? []
            : [{ participant_id: "anon_p017" }],
        ),
      );
    }
    if (/\/students\/[^/]+\/(process|replay)$/.test(path)) {
      if (!path.includes("/anon_p017/"))
        return fail(404, "NOT_FOUND", "匿名参与者不存在");
      return respond(path.endsWith("process") ? demo.process : demo.replay);
    }
    if (
      path.includes("/evidence/") ||
      path.startsWith("/research/evidence-trace/")
    ) {
      if (scenario === "demo_insufficient_evidence")
        return fail(422, "INSUFFICIENT_EVIDENCE", "证据不足 / 暂不可回查");
      const requestedId =
        path.split("/")[path.startsWith("/research/") ? 3 : 2];
      if (empty || requestedId !== demo.evidenceId)
        return fail(404, "NOT_FOUND", "Evidence 不存在");
      return respond(
        path.endsWith("/trace") || path.startsWith("/research/")
          ? demo.trace
          : demo.evidence,
      );
    }
    if (path.endsWith("/agent/reviews") && method === "POST") {
      if (!reviewInputSchema.safeParse(body()).success)
        return fail(400, "INVALID_REQUEST", "只接受结构化 question 与 scope");
      if (scenario === "demo_insufficient_evidence")
        return fail(
          422,
          "INSUFFICIENT_EVIDENCE",
          "当前 Evidence 不足，无法生成确定性结论",
        );
      return respond(demo.review);
    }
    if (
      /^\/teacher\/agent\/reviews\/[^/]+\/feedback$/.test(path) &&
      method === "POST"
    ) {
      if (!path.includes("/review_0001/"))
        return fail(404, "NOT_FOUND", "复盘不存在");
      if (!feedbackSchema.safeParse(body()).success)
        return fail(400, "INVALID_REQUEST", "反馈内容无效");
      return respond(null);
    }
    if (path.startsWith("/research/")) {
      if (path === "/research/datasets")
        return respond(
          page(
            empty
              ? []
              : [
                  {
                    dataset_id: "demo_dataset",
                    name: "前端流程演示数据集",
                    version: "0.1",
                    source_type: "DEMO",
                    sample_count: null,
                    split_summary: null,
                    license_status: "UNKNOWN",
                    privacy_status: "ANONYMIZED",
                    manifest_hash: null,
                    authenticity: demo.demoTags,
                  },
                ],
          ),
        );
      if (path === "/research/models")
        return respond(
          page(
            empty
              ? []
              : [
                  {
                    model_id: "quality_aware_fusion",
                    name: "Quality-aware Fusion",
                    model_version: "0.1",
                    task: "Fusion",
                    dataset_version: null,
                    status: "SKELETON_ONLY",
                    checkpoint_ref: null,
                    metrics_summary: null,
                    limitations: ["尚无真实配对数据，不含正式模型指标"],
                  },
                ],
          ),
        );
      if (
        path === "/research/experiments" ||
        path === "/research/failure-cases"
      )
        return respond(page([]));
    }
    return fail(404, "NOT_FOUND", "接口不存在");
  };
}
