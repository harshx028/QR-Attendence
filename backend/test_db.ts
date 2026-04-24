import prisma from "./services/prismaClient";

async function main() {
  try {
    const userCount = await prisma.user.count();
    console.log(`Successfully connected. User count: ${userCount}`);
  } catch (error) {
    console.error("Connection failed:", error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
