import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// GET: Traer TODAS las reservas (incluyendo info de la cancha)
export async function GET() {
  try {
    const turnos = await prisma.turno.findMany({
      orderBy: {
        horaInicio: 'desc', // Los más recientes primero
      },
      include: {
        cancha: true, // ¡Esto es clave! Trae el nombre de la cancha asociada
      },
    });

    return NextResponse.json(turnos);
  } catch (error) {
    return NextResponse.json({ error: 'Error al cargar reservas' }, { status: 500 });
  }
}

// DELETE: Borrar una reserva por ID
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Falta ID' }, { status: 400 });
    }

    await prisma.turno.delete({
      where: { id: Number(id) },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Error al eliminar' }, { status: 500 });
  }
}