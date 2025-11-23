import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { toast } from "sonner";

const ProductForm = () => {
  const { productId } = useParams<{ productId: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    price: "",
    image_url: "",
    status: "active",
    location_id: "",
    category_id: "",
  });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [businessType, setBusinessType] = useState<string | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiSuggestion, setAiSuggestion] = useState<{ description?: string; category?: string; subcategory?: string; variants?: string[] } | null>(null);
  const [aiVariantsToCreate, setAiVariantsToCreate] = useState<string[]>([]);
  const [locations, setLocations] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [subcategories, setSubcategories] = useState<string[]>([]);
  const [variantSuggestions, setVariantSuggestions] = useState<string[]>([]);

  useEffect(() => {
    checkAuth();
    const bt = localStorage.getItem("businessType");
    setBusinessType(bt);
    if ((!bt || bt.length === 0) && (!productId || productId === 'new')) {
      // If creating a new product without a selected business, redirect to onboarding
      navigate('/sell');
      return;
    }
    fetchDropdownData(bt);
    if (productId && productId !== "new") {
      loadProduct(productId);
    }
  }, [productId]);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate("/auth");
      return;
    }
    setUser(session.user);
  };

  const fetchDropdownData = async (bt?: string | null) => {
    try {
      const { data: locationsData, error: locationsError } = await supabase.from("locations").select("*");
      if (locationsError) throw locationsError;
      setLocations(locationsData);

      const { data: categoriesData, error: categoriesError } = await supabase.from("categories").select("*");
      if (categoriesError) throw categoriesError;
      // Optional filtering by business type keywords stored in localStorage
      const keywordsStr = localStorage.getItem("businessTypeKeywords");
      const keywords = keywordsStr ? (JSON.parse(keywordsStr) as string[]) : [];
      let filtered = categoriesData || [];
      if ((bt || businessType) && keywords.length > 0) {
        const lower = keywords.map((k) => k.toLowerCase());
        filtered = (categoriesData || []).filter((c: any) => {
          const name = String(c.name || '').toLowerCase();
          return lower.some((k) => name.includes(k));
        });
        // Fallback: if nothing matches, show all
        if (filtered.length === 0) filtered = categoriesData || [];
      }
      setCategories(filtered);

      // Variant suggestions based on business type
      const templates: Record<string, string[]> = {
        vehicle: ["Base", "Premium", "Sport"],
        real_estate: ["1 Bedroom", "2 Bedroom", "3 Bedroom"],
        electronics: ["64GB", "128GB", "256GB", "Black", "White"],
        home_furniture: ["Small", "Medium", "Large"],
        fashion: ["XS", "S", "M", "L", "XL", "Black", "Blue"],
        beauty_personal: ["Small", "Regular", "Large"],
        services_repair: ["Basic", "Standard", "Premium"],
        commercial_tools: ["Single Pack", "Bundle"],
        art_sports: ["Junior", "Adult"],
        babies_kids: ["0-3m", "3-6m", "6-12m", "1-2y"],
        food: ["250g", "500g", "1kg"],
        agriculture: ["1kg", "5kg", "10kg"],
      };
      setVariantSuggestions(templates[(bt || businessType || '') as string] || []);
    } catch (error: any) {
      toast.error("Failed to load form data");
    }
  };

  // Load subcategory suggestions from existing products when category changes
  useEffect(() => {
    const loadSubcats = async () => {
      try {
        if (!formData.category_id) { setSubcategories([]); return; }
        const { data, error } = await supabase
          .from('products')
          .select('subcategory')
          .eq('category_id', formData.category_id)
          .not('subcategory', 'is', null)
          .order('subcategory', { ascending: true });
        if (!error) {
          const unique = Array.from(new Set((data || []).map((r: any) => r.subcategory).filter(Boolean)));
          setSubcategories(unique);
        }
      } catch (_) { /* ignore */ }
    };
    loadSubcats();
  }, [formData.category_id]);

  const loadProduct = async (id: string) => {
    const { data, error } = await supabase
      .from("products")
      .select("id, user_id, title, description, price, image_url, status, created_at, location_id, category_id")
      .eq("id", id)
      .single();

    if (error) throw error;
    setFormData({
      title: data.title,
      description: data.description || "",
      price: data.price.toString(),
      image_url: data.image_url || "",
      status: data.status,
      location_id: data.location_id || "",
      category_id: data.category_id || "",
    });
  };

  const uploadImage = async (file: File) => {
    try {
      const fileName = `${Date.now()}_${file.name}`;
      const { data, error } = await supabase.storage
        .from("product-images")
        .upload(fileName, file);

      if (error) throw error;

      const { data: { publicUrl } } = supabase.storage
        .from("product-images")
        .getPublicUrl(fileName);

      return publicUrl;
    } catch (error: any) {
      toast.error("Failed to upload image");
      return null;
    }
  };

  const analyzeWithAI = async () => {
    if (!formData.title.trim()) {
      toast.error("Enter a product title first");
      return;
    }
    try {
      setAiLoading(true);
      let publicUrl = formData.image_url;
      if (!publicUrl && imageFile) {
        const url = await uploadImage(imageFile);
        if (!url) throw new Error("Image upload failed");
        publicUrl = url;
        setFormData({ ...formData, image_url: url });
      }
      if (!publicUrl) {
        toast.error("Add an image or URL before analysis");
        return;
      }
      const { data, error } = await supabase.functions.invoke('analyze-product', {
        body: { productName: formData.title, imageUrl: publicUrl },
      });
      if (error) throw error;
      setAiSuggestion(data as any);
      setAiVariantsToCreate((data?.variants as string[]) || []);
      // Apply description immediately
      if (data?.description) {
        setFormData((prev) => ({ ...prev, description: data.description }));
      }
      // Try to map category/subcategory to category_id
      if (categories && categories.length > 0) {
        let matchedId: string | null = null;
        const catName = (data?.subcategory || data?.category || '').toLowerCase();
        if (catName) {
          const exact = categories.find((c: any) => String(c.name).toLowerCase() === catName);
          if (exact) matchedId = exact.id;
          if (!matchedId) {
            const partial = categories.find((c: any) => String(c.name).toLowerCase().includes(catName));
            if (partial) matchedId = partial.id;
          }
        }
        if (matchedId) setFormData((prev) => ({ ...prev, category_id: matchedId }));
      }
      toast.success("AI suggestions applied");
    } catch (e: any) {
      const msg = e?.message || e?.error || 'AI analysis failed';
      toast.error(String(msg));
    } finally {
      setAiLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);
    try {
      // Resolve denormalized text fields for location and category
      const selectedLocation = locations.find((l) => l.id === formData.location_id);
      const selectedCategory = categories.find((c) => c.id === formData.category_id);

      let imageUrl = formData.image_url;
      if (imageFile) {
        const uploadedImageUrl = await uploadImage(imageFile);
        if (uploadedImageUrl) {
          imageUrl = uploadedImageUrl;
        } else {
          setLoading(false);
          return;
        }
      }

      const productData: Record<string, any> = {
        title: formData.title,
        description: formData.description,
        price: parseFloat(formData.price),
        image_url: imageUrl,
        status: formData.status,
        user_id: user.id,
        location_id: formData.location_id || null,
        category_id: formData.category_id || null,
        // Denormalized text columns (may not exist yet on some projects)
        location: selectedLocation ? selectedLocation.name : null,
        category: selectedCategory ? selectedCategory.name : null,
        subcategory: aiSuggestion?.subcategory || undefined,
      };

      if (productId && productId !== "new") {
        let { error } = await supabase
          .from("products")
          .update(productData)
          .eq("id", productId);
        // Retry without denormalized text columns if schema cache doesn't have them
        if (error && (String(error.message).includes("location") || String(error.message).includes("schema cache") || String(error.message).includes("category"))) {
          const fallback = { ...productData };
          delete fallback.location;
          delete fallback.category;
          ({ error } = await supabase.from("products").update(fallback).eq("id", productId));
        }
        if (error) throw error;
        // Insert suggested variants if any
        if (aiVariantsToCreate.length > 0) {
          const variants = aiVariantsToCreate.map((name) => ({
            product_id: productId,
            name,
            price: parseFloat(formData.price) || 0,
            stock: 0,
          }));
          await supabase.from('variants').insert(variants);
        }
        toast.success("Product updated!");
      } else {
        let { data: created, error } = await supabase.from("products").insert([productData]).select().single();
        if (error && (String(error.message).includes("location") || String(error.message).includes("schema cache") || String(error.message).includes("category"))) {
          const fallback = { ...productData } as Record<string, any>;
          delete fallback.location;
          delete fallback.category;
          ({ data: created, error } = await supabase.from("products").insert([fallback]).select().single());
        }
        if (error) throw error;
        // Insert suggested variants for new product
        if (created?.id && aiVariantsToCreate.length > 0) {
          const variants = aiVariantsToCreate.map((name) => ({
            product_id: created.id,
            name,
            price: parseFloat(formData.price) || 0,
            stock: 0,
          }));
          await supabase.from('variants').insert(variants);
        }
        toast.success("Product created!");
      }

      navigate(`/profile/${user.id}`);
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 py-8 max-w-2xl">
          {/* AI Helper */}
          <Card className="mb-4">
            <CardHeader>
              <CardTitle>AI Photo Analysis (Gemini)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col gap-3">
                <p className="text-sm text-muted-foreground">Let AI analyze your photo and prefill description, category and variants.</p>
                <div className="flex gap-2">
                  <Button type="button" variant="secondary" onClick={analyzeWithAI} disabled={aiLoading}>
                    {aiLoading ? 'Analyzing...' : 'Analyze with AI'}
                  </Button>
                </div>
                {aiSuggestion && (
                  <div className="text-sm space-y-2 border rounded-lg p-3">
                    {aiSuggestion.description && (
                      <div>
                        <span className="font-semibold">Suggested Description:</span>
                        <p className="text-muted-foreground whitespace-pre-wrap">{aiSuggestion.description}</p>
                      </div>
                    )}
                    {(aiSuggestion.category || aiSuggestion.subcategory) && (
                      <div>
                        <span className="font-semibold">Category:</span>{' '}
                        <span className="text-muted-foreground">{aiSuggestion.category || '—'}</span>
                        {aiSuggestion.subcategory && (
                          <>
                            <span className="font-semibold ml-2">Subcategory:</span>{' '}
                            <span className="text-muted-foreground">{aiSuggestion.subcategory}</span>
                          </>
                        )}
                      </div>
                    )}
                    {aiVariantsToCreate.length > 0 && (
                      <div>
                        <span className="font-semibold">Variants:</span>
                        <div className="mt-1 flex flex-wrap gap-2">
                          {aiVariantsToCreate.map((v) => (
                            <span key={v} className="px-2 py-1 text-xs rounded bg-secondary/50">{v}</span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
          {businessType && (
            <div className="mb-4 p-3 rounded-lg border bg-muted/30 text-sm flex items-center justify-between">
              <div>
                <span className="text-muted-foreground">Business:</span>{' '}
                <span className="font-medium">
                  {businessType.replaceAll('_',' ').replace(/\b\w/g, s => s.toUpperCase())}
                </span>
              </div>
              <Button variant="outline" size="sm" onClick={() => { window.location.href = '/sell'; }}>Change</Button>
            </div>
          )}
          <Card>
            <CardHeader>
              <CardTitle>{(productId && productId !== 'new') ? "Edit Product" : "Create Product"}</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="title">Product Title</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="description">Description</Label>
                    <span className="text-sm text-muted-foreground">{formData.description.length}/500</span>
                  </div>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => {
                      if (e.target.value.length <= 500) {
                        setFormData({ ...formData, description: e.target.value });
                      }
                    }}
                    rows={5}
                    placeholder="Describe your product in detail..."
                    className="min-h-[120px]"
                  />
                  <p className="text-xs text-muted-foreground">Provide a detailed description to help customers understand your product better.</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="price">Price ($)</Label>
                  <Input
                    id="price"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="location">Location</Label>
                  <Select
                    value={formData.location_id}
                    onValueChange={(value) => setFormData({ ...formData, location_id: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a location" />
                    </SelectTrigger>
                    <SelectContent>
                      {locations.map((location) => (
                        <SelectItem key={location.id} value={location.id}>
                          {location.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="category">Category</Label>
                  <Select
                    value={formData.category_id}
                    onValueChange={(value) => setFormData({ ...formData, category_id: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((category) => (
                        <SelectItem key={category.id} value={category.id}>
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Subcategory suggestions (optional) */}
                <div className="space-y-2">
                  <Label>Subcategory</Label>
                  {subcategories.length > 0 ? (
                    <Select
                      onValueChange={(value) => {
                        setAiSuggestion((prev) => ({ ...(prev||{}), subcategory: value }));
                      }}
                      value={aiSuggestion?.subcategory || ''}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select a subcategory" />
                      </SelectTrigger>
                      <SelectContent>
                        {subcategories.map((s) => (
                          <SelectItem key={s} value={s}>{s}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <Input
                      placeholder="Type a subcategory (optional)"
                      value={aiSuggestion?.subcategory || ''}
                      onChange={(e) => setAiSuggestion((prev) => ({ ...(prev||{}), subcategory: e.target.value }))}
                    />
                  )}
                </div>

                {/* Variant suggestions */}
                {variantSuggestions.length > 0 && (
                  <div className="space-y-2">
                    <Label>Variant Suggestions</Label>
                    <div className="flex flex-wrap gap-2">
                      {variantSuggestions.map((v) => {
                        const picked = aiVariantsToCreate.includes(v);
                        return (
                          <button
                            type="button"
                            key={v}
                            onClick={() => setAiVariantsToCreate((arr) => picked ? arr.filter((x) => x !== v) : [...arr, v])}
                            className={`px-2 py-1 rounded text-xs border ${picked ? 'bg-primary text-primary-foreground border-primary' : 'bg-muted hover:bg-muted/80'}`}
                          >
                            {picked ? '✓ ' : ''}{v}
                          </button>
                        );
                      })}
                    </div>
                    {aiVariantsToCreate.length > 0 && (
                      <div className="text-xs text-muted-foreground">Selected: {aiVariantsToCreate.join(', ')}</div>
                    )}
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="image_url">Image URL</Label>
                  <Input
                    id="image_url"
                    type="url"
                    value={formData.image_url}
                    onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                    placeholder="https://..."
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="image">Image</Label>
                  <Input
                    id="image"
                    type="file"
                    accept="image/*"
                    onChange={(e) => setImageFile(e.target.files ? e.target.files[0] : null)}
                  />
                  {(formData.image_url || imageFile) && (
                    <div className="mt-4">
                      <img
                        src={imageFile ? URL.createObjectURL(imageFile) : formData.image_url}
                        alt="Product preview"
                        className="w-full h-auto rounded-lg"
                      />
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value) => setFormData({ ...formData, status: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="sold">Sold</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex gap-4">
                  <Button type="submit" disabled={loading} className="flex-1">
                    {loading ? "Saving..." : (productId && productId !== 'new') ? "Update Product" : "Create Product"}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => navigate(-1)}
                    disabled={loading}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
      <Footer />
    </>
  );
};

export default ProductForm;
