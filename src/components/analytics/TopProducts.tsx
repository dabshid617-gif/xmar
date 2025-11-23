import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface TopProduct {
  id: string;
  title: string;
  salesCount: number;
  revenue: number;
}

interface TopProductsProps {
  products: TopProduct[];
}

const TopProducts: React.FC<TopProductsProps> = ({ products }) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Top Selling Products</CardTitle>
      </CardHeader>
      <CardContent>
        {products.length === 0 ? (
          <p className="text-center text-muted-foreground py-4">No sales data available</p>
        ) : (
          <div className="space-y-4">
            {products.map((product, index) => (
              <div key={product.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center space-x-3">
                  <span className="text-lg font-bold text-muted-foreground">#{index + 1}</span>
                  <div>
                    <p className="font-medium">{product.title}</p>
                    <p className="text-sm text-muted-foreground">{product.salesCount} sales</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-primary">${product.revenue.toFixed(2)}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default TopProducts;