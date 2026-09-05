import express from "express";
import { protectRoute } from "../middleware/auth.middleware.js";

// Importohet nga controlleri i RI (Product)
import {
  getPublicProducts, 
  getPublicProductDetail, 
  getPublicCategories,
  getPublicCategoryProducts,
  searchPublicProducts,
  getRelatedCategoryProducts,
  getPublicBrands,
  getDiscountedProducts,
getBrandProducts
} from "../controllers/product.controller.js";

import {
  placeOrder, 
  getActiveBanners, 
  validateCoupon,
  getUserCoupons,
  markCouponAsRead,
  getUserFavorites,
  toggleFavorite,
  getMyOrders
} from "../controllers/shop.controller.js";

const router = express.Router();

// ----- PUBLIC ENDPOINTS (No Login required to View) -----
router.get("/categories", getPublicCategories);
router.get("/brands", getPublicBrands);

router.get("/categories/:id/products", getPublicCategoryProducts); 
router.get('/categories/:categoryId/related', getRelatedCategoryProducts);
router.get("/products", getPublicProducts); 
router.get("/products/search", searchPublicProducts); 
router.get("/products/:id", getPublicProductDetail);
router.get("/banners", getActiveBanners);

// ----- PROTECTED APP ENDPOINTS (App login required to Purchase/View User Features) -----

// Personal Coupons
router.get("/coupons/my-coupons", protectRoute, getUserCoupons);
router.patch("/coupons/:id/read", protectRoute, markCouponAsRead);

// Place Orders
router.post("/coupons/validate", protectRoute, validateCoupon); 
router.post("/orders", protectRoute, placeOrder);

// Favorites
router.get("/favorites", protectRoute, getUserFavorites);
router.post("/favorites/toggle", protectRoute, toggleFavorite);
router.get("/products/discounted", getDiscountedProducts);
router.get("/brands/:brandId/products", getBrandProducts);

// Orders
router.get("/orders/me", protectRoute, getMyOrders);

export default router;