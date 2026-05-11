import mongoose from "mongoose";
import dotenv from "dotenv";
import User from "../models/User.js";

dotenv.config({ path: "../.env" });

const checkAdmin = async () => {
  try {
    console.log("Connecting to MongoDB...");
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("Connected to MongoDB");

    const admins = await User.find({ role: "admin" });
    if (admins.length > 0) {
      console.log(`Found ${admins.length} admin(s):`);
      admins.forEach(admin => {
        console.log(`- ${admin.name} (${admin.email})`);
      });
    } else {
      console.log("No admins found in the database.");
    }
  } catch (error) {
    console.error("Error:", error.message);
  } finally {
    mongoose.connection.close();
  }
};

checkAdmin();
