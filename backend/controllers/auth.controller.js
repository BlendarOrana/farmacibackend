import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { promisePool } from "../lib/db.js";

// ─── HELPERS ──────────────────────────────────────────────────

const ACCESS_TOKEN_EXPIRY = 24 * 60 * 60; // 24h in seconds

const generateToken = (userId) =>
  jwt.sign({ userId }, process.env.ACCESS_TOKEN_SECRET, {
    expiresIn: `${ACCESS_TOKEN_EXPIRY}s`,
  });

const setCookie = (res, token) => {
  res.cookie("accessToken", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? "strict" : "lax",
    path: "/",
    maxAge: ACCESS_TOKEN_EXPIRY * 1000,
  });
};

// ─── CONTROLLERS ──────────────────────────────────────────────

// POST /api/auth/login
export const login = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: "Email and password are required" });
  }

  try {
    const { rows } = await promisePool.query(
      "SELECT * FROM admin_users WHERE email = $1",
      [email]
    );
    const admin = rows[0];

    if (!admin) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    const isMatch = await bcrypt.compare(password, admin.password_hash);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    const token = generateToken(admin.id);
    setCookie(res, token);

    res.json({ id: admin.id, email: admin.email });
  } catch (error) {
    console.error("Error in login:", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
};

// POST /api/auth/logout
export const logout = (req, res) => {
  res.clearCookie("accessToken", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? "strict" : "lax",
    path: "/",
  });
  res.json({ message: "Logged out successfully" });
};

// GET /api/auth/me  (requires protectRoute middleware)
export const getMe = async (req, res) => {
  try {
    const { rows } = await promisePool.query(
      "SELECT id, email FROM admin_users WHERE id = $1",
      [req.user.id]
    );
    if (!rows.length) return res.status(404).json({ message: "Admin not found" });
    res.json(rows[0]);
  } catch (error) {
    console.error("Error in getMe:", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
};