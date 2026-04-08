import { NextRequest, NextResponse } from "next/server";

const BACKEND_CORE_PREFIX = "/backend-core";
const DEFAULT_ADMIN_PATH = "/admin";
const ADMIN_PATH_CACHE_TTL_MS = 5000;

let cachedAdminPath = DEFAULT_ADMIN_PATH;
let cachedAdminPathExpiresAt = 0;

function buildRequestHeadersWithPath(request: NextRequest, adminPath: string): Headers {
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-yospace-pathname", request.nextUrl.pathname);
  requestHeaders.set("x-yospace-admin-path", adminPath);
  return requestHeaders;
}

function isBackendCorePath(pathname: string): boolean {
  return pathname === BACKEND_CORE_PREFIX || pathname.startsWith(`${BACKEND_CORE_PREFIX}/`);
}

function isAdminEntryPath(pathname: string, adminPath: string): boolean {
  return pathname === adminPath || pathname.startsWith(`${adminPath}/`);
}

async function getAdminEntryPath(request: NextRequest): Promise<string> {
  const now = Date.now();
  if (cachedAdminPath && cachedAdminPathExpiresAt > now) {
    return cachedAdminPath;
  }

  try {
    const verifyUrl = new URL("/api/runtime/admin-entry", request.url);
    const response = await fetch(verifyUrl, {
      method: "GET",
      headers: {
        cookie: request.headers.get("cookie") || "",
      },
      cache: "no-store",
    });

    if (response.ok) {
      const data = (await response.json()) as { adminPath?: string };
      const path = typeof data?.adminPath === "string" ? data.adminPath : DEFAULT_ADMIN_PATH;
      if (path.startsWith("/")) {
        cachedAdminPath = path;
        cachedAdminPathExpiresAt = now + ADMIN_PATH_CACHE_TTL_MS;
        return cachedAdminPath;
      }
    }
  } catch {
  }

  cachedAdminPath = DEFAULT_ADMIN_PATH;
  cachedAdminPathExpiresAt = now + ADMIN_PATH_CACHE_TTL_MS;
  return cachedAdminPath;
}

async function isAdminAuthenticated(request: NextRequest): Promise<boolean> {
  try {
    const verifyUrl = new URL("/api/admin/session/verify", request.url);
    const response = await fetch(verifyUrl, {
      method: "GET",
      headers: {
        cookie: request.headers.get("cookie") || "",
      },
      cache: "no-store",
    });

    if (!response.ok) {
      return false;
    }

    const data = (await response.json()) as { ok?: boolean };
    return data.ok === true;
  } catch {
    return false;
  }
}

function buildBackendRewriteUrl(request: NextRequest, adminPath: string): URL {
  const { pathname, search } = request.nextUrl;
  const rest = pathname.slice(adminPath.length) || "";
  const targetPath = `${BACKEND_CORE_PREFIX}${rest || ""}`;
  return new URL(targetPath + search, request.url);
}

function redirectToAdminEntry(request: NextRequest, adminPath: string): NextResponse {
  const { pathname, search } = request.nextUrl;
  const rest = pathname.slice(BACKEND_CORE_PREFIX.length) || "";
  const targetPath = `${adminPath}${rest || ""}`;
  return NextResponse.redirect(new URL(targetPath + search, request.url));
}

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const adminPath = await getAdminEntryPath(request);
  const requestHeaders = buildRequestHeadersWithPath(request, adminPath);

  if (isBackendCorePath(pathname)) {
    return redirectToAdminEntry(request, adminPath);
  }

  if (adminPath !== DEFAULT_ADMIN_PATH && (pathname === DEFAULT_ADMIN_PATH || pathname.startsWith(`${DEFAULT_ADMIN_PATH}/`))) {
    return new NextResponse("Not Found", { status: 404 });
  }

  if (!isAdminEntryPath(pathname, adminPath)) {
    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });
  }

  const adminLoginPath = `${adminPath}/login`;
  const isAdmin = await isAdminAuthenticated(request);

  if (pathname === adminLoginPath) {
    return NextResponse.redirect(new URL(adminPath, request.url));
  }

  if (pathname === adminPath) {
    if (isAdmin) {
      return NextResponse.rewrite(buildBackendRewriteUrl(request, adminPath), {
        request: {
          headers: requestHeaders,
        },
      });
    }

    return NextResponse.rewrite(new URL(`${BACKEND_CORE_PREFIX}/login`, request.url), {
      request: {
        headers: requestHeaders,
      },
    });
  }

  if (!isAdmin) {
    return NextResponse.redirect(new URL(adminPath, request.url));
  }

  return NextResponse.rewrite(buildBackendRewriteUrl(request, adminPath), {
    request: {
      headers: requestHeaders,
    },
  });
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|api).*)"],
};