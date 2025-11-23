import { Link, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin, CheckCircle } from "lucide-react";

interface ProductCardProps {
  product: {
    id: string | number;
    title: string;
    description: string;
    price: number;
    image_url: string;
    status: string;
    user_id: string;
    profiles?: {
      username: string;
      full_name: string;
      is_verified?: boolean;
    };
    stock?: number;
    location?: string; // Add location property
  };
}

const ProductCard = ({ product }: ProductCardProps) => {
  const navigate = useNavigate();
  const firstImageUrl = product.image_url ? product.image_url.split(',')[0].trim() : null;

  return (
    <Card 
      className="overflow-hidden hover:shadow-lg transition-all duration-300 cursor-pointer group border-transparent hover:border-primary"
      onClick={() => navigate(`/products/${product.id}`)}
    >
      <div className="h-56 bg-muted overflow-hidden">
        {firstImageUrl ? (
          <img
            src={firstImageUrl}
            alt={product.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="h-full w-full bg-gradient-to-br from-primary/10 to-secondary/10 flex items-center justify-center">
            <p className="text-muted-foreground">No image</p>
          </div>
        )}
      </div>
      <CardHeader>
        <div className="flex justify-between items-start mb-1">
          <CardTitle className="text-base font-semibold line-clamp-1">{product.title}</CardTitle>
          {product.stock === 0 && (
            <Badge variant={'destructive'} className="shrink-0">
              Sold Out
            </Badge>
          )}
        </div>
        {product.description ? (
          <p className="text-sm text-muted-foreground line-clamp-2 mb-2">{product.description}</p>
        ) : (
          <p className="text-sm text-muted-foreground italic mb-2">No description available</p>
        )}
        {product.profiles && (
          <p className="text-sm font-medium text-black flex items-center gap-1">
            by <Link to={`/profile/${product.user_id}`} className="text-sm hover:text-primary" onClick={(e) => e.stopPropagation()}>@{product.profiles.username}</Link>
            {product.profiles.is_verified && <CheckCircle className="h-4 w-4 text-primary" />}
          </p>
        )}
        {product.location && (
          <div className="flex items-center text-sm text-muted-foreground mt-1">
            <MapPin className="h-4 w-4 mr-1" />
            {product.location}
          </div>
        )}
      </CardHeader>
      <CardContent>
        <p className="text-2xl font-bold text-primary">
          ${product.price.toFixed(2)}
        </p>
      </CardContent>
    </Card>
  );
};

export default ProductCard;
