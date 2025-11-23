import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { buildReceiptHtml, printHtml } from '@/lib/print';

const OrderDetails = () => {
  const { orderId } = useParams();
  const [order, setOrder] = useState<any>(null);
  const [items, setItems] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      if (!orderId) return;
      setLoading(true);
      const { data: o } = await supabase.from('orders').select('*').eq('id', orderId).maybeSingle();
      const { data: it } = await supabase.from('order_items').select('*, products(title, user_id)').eq('order_id', orderId);
      const { data: pay } = await supabase.from('payments').select('*').eq('order_id', orderId);
      setOrder(o);
      setItems(it || []);
      setPayments(pay || []);
      setLoading(false);
    })();
  }, [orderId]);

  const handlePrint = async () => {
    if (!order) return;
    // Get seller id from first item
    const sellerId = items[0]?.products?.user_id;
    let settings: any = {};
    if (sellerId) {
      const { data: rs } = await supabase.from('receipt_settings').select('*').eq('profile_id', sellerId).maybeSingle();
      if (rs) settings = rs; else {
        const { data: prof } = await supabase.from('profiles').select('full_name, username, avatar_url, contact_number').eq('id', sellerId).maybeSingle();
        settings = { business_name: prof?.full_name || prof?.username || 'Receipt', logo_url: prof?.avatar_url || null, phone: prof?.contact_number || null };
      }
    }
    const ro = {
      order_number: order.order_number,
      created_at: order.created_at,
      cashier_name: order.cashier_name,
      total: Number(order.total || 0),
      items: items.map((it:any)=>({ name: it.product_name || it.products?.title || 'Item', qty: it.quantity, unit: Number(it.unit_price), total: Number(it.total) }))
    };
    const html = buildReceiptHtml(settings, 'order', ro);
    printHtml(html);
  };

  if (loading) return (<><Navbar /><div className="container mx-auto px-4 py-8">Loading...</div><Footer /></>);
  if (!order) return (<><Navbar /><div className="container mx-auto px-4 py-8">Order not found</div><Footer /></>);

  return (
    <>
      <Navbar />
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardHeader>
            <CardTitle>Order {order.order_number || order.id}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div><span className="font-medium">Date:</span> {new Date(order.created_at).toLocaleString()}</div>
              <div><span className="font-medium">Cashier:</span> {order.cashier_name}</div>
              <div><span className="font-medium">Status:</span> {order.status}</div>
              <div><span className="font-medium">Total:</span> ${Number(order.total).toFixed(2)}</div>
            </div>
            <div className="mt-4">
              <div className="font-medium mb-2">Items</div>
              <div className="space-y-2">
                {items.map((it) => (
                  <div key={it.id} className="flex items-center justify-between text-sm">
                    <div>{it.product_name || it.products?.title}</div>
                    <div>{it.quantity} x ${Number(it.unit_price).toFixed(2)} = ${Number(it.total).toFixed(2)}</div>
                  </div>
                ))}
              </div>
            </div>
            <div className="mt-4">
              <div className="font-medium mb-2">Payments</div>
              {payments.length === 0 ? (
                <div className="text-muted-foreground text-sm">No payments recorded</div>
              ) : (
                <ul className="list-disc ml-5 text-sm">
                  {payments.map((p) => (
                    <li key={p.id}>{p.payment_method || 'payment'} — ${Number(p.amount).toFixed(2)}</li>
                  ))}
                </ul>
              )}
            </div>
            <div className="mt-6">
              <Button onClick={handlePrint}>Reprint Receipt</Button>
            </div>
          </CardContent>
        </Card>
      </div>
      <Footer />
    </>
  );
};

export default OrderDetails;

