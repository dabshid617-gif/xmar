import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { DollarSign, Package, TrendingUp, Filter as FilterIcon, Calendar as CalendarIcon } from "lucide-react";
import { toast } from "sonner";
import SalesChart from "@/components/analytics/SalesChart";
import TopProducts from "@/components/analytics/TopProducts";
import RevenueSummary from "@/components/analytics/RevenueSummary";
import SalesTrend from "@/components/analytics/SalesTrend";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface Sale {
  id: string;
  amount: number;
  created_at: string;
  product_id: string;
  products: {
    title: string;
  };

  buyer: {
    username: string;
  };
}

interface ProductSale {
  id: string;
  title: string;
  salesCount: number;
  revenue: number;
}

interface SalesDataPoint {
  date: string;
  revenue: number;
  sales: number;
}

const Dashboard = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [sales, setSales] = useState<Sale[]>([]);
  const [posOrders, setPosOrders] = useState<any[]>([]);
  const [stats, setStats] = useState({
    totalRevenue: 0,
    totalSales: 0,
    activeProducts: 0,
  });
  const [topProducts, setTopProducts] = useState<ProductSale[]>([]);
  const [salesData, setSalesData] = useState<SalesDataPoint[]>([]);
  const [revenueSummary, setRevenueSummary] = useState({
    todayRevenue: 0,
    weekRevenue: 0,
    monthRevenue: 0,
    todaySales: 0,
    weekSales: 0,
    monthSales: 0,
  });
  const [salesTrends, setSalesTrends] = useState({
    revenueChange: 0,
    salesChange: 0,
    lastWeekRevenue: 0,
    lastWeekSales: 0,
  });
  const [daysRange, setDaysRange] = useState<number>(7);
  const [channelFilter, setChannelFilter] = useState<"all" | "online" | "pos">("all");
  const [cashierFilter, setCashierFilter] = useState<string>("all");
  const [cashierOptions, setCashierOptions] = useState<string[]>(["all"]);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [profileVisits, setProfileVisits] = useState<any[]>([]);
  const [productVisits, setProductVisits] = useState<any[]>([]);
  const [ownedProducts, setOwnedProducts] = useState<any[]>([]);
  const [reviewProductId, setReviewProductId] = useState<string>("");
  const [reviewsByProduct, setReviewsByProduct] = useState<any[]>([]);

  useEffect(() => {
    checkAuth();
  }, []);

  useEffect(() => {
    if (user) {
      loadDashboardData();
    }
  }, [user, daysRange, channelFilter, cashierFilter, selectedDate]);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate("/auth");
      return;
    }
    setUser(session.user);
  };

  const loadDashboardData = async () => {
    if (!user) return;

    try {
      // Determine date range
      const endOfRange = selectedDate ? new Date(selectedDate) : new Date();
      endOfRange.setHours(23, 59, 59, 999);
      const startOfRange = new Date(endOfRange);
      startOfRange.setDate(endOfRange.getDate() - (daysRange - 1));
      startOfRange.setHours(0, 0, 0, 0);

      // Fetch online sales in range
      let onlineSales: Sale[] = [];
      if (channelFilter !== "pos") {
        const { data: sData, error: sErr } = await supabase
          .from("sales")
          .select(`
            *,
            products(title),
            buyer:profiles!sales_buyer_id_fkey(username)
          `)
          .eq("seller_id", user.id)
          .gte("created_at", startOfRange.toISOString())
          .lte("created_at", endOfRange.toISOString())
          .order("created_at", { ascending: false });
        if (sErr) throw sErr;
        onlineSales = (sData || []) as Sale[];
      }
      setSales(onlineSales);

      // Fetch POS orders in range (RLS ensures only this seller)
      let orders: any[] = [];
      if (channelFilter !== "online") {
        let oq = supabase
          .from("orders")
          .select("id, total, created_at, cashier_name, order_number")
          .gte("created_at", startOfRange.toISOString())
          .lte("created_at", endOfRange.toISOString())
          .order("created_at", { ascending: false });
        if (cashierFilter !== "all") oq = oq.eq("cashier_name", cashierFilter);
        const { data: oData, error: oErr } = await oq;
        if (oErr) throw oErr;
        orders = oData || [];
      }
      setPosOrders(orders);

      // Build cashier options from orders
      const cashierSet = new Set<string>(["all"]);
      orders.forEach((o) => { if (o.cashier_name) cashierSet.add(o.cashier_name); });
      setCashierOptions(Array.from(cashierSet));

      // Top products from both sources
      const productSalesMap: Record<string, { id: string; title: string; salesCount: number; revenue: number }> = {};
      // Online
      if (channelFilter !== "pos") {
        onlineSales.forEach((sale) => {
          const productId = sale.product_id;
          if (!productSalesMap[productId]) {
            productSalesMap[productId] = { id: productId, title: sale.products.title, salesCount: 0, revenue: 0 };
          }
          productSalesMap[productId].salesCount += 1;
          productSalesMap[productId].revenue += Number(sale.amount);
        });
      }
      // POS via order_items
      if (channelFilter !== "online" && orders.length > 0) {
        const orderIds = orders.map((o) => o.id);
        const { data: items, error: iErr } = await supabase
          .from("order_items")
          .select(`order_id, product_id, quantity, total, products(title)`) 
          .in("order_id", orderIds);
        if (iErr) throw iErr;
        (items || []).forEach((row: any) => {
          const productId = row.product_id as string;
          const title = row.products?.title || "Product";
          if (!productSalesMap[productId]) {
            productSalesMap[productId] = { id: productId, title, salesCount: 0, revenue: 0 };
          }
          productSalesMap[productId].salesCount += Number(row.quantity || 1);
          productSalesMap[productId].revenue += Number(row.total || 0);
        });
      }

      const topProductsList = Object.values(productSalesMap)
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 5);
      setTopProducts(topProductsList);

      // Combined entries for charts and summaries
      type Entry = { created_at: string; amount: number };
      const combined: Entry[] = [];
      if (channelFilter !== "pos") combined.push(...onlineSales.map((s) => ({ created_at: s.created_at, amount: Number(s.amount) })));
      if (channelFilter !== "online") combined.push(...orders.map((o) => ({ created_at: o.created_at, amount: Number(o.total) })));

      const totalRevenue = combined.reduce((sum, e) => sum + e.amount, 0);

      const salesByDate: Record<string, { revenue: number; sales: number }> = {};
      combined.forEach((e) => {
        const key = new Date(e.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" });
        if (!salesByDate[key]) salesByDate[key] = { revenue: 0, sales: 0 };
        salesByDate[key].revenue += e.amount;
        salesByDate[key].sales += 1;
      });
      const salesDataArray = Object.entries(salesByDate)
        .map(([date, data]) => ({ date, revenue: data.revenue, sales: data.sales }))
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
      setSalesData(salesDataArray);

      // Revenue summary
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const weekAgo = new Date(today);
      weekAgo.setDate(today.getDate() - 7);
      const monthAgo = new Date(today);
      monthAgo.setMonth(today.getMonth() - 1);

      let todayRevenue = 0, weekRevenue = 0, monthRevenue = 0;
      let todaySales = 0, weekSales = 0, monthSales = 0;
      combined.forEach((e) => {
        const d = new Date(e.created_at);
        const dOnly = new Date(d.getFullYear(), d.getMonth(), d.getDate());
        if (dOnly.getTime() === today.getTime()) { todayRevenue += e.amount; todaySales += 1; }
        if (d >= weekAgo) { weekRevenue += e.amount; weekSales += 1; }
        if (d >= monthAgo) { monthRevenue += e.amount; monthSales += 1; }
      });
      setRevenueSummary({ todayRevenue, weekRevenue, monthRevenue, todaySales, weekSales, monthSales });

      // Trends (last 7 vs previous 7)
      const twoWeeksAgo = new Date(weekAgo);
      twoWeeksAgo.setDate(weekAgo.getDate() - 7);
      let lastWeekRevenue = 0, prevWeekRevenue = 0;
      let lastWeekSales = 0, prevWeekSales = 0;
      combined.forEach((e) => {
        const d = new Date(e.created_at);
        if (d >= weekAgo && d <= now) { lastWeekRevenue += e.amount; lastWeekSales += 1; }
        else if (d >= twoWeeksAgo && d < weekAgo) { prevWeekRevenue += e.amount; prevWeekSales += 1; }
      });
      const revenueChange = prevWeekRevenue !== 0 ? ((lastWeekRevenue - prevWeekRevenue) / prevWeekRevenue) * 100 : lastWeekRevenue > 0 ? 100 : 0;
      const salesChange = prevWeekSales !== 0 ? ((lastWeekSales - prevWeekSales) / prevWeekSales) * 100 : lastWeekSales > 0 ? 100 : 0;
      setSalesTrends({ revenueChange, salesChange, lastWeekRevenue, lastWeekSales });

      const { data: productsData, error: productsError } = await supabase
        .from("products")
        .select("*")
        .eq("user_id", user.id)
        .eq("status", "active");
      if (productsError) throw productsError;
      setStats({ totalRevenue, totalSales: combined.length || 0, activeProducts: productsData?.length || 0 });
      setOwnedProducts(productsData || []);
      if (!reviewProductId && (productsData || []).length > 0) {
        setReviewProductId((productsData as any[])[0].id as string);
      }

      // Profile visits
      const { data: pvis } = await supabase
        .from('profile_views')
        .select('created_at, viewer:profiles(full_name, username, avatar_url)')
        .eq('profile_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10);
      setProfileVisits(pvis || []);

      // Product views
      const { data: pvraw } = await supabase
        .from('product_views')
        .select('created_at, product:products!product_views_product_id_fkey(id, title, user_id), viewer:profiles(full_name, username, avatar_url)')
        .order('created_at', { ascending: false })
        .limit(30);
      setProductVisits((pvraw || []).filter((r:any)=> r.product?.user_id === user.id).slice(0,10));
    } catch (error: any) {
      toast.error("Failed to load dashboard data");
    }
  };

  return (
    <>
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 py-8">
          <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <h1 className="text-3xl font-bold">Sales Dashboard</h1>
            <div className="w-full md:w-auto">
              <div className="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-2 md:gap-3">
                <FilterIcon className="h-4 w-4 text-muted-foreground" />
                <Select value={channelFilter} onValueChange={(v) => setChannelFilter(v as any)}>
                  <SelectTrigger className="h-9 w-full sm:w-[140px]"><SelectValue placeholder="Channel" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Channels</SelectItem>
                    <SelectItem value="online">Online</SelectItem>
                    <SelectItem value="pos">POS</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={String(daysRange)} onValueChange={(v) => setDaysRange(Number(v))}>
                  <SelectTrigger className="h-9 w-full sm:w-[140px]"><SelectValue placeholder="Range" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="7">Last 7 days</SelectItem>
                    <SelectItem value="14">Last 14 days</SelectItem>
                    <SelectItem value="30">Last 30 days</SelectItem>
                  </SelectContent>
                </Select>
                {channelFilter !== "online" && (
                  <Select value={cashierFilter} onValueChange={(v) => setCashierFilter(v)}>
                    <SelectTrigger className="h-9 w-full sm:w-[160px]"><SelectValue placeholder="Cashier" /></SelectTrigger>
                    <SelectContent>
                      {cashierOptions.map((name) => (
                        <SelectItem key={name} value={name}>{name === "all" ? "All Cashiers" : name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" size="sm" className="h-9 w-full sm:w-auto">
                      <CalendarIcon className="h-4 w-4 mr-2" />
                      {selectedDate ? selectedDate.toLocaleDateString() : "Pick a day"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="end">
                    <Calendar
                      mode="single"
                      selected={selectedDate || undefined}
                      onSelect={(d) => setSelectedDate(d ?? null)}
                      initialFocus
                    />
                    <div className="p-2 border-t text-right">
                      <Button variant="ghost" size="sm" onClick={() => setSelectedDate(null)}>Clear</Button>
                    </div>
                  </PopoverContent>
                </Popover>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-primary">
                  ${stats.totalRevenue.toFixed(2)}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Total Sales</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-primary">{stats.totalSales}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Active Products</CardTitle>
                <Package className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-primary">{stats.activeProducts}</div>
              </CardContent>
            </Card>
          </div>

          {/* New Analytics Section */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold mb-4">Revenue Summary</h2>
            <RevenueSummary 
              todayRevenue={revenueSummary.todayRevenue}
              weekRevenue={revenueSummary.weekRevenue}
              monthRevenue={revenueSummary.monthRevenue}
              todaySales={revenueSummary.todaySales}
              weekSales={revenueSummary.weekSales}
              monthSales={revenueSummary.monthSales}
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            <div>
              <h2 className="text-2xl font-bold mb-4">Sales Performance</h2>
              {salesData.length > 0 ? (
                <SalesChart data={salesData} />
              ) : (
                <Card className="p-8 text-center">
                  <p className="text-muted-foreground">No sales data to display</p>
                </Card>
              )}
            </div>
            
            <div>
              <h2 className="text-2xl font-bold mb-4">Sales Trends</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <SalesTrend 
                  value={salesTrends.lastWeekRevenue}
                  change={salesTrends.revenueChange}
                  title="Revenue Growth"
                  period="vs. previous week"
                />
                <SalesTrend 
                  value={salesTrends.lastWeekSales}
                  change={salesTrends.salesChange}
                  title="Sales Growth"
                  period="vs. previous week"
                />
              </div>
              
              <div className="mt-6">
                <h3 className="text-xl font-semibold mb-4">Top Selling Products</h3>
                <TopProducts products={topProducts} />
              </div>
            </div>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Recent Sales</CardTitle>
            </CardHeader>
            <CardContent>
              {(() => {
                const onlineEntries = (channelFilter !== "pos" ? sales : []).map((s) => ({
                  id: `online-${s.id}`,
                  title: s.products.title,
                  subtitle: `Buyer @${s.buyer.username} · Online`,
                  created_at: s.created_at,
                  amount: Number(s.amount),
                }));
                const posEntries = (channelFilter !== "online" ? posOrders : []).map((o: any) => ({
                  id: `pos-${o.id}`,
                  title: `Order ${o.order_number}`,
                  subtitle: `Cashier: ${o.cashier_name || 'N/A'} · POS`,
                  created_at: o.created_at,
                  amount: Number(o.total),
                }));
                const recent = [...onlineEntries, ...posEntries]
                  .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
                  .slice(0, 10);
                if (recent.length === 0) {
                  return <p className="text-center text-muted-foreground py-8">No sales yet</p>;
                }
                return (
                  <div className="space-y-4">
                    {recent.map((entry) => (
                      <div key={entry.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="min-w-0 pr-3">
                          <p className="font-medium truncate">{entry.title}</p>
                          <p className="text-sm text-muted-foreground break-words">{entry.subtitle}</p>
                          <p className="text-xs text-muted-foreground">{new Date(entry.created_at).toLocaleDateString()}</p>
                        </div>
                        <div className="text-xl font-bold text-primary flex-shrink-0">${entry.amount.toFixed(2)}</div>
                      </div>
                    ))}
                  </div>
                );
              })()}
            </CardContent>
          </Card>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-8">
            <Card>
              <CardHeader>
                <CardTitle>Recent Profile Visits</CardTitle>
              </CardHeader>
              <CardContent>
                {profileVisits.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No recent visits</p>
                ) : (
                  <div className="space-y-3">
                    {profileVisits.map((v, idx) => (
                      <div key={idx} className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          {v.viewer?.avatar_url ? <AvatarImage src={v.viewer.avatar_url} /> : <AvatarFallback>{(v.viewer?.username||'U')[0].toUpperCase()}</AvatarFallback>}
                        </Avatar>
                        <div className="flex-1">
                          <div className="text-sm font-medium">{v.viewer?.full_name || v.viewer?.username || 'Visitor'}</div>
                          <div className="text-xs text-muted-foreground">{new Date(v.created_at).toLocaleString()}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Recent Product Views</CardTitle>
              </CardHeader>
              <CardContent>
                {productVisits.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No recent views</p>
                ) : (
                  <div className="space-y-3">
                    {productVisits.map((pv, idx) => (
                      <div key={idx} className="text-sm">
                        <div className="font-medium">{pv.product?.title || 'Product'}</div>
                        <div className="text-xs text-muted-foreground">{pv.viewer?.full_name || pv.viewer?.username || 'Visitor'} • {new Date(pv.created_at).toLocaleString()}</div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Reviews by Product</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="mb-3">
                  <Select value={reviewProductId} onValueChange={(v)=>setReviewProductId(v)}>
                    <SelectTrigger><SelectValue placeholder="Select product" /></SelectTrigger>
                    <SelectContent>
                      {ownedProducts.map((p:any)=>(<SelectItem key={p.id} value={p.id}>{p.title}</SelectItem>))}
                    </SelectContent>
                  </Select>
                </div>
                {reviewsByProduct.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No reviews</p>
                ) : (
                  <div className="space-y-3">
                    {reviewsByProduct.map((r:any) => (
                      <div key={r.id} className="text-sm">
                        <div className="font-medium">Rating: {r.rating}/5</div>
                        {r.comment && <div className="text-muted-foreground">{r.comment}</div>}
                        <div className="text-xs text-muted-foreground">{new Date(r.created_at).toLocaleString()}</div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
};

export default Dashboard;
