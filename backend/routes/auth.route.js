import express from "express";
import { registerUser, loginUser, logout, getMe, adminLogin, adminGetMe } from "../controllers/auth.controller.js";
import { protectRoute, adminRoute } from "../middleware/auth.middleware.js";

const router = express.Router();

// ─── USER AUTH ───────────────────────────────────────
// Fix applied: Match mapping explicitly (-user ending matches what useAuthStore expects!)
router.post("/register-user", registerUser);
router.post("/login-user", loginUser);
router.post("/logout", logout);
router.get("/me", protectRoute, getMe);

// ─── ADMIN AUTH ───────────────────────────────────────
router.post("/admin/login", adminLogin);
// ADDED THIS ROUTE:
router.get("/admin/me", adminRoute, adminGetMe); 

export default router;