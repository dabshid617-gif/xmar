import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { ShoppingBag, Twitter, Facebook, Instagram } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

const Footer = () => {
  const [profileLink, setProfileLink] = useState<string>("/auth");

  useEffect(() => {
    let isMounted = true;
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!isMounted) return;
      if (session?.user?.id) {
        setProfileLink(`/profile/${session.user.id}`);
      } else {
        setProfileLink("/auth");
      }
    });
    const { data } = supabase.auth.onAuthStateChange((_evt, session) => {
      if (session?.user?.id) {
        setProfileLink(`/profile/${session.user.id}`);
      } else {
        setProfileLink("/auth");
      }
    });
    return () => {
      isMounted = false;
      data.subscription.unsubscribe();
    };
  }, []);

  return (
    <footer className="bg-card/80 backdrop-blur supports-[backdrop-filter]:bg-card/60 border-t">
      <div className="h-1 bg-gradient-to-r from-primary to-secondary" />
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="flex flex-col items-start">
            <Link to="/" className="flex items-center gap-2 text-lg font-bold text-primary hover:opacity-80 transition-opacity">
              <ShoppingBag className="h-6 w-6" />
              <span className="hidden sm:inline-block">Marketplace</span>
            </Link>
            <p className="text-muted-foreground mt-4">The best place to buy and sell amazing products.</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-8">
            <div>
              <h3 className="font-semibold mb-4">Marketplace</h3>
              <ul>
                <li><Link to="/" className="text-muted-foreground hover:text-primary">Home</Link></li>
                <li><Link to="/products/new" className="text-muted-foreground hover:text-primary">Sell</Link></li>
                <li><Link to="/dashboard" className="text-muted-foreground hover:text-primary">Dashboard</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Account</h3>
              <ul>
                <li><Link to={profileLink} className="text-muted-foreground hover:text-primary">Profile</Link></li>
                <li><Link to="/conversations" className="text-muted-foreground hover:text-primary">Chat</Link></li>
                <li><Link to="/pos" className="text-muted-foreground hover:text-primary">Merchant</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Legal</h3>
              <ul>
                <li><Link to="/" className="text-muted-foreground hover:text-primary">Terms of Service</Link></li>
                <li><Link to="/" className="text-muted-foreground hover:text-primary">Privacy Policy</Link></li>
              </ul>
            </div>
          </div>
          <div className="flex flex-col items-start">
            <h3 className="font-semibold mb-4">Follow Us</h3>
            <div className="flex items-center gap-4">
              <Link to="/" className="text-muted-foreground hover:text-primary"><Twitter className="h-6 w-6" /></Link>
              <Link to="/" className="text-muted-foreground hover:text-primary"><Facebook className="h-6 w-6" /></Link>
              <Link to="/" className="text-muted-foreground hover:text-primary"><Instagram className="h-6 w-6" /></Link>
            </div>
          </div>
        </div>
        <div className="border-t mt-8 pt-8 flex items-center justify-between">
          <p className="text-muted-foreground">&copy; {new Date().getFullYear()} Marketplace. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
