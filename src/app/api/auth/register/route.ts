import { NextResponse } from "next/server";
import { PrismaClient, Role } from "@prisma/client";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email y contraseña son obligatorios" },
        { status: 400 }
      );
    }

    // Verificar si ya existe
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json(
        { error: "El usuario ya existe" },
        { status: 400 }
      );
    }

    // Encriptar contraseña
    const hashed = await bcrypt.hash(password, 10);

    // Crear usuario con rol USER
    const user = await prisma.user.create({
      data: {
        email,
        password: hashed,
        role: Role.USER,
      },
    });

    return NextResponse.json({ success: true, user });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Error en el servidor" },
      { status: 500 }
    );
  }
}
