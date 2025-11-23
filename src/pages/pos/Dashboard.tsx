import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { DollarSign, ShoppingCart, Package, Users, TrendingUp, TrendingDown, Activity, BarChart3, Calendar as CalendarIcon, Printer, Receipt, Eye } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import PosNavbar from "./components/PosNavbar";
import { printHtml, buildReceiptHtml } from "@/lib/print";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";

const Dashboard = () => {
  const [stats, setStats] = useState({
    todaySales: 0,
    todayOrders: 0,
    lowStock: 0,
    totalCustomers: 0,
    salesGrowth: 0,
    customerGrowth: 0,
  });
  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  const [salesByCategory, setSalesByCategory] = useState<any[]>([]);
  const [dailySales, setDailySales] = useState<any[]>([]);
  const [quickOpen, setQuickOpen] = useState(false);
  const [quickTitle, setQuickTitle] = useState("");
  const [quickAmount, setQuickAmount] = useState("");
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [detailsOrder, setDetailsOrder] = useState<any>(null);
  const [detailsPayments, setDetailsPayments] = useState<any[]>([]);
  const [daysRange, setDaysRange] = useState<number>(7);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  useEffect(() => {
    loadDashboardData();
    
    // Subscribe to realtime order updates
    const channel = supabase
      .channel("dashboard-orders")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "orders" },
        () => {
          loadDashboardData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Reload when the range or selected date changes
  useEffect(() => {
    loadDashboardData();
  }, [daysRange, selectedDate]);

  const loadDashboardData = async () => {
    // Today's sales
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const { data: todayOrdersData } = await supabase
      .from("orders")
      .select("total, created_at")
      .gte("created_at", today.toISOString());

    const todaySales = todayOrdersData?.reduce((sum, order) => sum + Number(order.total), 0) || 0;

    // Low stock products
    const { data: lowStockData } = await supabase
      .from("products")
      .select("id")
      .lte("stock", 10);

    // Total customers: count unique non-null customer_id values from orders
    const { data: customerOrders } = await supabase
      .from("orders")
      .select("customer_id")
      .neq("customer_id", null);

    const uniqueCustomerCount = customerOrders
      ? new Set(customerOrders.map((row: { customer_id: string }) => row.customer_id)).size
      : 0;

    // Calculate growth percentages (mock calculation - would need real data)
    const salesGrowth = 12.5; // Mock value
    const customerGrowth = 8.3; // Mock value

    setStats({
      todaySales,
      todayOrders: todayOrdersData?.length || 0,
      lowStock: lowStockData?.length || 0,
      totalCustomers: uniqueCustomerCount,
      salesGrowth,
      customerGrowth,
    });

    // Compute range for charts and aggregations
    const endOfRange = new Date();
    endOfRange.setHours(23, 59, 59, 999);
    const startOfRange = new Date(endOfRange);
    startOfRange.setDate(endOfRange.getDate() - (daysRange - 1));
    startOfRange.setHours(0, 0, 0, 0);

    // Recent orders (optionally filter by selected date)
    let ordersQuery = supabase
      .from("orders")
      .select("*, customer:profiles!orders_customer_id_fkey(full_name, username)")
      .order("created_at", { ascending: false });

    if (selectedDate) {
      const s = new Date(selectedDate);
      s.setHours(0, 0, 0, 0);
      const e = new Date(selectedDate);
      e.setDate(e.getDate() + 1);
      e.setHours(0, 0, 0, 0);
      ordersQuery = ordersQuery.gte("created_at", s.toISOString()).lt("created_at", e.toISOString()).limit(100);
    } else {
      ordersQuery = ordersQuery.limit(10);
    }

    const { data: ordersData } = await ordersQuery;

    setRecentOrders(ordersData || []);

    // Sales by category from order_items joined to products/categories within range
    const { data: itemsData } = await supabase
      .from("order_items")
      .select(`
        total,
        created_at,
        products (
          category,
          category_id,
          categories ( name )
        )
      `)
      .gte("created_at", startOfRange.toISOString())
      .lte("created_at", endOfRange.toISOString());

    const categoryMap: Record<string, number> = {};
    (itemsData || []).forEach((row: any) => {
      const product = row.products as any;
      const name: string = product?.categories?.name || product?.category || "Uncategorized";
      categoryMap[name] = (categoryMap[name] || 0) + Number(row.total || 0);
    });
    const categoryArray = Object.entries(categoryMap).map(([name, value]) => ({ name, value }));
    setSalesByCategory(categoryArray);

    // Daily sales for selected range using a single query
    const { data: rangeOrders } = await supabase
      .from("orders")
      .select("total, created_at")
      .gte("created_at", startOfRange.toISOString())
      .lte("created_at", endOfRange.toISOString());

    // Initialize map for each day in range
    const dayMap: Record<string, number> = {};
    const cursor = new Date(startOfRange);
    while (cursor <= endOfRange) {
      const key = `${cursor.getFullYear()}-${cursor.getMonth()+1}-${cursor.getDate()}`;
      dayMap[key] = 0;
      cursor.setDate(cursor.getDate() + 1);
    }

    (rangeOrders || []).forEach((order: any) => {
      const d = new Date(order.created_at);
      const key = `${d.getFullYear()}-${d.getMonth()+1}-${d.getDate()}`;
      dayMap[key] = (dayMap[key] || 0) + Number(order.total || 0);
    });

    const daily = Object.keys(dayMap).map(key => {
      const [y, m, d] = key.split('-').map(Number);
      const label = new Date(y, (m as number)-1, d as number).toLocaleDateString("en-US", { month: "short", day: "numeric" });
      return { date: label, sales: dayMap[key] };
    });
    setDailySales(daily);
  };

  const fetchReceiptSettings = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    const uid = session?.user?.id;
    if (!uid) return {} as any;
    const { data } = await supabase.from('receipt_settings').select('*').eq('profile_id', uid).maybeSingle();
    return data || {};
  };

  const handlePrintOrder = async (order: any) => {
    const settings = await fetchReceiptSettings();
    // Load items
    const { data: items } = await supabase.from('order_items').select('product_name, quantity, unit_price, total').eq('order_id', order.id);
    const orderObj = {
      order_number: order.order_number,
      created_at: order.created_at,
      cashier_name: order.cashier_name,
      total: Number(order.total),
      items: (items||[]).map((it:any)=>({ name: it.product_name, qty: it.quantity, unit: Number(it.unit_price), total: Number(it.total) }))
    };
    const html = buildReceiptHtml(settings||{}, 'order', orderObj);
    printHtml(html);
  };

  const handlePrintQuick = async () => {
    const amt = parseFloat(quickAmount || '0');
    const settings = await fetchReceiptSettings();
    const html = buildReceiptHtml(settings||{}, 'no_order', { total: amt }, { title: quickTitle || 'Receipt', total: amt });
    printHtml(html);
    setQuickOpen(false);
    setQuickTitle("");
    setQuickAmount("");
  };

  const openOrderDetails = async (order: any) => {
    setDetailsOrder(order);
    const { data: pays } = await supabase.from('payments').select('*').eq('order_id', order.id);
    setDetailsPayments(pays || []);
    setDetailsOpen(true);
  };

  const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6"];

  return (
    <div className="min-h-screen bg-muted/20">
      <PosNavbar />
      <div className="p-4 md:p-6 space-y-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold">Sales Dashboard</h1>
            <p className="text-muted-foreground">Monitor your business performance and sales metrics</p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="text-sm">
              <Activity className="h-3 w-3 mr-1" />
              Real-time updates
            </Badge>
            <Button variant="outline" size="sm" onClick={()=>setQuickOpen(true)}>
              <Receipt className="h-4 w-4 mr-1" /> Quick Receipt
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-blue-800">Today's Sales</CardTitle>
              <DollarSign className="h-5 w-5 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-900">
                ${stats.todaySales.toFixed(2)}
              </div>
              <div className="flex items-center mt-1">
                <TrendingUp className="h-4 w-4 text-green-600 mr-1" />
                <span className="text-xs text-green-600 font-medium">+{stats.salesGrowth}%</span>
                <span className="text-xs text-muted-foreground ml-1">from yesterday</span>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-emerald-50 to-emerald-100 border-emerald-200">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-emerald-800">Orders Today</CardTitle>
              <ShoppingCart className="h-5 w-5 text-emerald-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-emerald-900">{stats.todayOrders}</div>
              <div className="flex items-center mt-1">
                <TrendingUp className="h-4 w-4 text-green-600 mr-1" />
                <span className="text-xs text-green-600 font-medium">+5.2%</span>
                <span className="text-xs text-muted-foreground ml-1">from yesterday</span>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-amber-50 to-amber-100 border-amber-200">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-amber-800">Low Stock Items</CardTitle>
              <Package className="h-5 w-5 text-amber-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-amber-900">{stats.lowStock}</div>
              <div className="text-xs text-muted-foreground mt-1">Need restock</div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-violet-50 to-violet-100 border-violet-200">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-violet-800">Total Customers</CardTitle>
              <Users className="h-5 w-5 text-violet-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-violet-900">{stats.totalCustomers}</div>
              <div className="flex items-center mt-1">
                <TrendingUp className="h-4 w-4 text-green-600 mr-1" />
                <span className="text-xs text-green-600 font-medium">+{stats.customerGrowth}%</span>
                <span className="text-xs text-muted-foreground ml-1">from last month</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Daily Sales Chart */}
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 justify-between">
                <BarChart3 className="h-5 w-5" />
                <span>Sales Trend (Last {daysRange} Days)</span>
                <div className="ml-auto">
                  <Select value={String(daysRange)} onValueChange={(v) => setDaysRange(Number(v))}>
                    <SelectTrigger className="h-8 w-[110px] text-xs">
                      <SelectValue placeholder="Range" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="7">Last 7 days</SelectItem>
                      <SelectItem value="14">Last 14 days</SelectItem>
                      <SelectItem value="30">Last 30 days</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64 md:h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={dailySales}>
                    <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.3} />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--background))', 
                        border: '1px solid hsl(var(--border))', 
                        borderRadius: '0.5rem' 
                      }} 
                    />
                    <Line
                      type="monotone"
                      dataKey="sales"
                      stroke="hsl(var(--primary))"
                      strokeWidth={2}
                      dot={{ fill: 'hsl(var(--primary))', strokeWidth: 2, r: 4 }}
                      activeDot={{ r: 6, stroke: 'hsl(var(--primary))', strokeWidth: 2 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Sales by Category */}
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 justify-between">
                <BarChart3 className="h-5 w-5" />
                <span>Sales by Category</span>
                <span className="text-xs text-muted-foreground">(Last {daysRange} days)</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64 md:h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={salesByCategory}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) =>
                        `${name}: ${(percent * 100).toFixed(0)}%`
                      }
                      outerRadius={70}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {salesByCategory.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip 
                      formatter={(value) => [`${value}`, 'Sales']}
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--background))', 
                        border: '1px solid hsl(var(--border))', 
                        borderRadius: '0.5rem' 
                      }} 
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Orders */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 justify-between">
              <ShoppingCart className="h-5 w-5" />
              Recent Orders
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm" className="ml-auto h-8 text-xs">
                    <CalendarIcon className="h-3.5 w-3.5 mr-1" />
                    {selectedDate ? selectedDate.toLocaleDateString() : "Filter by day"}
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
                    <Button variant="ghost" size="sm" onClick={() => setSelectedDate(null)} className="h-8 text-xs">
                      Clear filter
                    </Button>
                  </div>
                </PopoverContent>
              </Popover>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground text-sm">Order #</th>
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground text-sm">Customer</th>
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground text-sm">Cashier</th>
                    <th className="text-right py-3 px-4 font-medium text-muted-foreground text-sm">Amount</th>
                    <th className="text-right py-3 px-4 font-medium text-muted-foreground text-sm">Time</th>
                    <th className="text-right py-3 px-4 font-medium text-muted-foreground text-sm">Actions</th>
                    <th className="text-right py-3 px-4 font-medium text-muted-foreground text-sm">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {recentOrders.map((order) => (
                    <tr key={order.id} className="border-b border-border last:border-0 hover:bg-muted/50">
                      <td className="py-3 px-4 font-medium">{order.order_number}</td>
                      <td className="py-3 px-4">{order.customer?.full_name || order.customer?.username || "Walk-in"}</td>
                      <td className="py-3 px-4">{order.cashier_name}</td>
                      <td className="py-3 px-4 text-right font-medium text-primary">${Number(order.total).toFixed(2)}</td>
                      <td className="py-3 px-4 text-right text-sm text-muted-foreground">
                        {new Date(order.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button variant="ghost" size="sm" onClick={()=>openOrderDetails(order)}><Eye className="h-4 w-4" /></Button>
                          <Button variant="ghost" size="sm" onClick={()=>handlePrintOrder(order)}><Printer className="h-4 w-4" /></Button>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <Button variant="ghost" size="sm" onClick={()=>handlePrintOrder(order)}>
                          <Printer className="h-4 w-4" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {recentOrders.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                No recent orders
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      <Dialog open={quickOpen} onOpenChange={setQuickOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Quick Receipt (No Order)</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Title</Label>
              <Input value={quickTitle} onChange={(e)=>setQuickTitle(e.target.value)} placeholder="e.g., Misc Sale" />
            </div>
            <div>
              <Label>Amount</Label>
              <Input type="number" min="0" step="0.01" value={quickAmount} onChange={(e)=>setQuickAmount(e.target.value)} placeholder="0.00" />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={()=>setQuickOpen(false)}>Cancel</Button>
              <Button onClick={handlePrintQuick} disabled={!quickAmount}>Print</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Order Details</DialogTitle>
          </DialogHeader>
          {detailsOrder && (
            <div className="space-y-2 text-sm">
              <div><span className="font-medium">Order #:</span> {detailsOrder.order_number}</div>
              <div><span className="font-medium">Date:</span> {new Date(detailsOrder.created_at).toLocaleString()}</div>
              <div><span className="font-medium">Cashier:</span> {detailsOrder.cashier_name}</div>
              <div className="mt-2 font-medium">Payments</div>
              {detailsPayments.length === 0 ? (
                <div className="text-muted-foreground">No payments recorded</div>
              ) : (
                <ul className="list-disc ml-5">
                  {detailsPayments.map((p) => (
                    <li key={p.id}>{p.payment_method || 'payment'} — ${Number(p.amount).toFixed(2)}</li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Dashboard;
