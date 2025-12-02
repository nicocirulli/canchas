import { NextResponse } from 'next/server';
// Asegúrate de que este archivo exista en src/lib/prisma.ts para evitar el Error 500 en desarrollo
import prisma from '@/lib/prisma';


// Handler para solicitudes GET (obtiene las reservas del usuario)
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userEmail = searchParams.get('email');

    if (!userEmail) {
      return NextResponse.json({ error: 'Falta el email del usuario para buscar reservas.' }, { status: 400 });
    }

    // Consulta a la Base de Datos usando Prisma
    // CAMBIO CRÍTICO 1: Usamos 'prisma.turno' en lugar de 'prisma.reserva'
    const reservas = await prisma.turno.findMany({ 
      where: {
        // CAMBIO CRÍTICO 2: Usamos 'email' en lugar de 'userEmail' para coincidir con el schema
        email: userEmail, 
        // Opcional: filtro para solo mostrar reservas futuras (si la fecha es un timestamp válido)
        // horaInicio: {
        //   gte: new Date(),
        // }
      },
      // Incluimos la data de la cancha para mostrar el nombre
      include: {
        cancha: true, 
      },
      // Ordenamos las reservas por fecha ascendente
      orderBy: {
        horaInicio: 'asc', 
      }
    });

    return NextResponse.json(reservas);

  } catch (error) {
    // Si sigue fallando, este console.error te dará el mensaje detallado en la terminal.
    console.error('CRÍTICO: Error al obtener reservas del usuario. (Prisma Error Detallado):', error);
    return NextResponse.json({ error: 'Error interno del servidor. (Verificar log de Prisma)' }, { status: 500 });
  }
}