import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { canchaId, fecha, hora, duracion, cliente, email, telefono } = body;

    // 1. Validamos que lleguen todos los datos
    if (!canchaId || !fecha || !hora || !cliente || !email || !telefono) {
        return NextResponse.json({ error: 'Faltan datos obligatorios (Email, Teléfono, etc)' }, { status: 400 });
    }

    const fechaISO = `${fecha}T${hora}:00.000Z`; 
    const horaInicio = new Date(fechaISO);
    const horaFin = new Date(horaInicio.getTime() + duracion * 60000);

    // 2. Validación 7 días
    const hoy = new Date();
    const limite = new Date();
    limite.setDate(hoy.getDate() + 7);
    if (horaInicio.getTime() > limite.getTime()) {
      return NextResponse.json({ error: 'Máximo 7 días de anticipación.' }, { status: 400 });
    }

    // 3. Validación Superposición
    const ocupado = await prisma.turno.findFirst({
      where: {
        canchaId: Number(canchaId),
        OR: [
          { horaInicio: { lt: horaFin }, horaFin: { gt: horaInicio } },
        ],
      },
    });

    if (ocupado) {
      return NextResponse.json({ error: 'La cancha ya está reservada en ese horario.' }, { status: 409 });
    }

    // 4. Crear Reserva
    const nuevoTurno = await prisma.turno.create({
      data: {
        canchaId: Number(canchaId),
        nombreCliente: cliente,
        email: email,       // Guardamos email
        telefono: telefono, // Guardamos teléfono
        horaInicio: horaInicio,
        horaFin: horaFin,
        duracionMinutos: Number(duracion),
      },
    });

    return NextResponse.json({ success: true, turno: nuevoTurno });

  } catch (error: unknown) {
    let errorMessage = 'Error interno del servidor';
    if (error instanceof Error) {
        errorMessage = error.message;
    } 
    return new Response(JSON.stringify({ error: errorMessage }), { status: 500 });
}
}