import { cookies } from 'next/headers';
import { SignJWT, jwtVerify } from 'jose';

const ADMIN_TOKEN_COOKIE_KEY = 'yo_admin_token';

/**
 * 获取管理员 JWT 签名密钥
 *
 * 使用环境变量 ADMIN_JWT_SECRET 作为对称加密密钥，
 * 若未配置则抛出错误，避免在隐式降级模式下运行导致安全问题。
 *
 * @returns JWT 对称加密密钥原始字节
 */
function getAdminJwtSecret(): Uint8Array {
    const secret = process.env.ADMIN_JWT_SECRET;
    if (!secret || secret.trim().length === 0) {
        throw new Error('ADMIN_JWT_SECRET 未配置，无法进行管理员登录认证');
    }
    return new TextEncoder().encode(secret);
}

/**
 * 创建管理员登录成功后的 JWT 字符串
 *
 * 约定：
 * - sub 固定为 "admin"
 * - role 固定为 "admin"
 * - token 有效期默认 24 小时，用于减少频繁登录
 *
 * @param username 管理员用户名
 * @returns 已签名的 JWT 字符串
 */
export async function createAdminToken(username: string): Promise<string> {
    const secret = getAdminJwtSecret();
    const now = Math.floor(Date.now() / 1000);
    const token = await new SignJWT({
        sub: 'admin',
        role: 'admin',
        username,
        iat: now,
    })
        .setProtectedHeader({ alg: 'HS256', typ: 'JWT' })
        .setIssuedAt(now)
        .setExpirationTime(now + 60 * 60 * 24)
        .sign(secret);
    return token;
}

/**
 * 解析并校验管理员 JWT
 *
 * 当 token 无效或过期时抛出错误，调用方需要捕获并按“未登录”处理，
 * 避免在异常状态下误认为已登录。
 *
 * @param token 待校验的 JWT 字符串
 * @returns 解析后的 payload 对象
 */
export async function verifyAdminToken(token: string) {
    const secret = getAdminJwtSecret();
    const result = await jwtVerify(token, secret);
    return result.payload as {
        sub?: string;
        role?: string;
        username?: string;
    };
}

/**
 * 从请求 Cookie 中提取并校验管理员身份
 *
 * 用于在 API Route 或 Server Component 中快速判断当前请求是否为已登录管理员，
 * 仅当 token 存在且通过校验并且角色为 admin 时返回 true。
 *
 * @returns 是否为已登录管理员
 */
export async function isAdminRequest(): Promise<boolean> {
    const cookieStore = await cookies();
    const token = cookieStore.get(ADMIN_TOKEN_COOKIE_KEY)?.value;
    if (!token) {
        return false;
    }
    try {
        const payload = await verifyAdminToken(token);
        if (payload.sub !== 'admin' || payload.role !== 'admin') {
            return false;
        }
        return true;
    } catch {
        return false;
    }
}

/**
 * 为当前响应设置管理员登录状态 Cookie
 *
 * 推荐在登录 API 中调用，用 HttpOnly Cookie 持久化管理员会话，
 * 避免在浏览器端暴露 JWT 内容，降低 XSS 风险。
 *
 * @param response 原始响应对象
 * @param token 已签名的 JWT 字符串
 * @returns 携带 Cookie 的响应对象
 */
export function attachAdminTokenCookie(response: Response, token: string): Response {
    const cookieStore = (response as any).cookies ?? (cookies() as any);
    cookieStore.set(ADMIN_TOKEN_COOKIE_KEY, token, {
        httpOnly: true,
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
        path: '/',
        maxAge: 60 * 60 * 24,
    });
    return response;
}

/**
 * 清除管理员登录状态 Cookie
 *
 * 在登出操作中调用，将管理员会话失效并要求重新登录，
 * 同样使用 HttpOnly 方式操作，避免由前端脚本直接控制登录态。
 *
 * @param response 原始响应对象
 * @returns 已清除 Cookie 的响应对象
 */
export function clearAdminTokenCookie(response: Response): Response {
    const cookieStore = (response as any).cookies ?? (cookies() as any);
    cookieStore.set(ADMIN_TOKEN_COOKIE_KEY, '', {
        httpOnly: true,
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
        path: '/',
        maxAge: 0,
    });
    return response;
}

