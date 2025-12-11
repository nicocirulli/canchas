import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// --------------------------------------------
// GET → LISTAR TURNOS (con filtros)
// --------------------------------------------
// /api/admin?from=2025-01-01&to=2025-01-31&includeCancelados=true
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);

    const from = searchParams.get("from");
    const to = searchParams.get("to");
    const includeCancelados = searchParams.get("includeCancelados") === "true";

    const where: any = {};

    if (!includeCancelados) {
      where.cancelado = false; // solo turnos activos
    }

    if (from || to) {
      where.horaInicio = {};
      if (from) where.horaInicio.gte = new Date(from + "T00:00:00");
      if (to) where.horaInicio.lte = new Date(to + "T23:59:59");
    }

    const turnos = await prisma.turno.findMany({
      where,
      orderBy: { horaInicio: "asc" },
      include: {
        cancha: true,
      },
    });

    return NextResponse.json(turnos);
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Error al cargar reservas" },
      { status: 500 }
    );
  }
}

// --------------------------------------------
// DELETE → CANCELAR (no borrar) UNA RESERVA
// --------------------------------------------
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) return NextResponse.json({ error: "Falta ID" }, { status: 400 });

    await prisma.turno.update({
      where: { id: Number(id) },
      data: { cancelado: true },
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Error al cancelar" },
      { status: 500 }
    );
  }
}
