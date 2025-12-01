import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET() {
  try {
    // Buscar todas las canchas ordenadas por ID
    const canchasRaw = await prisma.cancha.findMany({
      orderBy: { id: 'asc' }
    });

    // Traducir el ID numérico (1, 2) del deporte a texto (PADEL, FUTBOL)
    const canchas = canchasRaw.map((cancha) => {
      // Asume: 1=PADEL, 2=FUTBOL (Según tu esquema)
      const tipoTexto = cancha.tipo === 2 ? 'FUTBOL' : 'PADEL';
      
      return {
        id: cancha.id,
        nombre: cancha.nombre,
        tipo: tipoTexto, 
      };
    });

    return NextResponse.json(canchas);

  } catch (error: any) {
    // Si falla, devuelve un error genérico (sin romper la app)
    console.error('CRITICAL API ERROR (canchas):', error);
    return NextResponse.json(
      { error: `Error al conectar con la base de datos para cargar canchas.` }, 
      { status: 500 }
    );
  }
}