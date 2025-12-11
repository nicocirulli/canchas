import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function DELETE(request: Request) {
  try {
    const body = await request.json();
    const rawId = body.id;

    // Convertimos el ID a número
    const reservaId = parseInt(rawId, 10);

    if (isNaN(reservaId) || reservaId <= 0) {
      return NextResponse.json(
        { error: "ID de reserva inválido." },
        { status: 400 }
      );
    }

    // CAMBIO CLAVE:
    // En vez de delete() → update() con cancelado: true
    const updated = await prisma.turno.update({
      where: { id: reservaId },
      data: { cancelado: true }
    });

    return NextResponse.json({
      message: "Reserva cancelada correctamente.",
      id: updated.id,
      cancelado: updated.cancelado
    });

  } catch (error: any) {
    if (error.code === "P2025") {
      return NextResponse.json(
        { error: "La reserva no existe o ya fue cancelada." },
        { status: 404 }
      );
    }

    console.error("Error al cancelar reserva:", error);
    return NextResponse.json(
      {
        error: "Error interno al cancelar la reserva.",
        details: error.message
      },
      { status: 500 }
    );
  }
}
