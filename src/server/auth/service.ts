import { randomBytes } from "node:crypto";
import { getDbClient } from "@/server/db/client";
import {
  generatePasswordSalt,
  hashPassword,
  validatePasswordStrength,
  verifyPassword,
} from "@/server/security/password";

const ADMIN_SESSION_TTL_SECONDS = 60 * 60 * 24;
const ADMIN_SCHEMA_NOT_READY_ERROR =
  "Admin auth models are not ready. Run: pnpm prisma db push && pnpm prisma generate";

export interface AdminSessionResult {
  accountId: string;
  username: string;
  sessionToken: string;
  expiresAt: Date;
}

interface AdminAccountDelegate {
  count: (args?: unknown) => Promise<number>;
  create: (args: unknown) => Promise<unknown>;
  findUnique: (args: unknown) => Promise<unknown>;
  update: (args: unknown) => Promise<unknown>;
}

interface AdminSessionDelegate {
  create: (args: unknown) => Promise<unknown>;
  findUnique: (args: unknown) => Promise<unknown>;
  update: (args: unknown) => Promise<unknown>;
  updateMany: (args: unknown) => Promise<unknown>;
}

/**
 * 获取管理员账号模型委托。
 */
function getAdminAccountDelegate(): AdminAccountDelegate {
  const db = getDbClient() as unknown as { adminAccount?: AdminAccountDelegate };
  if (!db.adminAccount) {
    throw new Error(ADMIN_SCHEMA_NOT_READY_ERROR);
  }
  return db.adminAccount;
}

/**
 * 获取管理员会话模型委托。
 */
function getAdminSessionDelegate(): AdminSessionDelegate {
  const db = getDbClient() as unknown as { adminSession?: AdminSessionDelegate };
  if (!db.adminSession) {
    throw new Error(ADMIN_SCHEMA_NOT_READY_ERROR);
  }
  return db.adminSession;
}

/**
 * 判断是否为管理员模型未就绪错误。
 */
export function isAdminSchemaNotReadyError(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error);
  return message.includes("Admin auth models are not ready");
}

/**
 * 首次引导管理员账号。
 */
async function bootstrapAdminAccountIfNeeded(): Promise<void> {
  const adminAccount = getAdminAccountDelegate();
  const total = await adminAccount.count();
  if (total > 0) {
    return;
  }

  const username = (process.env.ADMIN_USERNAME || "admin").trim() || "admin";
  const password = process.env.ADMIN_PASSWORD || "";

  if (!password) {
    throw new Error("Initial admin bootstrap failed: ADMIN_PASSWORD is required");
  }

  validatePasswordStrength(password);
  const salt = generatePasswordSalt();
  const passwordHash = hashPassword(password, salt);

  await adminAccount.create({
    data: {
      username,
      passwordSalt: salt,
      passwordHash,
    },
  });
}

/**
 * 管理员登录。
 */
export async function loginAdminWithPassword(username: string, password: string): Promise<AdminSessionResult> {
  await bootstrapAdminAccountIfNeeded();

  const adminAccount = getAdminAccountDelegate();
  const adminSession = getAdminSessionDelegate();
  const account = (await adminAccount.findUnique({
    where: { username },
    select: {
      id: true,
      username: true,
      passwordSalt: true,
      passwordHash: true,
      tokenVersion: true,
    },
  })) as {
    id: string;
    username: string;
    passwordSalt: string;
    passwordHash: string;
    tokenVersion: number;
  } | null;

  if (!account || !verifyPassword(password, account.passwordSalt, account.passwordHash)) {
    throw new Error("Invalid username or password");
  }

  const sessionToken = randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + ADMIN_SESSION_TTL_SECONDS * 1000);

  await adminSession.create({
    data: {
      accountId: account.id,
      token: sessionToken,
      tokenVersion: account.tokenVersion,
      expiresAt,
    },
  });

  return {
    accountId: account.id,
    username: account.username,
    sessionToken,
    expiresAt,
  };
}

/**
 * 校验管理员会话。
 */
export async function verifyAdminSession(
  sessionToken: string,
): Promise<{ valid: boolean; username?: string; accountId?: string }> {
  if (!sessionToken) {
    return { valid: false };
  }

  const adminSession = getAdminSessionDelegate();
  const session = (await adminSession.findUnique({
    where: { token: sessionToken },
    include: {
      account: {
        select: {
          id: true,
          username: true,
          tokenVersion: true,
        },
      },
    },
  })) as {
    id: string;
    tokenVersion: number;
    revokedAt: Date | null;
    expiresAt: Date;
    account?: {
      id: string;
      username: string;
      tokenVersion: number;
    } | null;
  } | null;

  if (!session) {
    return { valid: false };
  }

  const now = new Date();
  if (session.revokedAt || session.expiresAt <= now) {
    return { valid: false };
  }

  if (!session.account || session.tokenVersion !== session.account.tokenVersion) {
    return { valid: false };
  }

  await adminSession.update({
    where: { id: session.id },
    data: { lastAccessedAt: now },
  });

  return {
    valid: true,
    username: session.account.username,
    accountId: session.account.id,
  };
}

/**
 * 注销单个管理员会话。
 */
export async function revokeAdminSession(sessionToken: string): Promise<void> {
  if (!sessionToken) {
    return;
  }

  const adminSession = getAdminSessionDelegate();
  await adminSession.updateMany({
    where: {
      token: sessionToken,
      revokedAt: null,
    },
    data: {
      revokedAt: new Date(),
    },
  });
}

/**
 * 修改管理员账号与密码。
 */
export async function changeAdminCredentials(params: {
  accountId: string;
  oldPassword: string;
  nextUsername: string;
  nextPassword: string;
}): Promise<void> {
  const { accountId, oldPassword, nextUsername, nextPassword } = params;
  const normalizedUsername = nextUsername.trim();
  if (!normalizedUsername) {
    throw new Error("Username is required");
  }

  validatePasswordStrength(nextPassword);

  const db = getDbClient();
  const adminAccount = getAdminAccountDelegate();
  const adminSession = getAdminSessionDelegate();
  const account = (await adminAccount.findUnique({
    where: { id: accountId },
    select: {
      id: true,
      passwordHash: true,
      passwordSalt: true,
      tokenVersion: true,
    },
  })) as {
    id: string;
    passwordHash: string;
    passwordSalt: string;
    tokenVersion: number;
  } | null;

  if (!account || !verifyPassword(oldPassword, account.passwordSalt, account.passwordHash)) {
    throw new Error("Current password is invalid");
  }

  const salt = generatePasswordSalt();
  const passwordHash = hashPassword(nextPassword, salt);
  const nextTokenVersion = account.tokenVersion + 1;

  await (db as unknown as {
    $transaction: (actions: Promise<unknown>[]) => Promise<unknown>;
  }).$transaction([
    adminAccount.update({
      where: { id: accountId },
      data: {
        username: normalizedUsername,
        passwordSalt: salt,
        passwordHash,
        tokenVersion: nextTokenVersion,
      },
    }),
    adminSession.updateMany({
      where: {
        accountId,
        revokedAt: null,
      },
      data: {
        revokedAt: new Date(),
      },
    }),
  ]);
}
