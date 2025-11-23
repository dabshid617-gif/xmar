import { useState, useEffect } from "react";
import { Header } from "@/components/pos/Header";
import { CategorySidebar } from "@/components/pos/CategorySidebar";
import { ProductGrid } from "@/components/pos/ProductGrid";
import { Cart } from "@/components/pos/Cart";
import { PaymentModal } from "@/components/pos/PaymentModal";
import { supabase } from "@/integrations/supabase/client";
import { offlineSync } from "@/lib/offlineSync";
import { CartItem, Product, Payment } from "@/types/pos";
import { toast } from "sonner";
import { useIsMobile } from "@/hooks/use-mobile";
import { Drawer, DrawerContent, DrawerTrigger } from "@/components/ui/drawer";
import { useDebouncedValue } from "@/hooks/useDebounce";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ToggleLeft, ToggleRight, ShoppingCart, Monitor, Smartphone, Tablet, Search } from "lucide-react";
import PosNavbar from "./components/PosNavbar";
import OrderTabs, { OrderTab } from "@/components/pos/OrderTabs";
import Numpad from "@/components/pos/Numpad";

const Index = () => {
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearch = useDebouncedValue(searchQuery, 250);
  type Draft = { id: string; name: string; items: CartItem[]; customer?: { name: string; phone?: string } };
  const [orders, setOrders] = useState<Draft[]>([{ id: crypto.randomUUID(), name: 'Order 1', items: [] }]);
  const [activeOrderId, setActiveOrderId] = useState<string>(orders[0].id);
  const activeOrder = orders.find(o => o.id === activeOrderId)!;
  const cartItems = activeOrder.items;
  const setCartItems = (items: CartItem[]) => setOrders(os => os.map(o => o.id===activeOrderId ? { ...o, items } : o));
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [customer, setCustomer] = useState<{ name: string; phone?: string }>();
  const [products, setProducts] = useState<any[]>([]);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const isMobile = useIsMobile();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isDesktopSidebarOpen, setIsDesktopSidebarOpen] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedLine, setSelectedLine] = useState<number | null>(null);
  const [npMode, setNpMode] = useState<'qty'|'price'|'disc'>('qty');
  const [npValue, setNpValue] = useState<string>('');

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    console.log("User:", user);
    loadProducts();
    offlineSync.init();

    const handleOnline = () => {
      setIsOnline(true);
      syncOfflineData();
    };
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [user]);

  const loadProducts = async () => {
    if (navigator.onLine && user) {
      const { data } = await supabase
        .from("products")
        .select("*")
        .eq("status", "active")
        .eq("user_id", user.id);

      if (data) {
        const productData = data.map((p) => ({
          id: p.id,
          name: p.title,
          price: Number(p.price),
          category: p.category || "",
          sku: p.sku,
          stock: p.stock,
          barcode: p.barcode,
          image: p.image_url,
        }));
        setProducts(productData);

        const uniqueCategories = Array.from(new Set(productData.map(p => p.category).filter(Boolean)));
        setCategories(uniqueCategories);

        await offlineSync.cacheProducts(data);
        console.log("Products:", data);
      }
    } else {
      const cached = await offlineSync.getCachedProducts();
      setProducts(
        cached.map((p) => ({
          id: p.id,
          name: p.name,
          price: Number(p.base_price),
          category: "",
          sku: p.sku,
          stock: p.stock,
          barcode: p.barcode,
        }))
      );
    }
  };

  const syncOfflineData = async () => {
    const result = await offlineSync.syncToServer();
    if (result.synced > 0) {
      toast.success(`Synced ${result.synced} pending transactions`);
    }
    loadProducts();
  };

  const filteredProducts = products.filter((product) => {
    const matchesCategory = selectedCategory === "all" || product.category === selectedCategory;
    const q = debouncedSearch.trim().toLowerCase();
    const matchesSearch =
      q === "" ||
      product.name.toLowerCase().includes(q) ||
      product.sku?.toLowerCase().includes(q) ||
      product.barcode?.includes(q);
    return matchesCategory && matchesSearch;
  });

  const handleSelectProduct = (product: Product) => {
    const existingIndex = cartItems.findIndex((item) => item.product.id === product.id);

    if (existingIndex >= 0) {
      const newItems = [...cartItems];
      newItems[existingIndex].quantity += 1;
      setCartItems(newItems);
    } else {
      setCartItems([
        ...cartItems,
        { product, quantity: 1, discount: 0, discountType: "percentage" },
      ]);
    }
    toast.success(`Added ${product.name} to cart`);

    // Track add-to-cart event (non-blocking)
    (async () => {
      try {
        const { data: sessionData } = await supabase.auth.getSession();
        const uid = sessionData.session?.user?.id || null;
        await supabase.from('product_cart_adds').insert([{ product_id: product.id, user_id: uid }]);
      } catch (e) {
        // ignore analytics errors
      }
    })();
  };

  const handleUpdateQuantity = (index: number, quantity: number) => {
    if (quantity <= 0) {
      handleRemoveItem(index);
      return;
    }
    const newItems = [...cartItems];
    newItems[index].quantity = quantity;
    setCartItems(newItems);
  };

  const handleRemoveItem = (index: number) => {
    const item = cartItems[index];
    setCartItems(cartItems.filter((_, i) => i !== index));
    toast.info(`Removed ${item.product.name} from cart`);
  };

  const handleUpdateDiscount = (
    index: number,
    discount: number,
    type: "percentage" | "amount"
  ) => {
    const newItems = [...cartItems];
    newItems[index].discount = discount;
    newItems[index].discountType = type;
    setCartItems(newItems);
  };

  const applyNumpad = () => {
    if (selectedLine === null) return;
    const v = parseFloat(npValue);
    if (Number.isNaN(v)) return;
    const newItems = [...cartItems];
    const it = { ...newItems[selectedLine] };
    if (npMode === 'qty') {
      it.quantity = Math.max(0, Math.floor(v));
      if (it.quantity === 0) return handleRemoveItem(selectedLine);
    } else if (npMode === 'price') {
      it.product = { ...it.product, price: v } as Product;
    } else if (npMode === 'disc') {
      it.discountType = 'percentage';
      it.discount = Math.min(100, Math.max(0, v));
    }
    newItems[selectedLine] = it;
    setCartItems(newItems);
    setNpValue('');
  };

  const closeOrder = (id: string) => {
    setOrders(os => os.filter(o => o.id !== id));
    if (activeOrderId === id && orders.length > 1) {
      const next = orders.find(o => o.id !== id)!;
      setActiveOrderId(next.id);
    }
  };

  const addOrder = () => {
    const draft: Draft = { id: crypto.randomUUID(), name: `Order ${orders.length + 1}`, items: [] };
    setOrders(os => [...os, draft]);
    setActiveOrderId(draft.id);
    setSelectedLine(null);
  };

  const handleCheckout = () => {
    if (cartItems.length === 0) return;
    setPaymentModalOpen(true);
  };

  const handleConfirmPayment = async (payments: Payment[]) => {
    const subtotal = calculateTotal();
    const orderData = {
      order_number: `ORD-${Date.now()}`,
      customer_id: null,
      cashier_name: user?.email || "POS",
      subtotal,
      discount_amount: 0,
      discount_percentage: 0,
      total: subtotal,
      status: "completed",
    };

    try {
      if (isOnline) {
        const { data: order, error: orderError } = await supabase
          .from("orders")
          .insert([orderData])
          .select()
          .single();

        if (orderError) throw orderError;

        const orderItems = cartItems.map((item) => ({
          order_id: order.id,
          product_id: item.product.id,
          product_name: item.product.name,
          quantity: item.quantity,
          unit_price: item.product.price,
          discount_amount: item.discountType === "amount" ? item.discount : 0,
          discount_percentage: item.discountType === "percentage" ? item.discount : 0,
          total:
            item.product.price * item.quantity -
            (item.discountType === "percentage"
              ? (item.product.price * item.quantity * item.discount) / 100
              : item.discount),
        }));

        await supabase.from("order_items").insert(orderItems);

        const paymentRecords = payments.map((p) => ({
          order_id: order.id,
          payment_method: p.method,
          amount: p.amount,
        }));

        await supabase.from("payments").insert(paymentRecords);

        // Load/ensure receipt settings, print, and snapshot
        let settings: any = {};
        try {
          const { data: rs } = await supabase
            .from('receipt_settings')
            .select('*')
            .eq('profile_id', user.id)
            .maybeSingle();
          settings = rs || {};
          if (!rs) {
            const { data: prof } = await supabase
              .from('profiles')
              .select('full_name, username, avatar_url, contact_number')
              .eq('id', user.id)
              .maybeSingle();
            settings = {
              business_name: prof?.full_name || prof?.username || 'Receipt',
              logo_url: prof?.avatar_url || null,
              phone: prof?.contact_number || null,
            } as any;
            await supabase.from('receipt_settings').upsert({ profile_id: user.id, ...settings });
          }
        } catch (_) {
          // ignore settings errors
        }

        try {
          const { buildReceiptHtml, printHtml } = await import('@/lib/print');
          const ro = {
            order_number: order.order_number,
            created_at: order.created_at,
            cashier_name: order.cashier_name,
            total: Number(order.total),
            items: orderItems.map((it:any)=>({ name: it.product_name, qty: it.quantity, unit: it.unit_price, total: it.total })),
          };
          const html = buildReceiptHtml(settings, 'order', ro);
          printHtml(html);
        } catch (_) { /* ignore printing errors */ }

        try {
          await supabase.from('receipt_snapshots').insert([{ order_id: order.id, seller_id: user.id, customer_id: null, payload: { order, items: orderItems, payments: paymentRecords, settings } }]);
        } catch (_) { /* ignore snapshot errors */ }
      } else {
        // Queue for sync when online
        await offlineSync.addToSyncQueue({
          entity_type: "order",
          entity_id: orderData.order_number,
          action: "create",
          data: { order: orderData, items: cartItems, payments },
        });
        toast.warning("Order saved offline, will sync when online");
      }

      toast.success("Order completed successfully!", {
        description: `Total: ${subtotal.toFixed(2)}`,
      });
      
      setCartItems([]);
      setCustomer(undefined);
      setPaymentModalOpen(false);
      loadProducts();
    } catch (error) {
      console.error("Order error:", error);
      toast.error("Failed to complete order");
    }
  };

  const handleSelectCustomer = () => {
    setCustomer({ name: "Walk-in Customer", phone: "+252 61 234 5678" });
    toast.info("Customer selected");
  };

  const calculateTotal = () => {
    return cartItems.reduce((sum, item) => {
      const itemTotal = item.product.price * item.quantity;
      const itemDiscount =
        item.discountType === "percentage"
          ? itemTotal * (item.discount / 100)
          : item.discount;
      return sum + itemTotal - itemDiscount;
    }, 0);
  };

  if (isMobile) {
    return (
      <div className="h-screen flex flex-col bg-background">
        <Header cashier="Admin">
          <OrderTabs
            tabs={orders.map(o => ({ id: o.id, name: o.name }))}
            activeId={activeOrderId}
            onSelect={setActiveOrderId}
            onAdd={addOrder}
            onClose={closeOrder}
            inline
          />
          <Drawer open={isSidebarOpen} onOpenChange={setIsSidebarOpen}>
            <DrawerTrigger asChild>
              <Button variant="ghost" size="icon" aria-label="Categories">
                <ToggleLeft className="h-6 w-6" />
              </Button>
            </DrawerTrigger>
            <DrawerContent className="h-[80vh] p-4">
              <CategorySidebar
                categories={categories}
                selectedCategory={selectedCategory}
                onSelectCategory={(c) => {
                  setSelectedCategory(c);
                  setIsSidebarOpen(false);
                }}
              />
            </DrawerContent>
          </Drawer>
          <div className="ml-2 -mt-2">
            <PosNavbar inline />
          </div>
        </Header>
        <div className="flex-1 overflow-y-auto p-2">
          <div className="relative max-w-md flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search products..."
              className="pl-10"
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="mb-4 p-3 bg-gradient-to-r from-primary/10 to-secondary/10 rounded-xl border border-border">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-primary">Point of Sale</h2>
              <div className="flex items-center gap-2">
                <div className={`h-3 w-3 rounded-full ${isOnline ? 'bg-green-500' : 'bg-red-500'}`}></div>
                <span className="text-sm">{isOnline ? 'Online' : 'Offline'}</span>
              </div>
            </div>
            <p className="text-sm text-muted-foreground mt-1">Scan, sell, and process payments</p>
          </div>
          <ProductGrid
            products={filteredProducts}
            onSelectProduct={handleSelectProduct}
          />
        </div>
        <footer className="bg-card border-t p-3">
          <Drawer open={isCartOpen} onOpenChange={setIsCartOpen}>
            <DrawerTrigger asChild>
              <Button variant="default" className="w-full bg-primary hover:bg-primary/90">
                <ShoppingCart className="mr-2 h-4 w-4" />
                <span className="flex-1 text-left">
                  <div className="font-medium">Cart</div>
                  <div className="text-xs opacity-80">{cartItems.length} items • ${calculateTotal().toFixed(2)}</div>
                </span>
              </Button>
            </DrawerTrigger>
            <DrawerContent className="h-[80vh]">
              <Cart
                items={cartItems}
                onUpdateQuantity={handleUpdateQuantity}
                onRemoveItem={handleRemoveItem}
                onUpdateDiscount={handleUpdateDiscount}
                onCheckout={() => {
                  setIsCartOpen(false);
                  handleCheckout();
                }}
                onSelectCustomer={handleSelectCustomer}
                customer={customer}
                onSelectLine={setSelectedLine}
                selectedIndex={selectedLine}
              />
              <div className="p-4">
                <Numpad
                  mode={npMode}
                  value={npValue}
                  onChange={setNpValue}
                  onApply={applyNumpad}
                  onDelete={() => setNpValue(v => v.slice(0,-1))}
                  onModeChange={setNpMode}
                />
              </div>
            </DrawerContent>
          </Drawer>
        </footer>
        <PaymentModal
          open={paymentModalOpen}
          onClose={() => setPaymentModalOpen(false)}
          total={calculateTotal()}
          onConfirm={handleConfirmPayment}
        />
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-background">
      <Header cashier="Admin">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsDesktopSidebarOpen(!isDesktopSidebarOpen)}
          className="hidden md:inline-flex"
        >
          {isDesktopSidebarOpen ? (
            <ToggleLeft className="h-6 w-6" />
          ) : (
            <ToggleRight className="h-6 w-6" />
          )}
        </Button>
        <div className="hidden md:flex items-center ml-2 md:-mt-2 lg:-mt-3">
          <PosNavbar inline />
        </div>
      </Header>
      <div className="flex-1 flex overflow-hidden">
        {isDesktopSidebarOpen && (
          <div className="hidden md:flex w-64 bg-card border-r border-border flex-col">
            <div className="flex-1 overflow-y-auto">
              <CategorySidebar
                categories={categories}
                selectedCategory={selectedCategory}
                onSelectCategory={setSelectedCategory}
              />
            </div>
          </div>
        )}
        
        <div className="flex-1 flex flex-col overflow-hidden">
          <OrderTabs
            tabs={orders.map(o => ({ id: o.id, name: o.name }))}
            activeId={activeOrderId}
            onSelect={setActiveOrderId}
            onAdd={addOrder}
            onClose={closeOrder}
          />

          <div className="p-4 border-b border-border">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="relative max-w-md flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search products..."
                  className="pl-10"
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <div>
                <h2 className="text-xl font-bold text-foreground">Point of Sale</h2>
                <p className="text-sm text-muted-foreground">Scan, sell, and process payments</p>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1 px-3 py-1.5 bg-secondary rounded-lg text-xs">
                  <div className={`h-2 w-2 rounded-full ${isOnline ? 'bg-green-500' : 'bg-red-500'}`}></div>
                  <span>{isOnline ? 'Online' : 'Offline'}</span>
                </div>
                <div className="flex items-center gap-1 px-3 py-1.5 bg-secondary rounded-lg text-xs">
                  <Monitor className="h-3 w-3" />
                  <span>Desktop</span>
                </div>
              </div>
            </div>
          </div>
          
          <div className="flex-1 flex overflow-hidden">
            <div className="flex-1 overflow-y-auto p-4">
              <ProductGrid
                products={filteredProducts}
                onSelectProduct={handleSelectProduct}
              />
            </div>
            
            <div className="hidden md:block w-[28rem] border-l border-border bg-card flex flex-col">
              <Cart
                items={cartItems}
                onUpdateQuantity={handleUpdateQuantity}
                onRemoveItem={handleRemoveItem}
                onUpdateDiscount={handleUpdateDiscount}
                onCheckout={handleCheckout}
                onSelectCustomer={handleSelectCustomer}
                customer={customer}
                onSelectLine={setSelectedLine}
                selectedIndex={selectedLine}
              />
              <div className="border-t border-border p-4">
                <Numpad
                  mode={npMode}
                  value={npValue}
                  onChange={setNpValue}
                  onApply={applyNumpad}
                  onDelete={() => setNpValue(v => v.slice(0,-1))}
                  onModeChange={setNpMode}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
      <PaymentModal
        open={paymentModalOpen}
        onClose={() => setPaymentModalOpen(false)}
        total={calculateTotal()}
        onConfirm={handleConfirmPayment}
      />
    </div>
  );
};

export default Index;
