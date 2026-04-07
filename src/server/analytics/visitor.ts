import { createHash } from "node:crypto";

/**
 * 清洗并提取 IP 字符串
 *
 * @param value 原始请求头中的 IP 文本
 * @returns 清洗后的 IP；无效时返回空字符串
 */
function normalizeIpValue(value: string | null | undefined): string {
  if (!value) {
    return "";
  }
  const trimmed = value.trim();
  if (!trimmed) {
    return "";
  }
  if (trimmed.includes(",")) {
    return trimmed.split(",")[0]?.trim() || "";
  }
  return trimmed;
}

/**
 * 从请求头中提取访客 IP
 *
 * 按 CDN/代理常见顺序优先读取：
 * 1. CF-Connecting-IP
 * 2. X-Forwarded-For（首个 IP）
 * 3. X-Real-IP
 *
 * @param headerStore 请求头对象
 * @returns 解析出的访客 IP，失败时返回空字符串
 */
export function extractVisitorIpFromHeaders(headerStore: Headers): string {
  const cfConnectingIp = normalizeIpValue(headerStore.get("cf-connecting-ip"));
  if (cfConnectingIp) {
    return cfConnectingIp;
  }

  const xForwardedFor = normalizeIpValue(headerStore.get("x-forwarded-for"));
  if (xForwardedFor) {
    return xForwardedFor;
  }

  const xRealIp = normalizeIpValue(headerStore.get("x-real-ip"));
  if (xRealIp) {
    return xRealIp;
  }

  return "";
}

/**
 * 对访客 IP 进行哈希，避免存储明文地址
 *
 * @param ip 访客 IP
 * @returns 脱敏后的哈希值；输入为空时返回空字符串
 */
export function hashVisitorIp(ip: string): string {
  const normalized = ip.trim();
  if (!normalized) {
    return "";
  }
  const salt = process.env.VISITOR_IP_SALT || process.env.ADMIN_JWT_SECRET || "yospace-default-salt";
  return createHash("sha256").update(`${salt}:${normalized}`).digest("hex");
}

