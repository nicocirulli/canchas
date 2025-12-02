import { PrismaClient } from '@prisma/client'

// Creamos un tipo global en Node.js para que TypeScript sepa
// que podemos adjuntar la instancia de Prisma al objeto global.
declare global {
  var prisma: PrismaClient | undefined
}

// 1. Intentamos usar la instancia global si ya existe.
// Esto es CRUCIAL para evitar que Next.js cree nuevas conexiones
// con cada Hot Module Reload (HMR) en desarrollo.
const prisma = global.prisma || new PrismaClient()

// 2. Si no estamos en producción, guardamos la instancia en el objeto global.
if (process.env.NODE_ENV !== 'production') global.prisma = prisma

// 3. Exportamos la única instancia segura.
export default prisma