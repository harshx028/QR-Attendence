import argon2 from "argon2";
import prisma from "../services/prismaClient.ts";

const DEMO_ACCOUNTS = [
  {
    fullName: "Demo Admin",
    email: "admin@demo.com",
    password: "admin123",
    role: "ADMIN" as const,
  },
  {
    fullName: "Demo User",
    email: "user@demo.com",
    password: "user123",
    role: "USER" as const,
  },
];

const main = async () => {
  for (const account of DEMO_ACCOUNTS) {
    const hashedPassword = await argon2.hash(account.password);

    await prisma.user.upsert({
      where: { email: account.email },
      update: {
        fullName: account.fullName,
        password: hashedPassword,
        role: account.role,
      },
      create: {
        fullName: account.fullName,
        email: account.email,
        password: hashedPassword,
        role: account.role,
      },
    });

    console.log(`Seeded ${account.role} account: ${account.email} / ${account.password}`);
  }
};

main()
  .catch((error) => {
    console.error("Seeding failed:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
