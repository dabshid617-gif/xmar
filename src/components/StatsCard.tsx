import { Card } from "@/components/ui/card";
import { ReactNode } from "react";

interface Props {
  icon: ReactNode;
  label: string;
  value: string | number;
  subtle?: string;
}

export default function StatsCard({ icon, label, value, subtle }: Props) {
  return (
    <Card className="p-4 flex items-center gap-3 bg-card border-border">
      <div className="h-10 w-10 rounded-full bg-primary/10 text-primary grid place-items-center">
        {icon}
      </div>
      <div className="flex-1">
        <div className="text-sm text-muted-foreground">{label}</div>
        <div className="text-xl font-bold leading-tight">{value}</div>
        {subtle && <div className="text-xs text-muted-foreground mt-0.5">{subtle}</div>}
      </div>
    </Card>
  );
}

