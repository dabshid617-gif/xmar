import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { toast } from "sonner";

const SalesOrder = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [products, setProducts] = useState<Array<{ id: string; title: string; price: number }>>([]);
  const [profiles, setProfiles] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    product_id: "",
    buyer_id: "",
    amount: "",
  });

  useEffect(() => {
    checkAuth();
    loadProducts();
    loadProfiles();
  }, []);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate("/auth");
      return;
    }
    setUser(session.user);
  };

  const loadProducts = async () => {
    try {
      const { data, error } = await supabase
        .from("products")
        .select("id, title, price")
        .eq("status", "active");

      if (error) throw error;
      setProducts(data || []);
    } catch (error: any) {
      toast.error("Failed to load products");
    }
  };

  const loadProfiles = async () => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, username");

      if (error) throw error;
      setProfiles(data || []);
    } catch (error: any) {
      toast.error("Failed to load users");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);
    try {
      const saleData = {
        product_id: formData.product_id,
        seller_id: user.id,
        buyer_id: formData.buyer_id,
        amount: parseFloat(formData.amount),
      };

      const { error } = await supabase.from("sales").insert([saleData]);

      if (error) throw error;
      toast.success("Sales order created!");
      navigate("/dashboard");
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
          <Card>
            <CardHeader>
              <CardTitle>Create Sales Order</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="product">Product</Label>
                  <Select
                    onValueChange={(value) => {
                      const selectedProduct = products.find(p => p.id === value);
                      setFormData({ ...formData, product_id: value, amount: selectedProduct ? selectedProduct.price.toString() : "" });
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a product" />
                    </SelectTrigger>
                    <SelectContent>
                      {products.map((product) => (
                        <SelectItem key={product.id} value={product.id}>
                          {product.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="buyer">Buyer</Label>
                  <Select
                    onValueChange={(value) => setFormData({ ...formData, buyer_id: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a buyer" />
                    </SelectTrigger>
                    <SelectContent>
                      {profiles.map((profile) => (
                        <SelectItem key={profile.id} value={profile.id}>
                          {profile.username}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="amount">Amount ($)</Label>
                  <Input
                    id="amount"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    required
                  />
                </div>

                <div className="flex gap-4">
                  <Button type="submit" disabled={loading} className="flex-1">
                    {loading ? "Creating..." : "Create Order"}
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

export default SalesOrder;
