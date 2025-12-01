import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { Prisma } from '@prisma/client'; // Importamos Prisma para tipado seguro de errores

const prisma = new PrismaClient();

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { canchaId, fecha, hora, duracion, cliente, email, telefono } = body;

    // 1. Validamos que lleguen todos los datos
    if (!canchaId || !fecha || !hora || !cliente || !email || !telefono) {
        return NextResponse.json({ error: 'Faltan datos obligatorios (Cliente, Email, Teléfono, Cancha, Fecha, Hora).' }, { status: 400 });
    }

    // --- FIX ZONA HORARIA Y CREACIÓN DE FECHAS ---
    // Creamos las fechas usando el formato ISO 8601 UTC ('Z') para asegurar la coherencia
    // y evitar conflictos de zona horaria entre el cliente, el servidor y la DB.
    const fechaISO = `${fecha}T${hora}:00.000Z`; 
    const horaInicio = new Date(fechaISO);
    const horaFin = new Date(horaInicio.getTime() + Number(duracion) * 60000);

    // **Validación de Fechas:** Verificamos que las fechas sean válidas
    if (isNaN(horaInicio.getTime()) || isNaN(horaFin.getTime())) {
        return NextResponse.json({ error: 'Fecha y/o hora inválida generada.' }, { status: 400 });
    }

    // 2. Validación 7 días (Limitar reservas futuras)
    const hoy = new Date();
    const limite = new Date();
    limite.setDate(hoy.getDate() + 7);
    
    if (horaInicio.getTime() > limite.getTime()) {
      return NextResponse.json({ error: 'Máximo 7 días de anticipación para reservas.' }, { status: 400 });
    }

    // 3. Validación Superposición (Consulta robusta de intersección de rangos)
    // Condición: El nuevo turno comienza antes de que termine el existente (lt: less than)
    // Y el nuevo turno termina después de que empiece el existente (gt: greater than)
    const ocupado = await prisma.turno.findFirst({
      where: {
        canchaId: Number(canchaId),
        horaInicio: { lt: horaFin }, // Nuevo inicio < Fin existente
        horaFin: { gt: horaInicio }, // Nuevo fin > Inicio existente
      },
    });
    // 

    if (ocupado) {
      return NextResponse.json({ error: 'La cancha ya está reservada en ese horario. Por favor, revisa la disponibilidad.' }, { status: 409 });
    }

    // 4. Crear Reserva
    const nuevoTurno = await prisma.turno.create({
      data: {
        canchaId: Number(canchaId),
        nombreCliente: cliente,
        email: email,       // Guardamos email
        telefono: telefono, // Guardamos teléfono
        horaInicio: horaInicio,
        horaFin: horaFin,
        duracionMinutos: Number(duracion),
      },
    });

    return NextResponse.json({ success: true, turno: nuevoTurno }, { status: 201 });

  } catch (error: unknown) {
    let errorMessage = 'Error interno del servidor al crear el turno.';
    
    // Tipado seguro para errores de Prisma
    const prismaError = error as Prisma.PrismaClientKnownRequestError;
    if (prismaError.code) {
        errorMessage = `Error de Prisma: ${prismaError.code}`;
    }

    if (error instanceof Error) {
        errorMessage = error.message;
    } 
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}