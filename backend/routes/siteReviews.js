import express from "express";
import SiteReview from "../models/SiteReview.js";
import { authenticateToken } from "./auth.js";

const router = express.Router();

const isAdmin = (req, res, next) => {
  if (req.user.role !== "admin") {
    return res.status(403).json({ success: false, message: "Admin access required" });
  }
  next();
};

// Get all approved site reviews (Public)
router.get("/", async (req, res) => {
  try {
    const reviews = await SiteReview.find({ status: "approved" }).sort({ createdAt: -1 });
    res.json({ success: true, reviews });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Submit a site review
router.post("/", authenticateToken, async (req, res) => {
  try {
    const { rating, comment } = req.body;
    
    if (!rating || !comment) {
      return res.status(400).json({ success: false, message: "Rating and comment are required" });
    }

    // Check if user already submitted a review
    const existing = await SiteReview.findOne({ userId: req.user.id });
    if (existing) {
      return res.status(400).json({ success: false, message: "You have already submitted a website review. You can edit it from your profile." });
    }

    const review = new SiteReview({
      userId: req.user.id,
      name: req.user.name || "Customer",
      rating: Number(rating),
      comment,
      status: "pending"
    });

    await review.save();
    res.status(201).json({ success: true, message: "Review submitted for approval", review });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Edit own site review
router.put("/me", authenticateToken, async (req, res) => {
  try {
    const { rating, comment } = req.body;
    
    if (!rating || !comment) {
      return res.status(400).json({ success: false, message: "Rating and comment are required" });
    }

    const review = await SiteReview.findOne({ userId: req.user.id });
    if (!review) {
      return res.status(404).json({ success: false, message: "Review not found" });
    }

    review.rating = Number(rating);
    review.comment = comment;
    review.status = "pending";
    await review.save();

    res.json({ success: true, message: "Review updated and submitted for approval", review });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get own site review
router.get("/me", authenticateToken, async (req, res) => {
  try {
    const review = await SiteReview.findOne({ userId: req.user.id });
    res.json({ success: true, review });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Delete own site review
router.delete("/me", authenticateToken, async (req, res) => {
  try {
    const review = await SiteReview.findOneAndDelete({ userId: req.user.id });
    if (!review) {
      return res.status(404).json({ success: false, message: "Review not found" });
    }
    res.json({ success: true, message: "Review deleted successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Admin: Get all pending reviews
router.get("/admin/pending", authenticateToken, isAdmin, async (req, res) => {
  try {
    const reviews = await SiteReview.find({ status: "pending" }).sort({ createdAt: -1 });
    res.json({ success: true, reviews });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Admin: Update review status
router.patch("/admin/:id/status", authenticateToken, isAdmin, async (req, res) => {
  try {
    const { status } = req.body;
    if (!["approved", "rejected"].includes(status)) {
      return res.status(400).json({ success: false, message: "Invalid status" });
    }

    const review = await SiteReview.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );

    if (!review) {
      return res.status(404).json({ success: false, message: "Review not found" });
    }

    res.json({ success: true, message: `Review ${status} successfully`, review });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
