import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Auth } from "@/components/Auth";
import { ProductUpload } from "@/components/ProductUpload";
import { ProductList } from "@/components/ProductList";
import { Button } from "@/components/ui/button";
import { Sparkles, LogOut } from "lucide-react";
import { toast } from "sonner";

const Index = () => {
  const [user, setUser] = useState<any>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  useEffect(() => {
    // Check current user
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    toast.success("Signed out successfully");
  };

  if (!user) {
    return <Auth />;
  }

  return (
    <div className="min-h-screen bg-gradient-subtle">
      {/* Header */}
      <header className="border-b border-border bg-card/80 backdrop-blur-sm sticky top-0 z-10 shadow-elegant">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-primary rounded-xl flex items-center justify-center shadow-glow">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold bg-gradient-primary bg-clip-text text-transparent">
                AI Product Analyzer
              </h1>
              <p className="text-xs text-muted-foreground">Powered by AI</p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleSignOut}
            className="hover:bg-destructive/10 hover:text-destructive"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Sign Out
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Upload Section */}
          <div className="lg:col-span-1">
            <ProductUpload onUploadComplete={() => setRefreshTrigger(prev => prev + 1)} />
          </div>

          {/* Products Grid */}
          <div className="lg:col-span-2">
            <h2 className="text-2xl font-bold mb-6 text-foreground">Your Products</h2>
            <ProductList refreshTrigger={refreshTrigger} />
          </div>
        </div>
      </main>
    </div>
  );
};

export default Index;
