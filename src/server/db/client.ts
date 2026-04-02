// eslint-disable-next-line @typescript-eslint/no-var-requires
const prismaModule = require("@prisma/client");

let prismaClientInstance: any | null = null;

/**
 * 获取 Prisma 数据库客户端实例
 *
 * 使用全局单例模式在服务端环境中复用 PrismaClient，避免在 Serverless 或热重载场景下频繁创建连接，
 * 连接配置依赖环境变量 DATABASE_URL 及相关 SSL 配置参数，以支持外部托管的 PostgreSQL 实例。
 *
 * @returns 复用后的 PrismaClient 实例
 */
export function getDbClient() {
    if (!prismaClientInstance) {
        console.log("[DB] 准备初始化 PrismaClient，当前 DATABASE_URL:", process.env.DATABASE_URL || "未配置");
        prismaClientInstance = new prismaModule.PrismaClient({
            log: ["query", "error", "warn"],
        });
        console.log("[DB] PrismaClient 初始化完成");
    }
    return prismaClientInstance;
}
