import { Button } from "@/components/ui/button";
import { X, Plus } from "lucide-react";

export type OrderTab = {
  id: string;
  name: string;
  status?: 'pending' | 'parked' | 'completed';
};

interface OrderTabsProps {
  tabs: OrderTab[];
  activeId: string;
  onSelect: (id: string) => void;
  onAdd: () => void;
  onClose: (id: string) => void;
  inline?: boolean;
}

export const OrderTabs = ({ tabs, activeId, onSelect, onAdd, onClose, inline }: OrderTabsProps) => {
  return (
    <div className={inline ? "flex items-center gap-2" : "p-2 border-b border-border bg-card"}>
      <div className="flex items-center gap-2 flex-wrap">
        {tabs.map((t) => (
          <Button
            key={t.id}
            variant={t.id === activeId ? "default" : "outline"}
            className="h-9 px-3 relative pr-8"
            onClick={() => onSelect(t.id)}
          >
            <span className="mr-2 text-sm font-medium">{t.name}</span>
            <span
              role="button"
              aria-label={`Close ${t.name}`}
              className="absolute right-1 top-1/2 -translate-y-1/2 h-6 w-6 inline-flex items-center justify-center rounded hover:bg-muted"
              onClick={(e) => { e.stopPropagation(); onClose(t.id); }}
            >
              <X className="h-4 w-4" />
            </span>
          </Button>
        ))}
        <Button variant="secondary" className="h-9 px-3" onClick={onAdd}>
          <Plus className="h-4 w-4 mr-1" /> New Order
        </Button>
      </div>
    </div>
  );
};

export default OrderTabs;
