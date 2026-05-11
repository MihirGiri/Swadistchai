import express from "express";
import multer from "multer";
import path from "path";
import { fileURLToPath } from "url";
import Product from "../models/Product.js";
import Order from "../models/Order.js";
import { authenticateToken } from "./auth.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'swadistchai_products',
    allowed_formats: ['jpg', 'png', 'webp', 'jpeg', 'gif']
  },
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Only image files are allowed"), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
});

// Middleware to check if user is admin
const isAdmin = (req, res, next) => {
  if (req.user.role !== "admin") {
    return res
      .status(403)
      .json({ success: false, message: "Admin access required" });
  }
  next();
};

// Upload image endpoint
router.post("/upload/image", authenticateToken, isAdmin, upload.single("image"), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "No image file provided",
      });
    }

    const imageUrl = req.file.path;

    res.json({
      success: true,
      message: "Image uploaded successfully",
      imageUrl,
      filename: req.file.filename,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || "Error uploading image",
    });
  }
});

// Upload multiple images
router.post("/upload/multiple", authenticateToken, isAdmin, upload.array("images", 5), (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No image files provided",
      });
    }

    const imageUrls = req.files.map(file => ({
      url: file.path,
      filename: file.filename || file.originalname,
    }));

    res.json({
      success: true,
      message: `${req.files.length} images uploaded successfully`,
      images: imageUrls,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || "Error uploading images",
    });
  }
});

// Get all products
router.get("/", async (req, res) => {
  try {
    const { category, search, sort } = req.query;
    let query = {};

    if (category) {
      query.category = category;
    }

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
      ];
    }

    let products = Product.find(query);

    if (sort === "price-asc") products = products.sort({ price: 1 });
    else if (sort === "price-desc") products = products.sort({ price: -1 });
    else if (sort === "newest") products = products.sort({ createdAt: -1 });
    else products = products.sort({ featured: -1 });

    const result = await products.populate("createdBy", "name email");

    res.json({ success: true, products: result });
  } catch (error) {
    res
      .status(500)
      .json({ success: false, message: error.message || "Error fetching products" });
  }
});

// Get single product
router.get("/:id", async (req, res) => {
  try {
    const product = await Product.findById(req.params.id).populate(
      "createdBy",
      "name email"
    );

    if (!product) {
      return res
        .status(404)
        .json({ success: false, message: "Product not found" });
    }

    res.json({ success: true, product });
  } catch (error) {
    res
      .status(500)
      .json({ success: false, message: error.message || "Error fetching product" });
  }
});

// Create product (Admin only)
router.post("/", authenticateToken, isAdmin, async (req, res) => {
  try {
    const {
      name,
      description,
      price,
      category,
      image,
      hoverImage,
      images,
      healthBenefits,
      featured,
      stock,
    } = req.body;

    if (!name || !description || !price || !category || !image) {
      return res
        .status(400)
        .json({ success: false, message: "Missing required fields" });
    }

    const product = new Product({
      name,
      description,
      price,
      category,
      image,
      hoverImage,
      images: images || [],
      healthBenefits: healthBenefits || [],
      featured: featured || false,
      stock: stock || 100,
      createdBy: req.user.id,
    });

    await product.save();

    res.status(201).json({
      success: true,
      message: "Product created successfully",
      product,
    });
  } catch (error) {
    res
      .status(500)
      .json({ success: false, message: error.message || "Error creating product" });
  }
});

// Update product (Admin only)
router.put("/:id", authenticateToken, isAdmin, async (req, res) => {
  try {
    const {
      name,
      description,
      price,
      category,
      image,
      hoverImage,
      images,
      healthBenefits,
      featured,
      stock,
      inStock,
    } = req.body;

    let product = await Product.findById(req.params.id);

    if (!product) {
      return res
        .status(404)
        .json({ success: false, message: "Product not found" });
    }

    // Update fields if provided
    if (name) product.name = name;
    if (description) product.description = description;
    if (price !== undefined && price !== null && price !== "") product.price = price;
    if (category) product.category = category;
    if (image) product.image = image;
    if (hoverImage !== undefined) product.hoverImage = hoverImage;
    if (images) product.images = images;
    if (healthBenefits) product.healthBenefits = healthBenefits;
    if (featured !== undefined) product.featured = featured;
    if (stock !== undefined && stock !== null && stock !== "") product.stock = stock;
    if (inStock !== undefined) product.inStock = inStock;

    await product.save();

    res.json({
      success: true,
      message: "Product updated successfully",
      product,
    });
  } catch (error) {
    res
      .status(500)
      .json({ success: false, message: error.message || "Error updating product" });
  }
});

// Delete product (Admin only)
router.delete("/:id", authenticateToken, isAdmin, async (req, res) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);

    if (!product) {
      return res
        .status(404)
        .json({ success: false, message: "Product not found" });
    }

    res.json({
      success: true,
      message: "Product deleted successfully",
    });
  } catch (error) {
    res
      .status(500)
      .json({ success: false, message: error.message || "Error deleting product" });
  }
});

// Get all reviews of the logged-in user
router.get("/user/reviews", authenticateToken, async (req, res) => {
  try {
    const products = await Product.find({ "reviews.userId": req.user.id });
    const userReviews = [];

    products.forEach(product => {
      const review = product.reviews.find(r => r.userId?.toString() === req.user.id);
      if (review) {
        userReviews.push({
          productId: product._id,
          productName: product.name,
          ...review.toObject()
        });
      }
    });

    res.json({ success: true, reviews: userReviews });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message || "Error fetching your reviews" });
  }
});

// Submit a review for a product
router.post("/:id/reviews", authenticateToken, async (req, res) => {
  try {
    const { rating, comment } = req.body;
    
    if (!rating || !comment) {
      return res.status(400).json({ success: false, message: "Rating and comment are required" });
    }

    // Check if user has bought this product and order is delivered
    const hasBought = await Order.findOne({
      user: req.user.id,
      status: "delivered",
      "items.product": req.params.id
    });

    if (!hasBought && req.user.role !== "admin") {
      return res.status(403).json({ success: false, message: "You can only review products you have bought and received" });
    }

    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ success: false, message: "Product not found" });

    // Check if user already reviewed
    const alreadyReviewed = product.reviews.find(r => r.userId?.toString() === req.user.id);
    if (alreadyReviewed) {
      return res.status(400).json({ success: false, message: "You have already reviewed this product. You can edit it instead." });
    }

    const review = {
      userId: req.user.id,
      name: req.user.name || "Customer",
      rating: Number(rating),
      comment,
      status: "pending"
    };

    product.reviews.push(review);
    await product.save();

    res.status(201).json({ success: true, message: "Review submitted for approval", review });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Edit user's own review
router.put("/:id/reviews", authenticateToken, async (req, res) => {
  try {
    const { rating, comment } = req.body;
    
    if (!rating || !comment) {
      return res.status(400).json({ success: false, message: "Rating and comment are required" });
    }

    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ success: false, message: "Product not found" });

    const review = product.reviews.find(r => r.userId?.toString() === req.user.id);
    if (!review) {
      return res.status(404).json({ success: false, message: "Review not found" });
    }

    review.rating = Number(rating);
    review.comment = comment;
    review.status = "pending"; // Requires re-approval
    review.date = Date.now();

    await product.save();

    // Recalculate if it was approved
    const approvedReviews = product.reviews.filter((r) => r.status === "approved");
    product.rating = approvedReviews.length > 0
      ? approvedReviews.reduce((acc, item) => item.rating + acc, 0) / approvedReviews.length
      : 0;
    product.reviewCount = approvedReviews.length;
    await product.save();

    res.json({ success: true, message: "Review updated and submitted for approval", review });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Delete user's own review
router.delete("/:id/reviews", authenticateToken, async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ success: false, message: "Product not found" });

    const reviewIndex = product.reviews.findIndex(r => r.userId?.toString() === req.user.id);
    if (reviewIndex === -1) {
      return res.status(404).json({ success: false, message: "Review not found" });
    }

    product.reviews.splice(reviewIndex, 1);
    
    // Recalculate
    const approvedReviews = product.reviews.filter((r) => r.status === "approved");
    product.rating = approvedReviews.length > 0
      ? approvedReviews.reduce((acc, item) => item.rating + acc, 0) / approvedReviews.length
      : 0;
    product.reviewCount = approvedReviews.length;
    
    await product.save();

    res.json({ success: true, message: "Review deleted successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get pending reviews (Admin only)
router.get("/admin/reviews/pending", authenticateToken, isAdmin, async (req, res) => {
  try {
    const products = await Product.find({ "reviews.status": "pending" });
    
    let pendingReviews = [];
    products.forEach(p => {
      p.reviews.forEach(r => {
        if (r.status === "pending") {
          pendingReviews.push({
            productId: p._id,
            productName: p.name,
            reviewId: r._id,
            userId: r.userId,
            name: r.name,
            rating: r.rating,
            comment: r.comment,
            date: r.date
          });
        }
      });
    });

    res.json({ success: true, reviews: pendingReviews });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Update review status (Admin only)
router.patch("/:productId/reviews/:reviewId", authenticateToken, isAdmin, async (req, res) => {
  try {
    const { status } = req.body;
    if (!["approved", "rejected"].includes(status)) {
      return res.status(400).json({ success: false, message: "Invalid status" });
    }

    const product = await Product.findById(req.params.productId);
    if (!product) return res.status(404).json({ success: false, message: "Product not found" });

    const review = product.reviews.id(req.params.reviewId);
    if (!review) return res.status(404).json({ success: false, message: "Review not found" });

    review.status = status;

    // Recalculate average rating and review count ONLY for approved reviews
    const approvedReviews = product.reviews.filter(r => r.status === "approved");
    product.reviewCount = approvedReviews.length;
    
    if (approvedReviews.length > 0) {
      const sum = approvedReviews.reduce((acc, r) => acc + r.rating, 0);
      product.rating = (sum / approvedReviews.length).toFixed(1);
    } else {
      product.rating = 0;
    }

    await product.save();

    res.json({ success: true, message: `Review ${status} successfully` });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
