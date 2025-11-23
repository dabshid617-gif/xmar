import { memo } from "react";
import { Product } from "@/types/pos";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Package } from "lucide-react";

interface ProductGridProps {
  products: Product[];
  onSelectProduct: (product: Product) => void;
}

export const ProductGrid = memo(({ products, onSelectProduct }: ProductGridProps) => {
  return (
    <div className="flex-1 bg-pos-product-grid overflow-y-auto">
      <div className="p-2 sm:p-3 md:p-4">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-2 sm:gap-3 md:gap-4">
          {products.map((product) => (
            <Card
              key={product.id}
              className="cursor-pointer hover:shadow-lg transition-all hover:scale-105 active:scale-95 bg-card border-border overflow-hidden group"
              onClick={() => onSelectProduct(product)}
            >
              <div className="aspect-square bg-secondary/50 flex items-center justify-center border-b border-border relative">
                {product.image ? (
                  <img src={product.image} alt={product.name} className="w-full h-full object-cover" loading="lazy" decoding="async" />
                ) : (
                  <Package className="h-1/2 w-1/2 text-muted-foreground/50 transition-transform group-hover:scale-110" />
                )}
                {product.stock <= 10 && (
                  <Badge variant="destructive" className="absolute top-2 right-2 text-xs">
                    Low Stock
                  </Badge>
                )}
              </div>
              <div className="p-2 sm:p-3">
                <h3 className="font-semibold text-sm sm:text-base mb-1 line-clamp-2 min-h-[2.5rem] sm:min-h-[2.8rem]">
                  {product.name}
                </h3>
                <div className="flex items-center justify-between">
                  <p className="text-primary font-bold text-base sm:text-lg">
                    ${product.price.toFixed(2)}
                  </p>

                </div>
                <p className="text-xs text-muted-foreground mt-1 hidden sm:block">{product.sku}</p>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
});
