import jwt from "jsonwebtoken";
import { promisePool } from "../lib/db.js";

// Utility to verify JWT
const verifyTokenBase = (req) => {
  let token = req.cookies?.accessToken;
  if (!token) {
    const auth = req.headers.authorization;
    if (auth?.startsWith("Bearer ")) token = auth.slice(7);
  }
  if (!token) throw new Error("No token provided");
  return jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
};

// Protect Route specifically for ADMINS
export const adminRoute = async (req, res, next) => {
  try {
    const decoded = verifyTokenBase(req);
    if (decoded.role !== 'ADMIN') return res.status(403).json({ message: "Admin access required" });

    const { rows } = await promisePool.query("SELECT id, email FROM admin_users WHERE id = $1", [decoded.id]);
    if (!rows.length) return res.status(401).json({ message: "Unauthorized - Admin not found" });

    req.user = rows[0]; // Stores admin object
    next();
  } catch (error) {
    res.status(401).json({ message: "Unauthorized - Invalid or expired token" });
  }
};

// Protect Route specifically for NORMAL APP USERS
export const protectRoute = async (req, res, next) => {
  try {
    const decoded = verifyTokenBase(req);
    if (decoded.role !== 'USER') return res.status(403).json({ message: "User access required" });

    const { rows } = await promisePool.query("SELECT id, email, name FROM users WHERE id = $1", [decoded.id]);
    if (!rows.length) return res.status(401).json({ message: "Unauthorized - User not found" });

    req.user = rows[0]; // Stores normal user object
    next();
  } catch (error) {
    res.status(401).json({ message: "Unauthorized - Please log in to continue" });
  }
};