// scripts/test-prisma.ts
import "dotenv/config";              // <— carga .env
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  // sanity check opcional:
  console.log("DB URL starts with:", process.env.DATABASE_URL?.slice(0, 60));

  const turnos = await prisma.turno.findMany();
  console.log("Turnos:", turnos);
}

main()
  .catch((e) => console.error(e))
  .finally(() => prisma.$disconnect());
