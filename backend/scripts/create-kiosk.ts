import "dotenv/config";
import * as readline from "readline/promises";
import { stdin as input, stdout as output } from "process";
import argon2 from "argon2";
import prisma from "../services/prismaClient.ts";

const rl = readline.createInterface({ input, output });

const ask = (question: string) => rl.question(question);

const askPassword = async (prompt: string): Promise<string> => {
  // Hide input on supported terminals
  if (process.stdout.isTTY) {
    process.stdout.write(prompt);
    return new Promise((resolve) => {
      let password = "";
      process.stdin.setRawMode(true);
      process.stdin.resume();
      process.stdin.setEncoding("utf8");
      process.stdin.on("data", function handler(ch: string) {
        if (ch === "\r" || ch === "\n") {
          process.stdin.setRawMode(false);
          process.stdin.pause();
          process.stdin.removeListener("data", handler);
          process.stdout.write("\n");
          resolve(password);
        } else if (ch === "\u0003") {
          process.stdout.write("\n");
          process.exit();
        } else if (ch === "\u007f") {
          if (password.length > 0) {
            password = password.slice(0, -1);
            process.stdout.write("\b \b");
          }
        } else {
          password += ch;
          process.stdout.write("*");
        }
      });
    });
  }
  return rl.question(prompt);
};

async function main() {
  console.log("\n=== QR Kiosk Account Setup ===\n");

  const fullName = (await ask("Display name: ")).trim();
  if (!fullName) { console.error("Name cannot be empty."); process.exit(1); }

  const email = (await ask("Email address: ")).trim().toLowerCase();
  if (!email || !/\S+@\S+\.\S+/.test(email)) {
    console.error("Invalid email address.");
    process.exit(1);
  }

  const password = await askPassword("Password: ");
  if (password.length < 6) {
    console.error("Password must be at least 6 characters.");
    process.exit(1);
  }

  const confirm = await askPassword("Confirm password: ");
  if (password !== confirm) {
    console.error("Passwords do not match.");
    process.exit(1);
  }

  rl.close();

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    if (existing.role === "QR_KIOSK") {
      console.error(`\nA QR_KIOSK account already exists for ${email}.`);
    } else {
      console.error(`\nAn account with role ${existing.role} already exists for ${email}.`);
    }
    process.exit(1);
  }

  const hashed = await argon2.hash(password);

  const user = await prisma.user.create({
    data: { fullName, email, password: hashed, role: "QR_KIOSK" },
    select: { id: true, fullName: true, email: true, role: true },
  });

  console.log("\n✓ Kiosk account created successfully:");
  console.log(`  Name  : ${user.fullName}`);
  console.log(`  Email : ${user.email}`);
  console.log(`  Role  : ${user.role}`);
  console.log(`  ID    : ${user.id}`);
  console.log("\nUse these credentials to log in at /attendance/qr/login\n");
}

main().catch((err) => {
  console.error("\nError:", err.message);
  process.exit(1);
});
