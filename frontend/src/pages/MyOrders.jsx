import { Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, Loader2, Package, SearchX } from "lucide-react";
import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { ArrowLeft, Loader2, Package, SearchX, Star, X } from "lucide-react";
import SectionContainer from "../components/SectionContainer";
import { useAuth } from "../context/AuthContext";

export default function MyOrders() {
 const { token, user, loading: authLoading } = useAuth();
 const navigate = useNavigate();
 const [orders, setOrders] = useState([]);
 const [loading, setLoading] = useState(true);
 const [error, setError] = useState("");

 // Review state
 const [selectedProduct, setSelectedProduct] = useState(null);
 const [showReviewModal, setShowReviewModal] = useState(false);
 const [reviewRating, setReviewRating] = useState(5);
 const [reviewComment, setReviewComment] = useState("");
 const [submittingReview, setSubmittingReview] = useState(false);
 const [reviewError, setReviewError] = useState("");
 const [reviewSuccess, setReviewSuccess] = useState("");

 useEffect(() => {
 if (!authLoading && !user) {
 navigate({ to: "/login" });
 }
 }, [user, authLoading, navigate]);

 useEffect(() => {
 const fetchOrders = async () => {
 if (!token) return;
 try {
 const response = await fetch(
 `${import.meta.env.VITE_API_URL || "https://swadistchai-backend.onrender.com/api"}/orders/user/my-orders`,
 {
 headers: {
 Authorization: `Bearer ${token}`,
 },
 },
 );
 const data = await response.json();

 if (data.success) {
 setOrders(data.orders);
 } else {
 setError(data.message || "Failed to fetch orders");
 }
 } catch (err) {
 setError("Error connecting to server");
 } finally {
 setLoading(false);
 }
 };

 if (token) {
 fetchOrders();
 }
 }, [token]);

 const handleCancelOrder = async (orderId) => {
 if (!window.confirm("Are you sure you want to cancel this order?")) return;
 try {
 const response = await fetch(
 `${import.meta.env.VITE_API_URL || "https://swadistchai-backend.onrender.com/api"}/orders/${orderId}/cancel`,
 {
 method: "PUT",
 headers: {
 Authorization: `Bearer ${token}`,
 },
 },
 );
 const data = await response.json();
 if (data.success) {
 setOrders(
 orders.map((o) =>
 o._id === orderId ? { ...o, status: "cancelled" } : o,
 ),
 );
 } else {
 alert(data.message || "Failed to cancel order");
 }
 } catch (err) {
 alert("Error connecting to server to cancel order");
 }
 };

 const getStatusColor = (status) => {
 switch (status) {
 case "pending":
 return "bg-yellow-500/10 text-yellow-600";
 case "processing":
 return "bg-blue-500/10 text-blue-600";
 case "shipped":
 return "bg-purple-500/10 text-purple-600";
 case "delivered":
 return "bg-green-500/10 text-green-600";
 case "cancelled":
 return "bg-red-500/10 text-red-600";
 default:
 return "bg-muted text-foreground";
 }
 };

 const openReviewModal = (productId, productName) => {
   setSelectedProduct({ id: productId, name: productName });
   setReviewRating(5);
   setReviewComment("");
   setReviewError("");
   setReviewSuccess("");
   setShowReviewModal(true);
 };

 const handleReviewSubmit = async (e) => {
   e.preventDefault();
   if (!selectedProduct) return;
   
   setSubmittingReview(true);
   setReviewError("");
   setReviewSuccess("");
   
   try {
     const response = await fetch(
       `${import.meta.env.VITE_API_URL || "https://swadistchai-backend.onrender.com/api"}/products/${selectedProduct.id}/reviews`,
       {
         method: "POST",
         headers: {
           "Content-Type": "application/json",
           Authorization: `Bearer ${token}`,
         },
         body: JSON.stringify({ rating: reviewRating, comment: reviewComment }),
       }
     );
     
     const data = await response.json();
     if (!data.success) throw new Error(data.message);
     
     setReviewSuccess("Review submitted successfully! It will appear after admin approval.");
     setTimeout(() => setShowReviewModal(false), 3000);
   } catch (error) {
     setReviewError(error.message || "Failed to submit review");
   } finally {
     setSubmittingReview(false);
   }
 };

 if (authLoading) return null;

 return (
 <div className="pt-20 lg:pt-28 min-h-screen bg-background pb-16">
 <SectionContainer>
 <Link
 to="/profile"
 className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary mb-6 transition-colors"
 >
 <ArrowLeft size={16} /> Back to Profile
 </Link>

 <div className="flex items-center gap-3 mb-8">
 <Package className="text-primary w-8 h-8" />
 <h1 className="font-display text-3xl font-semibold text-foreground">
 My Orders
 </h1>
 </div>

 {loading ? (
 <div className="flex flex-col items-center justify-center py-20 text-primary">
 <Loader2 className="animate-spin w-10 h-10 mb-4" />
 <p>Loading your orders...</p>
 </div>
 ) : error ? (
 <div className="bg-red-500/10 border border-red-500/20 text-red-600 p-4 rounded-xl">
 {error}
 </div>
 ) : orders.length === 0 ? (
 <div className="text-center py-20 bg-card rounded-2xl border border-border shadow-card">
 <SearchX className="mx-auto w-12 h-12 text-muted-foreground/50 mb-4" />
 <h3 className="font-display text-xl font-medium text-foreground mb-2">
 No orders found
 </h3>
 <p className="text-muted-foreground mb-6">
 Looks like you haven't placed any orders yet.
 </p>
 <Link
 to="/shop"
 className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-primary text-primary-foreground font-semibold hover:bg-primary/90 transition-smooth"
 >
 Start Shopping
 </Link>
 </div>
 ) : (
 <div className="space-y-6">
 {orders.map((order) => (
 <motion.div
 key={order._id}
 initial={{ opacity: 0, y: 10 }}
 animate={{ opacity: 1, y: 0 }}
 className="bg-card rounded-2xl border border-border overflow-hidden shadow-card"
 >
 {/* Order Header */}
 <div className="bg-muted/30 px-6 py-4 border-b border-border flex flex-col sm:flex-row sm:items-center justify-between gap-4">
 <div className="grid grid-cols-2 sm:flex sm:gap-8 gap-4 text-sm">
 <div>
 <p className="text-muted-foreground mb-0.5">
 Order Placed
 </p>
 <p className="font-medium text-foreground">
 {new Date(order.createdAt).toLocaleDateString()}
 </p>
 </div>
 <div>
 <p className="text-muted-foreground mb-0.5">Total</p>
 <p className="font-medium text-foreground">
 ₹{order.orderTotal.toLocaleString("en-IN")}
 </p>
 </div>
 <div className="col-span-2 sm:col-span-1">
 <p className="text-muted-foreground mb-0.5">Order ID</p>
 <p className="font-medium text-foreground font-mono text-xs mt-1">
 {order._id}
 </p>
 </div>
 </div>
 <div>
 <span
 className={`px-3 py-1 rounded-full text-xs font-semibold capitalize ${getStatusColor(order.status)}`}
 >
 {order.status}
 </span>
 {order.status === "pending" && (
 <button
 onClick={() => handleCancelOrder(order._id)}
 className="ml-4 text-xs font-semibold text-red-600 hover:text-red-700 underline underline-offset-2 transition-colors"
 >
 Cancel Order
 </button>
 )}
 </div>
 </div>

 {/* Order Items */}
 <div className="p-6">
 <div className="space-y-4">
 {order.items.map((item, idx) => (
 <div key={idx} className="flex gap-4 items-center">
 <div className="w-16 h-16 rounded-xl bg-muted overflow-hidden shrink-0">
 {item.product?.image ? (
 <img
 src={
 item.product.image.startsWith("/uploads")
 ? `https://tealeafluxe.onrender.com${item.product.image}`
 : item.product.image
 }
 alt={item.product.name}
 className="w-full h-full object-cover"
 />
 ) : (
 <div className="w-full h-full flex items-center justify-center bg-secondary/50 text-xs text-muted-foreground">
 No Image
 </div>
 )}
 </div>
 <div className="flex-1 min-w-0">
 <h4 className="font-medium text-foreground truncate">
 {item.product?.name || "Product unavailable"}
 </h4>
 <p className="text-sm text-muted-foreground">
 Qty: {item.quantity}
 </p>
 </div>
 <div className="text-right">
 <p className="font-medium text-foreground">
 ₹{item.price.toLocaleString("en-IN")}
 </p>
 {order.status === "delivered" && item.product && (
   <button
     onClick={() => openReviewModal(item.product._id || item.product.id, item.product.name)}
     className="mt-2 text-xs font-semibold text-primary hover:text-primary/80 transition-colors bg-primary/10 px-3 py-1.5 rounded-lg"
   >
     Leave a Review
   </button>
 )}
 </div>
 </div>
 ))}
 </div>
 </div>
 </motion.div>
 ))}
 </div>
 )}
 </SectionContainer>

 {/* Review Modal */}
 <AnimatePresence>
   {showReviewModal && (
     <motion.div
       initial={{ opacity: 0 }}
       animate={{ opacity: 1 }}
       exit={{ opacity: 0 }}
       className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
     >
       <motion.div
         initial={{ scale: 0.95 }}
         animate={{ scale: 1 }}
         exit={{ scale: 0.95 }}
         className="bg-card rounded-2xl border border-border p-6 max-w-md w-full shadow-xl relative"
       >
         <button
           onClick={() => setShowReviewModal(false)}
           className="absolute top-4 right-4 text-muted-foreground hover:text-foreground"
         >
           <X size={20} />
         </button>
         <h2 className="font-display text-xl font-semibold mb-2 text-foreground">Write a Review</h2>
         <p className="text-sm text-muted-foreground mb-6">For: <span className="font-medium text-foreground">{selectedProduct?.name}</span></p>

         {reviewSuccess ? (
           <div className="bg-green-500/10 text-green-600 p-4 rounded-xl text-sm font-medium">
             {reviewSuccess}
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
               <label className="block text-sm font-medium text-foreground mb-2">Your Review</label>
               <textarea
                 required
                 value={reviewComment}
                 onChange={(e) => setReviewComment(e.target.value)}
                 placeholder="Share your experience with this tea..."
                 className="w-full bg-muted/30 border border-border rounded-lg p-3 text-sm min-h-[100px] focus:outline-none focus:ring-2 focus:ring-primary/50"
               />
             </div>

             <div className="flex justify-end gap-3 mt-6">
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
                 {submittingReview ? "Submitting..." : "Submit Review"}
               </button>
             </div>
           </form>
         )}
       </motion.div>
     </motion.div>
   )}
 </AnimatePresence>
 </div>
 );
}
