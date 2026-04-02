import { NextRequest, NextResponse } from 'next/server';

/**
 * 管理员登出接口
 *
 * 通过将 yo_admin_token Cookie 过期来失效当前管理员会话，
 * 不关心现有 token 是否有效，调用后统一视为未登录状态。
 */
export async function POST(_request: NextRequest) {
  const response = NextResponse.json({ message: 'Logout success' });
  response.cookies.set('yo_admin_token', '', {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 0,
  });
  return response;
}

