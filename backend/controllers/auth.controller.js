import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { promisePool } from "../lib/db.js";

const ACCESS_TOKEN_EXPIRY = 24 * 60 * 60; // 24h 

const generateToken = (id, role) =>
  jwt.sign(
    { id, role }, 
    process.env.ACCESS_TOKEN_SECRET || "SUPER_SECRET", 
    { expiresIn: `${ACCESS_TOKEN_EXPIRY}s` }
  );

const setCookie = (res, token) => {
  res.cookie("accessToken", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? "strict" : "lax",
    path: "/",
    maxAge: ACCESS_TOKEN_EXPIRY * 1000,
  });
};

// ==========================================
// ─── ADMIN AUTH ───────────────────────────
// ==========================================
export const adminLogin = async (req, res) => {
  const { email, password } = req.body;
  try {
    const { rows } = await promisePool.query("SELECT * FROM admin_users WHERE email = $1", [email]);
    if (!rows.length || !(await bcrypt.compare(password, rows[0].password_hash))) {
      return res.status(401).json({ message: "Kredenciale të pavlefshme për administrator!" });
    }
    setCookie(res, generateToken(rows[0].id, 'ADMIN'));
    res.json({ id: rows[0].id, email: rows[0].email, role: 'ADMIN' });
  } catch (error) {
    res.status(500).json({ message: "Internal server error" });
  }
};

export const adminGetMe = async (req, res) => {
  try {
    // req.user comes directly from your `adminRoute` middleware!
    res.json({ id: req.user.id, email: req.user.email, role: 'ADMIN' });
  } catch (error) {
    res.status(500).json({ message: "Internal server error" });
  }
};


// ==========================================
// ─── APP USER AUTH (CUSTOMERS) ────────────
// ==========================================
export const registerUser = async (req, res) => {
  const { name, email, password, phone_number, address, city } = req.body;
  
  if (!name || !email || !password) {
      return res.status(400).json({ message: "Fusha të rëndësishme mungojnë (Name, Email, Password)" });
  }

  try {
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(password, salt);

    const { rows } = await promisePool.query(
      `INSERT INTO users (name, email, password_hash, phone_number, address, city) 
       VALUES ($1, $2, $3, $4, $5, $6) 
       RETURNING id, name, email, phone_number, address, city`,
      [name, email, hash, phone_number || null, address || null, city || null]
    );

    const token = generateToken(rows[0].id, 'USER');
    setCookie(res, token); // Optional: good if they log in via web later
    
    // Pass back token so the Mobile App instantly logs them in without a 2nd request
    res.status(201).json({ ...rows[0], token });
  } catch (error) {
    if (error.code === '23505') {
      return res.status(400).json({ message: "Ky Email tashmë ekziston" });
    }
    res.status(500).json({ message: error.message });
  }
};

export const loginUser = async (req, res) => {
  const { email, password } = req.body;
  try {
    const { rows } = await promisePool.query("SELECT * FROM users WHERE email = $1", [email]);
    
    if (!rows.length || !(await bcrypt.compare(password, rows[0].password_hash))) {
      return res.status(401).json({ message: "Email apo fjalëkalim i pasaktë" });
    }
    
    const token = generateToken(rows[0].id, 'USER');
    setCookie(res, token);
    
    const { password_hash, ...userProfile } = rows[0]; 
    res.json({ ...userProfile, token }); 
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

export const getMe = async (req, res) => {
  try {
    // protectRoute middleware provides req.user.id
    const { rows } = await promisePool.query(
      "SELECT id, name, email, phone_number, address, city, created_at FROM users WHERE id = $1",
      [req.user.id]
    );
    if (!rows.length) return res.status(404).json({ message: "Përdoruesi nuk u gjet" });
    res.json(rows[0]);
  } catch (error) {
    res.status(500).json({ message: "Internal server error" });
  }
};

export const logout = (req, res) => {
  res.clearCookie("accessToken", { path: "/" });
  res.json({ message: "Logged out successfully" });
};