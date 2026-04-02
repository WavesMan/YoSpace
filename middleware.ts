import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';

const BACKEND_CORE_PREFIX = '/backend-core';

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
        throw new Error('ADMIN_JWT_SECRET 未配置，无法在中间件中进行管理员认证');
    }
    return new TextEncoder().encode(secret);
}

/**
 * 在中间件环境中解析并校验管理员 JWT
 *
 * 该函数仅依赖 jose 与运行时环境变量，兼容 Edge Runtime，
 * 用于在路由重写前快速判断当前请求是否为已登录管理员。
 *
 * @param token 待校验的 JWT 字符串
 * @returns 解析后的 payload 对象
 */
async function verifyAdminTokenInMiddleware(token: string) {
    const secret = getAdminJwtSecret();
    const result = await jwtVerify(token, secret);
    return result.payload as {
        sub?: string;
        role?: string;
        username?: string;
    };
}

/**
 * 获取配置的后台入口路径前缀
 *
 * 优先使用环境变量 NEXT_PUBLIC_ADMIN_PATH，未配置时退回为 "/admin"，
 * 仅允许配置为以斜杠开头的相对路径，避免意外引入完整 URL。
 *
 * @returns 后台入口路径前缀，例如 "/my-admin"
 */
function getAdminEntryPath(): string {
    const raw = process.env.NEXT_PUBLIC_ADMIN_PATH || '/admin';
    if (!raw.startsWith('/')) {
        return `/${raw}`;
    }
    return raw;
}

/**
 * 判断当前请求是否指向后台物理路由
 *
 * 当访问路径以 /backend-core 开头时视为直接访问后台物理路径，
 * 此类请求将被统一重定向到逻辑入口路径，避免暴露真实路由结构。
 *
 * @param pathname 当前请求路径
 * @returns 是否访问后台物理路径
 */
function isBackendCorePath(pathname: string): boolean {
    return pathname === BACKEND_CORE_PREFIX || pathname.startsWith(`${BACKEND_CORE_PREFIX}/`);
}

/**
 * 判断当前请求是否指向后台入口路径
 *
 * 后台入口以环境变量配置的路径为准，例如 "/my-admin"，
 * 统一在该前缀下路由到后台登录页与管理页面。
 *
 * @param pathname 当前请求路径
 * @returns 是否访问后台入口路径
 */
function isAdminEntryPath(pathname: string): boolean {
    const adminPath = getAdminEntryPath();
    return pathname === adminPath || pathname.startsWith(`${adminPath}/`);
}

/**
 * 计算从后台入口路径映射到物理后台路径的目标地址
 *
 * 例如：
 * - 入口路径为 /my-admin
 * - 请求 /my-admin/posts
 * - 重写到 /backend-core/posts
 *
 * @param request 当前请求对象
 * @returns 重写后的响应对象
 */
function rewriteToBackendCore(request: NextRequest): NextResponse {
    const adminPath = getAdminEntryPath();
    const { pathname, search } = request.nextUrl;
    const rest = pathname.slice(adminPath.length) || '';
    const targetPath = `${BACKEND_CORE_PREFIX}${rest || ''}`;
    const url = new URL(targetPath + search, request.url);
    return NextResponse.rewrite(url);
}

/**
 * 计算从物理后台路径重定向到入口路径的目标地址
 *
 * 例如：
 * - 物理路径为 /backend-core/posts
 * - 入口路径为 /my-admin
 * - 重定向到 /my-admin/posts
 *
 * @param request 当前请求对象
 * @returns 重定向响应对象
 */
function redirectToAdminEntry(request: NextRequest): NextResponse {
    const adminPath = getAdminEntryPath();
    const { pathname, search } = request.nextUrl;
    const rest = pathname.slice(BACKEND_CORE_PREFIX.length) || '';
    const targetPath = `${adminPath}${rest || ''}`;
    const url = new URL(targetPath + search, request.url);
    return NextResponse.redirect(url);
}

export async function middleware(request: NextRequest) {
    const { nextUrl } = request;
    const pathname = nextUrl.pathname;

    if (isBackendCorePath(pathname)) {
        return redirectToAdminEntry(request);
    }

    if (!isAdminEntryPath(pathname)) {
        return NextResponse.next();
    }

    const adminPath = getAdminEntryPath();
    const isLoginPath = pathname === adminPath || pathname === `${adminPath}/login`;

    const token = request.cookies.get('yo_admin_token')?.value;
    let isAdmin = false;
    if (token) {
        try {
            const payload = await verifyAdminTokenInMiddleware(token);
            if (payload.sub === 'admin' && payload.role === 'admin') {
                isAdmin = true;
            }
        } catch {
            isAdmin = false;
        }
    }

    if (!isAdmin && !isLoginPath) {
        const loginUrl = new URL(`${adminPath}/login`, request.url);
        return NextResponse.redirect(loginUrl);
    }

    return rewriteToBackendCore(request);
}

export const config = {
    matcher: ['/((?!_next/static|_next/image|favicon.ico|api).*)'],
};
