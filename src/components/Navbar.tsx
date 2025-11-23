import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { ShoppingBag, User, MessageSquare, BarChart3, LogOut, Archive, Settings as SettingsIcon } from "lucide-react";
import ThemeToggle from "@/components/ThemeToggle";
import { toast } from "sonner";
import { useEffect, useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

const Navbar = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

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

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    toast.success("Signed out successfully");
    navigate("/");
  };

  const navLinks = (
    <>
      {user ? (
        <>
          {/** Archived: Sell and Sales Order removed from main nav */}
          <Button variant="ghost" size="sm" asChild>
            <Link to="/pos/inventory">
              <Archive className="h-4 w-4 sm:mr-2" />
              <span>Inventory</span>
            </Link>
          </Button>
          <Button variant="ghost" size="sm" asChild>
            <Link to={`/profile/${user.id}`}>
              <User className="h-4 w-4 sm:mr-2" />
              <span>Profile</span>
            </Link>
          </Button>
          <Button variant="ghost" size="sm" asChild>
            <Link to="/receipts">
              <MessageSquare className="h-4 w-4 sm:mr-2" />
              <span>Receipts</span>
            </Link>
          </Button>
          <Button variant="ghost" size="sm" asChild>
            <Link to="/settings">
              <SettingsIcon className="h-4 w-4 sm:mr-2" />
              <span>Settings</span>
            </Link>
          </Button>
          <Button variant="ghost" size="sm" asChild>
            <Link to="/conversations">
              <MessageSquare className="h-4 w-4 sm:mr-2" />
              <span>Chat</span>
            </Link>
          </Button>
          <Button variant="ghost" size="sm" asChild>
            <Link to="/dashboard">
              <BarChart3 className="h-4 w-4 sm:mr-2" />
              <span>Dashboard</span>
            </Link>
          </Button>
          {/** AI removed */}
          <Button variant="ghost" size="sm" asChild>
            <Link to="/pos">
              <ShoppingBag className="h-4 w-4 sm:mr-2" />
              <span>Merchant</span>
            </Link>
          </Button>
          <Button variant="destructive" size="sm" onClick={handleSignOut}>
            <LogOut className="h-4 w-4 sm:mr-2" />
            <span>Sign Out</span>
          </Button>
        </>
      ) : (
        <Button size="sm" asChild>
          <Link to="/auth">Sign In</Link>
        </Button>
      )}
    </>
  );

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/70 backdrop-blur-md border-b supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 text-lg font-bold text-primary hover:opacity-80 transition-opacity">
          <ShoppingBag className="h-6 w-6" />
          <span className="hidden sm:inline-block">Marketplace</span>
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden sm:flex items-center gap-2">
          {navLinks}
          <div className="h-6 w-px bg-border mx-2" />
          <ThemeToggle />
        </div>

        {/* Mobile Navigation */}
        <div className="sm:hidden">
          <Sheet onOpenChange={setIsMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon">
                <div className={`hamburger-menu ${isMenuOpen ? 'open' : ''}`}>
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-3/4 sm:w-1/2">
              <SheetHeader>
                <SheetTitle>Menu</SheetTitle>
              </SheetHeader>
              <div className="flex flex-col gap-4 py-4 animate-in fade-in-90 slide-in-from-left-8">
                {navLinks}
                <div className="pt-2 border-t">
                  <ThemeToggle />
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
