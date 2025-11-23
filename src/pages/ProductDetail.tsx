import { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { toast } from "sonner";
import ProductDescription from "@/components/ui/ProductDescription";
import { Star, MessageSquare } from "lucide-react";
import VerifiedBadge from "@/components/ui/VerifiedBadge";
import ProductCard from "@/components/ProductCard";
import ImageLightbox from "@/components/ImageLightbox";
import { useAuth } from "@/hooks/useAuth";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

interface Product {
  id: string;
  title: string;
  description: string;
  price: number;
  image_url: string;
  status: string;
  user_id: string;
  category: string;
  profiles?: {
    id: string;
    username: string;
    full_name: string | null;
    avatar_url: string | null;
    company_name: string | null;
    contact_number: string | null;
  };
}

const ProductDetail = () => {
  const { productId } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [images, setImages] = useState<string[]>([]);
  const [selectedImage, setSelectedImage] = useState<string>("");
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
  const [relatedCurrentPage, setRelatedCurrentPage] = useState(1);
  const [relatedTotal, setRelatedTotal] = useState(0);
  const RELATED_PAGE_SIZE = 12;

  const [variants, setVariants] = useState<any[]>([]);
  const [selectedVariant, setSelectedVariant] = useState<any | null>(null);
  const [buying, setBuying] = useState(false);
  const { user: currentUser } = useAuth();
  const [reviews, setReviews] = useState<any[]>([]);
  const [newRating, setNewRating] = useState<number>(5);
  const [newComment, setNewComment] = useState("");
  const [showDescription, setShowDescription] = useState(true);
  const [showReviews, setShowReviews] = useState(true);
  const [addedToCartCount, setAddedToCartCount] = useState<number>(0);

  useEffect(() => {
    if (productId === "new") {
      navigate("/products/new/edit");
    }
  }, [productId, navigate]);

  const loadProduct = useCallback(async () => {
    try {
      console.log("Attempting to load product with ID:", productId);
      const { data, error } = await supabase
        .from("products")
        .select(
          "id, title, description, price, image_url, status, user_id, category, profiles(id, username, full_name, avatar_url, company_name, contact_number)"
        )
        .eq("id", productId)
        .single();

      if (error) {
        console.error("Error loading product:", error);
        toast.error(`Failed to load product: ${error.message}`);
        throw error;
      }

      console.log("Product data received:", data);
      setProduct(data);
      if (data && data.image_url) {
        const imageUrls = data.image_url.split(',').map((url: string) => url.trim());
        setImages(imageUrls);
        setSelectedImage(imageUrls[0]);
        setLightboxIndex(0);
      }
      if (data && data.category) {
        setRelatedCurrentPage(1);
        loadRelatedProducts(data.category, 1);
      }

      // Load added-to-cart analytics count
      if (data && data.id) {
        const { count } = await supabase
          .from('product_cart_adds')
          .select('id', { count: 'exact', head: true })
          .eq('product_id', data.id);
        setAddedToCartCount(count || 0);
      }
    } catch (error: any) {
      console.error("An unexpected error occurred while loading the product:", error);
      toast.error("An unexpected error occurred. Please try again later.");
    } finally {
      setLoading(false);
    }
  }, [productId]);

  const loadVariants = useCallback(async () => {
    try {
      console.log("Loading variants for product ID:", productId);
      const { data, error } = await supabase
        .from("variants")
        .select("*")
        .eq("product_id", productId);

      if (error) throw error;
      setVariants(data || []);
      if (data && data.length > 0) {
        setSelectedVariant(data[0]);
      }
    } catch (error: any) {
      toast.error("Failed to load variants");
    }
  }, [productId]);

  const loadRelatedProducts = useCallback(async (category: string, page = 1) => {
    try {
      const from = (page - 1) * RELATED_PAGE_SIZE;
      const to = page * RELATED_PAGE_SIZE - 1;
      const { data, error, count } = await supabase
        .from("products")
        // profiles.is_verified does not exist in our schema; fetch available fields only
        .select("*, profiles(username, full_name)", { count: 'exact' })
        .eq("status", "active")
        .eq("category", category)
        .neq("id", productId)
        .range(from, to);

      if (error) throw error;
      setRelatedTotal(count || 0);
      setRelatedProducts(data || []);
    } catch (error: any) {
      toast.error("Failed to load related products");
    }
  }, [productId]);

  const loadReviews = useCallback(async () => {
    if (!productId) return;
    const { data, error } = await supabase
      .from("reviews")
      .select("*, reviewer:profiles(id, username, full_name, avatar_url)")
      .eq("product_id", productId)
      .order("created_at", { ascending: false });
    if (!error) setReviews(data || []);
  }, [productId]);

  const startChat = () => {
    if (!currentUser) {
      toast.error("Please sign in to chat with the seller");
      navigate("/auth");
      return;
    }
    if (product) {
      navigate(`/chat/${product.user_id}`);
    }
  };

  useEffect(() => {
    if (productId) {
      loadProduct();
      loadVariants();
      loadReviews();
    }
  }, [productId, loadProduct, loadVariants, loadReviews]);

  // Track product view (authenticated), deduped by daily unique index in DB
  useEffect(() => {
    (async () => {
      try {
        if (!productId) return;
        const { data: { session } } = await supabase.auth.getSession();
        const viewerId = session?.user?.id || null;
        if (!viewerId) return;
        // Insert view (unique per day by (product_id, viewer_id, day) index). Ignore duplicate errors.
        const { error } = await supabase.from('product_views').insert([{ product_id: productId, viewer_id: viewerId }]);
        // Auto-create chat conversation + message to notify seller on product detail views
        // Only if signed in and viewing someone else's product
        if (!error && product && product.user_id && product.user_id !== viewerId) {
          // Ensure conversation exists
          const sellerId = product.user_id;
          // Try both orders to satisfy unique(user1_id,user2_id)
          await supabase.from('chat_conversations').insert([{ user1_id: viewerId, user2_id: sellerId }]).select().maybeSingle().catch(()=>null);
          await supabase.from('chat_conversations').insert([{ user1_id: sellerId, user2_id: viewerId }]).select().maybeSingle().catch(()=>null);
          // Find conversation id
          const { data: convo } = await supabase
            .from('chat_conversations')
            .select('id')
            .or(`and(user1_id.eq.${viewerId},user2_id.eq.${sellerId}),and(user1_id.eq.${sellerId},user2_id.eq.${viewerId})`)
            .maybeSingle();
          if (convo?.id) {
            await supabase.from('chat_messages').insert([{
              conversation_id: convo.id,
              sender_id: viewerId,
              message: `👀 viewed your product: ${product.title}`
            }]);
          }
        }
      } catch (e) {
        // ignore analytics errors
      }
    })();
  }, [productId, product]);

  // Reload related products when the page changes
  useEffect(() => {
    if (product?.category) {
      loadRelatedProducts(product.category, relatedCurrentPage);
    }
  }, [product?.category, relatedCurrentPage, loadRelatedProducts]);

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-destructive mb-4">Product Not Found</h1>
          <p className="text-muted-foreground">The product you are looking for does not exist or has been removed.</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div className="lg:col-span-7">
              <div className="flex flex-col gap-4">
                <div className="w-full">
                  <div className="w-full h-64 sm:h-72 md:h-80 lg:h-96 bg-muted rounded-lg flex items-center justify-center overflow-hidden cursor-zoom-in" onClick={() => setLightboxOpen(true)}>
                    <img
                      src={selectedImage}
                      alt={product.title}
                      className="max-h-full max-w-full object-contain"
                    />
                  </div>
                </div>
                <div className="flex gap-2 overflow-x-auto justify-center py-2">
                  {images.map((image, index) => (
                    <img
                      key={index}
                      src={image}
                      alt={`${product.title} thumbnail ${index + 1}`}
                      className={`w-16 h-16 rounded-md object-cover cursor-pointer flex-shrink-0 ${selectedImage === image ? 'ring-2 ring-primary ring-offset-2' : 'ring-1 ring-transparent'}`}
                      onClick={() => { setSelectedImage(image); setLightboxIndex(index); }}
                    />
                  ))}
                </div>
              </div>
            </div>
            <div className="lg:col-span-5 lg:sticky top-24 self-start">
              <h1 className="text-3xl font-bold mb-2">{product.title}</h1>
              <div className="flex items-center mb-4">
                <div className="flex items-center">
                  {(() => {
                    const avg = reviews.length
                      ? reviews.reduce((sum, r) => sum + (r.rating || 0), 0) / reviews.length
                      : 0;
                    const filled = Math.round(avg);
                    return [...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`h-5 w-5 ${i < filled ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`}
                      />
                    ));
                  })()}
                </div>
                <span className="ml-2 text-sm text-muted-foreground">({reviews.length} {reviews.length === 1 ? 'rating' : 'ratings'})</span>
              </div>
              {product.profiles && (
                <div className="flex items-center gap-3 mb-4 rounded-2xl bg-muted/80 p-4">
                  <Avatar className="h-16 w-16">
                    {product.profiles.avatar_url ? (
                      <AvatarImage src={product.profiles.avatar_url} alt={product.profiles.username} />
                    ) : (
                      <AvatarFallback>{product.profiles.username ? product.profiles.username[0].toUpperCase() : "S"}</AvatarFallback>
                    )}
                  </Avatar>
                  <div className="flex-1">
                    <p className="font-semibold text-lg">
                      {product.profiles.full_name || product.profiles.username}
                    </p>
                    {product.profiles.company_name && (
                      <p className="text-sm text-muted-foreground">Company: {product.profiles.company_name}</p>
                    )}
                    {product.profiles.contact_number && (
                      <p className="text-sm text-muted-foreground">
                        Contact: {product.profiles.contact_number}
                      </p>
                    )}
                  </div>
                  <Button variant="outline" size="sm" onClick={startChat}>
                    <MessageSquare className="h-4 w-4 mr-1" />
                    Chat seller
                  </Button>
                </div>
              )}
             <hr className="my-4" />
              <p className="text-4xl font-bold text-primary mb-4">
                ${(selectedVariant ? selectedVariant.price : product.price).toFixed(2)}
              </p>
              <p className="text-sm text-muted-foreground mb-4">Added to cart {addedToCartCount} times</p>
              
              <Card className="p-6 bg-muted/50">
                <div className="mb-6">
                  <h3 className="text-lg font-semibold mb-3 text-foreground">Available Variants</h3>
                  <div className="flex flex-wrap gap-3">
                    {variants.map(variant => (
                      <Button 
                        key={variant.id as number} 
                        variant={selectedVariant?.id === variant.id ? "default" : "outline"}
                        className={`rounded-full px-4 py-2 ${selectedVariant?.id === variant.id ? 'ring-2 ring-primary ring-offset-2' : ''}`}
                        onClick={() => setSelectedVariant(variant)}
                      >
                        <span className="font-medium">{variant.name}</span>
                      </Button>
                    ))}
                  </div>
                </div>
                
                <div className="flex flex-col gap-3">
                  <Button size="lg" className="w-full" disabled={buying} onClick={async () => {
                    if (!currentUser) {
                      toast.error("Please sign in to place an order");
                      navigate("/auth");
                      return;
                    }
                    try {
                      setBuying(true);
                      const unitPrice = selectedVariant ? Number(selectedVariant.price) : Number(product.price);
                      const subtotalAmt = unitPrice;
                      const orderPayload = {
                        order_number: `ORD-${Date.now()}`,
                        customer_id: currentUser.id,
                        cashier_name: currentUser.email || "Web",
                        subtotal: subtotalAmt,
                        discount_amount: 0,
                        discount_percentage: 0,
                        total: subtotalAmt,
                        status: "pending",
                      };
                      const { data: order, error: orderErr } = await supabase
                        .from("orders")
                        .insert([orderPayload])
                        .select()
                        .single();
                      if (orderErr) throw orderErr;
                      const item = {
                        order_id: order.id,
                        product_id: product.id,
                        product_name: product.title,
                        quantity: 1,
                        unit_price: unitPrice,
                        discount_amount: 0,
                        discount_percentage: 0,
                        total: unitPrice,
                      };
                      const { error: itemErr } = await supabase.from("order_items").insert([item]);
                      if (itemErr) throw itemErr;
                      toast.success("Order created!", { description: `Order #${order.order_number}` });

                      // Build and print buyer receipt with seller branding (fallback to seller profile)
                      try {
                        const sellerId = product.user_id;
                        // Try seller receipt settings (may be blocked by RLS); fallback to profile
                        let settings: any = {};
                        const { data: rs } = await supabase.from('receipt_settings').select('*').eq('profile_id', sellerId).maybeSingle();
                        if (rs) settings = rs; else {
                          const { data: prof } = await supabase.from('profiles').select('full_name, username, avatar_url, contact_number').eq('id', sellerId).maybeSingle();
                          settings = { business_name: prof?.full_name || prof?.username || 'Receipt', logo_url: prof?.avatar_url || null, phone: prof?.contact_number || null };
                        }
                        const orderObj = { order_number: order.order_number, created_at: order.created_at, cashier_name: order.cashier_name, total: Number(order.total), items: [ { name: product.title, qty: 1, unit: unitPrice, total: unitPrice } ] };
                        const { buildReceiptHtml, printHtml } = await import('@/lib/print');
                        const html = buildReceiptHtml(settings, 'order', orderObj);
                        printHtml(html);
                        // Snapshot
                        try {
                          await supabase.from('receipt_snapshots').insert([{ order_id: order.id, seller_id: sellerId, customer_id: currentUser.id, payload: { order, items: [{ product_id: product.id, product_name: product.title, quantity: 1, unit_price: unitPrice, total: unitPrice }], settings } }]);
                        } catch {}
                      } catch (e) {
                        // ignore printing errors
                      }
                    } catch (e: any) {
                      console.error("Buy Now error:", e);
                      toast.error(e?.message || "Failed to create order");
                    } finally {
                      setBuying(false);
                    }
                  }}>
                    <span className="font-medium">Buy Now</span>
                  </Button>
                </div>
              </Card>

              <hr className="my-6" />
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-xl font-semibold">Description</h2>
                <Button variant="ghost" size="sm" onClick={() => setShowDescription(!showDescription)}>
                  {showDescription ? 'Hide' : 'Show'}
                </Button>
              </div>
              {showDescription && (
                <ProductDescription 
                  title="About this item"
                  description={product.description}
                  status={product.status}
                  showStatus={false}
                  className="mb-4"
                />
              )}
            </div>
          </div>
          {relatedProducts.length > 0 && (
            <div className="mt-10">
              <h2 className="text-2xl font-bold mb-4">Related Products</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
                {relatedProducts.map((relatedProduct) => (
                  <ProductCard key={relatedProduct.id} product={relatedProduct} />
                ))}
              </div>
              {(() => {
                const totalPages = Math.max(1, Math.ceil(relatedTotal / RELATED_PAGE_SIZE));
                if (totalPages <= 1) return null;
                const pagesToShow = 3;
                let startPage = Math.max(1, relatedCurrentPage - Math.floor(pagesToShow / 2));
                let endPage = Math.min(totalPages, startPage + pagesToShow - 1);
                if (endPage - startPage + 1 < pagesToShow) {
                  startPage = Math.max(1, endPage - pagesToShow + 1);
                }
                const pageNumbers: number[] = [];
                for (let i = startPage; i <= endPage; i++) pageNumbers.push(i);
                return (
                  <div className="mt-6 flex justify-center">
                    <Pagination>
                      <PaginationContent className="flex flex-wrap justify-center gap-1">
                        <PaginationItem>
                          <PaginationPrevious
                            href="#"
                            className="h-8 px-2"
                            onClick={(e) => {
                              e.preventDefault();
                              setRelatedCurrentPage((prev) => Math.max(1, prev - 1));
                            }}
                          />
                        </PaginationItem>
                        {pageNumbers.map((page) => (
                          <PaginationItem key={page}>
                            <PaginationLink
                              href="#"
                              isActive={relatedCurrentPage === page}
                              className="h-8 w-8"
                              onClick={(e) => {
                                e.preventDefault();
                                setRelatedCurrentPage(page);
                              }}
                            >
                              {page}
                            </PaginationLink>
                          </PaginationItem>
                        ))}
                        <PaginationItem>
                          <PaginationNext
                            href="#"
                            className="h-8 w-8"
                            onClick={(e) => {
                              e.preventDefault();
                              setRelatedCurrentPage((prev) => Math.min(totalPages, prev + 1));
                            }}
                          />
                        </PaginationItem>
                      </PaginationContent>
                    </Pagination>
                  </div>
                );
              })()}
            </div>
          )}

          {/* Reviews moved to bottom of page with show/hide */}
          <div className="mt-10">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-2xl font-bold">Reviews</h2>
              <Button variant="ghost" size="sm" onClick={() => setShowReviews(!showReviews)}>
                {showReviews ? 'Hide' : 'Show'}
              </Button>
            </div>
            {showReviews && (
              <>
                {reviews.length === 0 ? (
                  <p className="text-muted-foreground">No reviews yet.</p>
                ) : (
                  <div className="space-y-4">
                    {reviews.map((r) => (
                      <div key={r.id} className="border rounded-lg p-4">
                        <div className="flex items-center gap-3 mb-2">
                          <Avatar className="h-8 w-8">
                            {r.reviewer?.avatar_url ? (
                              <AvatarImage src={r.reviewer.avatar_url} alt={r.reviewer.username} />
                            ) : (
                              <AvatarFallback>{r.reviewer?.username ? r.reviewer.username[0].toUpperCase() : "U"}</AvatarFallback>
                            )}
                          </Avatar>
                          <div className="flex-1">
                            <p className="text-sm font-medium">{r.reviewer?.full_name || r.reviewer?.username || "User"}</p>
                            <div className="flex items-center">
                              {[...Array(5)].map((_, i) => (
                                <Star key={i} className={`h-4 w-4 ${i < r.rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`} />
                              ))}
                            </div>
                          </div>
                          <span className="text-xs text-muted-foreground">{new Date(r.created_at).toLocaleDateString()}</span>
                        </div>
                        {r.comment && <p className="text-sm text-muted-foreground">{r.comment}</p>}
                      </div>
                    ))}
                  </div>
                )}

                {currentUser && currentUser.id !== product.user_id && (
                  <div className="mt-6 border rounded-lg p-4">
                    <h3 className="font-semibold mb-2">Write a review</h3>
                    <div className="flex items-center gap-2 mb-2">
                      {[1,2,3,4,5].map((n) => (
                        <button key={n} type="button" onClick={() => setNewRating(n)} aria-label={`Rate ${n}`}>
                          <Star className={`h-6 w-6 ${n <= newRating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`} />
                        </button>
                      ))}
                    </div>
                    <textarea
                      className="w-full border rounded-md p-2 text-sm"
                      rows={3}
                      placeholder="Share your experience..."
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                    />
                    <div className="mt-2 flex justify-end">
                      <Button size="sm" onClick={async () => {
                        if (!currentUser || !product) return;
                        const { error } = await supabase.from('reviews').insert([
                          {
                            product_id: product.id,
                            reviewer_id: currentUser.id,
                            rating: newRating,
                            comment: newComment || null,
                          }
                        ]);
                        if (error) {
                          toast.error('Failed to submit review');
                        } else {
                          toast.success('Review submitted');
                          setNewComment('');
                          setNewRating(5);
                          loadReviews();
                        }
                      }}>Submit</Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
      <ImageLightbox
        images={images}
        index={lightboxIndex}
        open={lightboxOpen}
        onClose={() => setLightboxOpen(false)}
        onPrev={() => setLightboxIndex((i) => (images.length ? (i - 1 + images.length) % images.length : 0))}
        onNext={() => setLightboxIndex((i) => (images.length ? (i + 1) % images.length : 0))}
      />
      <Footer />
    </>
  );
};

export default ProductDetail;
