import bcrypt from "bcrypt";
import { prisma } from "../utils/db.js";
import { signToken } from "../utils/jwt.js";

const SALT_ROUNDS = 10;

export async function signup(req, res) {
  const { email, password, full_name } = req.body;

  if (!email || !password || !full_name) {
    return res.status(400).json({
      success: false,
      message: "email, password, and full_name are required.",
    });
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res
      .status(400)
      .json({ success: false, message: "Invalid email format." });
  }

  if (password.length < 6) {
    return res.status(400).json({
      success: false,
      message: "Password must be at least 6 characters long.",
    });
  }

  try {
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return res
        .status(409)
        .json({ success: false, message: "Email is already registered." });
    }

    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);
    const user = await prisma.user.create({
      data: { email, password: hashedPassword, full_name },
      select: { id: true, email: true, full_name: true, created_at: true },
    });

    const token = signToken({ id: user.id, email: user.email });

    return res.status(201).json({
      success: true,
      message: "Account created successfully.",
      data: { user, token },
    });
  } catch (err) {
    console.error("[signup]", err);
    return res
      .status(500)
      .json({ success: false, message: "Internal server error." });
  }
}

export async function login(req, res) {
  const { email, password } = req.body;

  if (!email || !password) {
    return res
      .status(400)
      .json({ success: false, message: "email and password are required." });
  }

  try {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res
        .status(401)
        .json({ success: false, message: "Invalid email or password." });
    }

    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      return res
        .status(401)
        .json({ success: false, message: "Invalid email or password." });
    }

    const token = signToken({ id: user.id, email: user.email });

    return res.status(200).json({
      success: true,
      message: "Login successful.",
      data: {
        user: { id: user.id, email: user.email, full_name: user.full_name },
        token,
      },
    });
  } catch (err) {
    console.error("[login]", err);
    return res
      .status(500)
      .json({ success: false, message: "Internal server error." });
  }
}

export async function verify(req, res) {
  const { id } = req.user;

  try {
    const user = await prisma.user.findUnique({
      where: { id },
      select: { id: true, email: true, full_name: true, created_at: true },
    });

    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found." });
    }

    return res.status(200).json({
      success: true,
      message: "Token is valid.",
      data: { user },
    });
  } catch (err) {
    console.error("[verify]", err);
    return res
      .status(500)
      .json({ success: false, message: "Internal server error." });
  }
}
