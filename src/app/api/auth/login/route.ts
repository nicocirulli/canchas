import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || "dev-secret";

export async function POST(req: Request) {
  const { email, password } = await req.json();

  const user = await prisma.user.findUnique({ where: { email } });

  if (!user) {
    return NextResponse.json(
      { error: "Credenciales inválidas" },
      { status: 401 }
    );
  }

  const ok = await bcrypt.compare(password, user.password);
  if (!ok) {
    return NextResponse.json(
      { error: "Credenciales inválidas" },
      { status: 401 }
    );
  }

  // 🔥 Crear token con rol incluido
  const token = jwt.sign(
    { id: user.id, role: user.role, email: user.email },
    JWT_SECRET,
    { expiresIn: "7d" }
  );

  // 🔥 RESPUESTA JSON COMPLETA (lo que tu frontend necesita)
  const response = NextResponse.json({
    token,       // 👈 ahora SÍ se envía
    role: user.role,
  });

  // 🔥 Guardarlo también en cookie httpOnly
  response.cookies.set("token", token, {
    httpOnly: true,
    secure: false,       // true en producción
    sameSite: "lax",
    path: "/",
  });

  return response;
}
