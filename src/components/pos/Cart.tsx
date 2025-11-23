import { CartItem } from "@/types/pos";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Minus, Plus, Trash2, User, CreditCard } from "lucide-react";
import { useState } from "react";

interface CartProps {
  items: CartItem[];
  onUpdateQuantity: (index: number, quantity: number) => void;
  onRemoveItem: (index: number) => void;
  onUpdateDiscount: (index: number, discount: number, type: 'percentage' | 'amount') => void;
  onCheckout: () => void;
  onSelectCustomer: () => void;
  customer?: { name: string; phone?: string };
  onSelectLine?: (index: number) => void;
  selectedIndex?: number | null;
}

export const Cart = ({
  items,
  onUpdateQuantity,
  onRemoveItem,
  onUpdateDiscount,
  onCheckout,
  onSelectCustomer,
  customer,
  onSelectLine,
  selectedIndex,
}: CartProps) => {
  const [orderDiscount, setOrderDiscount] = useState(0);

  const subtotal = items.reduce((sum, item) => {
    const itemTotal = item.product.price * item.quantity;
    const itemDiscount = item.discountType === 'percentage' 
      ? itemTotal * (item.discount / 100)
      : item.discount;
    return sum + itemTotal - itemDiscount;
  }, 0);

  const total = subtotal - (orderDiscount / 100 * subtotal);

  return (
    <aside className="flex flex-col h-full">
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-bold">Current Order</h2>
          <Badge variant="secondary" className="text-sm">
            {items.length} items
          </Badge>
        </div>
        <Button
          variant="outline"
          className="w-full justify-start text-base"
          onClick={onSelectCustomer}
        >
          <User className="mr-2 h-4 w-4" />
          {customer ? customer.name : "Select Customer"}
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
            <CreditCard className="h-16 w-16 mb-4 opacity-50" />
            <h3 className="text-lg font-semibold">Cart is empty</h3>
            <p className="text-sm">Add products to get started.</p>
          </div>
        ) : (
          items.map((item, index) => {
            const itemTotal = item.product.price * item.quantity;
            const itemDiscount = item.discountType === 'percentage' 
              ? itemTotal * (item.discount / 100)
              : item.discount;
            const finalPrice = itemTotal - itemDiscount;

            return (
              <Card
                key={index}
                className={`p-3 bg-card border-border shadow-sm cursor-pointer ${index===selectedIndex ? 'ring-2 ring-primary' : ''}`}
                onClick={() => onSelectLine?.(index)}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <h3 className="font-semibold text-sm line-clamp-1">{item.product.name}</h3>
                    <p className="text-xs text-muted-foreground">${item.product.price.toFixed(2)} each</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-destructive hover:text-destructive"
                    onClick={() => onRemoveItem(index)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1">
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => onUpdateQuantity(index, item.quantity - 1)}
                      disabled={item.quantity <= 1}
                    >
                      <Minus className="h-3 w-3" />
                    </Button>
                    <span className="w-8 text-center font-bold text-base">{item.quantity}</span>
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => onUpdateQuantity(index, item.quantity + 1)}
                    >
                      <Plus className="h-3 w-3" />
                    </Button>
                  </div>
                  <div className="text-right">
                    {item.discount > 0 && (
                      <p className="text-xs text-destructive line-through">
                        ${itemTotal.toFixed(2)}
                      </p>
                    )}
                    <p className="font-bold text-primary text-base">
                      ${finalPrice.toFixed(2)}
                    </p>
                  </div>
                </div>

                {item.discount > 0 && (
                  <Badge variant="secondary" className="mt-2 text-xs font-medium">
                    Discount: {item.discountType === 'percentage' ? `${item.discount}%` : `$${item.discount}`}
                  </Badge>
                )}
              </Card>
            );
          })
        )}
      </div>

      <div className="border-t border-border p-4 space-y-3 bg-card">
        <div className="space-y-1 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Subtotal</span>
            <span className="font-semibold">${subtotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Discount</span>
            <span className="font-semibold">{orderDiscount > 0 ? `${orderDiscount}%` : "N/A"}</span>
          </div>
          <Separator className="my-2" />
          <div className="flex justify-between text-base font-bold">
            <span>Total</span>
            <span className="text-primary">${total.toFixed(2)}</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Input
            type="number"
            placeholder="Discount %"
            value={orderDiscount || ""}
            onChange={(e) => setOrderDiscount(Number(e.target.value))}
            className="h-9 text-sm"
            min="0"
            max="100"
          />
          <Button variant="outline" onClick={() => setOrderDiscount(0)} className="h-9">Clear</Button>
        </div>

        <Button
          className="w-full bg-primary hover:bg-primary/90 text-primary-foreground text-base"
          size="lg"
          onClick={onCheckout}
          disabled={items.length === 0}
        >
          <CreditCard className="mr-2 h-5 w-5" />
          Checkout
        </Button>
      </div>
    </aside>
  );
};
