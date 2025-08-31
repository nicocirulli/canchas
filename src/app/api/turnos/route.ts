import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

export const runtime = "nodejs"; // necesario con Prisma en Next.js

const prisma = new PrismaClient();

// GET /api/turnos
export async function GET() {
  const turnos = await prisma.turno.findMany({
    orderBy: { id: "desc" },
  });
  return NextResponse.json(turnos);
}

// POST /api/turnos
export async function POST(req: Request) {
  const body = await req.json();
  const nuevo = await prisma.turno.create({
    data: {
      nombre: body.nombre,
      fecha: new Date(body.fecha),
    },
  });
  return NextResponse.json(nuevo);
}
