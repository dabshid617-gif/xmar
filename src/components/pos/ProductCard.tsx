import { memo } from "react";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Product } from "@/types/pos";
import { Edit, Trash2 } from "lucide-react";

interface ProductCardProps {
  product: Product;
  onEdit: (product: Product) => void;
  onDelete: (id: string) => void;
}

const PosProductCard = ({ product, onEdit, onDelete }: ProductCardProps) => {
  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-start">
          <CardTitle className="text-lg">{product.name}</CardTitle>
          <Badge variant={product.stock > 10 ? "success" : (product.stock > 0 ? "secondary" : "destructive")}>
            {product.stock > 0 ? `${product.stock} in stock` : "Out of stock"}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex justify-center mb-4">
          <img
            src={product.image_url || "/placeholder.svg"}
            alt={product.name}
            className="w-32 h-32 object-cover rounded-lg"
            loading="lazy"
            decoding="async"
          />
        </div>
        <div className="text-lg font-bold text-center">${product.price.toFixed(2)}</div>
        <div className="text-sm text-muted-foreground text-center">{product.sku}</div>
      </CardContent>
      <CardFooter className="flex justify-end gap-2">
        <Button variant="ghost" size="icon" onClick={() => onEdit(product)}>
          <Edit className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="icon" className="text-destructive" onClick={() => onDelete(product.id)}>
          <Trash2 className="h-4 w-4" />
        </Button>
      </CardFooter>
    </Card>
  );
};

export default memo(PosProductCard);
