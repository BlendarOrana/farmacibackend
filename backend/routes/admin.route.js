import express from "express";
import multer from "multer";
import { protectRoute, adminRoute } from "../middleware/auth.middleware.js";
import {
  getCategories, createCategory, deleteCategory,
  getBrands, createBrand, updateBrand, deleteBrand,
  getUsers, getTopCustomers,
  getProducts, getProduct, createProduct, updateProduct, updateStock, deleteProduct,
  getOrders, getOrder, updateOrderStatus,
  getDashboardStats,
  createBanner, updateBanner, deleteBanner, getBanners,
  createBulkDiscount, removeBulkDiscount,
  createCoupon, getCoupons, getCustomersForCoupons
} from "../controllers/admin.controller.js";

const router = express.Router();
// Increase limit slightly for multiple files
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 20 * 1024 * 1024 } });

// All admin routes require auth
router.use(adminRoute);

// ─── DASHBOARD STATS ───
router.get("/dashboard", getDashboardStats);

// ─── USERS ───
router.get("/users", getUsers);
router.get("/top-customers", getTopCustomers);
router.get("/customers-for-coupons", getCustomersForCoupons);

// ─── BRANDS ───
router.get("/brands", getBrands);
router.post("/brands", upload.single("image"), createBrand); 
router.put("/brands/:id", upload.single("image"), updateBrand);
router.delete("/brands/:id", deleteBrand);

// ─── CATEGORIES ───
router.get("/categories", getCategories);
router.post("/categories", upload.single("image"), createCategory);
router.delete("/categories/:id", deleteCategory);

// ─── PRODUCTS & DISCOUNTS (✅ UPDATED TO upload.array) ───
router.get("/products", getProducts);
router.get("/products/:id", getProduct);
router.post("/products", upload.array("images", 10), createProduct); // Up to 10 images
router.put("/products/:id", upload.array("images", 10), updateProduct); // Up to 10 images
router.patch("/products/:id/stock", updateStock);
router.delete("/products/:id", deleteProduct);

router.post("/products/discounts/bulk", createBulkDiscount);
router.post("/products/discounts/remove", removeBulkDiscount);

// ─── COUPONS ───
router.post("/coupons", createCoupon);
router.get("/coupons", getCoupons);

// ─── BANNERS ───
router.get("/banners", getBanners);
router.post("/banners", upload.single("image"), createBanner);
router.put("/banners/:id", upload.single("image"), updateBanner);
router.delete("/banners/:id", deleteBanner);

// ─── ORDERS ───
router.get("/orders", getOrders);
router.get("/orders/:id", getOrder);
router.patch("/orders/:id/status", updateOrderStatus);

export default router;