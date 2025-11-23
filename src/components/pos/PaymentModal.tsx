import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Payment } from "@/types/pos";
import { Trash2, Banknote, Smartphone, CreditCard } from "lucide-react";

interface PaymentModalProps {
  open: boolean;
  onClose: () => void;
  total: number;
  onConfirm: (payments: Payment[]) => void;
}

export const PaymentModal = ({ open, onClose, total, onConfirm }: PaymentModalProps) => {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [currentAmount, setCurrentAmount] = useState<string>("");
  const [selectedMethod, setSelectedMethod] = useState<Payment['method']>('cash');

  const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0);
  const remaining = Math.max(0, total - totalPaid);
  const change = Math.max(0, totalPaid - total);

  const paymentMethods: { id: Payment['method']; label: string; icon: any }[] = [
    { id: 'cash', label: 'Cash', icon: Banknote },
    { id: 'evc_plus', label: 'EVC Plus', icon: Smartphone },
    { id: 'zaad', label: 'ZAAD', icon: Smartphone },
    { id: 'waffi', label: 'WAFFI', icon: Smartphone },
    { id: 'edahab', label: 'E-DAHAB', icon: Smartphone },
  ];

  const handleAddPayment = () => {
    const amount = parseFloat(currentAmount);
    if (Number.isNaN(amount) || amount <= 0) return;
    // Allow overpay only for cash (to compute change)
    if (selectedMethod !== 'cash' && amount > remaining) return;
    setPayments([...payments, { method: selectedMethod, amount }]);
    setCurrentAmount("");
  };

  const handlePayFull = (method: Payment['method']) => {
    console.log('handlePayFull called with method:', method, 'and total:', total);
    try {
      setPayments([{ method, amount: total }]);
    } catch (error) {
      console.error('Error in handlePayFull:', error);
    }
  };

  const handleConfirm = () => {
    if (remaining <= 0) {
      onConfirm(payments);
      setPayments([]);
      setCurrentAmount("");
      onClose();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Process Payment</DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-3 gap-4">
          <div className="p-4 bg-muted rounded-lg text-center">
            <p className="text-sm text-muted-foreground">Total Amount</p>
            <p className="text-2xl font-bold text-primary">${total.toFixed(2)}</p>
          </div>
          <div className="p-4 bg-primary/10 rounded-lg text-center">
            <p className="text-sm text-muted-foreground">Paid</p>
            <p className="text-2xl font-bold text-primary">${totalPaid.toFixed(2)}</p>
          </div>
          {remaining > 0 ? (
            <div className="p-4 bg-destructive/10 rounded-lg text-center">
              <p className="text-sm text-muted-foreground">Remaining</p>
              <p className="text-2xl font-bold text-destructive">${remaining.toFixed(2)}</p>
            </div>
          ) : (
            <div className="p-4 bg-emerald-100 dark:bg-emerald-900/20 rounded-lg text-center">
              <p className="text-sm text-muted-foreground">Change</p>
              <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">${change.toFixed(2)}</p>
            </div>
          )}
        </div>

        <Separator />

        <div className="space-y-3">
          <Label>Payment Method</Label>
          <div className="grid grid-cols-5 gap-2">
            {paymentMethods.map((method) => {
              const Icon = method.icon;
              const isSelected = selectedMethod === method.id;
              return (
                <Button
                  key={method.id}
                  variant={isSelected ? "default" : "outline"}
                  className="flex flex-col h-auto py-2 text-xs"
                  onClick={() => setSelectedMethod(method.id)}
                >
                  <Icon className="h-5 w-5 mb-1" />
                  {method.label}
                </Button>
              );
            })}
          </div>
        </div>

        <div className="flex items-end gap-2">
          <div className="flex-1">
            <Label htmlFor="amount">Amount</Label>
            <Input
              id="amount"
              type="number"
              placeholder="Enter amount"
              value={currentAmount}
              onChange={(e) => setCurrentAmount(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAddPayment()}
            />
          </div>
          <Button onClick={handleAddPayment} disabled={!currentAmount}>
            Add Payment
          </Button>
          <Button
            variant="secondary"
            onClick={() => handlePayFull(selectedMethod)}
          >
            Pay Full
          </Button>
        </div>

        {payments.length > 0 && (
          <div className="space-y-2">
            <Label>Payments</Label>
            <div className="space-y-2">
              {payments.map((payment, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-2 bg-muted rounded-lg"
                >
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">{payment.method.toUpperCase()}</Badge>
                    <span className="font-semibold">${payment.amount.toFixed(2)}</span>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 text-muted-foreground"
                    onClick={() => setPayments(payments.filter((_, i) => i !== index))}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}

        <Separator />

        <div className="flex gap-2 mt-4">
          <Button variant="outline" onClick={onClose} className="flex-1">
            Cancel
          </Button>
          <Button onClick={handleConfirm} disabled={remaining > 0} className="flex-1">
            <CreditCard className="mr-2 h-4 w-4" />
            Complete Payment
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
