import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

export const runtime = "nodejs";
const prisma = new PrismaClient();

// GET /api/turnos  → trae ordenado por fecha asc (próximos primero)
export async function GET() {
  const turnos = await prisma.turno.findMany({
    orderBy: { fecha: "asc" },
  });
  return NextResponse.json(turnos);
}

// POST /api/turnos  → crea un turno (valida mínimamente en backend)
export async function POST(req: Request) {
  const body = await req.json();
  const nombre = String(body?.nombre ?? "").trim();
  const fechaStr = String(body?.fecha ?? "");
  const fecha = new Date(fechaStr);

  if (!nombre) {
    return NextResponse.json({ ok: false, error: "Nombre requerido" }, { status: 400 });
  }
  if (Number.isNaN(fecha.getTime())) {
    return NextResponse.json({ ok: false, error: "Fecha inválida" }, { status: 400 });
  }

  const nuevo = await prisma.turno.create({
    data: { nombre, fecha },
  });
  return NextResponse.json(nuevo);
}
