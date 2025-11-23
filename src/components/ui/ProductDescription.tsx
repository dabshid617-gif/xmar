import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface ProductDescriptionProps {
  title: string;
  description: string;
  status: string;
  showStatus?: boolean;
  className?: string;
}

const ProductDescription = ({
  title,
  description,
  status,
  showStatus = true,
  className = ""
}: ProductDescriptionProps) => {
  return (
    <div className={`bg-card border rounded-xl p-6 shadow-sm ${className}`}>
      <div className="flex items-start justify-between mb-4">
        <div>
          <h2 className="text-2xl font-bold text-foreground mb-1">{title}</h2>
        </div>
        {showStatus && status === 'sold' && (
          <Badge variant={'destructive'}>
            Sold Out
          </Badge>
        )}
      </div>
      
      <div className="flex items-center mb-4">
        <div className="h-0.5 bg-primary w-12 mr-3"></div>
        <h3 className="text-lg font-semibold text-foreground">Description</h3>
      </div>
      
      <div className="prose prose-sm max-w-none">
        {description ? (
          <p className="text-muted-foreground leading-relaxed whitespace-pre-line">
            {description}
          </p>
        ) : (
          <p className="text-muted-foreground italic">The seller has not provided a description for this product yet. Please check back later.</p>
        )}
      </div>
    </div>
  );
};

export default ProductDescription;