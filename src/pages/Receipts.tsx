import { useEffect, useState } from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { printHtml, buildReceiptHtml } from '@/lib/print';

const Receipts = () => {
  const [userId, setUserId] = useState<string | null>(null);
  const [sales, setSales] = useState<any[]>([]);
  const [purchases, setPurchases] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      const uid = session?.user?.id || null;
      setUserId(uid);
    });
  }, []);

  useEffect(() => {
    if (!userId) { setLoading(false); return; }
    (async () => {
      setLoading(true);
      // Purchases: orders where customer_id is me
      const { data: myPurchases } = await supabase
        .from('orders')
        .select('*, order_items(*, products(user_id, title)), customer:profiles!orders_customer_id_fkey(full_name, username)')
        .eq('customer_id', userId)
        .order('created_at', { ascending: false });
      setPurchases(myPurchases || []);

      // Sales: rely on RLS to return only orders where I am seller via order_items->products.user_id
      const { data: maybeSales } = await supabase
        .from('orders')
        .select('*, order_items(*, products(user_id, title)), customer:profiles!orders_customer_id_fkey(full_name, username)')
        .order('created_at', { ascending: false })
        .limit(50);

      const mySales = (maybeSales || []).filter((o: any) => (o.order_items || []).some((it: any) => it.products?.user_id === userId));
      setSales(mySales);
      setLoading(false);
    })();
  }, [userId]);

  const sellerProfileSettingsFallback = async (sellerId: string) => {
    // Try receipt_settings (may be blocked by RLS), else fallback to profile
    const { data: rs } = await supabase.from('receipt_settings').select('*').eq('profile_id', sellerId).maybeSingle();
    if (rs) return rs;
    const { data: prof } = await supabase.from('profiles').select('full_name, username, avatar_url, contact_number').eq('id', sellerId).maybeSingle();
    return {
      business_name: prof?.full_name || prof?.username || 'Receipt',
      logo_url: prof?.avatar_url || null,
      phone: prof?.contact_number || null,
    } as any;
  };

  const printOrder = async (order: any, mode: 'sales'|'purchases') => {
    let settings: any = {};
    if (mode === 'sales') {
      // Seller prints with own settings
      const { data: { session } } = await supabase.auth.getSession();
      const me = session?.user?.id;
      const { data: rs } = await supabase.from('receipt_settings').select('*').eq('profile_id', me).maybeSingle();
      if (rs) settings = rs; else {
        const { data: prof } = await supabase.from('profiles').select('full_name, username, avatar_url, contact_number').eq('id', me!).maybeSingle();
        settings = { business_name: prof?.full_name || prof?.username || 'Receipt', logo_url: prof?.avatar_url || null, phone: prof?.contact_number || null };
      }
    } else {
      // Buyer prints with seller's settings/fallback
      const sellerId = order.order_items?.[0]?.products?.user_id;
      settings = await sellerProfileSettingsFallback(sellerId);
    }
    const items = (order.order_items || []).map((it: any) => ({ name: it.product_name || it.products?.title || 'Item', qty: it.quantity || 1, unit: Number(it.unit_price || it.total || 0), total: Number(it.total || 0) }));
    const orderObj = { order_number: order.order_number, created_at: order.created_at, cashier_name: order.cashier_name, total: Number(order.total || 0), items };
    const html = buildReceiptHtml(settings, 'order', orderObj);
    printHtml(html);
  };

  return (
    <>
      <Navbar />
      <div className="container mx-auto px-4 py-8 min-h-screen">
        <h1 className="text-2xl md:text-3xl font-bold mb-6">Receipts</h1>
        {loading ? (
          <div>Loading...</div>
        ) : (
          <Tabs defaultValue="purchases">
            <TabsList>
              <TabsTrigger value="purchases">My Purchases</TabsTrigger>
              <TabsTrigger value="sales">My Sales</TabsTrigger>
            </TabsList>
            <TabsContent value="purchases">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
                {purchases.map((o) => (
                  <Card key={o.id} className="bg-card">
                    <CardHeader>
                      <CardTitle className="flex items-center justify-between">
                        <span>Order {o.order_number || '—'}</span>
                        <span className="text-sm text-muted-foreground">{new Date(o.created_at).toLocaleDateString()}</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between mb-2">
                        <div className="text-sm text-muted-foreground">Total</div>
                        <div className="font-semibold">${Number(o.total || 0).toFixed(2)}</div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button variant="outline" onClick={()=>printOrder(o, 'purchases')}>Print Receipt</Button>
                        <Button variant="ghost" onClick={()=>window.location.href=`/orders/${o.id}`}>View Details</Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>
            <TabsContent value="sales">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
                {sales.map((o) => (
                  <Card key={o.id} className="bg-card">
                    <CardHeader>
                      <CardTitle className="flex items-center justify-between">
                        <span>Order {o.order_number || '—'}</span>
                        <span className="text-sm text-muted-foreground">{new Date(o.created_at).toLocaleDateString()}</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between mb-2">
                        <div className="text-sm text-muted-foreground">Total</div>
                        <div className="font-semibold">${Number(o.total || 0).toFixed(2)}</div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button variant="outline" onClick={()=>printOrder(o, 'sales')}>Print Receipt</Button>
                        <Button variant="ghost" onClick={()=>window.location.href=`/orders/${o.id}`}>View Details</Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        )}
      </div>
      <Footer />
    </>
  );
};

export default Receipts;
