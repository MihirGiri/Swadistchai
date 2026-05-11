import mongoose from "mongoose";

const storeSettingsSchema = new mongoose.Schema({
  deliveryFee: {
    type: Number,
    default: 49,
  },
  freeDeliveryThreshold: {
    type: Number,
    default: 499,
  },
  freeDeliveryForAll: {
    type: Boolean,
    default: false,
  },
});

export default mongoose.model("StoreSettings", storeSettingsSchema);
