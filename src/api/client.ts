import { z } from "zod";
import { envelopeSchema } from "../contracts";
export type Transport = (url: string, init: RequestInit) => Promise<Response>;
export class ApiError extends Error {
  constructor(
    public code: string,
    message: string,
    public status: number,
    public requestId: string,
    public retryable = false,
    public details: Record<string, unknown> = {},
  ) {
    super(message);
    this.name = "ApiError";
  }
}
type Options = {
  baseUrl: string;
  transport: Transport;
  getToken: () => string;
  getAuthGeneration?: () => number;
  onUnauthorized: () => void;
};
export function createClient(options: Options) {
  async function request<T>(
    path: string,
    schema: z.ZodType<T>,
    init: RequestInit = {},
  ) {
    const headers = new Headers(init.headers);
    headers.set("Content-Type", "application/json; charset=utf-8");
    headers.set("X-Request-ID", crypto.randomUUID());
    const token = options.getToken();
    const generation = options.getAuthGeneration?.();
    if (token) headers.set("Authorization", `Bearer ${token}`);
    let response: Response;
    try {
      response = await options.transport(`${options.baseUrl}${path}`, {
        ...init,
        headers,
      });
    } catch (e) {
      if (e instanceof DOMException && e.name === "AbortError") throw e;
      throw new ApiError(
        "INTERNAL_ERROR",
        "网络连接失败，请稍后重试",
        500,
        "client",
        true,
      );
    }
    if (
      response.status === 401 &&
      options.getToken() === token &&
      options.getAuthGeneration?.() === generation
    )
      options.onUnauthorized();
    let raw: unknown;
    try {
      raw = await response.json();
    } catch {
      throw new ApiError(
        "INVALID_SCHEMA",
        "响应不是有效 JSON",
        response.status,
        "unknown",
      );
    }
    const envelope = envelopeSchema.safeParse(raw);
    if (!envelope.success)
      throw new ApiError(
        "INVALID_SCHEMA",
        "响应协议不符合 V0.1",
        422,
        "unknown",
      );
    const data = envelope.data;
    if (!/^0\./.test(data.meta.api_version))
      throw new ApiError(
        "VERSION_MISMATCH",
        "API 主版本不兼容",
        409,
        data.request_id,
      );
    if (!data.success)
      throw new ApiError(
        data.error.code,
        data.error.message,
        response.status,
        data.request_id,
        data.error.retryable,
        data.error.details,
      );
    if (!response.ok)
      throw new ApiError(
        "INTERNAL_ERROR",
        "HTTP 状态与成功响应不一致",
        response.status,
        data.request_id,
      );
    const parsed = schema.safeParse(data.data);
    if (!parsed.success)
      throw new ApiError(
        "INVALID_SCHEMA",
        "数据结构不符合页面契约",
        422,
        data.request_id,
        false,
        { issues: parsed.error.issues },
      );
    return parsed.data;
  }
  return {
    get: <T>(path: string, schema: z.ZodType<T>, signal?: AbortSignal) =>
      request(path, schema, { signal }),
    post: <T>(path: string, body: unknown, schema: z.ZodType<T>) =>
      request(path, schema, { method: "POST", body: JSON.stringify(body) }),
  };
}
