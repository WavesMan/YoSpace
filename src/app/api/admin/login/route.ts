import { NextRequest, NextResponse } from 'next/server';
import { createAdminToken } from '@/server/auth/adminAuth';

/**
 * 管理员登录接口
 *
 * 接收用户名与密码，校验通过后签发管理员 JWT，并通过 HttpOnly Cookie 写回客户端。
 * 账号信息来自环境变量：
 * - ADMIN_USERNAME：管理员用户名
 * - ADMIN_PASSWORD：管理员密码（生产环境建议使用更安全的哈希方案）
 *
 * 请求体示例：
 * {
 *   "username": "admin",
 *   "password": "your_password"
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const username = typeof body?.username === 'string' ? body.username.trim() : '';
    const password = typeof body?.password === 'string' ? body.password : '';

    const expectedUsername = process.env.ADMIN_USERNAME || 'admin';
    const expectedPassword = process.env.ADMIN_PASSWORD || '';

    if (!expectedPassword) {
      console.error('ADMIN_PASSWORD 未配置，禁止管理员登录请求');
      return NextResponse.json({ message: '管理员登录未启用' }, { status: 503 });
    }

    if (username !== expectedUsername || password !== expectedPassword) {
      return NextResponse.json({ message: '用户名或密码错误' }, { status: 401 });
    }

    const token = await createAdminToken(username);
    const response = NextResponse.json({ message: 'Login success' });
    response.cookies.set('yo_admin_token', token, {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: 60 * 60 * 24,
    });
    return response;
  } catch (error) {
    console.error('Admin login error:', error);
    return NextResponse.json({ message: 'Login failed' }, { status: 500 });
  }
}

