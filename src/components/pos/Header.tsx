import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Settings, User, LogOut, ShoppingBag } from "lucide-react";
import { ReactNode } from "react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Link } from "react-router-dom";

interface HeaderProps {
  cashier?: string;
  children?: ReactNode;
}

export const Header = ({ cashier = "Admin", children }: HeaderProps) => {
  return (
    <header className="h-16 bg-card border-b border-border px-4 flex items-center justify-between">
      <div className="flex items-center gap-2">
        {children}
      </div>

      <div className="flex items-center gap-4 flex-1 justify-center">
        
      </div>

      <div className="flex items-center gap-2">
        
        <Tooltip>
          <TooltipTrigger asChild>
            <Link to="/pos/inventory">
              <Button variant="ghost" size="icon">
                <ShoppingBag className="h-5 w-5" />
              </Button>
            </Link>
          </TooltipTrigger>
          <TooltipContent>
            <p>Inventory</p>
          </TooltipContent>
        </Tooltip>
        
      </div>
    </header>
  );
};
