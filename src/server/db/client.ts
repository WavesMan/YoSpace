import { PrismaClient } from "@prisma/client";

declare global {
  // eslint-disable-next-line no-var
  var yoSpacePrisma: PrismaClient | undefined;
}

/**
 * 获取 Prisma 数据库客户端实例
 *
 * 使用 globalThis 持久化单例，避免 Next.js 开发态热重载重复创建连接。
 *
 * @returns 可复用的 PrismaClient 实例
 */
export function getDbClient(): PrismaClient {
  if (!global.yoSpacePrisma) {
    global.yoSpacePrisma = new PrismaClient({
      log: ["error", "warn"],
    });
  }
  return global.yoSpacePrisma;
}