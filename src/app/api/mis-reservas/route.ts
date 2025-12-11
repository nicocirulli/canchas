import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// Offset horario Argentina UTC-3
const ARG_OFFSET = -3; // horas

function toArgentina(date: Date) {
  const newDate = new Date(date);
  newDate.setHours(newDate.getHours() + ARG_OFFSET);
  return newDate;
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userEmail = searchParams.get('email');

    if (!userEmail) {
      return NextResponse.json(
        { error: 'Falta el email del usuario.' },
        { status: 400 }
      );
    }

    // Hora actual en Argentina (UTC → Argentina)
    const ahoraUTC = new Date();
    const ahoraARG = toArgentina(ahoraUTC);

    // Obtener reservas
    const reservas = await prisma.turno.findMany({
      where: { email: userEmail },
      include: { cancha: true },
      orderBy: { horaInicio: 'asc' }
    });

    const pendientes: any[] = [];
    const pasadas: any[] = [];

    for (const r of reservas) {
      const horaUTC = new Date(r.horaInicio);
      const horaARG = toArgentina(horaUTC);

      if (horaARG > ahoraARG) pendientes.push(r);
      else pasadas.push(r);
    }

    return NextResponse.json({ pendientes, pasadas });

  } catch (error) {
    console.error('Error en /api/mis-reservas:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor.' },
      { status: 500 }
    );
  }
}
