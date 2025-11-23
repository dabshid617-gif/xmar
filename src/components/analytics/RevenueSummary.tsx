import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface RevenueSummaryProps {
  todayRevenue: number;
  weekRevenue: number;
  monthRevenue: number;
  todaySales: number;
  weekSales: number;
  monthSales: number;
}

const RevenueSummary: React.FC<RevenueSummaryProps> = ({
  todayRevenue,
  weekRevenue,
  monthRevenue,
  todaySales,
  weekSales,
  monthSales
}) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">Today</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-primary">${todayRevenue.toFixed(2)}</div>
          <p className="text-sm text-muted-foreground">{todaySales} sales</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">This Week</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-primary">${weekRevenue.toFixed(2)}</div>
          <p className="text-sm text-muted-foreground">{weekSales} sales</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">This Month</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-primary">${monthRevenue.toFixed(2)}</div>
          <p className="text-sm text-muted-foreground">{monthSales} sales</p>
        </CardContent>
      </Card>
    </div>
  );
};

export default RevenueSummary;