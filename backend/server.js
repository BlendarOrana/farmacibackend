import express from "express";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import cors from "cors";
import path from "path";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import hpp from "hpp";
import compression from "compression";
import csrf from "csurf";

import authRoutes from "./routes/auth.route.js";
import adminRoutes from "./routes/admin.route.js";
import shopRoutes from "./routes/shop.route.js";

import { testS3Connection } from "./lib/s3.js";
import { connectDB } from "./lib/db.js";
import { sqlInjectionProtection } from "./lib/security/postgres.security.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const __dirname = path.resolve();

app.set("trust proxy", 1);

// ─── SECURITY HEADERS ─────────────────────────────────────────
app.use(
  helmet({
    hsts: { maxAge: 31536000, includeSubDomains: true, preload: true },
    frameguard: { action: "deny" },
    noSniff: true,
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: [
          "'self'",
          process.env.NODE_ENV !== "production" ? "'unsafe-eval'" : null,
        ].filter(Boolean),
        imgSrc: [
          "'self'",
          "data:",
          "blob:",
          `https://${process.env.CLOUDFRONT_DOMAIN}`,
          `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com`,
        ],
        mediaSrc: ["'self'", `https://${process.env.CLOUDFRONT_DOMAIN}`],
        objectSrc: ["'none'"],
        frameSrc: ["'none'"],
        connectSrc: ["'self'", `https://${process.env.CLOUDFRONT_DOMAIN}`],
        fontSrc: ["'self'", "data:", "https:"],
        manifestSrc: ["'self'"],
        workerSrc: ["'self'", "blob:"],
        childSrc: ["'self'", "blob:"],
      },
    },
    referrerPolicy: { policy: "strict-origin-when-cross-origin" },
    permittedCrossDomainPolicies: { policy: "none" },
    dnsPrefetchControl: { allow: false },
    crossOriginEmbedderPolicy: false,
    crossOriginResourcePolicy: { policy: "cross-origin" },
  })
);



const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 min
  max: 30,
  message: { error: "Too many authentication attempts, please try again later." },
  standardHeaders: true,
  legacyHeaders: false,
});

// ─── CORE MIDDLEWARE ──────────────────────────────────────────
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
app.use(cookieParser());

app.use(
  cors({
    origin: (origin, callback) => {
      if (process.env.NODE_ENV !== "production") return callback(null, true);
      const allowed = [
        process.env.FRONTEND_URL,       // set in your .env
        "https://www.farmaci-app.com",  // update to your real domain
        "https://farmaci-app.com",
        "https://farmacibackend.onrender.com",
,      ].filter(Boolean);
      // no origin = React Native / mobile — always allow
      if (!origin || allowed.includes(origin)) return callback(null, true);
      callback(new Error("Origin not allowed by CORS"));
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    allowedHeaders: ["Content-Type", "Authorization", "Cookie", "CSRF-Token", "X-Client-Type"],
  })
);

app.use(hpp());
app.use(compression());
app.use(sqlInjectionProtection);

// ─── CSRF ─────────────────────────────────────────────────────
const csrfProtection = csrf({
  cookie: {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
  },
});

// Skip CSRF for safe methods and mobile/React Native clients
const conditionalCsrf = (req, res, next) => {
  if (["GET", "HEAD", "OPTIONS"].includes(req.method)) return next();
  const clientType = req.headers["x-client-type"];
  if (clientType === "mobile" || clientType === "react-native") return next();
  csrfProtection(req, res, next);
};

// Web clients call this to get a CSRF token before mutations
app.get("/api/csrf-token", csrfProtection, (req, res) => {
  res.json({ csrfToken: req.csrfToken() });
});

// ─── ROUTES ───────────────────────────────────────────────────
app.use("/api/",  conditionalCsrf);

// Public — no auth required (React Native app + web customers)
app.use("/api/shop", shopRoutes);

// Auth — tighter rate limit
app.use("/api/auth", authLimiter, authRoutes);

// Admin dashboard — auth guards are inside the route file
app.use("/api/admin", adminRoutes);

// Health check
app.get("/health", (req, res) => res.status(200).json({ status: "OK" }));

// ─── SERVE FRONTEND (production) ──────────────────────────────
if (process.env.NODE_ENV === "production") {
  app.use(express.static(path.join(__dirname, "/frontend/dist")));
  app.get(/.*/, (req, res) =>
    res.sendFile(path.resolve(__dirname, "frontend", "dist", "index.html"))
  );
}

// ─── 404 FOR UNMATCHED API ROUTES ─────────────────────────────
app.use(/^\/api\/.*/, (req, res) => {
  res.status(404).json({ error: "API route not found" });
});

// ─── GLOBAL ERROR HANDLER ─────────────────────────────────────
app.use((err, req, res, next) => {
  if (err.code === "EBADCSRFTOKEN") {
    return res.status(403).json({ error: "Invalid CSRF token", code: "EBADCSRFTOKEN" });
  }
  if (err.message === "Origin not allowed by CORS") {
    return res.status(403).json({ error: "CORS: origin not allowed" });
  }
  console.error(err.stack);
  res.status(err.statusCode || 500).json({
    error: err.message || "Internal Server Error",
    ...(process.env.NODE_ENV !== "production" && { stack: err.stack }),
  });
});

// ─── START SERVER ─────────────────────────────────────────────
app.listen(PORT, async () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  await connectDB();
  const s3Ok = await testS3Connection();
  console.log(s3Ok ? `✅ S3 connected` : `❌ S3 connection failed`);
});