// One-time seed for the first CTO account, run before this change is usable
// at all - there is no other way to log in once ADMIN_PASSWORD is removed.
// Idempotent: skips if any account already exists, same pattern as
// seed-agenda.ts's duplicate guard.
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const existing = await prisma.adminAccount.count();
  if (existing > 0) {
    console.log(`AdminAccount already has ${existing} row(s) - skipping seed.`);
    return;
  }

  const email = process.env.INITIAL_CTO_EMAIL;
  const password = process.env.INITIAL_CTO_PASSWORD;
  if (!email || !password) {
    console.error("Set INITIAL_CTO_EMAIL and INITIAL_CTO_PASSWORD in .env before running this seed.");
    process.exit(1);
  }

  const passwordHash = await bcrypt.hash(password, 10);
  await prisma.adminAccount.create({
    data: { email, passwordHash, name: "CTO", role: "CTO", active: true },
  });
  console.log(`Seeded initial CTO account: ${email}`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
