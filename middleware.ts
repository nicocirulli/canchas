import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import jwt from "jsonwebtoken";

// Rutas públicas (cualquiera puede entrar)
const PUBLIC_ROUTES = [
  "/login",
  "/register",
  "/api/auth/login",
  "/api/auth/register"
];

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Si la ruta es pública → dejar pasar
  if (PUBLIC_ROUTES.includes(pathname)) {
    return NextResponse.next();
  }

  // Intentar obtener el token de la cookie
  const token = req.cookies.get("token")?.value;

  // Si NO hay token → redirigir al login universal
  if (!token) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  try {
    const decoded: any = jwt.verify(
      token,
      process.env.JWT_SECRET || "dev-secret"
    );

    // Rutas de ADMIN protegidas
    if (pathname.startsWith("/admin") && decoded.role !== "ADMIN") {
      return NextResponse.redirect(new URL("/user", req.url));
    }

    // Rutas de USER protegidas
    if (pathname.startsWith("/user") && decoded.role !== "USER") {
      return NextResponse.redirect(new URL("/admin", req.url));
    }

    return NextResponse.next();
  } catch {
    // Token inválido → volver a login universal
    return NextResponse.redirect(new URL("/login", req.url));
  }
}

export const config = {
  matcher: ["/admin/:path*", "/user/:path*"], // ❌ sacamos /api
};
