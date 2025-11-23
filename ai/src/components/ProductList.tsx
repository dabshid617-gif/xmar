import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Package } from "lucide-react";
import { toast } from "sonner";

interface Product {
  id: string;
  product_name: string;
  image_url: string;
  category: string | null;
  description: string | null;
  variants: any;
  analyzed: boolean;
  created_at: string;
}

interface ProductListProps {
  refreshTrigger: number;
}

export const ProductList = ({ refreshTrigger }: ProductListProps) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchProducts();
  }, [refreshTrigger]);

  const fetchProducts = async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setProducts(data || []);
    } catch (error: any) {
      toast.error("Failed to load products");
      console.error('Fetch error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <Card className="p-12 text-center bg-muted/30">
        <Package className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
        <h3 className="text-xl font-semibold mb-2 text-foreground">No products yet</h3>
        <p className="text-muted-foreground">Upload your first product to get started</p>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {products.map((product) => (
        <Card key={product.id} className="overflow-hidden hover:shadow-glow transition-all duration-300 bg-card">
          <div className="aspect-square bg-muted/30 relative">
            <img
              src={product.image_url}
              alt={product.product_name}
              className="w-full h-full object-cover"
            />
            {!product.analyzed && (
              <div className="absolute inset-0 bg-background/80 flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            )}
          </div>
          
          <div className="p-4 space-y-3">
            <div>
              <h3 className="font-bold text-lg text-foreground">{product.product_name}</h3>
              {product.category && (
                <Badge className="mt-2 bg-primary/10 text-primary hover:bg-primary/20">
                  {product.category}
                </Badge>
              )}
            </div>

            {product.description && (
              <p className="text-sm text-muted-foreground line-clamp-3">
                {product.description}
              </p>
            )}

            {product.variants && product.variants.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-foreground mb-2">Variants:</p>
                <div className="flex flex-wrap gap-2">
                  {product.variants.map((variant, idx) => (
                    <Badge key={idx} variant="secondary" className="text-xs">
                      {variant}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        </Card>
      ))}
    </div>
  );
};