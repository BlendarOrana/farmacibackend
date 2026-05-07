import jwt from "jsonwebtoken";
import { promisePool } from "../lib/db.js";

export const protectRoute = async (req, res, next) => {
  // Support both cookie (web) and Bearer token (if needed later)
  let token = req.cookies?.accessToken;

  if (!token) {
    const auth = req.headers.authorization;
    if (auth?.startsWith("Bearer ")) token = auth.slice(7);
  }

  if (!token) {
    return res.status(401).json({ message: "Unauthorized - No token provided" });
  }

  try {
    const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);

    const { rows } = await promisePool.query(
      "SELECT id, email FROM admin_users WHERE id = $1",
      [decoded.userId]
    );

    if (!rows.length) {
      return res.status(401).json({ message: "Unauthorized - Admin not found" });
    }

    req.user = rows[0];
    next();
  } catch (error) {
    const message =
      error.name === "TokenExpiredError"
        ? "Unauthorized - Token expired"
        : "Unauthorized - Invalid token";
    res.status(401).json({ message });
  }
};

// Kept for route-level use if you ever add roles to admin_users
export const adminRoute = (req, res, next) => {
  if (req.user) return next();
  res.status(403).json({ message: "Access denied" });
};