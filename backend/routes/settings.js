import express from "express";
import StoreSettings from "../models/StoreSettings.js";
import { authenticateToken } from "./auth.js";

const router = express.Router();

// Middleware to check if user is admin
const isAdmin = (req, res, next) => {
  if (req.user.role !== "admin") {
    return res.status(403).json({ success: false, message: "Admin access required" });
  }
  next();
};

// GET settings (Public)
router.get("/delivery", async (req, res) => {
  try {
    let settings = await StoreSettings.findOne();
    if (!settings) {
      settings = await StoreSettings.create({
        deliveryFee: 49,
        freeDeliveryThreshold: 499,
        freeDeliveryForAll: false,
      });
    }
    res.json({ success: true, settings });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error fetching settings" });
  }
});

// UPDATE settings (Admin)
router.put("/delivery", authenticateToken, isAdmin, async (req, res) => {
  try {
    const { deliveryFee, freeDeliveryThreshold, freeDeliveryForAll } = req.body;
    
    let settings = await StoreSettings.findOne();
    if (!settings) {
      settings = new StoreSettings();
    }
    
    if (deliveryFee !== undefined) settings.deliveryFee = deliveryFee;
    if (freeDeliveryThreshold !== undefined) settings.freeDeliveryThreshold = freeDeliveryThreshold;
    if (freeDeliveryForAll !== undefined) settings.freeDeliveryForAll = freeDeliveryForAll;
    
    await settings.save();
    
    res.json({ success: true, message: "Settings updated successfully", settings });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error updating settings" });
  }
});

export default router;
