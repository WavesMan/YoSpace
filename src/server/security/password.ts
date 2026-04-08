import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";

const SCRYPT_KEYLEN = 64;

/**
 * 生成密码随机盐。
 *
 * @returns 十六进制盐值
 */
export function generatePasswordSalt(): string {
  return randomBytes(16).toString("hex");
}

/**
 * 计算密码哈希。
 *
 * @param password 明文密码
 * @param salt 盐值
 * @returns 十六进制哈希
 */
export function hashPassword(password: string, salt: string): string {
  return scryptSync(password, salt, SCRYPT_KEYLEN).toString("hex");
}

/**
 * 校验密码是否匹配。
 *
 * @param password 明文密码
 * @param salt 盐值
 * @param expectedHash 期望哈希
 * @returns 是否匹配
 */
export function verifyPassword(password: string, salt: string, expectedHash: string): boolean {
  const actual = Buffer.from(hashPassword(password, salt), "hex");
  const expected = Buffer.from(expectedHash, "hex");
  if (actual.length !== expected.length) {
    return false;
  }
  return timingSafeEqual(actual, expected);
}

/**
 * 校验密码强度。
 *
 * @param password 明文密码
 */
export function validatePasswordStrength(password: string): void {
  if (password.length < 8) {
    throw new Error("密码长度不能少于 8 位");
  }
  if (password.length > 128) {
    throw new Error("密码长度不能超过 128 位");
  }
}
