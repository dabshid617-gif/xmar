import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Car,
  Home,
  Smartphone,
  Sofa,
  Shirt,
  Sparkles,
  Wrench,
  Hammer,
  Package,
  Palette,
  Baby,
  Utensils,
  Tractor,
} from "lucide-react";

type BusinessTypeKey =
  | "vehicle"
  | "real_estate"
  | "electronics"
  | "home_furniture"
  | "fashion"
  | "beauty_personal"
  | "services_repair"
  | "commercial_tools"
  | "art_sports"
  | "babies_kids"
  | "food"
  | "agriculture";

const BUSINESS_TYPES: Array<{
  key: BusinessTypeKey;
  label: string;
  description: string;
  icon: any;
  // keywords used to filter category names on product form
  keywords: string[];
}> = [
  { key: "vehicle", label: "Vehicle Sales & Services", description: "Cars, bikes, parts, and auto services.", icon: Car, keywords: ["vehicle", "car", "auto", "motor", "bike"] },
  { key: "real_estate", label: "Real Estate & Rentals", description: "Properties, land, rentals.", icon: Home, keywords: ["property", "real estate", "rental", "rent"] },
  { key: "electronics", label: "Electronics", description: "Phones, computers, gadgets.", icon: Smartphone, keywords: ["electronic", "phone", "mobile", "laptop", "computer", "gadget"] },
  { key: "home_furniture", label: "Home Furniture & Appliances", description: "Home & garden, appliances, furniture.", icon: Sofa, keywords: ["home", "furniture", "appliance", "kitchen", "garden"] },
  { key: "fashion", label: "Fashion", description: "Clothing, shoes, accessories.", icon: Shirt, keywords: ["fashion", "clothes", "apparel", "shoe", "wear"] },
  { key: "beauty_personal", label: "Beauty & Personal Care", description: "Cosmetics, hair, wellness.", icon: Sparkles, keywords: ["beauty", "personal", "care", "cosmetic", "salon", "spa"] },
  { key: "services_repair", label: "Services, Repair & Construction", description: "Skilled services, repairs, construction.", icon: Wrench, keywords: ["service", "repair", "construction", "builder", "maintenance"] },
  { key: "commercial_tools", label: "Commercial Equipment & Tools", description: "Business tools and equipment.", icon: Hammer, keywords: ["tool", "equipment", "industrial", "commercial"] },
  { key: "art_sports", label: "Art & Sports", description: "Art, crafts, sports gear.", icon: Palette, keywords: ["art", "sport", "craft", "hobby"] },
  { key: "babies_kids", label: "Babies & Kids", description: "Baby gear, kids items.", icon: Baby, keywords: ["baby", "kids", "child", "toy"] },
  { key: "food", label: "Food", description: "Food and beverages.", icon: Utensils, keywords: ["food", "beverage", "drink"] },
  { key: "agriculture", label: "Agriculture & Farming", description: "Farming tools, produce.", icon: Tractor, keywords: ["agriculture", "farm", "farming", "tractor", "livestock"] },
];

const BusinessType = () => {
  const navigate = useNavigate();
  const [selected, setSelected] = useState<BusinessTypeKey | null>(null);
  const [existing, setExisting] = useState<string | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem("businessType");
    if (saved) setExisting(saved);
  }, []);

  const handleContinue = () => {
    if (!selected && !existing) return;
    const key = (selected || existing) as string;
    const meta = BUSINESS_TYPES.find((b) => b.key === key as any);
    if (meta) {
      localStorage.setItem("businessType", meta.key);
      localStorage.setItem("businessTypeKeywords", JSON.stringify(meta.keywords));
    }
    navigate("/products/new/edit");
  };

  const handleClear = () => {
    localStorage.removeItem("businessType");
    localStorage.removeItem("businessTypeKeywords");
    setExisting(null);
    setSelected(null);
  };

  return (
    <>
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto">
            <div className="mb-6 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
              <h1 className="text-2xl md:text-3xl font-bold">Choose Your Business Type</h1>
              <div className="flex items-center gap-2">
                {existing && (
                  <Badge variant="secondary">Current: {BUSINESS_TYPES.find(b=>b.key===existing as any)?.label}</Badge>
                )}
                {existing && (
                  <Button variant="ghost" size="sm" onClick={handleClear}>Change</Button>
                )}
              </div>
            </div>

            <p className="text-muted-foreground mb-4">We’ll use this to tailor the product categories you see.</p>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {BUSINESS_TYPES.map((b) => {
                const Icon = b.icon;
                const isActive = selected === b.key;
                return (
                  <Card
                    key={b.key}
                    className={`cursor-pointer transition border ${isActive ? 'border-primary ring-2 ring-primary/20' : 'hover:border-primary/50'}`}
                    onClick={() => setSelected(b.key)}
                  >
                    <CardHeader className="pb-2">
                      <div className="flex items-center gap-2">
                        <Icon className="h-5 w-5 text-primary" />
                        <CardTitle className="text-base">{b.label}</CardTitle>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground">{b.description}</p>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            <div className="mt-6 flex gap-3">
              <Button size="lg" onClick={handleContinue} disabled={!selected && !existing}>
                Continue to Product Form
              </Button>
              <Button variant="outline" size="lg" onClick={() => navigate(-1)}>Cancel</Button>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
};

export default BusinessType;

