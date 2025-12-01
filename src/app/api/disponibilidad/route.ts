import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const fecha = searchParams.get('fecha'); // YYYY-MM-DD

  // CORRECCIÓN: Solo validamos la fecha. NO pedimos deporte.
  if (!fecha) {
    return NextResponse.json({ error: 'Falta la fecha' }, { status: 400 });
  }

  try {
    // Crear rango de fecha para buscar todo el día (UTC)
    const startOfDay = new Date(`${fecha}T00:00:00.000Z`);
    const endOfDay = new Date(`${fecha}T23:59:59.999Z`);

    const turnos = await prisma.turno.findMany({
      where: {
        horaInicio: {
          gte: startOfDay,
          lte: endOfDay,
        },
      },
      select: {
        canchaId: true, // Importante para saber cual borrar de la lista
        horaInicio: true,
        horaFin: true,
      },
    });

    return NextResponse.json(turnos);

  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Error al buscar disponibilidad' }, { status: 500 });
  }
}