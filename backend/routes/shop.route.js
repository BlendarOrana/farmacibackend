import express from "express";
import {
  getPublicProducts, getPublicProduct, getPublicCategories,
  placeOrder, getOrderStatus, getActiveBanners
} from "../controllers/shop.controller.js";

const router = express.Router();

// Product browsing (public)
router.get("/categories", getPublicCategories);
router.get("/products", getPublicProducts);
router.get("/products/:id", getPublicProduct);

router.get("/banners", getActiveBanners);

// Orders (no auth - mobile app clients)
router.post("/orders", placeOrder);
router.get("/orders/:id", getOrderStatus);


export default router;