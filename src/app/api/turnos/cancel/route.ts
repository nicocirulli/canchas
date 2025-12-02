import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma'; // Importa la instancia segura de Prisma


// Handler para solicitudes DELETE (eliminar una reserva)
export async function DELETE(request: Request) {
  try {
    const body = await request.json();
    const rawId = body.id; // Leemos el ID como viene (puede ser string)
    
    // CORRECCIÓN: Convertimos explícitamente el ID a un número entero para Prisma
    const reservaId = parseInt(rawId, 10); 

    // Validación: verificamos que la conversión sea un número válido y positivo
    if (isNaN(reservaId) || reservaId <= 0) {
      return NextResponse.json({ error: 'ID de reserva no válido o faltante.' }, { status: 400 });
    }

    // Usamos Prisma para encontrar y eliminar la reserva por su ID
    // Usamos 'turno' porque es el nombre de tu modelo en schema.prisma
    const deletedReserva = await prisma.turno.delete({
      where: {
        id: reservaId, // Aquí se usa el número entero
      },
    });

    // Respuesta de éxito
    return NextResponse.json({ 
      message: `Reserva con ID ${deletedReserva.id} cancelada con éxito.`,
      id: deletedReserva.id 
    });

  } catch (error: any) {
    // Si la reserva no existe, Prisma lanza un error P2025
    if (error.code === 'P2025') {
        return NextResponse.json({ error: 'La reserva no fue encontrada o ya fue cancelada.' }, { status: 404 });
    }
    
    console.error('Error al cancelar reserva:', error);
    // Para depuración, a veces es útil retornar el mensaje de error de Prisma
    return NextResponse.json({ error: 'Error interno del servidor al cancelar la reserva.', details: error.message }, { status: 500 });
  }
}