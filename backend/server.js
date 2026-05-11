import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import mongoose from "mongoose";
import path from "path";
import { fileURLToPath } from "url";
import User from "./models/User.js";
import authRoutes from "./routes/auth.js";
import productRoutes from "./routes/products.js";
import wishlistRoutes from "./routes/wishlist.js";
import orderRoutes from "./routes/orders.js";
import customerRoutes from "./routes/customers.js";
import statsRoutes from "./routes/stats.js";
import heroSlidesRoutes from "./routes/heroSlides.js";
import uploadRoutes from "./routes/upload.js";
import bannerOffersRoutes from "./routes/bannerOffers.js";
import settingsRoutes from "./routes/settings.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(express.json());
app.use(
  cors({
    origin: function (origin, callback) {
      callback(null, true);
    },
    credentials: true,
  })
);

// Serve static files for uploads
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Connect to MongoDB with retry logic
const connectMongoDB = async (retries = 5) => {
  // Convert SRV to standard connection string if needed
  let uri = process.env.MONGODB_URI;
  if (uri.includes('mongodb+srv://')) {
    // For SRV format, mongoose handles it automatically with DNS lookup
    // But if DNS is blocked, we need standard format
    console.log("Using connection string as provided...");
  }
  
  for (let i = 0; i < retries; i++) {
    try {
      await mongoose.connect(uri, {
        serverSelectionTimeoutMS: 5000,
        connectTimeoutMS: 10000,
        socketTimeoutMS: 45000,
        retryWrites: true,
        w: 'majority',
        maxPoolSize: 10,
        maxIdleTimeMS: 30000,
        family: 4 // Force IPv4 to fix DNS ECONNREFUSED issues on Windows
      });
      console.log("✅ MongoDB connected");
      
      // Seed default admin user if it doesn't exist
      try {
        const adminExists = await User.findOne({ email: "admin@tealeaf.com" });
        if (!adminExists) {
          const newAdmin = new User({
            name: "Admin",
            email: "admin@tealeaf.com",
            password: "Mihir@832302",
            role: "admin",
            phone: "+91-1234567890",
            address: "TeaLeaf HQ, India",
          });
          await newAdmin.save();
          console.log("✅ Default Admin user created on startup!");
        }
      } catch (seedErr) {
        console.error("❌ Error seeding admin:", seedErr.message);
      }
      
      return;
    } catch (err) {
      console.error(`❌ Attempt ${i + 1} failed:`, err.message);
      if (i < retries - 1) {
        console.log(`Retrying in 3 seconds...`);
        await new Promise(resolve => setTimeout(resolve, 3000));
      } else {
        console.error("❌ Failed to connect to MongoDB after retries");
        // Instead of exiting, keep the server running so frontend works
        console.log("⚠️  MongoDB not available, but server is running");
      }
    }
  }
};

connectMongoDB();

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/products", productRoutes);
app.use("/api/wishlist", wishlistRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/customers", customerRoutes);
app.use("/api/stats", statsRoutes);
app.use("/api/hero-slides", heroSlidesRoutes);
app.use("/api/upload", uploadRoutes);
app.use("/api/banner-offers", bannerOffersRoutes);
app.use("/api/settings", settingsRoutes);

// Health check
app.get("/api/health", (req, res) => {
  res.json({ success: true, message: "Server is running" });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
