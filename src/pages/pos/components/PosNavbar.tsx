import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Home, BarChart3, Archive } from "lucide-react";

interface PosNavbarProps {
  inline?: boolean;
}

const PosNavbar = ({ inline = false }: PosNavbarProps) => {
  if (inline) {
    return (
      <div className="flex items-center gap-2 md:gap-3">
        <Button variant="ghost" size="sm" asChild>
          <Link to="/">
            <Home className="h-4 w-4 sm:mr-2" />
            <span className="hidden sm:inline">Home</span>
          </Link>
        </Button>
        <Button variant="ghost" size="sm" asChild>
          <Link to="/pos/dashboard">
            <BarChart3 className="h-4 w-4 sm:mr-2" />
            <span className="hidden sm:inline">Dashboard</span>
          </Link>
        </Button>
        <Button variant="ghost" size="sm" asChild>
          <Link to="/pos/inventory">
            <Archive className="h-4 w-4 sm:mr-2" />
            <span className="hidden sm:inline">Inventory</span>
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <nav className="bg-background border-b">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" asChild>
            <Link to="/">
              <Home className="h-4 w-4 sm:mr-2" />
              <span>Home</span>
            </Link>
          </Button>
          <Button variant="ghost" size="sm" asChild>
            <Link to="/pos/dashboard">
              <BarChart3 className="h-4 w-4 sm:mr-2" />
              <span>Dashboard</span>
            </Link>
          </Button>
          <Button variant="ghost" size="sm" asChild>
            <Link to="/pos/inventory">
              <Archive className="h-4 w-4 sm:mr-2" />
              <span>Inventory</span>
            </Link>
          </Button>
        </div>
      </div>
    </nav>
  );
};

export default PosNavbar;
