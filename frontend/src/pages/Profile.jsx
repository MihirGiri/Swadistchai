import { Link, useNavigate } from "@tanstack/react-router";
import { LogOut, Package, Star, MessageSquareHeart, X } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { useEffect, useState } from "react";
import SectionContainer from "../components/SectionContainer";
import { useAuth } from "../context/AuthContext";

export default function Profile() {
  const { token, user, logout, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState("");
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewError, setReviewError] = useState("");
  const [reviewSuccess, setReviewSuccess] = useState("");
  const [hasExistingReview, setHasExistingReview] = useState(false);

  useEffect(() => {
    const fetchSiteReview = async () => {
      if (!token) return;
      try {
        const res = await fetch(`${import.meta.env.VITE_API_URL || "https://swadistchai-backend.onrender.com/api"}/site-reviews/me`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        if (data.success && data.review) {
          setHasExistingReview(true);
          setReviewRating(data.review.rating);
          setReviewComment(data.review.comment);
        }
      } catch (err) {
        console.error(err);
      }
    };
    if (user) fetchSiteReview();
  }, [token, user]);

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    setSubmittingReview(true);
    setReviewError("");
    setReviewSuccess("");

    try {
      const method = hasExistingReview ? "PUT" : "POST";
      const url = hasExistingReview 
        ? `${import.meta.env.VITE_API_URL || "https://swadistchai-backend.onrender.com/api"}/site-reviews/me`
        : `${import.meta.env.VITE_API_URL || "https://swadistchai-backend.onrender.com/api"}/site-reviews`;

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ rating: reviewRating, comment: reviewComment }),
      });

      const data = await response.json();
      if (!data.success) throw new Error(data.message);

      setHasExistingReview(true);
      setReviewSuccess("Website review submitted successfully! It will appear after admin approval.");
      setTimeout(() => setShowReviewModal(false), 3000);
    } catch (error) {
      setReviewError(error.message || "Failed to submit review");
    } finally {
      setSubmittingReview(false);
    }
  };

  const handleReviewDelete = async () => {
    if (!window.confirm("Are you sure you want to delete your website review?")) return;
    setSubmittingReview(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || "https://swadistchai-backend.onrender.com/api"}/site-reviews/me`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();
      if (!data.success) throw new Error(data.message);
      
      setHasExistingReview(false);
      setReviewRating(5);
      setReviewComment("");
      setReviewSuccess("Review deleted successfully.");
      setTimeout(() => setShowReviewModal(false), 2000);
    } catch (error) {
      setReviewError(error.message || "Failed to delete review");
    } finally {
      setSubmittingReview(false);
    }
  };

  useEffect(() => {
    if (!authLoading && !user) {
      navigate({ to: "/login" });
    }
  }, [user, authLoading, navigate]);

  const handleLogout = () => {
    logout();
    navigate({ to: "/" });
  };

  if (authLoading || !user) return null;

  return (
    <div className="pt-20 lg:pt-28 min-h-screen bg-background pb-16">
      <SectionContainer>
        <div className="max-w-3xl mx-auto">
          <div className="flex items-center gap-3 mb-8">
            <MessageSquareHeart className="text-primary w-8 h-8" />
            <h1 className="font-display text-3xl font-semibold text-foreground">
              My Profile
            </h1>
          </div>

          <div className="bg-card rounded-2xl border border-border overflow-hidden shadow-card p-6 md:p-8">
            <div className="flex flex-col md:flex-row gap-8 items-start md:items-center border-b border-border pb-8 mb-8">
              <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center text-3xl font-bold text-primary shrink-0">
                {user.name ? user.name.charAt(0).toUpperCase() : "U"}
              </div>
              <div>
                <h2 className="text-2xl font-bold text-foreground mb-1">{user.name}</h2>
                <p className="text-muted-foreground">{user.email}</p>
                {user.role === "admin" && (
                  <span className="inline-block mt-3 px-3 py-1 bg-primary/20 text-primary text-xs font-semibold rounded-full uppercase tracking-wider">
                    Administrator
                  </span>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Link
                to="/my-orders"
                className="flex items-center gap-3 p-4 rounded-xl border border-border hover:border-primary/30 hover:bg-muted/30 transition-smooth group"
              >
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                  <Package size={20} />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">My Orders</h3>
                  <p className="text-xs text-muted-foreground">Track and review your purchases</p>
                </div>
              </Link>

              <button
                onClick={() => {
                  setReviewError("");
                  setReviewSuccess("");
                  setShowReviewModal(true);
                }}
                className="flex items-center gap-3 p-4 rounded-xl border border-border hover:border-primary/30 hover:bg-muted/30 transition-smooth group text-left"
              >
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                  <Star size={20} />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">Rate Our Website</h3>
                  <p className="text-xs text-muted-foreground">{hasExistingReview ? "Update or delete your review" : "Tell us about your experience"}</p>
                </div>
              </button>

              <button
                onClick={handleLogout}
                className="flex items-center gap-3 p-4 rounded-xl border border-border hover:border-red-500/30 hover:bg-red-500/5 transition-smooth group text-left"
              >
                <div className="w-10 h-10 rounded-full bg-red-500/10 flex items-center justify-center text-red-600 group-hover:scale-110 transition-transform">
                  <LogOut size={20} />
                </div>
                <div>
                  <h3 className="font-semibold text-red-600">Logout</h3>
                  <p className="text-xs text-muted-foreground">Sign out of your account</p>
                </div>
              </button>
            </div>
          </div>
        </div>
      </SectionContainer>

      {/* Site Review Modal */}
      <AnimatePresence>
        {showReviewModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="bg-card w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden"
            >
              <div className="px-6 py-4 border-b border-border flex items-center justify-between bg-muted/30">
                <h3 className="font-display font-semibold text-lg text-foreground">
                  Rate Your Experience
                </h3>
                <button
                  onClick={() => setShowReviewModal(false)}
                  className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-full transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="p-6">
                {reviewSuccess ? (
                  <div className="text-center py-8">
                    <div className="w-16 h-16 bg-green-500/20 text-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Star size={32} className="fill-current" />
                    </div>
                    <p className="text-foreground font-medium">{reviewSuccess}</p>
                  </div>
                ) : (
                  <form onSubmit={handleReviewSubmit} className="space-y-4">
                    {reviewError && <p className="text-red-500 text-xs bg-red-500/10 p-2 rounded-lg">{reviewError}</p>}
                    
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">Rating</label>
                      <div className="flex gap-2">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            key={star}
                            type="button"
                            onClick={() => setReviewRating(star)}
                            className={`p-1 transition-transform hover:scale-110 ${reviewRating >= star ? "text-accent" : "text-muted-foreground/30"}`}
                          >
                            <Star className={reviewRating >= star ? "fill-current" : ""} />
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">Your Feedback</label>
                      <textarea
                        required
                        value={reviewComment}
                        onChange={(e) => setReviewComment(e.target.value)}
                        placeholder="Tell us what you love or how we can improve..."
                        className="w-full bg-muted/30 border border-border rounded-lg p-3 text-sm min-h-[100px] focus:outline-none focus:ring-2 focus:ring-primary/50"
                      />
                    </div>

                    <div className="flex justify-end gap-3 mt-6">
                      {hasExistingReview && (
                        <button
                          type="button"
                          onClick={handleReviewDelete}
                          disabled={submittingReview}
                          className="px-4 py-2 text-sm font-medium text-red-600 bg-red-500/10 hover:bg-red-500/20 rounded-lg transition-colors mr-auto"
                        >
                          Delete
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => setShowReviewModal(false)}
                        className="px-4 py-2 text-sm font-medium text-foreground bg-muted hover:bg-muted/80 rounded-lg transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={submittingReview}
                        className="px-4 py-2 bg-primary text-primary-foreground text-sm font-semibold rounded-lg hover:bg-primary/90 transition-smooth disabled:opacity-50"
                      >
                        {submittingReview ? "Saving..." : (hasExistingReview ? "Update" : "Submit")}
                      </button>
                    </div>
                  </form>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
