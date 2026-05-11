import { useEffect, useState } from "react";
import { AlertCircle, Check, Settings, Loader2 } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useAuth } from "../../context/AuthContext";
import { useNavigate } from "@tanstack/react-router";

export default function StoreSettings() {
  const { token, isAdmin, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  
  const [settings, setSettings] = useState({
    deliveryFee: 49,
    freeDeliveryThreshold: 499,
    freeDeliveryForAll: false,
  });

  useEffect(() => {
    if (!authLoading && !isAdmin) {
      navigate({ to: "/login" });
    }
  }, [isAdmin, authLoading, navigate]);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const response = await fetch(
          `${import.meta.env.VITE_API_URL || "https://swadistchai-backend.onrender.com/api"}/settings/delivery`
        );
        const data = await response.json();
        if (data.success && data.settings) {
          setSettings({
            deliveryFee: data.settings.deliveryFee,
            freeDeliveryThreshold: data.settings.freeDeliveryThreshold,
            freeDeliveryForAll: data.settings.freeDeliveryForAll,
          });
        }
      } catch (err) {
        setError("Failed to load settings");
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, []);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setSettings((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : Number(value),
    }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL || "https://swadistchai-backend.onrender.com/api"}/settings/delivery`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(settings),
        }
      );
      
      const data = await response.json();
      if (data.success) {
        setSuccess("Settings updated successfully!");
        setTimeout(() => setSuccess(""), 3000);
      } else {
        throw new Error(data.message || "Failed to update settings");
      }
    } catch (err) {
      setError(err.message || "An error occurred");
    } finally {
      setSaving(false);
    }
  };

  if (authLoading) return null;

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center gap-3 mb-8">
          <Settings className="text-primary" size={32} />
          <div>
            <h1 className="font-display text-3xl font-semibold text-foreground">
              Store Settings
            </h1>
            <p className="text-foreground/60 mt-1">
              Configure delivery and global store preferences
            </p>
          </div>
        </div>

        <AnimatePresence>
          {success && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="mb-6 p-4 rounded-lg bg-green-500/10 border border-green-500/30 flex items-center gap-3"
            >
              <Check className="text-green-500" size={20} />
              <p className="text-green-600 font-medium">{success}</p>
            </motion.div>
          )}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="mb-6 p-4 rounded-lg bg-red-500/10 border border-red-500/30 flex items-center gap-3"
            >
              <AlertCircle className="text-red-500" size={20} />
              <p className="text-red-600 font-medium">{error}</p>
            </motion.div>
          )}
        </AnimatePresence>

        {loading ? (
          <div className="flex items-center justify-center py-20 text-primary">
            <Loader2 className="animate-spin w-8 h-8" />
          </div>
        ) : (
          <form onSubmit={handleSave} className="bg-card rounded-2xl border border-border p-6 sm:p-8 shadow-card space-y-8">
            <div>
              <h2 className="text-lg font-semibold text-foreground mb-4 border-b border-border pb-2">
                Delivery Configuration
              </h2>
              
              <div className="space-y-6">
                {/* Free Delivery Toggle */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl border border-primary/20 bg-primary/5">
                  <div>
                    <h3 className="font-medium text-foreground">Free Delivery For All Orders</h3>
                    <p className="text-sm text-muted-foreground mt-1">If enabled, delivery fee will be zero for all orders regardless of cart total.</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer shrink-0">
                    <input 
                      type="checkbox" 
                      name="freeDeliveryForAll"
                      className="sr-only peer"
                      checked={settings.freeDeliveryForAll}
                      onChange={handleInputChange}
                    />
                    <div className="w-11 h-6 bg-muted peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                  </label>
                </div>

                {!settings.freeDeliveryForAll && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    className="grid grid-cols-1 sm:grid-cols-2 gap-6"
                  >
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">
                        Delivery Fee (₹)
                      </label>
                      <input
                        type="number"
                        name="deliveryFee"
                        value={settings.deliveryFee}
                        onChange={handleInputChange}
                        min="0"
                        className="w-full px-4 py-2.5 rounded-xl border border-border bg-background focus:ring-2 focus:ring-primary/50 outline-none transition-all"
                      />
                      <p className="text-xs text-muted-foreground mt-2">Amount charged if cart total is below the threshold.</p>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">
                        Free Delivery Threshold (₹)
                      </label>
                      <input
                        type="number"
                        name="freeDeliveryThreshold"
                        value={settings.freeDeliveryThreshold}
                        onChange={handleInputChange}
                        min="0"
                        className="w-full px-4 py-2.5 rounded-xl border border-border bg-background focus:ring-2 focus:ring-primary/50 outline-none transition-all"
                      />
                      <p className="text-xs text-muted-foreground mt-2">Cart total required to unlock free delivery.</p>
                    </div>
                  </motion.div>
                )}
              </div>
            </div>

            <div className="flex justify-end pt-4 border-t border-border">
              <button
                type="submit"
                disabled={saving}
                className="px-6 py-2.5 bg-primary text-primary-foreground font-semibold rounded-xl hover:bg-primary/90 transition-smooth disabled:opacity-50 flex items-center gap-2"
              >
                {saving && <Loader2 size={16} className="animate-spin" />}
                {saving ? "Saving..." : "Save Settings"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
