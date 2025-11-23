import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, TrendingDown } from "lucide-react";

interface SalesTrendProps {
  value: number;
  change: number;
  title: string;
  period: string;
}

const SalesTrend: React.FC<SalesTrendProps> = ({
  value,
  change,
  title,
  period
}) => {
  const isPositive = change >= 0;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between">
          <div>
            <div className="text-2xl font-bold text-primary">
              {typeof value === 'number' ? value.toFixed(2) : value}
            </div>
            <p className="text-xs text-muted-foreground">{period}</p>
          </div>
          <div className={`flex items-center ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
            {isPositive ? (
              <TrendingUp className="h-4 w-4 mr-1" />
            ) : (
              <TrendingDown className="h-4 w-4 mr-1" />
            )}
            <span className="text-sm font-medium">{Math.abs(change).toFixed(1)}%</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default SalesTrend;