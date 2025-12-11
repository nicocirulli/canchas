import 'dotenv/config';
import { PrismaClient, Role } from "@prisma/client";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

async function main() {
  const email = "admin@nicocanchas.com";
  const password = "admin123";
  const hashed = await bcrypt.hash(password, 10);

  const admin = await prisma.user.upsert({
    where: { email },
    update: { password: hashed, role: Role.ADMIN },
    create: { email, password: hashed, role: Role.ADMIN },
  });

  console.log("Admin creado/actualizado:");
  console.log(admin);
}

main()
  .catch((err) => console.error(err))
  .finally(() => prisma.$disconnect());
