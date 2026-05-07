import express from "express";
import multer from "multer";
import { protectRoute, adminRoute } from "../middleware/auth.middleware.js";
import {
  getCategories, createCategory, deleteCategory,
  getProducts, getProduct, createProduct, updateProduct, updateStock, deleteProduct,
  getOrders, getOrder, updateOrderStatus,
  getDashboardStats,
  createBanner,
updateBanner,
deleteBanner,
getBanners
} from "../controllers/admin.controller.js";

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });

// All admin routes require auth
router.use(protectRoute, adminRoute);

// Dashboard
router.get("/dashboard", getDashboardStats);

// Categories
router.get("/categories", getCategories);
router.post("/categories", createCategory);
router.delete("/categories/:id", deleteCategory);

// Products
router.get("/products", getProducts);
router.get("/products/:id", getProduct);
router.post("/products", upload.single("image"), createProduct);
router.put("/products/:id", upload.single("image"), updateProduct);
router.patch("/products/:id/stock", updateStock);
router.delete("/products/:id", deleteProduct);

router.get("/banners", getBanners);
router.post("/banners", upload.single("image"), createBanner);
router.put("/banners/:id", upload.single("image"), updateBanner);
router.delete("/banners/:id", deleteBanner);

// Orders
router.get("/orders", getOrders);
router.get("/orders/:id", getOrder);
router.patch("/orders/:id/status", updateOrderStatus);

export default router;