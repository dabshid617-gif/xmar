import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { printHtml, buildReceiptHtml } from "@/lib/print";
import {
  Car,
  Home,
  Smartphone,
  Sofa,
  Shirt,
  Sparkles,
  Wrench,
  Hammer,
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

const Settings = () => {
  const navigate = useNavigate();
  const [selected, setSelected] = useState<BusinessTypeKey | null>(null);
  const [currentKey, setCurrentKey] = useState<BusinessTypeKey | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [receiptForm, setReceiptForm] = useState({
    business_name: "",
    logo_url: "",
    address: "",
    phone: "",
    footer_note: "",
    show_order_number: true as boolean,
    theme: "light",
    accent_color: "#111827",
    include_tax: false as boolean,
  });

  // Location settings
  const [displayLocation, setDisplayLocation] = useState(false);
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [locationName, setLocationName] = useState<string>("");

  useEffect(() => {
    const saved = localStorage.getItem("businessType") as BusinessTypeKey | null;
    if (saved) {
      setCurrentKey(saved);
      setSelected(saved);
    }
    supabase.auth.getSession().then(({ data: { session } }) => {
      const uid = session?.user?.id || null;
      setUserId(uid);
      if (uid) {
        loadReceipt(uid);
        loadLocation(uid);
      }
    });
  }, []);

  const save = () => {
    if (!selected) return;
    const meta = BUSINESS_TYPES.find((b) => b.key === selected);
    if (!meta) return;
    localStorage.setItem("businessType", meta.key);
    localStorage.setItem("businessTypeKeywords", JSON.stringify(meta.keywords));
    setCurrentKey(meta.key);
    toast.success("Business type updated");
  };

  const reset = () => {
    localStorage.removeItem("businessType");
    localStorage.removeItem("businessTypeKeywords");
    setCurrentKey(null);
    setSelected(null);
    toast.success("Business type cleared");
  };

  const determineDistrict = (lat: number, lon: number): string => {
    // Example rule: Abdi Asiis
    if (lat >= 2.0370 && lat <= 2.0575 && lon >= 45.3280 && lon <= 45.3600) {
      return "abdi asiis";
    }
    return "Unknown";
  };

  const loadLocation = async (uid: string) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('display_location, latitude, longitude, location_name')
      .eq('id', uid)
      .maybeSingle();
    if (!error && data) {
      setDisplayLocation(!!data.display_location);
      setLatitude(data.latitude ?? null);
      setLongitude(data.longitude ?? null);
      setLocationName(data.location_name || "");
    }
  };

  const saveDisplayLocation = async (value: boolean) => {
    if (!userId) return;
    setDisplayLocation(value);
    const { error } = await supabase
      .from('profiles')
      .update({ display_location: value })
      .eq('id', userId);
    if (error) toast.error('Failed to update display location');
    else toast.success(value ? 'Location will be displayed' : 'Location will be hidden');
  };

  const useMyLocation = () => {
    if (!userId) return;
    if (!('geolocation' in navigator)) {
      toast.error('Geolocation is not supported in this browser');
      return;
    }
    navigator.geolocation.getCurrentPosition(async (pos) => {
      const lat = pos.coords.latitude;
      const lon = pos.coords.longitude;
      const district = determineDistrict(lat, lon);
      setLatitude(lat);
      setLongitude(lon);
      setLocationName(district);
      const { error } = await supabase
        .from('profiles')
        .update({ latitude: lat, longitude: lon, location_name: district, display_location: true })
        .eq('id', userId);
      if (error) {
        toast.error('Failed to save location');
      } else {
        setDisplayLocation(true);
        toast.success(`Location saved${district !== 'Unknown' ? ` as ${district}` : ''}`);
      }
    }, (err) => {
      if (err.code === err.PERMISSION_DENIED) {
        toast.error('Permission denied. Enable location access to set your store location.');
      } else {
        toast.error('Failed to get current location');
      }
    }, { enableHighAccuracy: true, timeout: 10000 });
  };

  const loadReceipt = async (uid: string) => {
    const { data } = await supabase
      .from('receipt_settings')
      .select('*')
      .eq('profile_id', uid)
      .maybeSingle();
    if (data) {
      setReceiptForm({
        business_name: data.business_name || '',
        logo_url: data.logo_url || '',
        address: data.address || '',
        phone: data.phone || '',
        footer_note: data.footer_note || '',
        show_order_number: data.show_order_number !== false,
        theme: data.theme || 'light',
        accent_color: data.accent_color || '#111827',
        include_tax: !!data.include_tax,
      });
    }
  };

  const saveReceipt = async () => {
    if (!userId) { toast.error('Not signed in'); return; }
    const payload = { profile_id: userId, ...receiptForm };
    const { error } = await supabase.from('receipt_settings').upsert(payload);
    if (error) { toast.error(error.message); return; }
    toast.success('Receipt settings saved');
  };

  const receiptPreview = (mode: 'order'|'no_order') => {
    const html = buildReceiptHtml(receiptForm, mode, { order_number: 'ORD-12345', created_at: new Date().toISOString(), cashier_name: 'Cashier', total: 99.99, items: [ { name: 'Sample Item', qty: 1, unit: 99.99, total: 99.99 } ] }, mode==='no_order'? { title: 'Quick Receipt', lines: ['Thank you!'], total: 99.99 }: undefined);
    printHtml(html);
  };

  return (
    <>
      <div className="min-h-screen bg-background">
        <Navbar />
      <div className="container mx-auto px-4 py-8">
          <h1 className="text-2xl md:text-3xl font-bold mb-6">Settings</h1>

          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle>Business Type</CardTitle>
                {currentKey && (
                  <Badge variant="secondary">
                    Current: {BUSINESS_TYPES.find((b) => b.key === currentKey)?.label}
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Choose the type of business you run. We’ll filter categories to match your selection when creating products.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {BUSINESS_TYPES.map((b) => {
                  const Icon = b.icon;
                  const active = selected === b.key;
                  return (
                    <Card
                      key={b.key}
                      onClick={() => setSelected(b.key)}
                      className={`cursor-pointer transition border ${active ? 'border-primary ring-2 ring-primary/20' : 'hover:border-primary/50'}`}
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

              <div className="mt-6 flex flex-wrap gap-3">
                <Button onClick={save} disabled={!selected}>Save Changes</Button>
                <Button variant="outline" onClick={() => navigate(-1)}>Back</Button>
                <Button variant="destructive" onClick={reset}>Clear</Button>
              </div>
            </CardContent>
          </Card>

          {/* Receipt Customization */}
          <Card className="mt-6">
            <CardHeader className="pb-3">
              <CardTitle>Receipt Customization</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <div>
                    <Label>Business Name</Label>
                    <Input value={receiptForm.business_name} onChange={(e)=>setReceiptForm({...receiptForm,business_name:e.target.value})} />
                  </div>
                  <div>
                    <Label>Logo URL</Label>
                    <Input value={receiptForm.logo_url} onChange={(e)=>setReceiptForm({...receiptForm,logo_url:e.target.value})} />
                  </div>
                  <div>
                    <Label>Address</Label>
                    <Input value={receiptForm.address} onChange={(e)=>setReceiptForm({...receiptForm,address:e.target.value})} />
                  </div>
                  <div>
                    <Label>Phone</Label>
                    <Input value={receiptForm.phone} onChange={(e)=>setReceiptForm({...receiptForm,phone:e.target.value})} />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label className="mr-2">Show Order Number</Label>
                    <Switch checked={receiptForm.show_order_number} onCheckedChange={(v)=>setReceiptForm({...receiptForm,show_order_number:v})} />
                  </div>
                </div>
                <div className="space-y-3">
                  <div>
                    <Label>Theme</Label>
                    <Select value={receiptForm.theme} onValueChange={(v)=>setReceiptForm({...receiptForm,theme:v})}>
                      <SelectTrigger><SelectValue placeholder="Theme" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="light">Light</SelectItem>
                        <SelectItem value="dark">Dark</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Accent Color</Label>
                    <Input type="color" value={receiptForm.accent_color} onChange={(e)=>setReceiptForm({...receiptForm,accent_color:e.target.value})} />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label className="mr-2">Include Tax</Label>
                    <Switch checked={receiptForm.include_tax} onCheckedChange={(v)=>setReceiptForm({...receiptForm,include_tax:v})} />
                  </div>
                  <div>
                    <Label>Footer Note</Label>
                    <Input value={receiptForm.footer_note} onChange={(e)=>setReceiptForm({...receiptForm,footer_note:e.target.value})} />
                  </div>
                </div>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                <Button onClick={saveReceipt}>Save Receipt Settings</Button>
                <Button variant="outline" onClick={()=>receiptPreview('order')}>Preview Order Receipt</Button>
                <Button variant="outline" onClick={()=>receiptPreview('no_order')}>Preview No-Order Receipt</Button>
              </div>
          </CardContent>
          </Card>

          {/* Store Location */}
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Store Location</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="mr-2">Display Location to Customers</Label>
                    <div className="text-xs text-muted-foreground">Show your district on your profile and product pages.</div>
                  </div>
                  <Switch checked={displayLocation} onCheckedChange={saveDisplayLocation} />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <Label>Latitude</Label>
                    <Input value={latitude ?? ''} readOnly placeholder="Not set" />
                  </div>
                  <div>
                    <Label>Longitude</Label>
                    <Input value={longitude ?? ''} readOnly placeholder="Not set" />
                  </div>
                  <div>
                    <Label>District</Label>
                    <Input value={locationName || ''} readOnly placeholder="Unknown" />
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button onClick={useMyLocation}>Use My Current Location</Button>
                  <Button variant="outline" onClick={() => window.open('https://support.google.com/chrome/answer/142065?hl=en', '_blank')}>Help: Enable Location</Button>
                </div>
                <div className="text-xs text-muted-foreground">
                  Example: If your coordinates fall between 2.0370°–2.0575° latitude and 45.3280°–45.3600° longitude, your district will be set to "abdi asiis".
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
      <Footer />
    </>
  );
};

export default Settings;
