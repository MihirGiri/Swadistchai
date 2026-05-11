import { Link, useNavigate } from "@tanstack/react-router";
import { AlertCircle, Check, MessageSquare, Star, Trash2 } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";

export default function ManageReviews() {
  const { user, token, isAdmin, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    if (!authLoading && !isAdmin) {
      navigate({ to: "/login" });
    }
  }, [isAdmin, authLoading, navigate]);

  useEffect(() => {
    fetchPendingReviews();
  }, [token]);

  const fetchPendingReviews = async () => {
    if (!token) return;
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL || "https://swadistchai-backend.onrender.com/api"}/products/admin/reviews/pending`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      const data = await response.json();
      if (data.success) {
        setReviews(data.reviews || []);
      }
    } catch (err) {
      setError("Failed to load reviews");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (productId, reviewId, status) => {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL || "https://swadistchai-backend.onrender.com/api"}/products/${productId}/reviews/${reviewId}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ status }),
        }
      );
      
      const data = await response.json();
      if (data.success) {
        setSuccess(`Review ${status} successfully`);
        setReviews(reviews.filter((r) => r.reviewId !== reviewId));
        setTimeout(() => setSuccess(""), 3000);
      } else {
        setError(data.message || "Failed to update review");
        setTimeout(() => setError(""), 3000);
      }
    } catch (err) {
      setError("Error updating review");
      setTimeout(() => setError(""), 3000);
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <h1 className="font-display text-3xl font-semibold text-foreground flex items-center gap-3">
              <MessageSquare className="text-primary" size={32} />
              Manage Reviews
            </h1>
            <p className="text-foreground/60 mt-2">Approve or reject customer product reviews</p>
          </motion.div>
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
          <div className="text-center py-20 text-foreground/60">Loading reviews...</div>
        ) : reviews.length === 0 ? (
          <div className="text-center py-20">
            <MessageSquare size={48} className="mx-auto text-muted-foreground/30 mb-4" />
            <p className="text-foreground/60">No pending reviews found</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {reviews.map((review) => (
              <motion.div
                key={review.reviewId}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-card rounded-xl p-5 border border-border shadow-sm flex flex-col md:flex-row gap-4 justify-between"
              >
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold">{review.name}</span>
                    <span className="text-xs text-muted-foreground">
                      on <Link to={`/shop/${review.productId}`} className="text-primary hover:underline">{review.productName}</Link>
                    </span>
                  </div>
                  <div className="flex items-center gap-1 mb-2 text-accent">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} size={14} className={i < review.rating ? "fill-current" : "text-muted-foreground/30"} />
                    ))}
                  </div>
                  <p className="text-sm italic text-foreground/80">"{review.comment}"</p>
                  <p className="text-xs text-muted-foreground mt-2">
                    {new Date(review.date).toLocaleString()}
                  </p>
                </div>
                <div className="flex items-center gap-2 md:flex-col justify-center">
                  <button
                    onClick={() => handleUpdateStatus(review.productId, review.reviewId, "approved")}
                    className="px-4 py-2 bg-green-500/10 text-green-600 hover:bg-green-500/20 text-xs font-semibold rounded-lg transition-smooth flex items-center gap-1 w-full justify-center"
                  >
                    <Check size={14} /> Approve
                  </button>
                  <button
                    onClick={() => handleUpdateStatus(review.productId, review.reviewId, "rejected")}
                    className="px-4 py-2 bg-red-500/10 text-red-600 hover:bg-red-500/20 text-xs font-semibold rounded-lg transition-smooth flex items-center gap-1 w-full justify-center"
                  >
                    <Trash2 size={14} /> Reject
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
