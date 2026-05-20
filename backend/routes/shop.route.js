import express from "express";
import {
  getPublicProducts, 
  getPublicProductDetail, 
  getPublicCategories,
  getPublicCategoryProducts, // <-- Add this new controller
  placeOrder, 
  getActiveBanners, 
  searchPublicProducts,
  getRelatedCategoryProducts,
  validateCoupon,

} from "../controllers/shop.controller.js";

const router = express.Router();

// Categories
router.get("/categories", getPublicCategories);
router.get("/categories/:id/products", getPublicCategoryProducts); 
router.get('/categories/:categoryId/related', getRelatedCategoryProducts);






router.post("/coupons/validate", validateCoupon); // App uses this to check validity
router.post("/orders", placeOrder);

// Products
router.get("/products", getPublicProducts); 
router.get("/products/search", searchPublicProducts); 
router.get("/products/:id", getPublicProductDetail);

// Banners & Orders
router.get("/banners", getActiveBanners);


export default router;