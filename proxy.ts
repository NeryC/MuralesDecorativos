import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { env } from "@/lib/env";

// Rate limiting: Map en memoria (se resetea en cold starts, aceptable para este caso de uso)
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_MAX = 10;
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 60 segundos
// Rutas exactas a proteger (POST /api/murales crea murales, POST /api/upload sube imágenes)
// También incluye /api/murales/[id]/report — es POST público y merece protección
const RATE_LIMITED_PATHS = ["/api/upload"];

function isRateLimited(ip: string, pathname: string): boolean {
  // Aplicar en /api/upload y cualquier POST a /api/murales (crear o reportar)
  const isMuralesPost = pathname === "/api/murales" || pathname.startsWith("/api/murales/");
  const isUploadPost = RATE_LIMITED_PATHS.some((path) => pathname.startsWith(path));
  if (!isMuralesPost && !isUploadPost) {
    return false;
  }

  const now = Date.now();
  // Agrupar todas las rutas /api/murales/* bajo la misma key para contar el total
  // Esto da 10 req/min por IP para TODA la familia murales, no 10 por sub-ruta
  const routeFamily = isMuralesPost ? "murales" : "upload";
  const key = `${ip}:${routeFamily}`;
  const record = rateLimitMap.get(key);

  if (!record || now > record.resetAt) {
    rateLimitMap.set(key, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return false;
  }

  record.count++;
  if (record.count > RATE_LIMIT_MAX) {
    return true;
  }

  return false;
}

export async function proxy(request: NextRequest) {
  // Rate limiting solo en POSTs
  if (request.method === "POST") {
    const ip =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      request.headers.get("x-real-ip") ||
      "127.0.0.1";

    if (isRateLimited(ip, request.nextUrl.pathname)) {
      return NextResponse.json(
        { error: "Demasiadas solicitudes. Intentá de nuevo en un minuto." },
        { status: 429 },
      );
    }
  }

  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabase = createServerClient(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Admin guard — protect /admin/* except /admin/login
  const { pathname } = request.nextUrl;
  const isAdminPath = pathname.startsWith("/admin") && !pathname.startsWith("/admin/login");

  if (isAdminPath && !user) {
    const redirectUrl = new URL("/admin/login", request.url);
    redirectUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(redirectUrl);
  }

  // If already authenticated and visiting the login page, go to admin
  if (user && pathname === "/admin/login") {
    return NextResponse.redirect(new URL("/admin", request.url));
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
