import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET() {
  try {
    // Buscar todas las canchas ordenadas por ID
    const canchasRaw = await prisma.cancha.findMany({
      orderBy: { id: 'asc' }
    });

    // Traducir el ID numérico (1, 2) del deporte a texto (PADEL, FUTBOL).
    // Nota: Es mejor usar ENUMs en el esquema de Prisma para evitar lógica manual.
    const canchas = canchasRaw.map((cancha) => {
      // Asume: 1=PADEL, 2=FUTBOL (Según tu esquema)
      const tipoTexto = cancha.tipo === 2 ? 'FUTBOL' : 'PADEL';
      
      return {
        id: cancha.id,
        nombre: cancha.nombre,
        tipo: tipoTexto as 'FUTBOL' | 'PADEL', 
      };
    });

    return NextResponse.json(canchas);

  } catch (error: unknown) { // ¡Error de sintaxis corregido aquí!
    let errorMessage = 'Error interno del servidor al obtener canchas.';
    if (error instanceof Error) {
      errorMessage = error.message;
    } 
    // Devolvemos una respuesta de error 500
    return new Response(JSON.stringify({ error: errorMessage }), { status: 500 });
  }
}