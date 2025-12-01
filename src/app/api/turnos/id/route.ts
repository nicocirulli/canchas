import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

export const runtime = "nodejs";
const prisma = new PrismaClient();

// Se elimina la interfaz RouteContext ya que Next.js la rechaza para este uso.

/**
 * Maneja la solicitud DELETE para eliminar un turno por su ID.
 * La ruta es dinámica: /api/turnos/[id]
 */
export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } } // FIX: Usamos desestructuración en línea (patrón estándar de Next.js)
) {
  // Accedemos al ID a través de la desestructuración
  const idParam = params.id; 
  
  const id = Number(idParam);
  
  if (Number.isNaN(id)) {
    // Validación de formato de ID
    return NextResponse.json({ ok: false, error: "ID de turno inválido" }, { status: 400 });
  }

  try {
    // Eliminar el turno de la base de datos
    await prisma.turno.delete({ where: { id } });
    
    return NextResponse.json({ ok: true, message: `Turno ID ${id} eliminado correctamente.` });

  } catch (error: unknown) {
    // Manejo de errores de Prisma
    let errorMessage = 'Error interno del servidor al intentar eliminar el turno.';

    // P2025: Error específico de Prisma cuando el registro a eliminar no existe
    if (typeof error === 'object' && error !== null && 'code' in error && error.code === 'P2025') {
      errorMessage = `El turno con ID ${id} no fue encontrado.`;
      return NextResponse.json({ ok: false, error: errorMessage }, { status: 404 });
    }

    if (error instanceof Error) {
      errorMessage = error.message;
    }

    // Error 500 para cualquier otro error de servidor o conexión
    return NextResponse.json({ ok: false, error: errorMessage }, { status: 500 });
  }
}